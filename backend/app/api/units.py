from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.entities import ColdChainUnit, ProductProfile
from app.schemas.schemas import (
    UnitCreate,
    UnitUpdate,
    UnitResponse,
    ProductProfileResponse,
    ProductProfileBase
)
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/products", response_model=List[ProductProfileResponse])
def get_products(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(ProductProfile).all()

@router.post("/products", response_model=ProductProfileResponse)
def create_product(product_in: ProductProfileBase, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    existing = db.query(ProductProfile).filter(ProductProfile.name == product_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product profile with this name already exists.")
    prod = ProductProfile(**product_in.dict())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod

@router.get("", response_model=List[UnitResponse])
@router.get("/", response_model=List[UnitResponse])
def get_units(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    units = db.query(ColdChainUnit).all()
    res = []
    for u in units:
        u_dict = {
            "id": u.id,
            "unit_id": u.unit_id,
            "unit_type": u.unit_type,
            "product_profile_id": u.product_profile_id,
            "product_name": u.product_profile.name if u.product_profile else "None",
            "safe_temp_min": u.safe_temp_min,
            "safe_temp_max": u.safe_temp_max,
            "current_temp": round(u.current_temp, 2),
            "current_humidity": round(u.current_humidity, 1),
            "cooling_capacity": round(u.cooling_capacity, 1),
            "current_spoilage": round(u.current_spoilage, 3),
            "current_energy": round(u.current_energy, 3),
            "current_risk": round(u.current_risk, 1),
            "cooling_level": u.cooling_level,
            "ambient_temp": round(u.ambient_temp, 1),
            "ambient_humidity": round(u.ambient_humidity, 1),
            "is_active": u.is_active,
            "status": u.status,
            "last_action": "Maintain Cooling"
        }
        res.append(u_dict)
    return res

@router.get("/{unit_id}", response_model=UnitResponse)
def get_unit(unit_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    u = db.query(ColdChainUnit).filter(ColdChainUnit.id == unit_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Unit not found.")
    return {
        "id": u.id,
        "unit_id": u.unit_id,
        "unit_type": u.unit_type,
        "product_profile_id": u.product_profile_id,
        "product_name": u.product_profile.name if u.product_profile else "None",
        "safe_temp_min": u.safe_temp_min,
        "safe_temp_max": u.safe_temp_max,
        "current_temp": round(u.current_temp, 2),
        "current_humidity": round(u.current_humidity, 1),
        "cooling_capacity": round(u.cooling_capacity, 1),
        "current_spoilage": round(u.current_spoilage, 3),
        "current_energy": round(u.current_energy, 3),
        "current_risk": round(u.current_risk, 1),
        "cooling_level": u.cooling_level,
        "ambient_temp": round(u.ambient_temp, 1),
        "ambient_humidity": round(u.ambient_humidity, 1),
        "is_active": u.is_active,
        "status": u.status,
        "last_action": "Maintain Cooling"
    }

@router.post("", response_model=UnitResponse)
@router.post("/", response_model=UnitResponse)
def create_unit(unit_in: UnitCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    existing = db.query(ColdChainUnit).filter(ColdChainUnit.unit_id == unit_in.unit_id.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Unit ID already exists.")
        
    prod = db.query(ProductProfile).filter(ProductProfile.id == unit_in.product_profile_id).first()
    if not prod:
        raise HTTPException(status_code=400, detail="Invalid product profile ID.")
        
    unit = ColdChainUnit(
        unit_id=unit_in.unit_id.upper(),
        unit_type=unit_in.unit_type,
        product_profile_id=unit_in.product_profile_id,
        safe_temp_min=unit_in.safe_temp_min,
        safe_temp_max=unit_in.safe_temp_max,
        current_temp=unit_in.initial_temp,
        current_humidity=unit_in.initial_humidity,
        cooling_capacity=unit_in.cooling_capacity,
        current_spoilage=unit_in.initial_spoilage,
        current_energy=0.0,
        current_risk=0.0,
        cooling_level=1,
        ambient_temp=unit_in.ambient_temp,
        ambient_humidity=unit_in.ambient_humidity,
        is_active=True,
        status="NORMAL"
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    
    return {
        "id": unit.id,
        "unit_id": unit.unit_id,
        "unit_type": unit.unit_type,
        "product_profile_id": unit.product_profile_id,
        "product_name": prod.name,
        "safe_temp_min": unit.safe_temp_min,
        "safe_temp_max": unit.safe_temp_max,
        "current_temp": unit.current_temp,
        "current_humidity": unit.current_humidity,
        "cooling_capacity": unit.cooling_capacity,
        "current_spoilage": unit.current_spoilage,
        "current_energy": unit.current_energy,
        "current_risk": unit.current_risk,
        "cooling_level": unit.cooling_level,
        "ambient_temp": unit.ambient_temp,
        "ambient_humidity": unit.ambient_humidity,
        "is_active": unit.is_active,
        "status": unit.status,
        "last_action": "Maintain Cooling"
    }

@router.put("/{unit_id}", response_model=UnitResponse)
def update_unit(unit_id: int, unit_in: UnitUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    unit = db.query(ColdChainUnit).filter(ColdChainUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
        
    if unit_in.unit_type is not None:
        unit.unit_type = unit_in.unit_type
    if unit_in.product_profile_id is not None:
        unit.product_profile_id = unit_in.product_profile_id
    if unit_in.safe_temp_min is not None:
        unit.safe_temp_min = unit_in.safe_temp_min
    if unit_in.safe_temp_max is not None:
        unit.safe_temp_max = unit_in.safe_temp_max
    if unit_in.cooling_capacity is not None:
        unit.cooling_capacity = unit_in.cooling_capacity
    if unit_in.ambient_temp is not None:
        unit.ambient_temp = unit_in.ambient_temp
    if unit_in.ambient_humidity is not None:
        unit.ambient_humidity = unit_in.ambient_humidity
    if unit_in.is_active is not None:
        unit.is_active = unit_in.is_active
        
    db.commit()
    db.refresh(unit)
    
    return {
        "id": unit.id,
        "unit_id": unit.unit_id,
        "unit_type": unit.unit_type,
        "product_profile_id": unit.product_profile_id,
        "product_name": unit.product_profile.name if unit.product_profile else "None",
        "safe_temp_min": unit.safe_temp_min,
        "safe_temp_max": unit.safe_temp_max,
        "current_temp": round(unit.current_temp, 2),
        "current_humidity": round(unit.current_humidity, 1),
        "cooling_capacity": round(unit.cooling_capacity, 1),
        "current_spoilage": round(unit.current_spoilage, 3),
        "current_energy": round(unit.current_energy, 3),
        "current_risk": round(unit.current_risk, 1),
        "cooling_level": unit.cooling_level,
        "ambient_temp": round(unit.ambient_temp, 1),
        "ambient_humidity": round(unit.ambient_humidity, 1),
        "is_active": unit.is_active,
        "status": unit.status,
        "last_action": "Maintain Cooling"
    }

@router.delete("/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    unit = db.query(ColdChainUnit).filter(ColdChainUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    db.delete(unit)
    db.commit()
    return {"message": f"Unit {unit.unit_id} deleted successfully."}
