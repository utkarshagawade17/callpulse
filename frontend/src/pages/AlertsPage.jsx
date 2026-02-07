import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AlertsPage() {
  const { alerts, acknowledgeAlert, resolveAlert } = useApp();
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('active');
  const navigate = useNavigate();

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/alerts/history`, { withCredentials: true });
      setHistory(res.data);
    } catch (e) { /* ignore */ }
  };

  const displayAlerts = tab === 'active' ? alerts : history;

  const severityStyle = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="alerts-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white">Alert Center</h2>
          <p className="text-sm text-slate-400 mt-1">Monitor and manage AI-detected issues</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tab === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('active')}
            data-testid="tab-active-alerts"
            className="text-xs"
          >
            Active ({alerts.length})
          </Button>
          <Button
            variant={tab === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('history')}
            data-testid="tab-alert-history"
            className="text-xs"
          >
            History
          </Button>
        </div>
      </div>

      <div className="space-y-3" data-testid="alerts-list">
        {displayAlerts.map(alert => (
          <div
            key={alert.alert_id}
            className={`border rounded-lg p-4 ${severityStyle[alert.severity] || severityStyle.info}`}
            data-testid={`alert-item-${alert.alert_id}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{alert.title}</span>
                    <Badge variant="outline" className="text-[10px]">{alert.severity}</Badge>
                    <Badge variant="outline" className="text-[10px]">{alert.status}</Badge>
                  </div>
                  <p className="text-xs opacity-80">{alert.message}</p>
                  {alert.details?.trigger_phrase && (
                    <p className="text-xs opacity-60 mt-1 italic">"{alert.details.trigger_phrase}"</p>
                  )}
                  <p className="text-[10px] font-mono opacity-50 mt-2">
                    {new Date(alert.created_at).toLocaleString()} | {alert.call_id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {alert.status === 'active' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/call/${alert.call_id}`)}
                      className="text-xs h-7"
                      data-testid={`jump-to-call-${alert.alert_id}`}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> View Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.alert_id)}
                      className="text-xs h-7"
                      data-testid={`ack-btn-${alert.alert_id}`}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Ack
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlert(alert.alert_id)}
                      className="text-xs h-7"
                      data-testid={`resolve-btn-${alert.alert_id}`}
                    >
                      Resolve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {displayAlerts.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{tab === 'active' ? 'No active alerts' : 'No alert history'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
