import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Layers,
  BrainCircuit,
  FlaskConical,
  Scale,
  ShieldAlert,
  GraduationCap,
  LogOut,
  Radio,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSimulation } from '../context/SimulationContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isLive, isRunning } = useSimulation();

  // EXACTLY 7 MAIN PAGES
  const navItems = [
    { name: 'Live Monitor', path: '/', icon: Activity },
    { name: 'Unit Management', path: '/units', icon: Layers },
    { name: 'AI Decision Center', path: '/decision', icon: BrainCircuit },
    { name: 'Simulation Lab', path: '/simulation', icon: FlaskConical },
    { name: 'Strategy Benchmark', path: '/benchmark', icon: Scale },
    { name: 'Incident & Risk Center', path: '/incidents', icon: ShieldAlert },
    { name: 'RL Training Lab', path: '/training', icon: GraduationCap },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 bg-slate-50/70">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-sm shadow-indigo-200 text-white">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">ColdChain-RL</h1>
            <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest">
              Adaptive CI Control
            </p>
          </div>
        </div>

        {/* Live Simulation Status Banner */}
        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isLive
                  ? isRunning
                    ? 'bg-emerald-500 animate-ping'
                    : 'bg-emerald-500'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-[11px] font-medium text-slate-600">
              {isLive ? (isRunning ? 'Engine Running' : 'Engine Idle') : 'Connecting...'}
            </span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 mono-num">
            Q-LEARN
          </span>
        </div>

        {/* Exactly 7 Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Control Room Pages (7)
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.full_name || 'Operator'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || 'operator@coldchain.ai'}</p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
