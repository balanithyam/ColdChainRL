from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.entities import SimulationRun, ProductProfile
from app.schemas.schemas import (
    SimulationConfig,
    DisturbanceInjection,
    SimulationRunResponse,
    SimulationStepResponse
)
from app.simulation.engine import sim_engine
from app.simulation.spoilage import SpoilageKineticsModel
from app.simulation.energy import ThermodynamicEnergyModel
from app.simulation.risk import RiskIndexModel
from app.rl.policies import FixedRulePolicy, RandomPolicy, QLearningPolicy
from app.rl.reward import ColdChainRewardCalculator
from app.api.auth import get_current_user

router = APIRouter()

@router.post("/control/start")
async def start_simulation(current_user = Depends(get_current_user)):
    sim_engine.start()
    return {"status": "started", "is_running": sim_engine.is_running, "is_paused": sim_engine.is_paused}

@router.post("/control/pause")
async def pause_simulation(current_user = Depends(get_current_user)):
    sim_engine.pause()
    return {"status": "paused", "is_running": sim_engine.is_running, "is_paused": sim_engine.is_paused}

@router.post("/control/resume")
async def resume_simulation(current_user = Depends(get_current_user)):
    sim_engine.resume()
    return {"status": "resumed", "is_running": sim_engine.is_running, "is_paused": sim_engine.is_paused}

@router.post("/control/stop")
async def stop_simulation(current_user = Depends(get_current_user)):
    sim_engine.stop()
    return {"status": "stopped", "is_running": sim_engine.is_running, "is_paused": sim_engine.is_paused}

