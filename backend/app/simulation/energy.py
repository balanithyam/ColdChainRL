class ThermodynamicEnergyModel:
    POWER_LEVELS_KW = [0.2, 1.2, 2.5, 4.2]
    COOLING_CAPACITY_KW = [0.0, 3.0, 6.25, 10.5]
    
    @staticmethod
    def calculate_energy_consumption(cooling_level: int, dt_seconds: float = 10.0) -> float:
        level = max(0, min(cooling_level, len(ThermodynamicEnergyModel.POWER_LEVELS_KW) - 1))
        power_kw = ThermodynamicEnergyModel.POWER_LEVELS_KW[level]
        energy_kwh = (power_kw * dt_seconds) / 3600.0
        return float(energy_kwh)
        
    @staticmethod
    def simulate_temperature_step(
        current_temp: float,
        ambient_temp: float,
        cooling_level: int,
        cooling_capacity_pct: float = 100.0,
        thermal_mass: float = 1.0,
        dt_seconds: float = 10.0,
        disturbance_heat_kw: float = 0.0
    ) -> float:
        UA = 0.08 / thermal_mass
        C_thermal = 35.0 * thermal_mass
        
        Q_ambient = UA * (ambient_temp - current_temp)
        level = max(0, min(cooling_level, len(ThermodynamicEnergyModel.COOLING_CAPACITY_KW) - 1))
        raw_cooling_kw = ThermodynamicEnergyModel.COOLING_CAPACITY_KW[level]
        effective_cooling_kw = raw_cooling_kw * (cooling_capacity_pct / 100.0)
        
        Q_net = Q_ambient - effective_cooling_kw + disturbance_heat_kw
        dT = (Q_net * dt_seconds) / C_thermal
        next_temp = current_temp + dT
        return float(round(next_temp, 3))
