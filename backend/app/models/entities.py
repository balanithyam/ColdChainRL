from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="User", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    reset_token = Column(String, nullable=True)

class ProductProfile(Base):
    __tablename__ = "product_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    safe_temp_min = Column(Float, nullable=False)
    safe_temp_max = Column(Float, nullable=False)
    optimum_temp = Column(Float, nullable=False)
    humidity_min = Column(Float, default=60.0)
    humidity_max = Column(Float, default=85.0)
    spoilage_sensitivity = Column(Float, default=1.0)
    thermal_mass = Column(Float, default=1.0)
    energy_factor = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    units = relationship("ColdChainUnit", back_populates="product_profile")

class ColdChainUnit(Base):
    __tablename__ = "cold_chain_units"
    
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(String, unique=True, index=True, nullable=False)
    unit_type = Column(String, nullable=False)
    product_profile_id = Column(Integer, ForeignKey("product_profiles.id"), nullable=False)
    
    safe_temp_min = Column(Float, nullable=False)
    safe_temp_max = Column(Float, nullable=False)
    current_temp = Column(Float, default=4.0)
    current_humidity = Column(Float, default=70.0)
    cooling_capacity = Column(Float, default=100.0)
    current_spoilage = Column(Float, default=0.0)
    current_energy = Column(Float, default=0.0)
    current_risk = Column(Float, default=0.0)
    cooling_level = Column(Integer, default=1)
    
    ambient_temp = Column(Float, default=25.0)
    ambient_humidity = Column(Float, default=65.0)
    is_active = Column(Boolean, default=True)
    status = Column(String, default="NORMAL")
    
    product_profile = relationship("ProductProfile", back_populates="units")
    decisions = relationship("RLDecision", back_populates="unit", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="unit", cascade="all, delete-orphan")

class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    run_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    strategy = Column(String, nullable=False)
    product_profile_name = Column(String, nullable=False)
    initial_temp = Column(Float, nullable=False)
    initial_humidity = Column(Float, nullable=False)
    ambient_temp = Column(Float, nullable=False)
    cooling_capacity = Column(Float, default=100.0)
    disturbance_intensity = Column(Float, default=1.0)
    duration_steps = Column(Integer, default=100)
    
    final_spoilage = Column(Float, default=0.0)
    total_energy = Column(Float, default=0.0)
    avg_temp_deviation = Column(Float, default=0.0)
    unsafe_duration_steps = Column(Integer, default=0)
    recovery_time_steps = Column(Integer, default=0)
    intervention_count = Column(Integer, default=0)
    avg_reward = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    steps = relationship("SimulationStep", back_populates="run", cascade="all, delete-orphan")

class SimulationStep(Base):
    __tablename__ = "simulation_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    simulation_run_id = Column(Integer, ForeignKey("simulation_runs.id"), nullable=False)
    step_index = Column(Integer, nullable=False)
    timestamp_str = Column(String, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    ambient_temp = Column(Float, nullable=False)
    cooling_level = Column(Integer, nullable=False)
    action_taken = Column(Integer, nullable=False)
    reward = Column(Float, nullable=False)
    spoilage = Column(Float, nullable=False)
    energy = Column(Float, nullable=False)
    risk = Column(Float, nullable=False)
    disturbance_type = Column(String, nullable=True)
    q_values_json = Column(JSON, nullable=True)
    
    run = relationship("SimulationRun", back_populates="steps")

class RLDecision(Base):
    __tablename__ = "rl_decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("cold_chain_units.id"), nullable=False)
    step_index = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    raw_state_json = Column(JSON, nullable=False)
    encoded_state = Column(String, nullable=False)
    action_taken = Column(Integer, nullable=False)
    action_name = Column(String, nullable=False)
    q_values_json = Column(JSON, nullable=False)
    reward = Column(Float, nullable=False)
    reward_breakdown_json = Column(JSON, nullable=False)
    explanation = Column(Text, nullable=False)
    
    unit = relationship("ColdChainUnit", back_populates="decisions")

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, unique=True, index=True, nullable=False)
    unit_id = Column(Integer, ForeignKey("cold_chain_units.id"), nullable=False)
    unit_name = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    incident_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    state_before_json = Column(JSON, nullable=False)
    rl_action_taken = Column(String, nullable=False)
    recovery_time_seconds = Column(Float, default=0.0)
    outcome = Column(String, default="Active")
    description = Column(Text, nullable=False)
    
    unit = relationship("ColdChainUnit", back_populates="incidents")

class TrainingRun(Base):
    __tablename__ = "training_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    episodes = Column(Integer, nullable=False)
    alpha = Column(Float, nullable=False)
    gamma = Column(Float, nullable=False)
    initial_epsilon = Column(Float, nullable=False)
    min_epsilon = Column(Float, nullable=False)
    decay_rate = Column(Float, nullable=False)
    steps_per_episode = Column(Integer, nullable=False)
    final_avg_reward = Column(Float, default=0.0)
    convergence_episode = Column(Integer, default=0)
    metrics_json = Column(JSON, nullable=False)
    learned_policy_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
