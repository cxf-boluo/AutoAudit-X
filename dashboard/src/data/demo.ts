export type AgentId = "A" | "B" | "C" | "D";

export interface AgentState {
  id: AgentId;
  name: string;
  role: string;
  status: "active" | "busy" | "idle";
  load: number;
  color: string;
}

export interface FeedMessage {
  id: string;
  from: AgentId;
  to: AgentId;
  text: string;
  ts: number;
  originalIndex?: number;
}

export interface Vulnerability {
  id: string;
  title: string;
  confidence: number;
  status: "candidate" | "confirming" | "confirmed";
}

export interface TimelinePhase {
  id: string;
  label: string;
  status: "done" | "current" | "pending";
  time?: string;
}

export const AGENTS: AgentState[] = [
  { id: "A", name: "Orchestrator", role: "策略编排与证据收敛", status: "active", load: 85, color: "#00f0ff" },
  { id: "B", name: "Static Reasoner", role: "代码语义理解", status: "busy", load: 72, color: "#a855f7" },
  { id: "C", name: "Runtime Executor", role: "动态触发与证据采集", status: "idle", load: 30, color: "#ff6b35" },
  { id: "D", name: "Recovery Engine", role: "脱壳与运行时恢复", status: "busy", load: 90, color: "#22c55e" },
];

export const DEMO_FEED: FeedMessage[] = [
  // Phase 1: 任务启动与脱壳
  { id: "1",  from: "A", to: "D", text: "指令下发：对零跑APP (com.dahua.leapmotor) 执行脱壳与重建任务", ts: Date.now() - 300000, originalIndex: 0 },
  { id: "2",  from: "D", to: "A", text: "环境探测完成：检测到 27 个已 DUMP 的内存 DEX 文件", ts: Date.now() - 250000, originalIndex: 1 },
  { id: "3",  from: "D", to: "A", text: "文件提取：已成功拉取 DEX 文件与 base.apk (271MB) 至本地工作区", ts: Date.now() - 200000, originalIndex: 2 },
  { id: "4",  from: "D", to: "A", text: "自动化重建：正在通过 rebuild_apk.py 将解密 DEX 重新注入 APK", ts: Date.now() - 100000, originalIndex: 3 },
  { id: "5",  from: "D", to: "A", text: "脱壳与重建完成：成功生成 fixed.apk (397MB)，已关闭设备脱壳属性，等待静态分析介入", ts: Date.now() - 20000, originalIndex: 4 },
];

export const VULNS: Vulnerability[] = [
  // 等待静态分析产生漏洞状态
];

export const PHASES: TimelinePhase[] = [
  { id: "unpack", label: "UNPACK", status: "done", time: "5:12" },
  { id: "analyze", label: "ANALYZE", status: "pending" },
  { id: "verify", label: "VERIFY", status: "pending" },
  { id: "report", label: "REPORT", status: "pending" },
];

export const SAMPLE_CODE = `[INFO] Scanning and validating DEX files...
[INFO] Found 27 valid DEX files. Sorting by size...
  9720620_Fkpt_dex.dex -> classes.dex (9720620 bytes)
  9507356_Fkpt_dex.dex -> classes2.dex (9507356 bytes)
[INFO] Creating clean rebuilt APK: .../fixed.apk
[SUCCESS] Fixed APK generated`;

export const TARGET_APP = "com.dahua.leapmotor";
export const ELAPSED = "05:12";
export const OVERALL_PROGRESS = 25;