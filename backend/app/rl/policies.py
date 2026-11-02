import numpy as np
from typing import Tuple, Dict
from app.rl.q_learning import global_rl_agent, StateEncoder

class FixedRulePolicy:
    @staticmethod
    def select_action(temp: float, safe_min: float, safe_max: float, current_level: int) -> Tuple[int, str]:
        if temp > (safe_max + 0.5):
            action_idx = 2
        elif temp < (safe_min - 0.5):
            action_idx = 0
        else:
            action_idx = 1
        action_names = ["Decrease Cooling", "Maintain Cooling", "Increase Cooling"]
        return action_idx, action_names[action_idx]

class RandomPolicy:
    @staticmethod
    def select_action() -> Tuple[int, str]:
        action_idx = int(np.random.randint(0, 3))
        action_names = ["Decrease Cooling", "Maintain Cooling", "Increase Cooling"]
        return action_idx, action_names[action_idx]

class QLearningPolicy:
    @staticmethod
    def select_action(
        temp: float,
        safe_min: float,
        safe_max: float,
        humidity: float,
        spoilage: float,
        risk: float,
        explore: bool = False
    ) -> Tuple[int, str, Dict[str, float], int, str]:
        state_idx, state_code, _ = StateEncoder.encode(temp, safe_min, safe_max, humidity, spoilage, risk)
        action_idx, action_name, q_vals = global_rl_agent.select_action(state_idx, explore=explore)
        return action_idx, action_name, q_vals, state_idx, state_code
