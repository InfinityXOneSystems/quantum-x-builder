import express from 'express';
import { connect, StringCodec } from 'nats';
import { createCloudEvent } from '../../packages/qxb-events/src/index.js';
import { QXB_CHAT_CHANNELS } from '../../packages/qxb-protocol/src/index.js';

const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
const sc = StringCodec();

// Health endpoint
const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'qxb-narrator', timestamp: new Date().toISOString() });
});
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`QXB narrator health endpoint on ${port}`));

function logWithTrace(event, msg, extra = {}) {
  console.log(
    JSON.stringify({
      level: 'info',
      msg,
      trace_id: event.qxb_trace_id || null,
      span_id: event.qxb_span_id || null,
      event_id: event.id,
      ...extra
    })
  );
}

async function main() {
  const nc = await connect({ servers: natsUrl });
  const sub = nc.subscribe('qxb.evt.>');
  for await (const msg of sub) {
    const raw = sc.decode(msg.data);
    const event = JSON.parse(raw);
    logWithTrace(event, 'narrator.received');
    const narration = createCloudEvent({
      type: 'qxb.narration.v1',
      source: 'qxb://narrator',
      subject: QXB_CHAT_CHANNELS.NARRATION,
      data: {
        severity: 'info',
        headline: 'Event observed',
        summary: event.type,
        details: `Event ${event.id} observed`,
        links: [
          { rel: 'event', href: `qxb://event/${event.id}` }
        ],
        attribution: {
          agent_id: event.qxb_agent_id || 'unknown',
          role: event.qxb_role || 'unknown'
        }
      }
    });
    nc.publish(narration.subject, sc.encode(JSON.stringify(narration)));
    logWithTrace(event, 'narrator.published', { narration_id: narration.id });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
