import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '@/contexts/AppContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useApp();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash || window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/login', { replace: true });
      return;
    }

    const exchangeSession = async () => {
      try {
        const res = await axios.get(`${API}/auth/session?session_id=${sessionId}`, { withCredentials: true });
        setUser(res.data);
        navigate('/dashboard', { replace: true, state: { user: res.data } });
      } catch (e) {
        console.error('Auth exchange failed:', e);
        navigate('/login', { replace: true });
      }
    };

    exchangeSession();
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Authenticating...</p>
      </div>
    </div>
  );
}
