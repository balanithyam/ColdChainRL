import asyncio
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import numpy as np
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.entities import ColdChainUnit, Incident, RLDecision
from app.simulation.spoilage import SpoilageKineticsModel
from app.simulation.energy import ThermodynamicEnergyModel
from app.simulation.risk import RiskIndexModel
from app.rl.q_learning import global_rl_agent, StateEncoder
from app.rl.reward import ColdChainRewardCalculator

class MultiUnitSimulationEngine:
    def __init__(self):
        self.is_running = False
        self.is_paused = False
        self.tick_interval_seconds = 1.0
        self.step_count = 0
        self.active_disturbances: Dict[str, Dict[str, Any]] = {}
        self.unit_histories: Dict[str, List[Dict[str, Any]]] = {}
        self.total_rl_interventions = 0
        self.connected_websockets = []
        self._task: Optional[asyncio.Task] = None

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.is_paused = False
            self._task = asyncio.create_task(self._simulation_loop())

    def pause(self):
        self.is_paused = True

    def resume(self):
        self.is_paused = False
        if not self.is_running:
            self.start()

    def set_speed(self, interval_seconds: float):
        self.tick_interval_seconds = max(0.5, min(10.0, float(interval_seconds)))

    def stop(self):
        self.is_running = False
        self.is_paused = False
        if self._task and not self._task.done():
            self._task.cancel()

    def reset(self, db: Session):
        self.step_count = 0
        self.active_disturbances.clear()
        self.unit_histories.clear()
        self.total_rl_interventions = 0
        
        units = db.query(ColdChainUnit).all()
        for u in units:
            u.current_temp = (u.safe_temp_min + u.safe_temp_max) / 2.0
            u.current_humidity = 70.0
            u.cooling_capacity = 100.0
            u.current_spoilage = 0.0
            u.current_energy = 0.0
            u.current_risk = 0.0
            u.cooling_level = 1
            u.status = "NORMAL"
        db.commit()

    def inject_disturbance(self, unit_id: str, disturbance_type: str, magnitude: float = 5.0, duration_steps: int = 8):
        if not self.is_running:
            self.start()
        self.active_disturbances[unit_id] = {
            "type": disturbance_type,
            "magnitude": magnitude,
            "remaining_steps": duration_steps,
            "heat_kw": 5.5 if disturbance_type in ["Temperature Spike", "Door Opening"] else (2.5 if disturbance_type == "Ambient Heat Increase" else 0.0),
            "humidity_delta": 25.0 if disturbance_type == "Humidity Increase" else 0.0,
            "capacity_penalty": 50.0 if disturbance_type == "Cooling Capacity Reduction" else 0.0
        }

    async def _simulation_loop(self):
        while self.is_running:
            if not self.is_paused:
                try:
                    await self._execute_tick()
                except Exception as e:
                    print(f"Simulation tick error: {e}")
            await asyncio.sleep(self.tick_interval_seconds)

    async def _execute_tick(self):
        self.step_count += 1
        db: Session = SessionLocal()
        try:
            units = db.query(ColdChainUnit).filter(ColdChainUnit.is_active == True).all()
            if not units:
                return

            telemetry_units = []
            now_iso = datetime.utcnow().isoformat()

            for unit in units:
                prod = unit.product_profile
                safe_min = unit.safe_temp_min
                safe_max = unit.safe_temp_max
                opt_temp = (safe_min + safe_max) / 2.0
                sensitivity = prod.spoilage_sensitivity if prod else 1.0

                dist_kw = 0.0
                dist_info = self.active_disturbances.get(unit.unit_id)
                current_dist_type = None

                if dist_info:
                    current_dist_type = dist_info["type"]
                    dist_kw = dist_info["heat_kw"]
                    if dist_info["humidity_delta"] > 0:
                        unit.current_humidity = min(98.0, unit.current_humidity + dist_info["humidity_delta"] * 0.2)
                    if dist_info["capacity_penalty"] > 0:
                        unit.cooling_capacity = max(20.0, 100.0 - dist_info["capacity_penalty"])

                    dist_info["remaining_steps"] -= 1
                    if dist_info["remaining_steps"] <= 0:
                        if dist_info["capacity_penalty"] > 0:
                            unit.cooling_capacity = 100.0
                        del self.active_disturbances[unit.unit_id]

                prev_temp = unit.current_temp
                risk = RiskIndexModel.calculate_risk(
                    current_temp=unit.current_temp,
                    safe_min=safe_min,
                    safe_max=safe_max,
                    spoilage=unit.current_spoilage,
                    temp_delta=0.0,
                    ambient_temp=unit.ambient_temp,
                    cooling_capacity=unit.cooling_capacity
                )
                unit.current_risk = risk

                state_idx, state_code, state_breakdown = StateEncoder.encode(
                    temp=unit.current_temp,
                    safe_min=safe_min,
                    safe_max=safe_max,
                    humidity=unit.current_humidity,
                    spoilage=unit.current_spoilage,
                    risk=unit.current_risk
                )

                action_idx, action_name, q_values_dict = global_rl_agent.select_action(state_idx, explore=False)
                prev_action = 1

                if action_idx == 0:
                    unit.cooling_level = max(0, unit.cooling_level - 1)
                    self.total_rl_interventions += 1
                elif action_idx == 2:
                    unit.cooling_level = min(3, unit.cooling_level + 1)
                    self.total_rl_interventions += 1

                energy_kwh = ThermodynamicEnergyModel.calculate_energy_consumption(unit.cooling_level, dt_seconds=10.0)
                unit.current_energy += energy_kwh

                next_temp = ThermodynamicEnergyModel.simulate_temperature_step(
                    current_temp=unit.current_temp,
                    ambient_temp=unit.ambient_temp,
                    cooling_level=unit.cooling_level,
                    cooling_capacity_pct=unit.cooling_capacity,
                    thermal_mass=prod.thermal_mass if prod else 1.0,
                    dt_seconds=10.0,
                    disturbance_heat_kw=dist_kw
                )
                unit.current_temp = next_temp
                unit.current_humidity = max(45.0, min(95.0, unit.current_humidity + float(np.random.uniform(-0.3, 0.3))))

                sp_delta = SpoilageKineticsModel.calculate_spoilage_delta(
                    current_temp=unit.current_temp,
                    safe_min=safe_min,
                    safe_max=safe_max,
                    optimum_temp=opt_temp,
                    humidity=unit.current_humidity,
                    humidity_min=prod.humidity_min if prod else 60.0,
                    humidity_max=prod.humidity_max if prod else 85.0,
                    sensitivity=sensitivity,
                    current_spoilage=unit.current_spoilage,
                    dt_seconds=10.0
                )
                unit.current_spoilage = min(100.0, unit.current_spoilage + sp_delta)

                reward, reward_breakdown = ColdChainRewardCalculator.calculate_reward(
                    temp=unit.current_temp,
                    safe_min=safe_min,
                    safe_max=safe_max,
                    optimum_temp=opt_temp,
                    spoilage_delta=sp_delta,
                    current_spoilage=unit.current_spoilage,
                    cooling_level=unit.cooling_level,
                    previous_action=prev_action,
                    current_action=action_idx
                )

                next_risk = RiskIndexModel.calculate_risk(
                    current_temp=unit.current_temp,
                    safe_min=safe_min,
                    safe_max=safe_max,
                    spoilage=unit.current_spoilage,
                    temp_delta=unit.current_temp - prev_temp,
                    ambient_temp=unit.ambient_temp,
                    cooling_capacity=unit.cooling_capacity
                )
                unit.current_risk = next_risk

                next_state_idx, next_state_code, _ = StateEncoder.encode(
                    temp=unit.current_temp,
                    safe_min=safe_min,
                    safe_max=safe_max,
                    humidity=unit.current_humidity,
                    spoilage=unit.current_spoilage,
                    risk=next_risk
                )

                global_rl_agent.update(state_idx, action_idx, reward, next_state_idx)

                # Dynamic Health Classification based on thermal safety bounds & active excursions
                if unit.current_temp > (safe_max + 1.8) or unit.current_temp < (safe_min - 2.5) or unit.current_risk > 70.0 or (current_dist_type is not None and dist_kw > 3.0):
                    unit.status = "CRITICAL"
                elif unit.current_temp > safe_max or unit.current_temp < safe_min or unit.current_risk > 40.0:
                    unit.status = "AT_RISK"
                else:
                    unit.status = "NORMAL"

                explanation = (
                    f"At T={unit.current_temp:.1f}C (Safe: {safe_min}-{safe_max}C) in state {state_code}, "
                    f"RL selected '{action_name}' [Q={q_values_dict[action_name.lower().replace(' ', '_')]}] "
                    f"to balance Safety ({reward_breakdown['temp_safety']}) and Energy ({reward_breakdown['energy_cost']})."
                )

                decision_record = RLDecision(
                    unit_id=unit.id,
                    step_index=self.step_count,
                    timestamp=datetime.utcnow(),
                    raw_state_json={
                        "temp": round(unit.current_temp, 2),
                        "humidity": round(unit.current_humidity, 1),
                        "spoilage": round(unit.current_spoilage, 3),
                        "risk": round(unit.current_risk, 1),
                        "cooling_level": unit.cooling_level
                    },
                    encoded_state=state_code,
                    action_taken=action_idx,
                    action_name=action_name,
                    q_values_json=q_values_dict,
                    reward=reward,
                    reward_breakdown_json=reward_breakdown,
                    explanation=explanation
                )
                db.add(decision_record)

                self._check_and_create_incident(db, unit, current_dist_type, action_name, prev_temp)

                if unit.unit_id not in self.unit_histories:
                    self.unit_histories[unit.unit_id] = []

                history_item = {
                    "time": datetime.utcnow().strftime("%H:%M:%S"),
                    "step": self.step_count,
                    "temperature": round(unit.current_temp, 2),
                    "humidity": round(unit.current_humidity, 1),
                    "spoilage": round(unit.current_spoilage, 3),
                    "energy": round(unit.current_energy, 3),
                    "risk": round(unit.current_risk, 1),
                    "cooling_level": unit.cooling_level,
                    "action_name": action_name,
                    "action_taken": action_idx - 1,
                    "reward": reward,
                    "disturbance": current_dist_type
                }
                self.unit_histories[unit.unit_id].append(history_item)
                if len(self.unit_histories[unit.unit_id]) > 60:
                    self.unit_histories[unit.unit_id].pop(0)

                telemetry_units.append({
                    "id": unit.id,
                    "unit_id": unit.unit_id,
                    "unit_type": unit.unit_type,
                    "product_name": prod.name if prod else "Standard",
                    "safe_temp_min": unit.safe_temp_min,
                    "safe_temp_max": unit.safe_temp_max,
                    "current_temp": round(unit.current_temp, 2),
                    "current_humidity": round(unit.current_humidity, 1),
                    "cooling_capacity": round(unit.cooling_capacity, 1),
                    "current_spoilage": round(unit.current_spoilage, 3),
                    "current_energy": round(unit.current_energy, 3),
                    "current_risk": round(unit.current_risk, 1),
                    "cooling_level": unit.cooling_level,
                    "status": unit.status,
                    "last_action": action_name,
                    "disturbance": current_dist_type,
                    "history": self.unit_histories[unit.unit_id]
                })

            try:
                db.commit()
            except Exception as e:
                print(f"Simulation tick DB commit error: {e}")
                db.rollback()

            active_count = len(units)
            at_risk_count = sum(1 for u in units if u.status == "AT_RISK")
            critical_count = sum(1 for u in units if u.status == "CRITICAL")
            avg_temp = float(np.mean([u.current_temp for u in units])) if units else 0.0
            avg_spoilage = float(np.mean([u.current_spoilage for u in units])) if units else 0.0
            total_energy = float(sum(u.current_energy for u in units)) if units else 0.0

            broadcast_payload = {
                "type": "TELEMETRY_UPDATE",
                "step": self.step_count,
                "timestamp": now_iso,
                "is_running": self.is_running,
                "is_paused": self.is_paused,
                "kpis": {
                    "active_units": active_count,
                    "at_risk_units": at_risk_count,
                    "critical_units": critical_count,
                    "avg_temp": round(avg_temp, 2),
                    "avg_spoilage": round(avg_spoilage, 3),
                    "total_energy": round(total_energy, 3),
                    "rl_interventions": self.total_rl_interventions
                },
                "units": telemetry_units
            }

            await self._broadcast(broadcast_payload)
        finally:
            db.close()

    def _check_and_create_incident(self, db: Session, unit: ColdChainUnit, dist_type: Optional[str], action_name: str, prev_temp: float):
        try:
            now = datetime.utcnow()
            inc_type = None
            severity = "Medium"
            desc = ""

            if dist_type:
                inc_type = dist_type
                severity = "High" if dist_type in ["Temperature Spike", "Door Opening"] else "Medium"
                desc = f"Injected disturbance '{dist_type}' triggered on {unit.unit_id}. RL immediately took '{action_name}'."
            elif unit.current_temp > (unit.safe_temp_max + 1.5):
                inc_type = "Critical High Temperature"
                severity = "Critical"
                desc = f"Temperature surged to {unit.current_temp:.1f}C (Safe limit: {unit.safe_temp_max}C). Severe spoilage hazard."
            elif unit.current_spoilage > 20.0 and unit.current_spoilage < 21.0:
                inc_type = "Rapid Spoilage Degradation"
                severity = "High"
                desc = f"Cumulative spoilage crossed 20% degradation threshold. Quality integrity compromised."
            elif unit.cooling_level == 3 and unit.current_temp > unit.safe_temp_max:
                inc_type = "Excessive Energy Demand"
                severity = "Medium"
                desc = f"Turbo cooling engaged continuously to counter thermal load on {unit.unit_id}."

            if inc_type:
                cutoff = now - timedelta(seconds=60)
                recent = db.query(Incident).filter(
                    Incident.unit_id == unit.id,
                    Incident.incident_type == inc_type,
                    (Incident.outcome == "Active") | (Incident.timestamp >= cutoff)
                ).first()

                if not recent:
                    inc_code = f"INC-{int(time.time()) % 100000:05d}-{uuid.uuid4().hex[:4].upper()}"
                    inc = Incident(
                        incident_id=inc_code,
                        unit_id=unit.id,
                        unit_name=unit.unit_id,
                        timestamp=now,
                        incident_type=inc_type,
                        severity=severity,
                        state_before_json={
                            "temp": round(prev_temp, 2),
                            "spoilage": round(unit.current_spoilage, 3),
                            "cooling_level": unit.cooling_level
                        },
                        rl_action_taken=action_name,
                        recovery_time_seconds=12.0,
                        outcome="Mitigated" if unit.status != "CRITICAL" else "Active",
                        description=desc
                    )
                    db.add(inc)
        except Exception as e:
            print(f"Incident creation notice: {e}")

    async def register_websocket(self, websocket):
        self.connected_websockets.append(websocket)

    async def unregister_websocket(self, websocket):
        if websocket in self.connected_websockets:
            self.connected_websockets.remove(websocket)

    async def _broadcast(self, payload: Dict[str, Any]):
        for ws in list(self.connected_websockets):
            try:
                await ws.send_json(payload)
            except Exception:
                if ws in self.connected_websockets:
                    self.connected_websockets.remove(ws)

sim_engine = MultiUnitSimulationEngine()
