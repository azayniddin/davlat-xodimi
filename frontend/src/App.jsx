import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Saqlangan foydalanuvchini tekshirish
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Serverdan yangi ma'lumotlarni tekshirish
        api.getMe()
          .then((res) => {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
          })
          .catch(() => {
            // Token yaroqsiz bo'lsa tozalash
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch {
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-300 font-semibold text-sm">
            Davlat Xodimi tizimi yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-amber-300 selection:text-slate-900">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="flex-1 pb-16">
        {user.role === 'admin' ? (
          <AdminDashboard user={user} />
        ) : (
          <EmployeeDashboard user={user} />
        )}
      </main>
      
      {/* Rasmiy footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-300">
            O'zbekiston Respublikasi Davlat Xizmatini Rivojlantirish Agentligi uslubidagi tizim
          </p>
          <p className="mt-1 text-slate-500 text-[11px]">
            © {new Date().getFullYear()} Davlat Xodimlari Davomat va Sog'lom Turmush Tarzi Axborot Tizimi. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>
    </div>
  );
}
