import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import {
  ArrowLeft, Phone, User, Clock, Flag, MessageSquare, Send,
  AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatDuration(s) {
  if (!s) return '0:00';
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function getSentimentColor(s) {
  if (s <= -0.5) return '#EF4444';
  if (s <= -0.2) return '#F59E0B';
  if (s <= 0.2) return '#64748B';
  return '#10B981';
}

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CallDetail() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { performAction } = useApp();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const transcriptRef = useRef(null);

  const fetchCall = async () => {
    try {
      const res = await axios.get(`${API}/calls/${callId}`, { withCredentials: true });
      setCall(res.data);
    } catch (e) {
      toast.error('Failed to load call details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCall();
    const interval = setInterval(fetchCall, 3000);
    return () => clearInterval(interval);
  }, [callId]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [call?.transcript?.length]);

  const handleAction = async (action, details = '') => {
    const success = await performAction(callId, action, details || action);
    if (success) toast.success(`Action "${action}" performed`);
    else toast.error('Action failed');
  };

  const handleNote = async () => {
    if (!note.trim()) return;
    await handleAction('note', note);
    setNote('');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Call not found</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const sentiment = call.ai_summary?.overall_sentiment || 0;
  const sentimentData = (call.transcript || []).map((msg, i) => ({
    index: i,
    time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sentiment: msg.analysis?.sentiment || 0,
    speaker: msg.speaker,
  }));

  const trendIcon = call.ai_summary?.sentiment_trend === 'improving' ? TrendingUp
    : call.ai_summary?.sentiment_trend === 'declining' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="call-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl font-bold text-white">{call.call_id}</h2>
            <Badge variant="outline" className={`text-xs ${call.status === 'active' ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-400 border-slate-600'}`}>
              {call.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{call.agent?.name}</span>
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{call.customer?.name}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(call.duration_seconds)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transcript Panel */}
        <div className="lg:col-span-2 bg-[#151F32] border border-slate-700/50 rounded-lg flex flex-col" style={{ height: '520px' }}>
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-sm font-heading font-bold">Live Transcript</span>
            </div>
            {call.status === 'active' && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-red-400 uppercase tracking-widest">Live</span>
              </div>
            )}
          </div>
          <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="transcript-panel">
            {(call.transcript || []).map((msg, i) => (
              <div key={i} className={`flex ${msg.speaker === 'customer' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${msg.speaker === 'customer' ? 'bg-[#0B1121] border border-slate-700/50' : 'bg-[#3B82F6]/10 border border-[#3B82F6]/20'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${msg.speaker === 'customer' ? 'text-slate-400' : 'text-[#3B82F6]'}`}>
                      {msg.speaker === 'customer' ? 'Customer' : 'Agent'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{msg.text}</p>
                  {msg.analysis && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: getSentimentColor(msg.analysis.sentiment), backgroundColor: `${getSentimentColor(msg.analysis.sentiment)}15` }}>
                        {msg.analysis.sentiment.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500">{msg.analysis.intent}</span>
                      {msg.analysis.flags?.map((f, j) => (
                        <span key={j} className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">{f.replace('_', ' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="space-y-4">
          {/* Sentiment Graph */}
          <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400">Sentiment</span>
              <div className="flex items-center gap-1">
                <TrendIcon className="w-3 h-3" style={{ color: getSentimentColor(sentiment) }} />
                <span className="text-sm font-mono font-bold" style={{ color: getSentimentColor(sentiment) }}>
                  {sentiment.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="index" tick={false} axisLine={{ stroke: '#1E293B' }} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#1E293B' }} />
                  <Tooltip
                    contentStyle={{ background: '#151F32', border: '1px solid #1E293B', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={() => ''}
                    formatter={(value) => [value.toFixed(2), 'Sentiment']}
                  />
                  <Line type="monotone" dataKey="sentiment" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Call Info */}
          <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-4 space-y-3">
            <span className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400">AI Insights</span>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Issue</span><span className="text-white">{call.ai_summary?.primary_issue || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Risk Level</span><Badge variant="outline" className="text-xs">{call.ai_summary?.risk_level || 'low'}</Badge></div>
              <div className="flex justify-between"><span className="text-slate-400">Health Score</span><span className="text-white font-mono">{call.health_score}/100</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Trend</span><span className="text-white">{call.ai_summary?.sentiment_trend || 'stable'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Customer</span><Badge variant="outline" className="text-xs">{call.customer?.account_type}</Badge></div>
            </div>
            {call.ai_summary?.topics_discussed?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Topics</p>
                <div className="flex flex-wrap gap-1">
                  {call.ai_summary.topics_discussed.map((t, i) => (
                    <span key={i} className="text-[10px] bg-[#3B82F6]/10 text-[#3B82F6] px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-4 space-y-3">
            <span className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400">Supervisor Actions</span>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => handleAction('flag', 'Flagged for review')} data-testid="action-flag" className="text-xs h-8">
                <Flag className="w-3 h-3 mr-1.5" /> Flag
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction('transfer', 'Transferred to senior')} data-testid="action-transfer" className="text-xs h-8">
                <RefreshCw className="w-3 h-3 mr-1.5" /> Transfer
              </Button>
            </div>
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a supervisor note..."
                className="text-xs min-h-[60px] bg-[#0B1121] border-slate-700/50"
                data-testid="supervisor-note-input"
              />
              <Button size="sm" onClick={handleNote} className="w-full text-xs h-8 bg-[#3B82F6] hover:bg-[#2563EB]" data-testid="send-note-btn">
                <Send className="w-3 h-3 mr-1.5" /> Send Note
              </Button>
            </div>
          </div>

          {/* Action History */}
          {call.supervisor_actions?.length > 0 && (
            <div className="bg-[#151F32] border border-slate-700/50 rounded-lg p-4">
              <span className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-2 block">Action Log</span>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {call.supervisor_actions.map((a, i) => (
                  <div key={i} className="text-xs text-slate-400 border-b border-slate-800 pb-1">
                    <span className="text-[#3B82F6] font-medium">{a.action}</span> - {a.details}
                    <span className="block text-[10px] text-slate-600 font-mono">
                      {new Date(a.performed_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
