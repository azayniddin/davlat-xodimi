import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Share, PlusSquare, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InstallPromptModal() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // iOS qurilmasini aniqlash (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Agar ilova allaqachon o'rnatilgan (standalone) bo'lsa chiqarmaymiz
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      return;
    }

    // Brauzer PWA o'rnatish hodisasini ushlash (Android Chrome, Edge, Desktop Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Saytga kirgandan 1 soniya o'tib chiroyli bildirishnoma chiqaramiz
      setTimeout(() => setShowPrompt(true), 1200);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS yoki agar prompt bo'lmasa ham birinchi kirishda 1.5 soniyadan so'ng taklif qilish
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('install_prompt_dismissed');
      if (!dismissed && !isStandalone) {
        setShowPrompt(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Agar brauzerda deferredPrompt bo'lmasa, umumiy qo'llanma yoki modal chiqaramiz
      alert("Ilovani o'rnatish uchun brauzeringiz menyusidan (3 ta nuqta) 'Ilovani o'rnatish' yoki 'Bosh ekranga qo'shish' tugmasini bosing.");
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('install_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-subtle">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border-2 border-amber-400/40 shadow-2xl shadow-blue-950/80 text-white relative">
        
        {/* Yopish tugmasi */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Yopish"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-3.5 pr-6">
          {/* Davlat Gerbi Logotipi */}
          <div className="w-12 h-12 rounded-2xl bg-white/10 p-1 border border-amber-300/30 flex-shrink-0 flex items-center justify-center">
            <img
              src="/gerb.png"
              alt="Gerb"
              className="w-10 h-10 object-contain drop-shadow"
            />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Rasmiy Ilova
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white mt-1">
              Sog'liqni Saqlash Agentligi Ilovasi
            </h4>
            <p className="text-xs text-blue-200/80 mt-0.5 leading-snug">
              Davomatni GPS orqali tezkor va oson tasdiqlash uchun rasmiy ilovani telefoningizga o'rnating.
            </p>
          </div>
        </div>

        {/* Tugmalar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2">
          <button
            onClick={handleDismiss}
            className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer text-center"
          >
            Keyinroq
          </button>
          <button
            onClick={handleInstallClick}
            className="w-2/3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ilovani Yuklab Olish</span>
          </button>
        </div>

        {/* iOS uchun tezkor ko'rsatma oynasi */}
        {showIOSGuide && (
          <div className="mt-3 p-3 rounded-2xl bg-blue-950/80 border border-blue-800/60 text-xs text-blue-100">
            <div className="font-bold text-amber-300 flex items-center space-x-1 mb-1">
              <Smartphone className="w-4 h-4" />
              <span>iPhone (Safari) ga o'rnatish:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
              <li>Safari pastidagi <strong>Ulashish (Share)</strong> belgisini bosing.</li>
              <li>Menyudan <strong>"Bosh ekranga qo'shish" (Add to Home Screen)</strong> bandini tanlang.</li>
            </ol>
          </div>
        )}

      </div>
    </div>
  );
}
