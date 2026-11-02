import numpy as np
import os
from typing import Dict, Tuple

class StateEncoder:
    TEMP_ZONES = ["VERY_COLD", "CHILLED", "OPTIMAL", "WARM", "CRITICAL_HOT"]
    HUMIDITY_ZONES = ["LOW", "NORMAL", "HIGH"]
    SPOILAGE_ZONES = ["FRESH", "LOW_SPOILAGE", "MODERATE_SPOILAGE", "CRITICAL_SPOILAGE"]
    RISK_ZONES = ["LOW_RISK", "MODERATE_RISK", "HIGH_RISK"]
    
    @classmethod
    def get_temp_zone_idx(cls, temp: float, safe_min: float, safe_max: float) -> int:
        if temp < (safe_min - 1.5): return 0
        elif temp < safe_min: return 1
        elif temp <= safe_max: return 2
        elif temp <= (safe_max + 2.0): return 3
        else: return 4
            
    @classmethod
    def get_humidity_zone_idx(cls, humidity: float, h_min: float = 60.0, h_max: float = 85.0) -> int:
        if humidity < h_min: return 0
        elif humidity <= h_max: return 1
        else: return 2
            
    @classmethod
    def get_spoilage_zone_idx(cls, spoilage: float) -> int:
        if spoilage < 5.0: return 0
        elif spoilage < 15.0: return 1
        elif spoilage < 35.0: return 2
        else: return 3
            
    @classmethod
    def get_risk_zone_idx(cls, risk: float) -> int:
        if risk < 30.0: return 0
        elif risk < 60.0: return 1
        else: return 2

    @classmethod
    def encode(cls, temp: float, safe_min: float, safe_max: float, humidity: float, spoilage: float, risk: float) -> Tuple[int, str, Dict[str, str]]:
        t_idx = cls.get_temp_zone_idx(temp, safe_min, safe_max)
        h_idx = cls.get_humidity_zone_idx(humidity)
        s_idx = cls.get_spoilage_zone_idx(spoilage)
        r_idx = cls.get_risk_zone_idx(risk)
        state_idx = t_idx * 36 + h_idx * 12 + s_idx * 3 + r_idx
        state_code = f"T{t_idx}_H{h_idx}_S{s_idx}_R{r_idx}"
        state_breakdown = {
            "temperature_zone": cls.TEMP_ZONES[t_idx],
            "humidity_zone": cls.HUMIDITY_ZONES[h_idx],
            "spoilage_zone": cls.SPOILAGE_ZONES[s_idx],
            "risk_zone": cls.RISK_ZONES[r_idx]
        }
        return state_idx, state_code, state_breakdown

class QLearningAgent:
    ACTIONS = ["Decrease Cooling", "Maintain Cooling", "Increase Cooling"]
    NUM_STATES = 180
    NUM_ACTIONS = 3
    
    def __init__(
        self,
        alpha: float = 0.12,
        gamma: float = 0.95,
        epsilon: float = 0.15,
        min_epsilon: float = 0.01,
        decay_rate: float = 0.995,
        save_path: str = "backend/app/rl/q_table.npy"
    ):
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.min_epsilon = min_epsilon
        self.decay_rate = decay_rate
        self.save_path = save_path
        self.q_table = np.zeros((self.NUM_STATES, self.NUM_ACTIONS), dtype=np.float64)
        self.visit_counts = np.zeros((self.NUM_STATES, self.NUM_ACTIONS), dtype=np.int32)
        self.load()
        if np.all(self.q_table == 0):
            self.seed_initial_knowledge()
            
    def seed_initial_knowledge(self):
        for t in range(5):
            for h in range(3):
                for s in range(4):
                    for r in range(3):
                        s_idx = t * 36 + h * 12 + s * 3 + r
                        if t in [3, 4]:
                            self.q_table[s_idx, 2] = 4.0 + (t * 2.0)
                            self.q_table[s_idx, 1] = 1.0
                            self.q_table[s_idx, 0] = -5.0
                        elif t in [0, 1]:
                            self.q_table[s_idx, 0] = 4.0
                            self.q_table[s_idx, 1] = 2.0
                            self.q_table[s_idx, 2] = -4.0
                        else:
                            self.q_table[s_idx, 1] = 5.0
                            self.q_table[s_idx, 0] = 2.0
                            self.q_table[s_idx, 2] = 2.0

    def select_action(self, state_idx: int, explore: bool = True) -> Tuple[int, str, Dict[str, float]]:
        q_vals = self.q_table[state_idx]
        q_dict = {
            "decrease_cooling": round(float(q_vals[0]), 4),
            "maintain_cooling": round(float(q_vals[1]), 4),
            "increase_cooling": round(float(q_vals[2]), 4)
        }
        if explore and np.random.rand() < self.epsilon:
            action_idx = int(np.random.randint(0, self.NUM_ACTIONS))
        else:
            max_q = np.max(q_vals)
            best_actions = np.where(q_vals == max_q)[0]
            action_idx = int(np.random.choice(best_actions))
        return action_idx, self.ACTIONS[action_idx], q_dict

    def update(self, state_idx: int, action_idx: int, reward: float, next_state_idx: int) -> float:
        current_q = self.q_table[state_idx, action_idx]
        max_future_q = np.max(self.q_table[next_state_idx])
        td_target = reward + self.gamma * max_future_q
        td_error = td_target - current_q
        self.q_table[state_idx, action_idx] += self.alpha * td_error
        self.visit_counts[state_idx, action_idx] += 1
        return float(abs(td_error))

    def decay_epsilon(self):
        self.epsilon = max(self.min_epsilon, self.epsilon * self.decay_rate)

    def save(self):
        try:
            os.makedirs(os.path.dirname(self.save_path), exist_ok=True)
            np.save(self.save_path, self.q_table)
        except Exception:
            pass

    def load(self):
        if os.path.exists(self.save_path):
            try:
                self.q_table = np.load(self.save_path)
            except Exception:
                pass

global_rl_agent = QLearningAgent()
