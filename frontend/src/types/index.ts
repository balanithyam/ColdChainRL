export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ProductProfile {
  id: number;
  name: string;
  description?: string;
  safe_temp_min: number;
  safe_temp_max: number;
  optimum_temp: number;
  humidity_min: number;
  humidity_max: number;
  spoilage_sensitivity: number;
  thermal_mass: number;
  energy_factor: number;
}

export interface UnitHistoryItem {
  time: string;
  step: number;
  temperature: number;
  humidity: number;
  spoilage: number;
  energy: number;
  risk: number;
  cooling_level: number;
  action_name: string;
  action_taken: number;
  reward: number;
  disturbance?: string | null;
}

export interface ColdChainUnit {
  id: number;
  unit_id: string;
  unit_type: string;
  product_profile_id: number;
  product_name: string;
  safe_temp_min: number;
  safe_temp_max: number;
  current_temp: number;
  current_humidity: number;
  cooling_capacity: number;
  current_spoilage: number;
  current_energy: number;
  current_risk: number;
  cooling_level: number;
  ambient_temp: number;
  ambient_humidity: number;
  is_active: boolean;
  status: 'NORMAL' | 'AT_RISK' | 'CRITICAL';
  last_action?: string;
  disturbance?: string | null;
  history?: UnitHistoryItem[];
}

export interface GlobalKPIs {
  active_units: number;
  at_risk_units: number;
  critical_units: number;
  avg_temp: number;
  avg_spoilage: number;
  total_energy: number;
  rl_interventions: number;
}

export interface TelemetryMessage {
  type: string;
  step: number;
  timestamp: string;
  is_running: boolean;
  is_paused: boolean;
  kpis: GlobalKPIs;
  units: ColdChainUnit[];
}

export interface QValuesBreakdown {
  decrease_cooling: number;
  maintain_cooling: number;
  increase_cooling: number;
}

export interface RewardBreakdown {
  temp_safety: number;
  spoilage_penalty: number;
  energy_cost: number;
  stability_penalty: number;
  total_reward: number;
}

export interface RLDecisionResponse {
  unit_id: number;
  unit_name: string;
  product_name: string;
  step_index: number;
  timestamp: string;
  current_state: {
    temperature_celsius: number;
    safe_range: string;
    humidity_percent: number;
    spoilage_percent: number;
    energy_kwh: number;
    risk_score: number;
    cooling_level: number;
    status: string;
    zones: {
      temperature_zone: string;
      humidity_zone: string;
      spoilage_zone: string;
      risk_zone: string;
    };
  };
  encoded_state: string;
  available_actions: string[];
  q_values: QValuesBreakdown;
  selected_action: string;
  action_index: number;
  reward_components: RewardBreakdown;
  total_reward: number;
  q_equation: string;
  q_update_formula: string;
  explanation: string;
}

export interface SimulationStep {
  step_index: number;
  timestamp: string;
  temperature: number;
  humidity: number;
  ambient_temp: number;
  cooling_level: number;
  action_taken: number;
  action_name: string;
  reward: number;
  spoilage: number;
  energy: number;
  risk: number;
  disturbance_type?: string | null;
  q_values?: Record<string, number> | null;
}

export interface SimulationRunResult {
  id: number;
  run_code: string;
  name: string;
  strategy: string;
  product_profile_name: string;
  duration_steps: number;
  final_spoilage: number;
  total_energy: number;
  avg_temp_deviation: number;
  unsafe_duration_steps: number;
  recovery_time_steps: number;
  intervention_count: number;
  avg_reward: number;
  steps: SimulationStep[];
}

export interface StrategyBenchmarkResult {
  strategy: string;
  final_spoilage: number;
  total_energy: number;
  avg_temp_deviation: number;
  unsafe_duration_steps: number;
  recovery_time_steps: number;
  intervention_count: number;
  avg_reward: number;
  steps: SimulationStep[];
}

export interface BenchmarkComparisonResponse {
  scenario: {
    product_name: string;
    initial_temp: number;
    initial_humidity: number;
    ambient_temp: number;
    cooling_capacity: number;
    duration_steps: number;
    disturbances: Array<{ step: number; type: string }>;
  };
  results: StrategyBenchmarkResult[];
  summary_analysis: string;
}

export interface Incident {
  id: number;
  incident_id: string;
  unit_id: number;
  unit_name: string;
  timestamp: string;
  incident_type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  state_before: {
    temp: number;
    spoilage: number;
    cooling_level: number;
  };
  rl_action_taken: string;
  recovery_time_seconds: number;
  outcome: 'Active' | 'Mitigated' | 'Resolved';
  description: string;
}

export interface IncidentSummary {
  total_incidents: number;
  severity_breakdown: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  outcome_breakdown: {
    Resolved: number;
    Mitigated: number;
    Active: number;
  };
  timeline: Array<{
    id: string;
    time: string;
    severity: string;
    type: string;
    unit: string;
  }>;
}

export interface TrainingMetricPoint {
  episode: number;
  reward: number;
  moving_avg_reward: number;
  epsilon: number;
  q_convergence_delta: number;
  state_action_coverage: number;
}

export interface LearnedPolicyItem {
  state_code: string;
  temp_zone: string;
  humidity_zone: string;
  spoilage_zone: string;
  risk_zone: string;
  best_action: string;
  q_decrease: number;
  q_maintain: number;
  q_increase: number;
  visit_count: number;
}

export interface TrainingRunResponse {
  id?: number;
  episodes: number;
  alpha: number;
  gamma: number;
  initial_epsilon: number;
  min_epsilon: number;
  decay_rate: number;
  steps_per_episode: number;
  final_avg_reward: number;
  convergence_episode: number;
  metrics: TrainingMetricPoint[];
  learned_policy: LearnedPolicyItem[];
}
