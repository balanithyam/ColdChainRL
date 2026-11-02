class RiskIndexModel:
    @staticmethod
    def calculate_risk(
        current_temp: float,
        safe_min: float,
        safe_max: float,
        spoilage: float,
        temp_delta: float,
        ambient_temp: float,
        cooling_capacity: float
    ) -> float:
        if current_temp > safe_max:
            temp_excess = current_temp - safe_max
            thermal_risk = min(100.0, (temp_excess / 5.0) * 100.0)
        elif current_temp < safe_min:
            temp_deficit = safe_min - current_temp
            thermal_risk = min(100.0, (temp_deficit / 3.0) * 100.0)
        else:
            thermal_risk = 0.0
            
        spoilage_risk = min(100.0, spoilage * 1.5)
        
        if temp_delta > 0:
            rate_risk = min(100.0, (temp_delta / 0.5) * 100.0)
        else:
            rate_risk = 0.0
            
        ambient_stress = max(0.0, (ambient_temp - 25.0) / 15.0) * 50.0
        capacity_deficit = max(0.0, (100.0 - cooling_capacity)) * 0.5
        equipment_risk = min(100.0, ambient_stress + capacity_deficit)
        
        total_risk = (
            0.40 * thermal_risk +
            0.35 * spoilage_risk +
            0.15 * rate_risk +
            0.10 * equipment_risk
        )
        return float(round(max(0.0, min(100.0, total_risk)), 1))
