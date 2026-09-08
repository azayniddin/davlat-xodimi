import React, { useState, useEffect } from 'react';
import { Shield, User, LogOut, Clock, Building2, Award } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('uz-UZ', options);
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="gov-gradient-header text-white shadow-lg border-b border-blue-950/40 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Chap tomon: Davlat Gerbi va Tizim nomi */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md p-1 shadow-md flex items-center justify-center border border-amber-300/30 flex-shrink-0">
              <img
                src="/gerb.png"
                alt="O'zbekiston Davlat Gerbi"
                className="w-10 h-10 object-contain drop-shadow"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-wide uppercase bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                  Sog'liqni Saqlash Agentligi
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {user?.role === 'admin' ? 'Boshliq' : 'Xodim'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-200/90 font-medium line-clamp-1">
                O'zbekiston Respublikasi Sog'liqni Saqlash Agentligi
              </p>
            </div>
          </div>

          {/* O'rta: Jonli vaqt va sana */}
          <div className="hidden md:flex items-center space-x-3 bg-blue-950/50 px-4 py-2 rounded-xl border border-blue-800/40">
            <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
            <div className="text-right">
              <div className="text-sm font-bold font-mono tracking-wider text-amber-200">
                {formatTime(time)}
              </div>
              <div className="text-[11px] text-blue-200/70 capitalize">
                {formatDate(time)}
              </div>
            </div>
          </div>

          {/* O'ng tomon: Foydalanuvchi ma'lumoti va Chiqish */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-right">
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-white">
                  {user?.fullName}
                </div>
                <div className="text-xs text-blue-200/70 flex items-center justify-end space-x-1">
                  <Building2 className="w-3 h-3 text-amber-300/70" />
                  <span>{user?.position}</span>
                </div>
              </div>

              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400/40 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-700/80 flex items-center justify-center font-bold text-white border border-blue-400/30">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              title="Tizimdan chiqish"
              className="p-2.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-white border border-red-500/30 transition-all cursor-pointer flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Chiqish</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
