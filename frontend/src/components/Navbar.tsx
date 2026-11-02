import React from 'react';
import { Play, Pause, Square, RotateCcw, Zap, AlertTriangle, CheckCircle, Info, Bell } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

interface Props {
  pageTitle: string;
  subtitle?: string;
}

export const Navbar: React.FC<Props> = ({ pageTitle, subtitle }) => {
  const {
    isRunning,
    isPaused,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    stepCount,
    units,
    selectedUnitId,
    setSelectedUnitId,
    injectDisturbance,
    toastMessage,
    toastType,
    activeDisturbanceNotice,
  } = useSimulation();

  return (
    <header className="relative bg-white border-b border-slate-200 shrink-0 z-20">
      <div className="h-16 px-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{pageTitle}</h2>
          {subtitle && <p className="text-xs text-slate-500 font-normal">{subtitle}</p>}
        </div>

        {/* Global Simulation & Unit Bar Controls */}
        <div className="flex items-center gap-3">
          {/* Active Disturbance Banner Pill */}
          {activeDisturbanceNotice && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{activeDisturbanceNotice}</span>
            </div>
          )}

          {/* Unit Selector */}
          {units.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Unit:</span>
              <select
                value={selectedUnitId || ''}
                onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_id} ({u.product_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Live Simulation Play/Pause Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-2xs">
            {!isRunning ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-xs"
                title="Start Real-Time Telemetry"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={resumeSimulation}
                className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-xs"
                title="Resume RL Closed-Loop Engine"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={pauseSimulation}
                className="flex items-center gap-1 px-3 py-1 rounded bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all shadow-xs"
                title="Pause Simulation & Freeze State"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={resetSimulation}
              className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Reset Simulation Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Disturbance Injection Button */}
          <button
            onClick={() => injectDisturbance('Temperature Spike')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 hover:border-rose-300 transition-all shadow-2xs active:scale-95"
            title="Inject +5°C Heat Influx Spike into Selected Asset"
          >
            <Zap className="w-3.5 h-3.5 text-rose-600 fill-current" />
            <span>Inject Spike</span>
          </button>

          {/* Live Step Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Step: <strong className="text-slate-900 font-bold">{stepCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Instant Notification Toast Banner */}
      {toastMessage && (
        <div
          className={`px-6 py-2 border-t flex items-center justify-between text-xs font-semibold transition-all duration-300 ${
            toastType === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toastType === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : toastType === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastType === 'error' && <Zap className="w-4 h-4 text-rose-600 fill-current" />}
            {toastType === 'warning' && <Pause className="w-4 h-4 text-amber-600 fill-current" />}
            {toastType === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
            {toastType === 'info' && <Info className="w-4 h-4 text-indigo-600" />}
            <span>{toastMessage}</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Live Feedback</span>
        </div>
      )}
    </header>
  );
};
