import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SimulationProvider } from './context/SimulationContext';
import { AppLayout } from './components/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { RegistrationSuccessPage } from './pages/auth/RegistrationSuccessPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// EXACTLY 7 MAIN PAGES
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { UnitManagementPage } from './pages/UnitManagementPage';
import { AIDecisionCenterPage } from './pages/AIDecisionCenterPage';
import { SimulationLabPage } from './pages/SimulationLabPage';
import { StrategyBenchmarkPage } from './pages/StrategyBenchmarkPage';
import { IncidentRiskCenterPage } from './pages/IncidentRiskCenterPage';
import { RLTrainingLabPage } from './pages/RLTrainingLabPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SimulationProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register-success" element={<RegistrationSuccessPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Authenticated Control Room Routes (Exactly 7 Main Pages) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<LiveMonitorPage />} />
              <Route path="/units" element={<UnitManagementPage />} />
              <Route path="/decision" element={<AIDecisionCenterPage />} />
              <Route path="/simulation" element={<SimulationLabPage />} />
              <Route path="/benchmark" element={<StrategyBenchmarkPage />} />
              <Route path="/incidents" element={<IncidentRiskCenterPage />} />
              <Route path="/training" element={<RLTrainingLabPage />} />
            </Route>

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SimulationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
