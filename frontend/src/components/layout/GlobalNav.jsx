import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import axios from 'axios';
import {
  Phone, LayoutDashboard, AlertTriangle, BarChart2, Users,
  Settings, LogOut, Menu, X, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Live Monitor', icon: LayoutDashboard },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/agents', label: 'Agents', icon: Users },
  { path: '/settings', label: 'Simulation', icon: Settings },
];

export default function GlobalNav() {
  const { user, setUser, alerts, wsConnected, BACKEND_URL } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (e) { /* ignore */ }
    setUser(null);
    navigate('/login');
  };

  const navContent = (
    <>
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#3B82F6] flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-black tracking-tight text-white">NEXUS</h1>
            <div className="flex items-center gap-1.5">
              <Radio className={`w-3 h-3 ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                {wsConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1" data-testid="global-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
              ${isActive
                ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
            {item.label === 'Alerts' && criticalAlerts > 0 && (
              <span className="absolute right-3 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {criticalAlerts}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        {user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-xs font-bold text-[#3B82F6]">
                {user.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          data-testid="logout-btn"
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-400/5 text-sm h-9"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 fixed left-0 top-0 h-screen bg-[#0B1121] border-r border-slate-700/50 z-50">
        {navContent}
      </aside>

      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0B1121] border-b border-slate-700/50 z-50 flex items-center px-4">
        <Button variant="ghost" size="sm" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-btn">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div className="flex items-center gap-2 ml-3">
          <Phone className="w-4 h-4 text-[#3B82F6]" />
          <span className="font-heading text-sm font-bold">NEXUS</span>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#0B1121] border-r border-slate-700/50 flex flex-col pt-14">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
