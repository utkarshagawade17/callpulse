import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Settings, Play, Square, Zap, AlertTriangle, Shield, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SettingsPage() {
  const { simStatus, fetchSimStatus } = useApp();
  const [numCalls, setNumCalls] = useState(simStatus?.config?.num_calls || 12);
  const [interval, setInterval_] = useState(simStatus?.config?.message_interval || 4);
  const [triggering, setTriggering] = useState(false);

  const handleStart = async () => {
    try {
      await axios.post(`${API}/simulation/start`, {}, { withCredentials: true });
      toast.success('Simulation started');
      fetchSimStatus();
    } catch (e) { toast.error('Failed to start simulation'); }
  };

  const handleStop = async () => {
    try {
      await axios.post(`${API}/simulation/stop`, {}, { withCredentials: true });
      toast.success('Simulation stopped');
      fetchSimStatus();
    } catch (e) { toast.error('Failed to stop simulation'); }
  };

  const handleUpdateConfig = async () => {
    try {
      await axios.post(`${API}/simulation/config`, {
        num_calls: numCalls,
        message_interval: interval,
      }, { withCredentials: true });
      toast.success('Configuration updated');
      fetchSimStatus();
    } catch (e) { toast.error('Failed to update config'); }
  };

  const handleTrigger = async (eventType) => {
    setTriggering(true);
    try {
      await axios.post(`${API}/simulation/trigger-event`, { event_type: eventType }, { withCredentials: true });
      toast.success(`Triggered: ${eventType.replace('_', ' ')}`);
    } catch (e) { toast.error('Failed to trigger event'); }
    finally { setTriggering(false); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="settings-page">
      <div>
        <h2 className="font-heading text-2xl font-bold text-white">Simulation Controls</h2>
        <p className="text-sm text-slate-400 mt-1">Configure the call simulation engine for demo scenarios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation Status */}
        <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-sm font-heading font-bold">Engine Status</span>
            </div>
            <Badge
              variant="outline"
              className={`text-xs ${simStatus?.running ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-400 border-slate-600'}`}
            >
              {simStatus?.running ? 'Running' : 'Stopped'}
            </Badge>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleStart}
              disabled={simStatus?.running}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
              data-testid="start-simulation-btn"
            >
              <Play className="w-4 h-4 mr-2" /> Start
            </Button>
            <Button
              onClick={handleStop}
              disabled={!simStatus?.running}
              variant="outline"
              className="flex-1 text-sm"
              data-testid="stop-simulation-btn"
            >
              <Square className="w-4 h-4 mr-2" /> Stop
            </Button>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <p>Active Calls: <span className="text-white font-mono">{simStatus?.active_calls || 0}</span></p>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-sm font-heading font-bold">Configuration</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Number of Active Calls</span>
                <span className="text-xs font-mono text-white">{numCalls}</span>
              </div>
              <Slider
                value={[numCalls]}
                onValueChange={v => setNumCalls(v[0])}
                min={3}
                max={20}
                step={1}
                className="w-full"
                data-testid="num-calls-slider"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Message Interval (seconds)</span>
                <span className="text-xs font-mono text-white">{interval}s</span>
              </div>
              <Slider
                value={[interval]}
                onValueChange={v => setInterval_(v[0])}
                min={2}
                max={10}
                step={1}
                className="w-full"
                data-testid="interval-slider"
              />
            </div>

            <Button
              onClick={handleUpdateConfig}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-sm"
              data-testid="update-config-btn"
            >
              Apply Configuration
            </Button>
          </div>
        </div>

        {/* Trigger Events */}
        <div className="lg:col-span-2 bg-[#151F32] border border-slate-700/50 rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-sm font-heading font-bold">Trigger Demo Scenarios</span>
          </div>
          <p className="text-xs text-slate-400">
            Trigger specific call scenarios to demonstrate AI detection capabilities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleTrigger('angry_customer')}
              disabled={triggering || !simStatus?.running}
              className="h-auto py-4 flex flex-col items-center gap-2 border-red-500/20 hover:bg-red-500/5"
              data-testid="trigger-angry-btn"
            >
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <span className="text-sm font-medium text-red-400">Angry Customer</span>
              <span className="text-[10px] text-slate-500">Furious customer threatening to leave</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleTrigger('escalation_request')}
              disabled={triggering || !simStatus?.running}
              className="h-auto py-4 flex flex-col items-center gap-2 border-yellow-500/20 hover:bg-yellow-500/5"
              data-testid="trigger-escalation-btn"
            >
              <Users className="w-6 h-6 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Escalation Request</span>
              <span className="text-[10px] text-slate-500">Customer demands to speak to manager</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleTrigger('compliance_issue')}
              disabled={triggering || !simStatus?.running}
              className="h-auto py-4 flex flex-col items-center gap-2 border-purple-500/20 hover:bg-purple-500/5"
              data-testid="trigger-compliance-btn"
            >
              <Shield className="w-6 h-6 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Compliance Issue</span>
              <span className="text-[10px] text-slate-500">Legal threats and regulatory mention</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
