import numpy as np
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import ProductProfile
from app.rl.policies import FixedRulePolicy, RandomPolicy, QLearningPolicy
from app.simulation.spoilage import SpoilageKineticsModel
from app.simulation.energy import ThermodynamicEnergyModel
from app.simulation.risk import RiskIndexModel
from app.rl.reward import ColdChainRewardCalculator

class StrategyBenchmarkRunner:
    @staticmethod
    def run_benchmark(
        product_name: str = "Pasteurized Milk & Dairy",
        initial_temp: float = 3.0,
        initial_humidity: float = 75.0,
        ambient_temp: float = 30.0,
        cooling_capacity: float = 90.0,
        duration_steps: int = 150,
        disturbance_intensity: float = 1.5,
        include_disturbances: bool = True,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        prod = None
        if db:
            prod = db.query(ProductProfile).filter(ProductProfile.name == product_name).first()
            if not prod:
                # Fallback search by partial name
                prod = db.query(ProductProfile).filter(ProductProfile.name.ilike(f"%{product_name}%")).first()

        if prod:
            safe_min = prod.safe_temp_min
            safe_max = prod.safe_temp_max
            optimum_temp = prod.optimum_temp
            sensitivity = prod.spoilage_sensitivity
            thermal_mass = prod.thermal_mass
            humidity_min = prod.humidity_min
            humidity_max = prod.humidity_max
        elif "frozen" in product_name.lower() or "ice cream" in product_name.lower():
            safe_min, safe_max, optimum_temp = -22.0, -15.0, -18.0
            sensitivity, thermal_mass, humidity_min, humidity_max = 0.5, 1.5, 50.0, 70.0
        elif "produce" in product_name.lower() or "fruit" in product_name.lower():
            safe_min, safe_max, optimum_temp = 1.0, 4.0, 2.5
            sensitivity, thermal_mass, humidity_min, humidity_max = 0.9, 1.2, 85.0, 95.0
        else:
            safe_min, safe_max, optimum_temp = 2.0, 4.0, 3.0
            sensitivity, thermal_mass, humidity_min, humidity_max = 1.8, 1.1, 65.0, 80.0

        disturbances = [0.0] * duration_steps
        disturbance_events = []
        if include_disturbances:
            for i in range(30, min(42, duration_steps)):
                disturbances[i] = 3.2 * disturbance_intensity
            disturbance_events.append({"step": 30, "type": "Door Opening & Ambient Heat Spike"})
            
            for i in range(80, min(100, duration_steps)):
                disturbances[i] = 2.0 * disturbance_intensity
            disturbance_events.append({"step": 80, "type": "Ambient Heat Wave"})
            
            for i in range(120, min(135, duration_steps)):
                disturbances[i] = 2.5 * disturbance_intensity
            disturbance_events.append({"step": 120, "type": "Equipment Strain Spike"})

        strategies = ["Fixed Rule", "Random Policy", "Q-Learning"]
        results = []

        for strat in strategies:
            temp = float(initial_temp)
            humidity = float(initial_humidity)
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
            
            for step_idx in range(duration_steps):
                temp_delta = 0.0 if step_idx == 0 else (temp - step_records[-1]["temperature"])
                risk = RiskIndexModel.calculate_risk(temp, safe_min, safe_max, spoilage, temp_delta, ambient_temp, cooling_capacity)
                
                q_vals_dict = None
                if strat == "Fixed Rule":
                    action_idx, action_name = FixedRulePolicy.select_action(temp, safe_min, safe_max, cooling_level)
                elif strat == "Random Policy":
                    np.random.seed(42 + step_idx)
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
                
                dist_kw = disturbances[step_idx]
                dist_label = None
                if dist_kw > 0:
                    if 30 <= step_idx < 42:
                        dist_label = "Door Disturbance"
                    elif 80 <= step_idx < 100:
                        dist_label = "Ambient Heat Spike"
                    elif 120 <= step_idx < 135:
                        dist_label = "Cooling Reduction"
                
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
                    optimum_temp=optimum_temp,
                    humidity=humidity,
                    humidity_min=humidity_min,
                    humidity_max=humidity_max,
                    sensitivity=sensitivity,
                    current_spoilage=spoilage,
                    dt_seconds=10.0
                )
                spoilage = min(100.0, spoilage + sp_delta)
                
                reward, _ = ColdChainRewardCalculator.calculate_reward(
                    temp=next_temp,
                    safe_min=safe_min,
                    safe_max=safe_max,
                    optimum_temp=optimum_temp,
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
                    temp_dev = max(0.0, next_temp - safe_max) if next_temp > safe_max else max(0.0, safe_min - next_temp)
                    temp_deviations.append(temp_dev)
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
                
            results.append({
                "strategy": strat,
                "final_spoilage": round(float(spoilage), 3),
                "total_energy": round(float(accumulated_energy), 3),
                "avg_temp_deviation": round(float(np.mean(temp_deviations)), 3),
                "unsafe_duration_steps": int(unsafe_steps),
                "recovery_time_steps": int(recovery_steps_count),
                "intervention_count": int(interventions),
                "avg_reward": round(float(np.mean(rewards_list)), 2),
                "steps": step_records
            })

        rl_res = [r for r in results if r["strategy"] == "Q-Learning"][0]
        fix_res = [r for r in results if r["strategy"] == "Fixed Rule"][0]
        rnd_res = [r for r in results if r["strategy"] == "Random Policy"][0]
        
        analysis = (
            f"Under identical stress testing with {len(disturbance_events)} disturbance injections, "
            f"Adaptive Q-Learning achieved a final spoilage of {rl_res['final_spoilage']}% vs "
            f"{fix_res['final_spoilage']}% (Fixed Rule) and {rnd_res['final_spoilage']}% (Random Policy). "
            f"Energy consumption was {rl_res['total_energy']} kWh (Q-Learning) vs {fix_res['total_energy']} kWh (Fixed Rule). "
            f"Q-learning demonstrated an average reward of {rl_res['avg_reward']} by proactively adjusting cooling."
        )

        return {
            "scenario": {
                "product_name": product_name,
                "initial_temp": initial_temp,
                "initial_humidity": initial_humidity,
                "ambient_temp": ambient_temp,
                "cooling_capacity": cooling_capacity,
                "duration_steps": duration_steps,
                "disturbances": disturbance_events
            },
            "results": results,
            "summary_analysis": analysis
        }
