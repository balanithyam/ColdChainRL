from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import TrainingRun, ProductProfile
from app.schemas.schemas import TrainingConfig, TrainingRunResponse
from app.rl.trainer import training_lab_engine
from app.rl.q_learning import global_rl_agent, StateEncoder
from app.api.auth import get_current_user
import numpy as np

router = APIRouter()

@router.post("/train", response_model=TrainingRunResponse)
def train_agent(config: TrainingConfig, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    prod = db.query(ProductProfile).filter(ProductProfile.name == config.product_profile_name).first()
    safe_min = prod.safe_temp_min if prod else 2.0
    safe_max = prod.safe_temp_max if prod else 6.0
    opt_temp = prod.optimum_temp if prod else 4.0

    res = training_lab_engine.run_training_experiment(
        episodes=config.episodes,
        alpha=config.alpha,
        gamma=config.gamma,
        initial_epsilon=config.initial_epsilon,
        min_epsilon=config.min_epsilon,
        decay_rate=config.decay_rate,
        steps_per_episode=config.steps_per_episode,
        product_name=config.product_profile_name,
        safe_min=safe_min,
        safe_max=safe_max,
        optimum_temp=opt_temp
    )

    run_record = TrainingRun(
        episodes=res["episodes"],
        alpha=res["alpha"],
        gamma=res["gamma"],
        initial_epsilon=res["initial_epsilon"],
        min_epsilon=res["min_epsilon"],
        decay_rate=res["decay_rate"],
        steps_per_episode=res["steps_per_episode"],
        final_avg_reward=res["final_avg_reward"],
        convergence_episode=res["convergence_episode"],
        metrics_json=res["metrics"],
        learned_policy_json=res["learned_policy"]
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    res["id"] = run_record.id
    return res

@router.get("/current-policy")
def get_current_policy(current_user = Depends(get_current_user)):
    learned_policy = []
    agent = global_rl_agent
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
    return {"policy": learned_policy}

@router.post("/reset-qtable")
def reset_q_table(current_user = Depends(get_current_user)):
    global_rl_agent.q_table.fill(0.0)
    global_rl_agent.visit_counts.fill(0)
    global_rl_agent.seed_initial_knowledge()
    global_rl_agent.save()
    return {"message": "Q-Table successfully reset to baseline initialized knowledge."}
