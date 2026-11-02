from typing import Dict, Tuple

class ColdChainRewardCalculator:
    @staticmethod
    def calculate_reward(
        temp: float,
        safe_min: float,
        safe_max: float,
        optimum_temp: float,
        spoilage_delta: float,
        current_spoilage: float,
        cooling_level: int,
        previous_action: int,
        current_action: int
    ) -> Tuple[float, Dict[str, float]]:
        if safe_min <= temp <= safe_max:
            dist_opt = abs(temp - optimum_temp)
            r_safety = 5.0 - (dist_opt / max(1.0, (safe_max - safe_min))) * 1.5
        elif temp > safe_max:
            excess = temp - safe_max
            r_safety = -2.0 * (excess ** 1.8) - 3.0
        else:
            deficit = safe_min - temp
            r_safety = -1.5 * (deficit ** 1.5) - 2.0
            
        r_spoilage = -(spoilage_delta * 40.0) - (0.05 * (current_spoilage ** 1.2))
        energy_penalties = [0.0, -0.4, -1.0, -2.0]
        level = max(0, min(cooling_level, len(energy_penalties) - 1))
        r_energy = energy_penalties[level]
        
        if previous_action is not None and abs(current_action - previous_action) == 2:
            r_stability = -0.8
        elif previous_action is not None and current_action != previous_action:
            r_stability = -0.2
        else:
            r_stability = 0.2
            
        total_reward = r_safety + r_spoilage + r_energy + r_stability
        breakdown = {
            "temp_safety": round(float(r_safety), 3),
            "spoilage_penalty": round(float(r_spoilage), 3),
            "energy_cost": round(float(r_energy), 3),
            "stability_penalty": round(float(r_stability), 3),
            "total_reward": round(float(total_reward), 3)
        }
        return round(float(total_reward), 3), breakdown
