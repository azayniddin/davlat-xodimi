import React, { useState } from 'react';
import { Phone, Lock, ArrowRight, UserCheck, AlertCircle, Building2, UserPlus, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Login formasi
  const [phone, setPhone] = useState('+998901234567');
  const [password, setPassword] = useState('admin123');

  // Ro'yxatdan o'tish formasi
  const [registerData, setRegisterData] = useState({
    fullName: '',
    phone: '+998',
    department: 'Davolash-profilaktika bo\'limi',
    position: 'Bosh mutaxassis',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login yuborish
  const handleLogin = async (e) => {
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

  // Ro'yxatdan o'tish yuborish
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.register(registerData);
      setSuccessMsg('Muvaffaqiyatli ro\'yxatdan o\'tdingiz! Tizimga kirilmoqda...');
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role) => {
    setIsRegisterMode(false);
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* Orqa fon bezaklari */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Davlat Gerbi va Rasmiy Tashkilot Nomi */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/5 backdrop-blur-md border border-amber-300/30 p-2 shadow-2xl mb-3">
            <img
              src="/gerb.png"
              alt="O'zbekiston Davlat Gerbi"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-amber-200 tracking-wide uppercase">
            O'zbekiston Respublikasi
          </h2>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase mt-0.5">
            Sog'liqni Saqlash Agentligi
          </h1>
          <p className="mt-1.5 text-xs text-blue-200/80 font-medium">
            Davomat va Sog'lom Turmush Tarzi Axborot Tizimi
          </p>
        </div>

        {/* Forma qutisi */}
        <div className="bg-slate-800/95 backdrop-blur-xl py-6 px-5 sm:py-8 sm:px-8 shadow-2xl rounded-3xl border border-slate-700">
          
          {/* Kirish / Ro'yxatdan o'tish Tablari */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/80 rounded-2xl mb-6 border border-slate-700/80">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(''); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isRegisterMode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(''); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                isRegisterMode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Ro'yxatdan o'tish</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-2.5 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-2.5 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1-REJIM: KIRISH FORMASI */}
          {!isRegisterMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
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
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
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
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-700/30 transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Tizimga Kirish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 2-REJIM: RO'YXATDAN O'TISH FORMASI */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  F.I.O (Ism, Familiya, Otasining ismi) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Karimova Shahlo Anvarovna"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Telefon raqam *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+998901112233"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Bo'lim
                  </label>
                  <input
                    type="text"
                    placeholder="Tibbiyot bo'limi"
                    value={registerData.department}
                    onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Lavozim
                  </label>
                  <input
                    type="text"
                    placeholder="Mutaxassis"
                    value={registerData.position}
                    onChange={(e) => setRegisterData({ ...registerData, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Parol yarating *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Kamida 4 ta belgi"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/30 transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 mt-3"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Ro'yxatdan O'tish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tezkor sinov tugmalari (Demo Login) */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Tezkor sinov uchun demo hisoblar:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="py-2 px-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Boshliq</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('employee')}
                className="py-2 px-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Xodim</span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] text-slate-400">
            🔒 GPS 300 metr radiusli xavfsiz davomat tizimi
          </div>

        </div>

      </div>
    </div>
  );
}
