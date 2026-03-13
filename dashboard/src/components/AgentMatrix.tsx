import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { AgentState } from "../data/demo";

const statusDot: Record<AgentState["status"], string> = {
  active: "bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]",
  busy: "bg-[#a855f7] shadow-[0_0_10px_#a855f7]",
  idle: "bg-white/30",
};

export function AgentMatrix({ agents }: { agents: AgentState[] }) {
  const { t } = useTranslation();
  
  const getRoleTranslation = (id: string) => {
    const roleKey = {
      'A': 'orchestrator',
      'B': 'static',
      'C': 'runtime',
      'D': 'recovery'
    }[id] || 'orchestrator';
    return t(`agentMatrix.roles.${roleKey}`);
  };

  return (
    <div className="glass rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-4 font-mono">{t('agentMatrix.title')}</h3>
      <div className="flex flex-col gap-3 flex-1">
        {agents.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg p-3 border border-white/10 hover:border-[rgba(0,240,255,0.3)] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${statusDot[a.status]} ${a.status !== "idle" ? "pulse-glow" : ""}`} />
              <span className="font-mono text-xs font-bold" style={{ color: a.color }}>{a.id}</span>
              <span className="text-white/90 text-xs truncate">{a.name}</span>
            </div>
            <p className="text-[11px] text-white/50 mb-2">{getRoleTranslation(a.id)}</p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: a.color }}
                initial={{ width: 0 }}
                animate={{ width: `${a.load}%` }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}