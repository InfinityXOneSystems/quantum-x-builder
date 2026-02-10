import express from 'express';
import { connect, StringCodec } from 'nats';

const app = express();
app.use(express.json());

const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
const sc = StringCodec();
let nc;

async function ensureConnection() {
  if (!nc) nc = await connect({ servers: natsUrl });
  return nc;
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'proposal-engine', timestamp: new Date().toISOString() });
});

// Proposal endpoints (stub)
app.post('/proposals', async (req, res) => {
  const proposal = req.body || {};
  console.log('Proposal created:', proposal);
  res.json({ status: 'created', proposal: { id: Date.now(), ...proposal } });
});

app.get('/proposals', (req, res) => {
  res.json({ proposals: [] });
});

const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`Proposal engine listening on ${port}`);
  ensureConnection().catch(console.error);
});
