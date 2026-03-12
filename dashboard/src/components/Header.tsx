import { TARGET_APP, ELAPSED } from "../data/demo";

export function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-[rgba(0,240,255,0.2)] bg-[rgba(10,14,26,0.9)]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#00f0ff] shadow-[0_0_12px_#00f0ff] pulse-glow" />
          <span className="font-semibold tracking-[0.3em] text-[#00f0ff] text-sm">AUTOAUDIT-X</span>
        </div>
        <span className="text-white/40 font-mono text-xs">CYBERNEXUS</span>
      </div>
      <div className="flex items-center gap-8 font-mono text-sm">
        <span className="text-white/60">TARGET</span>
        <span className="text-[#00f0ff]">{TARGET_APP}</span>
        <span className="text-white/40">|</span>
        <span className="text-white/60">ELAPSED</span>
        <span className="text-[#22c55e]">{ELAPSED}</span>
      </div>
    </header>
  );
}