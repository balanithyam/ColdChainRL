import React from 'react';
import {
  Activity,
  AlertTriangle,
  Flame,
  Thermometer,
  Zap,
  Radio,
  Layers,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Navbar } from '../components/Navbar';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';
import { useSimulation } from '../context/SimulationContext';

export const LiveMonitorPage: React.FC = () => {
  const {
    units,
    kpis,
    selectedUnit,
    setSelectedUnitId,
    isRunning,
    isPaused,
    isLive,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    tickInterval,
    setSpeed,
    injectDisturbance,
  } = useSimulation();

  const history = selectedUnit?.history || [];

  // Prepare chart data from selected unit history
  const chartData = history.map((h) => ({
    step: `T+${h.step}`,
    temperature: h.temperature,
    humidity: h.humidity,
    spoilage: Number(Math.min(100, Math.max(0, h.spoilage)).toFixed(2)),
    energy: Number(h.energy.toFixed(2)),
    cooling_level: h.cooling_level,
    reward: Number(h.reward.toFixed(2)),
    action_name: h.action_name,
    disturbance: h.disturbance,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <Navbar
        pageTitle="LIVE MONITOR"
        subtitle="Real-Time Cold-Chain Telemetry & Closed-Loop RL Actuation"
      />

      <div className="p-6 space-y-6">
        {/* Connection, Cadence & Mode Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold text-slate-800">
                {isLive ? 'Telemetry: Live' : 'Disconnected'}
              </span>
            </div>
            <span className="text-slate-300">|</span>

            {/* Engine Status & Play/Pause */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Engine:{' '}
                <strong className={isRunning && !isPaused ? 'text-indigo-600' : 'text-amber-600'}>
                  {isRunning ? (isPaused ? 'Paused / Frozen' : `Running (${tickInterval}s Tick)`) : 'Stopped'}
                </strong>
              </span>

              {isPaused ? (
                <button
                  onClick={resumeSimulation}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-2xs"
                  title="Resume real-time telemetry updates"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseSimulation}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors shadow-2xs"
                  title="Freeze screen so you can explain numbers to Mam without them jumping"
                >
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Freeze Screen</span>
                </button>
              )}

              <button
                onClick={resetSimulation}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 transition-colors shadow-2xs"
                title="Reset all units back to Step 0, safe temperature, and 0.0% fresh spoilage"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Fleet</span>
              </button>
            </div>

            <span className="text-slate-300 hidden md:inline">|</span>

            {/* Cadence / Pace Selector for Presentation */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Pace:</span>
              <button
                onClick={() => setSpeed(1.0)}
                className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                  tickInterval === 1.0 ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
                title="Updates every 1 second (Live rate)"
              >
                1s Live
              </button>
              <button
                onClick={() => setSpeed(3.0)}
                className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                  tickInterval === 3.0 ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
                title="Updates every 3 seconds (Calm reading)"
              >
                3s Stable
              </button>
              <button
                onClick={() => setSpeed(5.0)}
                className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                  tickInterval === 5.0 ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
                title="Updates every 5 seconds (Recommended for presenting to Mam)"
              >
                5s Presentation
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden lg:inline">Live Disturbance:</span>
            <button
              onClick={() => injectDisturbance('Temperature Spike', selectedUnit?.unit_id, 5.0, 8)}
              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
            >
              +5°C Heat Spike
            </button>
            <button
              onClick={() => injectDisturbance('Door Opening', selectedUnit?.unit_id, 4.0, 6)}
              className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Door Influx
            </button>
            <button
              onClick={() => injectDisturbance('Cooling Reduction', selectedUnit?.unit_id, -30, 10)}
              className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Compressor Drop
            </button>
          </div>
        </div>

        {/* Dynamic KPIs (7 KPIs per spec) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KPICard
            title="Active Units"
            value={kpis.active_units}
            unit="nodes"
            icon={<Layers className="w-4 h-4" />}
            accentColor="indigo"
          />
          <KPICard
            title="At-Risk Units"
            value={kpis.at_risk_units}
            unit="units"
            icon={<AlertTriangle className="w-4 h-4" />}
            accentColor={kpis.at_risk_units > 0 ? 'amber' : 'emerald'}
          />
          <KPICard
            title="Critical Units"
            value={kpis.critical_units}
            unit="units"
            icon={<Flame className="w-4 h-4" />}
            accentColor={kpis.critical_units > 0 ? 'rose' : 'emerald'}
          />
          <KPICard
            title="Avg Temp"
            value={kpis.avg_temp.toFixed(1)}
            unit="°C"
            icon={<Thermometer className="w-4 h-4" />}
            accentColor="teal"
          />
          <KPICard
            title="Avg Spoilage"
            value={`${Math.min(100, Math.max(0, kpis.avg_spoilage)).toFixed(1)}%`}
            icon={<Activity className="w-4 h-4" />}
            accentColor="purple"
          />
          <KPICard
            title="Total Energy"
            value={kpis.total_energy.toFixed(1)}
            unit="kWh"
            icon={<Zap className="w-4 h-4" />}
            accentColor="amber"
          />
          <KPICard
            title="RL Interventions"
            value={kpis.rl_interventions}
            unit="decisions"
            icon={<Cpu className="w-4 h-4" />}
            accentColor="indigo"
          />
        </div>

        {/* Multi-Unit Cards (Unit | Product | Temp | Humidity | Spoilage | Energy | Risk | RL Action) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Multi-Unit Fleet Overview (15 Real-World Products)</h3>
              <p className="text-xs text-slate-500">Click any unit card to focus live charts and inspect Q-learning decisions</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Total Monitored Units: {units.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {units.map((u) => {
              const isSelected = selectedUnit?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUnitId(u.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        {u.unit_id.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-none">{u.unit_id}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">{u.unit_type}</span>
                      </div>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Product:</span>
                      <strong className="text-slate-800">{u.product_name}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Temperature:</span>
                      <span className="font-bold text-slate-900 mono-num">
                        {u.current_temp.toFixed(2)} °C{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          ({u.safe_temp_min}° to {u.safe_temp_max}°)
                        </span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Humidity:</span>
                      <span className="font-semibold text-slate-800 mono-num">{u.current_humidity.toFixed(1)} %</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Spoilage Index:</span>
                      <span className={`font-bold mono-num ${u.current_spoilage > 20 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {Math.min(100, Math.max(0, u.current_spoilage)).toFixed(2)} %
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Energy Used:</span>
                      <span className="font-semibold text-slate-800 mono-num">{u.current_energy.toFixed(2)} kWh</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Risk Score:</span>
                      <span className="font-bold text-indigo-600 mono-num">{u.current_risk.toFixed(1)} / 100</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-slate-500">RL Action:</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100/70 text-indigo-800 border border-indigo-200/50">
                        {u.last_action || 'Maintain Cooling'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PROMINENT LIVE CHARTS (4 Key Time-Series Charts per spec) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Temperature vs Time */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Temperature vs Time</h4>
                <p className="text-xs text-slate-500">
                  Target: {selectedUnit?.safe_temp_min}°C to {selectedUnit?.safe_temp_max}°C ({selectedUnit?.product_name})
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                Unit: {selectedUnit?.unit_id}
              </span>
            </div>

            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="step" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Unit Temp (°C)"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Awaiting simulation steps... Start engine to stream data.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Spoilage vs Time */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Spoilage Accumulation vs Time</h4>
                <p className="text-xs text-slate-500">Dynamic bio-chemical degradation based on thermal deviation</p>
              </div>
              <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                Current: {Math.min(100, Math.max(0, selectedUnit?.current_spoilage || 0)).toFixed(2)}%
              </span>
            </div>

            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="spoilageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="step" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="spoilage"
                      name="Spoilage (%)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#spoilageGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Awaiting simulation steps...
                </div>
              )}
            </div>
          </div>

          {/* Chart 3: Energy vs Time */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Cumulative Energy Consumption vs Time</h4>
                <p className="text-xs text-slate-500">Cooling power expenditure (kWh) across discrete control steps</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Total: {selectedUnit?.current_energy.toFixed(2)} kWh
              </span>
            </div>

            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="step" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="energy"
                      name="Energy (kWh)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#energyGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Awaiting simulation steps...
                </div>
              )}
            </div>
          </div>

          {/* Chart 4: Cooling Actions vs Time */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Cooling Level & Actuation State vs Time</h4>
                <p className="text-xs text-slate-500">Discrete cooling state (0: Low/Decrease, 1: Maintain, 2: High/Increase)</p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">
                Level: {selectedUnit?.cooling_level} (
                {selectedUnit?.cooling_level === 0 ? 'Low' : selectedUnit?.cooling_level === 1 ? 'Med' : 'High'})
              </span>
            </div>

            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="step" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 2]} ticks={[0, 1, 2]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar
                      dataKey="cooling_level"
                      name="Cooling Level (0/1/2)"
                      fill="#0d9488"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Awaiting simulation steps...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
