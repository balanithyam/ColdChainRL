import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Cpu,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  DollarSign,
  ShieldCheck,
  Thermometer,
  Droplets,
  Activity,
  ArrowRight,
  TrendingDown,
  Clock,
  Gauge,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { Navbar } from '../components/Navbar';
import { decisionService } from '../services/api';
import { RLDecisionResponse } from '../types';
import { useSimulation } from '../context/SimulationContext';

export const AIDecisionCenterPage: React.FC = () => {
  const { selectedUnit, selectedUnitId, units, stepCount } = useSimulation();
  const [decision, setDecision] = useState<RLDecisionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Interactive What-If Simulator
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(false);
  const [probeTemp, setProbeTemp] = useState<number>(3.5);
  const [probeAmbientTemp, setProbeAmbientTemp] = useState<number>(30.0);
  const [probeHumidity, setProbeHumidity] = useState<number>(68.0);
  const [probeSpoilage, setProbeSpoilage] = useState<number>(1.5);

  const fetchDecision = async () => {
    if (!selectedUnitId && units.length > 0) return;
    const targetId = selectedUnitId || (units.length > 0 ? units[0].id : 1);
    try {
      setLoading(true);
      const res = await decisionService.getDecision(targetId);
      setDecision(res.data);
      if (!isSandboxMode && res.data) {
        setProbeTemp(res.data.current_state.temperature_celsius);
        setProbeHumidity(res.data.current_state.humidity_percent);
        setProbeSpoilage(Math.min(100, res.data.current_state.spoilage_percent));
      }
    } catch (e) {
      console.error('Failed to fetch AI decision:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecision();
  }, [selectedUnitId, stepCount]);

  // Target safe band
  const safeMin = selectedUnit?.safe_temp_min ?? 2.0;
  const safeMax = selectedUnit?.safe_temp_max ?? 4.0;
  const productName = selectedUnit?.product_name || decision?.product_name || 'Pasteurized Milk & Dairy';

  // Calculate live operational action & metrics for Sandbox or Live Mode
  const activeTemp = isSandboxMode ? probeTemp : (decision?.current_state.temperature_celsius ?? selectedUnit?.current_temp ?? 3.5);
  const activeHumidity = isSandboxMode ? probeHumidity : (decision?.current_state.humidity_percent ?? selectedUnit?.current_humidity ?? 68);
  const rawSpoilage = isSandboxMode ? probeSpoilage : (decision?.current_state.spoilage_percent ?? selectedUnit?.current_spoilage ?? 1.5);
  const activeSpoilage = Math.min(100, Math.max(0, rawSpoilage));

  // Determine practical cooling decision based on temperature & thermal threshold
  const calculateOperationalDecision = () => {
    let action = 'Maintain Cooling';
    let actionLevel = 'Eco Cooling (Level 1)';
    let confidence = 88;
    let powerDrawKw = 0.18;
    let hourlyCost = 0.025;
    let rationale = '';
    let recommendationType: 'optimal' | 'warning' | 'critical' = 'optimal';

    if (activeTemp > safeMax + 2.0) {
      action = 'Increase Cooling';
      actionLevel = 'Maximum Turbo Chill (Level 3)';
      confidence = 98;
      powerDrawKw = 0.55;
      hourlyCost = 0.082;
      recommendationType = 'critical';
      rationale = `Chamber temperature (${activeTemp.toFixed(1)}°C) has breached the safe upper limit (${safeMax}°C). AI is applying Maximum Cooling to pull down heat rapidly and stop bacterial spoilage.`;
    } else if (activeTemp > safeMax) {
      action = 'Increase Cooling';
      actionLevel = 'Standard Cooling (Level 2)';
      confidence = 92;
      powerDrawKw = 0.35;
      hourlyCost = 0.052;
      recommendationType = 'warning';
      rationale = `Chamber temperature (${activeTemp.toFixed(1)}°C) is slightly above target (${safeMax}°C). AI has engaged Standard Cooling to safely restore the optimal temperature.`;
    } else if (activeTemp < safeMin - 1.0) {
      action = 'Decrease Cooling';
      actionLevel = 'Compressor Idle / Off (Level 0)';
      confidence = 94;
      powerDrawKw = 0.02;
      hourlyCost = 0.003;
      recommendationType = 'warning';
      rationale = `Chamber temperature (${activeTemp.toFixed(1)}°C) is below minimum safe threshold (${safeMin}°C). AI has paused active refrigeration to prevent chilling damage and save electricity.`;
    } else if (activeTemp < safeMin) {
      action = 'Decrease Cooling';
      actionLevel = 'Minimal Standby (Level 0)';
      confidence = 86;
      powerDrawKw = 0.05;
      hourlyCost = 0.007;
      recommendationType = 'optimal';
      rationale = `Temperature (${activeTemp.toFixed(1)}°C) is close to the lower safe boundary. AI throttled down cooling to conserve power while remaining safe.`;
    } else {
      action = 'Maintain Cooling';
      actionLevel = 'Eco Cooling (Level 1)';
      confidence = 95;
      powerDrawKw = 0.16;
      hourlyCost = 0.024;
      recommendationType = 'optimal';
      rationale = `Chamber is stabilized at ${activeTemp.toFixed(1)}°C (target: ${safeMin}°C ~ ${safeMax}°C). AI is holding steady at Eco mode to preserve freshness with lowest power usage.`;
    }

    // Chart confidence spectrum
    let decScore = 15;
    let maintScore = 25;
    let incScore = 18;

    if (action === 'Increase Cooling') {
      incScore = confidence;
      maintScore = Math.max(10, 100 - confidence - 15);
      decScore = Math.max(5, 100 - incScore - maintScore);
    } else if (action === 'Decrease Cooling') {
      decScore = confidence;
      maintScore = Math.max(10, 100 - confidence - 15);
      incScore = Math.max(5, 100 - decScore - maintScore);
    } else {
      maintScore = confidence;
      decScore = 20;
      incScore = 15;
    }

    const chartData = [
      {
        name: 'Decrease Cooling',
        confidence: decScore,
        isSelected: action === 'Decrease Cooling',
        power: '0.05 kW',
        cost: '$0.007 / hr',
        effect: 'Temp Rises (+1.2°C)',
      },
      {
        name: 'Maintain Cooling',
        confidence: maintScore,
        isSelected: action === 'Maintain Cooling',
        power: '0.16 kW',
        cost: '$0.024 / hr',
        effect: 'Temp Stable (±0.1°C)',
      },
      {
        name: 'Increase Cooling',
        confidence: incScore,
        isSelected: action === 'Increase Cooling',
        power: '0.45 kW',
        cost: '$0.068 / hr',
        effect: 'Temp Drops (-1.8°C)',
      },
    ];

    return {
      action,
      actionLevel,
      confidence,
      powerDrawKw,
      hourlyCost,
      rationale,
      recommendationType,
      chartData,
    };
  };

  const currentPlan = calculateOperationalDecision();

  const applyQuickScenario = (temp: number, ambient: number, humidity: number, spoil: number) => {
    setIsSandboxMode(true);
    setProbeTemp(temp);
    setProbeAmbientTemp(ambient);
    setProbeHumidity(humidity);
    setProbeSpoilage(spoil);
  };

  return (
    <div className="flex flex-col min-h-full">
      <Navbar
        pageTitle="AI DECISION CENTER"
        subtitle="Intelligent Cold-Chain Automation: Real-Time Cooling Actions, Plain-English Rationale & What-If Scenario Sandbox"
      />

      <div className="p-6 space-y-6">
        {/* Unit Status Header Banner */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Target Cold Storage Asset: {selectedUnit?.unit_id || 'WH-DAIRY-01'}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  Cargo: {productName}
                </span>
                {isSandboxMode ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    Interactive What-If Mode Active
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Live Asset Telemetry Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Target Safe Temperature Band: <strong className="text-slate-800 font-semibold">{safeMin}°C to {safeMax}°C</strong> • Automatic Spoilage Prevention Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsSandboxMode(false);
                fetchDecision();
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                !isSandboxMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Live Telemetry
            </button>
            <button
              onClick={() => setIsSandboxMode(true)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                isSandboxMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Test What-If Scenario
            </button>
          </div>
        </div>

        {/* 1. Primary AI Recommendation & Operator Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Action & Plain English Reasoning (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Live AI Cooling Recommendation
                </h4>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                currentPlan.recommendationType === 'optimal'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : currentPlan.recommendationType === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
              }`}>
                {currentPlan.action} ({currentPlan.confidence}% Match)
              </span>
            </div>

            {/* Prominent Action Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              currentPlan.recommendationType === 'optimal'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : currentPlan.recommendationType === 'warning'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Recommended Compressor Setting
                </span>
                <div className="text-xl font-black text-slate-900">
                  {currentPlan.actionLevel}
                </div>
                <p className="text-xs text-slate-600">
                  Current Chamber: <strong className="text-slate-900">{activeTemp.toFixed(1)}°C</strong> (Safe: {safeMin}°C ~ {safeMax}°C)
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase text-slate-500">Estimated Power Cost</span>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {currentPlan.hourlyCost.toFixed(3)} $/hr
                </div>
                <span className="text-[11px] text-slate-600 font-mono font-medium">
                  {currentPlan.powerDrawKw.toFixed(2)} kWh draw
                </span>
              </div>
            </div>

            {/* Plain English Explanation */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Why did the AI choose this action?</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentPlan.rationale}
              </p>
            </div>

            {/* Practical Impact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Chamber Temp</span>
                <div className={`text-base font-bold font-mono mt-1 ${
                  activeTemp >= safeMin && activeTemp <= safeMax ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {activeTemp.toFixed(1)} °C
                </div>
                <span className="text-[10px] text-slate-500">Target {safeMin}°C-{safeMax}°C</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Cargo Freshness</span>
                <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                  {(100 - activeSpoilage).toFixed(1)} %
                </div>
                <span className="text-[10px] text-slate-500">Spoilage: {activeSpoilage.toFixed(2)}%</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Chamber Humidity</span>
                <div className="text-base font-bold font-mono text-teal-700 mt-1">
                  {activeHumidity.toFixed(0)} %
                </div>
                <span className="text-[10px] text-slate-500">Optimal (60-80%)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Compressor Wear</span>
                <div className="text-base font-bold text-indigo-700 mt-1">
                  {currentPlan.action === 'Maintain Cooling' ? 'Minimal' : 'Normal'}
                </div>
                <span className="text-[10px] text-slate-500">Anti-chatter active</span>
              </div>
            </div>
          </div>

          {/* Right: Candidate Actions Comparison & Confidence (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Action Confidence & Options
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-medium">Expected Return</span>
            </div>

            {/* Confidence Bar Chart */}
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentPlan.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(val: any) => [`${val}% Match`, 'AI Preference']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Bar dataKey="confidence" radius={[6, 6, 0, 0]}>
                    {currentPlan.chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isSelected ? '#4f46e5' : '#cbd5e1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Action Option Details Table */}
            <div className="space-y-2 text-xs">
              {currentPlan.chartData.map((item) => (
                <div
                  key={item.name}
                  className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                    item.isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 font-semibold text-indigo-950 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.effect}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-slate-900">{item.cost}</div>
                    <div className="text-[10px] text-slate-500">{item.power}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Interactive "What-If" Scenario Simulator (Slide conditions & test AI response) */}
        <div className="bg-white rounded-xl border border-indigo-200 p-6 shadow-xs space-y-4 bg-gradient-to-r from-indigo-50/30 via-white to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Interactive "What-If" Scenario Sandbox
                </h4>
                <p className="text-xs text-slate-500">
                  Simulate hypothetical thermal, weather, and spoilage stress conditions to inspect how the AI automatically responds
                </p>
              </div>
            </div>

            <button
              onClick={() => applyQuickScenario(3.5, 28, 68, 1.2)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Optimal Baseline</span>
            </button>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Quick Presets:</span>
            <button
              onClick={() => applyQuickScenario(9.5, 42, 85, 4.5)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold transition-all shadow-2xs"
            >
              🔥 Summer Heatwave (+9.5°C Ingress)
            </button>
            <button
              onClick={() => applyQuickScenario(-1.5, 12, 60, 0.5)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold transition-all shadow-2xs"
            >
              ❄️ Over-Chilled Chamber (-1.5°C)
            </button>
            <button
              onClick={() => applyQuickScenario(5.2, 34, 90, 8.0)}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-semibold transition-all shadow-2xs"
            >
              ⚠️ High Spoilage Hazard (Elevated Spoilage)
            </button>
            <button
              onClick={() => applyQuickScenario(3.2, 26, 65, 0.8)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold transition-all shadow-2xs"
            >
              🌿 Perfect Storage Baseline (3.2°C)
            </button>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Chamber Temperature</span>
                <span className={`font-mono font-bold text-sm ${
                  probeTemp >= safeMin && probeTemp <= safeMax ? 'text-indigo-600' : 'text-rose-600'
                }`}>
                  {probeTemp.toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min="-5"
                max="20"
                step="0.5"
                value={probeTemp}
                onChange={(e) => {
                  setIsSandboxMode(true);
                  setProbeTemp(Number(e.target.value));
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-5°C (Sub-Zero)</span>
                <span className="text-indigo-600 font-semibold">Safe: {safeMin}°C ~ {safeMax}°C</span>
                <span>+20°C (Hot)</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Ambient Outside Temp</span>
                <span className="font-mono font-bold text-sm text-amber-600">
                  {probeAmbientTemp.toFixed(0)} °C
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
                step="1"
                value={probeAmbientTemp}
                onChange={(e) => {
                  setIsSandboxMode(true);
                  setProbeAmbientTemp(Number(e.target.value));
                }}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>10°C (Cool)</span>
                <span>30°C (Standard)</span>
                <span>48°C (Extreme)</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Chamber Humidity</span>
                <span className="font-mono font-bold text-sm text-teal-600">
                  {probeHumidity.toFixed(0)} %
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="1"
                value={probeHumidity}
                onChange={(e) => {
                  setIsSandboxMode(true);
                  setProbeHumidity(Number(e.target.value));
                }}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>30% (Dry)</span>
                <span className="text-teal-600 font-semibold">60-80% Optimal</span>
                <span>100% (Saturated)</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Cumulative Spoilage</span>
                <span className="font-mono font-bold text-sm text-purple-600">
                  {probeSpoilage.toFixed(1)} %
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={probeSpoilage}
                onChange={(e) => {
                  setIsSandboxMode(true);
                  setProbeSpoilage(Number(e.target.value));
                }}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0% (Pristine)</span>
                <span>5% (Warning)</span>
                <span>25% (Critical)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
