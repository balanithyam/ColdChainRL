import React, { useState, useEffect } from 'react';
import {
  Scale,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Zap,
  Clock,
  ShieldCheck,
  BarChart2,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Navbar } from '../components/Navbar';
import { benchmarkService, unitsService } from '../services/api';
import { BenchmarkComparisonResponse, ProductProfile, StrategyBenchmarkResult } from '../types';

export const StrategyBenchmarkPage: React.FC = () => {
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('Pasteurized Milk & Dairy');
  const [initialTemp, setInitialTemp] = useState<number>(3.0);
  const [initialHumidity, setInitialHumidity] = useState<number>(70.0);
  const [ambientTemp, setAmbientTemp] = useState<number>(30.0);
  const [coolingCapacity, setCoolingCapacity] = useState<number>(100.0);
  const [duration, setDuration] = useState<number>(100);
  const [disturbanceIntensity, setDisturbanceIntensity] = useState<number>(5.0);

  const [benchmarkData, setBenchmarkData] = useState<BenchmarkComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    unitsService.getProducts().then((res) => {
      setProducts(res.data);
      if (res.data.length > 0) {
        const first = res.data[0];
        setSelectedProduct(first.name);
        setInitialTemp(first.optimum_temp);
        // Auto-run benchmark on mount
        setLoading(true);
        benchmarkService.runBenchmark({
          product_profile_name: first.name,
          initial_temp: first.optimum_temp,
          initial_humidity: 70.0,
          ambient_temp: 30.0,
          cooling_capacity: 100.0,
          duration_steps: 100,
          disturbance_intensity: 5.0,
          include_disturbances: true,
        }).then((bRes) => {
          setBenchmarkData(bRes.data);
        }).catch((err) => console.error('Initial benchmark error:', err))
        .finally(() => setLoading(false));
      }
    });
  }, []);

  const handleProductChange = (name: string) => {
    setSelectedProduct(name);
    const p = products.find((prod) => prod.name === name);
    if (p) {
      setInitialTemp(p.optimum_temp);
      setLoading(true);
      benchmarkService.runBenchmark({
        product_profile_name: name,
        initial_temp: p.optimum_temp,
        initial_humidity: initialHumidity,
        ambient_temp: ambientTemp,
        cooling_capacity: coolingCapacity,
        duration_steps: duration,
        disturbance_intensity: disturbanceIntensity,
        include_disturbances: true,
      }).then((bRes) => {
        setBenchmarkData(bRes.data);
      }).catch((err) => console.error('Benchmark product change error:', err))
      .finally(() => setLoading(false));
    }
  };

  const handleRunBenchmark = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await benchmarkService.runBenchmark({
        product_profile_name: selectedProduct,
        initial_temp: initialTemp,
        initial_humidity: initialHumidity,
        ambient_temp: ambientTemp,
        cooling_capacity: coolingCapacity,
        duration_steps: duration,
        disturbance_intensity: disturbanceIntensity,
        include_disturbances: true,
      });
      setBenchmarkData(res.data);
    } catch (err) {
      console.error('Benchmark execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const results: StrategyBenchmarkResult[] = benchmarkData?.results || [];

  // Comparison Bar Chart Datasets
  const spoilageChartData = results.map((r) => ({
    strategy: r.strategy,
    spoilage: Number((r.final_spoilage > 1 ? r.final_spoilage : r.final_spoilage * 100).toFixed(2)),
  }));

  const energyChartData = results.map((r) => ({
    strategy: r.strategy,
    energy: Number(r.total_energy.toFixed(2)),
  }));

  const recoveryChartData = results.map((r) => ({
    strategy: r.strategy,
    recoveryTime: r.recovery_time_steps,
    unsafeDuration: r.unsafe_duration_steps,
  }));

  const deviationChartData = results.map((r) => ({
    strategy: r.strategy,
    avgTempDeviation: Number(r.avg_temp_deviation.toFixed(2)),
    avgReward: Number(r.avg_reward.toFixed(2)),
  }));

  const strategyColors: Record<string, string> = {
    'Q-Learning': '#4f46e5',
    'Fixed Rule': '#f59e0b',
    'Random Policy': '#94a3b8',
  };

  return (
    <div className="flex flex-col min-h-full">
      <Navbar
        pageTitle="STRATEGY BENCHMARK"
        subtitle="Empirical Multi-Strategy Evaluation: Q-Learning vs. Fixed Heuristics vs. Random Exploration"
      />

      <div className="p-6 space-y-6">
        {/* Scenario Setup Banner */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Controlled Tri-Strategy Benchmark Matrix
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Identical Initial States & Disturbance Injections</span>
          </div>

          <form onSubmit={handleRunBenchmark} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
                <label className="block font-semibold text-slate-700 mb-1">Initial Temp (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={initialTemp}
                  onChange={(e) => setInitialTemp(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ambient Temp (°C)</label>
                <input
                  type="number"
                  step="1"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cooling Power (%)</label>
                <input
                  type="number"
                  step="5"
                  value={coolingCapacity}
                  onChange={(e) => setCoolingCapacity(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration (Steps)</label>
                <input
                  type="number"
                  step="10"
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
                  <option value={3.0}>Mild (+3°C Heat)</option>
                  <option value={5.0}>Moderate (+5°C Heat)</option>
                  <option value={8.0}>Severe (+8°C Stress)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-indigo-200 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing Tri-Policy Benchmark...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Comparative Benchmark</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* State: No result available - run benchmark */}
        {!benchmarkData && !loading && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-xs">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No result available — run benchmark</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Execute the benchmark suite above to generate empirical quantitative comparisons across Q-learning, Fixed Rule, and Random Policy.
            </p>
            <button
              onClick={() => handleRunBenchmark()}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-indigo-700"
            >
              Run Benchmark Now
            </button>
          </div>
        )}

        {/* Comparison Charts & Tables */}
        {benchmarkData && (
          <div className="space-y-6">
            {/* Quantitative Comparison Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Empirical Benchmark Metrics Table
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  Scenario: {benchmarkData.scenario.product_name} | {benchmarkData.scenario.duration_steps} Steps
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600">
                      <th className="py-3 px-4">Control Strategy</th>
                      <th className="py-3 px-4">Final Spoilage (%)</th>
                      <th className="py-3 px-4">Total Energy (kWh)</th>
                      <th className="py-3 px-4">Mean Temp Deviation (°C)</th>
                      <th className="py-3 px-4">Unsafe Duration (Steps)</th>
                      <th className="py-3 px-4">Recovery Time (Steps)</th>
                      <th className="py-3 px-4">Interventions</th>
                      <th className="py-3 px-4">Avg Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {results.map((r) => {
                      const isQLearn = r.strategy.includes('Q-Learning');
                      return (
                        <tr
                          key={r.strategy}
                          className={`hover:bg-slate-50 transition-colors ${
                            isQLearn ? 'bg-indigo-50/30 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: strategyColors[r.strategy] || '#64748b' }}
                              />
                              {r.strategy}
                            </div>
                          </td>
                          <td className="py-3 px-4 mono-num font-bold text-slate-900">
                            {(r.final_spoilage > 1 ? r.final_spoilage : r.final_spoilage * 100).toFixed(2)} %
                          </td>
                          <td className="py-3 px-4 mono-num text-slate-800">{r.total_energy.toFixed(2)} kWh</td>
                          <td className="py-3 px-4 mono-num text-slate-800">{r.avg_temp_deviation.toFixed(2)} °C</td>
                          <td className="py-3 px-4 mono-num text-slate-800">{r.unsafe_duration_steps} steps</td>
                          <td className="py-3 px-4 mono-num text-slate-800">{r.recovery_time_steps} steps</td>
                          <td className="py-3 px-4 mono-num text-slate-800">{r.intervention_count}</td>
                          <td className="py-3 px-4 mono-num font-bold text-indigo-700">
                            {r.avg_reward.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PROMINENT COMPARISON CHARTS (4 Charts per spec: Spoilage, Energy, Recovery Time, Unsafe Duration) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Spoilage Comparison */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Final Spoilage Rate (%)</h4>
                    <p className="text-xs text-slate-500">Lower is better — biological preservation efficacy</p>
                  </div>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spoilageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="strategy" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      />
                      <Bar dataKey="spoilage" name="Spoilage (%)" radius={[6, 6, 0, 0]}>
                        {spoilageChartData.map((entry, index) => (
                          <Cell
                            key={`spoil-${index}`}
                            fill={strategyColors[entry.strategy] || '#8b5cf6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Energy Consumption Comparison */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Total Energy Consumption (kWh)</h4>
                    <p className="text-xs text-slate-500">Lower is better — compressor electrical efficiency</p>
                  </div>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={energyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="strategy" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      />
                      <Bar dataKey="energy" name="Energy (kWh)" radius={[6, 6, 0, 0]}>
                        {energyChartData.map((entry, index) => (
                          <Cell
                            key={`energy-${index}`}
                            fill={strategyColors[entry.strategy] || '#f59e0b'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Recovery Time & Unsafe Duration Comparison */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Thermal Disturbance Recovery Time</h4>
                    <p className="text-xs text-slate-500">Steps taken to return to safe bounds after heat shock</p>
                  </div>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recoveryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="strategy" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="recoveryTime" name="Recovery Steps" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="unsafeDuration" name="Total Unsafe Steps" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Temperature Deviation & Average Reward */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Mean Temperature Deviation & Reward</h4>
                    <p className="text-xs text-slate-500">Deviation from optimum vs cumulative policy score</p>
                  </div>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="strategy" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="avgTempDeviation" name="Mean Temp Deviation (°C)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgReward" name="Average Reward" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Academic Evaluation Summary Analysis */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-2">
              <h4 className="text-sm font-bold text-slate-800">Computational Intelligence Comparative Findings</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {benchmarkData.summary_analysis}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
