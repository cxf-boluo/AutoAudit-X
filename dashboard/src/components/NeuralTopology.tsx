import { useMemo } from "react";
import { motion } from "framer-motion";
import type { FeedMessage } from "../data/demo";

const CX = 320;
const CY = 200;
const nodes = [
  { id: "A", label: "Orchestrator", x: CX, y: CY - 120, color: "#00f0ff" },
  { id: "B", label: "Static", x: CX + 160, y: CY + 20, color: "#a855f7" },
  { id: "C", label: "Runtime", x: CX - 160, y: CY + 20, color: "#ff6b35" },
  { id: "D", label: "Recovery", x: CX, y: CY + 140, color: "#22c55e" },
];

// 气泡尺寸: W=188(±94) H=50(±25) TAIL_H=10
// 尾巴尖端公式: left→(bx-104,by), down→(bx,by+35), up→(bx,by-35)
// 各节点位置: A(320,80) B(480,220) C(160,220) D(320,340) 半径=28
const BUBBLE_CONFIG: Record<string, {
  bx: number;
  by: number;
  tail: "up" | "down" | "left" | "right";
}> = {
  // A(320,80): 气泡在节点右侧, left尾巴尖端→(452-104=348=320+28, 80) ✓
  A: { bx: 452, by: 80, tail: "left" },
  // B(480,220): 气泡在节点右侧, left尾巴尖端→(612-104=508=480+28, 220) ✓ (需viewBox到720)
  B: { bx: 612, by: 220, tail: "left" },
  // C(160,220): 气泡在节点左侧, right尾巴尖端→(28+104=132=160-28, 220) ✓ (需viewBox从-80开始)
  C: { bx: 28, by: 220, tail: "right" },
  // D(320,340): 气泡在节点右侧, left尾巴尖端→(452-104=348=320+28, 340) ✓
  D: { bx: 452, by: 340, tail: "left" },
};

const BOX_W = 188;
const BOX_H = 50;
const BOX_R = 8;
const TAIL_W = 14;
const TAIL_H = 10;

// 根据文本长度估算合适的气泡高度
function estimateBubbleHeight(text: string): number {
  const contentW = BOX_W - 20; // 与 foreignObject width 一致
  // 10px/字符: CJK字符约12px，拉丁字符约8px，混合平均约10px
  const avgCharW = 10;
  const charsPerLine = Math.floor(contentW / avgCharW);
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  // lineHeight 1.55 * fontSize 11 ≈ 17px/行；加 16px 上下内边距
  return Math.max(36, lines * 18 + 14);
}

