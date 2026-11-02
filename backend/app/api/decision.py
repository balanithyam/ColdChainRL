from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.entities import ColdChainUnit, RLDecision
from app.schemas.schemas import RLDecisionResponse, QValuesBreakdown, RewardBreakdown
from app.rl.q_learning import global_rl_agent, StateEncoder
from app.rl.reward import ColdChainRewardCalculator
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/unit/{unit_id}", response_model=RLDecisionResponse)
def get_unit_decision(unit_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    unit = db.query(ColdChainUnit).filter(ColdChainUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
        
    prod = unit.product_profile
    safe_min = unit.safe_temp_min
    safe_max = unit.safe_temp_max
    opt_temp = (safe_min + safe_max) / 2.0
    
    state_idx, state_code, state_breakdown = StateEncoder.encode(
        temp=unit.current_temp,
        safe_min=safe_min,
        safe_max=safe_max,
        humidity=unit.current_humidity,
        spoilage=unit.current_spoilage,
        risk=unit.current_risk
    )
    
    action_idx, action_name, q_vals = global_rl_agent.select_action(state_idx, explore=False)
    
    reward, reward_breakdown = ColdChainRewardCalculator.calculate_reward(
        temp=unit.current_temp,
        safe_min=safe_min,
        safe_max=safe_max,
        optimum_temp=opt_temp,
        spoilage_delta=0.005,
        current_spoilage=unit.current_spoilage,
        cooling_level=unit.cooling_level,
        previous_action=1,
        current_action=action_idx
    )
    
    reasoning = []
    if unit.current_temp > safe_max:
        excess = unit.current_temp - safe_max
        reasoning.append(f"Temperature is {excess:.1f}C above safe threshold ({safe_max}C).")
        reasoning.append(f"High risk of rapid bacterial kinetics for {prod.name if prod else 'goods'}.")
        reasoning.append(f"Q-learning selected '{action_name}' to maximize long-term reward and suppress spoilage penalty.")
    elif unit.current_temp < safe_min:
        deficit = safe_min - unit.current_temp
        reasoning.append(f"Temperature is {deficit:.1f}C below safe minimum ({safe_min}C).")
        reasoning.append("Risk of chilling/freezing damage and unnecessary energy waste.")
        reasoning.append(f"Q-learning selected '{action_name}' to conserve energy and return to safe band.")
    else:
        reasoning.append(f"Temperature is well within safe zone ({safe_min}C - {safe_max}C).")
        reasoning.append(f"RL policy balances thermal stability (+{reward_breakdown['temp_safety']}) with compressor energy cost ({reward_breakdown['energy_cost']}).")
        reasoning.append(f"Action '{action_name}' minimizes wear and energy consumption.")
        
    explanation_text = " ".join(reasoning)

    return {
        "unit_id": unit.id,
        "unit_name": unit.unit_id,
        "product_name": prod.name if prod else "Standard Cargo",
        "step_index": 1,
        "timestamp": datetime.utcnow(),
        "current_state": {
            "temperature_celsius": round(unit.current_temp, 2),
            "safe_range": f"{safe_min}C - {safe_max}C",
            "humidity_percent": round(unit.current_humidity, 1),
            "spoilage_percent": round(unit.current_spoilage, 3),
            "energy_kwh": round(unit.current_energy, 3),
            "risk_score": round(unit.current_risk, 1),
            "cooling_level": unit.cooling_level,
            "status": unit.status,
            "zones": state_breakdown
        },
        "encoded_state": state_code,
        "available_actions": ["Decrease Cooling", "Maintain Cooling", "Increase Cooling"],
        "q_values": {
            "decrease_cooling": q_vals["decrease_cooling"],
            "maintain_cooling": q_vals["maintain_cooling"],
            "increase_cooling": q_vals["increase_cooling"]
        },
        "selected_action": action_name,
        "action_index": action_idx,
        "reward_components": {
            "temp_safety": reward_breakdown["temp_safety"],
            "spoilage_penalty": reward_breakdown["spoilage_penalty"],
            "energy_cost": reward_breakdown["energy_cost"],
            "stability_penalty": reward_breakdown["stability_penalty"],
            "total_reward": reward
        },
        "total_reward": reward,
        "q_equation": "Q(s, a) <- Q(s, a) + alpha * [r + gamma * max Q(s', a') - Q(s, a)]",
        "q_update_formula": f"Q({state_code}, {action_name}) updated with alpha={global_rl_agent.alpha}, gamma={global_rl_agent.gamma}",
        "explanation": explanation_text
    }
