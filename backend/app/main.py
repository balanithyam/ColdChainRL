from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.entities import ProductProfile, ColdChainUnit, User
from app.core.security import get_password_hash
from app.rl.q_learning import global_rl_agent

from app.api.auth import router as auth_router
from app.api.units import router as units_router
from app.api.decision import router as decision_router
from app.api.simulation import router as simulation_router
from app.api.benchmark import router as benchmark_router
from app.api.incidents import router as incidents_router
from app.api.training import router as training_router
from app.api.websocket import router as websocket_router

def seed_database():
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "operator@coldchain.ai").first()
        if not demo_user:
            demo_user = User(
                email="operator@coldchain.ai",
                full_name="Academic CI Researcher",
                hashed_password=get_password_hash("Password123!"),
                role="User"
            )
            db.add(demo_user)

        profiles = [
            {
                "name": "Pasteurized Milk & Dairy",
                "description": "Fluid milk, cream, and fermented dairy. Highly susceptible to bacterial souring and lactic proliferation above 4 C.",
                "safe_temp_min": 2.0,
                "safe_temp_max": 4.0,
                "optimum_temp": 3.0,
                "humidity_min": 65.0,
                "humidity_max": 80.0,
                "spoilage_sensitivity": 1.8,
                "thermal_mass": 1.1,
                "energy_factor": 1.2
            },
            {
                "name": "Fresh Strawberries & Berries",
                "description": "High-respiration soft berries vulnerable to rapid gray mold (Botrytis) and moisture weeping above 2.5 C.",
                "safe_temp_min": 0.5,
                "safe_temp_max": 2.5,
                "optimum_temp": 1.0,
                "humidity_min": 85.0,
                "humidity_max": 95.0,
                "spoilage_sensitivity": 2.2,
                "thermal_mass": 0.9,
                "energy_factor": 1.1
            },
            {
                "name": "Chilled Atlantic Salmon",
                "description": "Fresh gutted salmon and white fish requiring strict near-zero preservation to prevent enzymatic breakdown and histamine formation.",
                "safe_temp_min": -1.0,
                "safe_temp_max": 2.0,
                "optimum_temp": 0.5,
                "humidity_min": 90.0,
                "humidity_max": 98.0,
                "spoilage_sensitivity": 1.9,
                "thermal_mass": 1.2,
                "energy_factor": 1.3
            },
            {
                "name": "Fresh Beef & Poultry",
                "description": "Red meat cuts and fresh chicken requiring precise chilling to suppress pseudomonas growth and surface oxidation.",
                "safe_temp_min": 0.0,
                "safe_temp_max": 3.0,
                "optimum_temp": 1.5,
                "humidity_min": 80.0,
                "humidity_max": 90.0,
                "spoilage_sensitivity": 1.7,
                "thermal_mass": 1.4,
                "energy_factor": 1.3
            },
            {
                "name": "Apples & Pears",
                "description": "Deciduous pome fruits requiring low ethylene accumulation and controlled respiration to prevent soft scald.",
                "safe_temp_min": 1.0,
                "safe_temp_max": 4.0,
                "optimum_temp": 2.5,
                "humidity_min": 88.0,
                "humidity_max": 95.0,
                "spoilage_sensitivity": 0.9,
                "thermal_mass": 1.2,
                "energy_factor": 0.9
            },
            {
                "name": "Leafy Greens & Broccoli",
                "description": "High surface-area produce requiring high humidity and cooling to prevent yellowing, wilting, and chlorophyll loss.",
                "safe_temp_min": 0.5,
                "safe_temp_max": 3.5,
                "optimum_temp": 2.0,
                "humidity_min": 90.0,
                "humidity_max": 98.0,
                "spoilage_sensitivity": 1.3,
                "thermal_mass": 0.8,
                "energy_factor": 1.0
            },
            {
                "name": "Artisan Cheese & Butter",
                "description": "Ripened cheeses and block butter requiring moderate chilling to prevent oil separation and off-flavor lipolysis.",
                "safe_temp_min": 4.0,
                "safe_temp_max": 8.0,
                "optimum_temp": 5.5,
                "humidity_min": 70.0,
                "humidity_max": 85.0,
                "spoilage_sensitivity": 1.1,
                "thermal_mass": 1.3,
                "energy_factor": 0.8
            },
            {
                "name": "Bananas & Tropical Fruit",
                "description": "Tropical fruit highly vulnerable to chilling injury (peel browning and flavor loss) if temperature drops below 12.5 C.",
                "safe_temp_min": 13.0,
                "safe_temp_max": 15.5,
                "optimum_temp": 14.0,
                "humidity_min": 85.0,
                "humidity_max": 95.0,
                "spoilage_sensitivity": 1.5,
                "thermal_mass": 1.1,
                "energy_factor": 0.6
            },
            {
                "name": "Ice Cream & Gelato",
                "description": "Deep-frozen dairy confectionery requiring sub-zero thermal stability to prevent ice crystal coarsening and heat shock.",
                "safe_temp_min": -25.0,
                "safe_temp_max": -18.0,
                "optimum_temp": -22.0,
                "humidity_min": 50.0,
                "humidity_max": 70.0,
                "spoilage_sensitivity": 0.8,
                "thermal_mass": 1.5,
                "energy_factor": 1.8
            },
            {
                "name": "Deep-Frozen Seafood & Tuna",
                "description": "Sashimi-grade tuna and frozen shellfish requiring ultra-cold storage to prevent lipid oxidation and flesh discoloration.",
                "safe_temp_min": -28.0,
                "safe_temp_max": -20.0,
                "optimum_temp": -25.0,
                "humidity_min": 45.0,
                "humidity_max": 65.0,
                "spoilage_sensitivity": 0.5,
                "thermal_mass": 1.6,
                "energy_factor": 2.0
            },
            {
                "name": "mRNA Vaccines & Biologics",
                "description": "Lipid nanoparticle biologics requiring ultra-low thermal stability to prevent molecular degradation.",
                "safe_temp_min": -25.0,
                "safe_temp_max": -15.0,
                "optimum_temp": -20.0,
                "humidity_min": 40.0,
                "humidity_max": 60.0,
                "spoilage_sensitivity": 2.5,
                "thermal_mass": 1.0,
                "energy_factor": 1.9
            },
            {
                "name": "Insulin & Specialty Pharma",
                "description": "Protein therapeutics requiring strict 2-8 C envelope to prevent irreversible protein denaturation and aggregation.",
                "safe_temp_min": 2.0,
                "safe_temp_max": 8.0,
                "optimum_temp": 4.5,
                "humidity_min": 45.0,
                "humidity_max": 65.0,
                "spoilage_sensitivity": 2.0,
                "thermal_mass": 0.9,
                "energy_factor": 1.1
            },
            {
                "name": "Blood Plasma & Serums",
                "description": "Clinical blood fractions and clotting factor serums requiring frozen preservation below -20 C.",
                "safe_temp_min": -30.0,
                "safe_temp_max": -20.0,
                "optimum_temp": -25.0,
                "humidity_min": 40.0,
                "humidity_max": 60.0,
                "spoilage_sensitivity": 1.8,
                "thermal_mass": 1.2,
                "energy_factor": 1.9
            },
            {
                "name": "Fine Chocolates & Confections",
                "description": "Cocoa butter confectionery requiring stable temperate chilling to prevent fat bloom and sugar moisture condensation.",
                "safe_temp_min": 14.0,
                "safe_temp_max": 18.0,
                "optimum_temp": 16.0,
                "humidity_min": 45.0,
                "humidity_max": 60.0,
                "spoilage_sensitivity": 0.7,
                "thermal_mass": 1.1,
                "energy_factor": 0.5
            },
            {
                "name": "Fresh Cut Florals",
                "description": "High-value floral stems and roses requiring cold hydration storage to suppress botrytis and petal wilting.",
                "safe_temp_min": 2.0,
                "safe_temp_max": 6.0,
                "optimum_temp": 3.5,
                "humidity_min": 85.0,
                "humidity_max": 95.0,
                "spoilage_sensitivity": 1.4,
                "thermal_mass": 0.8,
                "energy_factor": 1.0
            }
        ]

        seeded_prods = {}
        for p_data in profiles:
            p = db.query(ProductProfile).filter(ProductProfile.name == p_data["name"]).first()
            if not p:
                p = ProductProfile(**p_data)
                db.add(p)
                db.commit()
                db.refresh(p)
            seeded_prods[p.name] = p

        default_units = [
            {
                "unit_id": "WH-DAIRY-01",
                "unit_type": "Central Dairy Warehouse",
                "product": "Pasteurized Milk & Dairy",
                "safe_min": 2.0,
                "safe_max": 4.0,
                "temp": 3.1,
                "humidity": 72.0,
                "ambient": 26.0
            },
            {
                "unit_id": "REEFER-BERRY-02",
                "unit_type": "Fast-Transit Reefer (40ft)",
                "product": "Fresh Strawberries & Berries",
                "safe_min": 0.5,
                "safe_max": 2.5,
                "temp": 1.2,
                "humidity": 90.0,
                "ambient": 29.0
            },
            {
                "unit_id": "SEAFOOD-VAULT-03",
                "unit_type": "Harbor Chilled Seafood Bay",
                "product": "Chilled Atlantic Salmon",
                "safe_min": -1.0,
                "safe_max": 2.0,
                "temp": 0.4,
                "humidity": 94.0,
                "ambient": 24.0
            },
            {
                "unit_id": "MEAT-TRANSIT-04",
                "unit_type": "Interstate Reefer Trailer",
                "product": "Fresh Beef & Poultry",
                "safe_min": 0.0,
                "safe_max": 3.0,
                "temp": 1.6,
                "humidity": 84.0,
                "ambient": 32.0
            },
            {
                "unit_id": "FRUIT-STORE-05",
                "unit_type": "Controlled Atmosphere Cold Store",
                "product": "Apples & Pears",
                "safe_min": 1.0,
                "safe_max": 4.0,
                "temp": 2.4,
                "humidity": 91.0,
                "ambient": 25.0
            },
            {
                "unit_id": "PHARMA-VAULT-06",
                "unit_type": "Hospital Biomedical Cold Room",
                "product": "Insulin & Specialty Pharma",
                "safe_min": 2.0,
                "safe_max": 8.0,
                "temp": 4.6,
                "humidity": 52.0,
                "ambient": 22.0
            },
            {
                "unit_id": "CRYOGENIC-07",
                "unit_type": "Deep-Freeze Bio Chamber",
                "product": "mRNA Vaccines & Biologics",
                "safe_min": -25.0,
                "safe_max": -15.0,
                "temp": -20.5,
                "humidity": 50.0,
                "ambient": 28.0
            },
            {
                "unit_id": "TROPICAL-BAY-08",
                "unit_type": "Ripening & Distribution Chamber",
                "product": "Bananas & Tropical Fruit",
                "safe_min": 13.0,
                "safe_max": 15.5,
                "temp": 14.1,
                "humidity": 89.0,
                "ambient": 30.0
            }
        ]

        for u_data in default_units:
            u = db.query(ColdChainUnit).filter(ColdChainUnit.unit_id == u_data["unit_id"]).first()
            if not u and u_data["product"] in seeded_prods:
                prod = seeded_prods[u_data["product"]]
                u = ColdChainUnit(
                    unit_id=u_data["unit_id"],
                    unit_type=u_data["unit_type"],
                    product_profile_id=prod.id,
                    safe_temp_min=u_data["safe_min"],
                    safe_temp_max=u_data["safe_max"],
                    current_temp=u_data["temp"],
                    current_humidity=u_data["humidity"],
                    cooling_capacity=100.0,
                    current_spoilage=0.0,
                    current_energy=0.0,
                    current_risk=0.0,
                    cooling_level=1,
                    ambient_temp=u_data["ambient"],
                    ambient_humidity=65.0,
                    is_active=True,
                    status="NORMAL"
                )
                db.add(u)

        db.commit()
    finally:
        db.close()

from app.simulation.engine import sim_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_database()
    global_rl_agent.load()
    sim_engine.start()
    yield
    sim_engine.stop()
    global_rl_agent.save()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(units_router, prefix=f"{settings.API_V1_STR}/units", tags=["Unit Management"])
app.include_router(decision_router, prefix=f"{settings.API_V1_STR}/decision", tags=["AI Decision Center"])
app.include_router(simulation_router, prefix=f"{settings.API_V1_STR}/simulation", tags=["Simulation Lab"])
app.include_router(benchmark_router, prefix=f"{settings.API_V1_STR}/benchmark", tags=["Strategy Benchmark"])
app.include_router(incidents_router, prefix=f"{settings.API_V1_STR}/incidents", tags=["Incident & Risk Center"])
app.include_router(training_router, prefix=f"{settings.API_V1_STR}/training", tags=["RL Training Lab"])
app.include_router(websocket_router, tags=["WebSocket Telemetry"])

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "academic_discipline": "Computational Intelligence / Simulation Using Modern Tools",
        "algorithm": "Adaptive Tabular Q-Learning Closed-Loop Control",
        "status": "Online",
        "docs": f"{settings.API_V1_STR}/docs"
    }
