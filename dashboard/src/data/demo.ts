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
  { id: "1",  from: "A", to: "D", text: "指令下发：定位外部唤起，追踪 Intent，识别 WebView 注入点", ts: Date.now() - 600000, originalIndex: 0 },
  { id: "2",  from: "D", to: "A", text: "检测到目标加固方案：梆梆企业版，正在激活 ART ClassLinker 观测链路", ts: Date.now() - 570000, originalIndex: 1 },
  { id: "3",  from: "D", to: "A", text: "LoadMethod 拦截启动，已捕获 3 个延迟还原 CodeItem，进入 DEX 修复流程", ts: Date.now() - 540000, originalIndex: 2 },
  { id: "4",  from: "D", to: "B", text: "脱壳完成：截获明文 DEX 12个，修复方法体 847 处，已输出可分析代码基线", ts: Date.now() - 500000, originalIndex: 3 },

  // Phase 2: 静态分析
  { id: "5",  from: "B", to: "A", text: "Manifest 扫描完成：发现 exported Activity 14个，含 intent-filter 的 7 个", ts: Date.now() - 450000, originalIndex: 4 },
  { id: "6",  from: "B", to: "A", text: "发现 1clink:// Deeplink scheme 解析逻辑，定位到 WebViewActivity 关键 sink", ts: Date.now() - 400000, originalIndex: 5 },
  { id: "7",  from: "B", to: "A", text: "危险告警：WebView 暴露 @JavascriptInterface，executeCommand() 直通 Runtime.exec()", ts: Date.now() - 350000, originalIndex: 6 },
  { id: "8",  from: "A", to: "B", text: "请深入分析 executeCommand 调用链，确认是否存在参数校验与权限拦截", ts: Date.now() - 330000, originalIndex: 7 },
  { id: "9",  from: "B", to: "A", text: "调用链追踪完成：cmd 参数未经任何过滤直达 exec()，无鉴权、无白名单、无沙箱隔离", ts: Date.now() - 300000, originalIndex: 8 },
  { id: "10", from: "B", to: "A", text: "同时发现 FileReaderBridge.readFile() 接口，直接暴露为 JS 可调用，可任意读取 /data 目录", ts: Date.now() - 270000, originalIndex: 9 },

  // Phase 3: 动态验证
  { id: "11", from: "A", to: "C", text: "生成验证策略：通过 am start 触发 1clink:// 注入 Payload，消费运行时日志", ts: Date.now() - 240000, originalIndex: 10 },
  { id: "12", from: "C", to: "A", text: "Deeplink 触发成功：WebViewActivity 已启动，URL 加载流被 HookLogic 捕获", ts: Date.now() - 210000, originalIndex: 11 },
  { id: "13", from: "C", to: "A", text: "JS 注入验证：executeCommand('system:id') 返回 uid=10086，确认命令执行成功", ts: Date.now() - 180000, originalIndex: 12 },
  { id: "14", from: "A", to: "C", text: "扩大验证面：测试 FileReaderBridge，尝试读取 /data/data/com.geely.vehicle.control/shared_prefs/", ts: Date.now() - 150000, originalIndex: 13 },
  { id: "15", from: "C", to: "A", text: "文件读取 PoC 成功：已获取 token.xml，含明文 access_token 与 vehicle_bindid", ts: Date.now() - 120000, originalIndex: 14 },

  // Phase 4: 证据收敛与报告
  { id: "16", from: "A", to: "B", text: "请评估攻击链完整性：Deeplink → WebView → JS Bridge → RCE / 文件读取", ts: Date.now() - 90000, originalIndex: 15 },
  { id: "17", from: "B", to: "A", text: "攻击链评估完成：两条独立链路均可从零交互实现远程利用，CVSS 评分建议 9.8 Critical", ts: Date.now() - 60000, originalIndex: 16 },
  { id: "18", from: "D", to: "A", text: "补充证据：已导出 3 份 DEX diff 与 hook trace 日志，可用于 PoC 回放与复现验证", ts: Date.now() - 40000, originalIndex: 17 },
  { id: "19", from: "A", to: "C", text: "请生成完整 PoC 脚本，包含 adb 触发命令与预期响应断言", ts: Date.now() - 20000, originalIndex: 18 },
  { id: "20", from: "C", to: "A", text: "PoC 脚本已生成：含 Deeplink 触发、JS 注入、响应校验三阶段，支持一键复现", ts: Date.now() - 5000, originalIndex: 19 },
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