import React, { useState } from 'react';
import { Shield, Phone, Lock, ArrowRight, UserCheck, AlertCircle, Building, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [phone, setPhone] = useState('+998901234567');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(phone, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Kirishda xatolik yuz berdi. Parol yoki telefonni tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role) => {
    if (role === 'admin') {
      setPhone('+998901234567');
      setPassword('admin123');
    } else {
      setPhone('+998909876543');
      setPassword('xodim123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Orqa fon bezaklari */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Logotip va Bosh sarlavha */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-800 to-slate-900 border-2 border-amber-400/40 shadow-2xl shadow-blue-900/50 mb-4">
            <Shield className="w-10 h-10 text-amber-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
            Davlat Xodimi
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Yagona davomat va sog'lom turmush tarzi monitoringi axborot tizimi
          </p>
        </div>

        {/* Forma qutisi */}
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/80 sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Telefon raqam
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Maxfiy Parol
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 hover:from-blue-700 to-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-blue-700/30 transition-all flex items-center justify-center space-x-2 text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Tizimga Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Tezkor sinov tugmalari (Demo Login) */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              Tezkor kirish (Sinov uchun):
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="py-2.5 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>Boshliq (Admin)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('employee')}
                className="py-2.5 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Xodim hisobi</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            🔒 Xavfsiz tizim: Geolocation 300 metr radius tekshiruvi yoqilgan
          </div>

        </div>

      </div>
    </div>
  );
}
