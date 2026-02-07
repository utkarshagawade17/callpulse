import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Shield, BarChart2 } from 'lucide-react';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function LoginPage() {
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background flex" data-testid="login-page">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0B1121 0%, #151F32 50%, #1E293B 100%)' }}>
        <div className="relative z-10 px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-[#3B82F6] flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-white">NEXUS</h1>
          </div>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-white mb-4">
            Contact Center<br />Intelligence Platform
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
            Real-time voice analytics, AI-powered sentiment tracking, and intelligent routing for modern contact centers.
          </p>
          <div className="space-y-4">
            {[
              { icon: Phone, text: 'Monitor 20+ live calls simultaneously' },
              { icon: Shield, text: 'AI-powered risk detection & alerts' },
              { icon: BarChart2, text: 'Real-time analytics & agent insights' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="w-8 h-8 rounded bg-[#3B82F6]/10 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#3B82F6] flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-heading text-2xl font-black tracking-tight text-white">NEXUS</h1>
          </div>
          <h3 className="font-heading text-2xl font-bold text-white mb-2">Welcome back</h3>
          <p className="text-slate-400 text-sm mb-8">Sign in to access the supervisor dashboard</p>
          <Button
            data-testid="google-login-btn"
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-medium text-sm rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>
          <p className="text-xs text-slate-500 text-center mt-6">
            Supervisor & Manager access only
          </p>
        </div>
      </div>
    </div>
  );
}
