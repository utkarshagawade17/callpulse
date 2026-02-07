import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, Clock, Flag, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getSentimentColor(s) {
  if (s <= -0.5) return '#EF4444';
  if (s <= -0.2) return '#F59E0B';
  if (s <= 0.2) return '#64748B';
  if (s <= 0.5) return '#10B981';
  return '#10B981';
}

function getSentimentLabel(s) {
  if (s <= -0.5) return 'Negative';
  if (s <= -0.2) return 'Cautious';
  if (s <= 0.2) return 'Neutral';
  if (s <= 0.5) return 'Positive';
  return 'Very Positive';
}

function getRiskBadge(level) {
  const map = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[level] || map.low;
}

export default function CallCard({ call }) {
  const navigate = useNavigate();
  const sentiment = call.ai_summary?.overall_sentiment || 0;
  const riskLevel = call.ai_summary?.risk_level || 'low';
  const lastMsg = call.transcript?.[call.transcript.length - 1];
  const isAlert = sentiment <= -0.4 || riskLevel === 'critical' || riskLevel === 'high';
  const sentimentPct = ((sentiment + 1) / 2) * 100;

  return (
    <div
      data-testid={`call-card-${call.call_id}`}
      onClick={() => navigate(`/call/${call.call_id}`)}
      className={`group relative bg-[#151F32] border rounded-lg p-5 cursor-pointer transition-all duration-200
        hover:border-[#3B82F6]/50 hover:bg-[#1a2540]
        ${isAlert ? 'border-red-500/40 animate-pulse-border' : 'border-slate-700/50'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-slate-500">{call.call_id}</span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3 h-3" />
          <span className="font-mono text-xs">{formatDuration(call.duration_seconds)}</span>
        </div>
      </div>

      {/* Agent & Customer */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#3B82F6]/20 flex items-center justify-center">
            <Phone className="w-3 h-3 text-[#3B82F6]" />
          </div>
          <span className="text-sm font-medium text-slate-200 truncate max-w-[100px]">{call.agent?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 truncate max-w-[100px]">{call.customer?.name}</span>
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Last message snippet */}
      {lastMsg && (
        <div className="bg-[#0B1121] rounded p-3 mb-3 min-h-[52px]">
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            <span className="text-slate-500 font-medium">
              {lastMsg.speaker === 'customer' ? 'Customer' : 'Agent'}:
            </span>{' '}
            {lastMsg.text}
          </p>
        </div>
      )}

      {/* Sentiment bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Sentiment</span>
          <span className="text-xs font-mono" style={{ color: getSentimentColor(sentiment) }}>
            {sentiment.toFixed(2)} {getSentimentLabel(sentiment)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${sentimentPct}%`,
              backgroundColor: getSentimentColor(sentiment),
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">
            {call.ai_summary?.primary_issue || call.channel}
          </span>
        </div>
        <Badge variant="outline" className={`text-[10px] border ${getRiskBadge(riskLevel)}`}>
          {riskLevel}
        </Badge>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-lg bg-[#3B82F6]/0 group-hover:bg-[#3B82F6]/[0.02] transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center gap-1.5 bg-[#3B82F6] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
          <Eye className="w-3 h-3" />
          View Details
        </div>
      </div>
    </div>
  );
}
