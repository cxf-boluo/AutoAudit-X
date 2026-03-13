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
  { id: "1", from: "A", to: "D", text: "指令下发：定位外部唤起，追踪 Intent，识别 WebView 注入点", ts: Date.now() - 180000, originalIndex: 0 },
  { id: "2", from: "D", to: "B", text: "脱壳完成：截获明文 DEX，修复方法体缺失，已输出可分析代码基线", ts: Date.now() - 150000, originalIndex: 1 },
  { id: "3", from: "B", to: "A", text: "发现 1clink:// Deeplink 解析，定位到 WebViewActivity 关键 sink", ts: Date.now() - 90000, originalIndex: 2 },
  { id: "4", from: "B", to: "A", text: "危险告警：WebView 暴露 @JavascriptInterface，存在高危 Hook 点", ts: Date.now() - 45000, originalIndex: 3 },
  { id: "5", from: "A", to: "C", text: "生成验证策略：通过 am start 触发 1clink:// 注入 Payload，消费运行时日志", ts: Date.now() - 20000, originalIndex: 4 },
  { id: "6", from: "C", to: "A", text: "验证成功：特制 Payload URL 已执行，调用参数与返回值已捕获，漏洞确认高危", ts: Date.now() - 5000, originalIndex: 5 },
];

export const VULNS: Vulnerability[] = [
  { id: "V-001", title: "WebView 暴露危险接口", confidence: 98, status: "confirmed" },
  { id: "V-002", title: "Deeplink (1clink://) 劫持", confidence: 85, status: "confirming" },
  { id: "V-003", title: "任意文件读取/高维提权", confidence: 76, status: "candidate" },
];

export const PHASES: TimelinePhase[] = [
  { id: "unpack", label: "UNPACK", status: "done", time: "2:10" },
  { id: "analyze", label: "ANALYZE", status: "done", time: "5:30" },
  { id: "verify", label: "VERIFY", status: "current" },
  { id: "report", label: "REPORT", status: "pending" },
];

export const SAMPLE_CODE = `@JavascriptInterface
public void executeCommand(String cmd) {
  if (cmd != null && cmd.startsWith("system:")) {
    // SECURITY_COMMENT_Placeholder
    Runtime.getRuntime().exec(cmd.substring(7));
  }
}`;

export const TARGET_APP = "com.geely.vehicle.control";
export const ELAPSED = "03:42";
export const OVERALL_PROGRESS = 65;