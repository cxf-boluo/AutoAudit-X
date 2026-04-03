import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Header } from "./components/Header";
import { AgentMatrix } from "./components/AgentMatrix";
import { NeuralTopology } from "./components/NeuralTopology";
import { ThreatPanel } from "./components/ThreatPanel";
import { LiveFeed } from "./components/LiveFeed";
import { Timeline } from "./components/Timeline";
import { AGENTS, DEMO_FEED } from "./data/demo";
import type { FeedMessage } from "./data/demo";

const SOCKET_SERVER_URL = "http://localhost:3001";

function App() {
  const [messages, setMessages] = useState<FeedMessage[]>([DEMO_FEED[0]]);

  useEffect(() => {
    // 建立 WebSocket 连接
    const socket = io(SOCKET_SERVER_URL);

    // 监听初始或追加的消息
    socket.on("new_log", (newMsg: FeedMessage) => {
      setMessages((prev) => {
        const newMessages = [...prev, newMsg];
        if (newMessages.length > 50) newMessages.shift();
        return newMessages;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen min-w-[1280px] bg-[#0a0e1a] text-white overflow-hidden">
      {/* 背景特效 */}
      <div className="hex-bg absolute inset-0 pointer-events-none" />
      <div className="hex-grid absolute inset-0 pointer-events-none" />
      <div className="particle-dots absolute inset-0 pointer-events-none opacity-60" />
      <div className="scan-line" />

      {/* 顶部 Header */}
      <Header />

      {/* 主体布局：三列两行 */}
      <main className="grid grid-cols-[260px_1fr_320px] grid-rows-[1fr_180px] gap-4 p-4 h-[calc(100vh-64px)]">
        {/* 左侧：Agent 矩阵 */}
        <section className="row-span-1">
          <AgentMatrix agents={AGENTS} />
        </section>

        {/* 中央：神经链路拓扑 */}
        <section className="row-span-1 min-h-0">
          <NeuralTopology messages={messages} />
        </section>

        {/* 右侧：威胁分析 */}
        <section className="row-span-2 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <ThreatPanel />
          </div>
        </section>

        {/* 左下：Live 通信 Feed */}
        <section className="col-span-1 min-h-0 overflow-hidden">
          <LiveFeed messages={messages} />
        </section>

        {/* 中下：任务时间线 */}
        <section className="col-span-1 min-h-0">
          <Timeline />
        </section>
      </main>
    </div>
  );
}

export default App;