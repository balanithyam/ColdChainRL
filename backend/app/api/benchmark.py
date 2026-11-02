from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import BenchmarkRequest, BenchmarkComparisonResponse
from app.benchmark.runner import StrategyBenchmarkRunner
from app.api.auth import get_current_user

router = APIRouter()

@router.post("/run", response_model=BenchmarkComparisonResponse)
def run_benchmark(req: BenchmarkRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    res = StrategyBenchmarkRunner.run_benchmark(
        product_name=req.product_profile_name,
        initial_temp=req.initial_temp,
        initial_humidity=req.initial_humidity,
        ambient_temp=req.ambient_temp,
        cooling_capacity=req.cooling_capacity,
        duration_steps=req.duration_steps,
        disturbance_intensity=req.disturbance_intensity,
        include_disturbances=req.include_disturbances,
        db=db
    )
    return res
