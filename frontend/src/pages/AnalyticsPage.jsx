import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart2, TrendingUp, PieChart as PieIcon, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9', '#EC4899'];

export default function AnalyticsPage() {
  const { metrics } = useApp();
  const [hourlyData, setHourlyData] = useState([]);
  const [issueData, setIssueData] = useState([]);
  const [agentData, setAgentData] = useState([]);

  useEffect(() => {
    fetchHourly();
    fetchIssues();
    fetchAgents();
  }, []);

  const fetchHourly = async () => {
    try {
      const res = await axios.get(`${API}/analytics/hourly`, { withCredentials: true });
      setHourlyData(res.data);
    } catch (e) { /* ignore */ }
  };

  const fetchIssues = async () => {
    try {
      const res = await axios.get(`${API}/analytics/issues`, { withCredentials: true });
      setIssueData(res.data);
    } catch (e) { /* ignore */ }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get(`${API}/analytics/agents`, { withCredentials: true });
      setAgentData(res.data);
    } catch (e) { /* ignore */ }
  };

  const handleExport = async () => {
    try {
      const res = await axios.post(`${API}/analytics/export`, {}, { withCredentials: true });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) { /* ignore */ }
  };

  const tooltipStyle = { background: '#151F32', border: '1px solid #1E293B', borderRadius: '8px', fontSize: '12px', color: '#F8FAFC' };

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="analytics-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white">Analytics</h2>
          <p className="text-sm text-slate-400 mt-1">Call patterns, sentiment trends, and agent performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} data-testid="export-btn" className="text-xs">
          <Download className="w-3 h-3 mr-1.5" /> Export JSON
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Calls Today', value: metrics.total_calls_today || 0, color: '#3B82F6' },
          { label: 'Resolved Today', value: metrics.resolved_today || 0, color: '#10B981' },
          { label: 'Avg Health Score', value: `${metrics.avg_health_score || 50}%`, color: '#F59E0B' },
          { label: 'Active Alerts', value: metrics.alerts_count || 0, color: '#EF4444' },
        ].map((item, i) => (
          <div key={i} className="bg-[#151F32] border border-slate-700/50 rounded-lg p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{item.label}</p>
            <p className="text-2xl font-heading font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Call Volume Chart */}
        <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-sm font-heading font-bold">Call Volume by Hour</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#1E293B' }} tickFormatter={v => `${v}:00`} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#1E293B' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="calls" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Trend */}
        <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm font-heading font-bold">Sentiment Trend</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#1E293B' }} tickFormatter={v => `${v}:00`} />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#1E293B' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="avg_sentiment" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} name="Avg Sentiment" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Distribution */}
        <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-sm font-heading font-bold">Issue Distribution</span>
          </div>
          <div className="h-56">
            {issueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="issue"
                    label={({ issue, percent }) => `${issue} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {issueData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Agent Performance */}
        <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-sm font-heading font-bold">Agent Performance</span>
          </div>
          <div className="h-56">
            {agentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#1E293B' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={{ stroke: '#1E293B' }} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="performance_today.calls_handled" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Calls Handled" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">No data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
