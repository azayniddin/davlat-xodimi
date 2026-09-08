import React, { useState, useEffect } from 'react';
import {
  MapPin, CheckCircle, AlertTriangle, Clock, Droplets,
  Activity, Award, RefreshCw, Footprints, Dumbbell,
  Calendar, Check, ChevronRight, Sparkles, Navigation, Plus, Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { getCurrentPosition, calculateDistance } from '../utils/geo';

export default function EmployeeDashboard({ user }) {
  // Davomat holatlari
  const [loading, setLoading] = useState(true);
  const [attRecord, setAttRecord] = useState(null);
  const [settings, setSettings] = useState(null);

  // Salomatlik holatlari
  const [healthRecord, setHealthRecord] = useState(null);

  // GPS holatlari
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [distanceToOrg, setDistanceToOrg] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Qo'shimcha sport formasi
  const [sportModalOpen, setSportModalOpen] = useState(false);
  const [sportType, setSportType] = useState('Turnik va brus');
  const [sportDuration, setSportDuration] = useState(15);

  // Tarix
  const [history, setHistory] = useState([]);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Ma'lumotlarni yuklash
  const loadData = async () => {
    try {
      setLoading(true);
      const [attRes, healthRes, histRes] = await Promise.all([
        api.getTodayStatus(),
        api.getTodayHealth(),
        api.getMyHistory()
      ]);

      setAttRecord(attRes.record);
      setSettings(attRes.settings);
      setHealthRecord(healthRes.record);
      setHistory(histRes.records || []);

      if (attRes.settings) {
        checkGpsLocation(attRes.settings);
      }
    } catch (err) {
      console.error('Yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  // GPS tekshirish
  const checkGpsLocation = async (activeSettings) => {
    const s = activeSettings || settings;
    if (!s) return;

    setGpsLoading(true);
    setGpsError(null);

    try {
      const pos = await getCurrentPosition();
      setCurrentCoords({ lat: pos.lat, lng: pos.lng });
      setGpsAccuracy(pos.accuracy);

      const dist = calculateDistance(pos.lat, pos.lng, s.orgLat, s.orgLng);
      setDistanceToOrg(dist);
    } catch (err) {
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Ishga kelish
  const handleCheckIn = async () => {
    setActionMessage({ text: '', type: '' });
    if (!currentCoords) {
      alert('Joylashuv koordinatasi aniqlanmagan. "GPS Yangilash" tugmasini bosing.');
      return;
    }

    try {
      const res = await api.checkIn(currentCoords.lat, currentCoords.lng);
      setAttRecord(res.record);
      setActionMessage({ text: res.message, type: 'success' });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      loadData();
    } catch (err) {
      setActionMessage({ text: err.message, type: 'error' });
    }
  };

  // Ishdan ketish
  const handleCheckOut = async () => {
    setActionMessage({ text: '', type: '' });
    try {
      const coords = currentCoords || { lat: settings?.orgLat, lng: settings?.orgLng };
      const res = await api.checkOut(coords.lat, coords.lng);
      setAttRecord(res.record);
      setActionMessage({ text: res.message, type: 'success' });
      loadData();
    } catch (err) {
      setActionMessage({ text: err.message, type: 'error' });
    }
  };

  // Suv miqdori (+1 stakan / -1 stakan)
  const handleWaterStep = async (delta) => {
    const current = healthRecord?.waterGlasses || 0;
    const next = Math.max(0, Math.min(12, current + delta));
    try {
      const res = await api.updateWater(next);
      setHealthRecord(res.record);
      if (next === 8) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 200m yugurish
  const handleToggleRun200m = async () => {
    const nextState = !healthRecord?.ran200m;
    try {
      const res = await api.toggleRun200m(nextState);
      setHealthRecord(res.record);
      if (nextState) {
        confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Yengil mashqlar
  const handleToggleLightExercises = async () => {
    const nextState = !healthRecord?.lightExercises;
    try {
      const res = await api.toggleLightExercises(nextState);
      setHealthRecord(res.record);
      if (nextState) {
        confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sport mashg'ulotini saqlash
  const handleSaveSportSession = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateSportSession({
        done: true,
        type: sportType,
        durationMinutes: Number(sportDuration)
      });
      setHealthRecord(res.record);
      setSportModalOpen(false);
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
    }
  };

  const isWithinRadius = distanceToOrg !== null && settings && distanceToOrg <= settings.allowedRadiusMeters;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 font-semibold text-xs">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* 1. XODIMNING PROFILI VA SALOMATLIK REYTINGI (TELEFONDA HAM IXCHAM) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName}`}
                alt=""
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-amber-300/40 shadow"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-lg font-bold tracking-tight line-clamp-1">
                  {user?.fullName}
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-200 line-clamp-1 font-medium">
                {user?.position}
              </p>
              <p className="text-[10px] text-amber-200/90 line-clamp-1">
                {user?.department}
              </p>
            </div>
          </div>

          {/* Salomatlik bali (Badge) */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/10 text-right flex-shrink-0">
            <div className="text-[9px] sm:text-[10px] text-blue-200 uppercase font-bold">
              Salomatlik Bali
            </div>
            <div className="text-base sm:text-xl font-extrabold text-amber-300 font-mono">
              {healthRecord?.score || 0}%
            </div>
            <div className="w-16 sm:w-24 bg-white/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                style={{ width: `${healthRecord?.score || 0}%` }}
              ></div>
            </div>
          </div>

        </div>
      </div>

      {/* Xabar bildirishnomasi */}
      {actionMessage.text && (
        <div className={`p-3 rounded-xl flex items-center space-x-2.5 text-xs font-semibold ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
            : 'bg-red-50 border border-red-300 text-red-800'
        }`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 2. JONLI GPS HUDUD TEKSHIRUVI (GEOFENCING 300 METR) */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
        isWithinRadius
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
          : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isWithinRadius ? 'bg-emerald-600 text-white pulse-gps-active' : 'bg-amber-600 text-white'
            }`}>
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold tracking-wide uppercase">
                {isWithinRadius ? '✅ IDORA HUDUDIDASIZ' : '⚠️ HUDUDDAN TASHQARIDASIZ'}
              </div>
              <div className="text-[11px] text-slate-600">
                {distanceToOrg !== null
                  ? `Masofa: ${distanceToOrg} metr (Ruxsat: ${settings?.allowedRadiusMeters || 300}m)`
                  : gpsError || 'GPS koordinatasi aniqlanmoqda...'}
              </div>
            </div>
          </div>

          <button
            onClick={() => checkGpsLocation()}
            disabled={gpsLoading}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold flex items-center space-x-1 shadow-xs flex-shrink-0 cursor-pointer"
            title="GPS yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">GPS Yangilash</span>
          </button>
        </div>
      </div>

      {/* 3. KELISH VA KETISH — MOBILDA HAM YONMA-YON 2 TA IXCHAM CARD */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
          Kunlik Davomat (300m hududda)
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          
          {/* Keldim Karta */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-gov flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Kelish</span>
                <Clock className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                {attRecord?.checkInTime || '--:--'}
              </div>
              <div className="text-[10px] mt-0.5">
                {attRecord?.checkInTime ? (
                  attRecord.status === 'late' ? (
                    <span className="text-amber-600 font-semibold">⚠️ Kechikkan</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">✅ O'z vaqtida</span>
                  )
                ) : (
                  <span className="text-slate-400">Reja: {settings?.workStartTime || '09:00'}</span>
                )}
              </div>
            </div>

            <button
              onClick={handleCheckIn}
              disabled={Boolean(attRecord?.checkInTime) || !isWithinRadius}
              className={`mt-3 w-full py-2.5 rounded-xl font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                attRecord?.checkInTime
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isWithinRadius
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{attRecord?.checkInTime ? 'Kelindi' : 'Keldim'}</span>
            </button>
          </div>

          {/* Ketdim Karta */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-gov flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Ketish</span>
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                {attRecord?.checkOutTime || '--:--'}
              </div>
              <div className="text-[10px] mt-0.5">
                {attRecord?.checkOutTime ? (
                  <span className="text-blue-600 font-semibold">✅ Ketildi</span>
                ) : (
                  <span className="text-slate-400">Reja: {settings?.workEndTime || '18:00'}</span>
                )}
              </div>
            </div>

            <button
              onClick={handleCheckOut}
              disabled={!attRecord?.checkInTime || Boolean(attRecord?.checkOutTime)}
              className={`mt-3 w-full py-2.5 rounded-xl font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                attRecord?.checkOutTime
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : attRecord?.checkInTime
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{attRecord?.checkOutTime ? 'Ketildi' : 'Ketdim'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. SOG'LOM TURMUSH TARZI — MOBILDA HAM YONMA-YON (2x2 GRID) IXCHAM CARDLAR */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
          Sog'lom Turmush Tarzi (Kunlik Me'yorlar)
        </div>
        
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          
          {/* KARTA 1: 200M YUGURISH */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-gov flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  healthRecord?.ran200m ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Footprints className="w-4 h-4" />
                </div>
                {healthRecord?.ran200m && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {healthRecord.ran200mTime}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                200m Yugurish
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {healthRecord?.ran200m ? 'Me\'yor bajarildi' : 'Piyoda yoki yugurish'}
              </div>
            </div>

            <button
              onClick={handleToggleRun200m}
              className={`mt-3 w-full py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                healthRecord?.ran200m
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {healthRecord?.ran200m ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{healthRecord?.ran200m ? 'Bajarildi' : 'Bajarish'}</span>
            </button>
          </div>

          {/* KARTA 2: ERTALABKI BADANTARBIYA */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-gov flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  healthRecord?.lightExercises ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                {healthRecord?.lightExercises && (
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {healthRecord.lightExercisesTime}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                Badantarbiya
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {healthRecord?.lightExercises ? 'Mashqlar bajarildi' : '5-10 daqiqa mashq'}
              </div>
            </div>

            <button
              onClick={handleToggleLightExercises}
              className={`mt-3 w-full py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                healthRecord?.lightExercises
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              {healthRecord?.lightExercises ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{healthRecord?.lightExercises ? 'Bajarildi' : 'Bajarish'}</span>
            </button>
          </div>

          {/* KARTA 3: KUNLIK SUV ICHISH (2 LITR) */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-gov flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono font-bold text-blue-700">
                  {((healthRecord?.waterGlasses || 0) * 0.25).toFixed(1)}L / 2L
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                Suv Me'yori
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {healthRecord?.waterGlasses || 0} / 8 stakan ichildi
              </div>
            </div>

            {/* Suvni + va - qilish tugmalari */}
            <div className="mt-3 flex items-center space-x-1.5">
              <button
                onClick={() => handleWaterStep(-1)}
                className="w-8 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
                title="1 stakan kamaytirish"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleWaterStep(1)}
                className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+1 Stakan</span>
              </button>
            </div>
          </div>

          {/* KARTA 4: SPORT MASHG'ULOTI */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-gov flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  healthRecord?.sportSession?.done ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  <Dumbbell className="w-4 h-4" />
                </div>
                {healthRecord?.sportSession?.done && (
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    {healthRecord.sportSession.durationMinutes} daq
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                Sport Mashg'uloti
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                {healthRecord?.sportSession?.done
                  ? healthRecord.sportSession.type
                  : 'Turnik, trenajyor, fitnes...'}
              </div>
            </div>

            <button
              onClick={() => setSportModalOpen(true)}
              className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer text-center"
            >
              {healthRecord?.sportSession?.done ? 'Tahrirlash' : '+ Qayd etish'}
            </button>
          </div>

        </div>
      </div>

      {/* 5. OXIRGI KUNLAR DAVOMAT TARIXI (MOBILDA IXCHAM) */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-gov border border-slate-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Oxirgi Davomat Tarixi</span>
          </div>
          <span className="text-[10px] text-slate-400">Yozuvlar</span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">Tarix mavjud emas</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {history.slice(0, 4).map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 text-xs">{item.date}</div>
                  <div className="text-[10px] text-slate-400">
                    Masofa: {item.checkInDistance ? `${item.checkInDistance}m` : 'Idorada'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right text-[11px]">
                    <span className="text-slate-600 font-mono font-bold">{item.checkInTime || '--:--'}</span>
                    <span className="text-slate-400 mx-1">-</span>
                    <span className="text-slate-600 font-mono font-bold">{item.checkOutTime || '--:--'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    item.status === 'on_time'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status === 'on_time' ? 'O\'z vaqtida' : 'Kechikdi'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SPORT MASHG'ULOTI MODAL OYNASI */}
      {sportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Sport Mashg'ulotini Belgilash
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Qaysi sport turi bilan shug'ullandingiz?
            </p>

            <form onSubmit={handleSaveSportSession} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Sport turi:
                </label>
                <select
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Turnik va brus">Turnik va brus</option>
                  <option value="Fitnes va trenajyor">Fitnes va trenajyor</option>
                  <option value="Yugurish yo'lakchasi">Yugurish yo'lakchasi</option>
                  <option value="Futbol / Mini futbol">Futbol / Mini futbol</option>
                  <option value="Suzish havzasi">Suzish havzasi</option>
                  <option value="Stol tennisi">Stol tennisi</option>
                  <option value="Shaxmat / Aqliy sport">Shaxmat / Aqliy sport</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Davomiyligi (daqiqa):
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={sportDuration}
                  onChange={(e) => setSportDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSportModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md cursor-pointer"
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
