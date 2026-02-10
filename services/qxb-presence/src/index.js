import crypto from 'crypto';
import express from 'express';

const app = express();
const agents = new Map();

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

app.use((req, res, next) => {
  const trace = resolveTrace(req);
  req.trace = trace;
  res.setHeader('x-trace-id', trace.traceId);
  res.setHeader('x-span-id', trace.spanId);
  const start = Date.now();
  res.on('finish', () => {
    logWithTrace(trace, 'request.completed', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start
    });
  });
  next();
});

app.get('/agents', (_req, res) => {
  res.json({ agents: Array.from(agents.values()) });
});

app.get('/agents/:id', (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Not found' });
  res.json({ agent });
});

app.post('/agents', (req, res) => {
  const agent = req.body || {};
  if (!agent.id) return res.status(400).json({ error: 'Missing id' });
  agents.set(agent.id, agent);
  logWithTrace(req.trace, 'presence.agent.upsert', { agent_id: agent.id });
  res.json({ status: 'ok' });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'qxb-presence', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`QXB presence listening on ${port}`);
});
