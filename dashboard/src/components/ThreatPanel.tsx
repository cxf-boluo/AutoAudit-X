import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Vulnerability } from "../data/demo";
import { VULNS, SAMPLE_CODE } from "../data/demo";

function VulnCard({ v, i }: { v: Vulnerability; i: number }) {
  const { t } = useTranslation();
  const statusColor =
    v.status === "confirmed" ? "#22c55e" : v.status === "confirming" ? "#a855f7" : "rgba(255,255,255,0.5)";
  
  const getStatusText = (status: string) => {
    const key = status === "confirmed" ? "confirmed" : status === "confirming" ? "verifying" : "candidate";
    return t(`threatPanel.status.${key}`);
  };

  const getTitleTranslation = (index: number) => {
    return t(`demoData.vulns.${index}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      className="rounded-lg border border-white/10 p-3 mb-3 last:mb-0 hover:border-[rgba(0,240,255,0.3)] transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs font-bold text-[#00f0ff]">{v.id}</span>
        <span className="text-[11px] font-mono" style={{ color: statusColor }}>
          {getStatusText(v.status)}
        </span>
      </div>
      <p className="text-xs text-white/90 mb-2">{getTitleTranslation(i)}</p>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] to-[#a855f7]"
          initial={{ width: 0 }}
          animate={{ width: `${v.confidence}%` }}
          transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
        />
      </div>
      <span className="text-[11px] text-white/50 font-mono">{v.confidence}%</span>
    </motion.div>
  );
}

export function ThreatPanel() {
  const { t } = useTranslation();
  return (
    <div className="glass rounded-xl p-5 h-full flex flex-col overflow-hidden">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-4 font-mono">{t('threatPanel.title')}</h3>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <p className="text-[11px] text-white/50 mb-3 font-mono">{t('threatPanel.vulnerabilities')}</p>
        {VULNS.map((v, i) => (
          <VulnCard key={v.id} v={v} i={i} />
        ))}
      </div>
      <div className="rounded-lg border border-white/10 p-3 bg-black/30 mt-3">
        <p className="text-[11px] text-white/50 mb-2 font-mono">{t('threatPanel.codeView')}</p>
        <pre className="font-mono text-[11px] text-white/80 whitespace-pre-wrap break-all leading-relaxed">
          {SAMPLE_CODE.replace('// SECURITY_COMMENT_Placeholder', `// ${t('threatPanel.codeComment')}`)}
        </pre>
      </div>
    </div>
  );
}