import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, Clock, AlertTriangle, Activity, Droplets,
  Footprints, Search, Plus, MapPin, Download, RefreshCw,
  Phone, Building2, Check, X, Dumbbell, Shield, Settings, Trash2, Edit
} from 'lucide-react';
import { api } from '../services/api';
import { getCurrentPosition } from '../utils/geo';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Modallar
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsData, setSettingsData] = useState({
    organizationName: '',
    orgLat: 41.311081,
    orgLng: 69.279737,
    allowedRadiusMeters: 300,
    workStartTime: '09:00',
    workEndTime: '18:00'
  });

  // Yangi xodim formasi
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    phone: '+998',
    position: '',
    department: '',
    password: 'xodim123'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Ma'lumotlarni yuklash
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, empRes, setRes] = await Promise.all([
        api.getDashboardStats(),
        api.getEmployees(),
        api.getSettings()
      ]);

      setStats(statsRes);
      setEmployees(empRes.employees || []);
      if (setRes.settings) {
        setSettingsData(setRes.settings);
      }
    } catch (err) {
      console.error('Admin yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Yangi xodim yaratish
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.createEmployee(newEmployee);
      setFormSuccess('Yangi xodim muvaffaqiyatli ro\'yxatga olindi!');
      setNewEmployee({
        fullName: '',
        phone: '+998',
        position: '',
        department: '',
        password: 'xodim123'
      });
      setTimeout(() => {
        setAddModalOpen(false);
        setFormSuccess('');
      }, 1200);
      loadAdminData();
    } catch (err) {
      setFormError(err.message || 'Xodimni qo\'shishda xatolik yuz berdi');
    }
  };

  // Xodimni o'chirish
  const handleDeleteEmployee = async (empId, empName) => {
    if (confirm(`Haqiqatan ham "${empName}" xodimini tizimdan o'chirmoqchimisiz?`)) {
      try {
        await api.deleteEmployee(empId);
        loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Boshliqning joriy joylashuvini idora koordinatasi sifatida olish
  const handleUseCurrentLocationForOrg = async () => {
    try {
      const pos = await getCurrentPosition();
      setSettingsData(prev => ({
        ...prev,
        orgLat: pos.lat,
        orgLng: pos.lng
      }));
      alert(`Joriy joylashuvingiz olindi:\nKenglik: ${pos.lat}\nUzunlik: ${pos.lng}`);
    } catch (err) {
      alert('Joylashuvni aniqlab bo\'lmadi: ' + err.message);
    }
  };

  // Sozlamalarni saqlash
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(settingsData);
      alert('Tashkilot lokatsiyasi va radius parametrlari saqlandi!');
      setSettingsModalOpen(false);
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // CSV formatida hisobot eksport qilish
  const handleExportCSV = () => {
    if (!employees.length) return;

    const headers = [
      'Ism-familiya-otasining ismi',
      'Telefon',
      'Lavozim',
      'Bolim',
      'Kelish vaqti',
      'Holati',
      'Ketish vaqti',
      '200m Yugurish',
      'Badantarbiya',
      'Suv (stakan)',
      'Qoshimcha sport',
      'Salomatlik bali'
    ];

    const rows = employees.map(emp => [
      `"${emp.fullName}"`,
      `"${emp.phone}"`,
      `"${emp.position}"`,
      `"${emp.department}"`,
      emp.todayAttendance?.checkInTime || 'Kelmagan',
      emp.todayAttendance?.status === 'on_time' ? 'Oz vaqtida' : emp.todayAttendance?.status === 'late' ? 'Kechikkan' : 'Kelmadi',
      emp.todayAttendance?.checkOutTime || '--',
      emp.todayHealth?.ran200m ? 'Bajarildi' : 'Bajarilmadi',
      emp.todayHealth?.lightExercises ? 'Bajarildi' : 'Bajarilmadi',
      emp.todayHealth?.waterGlasses || 0,
      emp.todayHealth?.sportSession?.done ? `"${emp.todayHealth.sportSession.type}"` : 'Yoq',
      emp.todayHealth?.score || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `davomat_va_sport_hisoboti_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrlangan xodimlar ro'yxati
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Barcha mavjud bo'limlar ro'yxati
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Boshqaruv Qismi Sarlavhasi va Tezkor Amallar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Boshqaruv Paneli
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
              Boshliq
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Xodimlar davomati, kelish/ketish vaqtlari va sog'lom turmush tarzi monitoringi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadAdminData()}
            className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yangilash</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            title="Excel/CSV eksport qilish"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Hisobotni yuklab olish</span>
          </button>

          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            title="GPS va radius sozlamalari"
          >
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>Idora Lokatsiyasi (300m)</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center space-x-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Xodim</span>
          </button>
        </div>
      </div>

      {/* STATISTIK KARTALAR (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Jami Xodimlar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-gov">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Jami Xodimlar</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.totalEmployees || 0} nafar
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ro'yxatga olingan</div>
        </div>

        {/* Bugun Kelganlar */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-gov">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bugun Kelgan</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {stats?.attendance?.arrivedCount || 0} nafar
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {stats?.attendance?.arrivedPercentage || 0}% qatnashuv
          </div>
        </div>

        {/* Kechikkanlar */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-gov">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Kechikkanlar</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {stats?.attendance?.lateCount || 0} nafar
          </div>
          <div className="text-[11px] text-amber-600 mt-1">
            09:00 dan keyin kelgan
          </div>
        </div>

        {/* Kelmaganlar */}
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-gov">
          <div className="flex items-center justify-between text-red-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Kelmaganlar</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-700">
            {stats?.attendance?.absentCount || 0} nafar
          </div>
          <div className="text-[11px] text-red-600 mt-1">
            Hozircha davomat yo'q
          </div>
        </div>

        {/* 200m Yugurganlar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-gov">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">200m Yugurish</span>
            <Footprints className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.health?.ran200mCount || 0} nafar
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Sport me'yori bajarildi
          </div>
        </div>

        {/* Badantarbiya / Sport */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-gov">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Badantarbiya</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.health?.lightExercisesCount || 0} nafar
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            O'rtacha suv: {stats?.health?.avgWaterGlasses || 0} stakan
          </div>
        </div>

      </div>

      {/* XODIMLAR DAVOMATI VA SPORT MONITORINGI JADVALI */}
      <div className="bg-white rounded-3xl shadow-gov border border-slate-200 overflow-hidden">
        
        {/* Qidiruv va Filtr Paneli */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Ism, familiya, telefon yoki lavozim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Barcha bo'limlar</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              Topildi: <strong>{filteredEmployees.length}</strong> ta xodim
            </span>
          </div>
        </div>

        {/* Jadval */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4">Xodim (F.I.O)</th>
                <th className="py-3.5 px-4">Lavozim va Bo'lim</th>
                <th className="py-3.5 px-4">Telefon</th>
                <th className="py-3.5 px-4">Ertalab Keldi</th>
                <th className="py-3.5 px-4">Ketish Vaqti</th>
                <th className="py-3.5 px-4">200m Yugurish</th>
                <th className="py-3.5 px-4">Badantarbiya</th>
                <th className="py-3.5 px-4">Suv Me'yori</th>
                <th className="py-3.5 px-4">Salomatlik Bali</th>
                <th className="py-3.5 px-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-slate-400">
                    Xodimlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const att = emp.todayAttendance;
                  const hlth = emp.todayHealth;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Ism familiya va avatar */}
                      <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <img
                            src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${emp.fullName}`}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{emp.fullName}</div>
                            <div className="text-[10px] text-slate-400">ID: {emp.id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Lavozim va bo'lim */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{emp.position}</div>
                        <div className="text-[11px] text-slate-500">{emp.department}</div>
                      </td>

                      {/* Telefon */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-600">
                        {emp.phone}
                      </td>

                      {/* Kelish vaqti va GPS holati */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {att?.checkInTime ? (
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-slate-900">{att.checkInTime}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                att.status === 'on_time'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {att.status === 'on_time' ? 'O\'z vaqtida' : 'Kechikdi'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              GPS: {att.distance ? `${att.distance}m idoradan` : 'Idorada'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800">
                            Kelmadi
                          </span>
                        )}
                      </td>

                      {/* Ketish vaqti */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-700">
                        {att?.checkOutTime || '--:--'}
                      </td>

                      {/* 200m Yugurish */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {hlth?.ran200m ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3" />
                            <span>Bajarildi ({hlth.ran200mTime})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                            <X className="w-3 h-3" />
                            <span>Yo'q</span>
                          </span>
                        )}
                      </td>

                      {/* Badantarbiya */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {hlth?.lightExercises ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            <Check className="w-3 h-3" />
                            <span>Bajarildi ({hlth.lightExercisesTime})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                            <X className="w-3 h-3" />
                            <span>Yo'q</span>
                          </span>
                        )}
                      </td>

                      {/* Suv me'yori */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-bold text-slate-800">{hlth?.waterGlasses || 0}</span>
                          <span className="text-slate-400">/ 8 stakan</span>
                        </div>
                      </td>

                      {/* Salomatlik balli */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900">{hlth?.score || 0}%</span>
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-emerald-500"
                              style={{ width: `${hlth?.score || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* O'chirish amali */}
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.fullName)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          title="Xodimni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL 1: YANGI XODIM QO'SHISH */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Yangi Davlat Xodimini Ro'yxatga Olish
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Xodimning F.I.O, lavozimi, bo'limi va tizimga kirish parolini kiriting
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ism, Familiya, Otasining ismi (F.I.O) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Qodirov Azizbek Farhodovich"
                  value={newEmployee.fullName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefon raqam *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+998901112233"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Boshlang'ich Parol *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="xodim123"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bo'lim
                  </label>
                  <input
                    type="text"
                    placeholder="Axborot texnologiyalari bo'limi"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lavozim
                  </label>
                  <input
                    type="text"
                    placeholder="Bosh mutaxassis"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Xodimni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TASHKILOT GPS VA 300 METR RADIUS SOZLAMALARI */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Idora Geolocation va Qoidalar
                </h3>
                <p className="text-xs text-slate-500">
                  Xodimlar faqat belgilangan radius ichida davomat tasdiqlay oladi
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tashkilot nomi:
                </label>
                <input
                  type="text"
                  value={settingsData.organizationName}
                  onChange={(e) => setSettingsData({ ...settingsData, organizationName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Tezkor "Hozirgi turgan joyimni idora deb belgilash" */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-blue-900">
                  Boshliq turgan joyini idora koordinatasi deb o'rnatish:
                </span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocationForOrg}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  📍 Joylashuvimni olish
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kenglik (Latitude):
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settingsData.orgLat}
                    onChange={(e) => setSettingsData({ ...settingsData, orgLat: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Uzunlik (Longitude):
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settingsData.orgLng}
                    onChange={(e) => setSettingsData({ ...settingsData, orgLng: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ruxsat etilgan radius (metrlarda - talab: 300 metr):
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={settingsData.allowedRadiusMeters}
                  onChange={(e) => setSettingsData({ ...settingsData, allowedRadiusMeters: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-amber-700"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * Xodim 300 metrdan tashqarida bo'lsa, tizim qat'iy ravishda davomatni bloklaydi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ish boshlanish vaqti:
                  </label>
                  <input
                    type="time"
                    value={settingsData.workStartTime}
                    onChange={(e) => setSettingsData({ ...settingsData, workStartTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ish tugash vaqti:
                  </label>
                  <input
                    type="time"
                    value={settingsData.workEndTime}
                    onChange={(e) => setSettingsData({ ...settingsData, workEndTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
