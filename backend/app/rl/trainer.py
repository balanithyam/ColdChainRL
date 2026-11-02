import numpy as np
from typing import Dict, Any, List
from app.rl.q_learning import StateEncoder, global_rl_agent
from app.simulation.spoilage import SpoilageKineticsModel
from app.simulation.energy import ThermodynamicEnergyModel
from app.simulation.risk import RiskIndexModel
from app.rl.reward import ColdChainRewardCalculator

class RLTrainingLabEngine:
    def __init__(self):
        self.is_training = False

    def run_training_experiment(
        self,
        episodes: int = 150,
        alpha: float = 0.1,
        gamma: float = 0.95,
        initial_epsilon: float = 0.25,
        min_epsilon: float = 0.01,
        decay_rate: float = 0.99,
        steps_per_episode: int = 60,
        product_name: str = "Dairy",
        safe_min: float = 2.0,
        safe_max: float = 6.0,
        optimum_temp: float = 4.0
    ) -> Dict[str, Any]:
        agent = global_rl_agent
        agent.alpha = alpha
        agent.gamma = gamma
        agent.epsilon = initial_epsilon
        agent.min_epsilon = min_epsilon
        agent.decay_rate = decay_rate
        
        metrics_history: List[Dict[str, Any]] = []
        reward_window: List[float] = []
        convergence_episode = episodes
        prev_q_table = np.copy(agent.q_table)
        
        for ep in range(1, episodes + 1):
            temp = float(np.random.uniform(safe_min - 1.0, safe_max + 3.0))
            humidity = float(np.random.uniform(55.0, 90.0))
            ambient_temp = float(np.random.uniform(22.0, 32.0))
            spoilage = 0.0
            cooling_level = 1
            prev_action = 1
            episode_total_reward = 0.0
            
            for step in range(steps_per_episode):
                risk = RiskIndexModel.calculate_risk(temp, safe_min, safe_max, spoilage, 0.0, ambient_temp, 100.0)
                state_idx, _, _ = StateEncoder.encode(temp, safe_min, safe_max, humidity, spoilage, risk)
                action_idx, _, _ = agent.select_action(state_idx, explore=True)
                
                if action_idx == 0:
                    cooling_level = max(0, cooling_level - 1)
                elif action_idx == 2:
                    cooling_level = min(3, cooling_level + 1)
                
                dist_kw = 0.0
                if np.random.rand() < 0.15:
                    dist_kw = float(np.random.uniform(1.0, 3.5))
                
                next_temp = ThermodynamicEnergyModel.simulate_temperature_step(
                    current_temp=temp,
                    ambient_temp=ambient_temp,
                    cooling_level=cooling_level,
                    cooling_capacity_pct=100.0,
                    thermal_mass=1.0,
                    dt_seconds=10.0,
                    disturbance_heat_kw=dist_kw
                )
                
                sp_delta = SpoilageKineticsModel.calculate_spoilage_delta(
                    current_temp=next_temp,
                    safe_min=safe_min,
                    safe_max=safe_max,
                    optimum_temp=optimum_temp,
                    humidity=humidity,
                    humidity_min=60.0,
                    humidity_max=85.0,
                    sensitivity=1.5 if product_name == "Dairy" else 1.0,
                    current_spoilage=spoilage,
                    dt_seconds=10.0
                )
                spoilage = min(100.0, spoilage + sp_delta)
                
                next_risk = RiskIndexModel.calculate_risk(next_temp, safe_min, safe_max, spoilage, next_temp - temp, ambient_temp, 100.0)
                next_state_idx, _, _ = StateEncoder.encode(next_temp, safe_min, safe_max, humidity, spoilage, next_risk)
                
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
                
                agent.update(state_idx, action_idx, reward, next_state_idx)
                episode_total_reward += reward
                temp = next_temp
                prev_action = action_idx
                
            agent.decay_epsilon()
            reward_window.append(episode_total_reward)
            if len(reward_window) > 15:
                reward_window.pop(0)
            moving_avg = float(np.mean(reward_window))
            
            q_delta = float(np.linalg.norm(agent.q_table - prev_q_table))
            prev_q_table = np.copy(agent.q_table)
            
            if q_delta < 0.05 and convergence_episode == episodes and ep > 30:
                convergence_episode = ep
                
            visited_count = np.count_nonzero(agent.visit_counts)
            total_pairs = agent.NUM_STATES * agent.NUM_ACTIONS
            coverage_pct = round((visited_count / total_pairs) * 100.0, 2)
            
            metrics_history.append({
                "episode": ep,
                "reward": round(episode_total_reward, 2),
                "moving_avg_reward": round(moving_avg, 2),
                "epsilon": round(float(agent.epsilon), 4),
                "q_convergence_delta": round(q_delta, 4),
                "state_action_coverage": coverage_pct
            })
            
        agent.save()
        
        learned_policy = []
        for t in range(5):
            for h in range(3):
                for s in range(4):
                    for r in range(3):
                        s_idx = t * 36 + h * 12 + s * 3 + r
                        q_row = agent.q_table[s_idx]
                        best_a = int(np.argmax(q_row))
                        visit_c = int(np.sum(agent.visit_counts[s_idx]))
                        
                        learned_policy.append({
                            "state_code": f"T{t}_H{h}_S{s}_R{r}",
                            "temp_zone": StateEncoder.TEMP_ZONES[t],
                            "humidity_zone": StateEncoder.HUMIDITY_ZONES[h],
                            "spoilage_zone": StateEncoder.SPOILAGE_ZONES[s],
                            "risk_zone": StateEncoder.RISK_ZONES[r],
                            "best_action": agent.ACTIONS[best_a],
                            "q_decrease": round(float(q_row[0]), 3),
                            "q_maintain": round(float(q_row[1]), 3),
                            "q_increase": round(float(q_row[2]), 3),
                            "visit_count": visit_c
                        })
                        
        return {
            "episodes": episodes,
            "alpha": alpha,
            "gamma": gamma,
            "initial_epsilon": initial_epsilon,
            "min_epsilon": min_epsilon,
            "decay_rate": decay_rate,
            "steps_per_episode": steps_per_episode,
            "final_avg_reward": round(float(np.mean(reward_window)), 2),
            "convergence_episode": convergence_episode,
            "metrics": metrics_history,
            "learned_policy": learned_policy
        }

training_lab_engine = RLTrainingLabEngine()
