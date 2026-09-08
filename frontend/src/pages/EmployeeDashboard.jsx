import React, { useState, useEffect } from 'react';
import {
  MapPin, CheckCircle, AlertTriangle, Clock, Droplets,
  Activity, Award, RefreshCw, Footprints, Dumbbell,
  Calendar, Check, ChevronRight, Sparkles, Navigation
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

      // GPS tekshirish
      if (attRes.settings) {
        checkGpsLocation(attRes.settings);
      }
    } catch (err) {
      console.error('Yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  // GPS manzilini olish va masofani hisoblash
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

  // Ishga kelishni tasdiqlash
  const handleCheckIn = async () => {
    setActionMessage({ text: '', type: '' });
    if (!currentCoords) {
      alert('Joylashuv koordinatasi aniqlanmagan. Iltimos, "GPS ni yangilash" tugmasini bosing.');
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

  // Ishdan ketishni qayd etish
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

  // Suv miqdorini oshirish/kamaytirish
  const handleWaterClick = async (glassIndex) => {
    const currentGlasses = healthRecord?.waterGlasses || 0;
    // Agar bosilgan stakan hozirgi miqdorga teng bo'lsa, bitta kamaytirish; aks holda bosilgan songacha to'ldirish
    let newAmount = glassIndex + 1;
    if (newAmount === currentGlasses) {
      newAmount = glassIndex; // bittaga kamayadi
    }

    try {
      const res = await api.updateWater(newAmount);
      setHealthRecord(res.record);
      if (newAmount === 8) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 200 metr yugurishni belgilash
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

  // Yengil mashqlarni belgilash
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
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 font-semibold text-sm">Xizmat ma'lumotlari yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Salomlashish va Xodim Profil Kartasi */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400/50 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-700/80 flex items-center justify-center font-bold text-2xl text-white border border-blue-400/30">
                {user?.fullName?.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {user?.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  Xodim
                </span>
              </div>
              <p className="text-blue-200 text-sm mt-1 font-medium">
                {user?.position} — <span className="text-amber-200/90">{user?.department}</span>
              </p>
              <p className="text-slate-400 text-xs mt-1">
                📞 Telefon: {user?.phone}
              </p>
            </div>
          </div>

          {/* Salomatlik reytingi bali */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center space-x-4">
            <div className="w-14 h-14 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs text-blue-200 uppercase font-semibold">
                Kunlik Salomatlik Ko'rsatkichi
              </div>
              <div className="text-2xl font-extrabold text-white">
                {healthRecord?.score || 0} <span className="text-sm font-normal text-amber-300">/ 100 ball</span>
              </div>
              <div className="w-32 bg-white/20 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${healthRecord?.score || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Xabar bildirishnomasi */}
      {actionMessage.text && (
        <div className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-semibold transition-all ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
            : 'bg-red-50 border border-red-300 text-red-800'
        }`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 2 USTUNLI ASOSIY BO'LIM: 1. DAVOMAT (GEOLOCATION GUARD) | 2. SALOMATLIK VA SPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CHAP USTUN: DAVOMAT VA GEOLOKATSIYA HIMOYA TIZIMI (7 USTUN) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Davomat Boshqaruv Qutisi */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-gov border border-slate-200/80">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Kunlik Davomat Tizimi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ishxona hududi (300 metr radius) ichida GPS tasdiqlash
                  </p>
                </div>
              </div>

              <button
                onClick={() => checkGpsLocation()}
                disabled={gpsLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                title="GPS lokatsiyani qayta aniqlash"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>GPS Yangilash</span>
              </button>
            </div>

            {/* GPS va Masofa Ko'rsatkichi (Geofencing Guard) */}
            <div className={`p-4 rounded-2xl mb-6 border transition-all ${
              isWithinRadius
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isWithinRadius ? 'bg-emerald-600 text-white pulse-gps-active' : 'bg-amber-600 text-white'
                }`}>
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isWithinRadius ? '✅ RUXSAT ETILGAN HUDUDDASIZ' : '⚠️ HUDUD CHEGARASIDAN TASHQARIDASIZ'}
                    </span>
                    {distanceToOrg !== null && (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-white/80 shadow-xs">
                        Masofa: {distanceToOrg} metr
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 text-slate-600">
                    {isWithinRadius
                      ? `Siz idoradan ${distanceToOrg} metr masofadasiz (Maksimal ruxsat: ${settings?.allowedRadiusMeters || 300} metr). Davomat tugmalari faol.`
                      : distanceToOrg !== null
                        ? `Idoragacha masofa: ${distanceToOrg} metr. Ishga kelish faqat 300 metr radius ichida ochiladi (aldab bo'lmaydi).`
                        : gpsError || 'GPS koordinatalari olinmoqda...'}
                  </p>
                  {gpsAccuracy && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Aniqlovchanlik: ±{gpsAccuracy} metr • Idora: {settings?.organizationName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Keldi va Ketdi Tugmalari */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Ishga Keldim */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ertalab Kelish
                    </span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {attRecord?.checkInTime || '--:--'}
                  </div>
                  <div className="text-xs mt-1 font-medium">
                    {attRecord?.checkInTime ? (
                      attRecord.status === 'late' ? (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">⚠️ Kechikib kelingan</span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">✅ O'z vaqtida</span>
                      )
                    ) : (
                      <span className="text-slate-400">Belgilanmagan (Muddati: {settings?.workStartTime || '09:00'})</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={Boolean(attRecord?.checkInTime) || !isWithinRadius}
                  className={`mt-4 w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    attRecord?.checkInTime
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : isWithinRadius
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{attRecord?.checkInTime ? 'Kelganingiz Qayd Etilgan' : 'Ishga Keldim'}</span>
                </button>
              </div>

              {/* Ishdan Ketdim */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ishdan Ketish
                    </span>
                    <Clock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {attRecord?.checkOutTime || '--:--'}
                  </div>
                  <div className="text-xs mt-1 font-medium">
                    {attRecord?.checkOutTime ? (
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">✅ Ketish qayd etildi</span>
                    ) : (
                      <span className="text-slate-400">Ish vaqti yakuni: {settings?.workEndTime || '18:00'}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCheckOut}
                  disabled={!attRecord?.checkInTime || Boolean(attRecord?.checkOutTime)}
                  className={`mt-4 w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    attRecord?.checkOutTime
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : attRecord?.checkInTime
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{attRecord?.checkOutTime ? 'Ketganingiz Qayd Etilgan' : 'Ishdan Ketdim'}</span>
                </button>
              </div>

            </div>

          </div>

          {/* Xodimning Davomat Tarixi */}
          <div className="bg-white rounded-3xl p-6 shadow-gov border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Oxirgi Kunlar Davomat Tarixi</span>
              </h3>
              <span className="text-xs text-slate-400">Oxirgi yozuvlar</span>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Tarix mavjud emas</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{item.date}</div>
                      <div className="text-slate-400 text-[11px]">
                        GPS masofa: {item.checkInDistance ? `${item.checkInDistance}m` : 'Qayd etilgan'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-slate-500">Keldi: </span>
                        <span className="font-mono font-bold text-slate-800">{item.checkInTime || '--:--'}</span>
                        <span className="text-slate-500 ml-2">Ketdi: </span>
                        <span className="font-mono font-bold text-slate-800">{item.checkOutTime || '--:--'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'on_time'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.status === 'on_time' ? 'O\'z vaqtida' : 'Kechikkan'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* O'NG USTUN: SOG'LOM TURMUSH TARZI VA SPORT (5 USTUN) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-gov border border-slate-200/80">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Sog'lom Turmush Tarzi
                </h2>
                <p className="text-xs text-slate-500">
                  Davlat xodimlari salomatligi monitoringi
                </p>
              </div>
            </div>

            <div className="space-y-6">
              
              {/* 1. KUNLIK SUV ICHISH REJASI (2 LITR = 8 STAKAN) */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Kunlik Suv Me'yori
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                    {(healthRecord?.waterGlasses || 0) * 0.25} / 2.0 Litr
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Har bir stakanni bosib ichilganini belgilang (8 ta stakan = 2 litr me'yor):
                </p>

                {/* 8 ta interaktiv stakan */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const isFilled = i < (healthRecord?.waterGlasses || 0);
                    return (
                      <button
                        key={i}
                        onClick={() => handleWaterClick(i)}
                        className={`water-glass p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isFilled
                            ? 'bg-blue-600 border-blue-700 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white border-blue-200 text-blue-400 hover:border-blue-400'
                        }`}
                        title={`${i + 1}-stakan (250 ml)`}
                      >
                        <Droplets className={`w-4 h-4 ${isFilled ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-mono mt-1 font-bold">{i + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 200 METR YUGURISH / YURISH */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    healthRecord?.ran200m ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      200 metr Yugurish / Faollik
                    </h4>
                    <p className="text-xs text-slate-500">
                      {healthRecord?.ran200m
                        ? `✅ Bajarildi (Soat ${healthRecord.ran200mTime})`
                        : 'Kunlik 200m yugurish yoki tez yurish'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleRun200m}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    healthRecord?.ran200m
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {healthRecord?.ran200m ? 'Bajarildi ✓' : 'Bajarish'}
                </button>
              </div>

              {/* 3. YENGIL MASHQLAR / BADANTARBIYA */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    healthRecord?.lightExercises ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Ertalabki Badantarbiya
                    </h4>
                    <p className="text-xs text-slate-500">
                      {healthRecord?.lightExercises
                        ? `✅ Bajarildi (Soat ${healthRecord.lightExercisesTime})`
                        : '5-10 daqiqalik yengil jismoniy mashqlar'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleLightExercises}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    healthRecord?.lightExercises
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  {healthRecord?.lightExercises ? 'Bajarildi ✓' : 'Bajarish'}
                </button>
              </div>

              {/* 4. QO'SHIMCHA SPORT MASHG'ULOTI */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    healthRecord?.sportSession?.done ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Sport Mashg'uloti
                    </h4>
                    <p className="text-xs text-slate-500">
                      {healthRecord?.sportSession?.done
                        ? `✅ ${healthRecord.sportSession.type} (${healthRecord.sportSession.durationMinutes} daqiqa)`
                        : 'Turnik, brus, trenajyor, futbol...'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSportModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 font-bold text-xs transition-all cursor-pointer"
                >
                  {healthRecord?.sportSession?.done ? 'Tahrirlash' : '+ Qayd etish'}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* SPORT MASHG'ULOTI MODAL OYNASI */}
      {sportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Sport Mashg'ulotini Belgilash
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Bugun qaysi sport turi bilan qancha vaqt shug'ullandingiz?
            </p>

            <form onSubmit={handleSaveSportSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sport mashg'uloti turi:
                </label>
                <select
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Turnik va brus mashqlari">Turnik va brus mashqlari</option>
                  <option value="Yugurish yo'lakchasi (Treadmill)">Yugurish yo'lakchasi (Treadmill)</option>
                  <option value="Fitnes va kuch mashqlari">Fitnes va kuch mashqlari</option>
                  <option value="Futbol / Mini futbol">Futbol / Mini futbol</option>
                  <option value="Suzish havzasi">Suzish havzasi</option>
                  <option value="Stol tennisi">Stol tennisi</option>
                  <option value="Shaxmat / Aqliy sport">Shaxmat / Aqliy sport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Davomiyligi (daqiqalarda):
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={sportDuration}
                  onChange={(e) => setSportDuration(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Tasdiqlash va Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
