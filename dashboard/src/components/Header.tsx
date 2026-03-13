import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TARGET_APP } from "../data/demo";

export function Header() {
  const { t, i18n } = useTranslation();
  const [seconds, setSeconds] = useState(222);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(nextLng);
  };

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-[rgba(0,240,255,0.2)] bg-[rgba(10,14,26,0.9)]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#00f0ff] shadow-[0_0_12px_#00f0ff] pulse-glow" />
          <span className="font-semibold tracking-[0.3em] text-[#00f0ff] text-sm">{t('header.title')}</span>
        </div>
        <span className="text-white/40 font-mono text-xs">CYBERNEXUS</span>
      </div>
      <div className="flex items-center gap-8 font-mono text-sm">
        <button 
          onClick={toggleLanguage}
          className="px-3 py-1 rounded border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors cursor-pointer"
        >
          {i18n.language === 'zh' ? 'EN' : '中'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white/60">{t('header.target')}</span>
          <span className="text-[#00f0ff]">{TARGET_APP}</span>
        </div>
        <span className="text-white/40">|</span>
        <div className="flex items-center gap-2">
          <span className="text-white/60">{t('header.elapsed')}</span>
          <span className="text-[#22c55e]">{formatTime(seconds)}</span>
        </div>
      </div>
    </header>
  );
}