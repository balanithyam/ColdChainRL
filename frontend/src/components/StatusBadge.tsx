import React from 'react';

interface Props {
  status: 'NORMAL' | 'AT_RISK' | 'CRITICAL' | 'Active' | 'Mitigated' | 'Resolved' | string;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotStyle = 'bg-slate-400';

  switch (status?.toUpperCase()) {
    case 'NORMAL':
    case 'RESOLVED':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotStyle = 'bg-emerald-500 animate-pulse';
      break;
    case 'AT_RISK':
    case 'MITIGATED':
    case 'MEDIUM':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      dotStyle = 'bg-amber-500';
      break;
    case 'CRITICAL':
    case 'HIGH':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      dotStyle = 'bg-rose-500 animate-ping';
      break;
    case 'LOW':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      dotStyle = 'bg-blue-500';
      break;
    default:
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
      dotStyle = 'bg-slate-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase ${badgeStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`}></span>
      {status}
    </span>
  );
};
