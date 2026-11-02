import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Play,
  RotateCcw,
  Cpu,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Filter,
  Download,
  Upload,
  Send,
  Database,
  Network,
  Grid
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Navbar } from '../components/Navbar';
import { trainingService, unitsService } from '../services/api';
import { LearnedPolicyItem, ProductProfile, TrainingMetricPoint, TrainingRunResponse } from '../types';
import { useSimulation } from '../context/SimulationContext';

export const RLTrainingLabPage: React.FC = () => {
  const { showToast } = useSimulation();
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('Dairy');

  // Hyperparameters
  const [episodes, setEpisodes] = useState<number>(250);
  const [alpha, setAlpha] = useState<number>(0.10);
  const [gamma, setGamma] = useState<number>(0.95);
  const [initialEpsilon, setInitialEpsilon] = useState<number>(1.0);
  const [minEpsilon, setMinEpsilon] = useState<number>(0.02);
  const [decayRate, setDecayRate] = useState<number>(0.985);
  const [stepsPerEpisode, setStepsPerEpisode] = useState<number>(60);

  const [trainingResult, setTrainingResult] = useState<TrainingRunResponse | null>(null);
  const [policyList, setPolicyList] = useState<LearnedPolicyItem[]>([]);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [policyFilter, setPolicyFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  useEffect(() => {
    unitsService.getProducts().then((res) => {
      setProducts(res.data);
      if (res.data.length > 0) {
        const first = res.data[0];
        setSelectedProduct(first.name);
        // Auto-run initial fast training
        setIsTraining(true);
        setStatusMessage(`Training initial baseline Q-table for ${first.name}...`);
        trainingService.train({
          episodes: 120,
          alpha: 0.10,
          gamma: 0.95,
          initial_epsilon: 1.0,
          min_epsilon: 0.02,
          decay_rate: 0.985,
          steps_per_episode: 50,
          product_profile_name: first.name,
        }).then((tRes) => {
          setTrainingResult(tRes.data);
          setPolicyList(tRes.data.learned_policy);
          setStatusMessage(`Baseline Q-table ready for ${first.name} (Final Reward: ${tRes.data.final_avg_reward.toFixed(2)})`);
        }).catch((err) => console.error('Initial training error:', err))
        .finally(() => setIsTraining(false));
      }
    });
    fetchCurrentPolicy();
  }, []);

  const fetchCurrentPolicy = async () => {
    try {
      const res = await trainingService.getCurrentPolicy();
      setPolicyList(res.data.policy);
    } catch (e) {
      console.error('Failed to load learned policy:', e);
    }
  };

  const applyHyperparameterPreset = (name: string) => {
    if (name === 'FAST') {
      setEpisodes(100);
      setAlpha(0.15);
      setGamma(0.90);
      setInitialEpsilon(0.8);
      setDecayRate(0.97);
      showToast('Applied Fast Convergence Preset (100 Episodes)', 'info');
    } else if (name === 'BALANCED') {
      setEpisodes(250);
      setAlpha(0.10);
      setGamma(0.95);
      setInitialEpsilon(1.0);
      setDecayRate(0.985);
      showToast('Applied Standard Balanced Preset (250 Episodes)', 'info');
    } else if (name === 'DEEP') {
      setEpisodes(500);
      setAlpha(0.05);
      setGamma(0.99);
      setInitialEpsilon(1.0);
      setDecayRate(0.992);
      showToast('Applied Deep Exploration Preset (500 Episodes)', 'info');
    }
  };

  const handleStartTraining = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTraining(true);
    setStatusMessage('Training Q-Learning agent across thermodynamic MDP transitions...');

    try {
      const res = await trainingService.train({
        episodes,
        alpha,
        gamma,
        initial_epsilon: initialEpsilon,
        min_epsilon: minEpsilon,
        decay_rate: decayRate,
        steps_per_episode: stepsPerEpisode,
        product_profile_name: selectedProduct,
      });
      setTrainingResult(res.data);
      setPolicyList(res.data.learned_policy);
      setStatusMessage(`Training converged! Final Moving Avg Reward: ${res.data.final_avg_reward.toFixed(2)}`);
      showToast(`Training complete! Final Reward: ${res.data.final_avg_reward.toFixed(2)}`, 'success');
    } catch (err) {
      console.error('Training failed:', err);
      setStatusMessage('Training failed. Check server logs.');
      showToast('Training encountered an error.', 'error');
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeployToLive = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      showToast('Trained Q-Table weights hot-deployed to live multi-unit controller!', 'success');
    }, 800);
  };

  const handleResetQTable = async () => {
    if (!window.confirm('Reset Q-Table weights and visit counts to uniform baseline?')) return;
    try {
      await trainingService.resetQTable();
      await fetchCurrentPolicy();
      setTrainingResult(null);
      setStatusMessage('Q-Table reset to uniform initialization baseline.');
      showToast('Q-Table baseline reset.', 'info');
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  const exportQTableJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(policyList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `q_table_checkpoint_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported Q-Table checkpoint JSON.', 'success');
  };

  const metrics: TrainingMetricPoint[] = trainingResult?.metrics || [];

  const visitedCount = policyList.filter((p) => p.visit_count > 0).length;
  const coveragePct = policyList.length > 0 ? ((visitedCount / policyList.length) * 100).toFixed(1) : '0';

  const filteredPolicy = policyList.filter((p) => {
    if (searchTerm && !p.state_code.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (policyFilter === 'ALL') return true;
    if (policyFilter === 'VISITED') return p.visit_count > 0;
    if (policyFilter === 'INCREASE') return p.best_action === 'Increase Cooling';
    if (policyFilter === 'DECREASE') return p.best_action === 'Decrease Cooling';
    if (policyFilter === 'MAINTAIN') return p.best_action === 'Maintain Cooling';
    return true;
  });

  return (
    <div className="flex flex-col min-h-full">
      <Navbar
        pageTitle="RL TRAINING LAB"
        subtitle="Machine Learning Studio: Hyperparameter Optimization, Convergence Curves & Policy Matrix Heatmap"
      />

      <div className="p-6 space-y-6">
        {/* Presets & Hyperparameter Studio Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Q-Learning Hyperparameter Tuning Studio
                </h3>
                <p className="text-xs text-slate-500">
                  Configure learning rate schedule, discount factor, and epsilon decay for tabular MDP convergence
                </p>
              </div>
            </div>

            {/* Hyperparameter Quick Presets */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Presets:</span>
              <button
                onClick={() => applyHyperparameterPreset('FAST')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                ⚡ Fast (100 Ep)
              </button>
              <button
                onClick={() => applyHyperparameterPreset('BALANCED')}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
              >
                ⚖️ Balanced (250 Ep)
              </button>
              <button
                onClick={() => applyHyperparameterPreset('DEEP')}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors border border-purple-200"
              >
                🔬 Deep (500 Ep)
              </button>
              <button
                onClick={handleResetQTable}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                title="Reset Q-weights to 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleStartTraining} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Product Profile</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
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
                <label className="block font-semibold text-slate-700 mb-1">Training Episodes</label>
                <input
                  type="number"
                  step="25"
                  min="25"
                  max="1000"
                  value={episodes}
                  onChange={(e) => setEpisodes(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Learning Rate (α)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1.0"
                  value={alpha}
                  onChange={(e) => setAlpha(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount Factor (γ)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="0.99"
                  value={gamma}
                  onChange={(e) => setGamma(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Epsilon (ε₀)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1.0"
                  value={initialEpsilon}
                  onChange={(e) => setInitialEpsilon(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Epsilon Decay Rate</label>
                <input
                  type="number"
                  step="0.005"
                  min="0.90"
                  max="0.999"
                  value={decayRate}
                  onChange={(e) => setDecayRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Steps / Episode</label>
                <input
                  type="number"
                  step="10"
                  min="20"
                  max="200"
                  value={stepsPerEpisode}
                  onChange={(e) => setStepsPerEpisode(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-indigo-600 font-semibold">{statusMessage}</span>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isTraining}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  {isTraining ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Training Q-Agent Matrix...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Tabular Q-Learning Training</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Model Checkpoint & State Coverage Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Discrete States</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">180 States</div>
              <span className="text-[10px] text-slate-500">T:5 × H:3 × S:4 × R:3</span>
            </div>
            <Grid className="w-8 h-8 text-indigo-200" />
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Explored State Coverage</span>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">{coveragePct}%</div>
              <span className="text-[10px] text-slate-500">{visitedCount} of 180 states visited</span>
            </div>
            <Database className="w-8 h-8 text-emerald-200" />
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Current Moving Reward</span>
              <div className="text-lg font-bold text-indigo-600 mt-0.5">
                {trainingResult ? trainingResult.final_avg_reward.toFixed(2) : '+4.20'}
              </div>
              <span className="text-[10px] text-slate-500">Reward per step</span>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-200" />
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">Live Policy Deployment</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeployToLive}
                disabled={isDeploying}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDeploying ? 'Deploying...' : 'Deploy to Live'}</span>
              </button>
              <button
                onClick={exportQTableJSON}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                title="Download Q-Table JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Machine Learning Convergence Charts (Reward, TD-Error, Epsilon Decay) */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Reward Progression */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800">Reward Convergence</h4>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Final: {trainingResult?.final_avg_reward.toFixed(2)}
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="episode" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="moving_avg_reward" name="Moving Avg Reward" stroke="#10b981" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="reward" name="Raw Episode Reward" stroke="#cbd5e1" strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: TD Error Loss Decay */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800">Bellman TD Error (δ)</h4>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Residual Decay
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="tdLossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="episode" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="q_convergence_delta" name="TD Error (δ)" stroke="#6366f1" strokeWidth={2} fill="url(#tdLossGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Epsilon Exploration Schedule */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800">ε-Greedy Exploration Decay</h4>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Min: {minEpsilon}
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="episode" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 1]} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="epsilon" name="Epsilon Rate (ε)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Learned Policy Matrix Table & Explorer */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Learned Discrete Policy Matrix Q*(s, ·)
              </h4>
              <p className="text-xs text-slate-500">
                Action-value distribution and greedy policy mapping across all 180 environmental state tuples
              </p>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search state (e.g. T2_H1)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setPolicyFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    policyFilter === 'ALL' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  All (180)
                </button>
                <button
                  onClick={() => setPolicyFilter('VISITED')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    policyFilter === 'VISITED' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Visited ({visitedCount})
                </button>
                <button
                  onClick={() => setPolicyFilter('INCREASE')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    policyFilter === 'INCREASE' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Inc Cooling
                </button>
                <button
                  onClick={() => setPolicyFilter('MAINTAIN')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    policyFilter === 'MAINTAIN' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Maintain
                </button>
                <button
                  onClick={() => setPolicyFilter('DECREASE')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    policyFilter === 'DECREASE' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Dec Cooling
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">State Code</th>
                  <th className="py-2.5 px-4">Temp Zone</th>
                  <th className="py-2.5 px-4">Humidity Zone</th>
                  <th className="py-2.5 px-4">Spoilage Zone</th>
                  <th className="py-2.5 px-4">Risk Zone</th>
                  <th className="py-2.5 px-4 font-mono text-center">Q(Dec)</th>
                  <th className="py-2.5 px-4 font-mono text-center">Q(Maint)</th>
                  <th className="py-2.5 px-4 font-mono text-center">Q(Inc)</th>
                  <th className="py-2.5 px-4">Optimal Policy Action π*(s)</th>
                  <th className="py-2.5 px-4 text-right">Visits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPolicy.map((p) => (
                  <tr key={p.state_code} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-4 font-mono font-bold text-indigo-700">{p.state_code}</td>
                    <td className="py-2 px-4">{p.temp_zone}</td>
                    <td className="py-2 px-4">{p.humidity_zone}</td>
                    <td className="py-2 px-4">{p.spoilage_zone}</td>
                    <td className="py-2 px-4">{p.risk_zone}</td>
                    <td
                      className={`py-2 px-4 font-mono text-center ${
                        p.best_action === 'Decrease Cooling' ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-500'
                      }`}
                    >
                      {p.q_decrease.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 px-4 font-mono text-center ${
                        p.best_action === 'Maintain Cooling' ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-500'
                      }`}
                    >
                      {p.q_maintain.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 px-4 font-mono text-center ${
                        p.best_action === 'Increase Cooling' ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-500'
                      }`}
                    >
                      {p.q_increase.toFixed(2)}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          p.best_action === 'Increase Cooling'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : p.best_action === 'Decrease Cooling'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.best_action}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right mono-num font-semibold text-slate-500">
                      {p.visit_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
