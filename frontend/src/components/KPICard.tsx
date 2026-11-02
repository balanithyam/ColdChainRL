import React from 'react';

interface Props {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  accentColor?: 'purple' | 'teal' | 'indigo' | 'amber' | 'rose' | 'emerald';
}

export const KPICard: React.FC<Props> = ({
  title,
  value,
  unit,
  change,
  isPositive,
  icon,
  accentColor = 'indigo',
}) => {
  const colorMap = {
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    teal: 'text-teal-600 bg-teal-50 border-teal-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg border ${colorMap[accentColor]}`}>{icon}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-slate-800 mono-num tracking-tight">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>
      {change && (
        <div className="mt-1 flex items-center text-xs">
          <span className={isPositive ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
};
