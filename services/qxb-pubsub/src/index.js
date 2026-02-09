import express from 'express';
import { connect, StringCodec } from 'nats';
import { QXB_STREAMS } from '../../packages/qxb-protocol/src/index.js';

const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
const sc = StringCodec();

// Health endpoint
const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'qxb-pubsub', timestamp: new Date().toISOString() });
});
const port = process.env.PORT || 3004;
app.listen(port, () => console.log(`QXB pubsub health endpoint on ${port}`));

function logEvent(msg, extra = {}) {
  console.log(
    JSON.stringify({
      level: 'info',
      msg,
      ...extra
    })
  );
}

async function ensureStreams(js) {
  const streams = [
    { name: QXB_STREAMS.EVENTS, subjects: ['qxb.evt.>'], retention: 'limits' },
    { name: QXB_STREAMS.CHAT, subjects: ['qxb.chat.>'], retention: 'limits' },
    { name: QXB_STREAMS.RUNS, subjects: ['qxb.run.>'], retention: 'limits' },
    { name: QXB_STREAMS.STATE, subjects: ['qxb.state.>'], retention: 'limits' },
    { name: QXB_STREAMS.EVIDENCE, subjects: ['qxb.evidence.>'], retention: 'limits' },
    { name: QXB_STREAMS.TASKS, subjects: ['qxb.task.>'], retention: 'limits' }
  ];

  for (const stream of streams) {
    try {
      await js.streams.info(stream.name);
    } catch {
      await js.streams.add({
        name: stream.name,
        subjects: stream.subjects,
        retention: stream.retention,
        storage: 'file'
      });
    }
  }
}

async function main() {
  const nc = await connect({ servers: natsUrl });
  const js = nc.jetstreamManager();
  await ensureStreams(js);

  const sub = nc.subscribe('qxb.pubsub.health');
  (async () => {
    for await (const msg of sub) {
      msg.respond(sc.encode(JSON.stringify({ status: 'ok' })));
      logEvent('pubsub.health.responded');
    }
  })();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
