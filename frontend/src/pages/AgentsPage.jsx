import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, Clock, TrendingUp, Star } from 'lucide-react';

const AVATAR_URLS = [
  'https://images.unsplash.com/photo-1737575655055-e3967cbefd03?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1752952952773-80378cefc23d?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1758518729459-235dcaadc611?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1715866558475-d2543c67a840?w=80&h=80&fit=crop&crop=face',
];

const statusStyles = {
  on_call: { color: '#10B981', label: 'On Call', dot: 'bg-emerald-400' },
  available: { color: '#3B82F6', label: 'Available', dot: 'bg-blue-400' },
  after_call_work: { color: '#F59E0B', label: 'Wrap-up', dot: 'bg-yellow-400' },
  break: { color: '#EF4444', label: 'Break', dot: 'bg-red-400' },
  offline: { color: '#64748B', label: 'Offline', dot: 'bg-slate-500' },
};

export default function AgentsPage() {
  const { agents } = useApp();

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="agents-page">
      <div>
        <h2 className="font-heading text-2xl font-bold text-white">Agent Overview</h2>
        <p className="text-sm text-slate-400 mt-1">Performance metrics and status for all agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="agents-grid">
        {agents.map(agent => {
          const status = statusStyles[agent.status] || statusStyles.offline;
          const perf = agent.performance_today || {};
          const monthly = agent.performance_monthly || {};
          return (
            <div
              key={agent.agent_id}
              className="bg-[#151F32] border border-slate-700/50 rounded-lg p-5"
              data-testid={`agent-card-${agent.agent_id}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={AVATAR_URLS[agent.avatar_idx || 0]}
                  alt={agent.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                    <span className="text-xs" style={{ color: status.color }}>{status.label}</span>
                    {agent.current_call_id && (
                      <span className="text-[10px] font-mono text-slate-500 ml-1">{agent.current_call_id}</span>
                    )}
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-500">{agent.agent_id}</span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {agent.skills?.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] border-slate-600 text-slate-400">{s}</Badge>
                ))}
              </div>

              {/* Today's Performance */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Calls</p>
                    <p className="text-white font-mono">{perf.calls_handled || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Avg Handle</p>
                    <p className="text-white font-mono">{perf.avg_handle_time ? `${Math.round(perf.avg_handle_time / 60)}m` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Resolution</p>
                    <p className="text-emerald-400 font-mono">{perf.resolution_rate ? `${(perf.resolution_rate * 100).toFixed(0)}%` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Quality</p>
                    <p className="text-[#F59E0B] font-mono">{monthly.quality_score ? `${monthly.quality_score.toFixed(0)}` : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {agents.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No agents loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