@router.post("/control/reset")
async def reset_simulation(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    sim_engine.reset(db)
    return {"status": "reset", "is_running": sim_engine.is_running, "is_paused": sim_engine.is_paused}

@router.post("/control/speed")
async def set_speed(speed: float = 1.0, current_user = Depends(get_current_user)):
    sim_engine.set_speed(speed)
    return {"status": "speed_updated", "tick_interval_seconds": sim_engine.tick_interval_seconds}

@router.post("/disturbance/inject")
async def inject_disturbance(dist_in: DisturbanceInjection, current_user = Depends(get_current_user)):
    target_unit = dist_in.unit_id or "WH-01"
    sim_engine.inject_disturbance(
        unit_id=target_unit,
        disturbance_type=dist_in.disturbance_type,
        magnitude=dist_in.magnitude,
        duration_steps=dist_in.duration_steps
    )
    return {
        "message": f"Injected {dist_in.disturbance_type} into {target_unit} for {dist_in.duration_steps} steps.",
        "unit_id": target_unit,
        "disturbance": dist_in.disturbance_type
    }

@router.post("/run-custom", response_model=SimulationRunResponse)
def run_custom_simulation(config: SimulationConfig, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    prod = db.query(ProductProfile).filter(ProductProfile.name == config.product_profile_name).first()
    if not prod:
        prod = db.query(ProductProfile).filter(ProductProfile.name.ilike(f"%{config.product_profile_name}%")).first()

    if not prod:
        safe_min, safe_max, opt_temp, sensitivity = 2.0, 6.0, 4.0, 1.5
        thermal_mass, hum_min, hum_max = 1.0, 60.0, 85.0
    else:
        safe_min, safe_max, opt_temp, sensitivity = prod.safe_temp_min, prod.safe_temp_max, prod.optimum_temp, prod.spoilage_sensitivity
        thermal_mass, hum_min, hum_max = prod.thermal_mass, prod.humidity_min, prod.humidity_max

    temp = float(config.initial_temp)
    humidity = float(config.initial_humidity)
    ambient_temp = float(config.ambient_temp)
    cooling_capacity = float(config.cooling_capacity)
    spoilage = 0.0
    accumulated_energy = 0.0
    cooling_level = 1
    prev_action = 1
    
    unsafe_steps = 0
    interventions = 0
    rewards_list = []
    temp_deviations = []
    recovery_steps_count = 0
    is_recovering = False
    step_records = []
    
    for step_idx in range(config.duration_steps):
        dist_kw = 0.0
        dist_label = None
        if config.disturbance_intensity > 0:
            spike_1_start = int(config.duration_steps * 0.25)
            spike_2_start = int(config.duration_steps * 0.65)
            if spike_1_start <= step_idx < (spike_1_start + 8):
                dist_kw = 4.0 * config.disturbance_intensity
                dist_label = "Temperature Spike / Door Opening"
            elif spike_2_start <= step_idx < (spike_2_start + 12):
                dist_kw = 2.5 * config.disturbance_intensity
                dist_label = "Ambient Heat Increase"
                
        temp_delta = 0.0 if step_idx == 0 else (temp - step_records[-1]["temperature"])
        risk = RiskIndexModel.calculate_risk(temp, safe_min, safe_max, spoilage, temp_delta, ambient_temp, cooling_capacity)
        
        q_vals_dict = None
        if config.strategy in ["Fixed Rule", "Fixed Cooling Rule"]:
            action_idx, action_name = FixedRulePolicy.select_action(temp, safe_min, safe_max, cooling_level)
        elif config.strategy in ["Random Policy", "Random"]:
            action_idx, action_name = RandomPolicy.select_action()
        else:
            action_idx, action_name, q_vals_dict, _, _ = QLearningPolicy.select_action(
                temp, safe_min, safe_max, humidity, spoilage, risk, explore=False
            )
            
        if action_idx != 1:
            interventions += 1
            
        if action_idx == 0:
            cooling_level = max(0, cooling_level - 1)
        elif action_idx == 2:
            cooling_level = min(3, cooling_level + 1)
            
        energy_kwh = ThermodynamicEnergyModel.calculate_energy_consumption(cooling_level, dt_seconds=10.0)
        accumulated_energy += energy_kwh
        
        next_temp = ThermodynamicEnergyModel.simulate_temperature_step(
            current_temp=temp,
            ambient_temp=ambient_temp,
            cooling_level=cooling_level,
            cooling_capacity_pct=cooling_capacity,
            thermal_mass=thermal_mass,
            dt_seconds=10.0,
            disturbance_heat_kw=dist_kw
        )
        
        sp_delta = SpoilageKineticsModel.calculate_spoilage_delta(
            current_temp=next_temp,
            safe_min=safe_min,
            safe_max=safe_max,
            optimum_temp=opt_temp,
            humidity=humidity,
            humidity_min=hum_min,
            humidity_max=hum_max,
            sensitivity=sensitivity,
            current_spoilage=spoilage,
            dt_seconds=10.0
        )
        spoilage = min(100.0, spoilage + sp_delta)
        
        reward, _ = ColdChainRewardCalculator.calculate_reward(
            temp=next_temp,
            safe_min=safe_min,
            safe_max=safe_max,
            optimum_temp=opt_temp,
            spoilage_delta=sp_delta,
            current_spoilage=spoilage,
            cooling_level=cooling_level,
            previous_action=prev_action,
            current_action=action_idx
        )
        rewards_list.append(reward)
        
        if next_temp > safe_max or next_temp < safe_min:
            unsafe_steps += 1
            is_recovering = True
            dev = max(0.0, next_temp - safe_max) if next_temp > safe_max else max(0.0, safe_min - next_temp)
            temp_deviations.append(dev)
        else:
            temp_deviations.append(0.0)
            if is_recovering:
                is_recovering = False
                
        if is_recovering:
            recovery_steps_count += 1
            
        step_records.append({
            "step_index": step_idx,
            "timestamp": f"+{step_idx * 10}s",
            "temperature": round(float(next_temp), 2),
            "humidity": round(float(humidity), 1),
            "ambient_temp": round(float(ambient_temp), 1),
            "cooling_level": cooling_level,
            "action_taken": action_idx - 1,
            "action_name": action_name,
            "reward": round(float(reward), 2),
            "spoilage": round(float(spoilage), 3),
            "energy": round(float(accumulated_energy), 3),
            "risk": round(float(risk), 1),
            "disturbance_type": dist_label,
            "q_values": q_vals_dict
        })
        
        temp = next_temp
        prev_action = action_idx
        
    run_code = f"SIM-{int(datetime.utcnow().timestamp())}-{uuid.uuid4().hex[:6]}"
    sim_id = None
    try:
        sim_run = SimulationRun(
            run_code=run_code,
            name=f"{config.strategy} on {config.product_profile_name}",
            strategy=config.strategy,
            product_profile_name=config.product_profile_name,
            initial_temp=config.initial_temp,
            initial_humidity=config.initial_humidity,
            ambient_temp=config.ambient_temp,
            cooling_capacity=config.cooling_capacity,
            disturbance_intensity=config.disturbance_intensity,
            duration_steps=config.duration_steps,
            final_spoilage=round(float(spoilage), 3),
            total_energy=round(float(accumulated_energy), 3),
            avg_temp_deviation=round(float(sum(temp_deviations) / len(temp_deviations)), 3),
            unsafe_duration_steps=unsafe_steps,
            recovery_time_steps=recovery_steps_count,
            intervention_count=interventions,
            avg_reward=round(float(sum(rewards_list) / len(rewards_list)), 2)
        )
        db.add(sim_run)
        db.commit()
        db.refresh(sim_run)
        sim_id = sim_run.id
    except Exception as e:
        db.rollback()
        print(f"Warning: could not save simulation run to database: {e}")
    
    return {
        "id": sim_id or 1,
        "run_code": run_code,
        "name": f"{config.strategy} on {config.product_profile_name}",
        "strategy": config.strategy,
        "product_profile_name": config.product_profile_name,
        "duration_steps": config.duration_steps,
        "final_spoilage": round(float(spoilage), 3),
        "total_energy": round(float(accumulated_energy), 3),
        "avg_temp_deviation": round(float(sum(temp_deviations) / len(temp_deviations)), 3),
        "unsafe_duration_steps": unsafe_steps,
        "recovery_time_steps": recovery_steps_count,
        "intervention_count": interventions,
        "avg_reward": round(float(sum(rewards_list) / len(rewards_list)), 2),
        "steps": step_records
    }
