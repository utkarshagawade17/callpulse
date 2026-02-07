import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/contexts/AppContext';
import AuthCallback from '@/components/auth/AuthCallback';
import GlobalNav from '@/components/layout/GlobalNav';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import CallDetail from '@/pages/CallDetail';
import AlertsPage from '@/pages/AlertsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import AgentsPage from '@/pages/AgentsPage';
import SettingsPage from '@/pages/SettingsPage';
import { Toaster } from '@/components/ui/sonner';
import axios from 'axios';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function ProtectedRoute({ children }) {
  const { user, setUser } = useApp();
  const [checking, setChecking] = useState(user ? false : true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      setChecking(false);
      return;
    }
    if (user) { setChecking(false); return; }
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(res.data);
        setChecking(false);
      } catch (e) {
        setChecking(false);
        navigate('/login', { replace: true });
      }
    };
    checkAuth();
  }, [user, setUser, navigate, location.state]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;
  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />
      <main className="md:ml-56 pt-14 md:pt-0 min-h-screen">{children}</main>
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  // Handle auth callback synchronously before render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/call/:callId" element={<ProtectedRoute><CallDetail /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/agents" element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
