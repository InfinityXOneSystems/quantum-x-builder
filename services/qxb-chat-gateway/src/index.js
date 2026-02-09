import crypto from 'crypto';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connect, StringCodec } from 'nats';
import { createCloudEvent, ensureQxbExtensions } from '../../packages/qxb-events/src/index.js';
import { QXB_CHAT_CHANNELS } from '../../packages/qxb-protocol/src/index.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
const sc = StringCodec();
let nc;

function resolveTrace(req) {
  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  const spanId = req.headers['x-span-id'] || crypto.randomUUID();
  return { traceId, spanId };
}

function logWithTrace(trace, msg, extra = {}) {
  console.log(
    JSON.stringify({
      level: 'info',
      msg,
      trace_id: trace.traceId,
      span_id: trace.spanId,
      ...extra
    })
  );
}

async function ensureConnection() {
  if (!nc) nc = await connect({ servers: natsUrl });
  return nc;
}

app.post('/chat/send', async (req, res) => {
  try {
    const { target, message, metadata } = req.body || {};
    if (!target || !message) return res.status(400).json({ error: 'Missing target or message' });
    const trace = resolveTrace(req);
    const event = createCloudEvent({
      type: 'qxb.chat.user.message',
      source: 'qxb://chat-gateway',
      subject: `${QXB_CHAT_CHANNELS.USER_TO}.${target}`,
      data: { message, metadata: metadata || {} }
    });
    const withExt = ensureQxbExtensions(event, {
      ...(metadata || {}),
      qxb_trace_id: trace.traceId,
      qxb_span_id: trace.spanId
    });
    const conn = await ensureConnection();
    conn.publish(withExt.subject, sc.encode(JSON.stringify(withExt)));
    logWithTrace(trace, 'chat.send', { event_id: withExt.id, target });
    res.json({ status: 'queued', event_id: withExt.id });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/chat/select', async (req, res) => {
  try {
    const { selection } = req.body || {};
    const trace = resolveTrace(req);
    const event = createCloudEvent({
      type: 'qxb.chat.control.selection',
      source: 'qxb://chat-gateway',
      subject: QXB_CHAT_CHANNELS.CONTROL,
      data: { selection: selection || [] }
    });
    const withExt = ensureQxbExtensions(event, {
      qxb_trace_id: trace.traceId,
      qxb_span_id: trace.spanId
    });
    const conn = await ensureConnection();
    conn.publish(withExt.subject, sc.encode(JSON.stringify(withExt)));
    logWithTrace(trace, 'chat.select', { event_id: withExt.id });
    res.json({ status: 'queued', event_id: withExt.id });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'qxb-chat-gateway', timestamp: new Date().toISOString() });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ status: 'connected' }));
});

const port = process.env.PORT || 8090;
server.listen(port, () => {
  console.log(`QXB chat gateway listening on ${port}`);
});
