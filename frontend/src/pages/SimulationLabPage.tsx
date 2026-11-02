import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Zap,
  AlertTriangle,
  Layers,
  Thermometer,
  ShieldAlert,
  Flame,
  Activity,
  Sliders,
  Sparkles,
  ArrowRight,
  Truck,
  DoorOpen,
  BatteryWarning,
  Snowflake,
  FileCheck,
  Download,
  Gauge
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Navbar } from '../components/Navbar';
import { ThreeColdStorageDigitalTwin } from '../components/ThreeColdStorageDigitalTwin';
import { simulationService, unitsService } from '../services/api';
import { ProductProfile, SimulationRunResult, SimulationStep } from '../types';
import { useSimulation } from '../context/SimulationContext';

export const SimulationLabPage: React.FC = () => {
  const { selectedUnit, injectDisturbance } = useSimulation();
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('Pasteurized Milk & Dairy');
  const [initialTemp, setInitialTemp] = useState<number>(3.0);
  const [initialHumidity, setInitialHumidity] = useState<number>(70.0);
  const [ambientTemp, setAmbientTemp] = useState<number>(32.0);
  const [coolingCapacity, setCoolingCapacity] = useState<number>(100.0);
  const [duration, setDuration] = useState<number>(100);
  const [disturbanceIntensity, setDisturbanceIntensity] = useState<number>(5.0);
  const [strategy, setStrategy] = useState<'Q-Learning' | 'Fixed Cooling Rule' | 'Random Policy'>('Q-Learning');

  // Simulation execution state
  const [simResult, setSimResult] = useState<SimulationRunResult | null>(null);
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);
  const [twinMode, setTwinMode] = useState<'live' | 'replay'>('live');

  // Time-Step Forensic Replay Scrubber
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(140);

  useEffect(() => {
    unitsService.getProducts().then((res) => {
      setProducts(res.data);
      if (res.data.length > 0) {
        const first = res.data[0];
        setSelectedProduct(first.name);
        setInitialTemp(first.optimum_temp);
        // Auto-run baseline simulation for instant forensic replay availability
        simulationService.runCustom({
          product_profile_name: first.name,
          initial_temp: first.optimum_temp,
          initial_humidity: 70.0,
          ambient_temp: 32.0,
          cooling_capacity: 100.0,
          duration_steps: 100,
          strategy: 'Q-Learning',
          disturbance_intensity: 5.0,
          include_disturbances: true,
        }).then((simRes) => {
          setSimResult(simRes.data);
          setReplayIndex(0);
        }).catch((err) => console.error('Initial sim error:', err));
      }
    });
  }, []);

  const handleProductChange = (name: string) => {
    setSelectedProduct(name);
    const p = products.find((prod) => prod.name === name);
    if (p) {
      setInitialTemp(p.optimum_temp);
      // Auto-run simulation on product change and animate
      simulationService.runCustom({
        product_profile_name: name,
        initial_temp: p.optimum_temp,
        initial_humidity: initialHumidity,
        ambient_temp: ambientTemp,
        cooling_capacity: coolingCapacity,
        duration_steps: duration,
        strategy: strategy,
        disturbance_intensity: disturbanceIntensity,
        include_disturbances: true,
      }).then((simRes) => {
        setSimResult(simRes.data);
        setTwinMode('replay');
        setReplayIndex(0);
        setIsReplaying(true);
      }).catch((err) => console.error('Sim error on product change:', err));
    }
  };

  const applyStressBlueprint = (
    productName: string,
    initT: number,
    ambT: number,
    coolCap: number,
    stressLevel: number,
    strat: 'Q-Learning' | 'Fixed Cooling Rule' | 'Random Policy'
  ) => {
    setSelectedProduct(productName);
    setInitialTemp(initT);
    setAmbientTemp(ambT);
    setCoolingCapacity(coolCap);
    setDisturbanceIntensity(stressLevel);
    setStrategy(strat);

    setIsRunningSim(true);
    simulationService.runCustom({
      product_profile_name: productName,
      initial_temp: initT,
      initial_humidity: initialHumidity,
      ambient_temp: ambT,
      cooling_capacity: coolCap,
      duration_steps: duration,
      strategy: strat,
      disturbance_intensity: stressLevel,
      include_disturbances: true,
    }).then((simRes) => {
      setSimResult(simRes.data);
      setTwinMode('replay');
      setReplayIndex(0);
      setIsReplaying(true);
    }).catch((err) => console.error('Blueprint sim error:', err))
    .finally(() => setIsRunningSim(false));
  };

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsRunningSim(true);
    setIsReplaying(false);

    try {
      const res = await simulationService.runCustom({
        product_profile_name: selectedProduct,
        initial_temp: initialTemp,
        initial_humidity: initialHumidity,
        ambient_temp: ambientTemp,
        cooling_capacity: coolingCapacity,
        duration_steps: duration,
        strategy: strategy,
        disturbance_intensity: disturbanceIntensity,
        include_disturbances: true,
      });
      setSimResult(res.data);
      setTwinMode('replay');
      setReplayIndex(0);
      setIsReplaying(true);
    } catch (err) {
      console.error('Custom simulation failed:', err);
    } finally {
      setIsRunningSim(false);
    }
  };

  // Replay Timer
  useEffect(() => {
    let timer: any = null;
    if (isReplaying && simResult) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= simResult.steps.length - 1) {
            setIsReplaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, replaySpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isReplaying, simResult, replaySpeed]);

  // Synchronize when the user changes the active unit in the global Navbar
  useEffect(() => {
    if (selectedUnit && selectedUnit.product_name) {
      setSelectedProduct(selectedUnit.product_name);
      setInitialTemp(selectedUnit.current_temp || 4.0);
      setInitialHumidity(selectedUnit.current_humidity || 70.0);
    }
  }, [selectedUnit?.id, selectedUnit?.product_name]);

  const currentStepData: SimulationStep | null =
    simResult && simResult.steps.length > 0 ? simResult.steps[replayIndex] : null;

  const visibleSteps = simResult ? simResult.steps.slice(0, replayIndex + 1) : [];

  const chartData = visibleSteps.map((s) => ({
    step: `T+${s.step_index}`,
    temperature: s.temperature,
    humidity: s.humidity,
    spoilage: Number((s.spoilage > 1 ? s.spoilage : s.spoilage * 100).toFixed(2)),
    energy: Number(s.energy.toFixed(2)),
    cooling_level: s.cooling_level,
    reward: Number(s.reward.toFixed(2)),
    action_name: s.action_name,
    disturbance: s.disturbance_type,
  }));

  const activeProductProfile = products.find((p) => p.name === selectedProduct);

  // Compute Cargo Quality Preservation Grade
  const calculateGrade = () => {
    if (!simResult) return { grade: 'A+', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Optimal Quality' };
    const spoil = simResult.final_spoilage > 1 ? simResult.final_spoilage : simResult.final_spoilage * 100;
    if (spoil < 1.0) return { grade: 'A+', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Pristine Commercial Grade' };
    if (spoil < 3.0) return { grade: 'A', color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Acceptable Shelf Life' };
    if (spoil < 8.0) return { grade: 'B', color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Mild Quality Loss' };
    if (spoil < 15.0) return { grade: 'C', color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Critical Spoilage Warning' };
    return { grade: 'F', color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Severe Bacterial Condemnation' };
  };

  const gradeInfo = calculateGrade();

  const exportReportJSON = () => {
    if (!simResult) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(simResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `forensic_report_${simResult.run_code}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Determine current warehouse display state (Live vs Replay)
  const isLive = twinMode === 'live';
  const displayTemp = isLive 
    ? (selectedUnit?.current_temp ?? initialTemp) 
    : (currentStepData?.temperature ?? initialTemp);
  const displayHumidity = isLive 
    ? (selectedUnit?.current_humidity ?? initialHumidity) 
    : (currentStepData?.humidity ?? initialHumidity);
  const displaySpoilage = isLive
    ? Math.min(100, Math.max(0, selectedUnit?.current_spoilage ?? 0))
    : currentStepData
    ? Math.min(100, Math.max(0, currentStepData.spoilage))
    : 0;
  const displayCooling = isLive ? (selectedUnit?.cooling_level ?? 1) : (currentStepData?.cooling_level ?? 1);
  const displayAction = isLive ? (selectedUnit?.last_action ?? 'Maintain Cooling') : (currentStepData?.action_name ?? 'Maintain Cooling');
  const displayDisturbance = isLive ? (selectedUnit?.disturbance ?? null) : (currentStepData?.disturbance_type ?? null);
  const activeTwinProduct = isLive ? (selectedUnit?.product_name || selectedProduct) : selectedProduct;

  return (
    <div className="flex flex-col min-h-full">
      <Navbar
        pageTitle="SIMULATION LAB"
        subtitle="3D Thermodynamic Digital Twin: Real-World Stress Scenarios & Forensic Time-Step Replay"
      />

      <div className="p-6 space-y-6">
        {/* 1. Interactive 3D WebGL Three.js Digital Twin of Cold Storage Warehouse */}
        <ThreeColdStorageDigitalTwin
          productName={activeTwinProduct}
          temperature={displayTemp}
          safeMin={activeProductProfile?.safe_temp_min ?? (isLive ? (selectedUnit?.safe_temp_min ?? 2.0) : 2.0)}
          safeMax={activeProductProfile?.safe_temp_max ?? (isLive ? (selectedUnit?.safe_temp_max ?? 4.0) : 6.0)}
          humidity={displayHumidity}
          spoilagePercent={displaySpoilage}
          coolingLevel={displayCooling}
          coolingCapacity={coolingCapacity}
          actionName={displayAction}
          disturbanceType={displayDisturbance}
          onInjectDisturbance={(type) => injectDisturbance(type)}
          isLiveMode={isLive}
          activeUnitId={selectedUnit?.id || 'WH-DAIRY-01'}
          onToggleMode={(mode) => setTwinMode(mode)}
          currentStep={replayIndex}
          totalSteps={simResult?.steps.length ?? 100}
        />

        {/* 2. Real-World Physical Stress Blueprint Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Preset Physical Hazard & Stress Blueprints
            </h3>
            <span className="text-[11px] text-slate-400">One-click thermodynamic stress tests</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => applyStressBlueprint('Pasteurized Milk & Dairy', 4.0, 42.0, 100.0, 8.0, 'Q-Learning')}
              className="p-3 bg-white hover:bg-rose-50/50 rounded-xl border border-slate-200 hover:border-rose-300 text-left transition-all shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100/60 text-rose-700">
                  Heatwave (+42°C)
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Desert Highway Transit</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">High external thermal flux on dairy cargo</p>
            </button>

            <button
              onClick={() => applyStressBlueprint('Fresh Strawberries & Berries', 10.0, 30.0, 100.0, 5.0, 'Q-Learning')}
              className="p-3 bg-white hover:bg-amber-50/50 rounded-xl border border-slate-200 hover:border-amber-300 text-left transition-all shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100/60 text-amber-700">
                  Door Propped Open
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Dock Loading Mishap</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Sudden convective warm air intrusion</p>
            </button>

            <button
              onClick={() => applyStressBlueprint('Pasteurized Milk & Dairy', 4.0, 32.0, 50.0, 5.0, 'Q-Learning')}
              className="p-3 bg-white hover:bg-purple-50/50 rounded-xl border border-slate-200 hover:border-purple-300 text-left transition-all shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
                  <BatteryWarning className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100/60 text-purple-700">
                  50% Power Drop
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Compressor Brownout</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Reefer cooling capacity degradation</p>
            </button>

            <button
              onClick={() => applyStressBlueprint('Ice Cream & Gelato', -18.0, 28.0, 100.0, 5.0, 'Q-Learning')}
              className="p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-300 text-left transition-all shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                  <Snowflake className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/60 text-blue-700">
                  Sub-Zero (-18°C)
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Frozen Meat / Vaccine Run</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Sub-zero thermodynamic stability audit</p>
            </button>
          </div>
        </div>

        {/* 3. Digital Twin Physics Configuration Form */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Digital Twin Physical Parameters
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Arrhenius Spoilage Kinetics & Thermal Transfer Solver
            </span>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Cargo Temp</label>
                <input
                  type="number"
                  step="0.5"
                  value={initialTemp}
                  onChange={(e) => setInitialTemp(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ambient Weather (°C)</label>
                <input
                  type="number"
                  step="1"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cooling Capacity (%)</label>
                <input
                  type="number"
                  step="5"
                  min="20"
                  max="150"
                  value={coolingCapacity}
                  onChange={(e) => setCoolingCapacity(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sim Duration (Steps)</label>
                <input
                  type="number"
                  step="10"
                  min="30"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disturbance Stress</label>
                <select
                  value={disturbanceIntensity}
                  onChange={(e) => setDisturbanceIntensity(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={3.0}>Mild (+3°C Heat Influx)</option>
                  <option value={5.0}>Moderate (+5°C Heat Influx)</option>
                  <option value={8.0}>Severe (+8°C Heat Influx)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Control Strategy</label>
                <select
                  value={strategy}
                  onChange={(e: any) => setStrategy(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-indigo-300 rounded-lg text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50/50"
                >
                  <option value="Q-Learning">Q-Learning (Adaptive RL)</option>
                  <option value="Fixed Cooling Rule">Fixed Cooling Rule</option>
                  <option value="Random Policy">Random Policy</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isRunningSim}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-indigo-200 transition-all disabled:opacity-50"
              >
                {isRunningSim ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Simulating Physical Dynamics...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Execute Digital Twin Simulation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 4. Forensic Replay Scrubber & Asset Digital Twin Controls */}
        {simResult && (
          <div className="space-y-4">
            {/* Scrubber Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Forensic Time Replay:</span>
                <button
                  onClick={() => {
                    setTwinMode('replay');
                    setIsReplaying(!isReplaying);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${
                    isReplaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isReplaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isReplaying ? 'Pause Replay' : 'Play Replay'}</span>
                </button>

                <button
                  onClick={() => {
                    setTwinMode('replay');
                    setIsReplaying(false);
                    setReplayIndex((prev) => Math.min(simResult.steps.length - 1, prev + 1));
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  title="Step Forward"
                >
                  <FastForward className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setTwinMode('replay');
                    setIsReplaying(false);
                    setReplayIndex(0);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  title="Reset to Step 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-mono font-bold text-slate-600">
                  Step {replayIndex} / {simResult.steps.length - 1}
                </span>
              </div>

              {/* Slider Scrubber */}
              <div className="flex-1 w-full flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={simResult.steps.length - 1}
                  value={replayIndex}
                  onChange={(e) => {
                    setTwinMode('replay');
                    setIsReplaying(false);
                    setReplayIndex(Number(e.target.value));
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <button
                onClick={exportReportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export JSON Audit</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. Physical Time-Domain Analytics & Quality Report */}
        {simResult && (
          <div className="space-y-6">
            {/* Post-Simulation Asset Health Certificate Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${gradeInfo.bg} ${gradeInfo.color}`}>
                  {gradeInfo.grade}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">Cargo Preservation Grade: {gradeInfo.grade}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-indigo-200 font-mono">
                      {simResult.run_code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {gradeInfo.desc} | Total Energy: <strong className="text-amber-400">{simResult.total_energy.toFixed(2)} kWh</strong> | Unsafe Exposure: <strong className="text-rose-400">{simResult.unsafe_duration_steps} steps</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400">Total Interventions</span>
                  <div className="text-sm font-bold text-emerald-400">{simResult.intervention_count} actions</div>
                </div>
                <div className="h-8 w-[1px] bg-white/20" />
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400">Avg Temp Deviation</span>
                  <div className="text-sm font-bold text-indigo-300">±{simResult.avg_temp_deviation.toFixed(2)} °C</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Thermal Dynamic Trajectory */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Physical Thermal Trajectory vs Boundaries</h4>
                    <p className="text-xs text-slate-500">
                      Safe Band: {activeProductProfile?.safe_temp_min}°C to {activeProductProfile?.safe_temp_max}°C
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    Strategy: {simResult.strategy}
                  </span>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="step" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        name="Unit Temperature (°C)"
                        stroke="#4f46e5"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Spoilage Kinetics Degradation Curve */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Arrhenius Spoilage Kinetics Accumulation</h4>
                    <p className="text-xs text-slate-500">
                      Final Spoilage: {(simResult.final_spoilage > 1 ? simResult.final_spoilage : simResult.final_spoilage * 100).toFixed(2)}% | Sensitivity: {activeProductProfile?.spoilage_sensitivity}x
                    </p>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="simSpoilGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="step" tick={{ fontSize: 9 }} stroke="#94a3b8" />
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
                        fill="url(#simSpoilGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