function buildBubblePath(tail: "up" | "down" | "left" | "right", boxH = BOX_H) {
  const hw = BOX_W / 2;
  const hh = boxH / 2;
  const r = BOX_R;
  const tw = TAIL_W / 2;
  const th = TAIL_H;
  if (tail === "down") return `
    M ${-hw+r} ${-hh} L ${hw-r} ${-hh} A ${r} ${r} 0 0 1 ${hw} ${-hh+r}
    L ${hw} ${hh-r} A ${r} ${r} 0 0 1 ${hw-r} ${hh}
    L ${tw} ${hh} L 0 ${hh+th} L ${-tw} ${hh}
    L ${-hw+r} ${hh} A ${r} ${r} 0 0 1 ${-hw} ${hh-r}
    L ${-hw} ${-hh+r} A ${r} ${r} 0 0 1 ${-hw+r} ${-hh} Z`;
  if (tail === "up") return `
    M ${-hw+r} ${-hh} L ${-tw} ${-hh} L 0 ${-hh-th} L ${tw} ${-hh} L ${hw-r} ${-hh}
    A ${r} ${r} 0 0 1 ${hw} ${-hh+r} L ${hw} ${hh-r} A ${r} ${r} 0 0 1 ${hw-r} ${hh}
    L ${-hw+r} ${hh} A ${r} ${r} 0 0 1 ${-hw} ${hh-r}
    L ${-hw} ${-hh+r} A ${r} ${r} 0 0 1 ${-hw+r} ${-hh} Z`;
  if (tail === "left") return `
    M ${-hw+r} ${-hh} L ${hw-r} ${-hh} A ${r} ${r} 0 0 1 ${hw} ${-hh+r}
    L ${hw} ${hh-r} A ${r} ${r} 0 0 1 ${hw-r} ${hh}
    L ${-hw+r} ${hh} A ${r} ${r} 0 0 1 ${-hw} ${hh-r}
    L ${-hw} ${tw} L ${-hw-th} 0 L ${-hw} ${-tw}
    L ${-hw} ${-hh+r} A ${r} ${r} 0 0 1 ${-hw+r} ${-hh} Z`;
  // right
  return `
    M ${-hw+r} ${-hh} L ${hw-r} ${-hh} A ${r} ${r} 0 0 1 ${hw} ${-hh+r}
    L ${hw} ${-tw} L ${hw+th} 0 L ${hw} ${tw}
    L ${hw} ${hh-r} A ${r} ${r} 0 0 1 ${hw-r} ${hh}
    L ${-hw+r} ${hh} A ${r} ${r} 0 0 1 ${-hw} ${hh-r}
    L ${-hw} ${-hh+r} A ${r} ${r} 0 0 1 ${-hw+r} ${-hh} Z`;
}

const edges = [
  { from: "A", to: "B" },
  { from: "A", to: "C" },
  { from: "A", to: "D" },
  { from: "D", to: "B" },
  { from: "D", to: "C" },
  { from: "B", to: "C" },
  { from: "D", to: "A" },
  { from: "B", to: "A" },
  { from: "C", to: "A" },
];

function getPos(id: string) {
  const n = nodes.find((x) => x.id === id);
  return n ? [n.x, n.y] as const : [0, 0] as const;
}

function edgeKey(from: string, to: string) {
  return `${from}-${to}`;
}

function useActiveEdges(messages: FeedMessage[]) {
  return useMemo(() => {
    const latestByEdge: Record<string, FeedMessage> = {};
    let latestMessage: FeedMessage | null = null;
    for (const m of messages) {
      const key = edgeKey(m.from, m.to);
      if (!latestByEdge[key] || m.ts > latestByEdge[key].ts) latestByEdge[key] = m;
      if (!latestMessage || m.ts > latestMessage.ts) latestMessage = m;
    }
    const activeEdgeKeys = new Set(Object.keys(latestByEdge));
    return { activeEdgeKeys, latestByEdge, latestMessage };
  }, [messages]);
}

function AgentAvatar({ type, color }: { type: string; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    orchestrator: (
      <path
        d="M0,-8 L2.4,-2.6 8,-2.6 L3.2,1.3 4.8,8 L0,4.6 -4.8,8 -3.2,1.3 -8,-2.6 -2.4,-2.6 Z"
        fill={color}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
      />
    ),
    static: (
      <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
        <path d="M-6,-5 L-1.5,0 L-6,5 M1.5,-5 L6,0 L1.5,5" />
        <path d="M-5,0 L5,0" />
      </g>
    ),
    runtime: (
      <path d="M-6,-6 L-6,6 L6,0 Z" fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
    ),
    recovery: (
      <g stroke={color} fill="none" strokeWidth="1.5">
        <rect x="-5" y="-5" width="10" height="7" rx="1.5" />
        <path d="M-3,-2 L0,1 L3,-2" />
      </g>
    ),
  };
  return (
    <g>
      <circle r={12} fill="rgba(10,14,26,0.95)" stroke={color} strokeWidth="2" />
      <g transform="scale(1.1)">{icons[type] ?? icons.orchestrator}</g>
    </g>
  );
}

