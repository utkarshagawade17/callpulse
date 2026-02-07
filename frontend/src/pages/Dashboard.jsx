import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Phone, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import CallCard from '@/components/dashboard/CallCard';
import MetricsBar from '@/components/dashboard/MetricsBar';

export default function Dashboard() {
  const { activeCalls, alerts } = useApp();
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="dashboard-page">
      <MetricsBar />

      {/* Critical Alert Banners */}
      {criticalAlerts.slice(0, 3).map(alert => (
        <AlertBanner key={alert.alert_id} alert={alert} />
      ))}

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#3B82F6]" />
          <h2 className="font-heading text-lg font-bold text-white tracking-tight">
            Active Calls
          </h2>
          <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded">
            {activeCalls.length}
          </span>
        </div>
      </div>

      {/* Call Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="call-grid">
        {activeCalls.map(call => (
          <CallCard key={call.call_id} call={call} />
        ))}
        {activeCalls.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
            <Phone className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No active calls</p>
            <p className="text-xs mt-1">Start the simulation from Settings</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertBanner({ alert }) {
  const { acknowledgeAlert } = useApp();
  return (
    <div
      className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between animate-slide-in"
      data-testid={`alert-banner-${alert.alert_id}`}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-300">{alert.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{alert.message}</p>
        </div>
      </div>
      <button
        onClick={() => acknowledgeAlert(alert.alert_id)}
        className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded bg-slate-800/50 hover:bg-slate-700 transition-colors shrink-0"
        data-testid={`ack-alert-${alert.alert_id}`}
      >
        Acknowledge
      </button>
    </div>
  );
}
