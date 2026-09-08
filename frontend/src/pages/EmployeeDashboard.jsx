import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, CheckCircle, AlertTriangle, Clock, Droplets,
  Activity, Award, RefreshCw, Footprints, Dumbbell,
  Calendar, Check, Navigation, Plus, Minus,
  Play, Pause, Flame, HeartPulse, X, Camera, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { getCurrentPosition, calculateDistance } from '../utils/geo';

export default function EmployeeDashboard({ user: initialUser, onUserUpdate }) {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  // =======================================================
  // 1. JONLI 200 METR YUGURISH TREYKERI (FAQAT HAQIQIY GPS)
  // =======================================================
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runDistance, setRunDistance] = useState(0); // Real metrlar
  const [runSeconds, setRunSeconds] = useState(0);
  const watchIdRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const runTimerRef = useRef(null);

  // =======================================================
  // 2. JONLI BADANTARBIYA — QAT'IY 3 DAQIQA (180 SONIYA)
  // =======================================================
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [exerciseActive, setExerciseActive] = useState(false);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(180); // 3 daqiqa = 180 soniya
  const exerciseTimerRef = useRef(null);

  // Qo'shimcha sport formasi
  const [sportModalOpen, setSportModalOpen] = useState(false);
  const [sportType, setSportType] = useState('Turnik va brus');
  const [sportDuration, setSportDuration] = useState(15);

  // Tarix va bildirishnoma
  const [history, setHistory] = useState([]);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Ma'lumotlarni yuklash
  const loadData = async () => {
    try {
      setLoading(true);
      const [attRes, healthRes, histRes, meRes] = await Promise.all([
        api.getTodayStatus(),
        api.getTodayHealth(),
        api.getMyHistory(),
        api.getMe().catch(() => null)
      ]);

      setAttRecord(attRes.record);
      setSettings(attRes.settings);
      setHealthRecord(healthRes.record);
      setHistory(histRes.records || []);
      if (meRes?.user) {
        setCurrentUser(meRes.user);
      }

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
    return () => {
      stopRunningTracker();
      stopExerciseTimer();
    };
  }, []);

  // =======================================================
  // PROFIL RASMINI YUKLASH VA YANGILASH
  // =======================================================
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Iltimos, faqat rasm faylini tanlang (PNG, JPG, JPEG)');
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        // Rasmni ixcham kvadrat shaklda siqish (250x250)
        const canvas = document.createElement('canvas');
        const size = 250;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Center crop
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        const base64Avatar = canvas.toDataURL('image/jpeg', 0.85);

        try {
          const res = await api.updateProfile({ avatar: base64Avatar });
          setCurrentUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
          if (onUserUpdate) onUserUpdate(res.user);
          setActionMessage({ text: 'Profil rasmingiz muvaffaqiyatli yangilandi!', type: 'success' });
        } catch (err) {
          alert('Rasm saqlashda xatolik: ' + err.message);
        } finally {
          setAvatarUploading(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // =======================================================
  // JONLI 200 METR YUGURISH — FAQAT HAQIQIY HARAKAT
  // =======================================================
  const startRunningTracker = () => {
    setIsRunning(true);
    lastCoordsRef.current = null;

    // Sekundomer
    runTimerRef.current = setInterval(() => {
      setRunSeconds(prev => prev + 1);
    }, 1000);

    // Haqiqiy GPS kuzatuvi
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          if (lastCoordsRef.current) {
            const addedMeters = calculateDistance(
              lastCoordsRef.current.lat,
              lastCoordsRef.current.lng,
              lat,
              lng
            );

            // Shovqin va teleportatsiyani filtrlash (1m dan 35m gacha oraliq haqiqiy qadam/yugurish hisoblanadi)
            if (addedMeters >= 1 && addedMeters <= 35) {
              setRunDistance(prev => {
                const nextDist = prev + addedMeters;
                // 200 metrga yetganda avtomatik yakunlash
                if (nextDist >= 200 && prev < 200) {
                  autoCompleteRun(nextDist);
                }
                return nextDist;
              });
            }
          }
          lastCoordsRef.current = { lat, lng };
        },
        (err) => console.warn('GPS kuzatuvida xatolik:', err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );
    }
  };

  const stopRunningTracker = () => {
    setIsRunning(false);
    if (runTimerRef.current) {
      clearInterval(runTimerRef.current);
      runTimerRef.current = null;
    }
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // 200 metrga yetganda avtomatik saqlash
  const autoCompleteRun = async (achievedDistance) => {
    stopRunningTracker();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    try {
      const res = await api.toggleRun200m({
        ran: true,
        distance: achievedDistance,
        durationSeconds: runSeconds || 90
      });
      setHealthRecord(res.record);
      setActionMessage({
        text: `200 metr me'yor to'liq bajarildi! (${achievedDistance} metr bosib o'tildi, vaqt: ${formatTime(runSeconds)})`,
        type: 'success'
      });
      setTimeout(() => {
        setRunModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  // Bekor qilish / To'xtatish
  const handleCancelRun = () => {
    stopRunningTracker();
    if (runDistance < 200) {
      alert(`Siz 200 metr me'yorni to'liq bajarmadingiz (Hozircha: ${runDistance} metr). Me'yor saqlanmadi.`);
    }
    setRunModalOpen(false);
  };

  // =======================================================
  // JONLI BADANTARBIYA — QAT'IY 3 DAQIQA (180 SONIYA)
  // =======================================================
  const startExerciseCoach = () => {
    setExerciseActive(true);
    exerciseTimerRef.current = setInterval(() => {
      setExerciseTimeLeft(prev => {
        if (prev <= 1) {
          // 3 daqiqa to'ldi! Avtomatik yakunlash
          autoCompleteExercises();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopExerciseTimer = () => {
    setExerciseActive(false);
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
      exerciseTimerRef.current = null;
    }
  };

  // 3 daqiqa to'lganda avtomatik yopilish va saqlanish
  const autoCompleteExercises = async () => {
    stopExerciseTimer();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    try {
      const res = await api.toggleLightExercises({
        done: true,
        durationMinutes: 3,
        exercisesList: ["Bo'yin va yelka", "Bel va umurtqa", "Oyoqlar va nafas mashqlari"]
      });
      setHealthRecord(res.record);
      setActionMessage({
        text: '3 daqiqalik ertalabki badantarbiya muvaffaqiyatli yakunlandi va tizimda tasdiqlandi!',
        type: 'success'
      });
      setTimeout(() => {
        setExerciseModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  // =======================================================
  // DAVOMAT (CHECK-IN / CHECK-OUT)
  // =======================================================
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

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
      
      {/* 1. XODIMNING PROFILI VA PROFIL RASMINI O'ZGARTIRISH */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Profil rasmi va yuklash tugmasi */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Profil rasmini o'zgartirish">
              <img
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.fullName}`}
                alt=""
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-300/40 shadow group-hover:opacity-80 transition-all"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow">
                <Camera className="w-3 h-3" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarSelect}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-lg font-bold tracking-tight line-clamp-1">
                  {currentUser?.fullName}
                </h1>
                {avatarUploading && (
                  <span className="text-[10px] text-amber-300 animate-pulse font-medium">
                    Yuklanmoqda...
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-blue-200 line-clamp-1 font-medium">
                {currentUser?.position}
              </p>
              <p className="text-[10px] text-amber-200/90 line-clamp-1">
                {currentUser?.department}
              </p>
            </div>
          </div>

          {/* Salomatlik bali */}
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

      {/* 2. JONLI GPS HUDUD TEKSHIRUVI (300 METR) */}
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

      {/* 3. KELISH VA KETISH — MOBILDA YONMA-YON 2 TA IXCHAM CARD */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
          Kunlik Davomat (300m hududda)
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          
          {/* Keldim */}
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

          {/* Ketdim */}
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

      {/* 4. SOG'LOM TURMUSH TARZI — FAQAT ANIQ VA QAT'IY HISOB-KITOBLAR BILAN */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
          Sog'lom Turmush Tarzi (Haqiqiy GPS va 3-Daqiqalik Mashq)
        </div>
        
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          
          {/* KARTA 1: 200M YUGURISH — FAQAT HAQIQIY HARAKAT BILAN */}
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
                    {healthRecord.ranDistance || 200}m
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                200m Yugurish
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {healthRecord?.ran200m
                  ? `✅ Bajarildi (${healthRecord.ranDurationSeconds ? formatTime(healthRecord.ranDurationSeconds) : '01:30'})`
                  : 'Avtomatik GPS hisobi'}
              </div>
            </div>

            <button
              onClick={() => {
                setRunDistance(0);
                setRunSeconds(0);
                setRunModalOpen(true);
              }}
              className={`mt-3 w-full py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                healthRecord?.ran200m
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{healthRecord?.ran200m ? 'Qayta yugurish' : 'Boshlash'}</span>
            </button>
          </div>

          {/* KARTA 2: ERTALABKI BADANTARBIYA — QAT'IY 3 DAQIQA */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-gov flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  healthRecord?.lightExercises ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                {healthRecord?.lightExercises && (
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    3 daqiqa
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                Badantarbiya
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {healthRecord?.lightExercises
                  ? `✅ 3 daqiqa bajarildi`
                  : 'Qat\'iy 3 daqiqa mashq'}
              </div>
            </div>

            <button
              onClick={() => {
                setExerciseTimeLeft(180);
                setExerciseModalOpen(true);
              }}
              className={`mt-3 w-full py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                healthRecord?.lightExercises
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{healthRecord?.lightExercises ? 'Qayta bajarish' : 'Mashq boshlash'}</span>
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
                  : 'Turnik, fitnes, yugurish...'}
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

      {/* 5. OXIRGI KUNLAR DAVOMAT TARIXI */}
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

      {/* ========================================================================= */}
      {/* MODAL 1: JONLI 200M YUGURISH TREYKERI (FAQAT HAQIQIY HARAKATLANISHDA)     */}
      {/* ========================================================================= */}
      {runModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center relative overflow-hidden">
            
            <button
              onClick={handleCancelRun}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mb-3">
              <Footprints className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              200 Metr Yugurish
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Haqiqiy GPS harakati orqali avtomatik o'lchanadi
            </p>

            {/* Jonli Masofa ko'rsatkichi */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bosib O'tilgan Masofa
              </div>
              <div className="text-4xl font-black font-mono text-emerald-600 mt-1">
                {runDistance} <span className="text-lg text-slate-500 font-sans">/ 200m</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((runDistance / 200) * 100))}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1">
                <span>0m</span>
                <span className="font-bold text-emerald-600">{Math.min(100, Math.round((runDistance / 200) * 100))}%</span>
                <span>200m</span>
              </div>
            </div>

            {/* Jonli Sekundomer */}
            <div className="flex items-center justify-center space-x-2 text-slate-700 font-mono text-xl font-bold mb-4 bg-slate-100 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>{formatTime(runSeconds)}</span>
            </div>

            <div className="text-[11px] text-slate-500 mb-4 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
              {isRunning
                ? "📍 GPS faol! Yurganda yoki yugurganda metrlar avtomatik oshib boradi. 200 metrga yetganda me'yor o'zi avtomatik tasdiqlanadi."
                : "Boshlash tugmasini bosing va harakatlanishni boshlang."}
            </div>

            {/* Boshqaruv tugmalari */}
            <div className="space-y-2">
              {!isRunning ? (
                <button
                  onClick={startRunningTracker}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Harakatni Boshlash</span>
                </button>
              ) : (
                <button
                  onClick={stopRunningTracker}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pauza qilish</span>
                </button>
              )}

              <button
                onClick={handleCancelRun}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: JONLI BADANTARBIYA — QAT'IY 3 DAQIQA (180s) O'TGANDA AVTOMATIK    */}
      {/* ========================================================================= */}
      {exerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center relative overflow-hidden">
            
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mb-2">
              <Activity className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              Ertalabki Badantarbiya
            </h3>
            
            <p className="text-xs text-slate-500 mt-1">
              Davlat standarti: <strong>Qat'iy 3 daqiqa</strong> jismoniy tarbiya
            </p>

            {/* Katta 3 Daqiqalik Teskari Taymer (Countdown) */}
            <div className="my-5 p-5 rounded-3xl bg-indigo-50 border-2 border-indigo-200">
              <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Qolgan vaqt:
              </div>
              <div className="text-5xl font-black font-mono text-indigo-600 my-1">
                {formatTime(exerciseTimeLeft)}
              </div>
              <div className="text-xs text-indigo-900 font-semibold mt-1">
                {exerciseTimeLeft > 120
                  ? "1-bosqich: Bo'yin, yelka va qo'l mushaklari mashqlari"
                  : exerciseTimeLeft > 60
                    ? "2-bosqich: Bel va umurtqa pog'onasini yozish mashqlari"
                    : "3-bosqich: Chuqur nafas olish va mushaklarni tiklash"}
              </div>
            </div>

            {/* Qat'iy qoida eslatmasi */}
            <div className="flex items-center space-x-2 text-[11px] text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 mb-4 text-left">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                3 daqiqa to'liq tugamaguncha oyna yopilmaydi. Vaqt tugashi bilan oyna avtomatik tarzda yopiladi va tasdiqlanadi.
              </span>
            </div>

            {/* Boshqaruv tugmalari */}
            <div className="space-y-2">
              {!exerciseActive ? (
                <button
                  onClick={startExerciseCoach}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>3 Daqiqalik Mashqni Boshlash</span>
                </button>
              ) : (
                <div className="flex items-center justify-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-200 animate-pulse">
                  <span>⏱️ Mashg'ulot davom etmoqda...</span>
                </div>
              )}

              {/* Agar 3 daqiqa to'liq tugagan bo'lsa */}
              {exerciseTimeLeft === 0 && (
                <div className="text-xs font-bold text-emerald-600">
                  ✅ 3 daqiqa to'ldi! Natija saqlanmoqda...
                </div>
              )}
            </div>

          </div>
        </div>
      )}

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
