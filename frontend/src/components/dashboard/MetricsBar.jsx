import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Phone, AlertTriangle, Clock, Activity } from 'lucide-react';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MetricsBar() {
  const { metrics } = useApp();

  const items = [
    {
      icon: Phone,
      label: 'Active Calls',
      value: metrics.active_calls || 0,
      color: '#3B82F6',
    },
    {
      icon: Activity,
      label: 'Avg Sentiment',
      value: (metrics.avg_sentiment || 0).toFixed(2),
      color: metrics.avg_sentiment >= 0 ? '#10B981' : '#EF4444',
    },
    {
      icon: AlertTriangle,
      label: 'Active Alerts',
      value: metrics.alerts_count || 0,
      color: metrics.alerts_count > 0 ? '#F59E0B' : '#64748B',
    },
    {
      icon: Clock,
      label: 'Longest Call',
      value: formatDuration(metrics.longest_call || 0),
      color: '#0EA5E9',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="metrics-bar">
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-[#151F32] border border-slate-700/50 rounded-lg p-4 flex items-center gap-4"
          data-testid={`metric-${item.label.toLowerCase().replace(/\s/g, '-')}`}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${item.color}15` }}
          >
            <item.icon className="w-5 h-5" style={{ color: item.color }} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">{item.label}</p>
            <p className="text-xl font-heading font-bold text-white" style={{ color: item.color }}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
