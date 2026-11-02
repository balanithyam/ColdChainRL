import math

class SpoilageKineticsModel:
    @staticmethod
    def calculate_spoilage_delta(
        current_temp: float,
        safe_min: float,
        safe_max: float,
        optimum_temp: float,
        humidity: float,
        humidity_min: float,
        humidity_max: float,
        sensitivity: float,
        current_spoilage: float,
        dt_seconds: float = 10.0
    ) -> float:
        # Baseline rate under optimal conditions: ~0.15% per hour (10-14 days fresh shelf life)
        base_rate_per_sec = (0.0015 / 3600.0) * sensitivity
        
        if current_temp > safe_max:
            temp_excess = current_temp - safe_max
            # Exponential Arrhenius acceleration when breaching safe thermal ceiling
            thermal_factor = 1.0 + math.pow(2.8, temp_excess / 2.2) * 8.0
        elif current_temp < safe_min:
            chill_excess = safe_min - current_temp
            thermal_factor = 1.0 + (chill_excess * 1.5)
        else:
            dev = abs(current_temp - optimum_temp)
            thermal_factor = 0.2 + 0.3 * (dev / max(1.0, (safe_max - safe_min)))
        
        humidity_factor = 1.0
        if humidity > humidity_max:
            humidity_excess = (humidity - humidity_max) / 10.0
            humidity_factor = 1.0 + (humidity_excess * 0.5)
        elif humidity < humidity_min:
            humidity_deficit = (humidity_min - humidity) / 10.0
            humidity_factor = 1.0 + (humidity_deficit * 0.3)
            
        autocatalytic_factor = 1.0 + (current_spoilage / 50.0) ** 1.2
        rate = base_rate_per_sec * thermal_factor * humidity_factor * autocatalytic_factor
        delta = rate * dt_seconds * 100.0
        return max(0.0, float(delta))
