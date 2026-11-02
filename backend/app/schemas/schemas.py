from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str = "User"
    created_at: datetime
    
    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

class ProductProfileBase(BaseModel):
    name: str
    description: Optional[str] = None
    safe_temp_min: float
    safe_temp_max: float
    optimum_temp: float
    humidity_min: float = 60.0
    humidity_max: float = 85.0
    spoilage_sensitivity: float = 1.0
    thermal_mass: float = 1.0
    energy_factor: float = 1.0

class ProductProfileResponse(ProductProfileBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UnitCreate(BaseModel):
    unit_id: str
    unit_type: str
    product_profile_id: int
    safe_temp_min: float
    safe_temp_max: float
    initial_temp: float = 4.0
    initial_humidity: float = 70.0
    cooling_capacity: float = 100.0
    initial_spoilage: float = 0.0
    ambient_temp: float = 25.0
    ambient_humidity: float = 65.0

class UnitUpdate(BaseModel):
    unit_type: Optional[str] = None
    product_profile_id: Optional[int] = None
    safe_temp_min: Optional[float] = None
    safe_temp_max: Optional[float] = None
    cooling_capacity: Optional[float] = None
    ambient_temp: Optional[float] = None
    ambient_humidity: Optional[float] = None
    is_active: Optional[bool] = None

class UnitResponse(BaseModel):
    id: int
    unit_id: str
    unit_type: str
    product_profile_id: int
    product_name: Optional[str] = None
    safe_temp_min: float
    safe_temp_max: float
    current_temp: float
    current_humidity: float
    cooling_capacity: float
    current_spoilage: float
    current_energy: float
    current_risk: float
    cooling_level: int
    ambient_temp: float
    ambient_humidity: float
    is_active: bool
    status: str
    last_action: Optional[str] = "Maintain Cooling"
    
    class Config:
        from_attributes = True

class RewardBreakdown(BaseModel):
    temp_safety: float
    spoilage_penalty: float
    energy_cost: float
    stability_penalty: float
    total_reward: float

class QValuesBreakdown(BaseModel):
    decrease_cooling: float
    maintain_cooling: float
    increase_cooling: float

class RLDecisionResponse(BaseModel):
    id: Optional[int] = None
    unit_id: int
    unit_name: str
    product_name: str
    step_index: int
    timestamp: datetime
    current_state: Dict[str, Any]
    encoded_state: str
    available_actions: List[str]
    q_values: QValuesBreakdown
    selected_action: str
    action_index: int
    reward_components: RewardBreakdown
    total_reward: float
    q_equation: str
    q_update_formula: str
    explanation: str

class DisturbanceInjection(BaseModel):
    unit_id: Optional[str] = None
    disturbance_type: str
    magnitude: float = 5.0
    duration_steps: int = 5

class SimulationConfig(BaseModel):
    product_profile_name: str = "Dairy"
    initial_temp: float = 4.0
    initial_humidity: float = 70.0
    ambient_temp: float = 28.0
    cooling_capacity: float = 100.0
    duration_steps: int = 120
    disturbance_intensity: float = 1.0
    strategy: str = "Q-Learning"

class SimulationStepResponse(BaseModel):
    step_index: int
    timestamp: str
    temperature: float
    humidity: float
    ambient_temp: float
    cooling_level: int
    action_taken: int
    action_name: str
    reward: float
    spoilage: float
    energy: float
    risk: float
    disturbance_type: Optional[str] = None
    q_values: Optional[Dict[str, float]] = None

class SimulationRunResponse(BaseModel):
    id: int
    run_code: str
    name: str
    strategy: str
    product_profile_name: str
    duration_steps: int
    final_spoilage: float
    total_energy: float
    avg_temp_deviation: float
    unsafe_duration_steps: int
    recovery_time_steps: int
    intervention_count: int
    avg_reward: float
    steps: List[SimulationStepResponse] = []
    
    class Config:
        from_attributes = True

class BenchmarkRequest(BaseModel):
    product_profile_name: str = "Dairy"
    initial_temp: float = 5.0
    initial_humidity: float = 75.0
    ambient_temp: float = 30.0
    cooling_capacity: float = 90.0
    duration_steps: int = 150
    disturbance_intensity: float = 1.5
    include_disturbances: bool = True

class StrategyBenchmarkResult(BaseModel):
    strategy: str
    final_spoilage: float
    total_energy: float
    avg_temp_deviation: float
    unsafe_duration_steps: int
    recovery_time_steps: int
    intervention_count: int
    avg_reward: float
    steps: List[SimulationStepResponse] = []

class BenchmarkComparisonResponse(BaseModel):
    scenario: Dict[str, Any]
    results: List[StrategyBenchmarkResult]
    summary_analysis: str

class IncidentResponse(BaseModel):
    id: int
    incident_id: str
    unit_id: int
    unit_name: str
    timestamp: datetime
    incident_type: str
    severity: str
    state_before: Dict[str, Any]
    rl_action_taken: str
    recovery_time_seconds: float
    outcome: str
    description: str
    
    class Config:
        from_attributes = True

class TrainingConfig(BaseModel):
    episodes: int = 200
    alpha: float = 0.1
    gamma: float = 0.95
    initial_epsilon: float = 0.2
    min_epsilon: float = 0.01
    decay_rate: float = 0.99
    steps_per_episode: int = 80
    product_profile_name: str = "Dairy"

class TrainingMetricPoint(BaseModel):
    episode: int
    reward: float
    moving_avg_reward: float
    epsilon: float
    q_convergence_delta: float
    state_action_coverage: float

class LearnedPolicyItem(BaseModel):
    state_code: str
    temp_zone: str
    humidity_zone: str
    spoilage_zone: str
    risk_zone: str
    best_action: str
    q_decrease: float
    q_maintain: float
    q_increase: float
    visit_count: int

class TrainingRunResponse(BaseModel):
    id: Optional[int] = None
    episodes: int
    alpha: float
    gamma: float
    initial_epsilon: float
    min_epsilon: float
    decay_rate: float
    steps_per_episode: int
    final_avg_reward: float
    convergence_episode: int
    metrics: List[TrainingMetricPoint]
    learned_policy: List[LearnedPolicyItem]