const avatarType: Record<string, string> = {
  A: "orchestrator",
  B: "static",
  C: "runtime",
  D: "recovery",
};

export function NeuralTopology({ messages }: { messages: FeedMessage[] }) {
  const { activeEdgeKeys, latestByEdge, latestMessage } = useActiveEdges(messages);

  return (
    <div className="glass rounded-2xl p-6 h-full flex flex-col">
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#00f0ff]/90 mb-4 font-mono text-center">
        ◈ NEURAL LINK TOPOLOGY ◈
      </h3>
      <div className="flex-1 relative min-h-[400px]">
        <svg viewBox="-80 0 800 420" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* 边：只有有对话的边才显示流动动画 */}
          {edges.map((e, i) => {
            const [x1, y1] = getPos(e.from);
            const [x2, y2] = getPos(e.to);
            const key = edgeKey(e.from, e.to);
            const isActive = activeEdgeKeys.has(key);
            const latest = latestByEdge[key];
            const isLatestEdge = latestMessage && latestMessage.from === e.from && latestMessage.to === e.to;
            

            return (
              <g key={key}>
                {/* 底层静线 */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#lineGrad)"
                  strokeWidth="1"
                  strokeOpacity={isActive ? 0.5 : 0.2}
                />
                
                {/* 有对话时才有的流动虚线 (仅当前最新对话所在的边显示流动效果) */}
                {isActive && isLatestEdge && (
                  <motion.line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#00f0ff"
                    strokeWidth="2"
                    strokeDasharray="8 16"
                    strokeLinecap="round"
                    filter="url(#glow)"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: -24 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
                  />
                )}
                
                {/* 当前最新对话对应的边上：流动光点 */}
                {isActive && isLatestEdge && (
                  <motion.circle
                    r="5"
                    fill="#00f0ff"
                    filter="url(#strongGlow)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <animateMotion
                      dur="1.5s"
                      repeatCount="indefinite"
                      path={`M ${x1} ${y1} L ${x2} ${y2}`}
                    />
                  </motion.circle>
                )}
                
                 {/* 将对话气泡生成放在发送者小节点外侧固定区域 */}
                {isActive && isLatestEdge && latest && (() => {
                  const cfg = BUBBLE_CONFIG[e.from];
                  if (!cfg) return null;
                  const { bx, by, tail } = cfg;
                  const bubbleH = estimateBubbleHeight(latest.text);
                  const path = buildBubblePath(tail, bubbleH);
                  const hw = BOX_W / 2;
                  const hh = bubbleH / 2;
                  return (
                    <g transform={`translate(${bx},${by})`}>
                      <motion.path
                        d={path}
                        fill="rgba(10,14,26,0.97)"
                        stroke="rgba(0,240,255,0.85)"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, type: "spring", damping: 18 }}
                      />
                      {/* 使用 foreignObject 完整展示文字，自动换行不截断 */}
                      <foreignObject
                        x={-hw + 10}
                        y={-hh + 8}
                        width={BOX_W - 20}
                        height={bubbleH - 16}
                      >
                        <div
                          style={{
                            color: "rgba(255,255,255,0.95)",
                            fontSize: "11px",
                            fontFamily: "Inter, system-ui, sans-serif",
                            fontWeight: 500,
                            lineHeight: "1.55",
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {latest.text}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })()}
              </g>
            );
          })}
          
          {/* 节点：带头像角色 */}
          {nodes.map((n, i) => (
            <g key={n.id}>
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={28}
                fill="rgba(10,14,26,0.9)"
                stroke={n.color}
                strokeWidth="2.5"
                filter="url(#glow)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.1 }}
              />
              <g transform={`translate(${n.x},${n.y})`}>
                <AgentAvatar type={avatarType[n.id] ?? "orchestrator"} color={n.color} />
              </g>
              <text
                x={n.x}
                y={n.y + 48}
                textAnchor="middle"
                fill="rgba(255,255,255,0.8)"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}