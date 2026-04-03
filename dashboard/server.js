import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let _msgCounter = 100;

app.post('/api/log', (req, res) => {
  const data = req.body;
  
  if (!data || !data.text || !data.from || !data.to) {
    return res.status(400).json({ error: "Missing required fields: text, from, to" });
  }

  const newMsg = {
    id: `live-${_msgCounter++}-${Date.now()}`,
    from: data.from,
    to: data.to,
    text: data.text,
    ts: Date.now()
  };

  io.emit('new_log', newMsg);
  
  console.log(`[Log Received] ${data.from} -> ${data.to}: ${data.text}`);
  res.json({ success: true, message: newMsg });
});

io.on('connection', (socket) => {
  console.log(`[Client Connected] ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Client Disconnected] ${socket.id}`);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket Log Server running on http://localhost:${PORT}`);
});
