import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ColdChainUnit, GlobalKPIs, TelemetryMessage } from '../types';
import { simulationService, unitsService } from '../services/api';
import { useAuth } from './AuthContext';

interface SimulationContextType {
  units: ColdChainUnit[];
  kpis: GlobalKPIs;
  selectedUnitId: number | null;
  selectedUnit: ColdChainUnit | null;
  setSelectedUnitId: (id: number | null) => void;
  isLive: boolean;
  isRunning: boolean;
  isPaused: boolean;
  stepCount: number;
  tickInterval: number;
  setSpeed: (intervalSeconds: number) => Promise<void>;
  toastMessage: string | null;
  toastType: 'info' | 'warning' | 'success' | 'error';
  activeDisturbanceNotice: string | null;
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  stopSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  injectDisturbance: (type: string, unitId?: string, magnitude?: number, duration?: number) => Promise<void>;
  refreshUnits: () => Promise<void>;
  showToast: (message: string, type?: 'info' | 'warning' | 'success' | 'error') => void;
}

const defaultKPIs: GlobalKPIs = {
  active_units: 4,
  at_risk_units: 0,
  critical_units: 0,
  avg_temp: 0,
  avg_spoilage: 0,
  total_energy: 0,
  rl_interventions: 0,
};

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [units, setUnits] = useState<ColdChainUnit[]>([]);
  const [kpis, setKpis] = useState<GlobalKPIs>(defaultKPIs);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(0);
  const [tickInterval, setTickInterval] = useState<number>(1.0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [activeDisturbanceNotice, setActiveDisturbanceNotice] = useState<string | null>(null);

  const showToast = (msg: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const refreshUnits = useCallback(async () => {
    try {
      const res = await unitsService.getUnits();
      setUnits(res.data);
      if (res.data.length > 0 && selectedUnitId === null) {
        setSelectedUnitId(res.data[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch units:', e);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshUnits();

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/telemetry`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsLive(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: TelemetryMessage = JSON.parse(event.data);
          if (data.type === 'TELEMETRY_UPDATE') {
            setStepCount(data.step);
            setIsRunning(data.is_running);
            setIsPaused(data.is_paused);
            setKpis(data.kpis);
            setUnits(data.units);
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      ws.onclose = () => {
        setIsLive(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [isAuthenticated, refreshUnits]);

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0] || null;

  const startSimulation = async () => {
    try {
      await simulationService.start();
      setIsRunning(true);
      setIsPaused(false);
      showToast('Simulation started. Real-time telemetry streaming.', 'success');
    } catch (e) {
      console.error('Start failed:', e);
    }
  };

  const pauseSimulation = async () => {
    try {
      await simulationService.pause();
      setIsPaused(true);
      showToast('Simulation paused. State frozen.', 'warning');
    } catch (e) {
      console.error('Pause failed:', e);
    }
  };

  const resumeSimulation = async () => {
    try {
      await simulationService.resume();
      setIsPaused(false);
      showToast('Simulation resumed. Q-Learning active.', 'success');
    } catch (e) {
      console.error('Resume failed:', e);
    }
  };

  const stopSimulation = async () => {
    try {
      await simulationService.stop();
      setIsRunning(false);
      setIsPaused(false);
      showToast('Simulation stopped.', 'info');
    } catch (e) {
      console.error('Stop failed:', e);
    }
  };

  const resetSimulation = async () => {
    try {
      await simulationService.reset();
      setIsRunning(true);
      setIsPaused(false);
      setStepCount(0);
      setActiveDisturbanceNotice(null);
      await refreshUnits();
      showToast('Simulation reset to baseline normal operating values.', 'info');
    } catch (e) {
      console.error('Reset failed:', e);
    }
  };

  const setSpeed = async (intervalSeconds: number) => {
    try {
      await simulationService.setSpeed(intervalSeconds);
      setTickInterval(intervalSeconds);
      showToast(
        `Telemetry cadence set to ${intervalSeconds}s interval (${intervalSeconds >= 3 ? 'Presentation Mode' : 'Live Mode'})`,
        'info'
      );
    } catch (e) {
      console.error('Set speed failed:', e);
    }
  };

  const injectDisturbance = async (
    type: string,
    unitId?: string,
    magnitude: number = 5.0,
    duration: number = 8
  ) => {
    const target = unitId || selectedUnit?.unit_id || 'WH-01';
    try {
      await simulationService.injectDisturbance({
        unit_id: target,
        disturbance_type: type,
        magnitude,
        duration_steps: duration,
      });
      setActiveDisturbanceNotice(`Active: ${type} on ${target} (${duration} steps)`);
      showToast(`Injected ${type} (+${magnitude}C Load) into Asset ${target}`, 'error');
      setTimeout(() => {
        setActiveDisturbanceNotice(null);
      }, duration * 1000 + 2000);
    } catch (e) {
      console.error('Disturbance injection error:', e);
      showToast('Failed to inject disturbance. Check connection.', 'error');
    }
  };

  return (
    <SimulationContext.Provider
      value={{
        units,
        kpis,
        selectedUnitId,
        selectedUnit,
        setSelectedUnitId,
        isLive,
        isRunning,
        isPaused,
        stepCount,
        tickInterval,
        setSpeed,
        toastMessage,
        toastType,
        activeDisturbanceNotice,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        stopSimulation,
        resetSimulation,
        injectDisturbance,
        refreshUnits,
        showToast,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
