import axios from 'axios';
import {
  AuthResponse,
  ColdChainUnit,
  ProductProfile,
  RLDecisionResponse,
  SimulationRunResult,
  BenchmarkComparisonResponse,
  Incident,
  IncidentSummary,
  TrainingRunResponse,
  LearnedPolicyItem
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Initialize token on boot
const savedToken = localStorage.getItem('token');
if (savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

// Handle 401 unauthorized gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthUrl = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthUrl) {
        setAuthToken(null);
        localStorage.removeItem('user');
        const publicPaths = ['/login', '/register', '/register-success', '/forgot-password', '/reset-password'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post<AuthResponse>('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

export const unitsService = {
  getUnits: () => api.get<ColdChainUnit[]>('/units'),
  getUnit: (id: number) => api.get<ColdChainUnit>(`/units/${id}`),
  createUnit: (data: any) => api.post<ColdChainUnit>('/units', data),
  updateUnit: (id: number, data: any) => api.put<ColdChainUnit>(`/units/${id}`, data),
  deleteUnit: (id: number) => api.delete(`/units/${id}`),
  getProducts: () => api.get<ProductProfile[]>('/units/products'),
  createProduct: (data: any) => api.post<ProductProfile>('/units/products', data),
};

export const decisionService = {
  getDecision: (unitId: number) => api.get<RLDecisionResponse>(`/decision/unit/${unitId}`),
};

export const simulationService = {
  start: () => api.post('/simulation/control/start'),
  pause: () => api.post('/simulation/control/pause'),
  resume: () => api.post('/simulation/control/resume'),
  stop: () => api.post('/simulation/control/stop'),
  reset: () => api.post('/simulation/control/reset'),
  setSpeed: (speed: number) => api.post(`/simulation/control/speed?speed=${speed}`),
  injectDisturbance: (data: { unit_id?: string; disturbance_type: string; magnitude?: number; duration_steps?: number }) =>
    api.post('/simulation/disturbance/inject', data),
  runCustom: (config: any) => api.post<SimulationRunResult>('/simulation/run-custom', config),
};

export const benchmarkService = {
  runBenchmark: (config: any) => api.post<BenchmarkComparisonResponse>('/benchmark/run', config),
};

export const incidentService = {
  getIncidents: (params?: any) => api.get<Incident[]>('/incidents', { params }),
  getSummary: () => api.get<IncidentSummary>('/incidents/summary'),
  resolveIncident: (id: string) => api.put(`/incidents/${id}/resolve`),
};

export const trainingService = {
  train: (config: any) => api.post<TrainingRunResponse>('/training/train', config),
  getCurrentPolicy: () => api.get<{ policy: LearnedPolicyItem[] }>('/training/current-policy'),
  resetQTable: () => api.post('/training/reset-qtable'),
};

export default api;
