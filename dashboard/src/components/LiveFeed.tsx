import { motion } from "framer-motion";
import type { FeedMessage } from "../data/demo";

function formatTs(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export function LiveFeed({ messages }: { messages: FeedMessage[] }) {
  return (
    <div className="glass rounded-xl p-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/60 font-mono">LIVE COMM FEED</h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded border-l-2 border-[#00f0ff]/70 pl-3 py-2 bg-white/5"
          >
            <span className="font-mono text-[11px] text-[#00f0ff] font-bold">{m.from}→{m.to}</span>
            <span className="text-[11px] text-white/50 ml-2">{formatTs(m.ts)}</span>
            <p className="text-xs text-white/90 mt-1">{m.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}