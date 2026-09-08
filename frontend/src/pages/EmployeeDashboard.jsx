import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, CheckCircle, AlertTriangle, Clock, Droplets,
  Activity, Award, RefreshCw, Footprints, Dumbbell,
  Calendar, Check, ChevronRight, Sparkles, Navigation, Plus, Minus,
  Play, Pause, Square, Flame, HeartPulse, X
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

  // ==========================================
  // JONLI 200 METR YUGURISH TREYKERI (LIVE GPS)
  // ==========================================
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runDistance, setRunDistance] = useState(0); // Metrlarda
  const [runSeconds, setRunSeconds] = useState(0);
  const watchIdRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const runTimerRef = useRef(null);

  // ==========================================
  // JONLI BADANTARBIYA MURABBIYI (EXERCISE COACH)
  // ==========================================
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [exerciseActive, setExerciseActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseSecondsLeft, setExerciseSecondsLeft] = useState(60);
  const [totalExerciseSeconds, setTotalExerciseSeconds] = useState(0);
  const exerciseTimerRef = useRef(null);

  const EXERCISE_STEPS = [
    {
      name: "Bo'yin va yelka mashqlari",
      desc: "Boshingizni o'ngga, chapga va doirasimon sekin harakatlantiring. Bo'yin mushaklaridagi zo'riqishni yozing.",
      duration: 60,
      icon: "🧘‍♂️"
    },
    {
      name: "Qo'llar va ko'krak qafasi",
      desc: "Qo'llarni oldinga va yonga cho'zib, yelka bo'g'imlarini aylantiring. Gavdani tik tuting.",
      duration: 90,
      icon: "🤸‍♂️"
    },
    {
      name: "Bel va umurtqa pog'onasi",
      desc: "Qo'llar belda, gavdani o'ngga va chapga eging. Oyoqlarni yelka kengligida qo'ying.",
      duration: 90,
      icon: "⚡"
    },
    {
      name: "Oyoqlar va o'tirib-turish (Squats)",
      desc: "O'rtacha tempda 15-20 marta o'tirib turing. Nafas olish ritmini bir tekisda saqlang.",
      duration: 120,
      icon: "🏃‍♂️"
    },
    {
      name: "Chuqur nafas olish va dam olish",
      desc: "Burun orqali chuqur nafas oling, og'iz orqali sekin chiqaring. Mushaklarni to'liq bo'shashtiring.",
      duration: 60,
      icon: "🌬️"
    }
  ];

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
    return () => {
      stopRunningTracker();
      stopExerciseTimer();
    };
  }, []);

  // ==========================================
  // JONLI YUGURISH FUNKSIYALARI
  // ==========================================
  const startRunningTracker = () => {
    setIsRunning(true);
    lastCoordsRef.current = null;

    // Sekundomer
    runTimerRef.current = setInterval(() => {
      setRunSeconds(prev => prev + 1);
    }, 1000);

    // Jonli GPS kuzatuvi
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
            // Agar kichik shovqin bo'lmasa (> 1m va < 25m bir soniyada)
            if (addedMeters >= 1 && addedMeters < 50) {
              setRunDistance(prev => {
                const nextDist = prev + addedMeters;
                // 200 metrga yetganda tabriklash
                if (nextDist >= 200 && prev < 200) {
                  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
                return nextDist;
              });
            }
          }
          lastCoordsRef.current = { lat, lng };
        },
        (err) => console.warn('GPS watch error:', err),
        { enableHighAccuracy: true, maximumAge: 1000 }
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

  // Sinov uchun masofani qo'lda +20 metr oshirish (Simulyatsiya)
  const handleSimulateRunStep = () => {
    setRunDistance(prev => {
      const nextDist = prev + 25;
      if (nextDist >= 200 && prev < 200) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      return nextDist;
    });
  };

  // Yugurishni yakunlash va serverga saqlash
  const handleFinishRun = async () => {
    stopRunningTracker();
    const finalDist = Math.max(runDistance, 200);
    try {
      const res = await api.toggleRun200m({
        ran: true,
        distance: finalDist,
        durationSeconds: runSeconds || 90
      });
      setHealthRecord(res.record);
      setRunModalOpen(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setActionMessage({ text: `200m yugurish me'yori muvaffaqiyatli saqlandi! (${finalDist} metr, ${Math.floor(runSeconds / 60)} daq ${runSeconds % 60} sek)`, type: 'success' });
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // JONLI BADANTARBIYA FUNKSIYALARI
  // ==========================================
  const startExerciseCoach = () => {
    setExerciseActive(true);
    exerciseTimerRef.current = setInterval(() => {
      setTotalExerciseSeconds(prev => prev + 1);
      setExerciseSecondsLeft(prev => {
        if (prev <= 1) {
          // Navbatdagi mashqqa o'tish
          setCurrentExerciseIndex(idx => {
            if (idx + 1 < EXERCISE_STEPS.length) {
              return idx + 1;
            } else {
              // Barcha mashqlar yakunlandi!
              return idx;
            }
          });
          return 60; // Keyingi mashq davomiyligi
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

  const handleNextExercise = () => {
    if (currentExerciseIndex + 1 < EXERCISE_STEPS.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setExerciseSecondsLeft(EXERCISE_STEPS[currentExerciseIndex + 1].duration);
    }
  };

  // Badantarbiya yakunlash va serverga saqlash
  const handleFinishExercises = async () => {
    stopExerciseTimer();
    const durationMins = Math.max(1, Math.round(totalExerciseSeconds / 60)) || 7;
    try {
      const res = await api.toggleLightExercises({
        done: true,
        durationMinutes: durationMins,
        exercisesList: EXERCISE_STEPS.map(s => s.name)
      });
      setHealthRecord(res.record);
      setExerciseModalOpen(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setActionMessage({ text: `Ertalabki badantarbiya muvaffaqiyatli yakunlandi! (${durationMins} daqiqa)`, type: 'success' });
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // DAVOMAT (CHECK-IN / CHECK-OUT)
  // ==========================================
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

  // Vaqtni formatlash (MM:SS)
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
      
      {/* 1. XODIMNING PROFILI VA SALOMATLIK REYTINGI */}
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

      {/* 4. SOG'LOM TURMUSH TARZI — JONLI JARAYON VA TAYMERLAR BILAN ISHLAYDI! */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
          Sog'lom Turmush Tarzi (Jonli Jarayon & Mashg'ulotlar)
        </div>
        
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          
          {/* KARTA 1: 200M YUGURISH — JONLI GPS & MASOFA TREYKERI */}
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
                  : 'Jonli GPS & Sekundomer'}
              </div>
            </div>

            <button
              onClick={() => {
                setRunDistance(healthRecord?.ranDistance || 0);
                setRunSeconds(healthRecord?.ranDurationSeconds || 0);
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

          {/* KARTA 2: ERTALABKI BADANTARBIYA — JONLI MURABBIY VA TAYMER */}
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
                    {healthRecord.exercisesDurationMinutes || 7} daq
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                Badantarbiya
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {healthRecord?.lightExercises
                  ? `✅ Bajarildi (${healthRecord.lightExercisesTime})`
                  : '5 bosqichli jonli mashq'}
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentExerciseIndex(0);
                setExerciseSecondsLeft(EXERCISE_STEPS[0].duration);
                setTotalExerciseSeconds(0);
                setExerciseModalOpen(true);
              }}
              className={`mt-3 w-full py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                healthRecord?.lightExercises
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>{healthRecord?.lightExercises ? 'Mashq ko\'rish' : 'Mashq boshlash'}</span>
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
      {/* MODAL 1: JONLI 200M YUGURISH TREYKERI (LIVE GPS & TIMER)                   */}
      {/* ========================================================================= */}
      {runModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center relative overflow-hidden">
            
            <button
              onClick={() => { stopRunningTracker(); setRunModalOpen(false); }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mb-3">
              <Footprints className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              200 Metr Yugurish Treykeri
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real vaqtda bosib o'tilgan masofa va sarflangan vaqt
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
            <div className="flex items-center justify-center space-x-2 text-slate-700 font-mono text-xl font-bold mb-5 bg-slate-100 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>{formatTime(runSeconds)}</span>
            </div>

            {/* Boshqaruv tugmalari */}
            <div className="space-y-2">
              {!isRunning ? (
                <button
                  onClick={startRunningTracker}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Yugurishni Boshlash</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={stopRunningTracker}
                    className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pauza</span>
                  </button>
                  <button
                    onClick={handleFinishRun}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Yakunlash</span>
                  </button>
                </div>
              )}

              {/* Qo'lda sinov simulyatsiyasi tugmasi */}
              <button
                onClick={handleSimulateRunStep}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold cursor-pointer"
              >
                👣 Qadam bosish (+25 metr qo'shish)
              </button>

              {runDistance >= 200 && !isRunning && (
                <button
                  onClick={handleFinishRun}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  ✅ Natijani Saqlash
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: JONLI BADANTARBIYA MURABBIYI (INTERACTIVE EXERCISE COACH)       */}
      {/* ========================================================================= */}
      {exerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center relative overflow-hidden">
            
            <button
              onClick={() => { stopExerciseTimer(); setExerciseModalOpen(false); }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-4xl mb-2">
              {EXERCISE_STEPS[currentExerciseIndex].icon}
            </div>

            <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider mb-1">
              {currentExerciseIndex + 1}-bosqich / 5
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              {EXERCISE_STEPS[currentExerciseIndex].name}
            </h3>
            
            <p className="text-xs text-slate-600 mt-2 px-3 min-h-[40px] flex items-center justify-center">
              {EXERCISE_STEPS[currentExerciseIndex].desc}
            </p>

            {/* Taymer doirasi */}
            <div className="my-5 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-around">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Joriy mashq</div>
                <div className="text-3xl font-black font-mono text-indigo-600">
                  {formatTime(exerciseSecondsLeft)}
                </div>
              </div>
              <div className="w-px h-10 bg-indigo-200"></div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Jami mashq vaqti</div>
                <div className="text-3xl font-black font-mono text-slate-800">
                  {formatTime(totalExerciseSeconds)}
                </div>
              </div>
            </div>

            {/* Boshqaruv tugmalari */}
            <div className="space-y-2">
              {!exerciseActive ? (
                <button
                  onClick={startExerciseCoach}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Mashqni Boshlash</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={stopExerciseTimer}
                    className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pauza</span>
                  </button>
                  <button
                    onClick={handleNextExercise}
                    disabled={currentExerciseIndex >= EXERCISE_STEPS.length - 1}
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-40"
                  >
                    <span>Keyingi mashq</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={handleFinishExercises}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Mashg'ulotni Yakunlash ({Math.max(1, Math.round(totalExerciseSeconds / 60))} daqiqa)</span>
              </button>
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
