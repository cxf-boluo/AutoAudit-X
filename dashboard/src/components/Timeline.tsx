import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { TimelinePhase } from "../data/demo";
import { PHASES, OVERALL_PROGRESS } from "../data/demo";

export function Timeline({ phases = PHASES, progress = OVERALL_PROGRESS }: { phases?: TimelinePhase[]; progress?: number }) {
  const { t } = useTranslation();
  return (
    <div className="glass rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-4 font-mono">{t('timeline.title')}</h3>
      <div className="flex items-center gap-3 mb-4">
        {phases.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                p.status === "done"
                  ? "bg-[#22c55e]"
                  : p.status === "current"
                    ? "bg-[#00f0ff] animate-pulse"
                    : "bg-white/20"
              }`}
            />
            <span
              className={`font-mono text-[11px] ${
                p.status === "done" ? "text-white/70" : p.status === "current" ? "text-[#00f0ff]" : "text-white/40"
              }`}
            >
              {t(`timeline.phases.${p.id}`)}
            </span>
            {p.time && <span className="text-[11px] text-white/50">({p.time})</span>}
            {i < phases.length - 1 && <span className="text-white/30 mx-1">━</span>}
          </div>
        ))}
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] to-[#a855f7]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
      <p className="text-[11px] text-white/50 mt-2 font-mono">{progress}% {t('timeline.complete')}</p>
    </div>
  );
}