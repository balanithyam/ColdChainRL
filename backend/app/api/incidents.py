from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.models.entities import Incident
from app.schemas.schemas import IncidentResponse
from app.api.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[IncidentResponse])
@router.get("/", response_model=List[IncidentResponse])
def get_incidents(
    unit_name: Optional[str] = None,
    severity: Optional[str] = None,
    outcome: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Incident)
    if unit_name:
        query = query.filter(Incident.unit_name == unit_name)
    if severity:
        query = query.filter(Incident.severity == severity)
    if outcome:
        query = query.filter(Incident.outcome == outcome)
        
    incidents = query.order_by(Incident.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": inc.id,
            "incident_id": inc.incident_id,
            "unit_id": inc.unit_id,
            "unit_name": inc.unit_name,
            "timestamp": inc.timestamp,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "state_before": inc.state_before_json,
            "rl_action_taken": inc.rl_action_taken,
            "recovery_time_seconds": inc.recovery_time_seconds,
            "outcome": inc.outcome,
            "description": inc.description
        }
        for inc in incidents
    ]

@router.get("/summary")
def get_incident_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)) -> Dict[str, Any]:
    incidents = db.query(Incident).all()
    total = len(incidents)
    severity_counts = {
        "Critical": sum(1 for i in incidents if i.severity == "Critical"),
        "High": sum(1 for i in incidents if i.severity == "High"),
        "Medium": sum(1 for i in incidents if i.severity == "Medium"),
        "Low": sum(1 for i in incidents if i.severity == "Low")
    }
    outcome_counts = {
        "Resolved": sum(1 for i in incidents if i.outcome == "Resolved"),
        "Mitigated": sum(1 for i in incidents if i.outcome == "Mitigated"),
        "Active": sum(1 for i in incidents if i.outcome == "Active")
    }
    recent = db.query(Incident).order_by(Incident.timestamp.desc()).limit(15).all()
    timeline = [
        {
            "id": inc.incident_id,
            "time": inc.timestamp.strftime("%H:%M:%S"),
            "severity": inc.severity,
            "type": inc.incident_type,
            "unit": inc.unit_name
        }
        for inc in reversed(recent)
    ]
    return {
        "total_incidents": total,
        "severity_breakdown": severity_counts,
        "outcome_breakdown": outcome_counts,
        "timeline": timeline
    }

@router.put("/{incident_id}/resolve")
def resolve_incident(incident_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    inc.outcome = "Resolved"
    db.commit()
    return {"message": f"Incident {incident_id} marked as Resolved."}
