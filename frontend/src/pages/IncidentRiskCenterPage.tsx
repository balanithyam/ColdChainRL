import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle,
  Clock,
  Filter,
  Layers,
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { incidentService } from '../services/api';
import { Incident, IncidentSummary } from '../types';

export const IncidentRiskCenterPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const [iRes, sRes] = await Promise.all([
        incidentService.getIncidents(severityFilter !== 'ALL' ? { severity: severityFilter } : {}),
        incidentService.getSummary(),
      ]);
      setIncidents(iRes.data);
      setSummary(sRes.data);
    } catch (e) {
      console.error('Failed to load incident intelligence:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [severityFilter]);

  const handleResolve = async (id: string) => {
    try {
      await incidentService.resolveIncident(id);
      await loadIncidents();
    } catch (e) {
      console.error('Failed to resolve incident:', e);
    }
  };

  // Minimal Supporting Visualizations (Severity Breakdown Bar)
  const severityData = summary
    ? [
        { name: 'Critical', count: summary.severity_breakdown.Critical, color: '#f43f5e' },
        { name: 'High', count: summary.severity_breakdown.High, color: '#f97316' },
        { name: 'Medium', count: summary.severity_breakdown.Medium, color: '#eab308' },
        { name: 'Low', count: summary.severity_breakdown.Low, color: '#3b82f6' },
      ]
    : [];

  return (
    <div className="flex flex-col min-h-full">
      <Navbar
        pageTitle="INCIDENT & RISK CENTER"
        subtitle="Autonomous Anomaly Detection, State Degradation Forensics & RL Counter-Actuation Logs"
      />

      <div className="p-6 space-y-6">
        {/* Top Minimal Supporting Visualizations Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Severity Metrics Card (7 Cols) */}
          <div className="md:col-span-7 bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Incident Severity Distribution
                </h4>
              </div>
              <span className="text-xs font-bold text-slate-700 mono-num">
                Total Logged: {summary?.total_incidents || 0}
              </span>
            </div>

            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Outcome Status Summary (5 Cols) */}
          <div className="md:col-span-5 bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Mitigation Status
              </h4>
              <button
                onClick={loadIncidents}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                title="Refresh Incident Log"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Resolved</span>
                <div className="text-base font-bold text-emerald-700 mono-num mt-1">
                  {summary?.outcome_breakdown.Resolved || 0}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-[10px] font-bold text-amber-800 uppercase">Mitigated</span>
                <div className="text-base font-bold text-amber-700 mono-num mt-1">
                  {summary?.outcome_breakdown.Mitigated || 0}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                <span className="text-[10px] font-bold text-rose-800 uppercase">Active</span>
                <div className="text-base font-bold text-rose-700 mono-num mt-1">
                  {summary?.outcome_breakdown.Active || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Focus: Incidents Table and Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Autonomous Incident Log & RL Response Record
              </h4>
              <p className="text-[11px] text-slate-500">
                Real-time thermal breaches, humidity incursions, door disturbances, and RL cooling counter-actions
              </p>
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
              {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    severityFilter === sev
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Incident Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">State Before</th>
                  <th className="py-3 px-4">RL Counter-Action</th>
                  <th className="py-3 px-4">Recovery Time</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">
                      Loading incident database...
                    </td>
                  </tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">
                      No incidents recorded. All cold-chain units operating within nominal bounds.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {inc.incident_id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{inc.unit_name}</td>
                      <td className="py-3 px-4 text-slate-500 mono-num">
                        {new Date(inc.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{inc.incident_type}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inc.severity} />
                      </td>
                      <td className="py-3 px-4 mono-num text-slate-600">
                        {inc.state_before.temp.toFixed(1)}°C | {(inc.state_before.spoilage * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {inc.rl_action_taken}
                        </span>
                      </td>
                      <td className="py-3 px-4 mono-num text-slate-700">
                        {inc.recovery_time_seconds > 0 ? `${inc.recovery_time_seconds}s` : 'In Progress'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inc.outcome} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedIncident(inc)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="View Forensic Timeline"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          {inc.outcome !== 'Resolved' && (
                            <button
                              onClick={() => handleResolve(inc.incident_id)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Mark Resolved"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Forensic Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Incident Forensics: {selectedIncident.incident_id}
                </h3>
              </div>
              <StatusBadge status={selectedIncident.severity} />
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedIncident.description}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Unit ID</span>
                  <p className="font-bold text-slate-800">{selectedIncident.unit_name}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Anomaly Type</span>
                  <p className="font-bold text-slate-800">{selectedIncident.incident_type}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Trigger State</span>
                  <p className="font-bold text-slate-800 mono-num">
                    {selectedIncident.state_before.temp.toFixed(2)} °C / Level {selectedIncident.state_before.cooling_level}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">RL Adaptation</span>
                  <p className="font-bold text-indigo-600">{selectedIncident.rl_action_taken}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Forensics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
