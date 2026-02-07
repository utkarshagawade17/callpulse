import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeCalls, setActiveCalls] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({ active_calls: 0, avg_sentiment: 0, alerts_count: 0, longest_call: 0 });
  const [agents, setAgents] = useState([]);
  const [simStatus, setSimStatus] = useState({ running: false });
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const fetchActiveCalls = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/calls/active`, { withCredentials: true });
      setActiveCalls(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/alerts`, { withCredentials: true });
      setAlerts(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/analytics/realtime`, { withCredentials: true });
      setMetrics(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/agents`, { withCredentials: true });
      setAgents(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const fetchSimStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/simulation/status`, { withCredentials: true });
      setSimStatus(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  // WebSocket connection
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      const socket = new WebSocket(`${WS_URL}/api/ws/live`);
      socket.onopen = () => { setWsConnected(true); };
      socket.onclose = () => {
        setWsConnected(false);
        reconnectRef.current = setTimeout(connectWS, 3000);
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleWSMessage(msg);
        } catch (e) { /* ignore */ }
      };
      wsRef.current = socket;
    } catch (e) { /* ignore */ }
  }, []);

  const handleWSMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'call_update':
        setActiveCalls(prev => {
          const idx = prev.findIndex(c => c.call_id === msg.data.call_id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              health_score: msg.data.health_score,
              duration_seconds: msg.data.duration_seconds,
              ai_summary: { ...updated[idx].ai_summary, overall_sentiment: msg.data.avg_sentiment },
              transcript: [msg.data.transcript_entry],
            };
            return updated;
          }
          return prev;
        });
        break;
      case 'call_started':
        setActiveCalls(prev => [msg.data, ...prev]);
        break;
      case 'call_ended':
        setActiveCalls(prev => prev.filter(c => c.call_id !== msg.data.call_id));
        break;
      case 'alert_new':
        setAlerts(prev => [msg.data, ...prev]);
        break;
      case 'alert_acknowledged':
      case 'alert_resolved':
        setAlerts(prev => prev.filter(a => a.alert_id !== msg.data.alert_id));
        break;
      case 'metrics_update':
        setMetrics(prev => ({ ...prev, ...msg.data }));
        break;
      default:
        break;
    }
  }, []);

  // Connect WS and fetch initial data when user is set
  useEffect(() => {
    if (user) {
      connectWS();
      fetchActiveCalls();
      fetchAlerts();
      fetchMetrics();
      fetchAgents();
      fetchSimStatus();

      // Polling fallback every 5s
      const interval = setInterval(() => {
        fetchActiveCalls();
        fetchMetrics();
        fetchAlerts();
      }, 5000);

      return () => {
        clearInterval(interval);
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        if (wsRef.current) wsRef.current.close();
      };
    }
  }, [user, connectWS, fetchActiveCalls, fetchAlerts, fetchMetrics, fetchAgents, fetchSimStatus]);

  const acknowledgeAlert = async (alertId) => {
    try {
      await axios.post(`${API}/alerts/${alertId}/acknowledge`, {}, { withCredentials: true });
      setAlerts(prev => prev.filter(a => a.alert_id !== alertId));
    } catch (e) { /* ignore */ }
  };

  const resolveAlert = async (alertId, notes = '') => {
    try {
      await axios.post(`${API}/alerts/${alertId}/resolve?notes=${encodeURIComponent(notes)}`, {}, { withCredentials: true });
      setAlerts(prev => prev.filter(a => a.alert_id !== alertId));
    } catch (e) { /* ignore */ }
  };

  const performAction = async (callId, action, details = '') => {
    try {
      await axios.post(`${API}/calls/${callId}/action`, { action, details }, { withCredentials: true });
      return true;
    } catch (e) { return false; }
  };

  const value = {
    user, setUser,
    activeCalls, alerts, metrics, agents, simStatus,
    wsConnected,
    fetchActiveCalls, fetchAlerts, fetchMetrics, fetchAgents, fetchSimStatus,
    acknowledgeAlert, resolveAlert, performAction,
    API, BACKEND_URL,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
