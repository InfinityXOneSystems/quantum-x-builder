import { connect } from 'nats';
import { runIntegrityGateV3 } from '../../backend/src/utils/gates.js';
import { QXB_STREAMS } from '../../packages/qxb-protocol/src/index.js';

process.env.ENV_PROFILE = 'boxed';
process.env.STUB_MODE = 'true';
process.env.NATS_URL = process.env.NATS_URL || 'nats://nats:4222';
process.env.NATS_VARZ_URL = process.env.NATS_VARZ_URL || 'http://nats:8222/varz';

async function main() {
  await runIntegrityGateV3();
  const nc = await connect({ servers: process.env.NATS_URL, timeout: 2000 });
  const js = await nc.jetstreamManager();
  const required = [
    QXB_STREAMS.EVENTS,
    QXB_STREAMS.CHAT,
    QXB_STREAMS.RUNS,
    QXB_STREAMS.STATE,
    QXB_STREAMS.EVIDENCE,
    QXB_STREAMS.TASKS,
  ];
  for (const stream of required) {
    await js.streams.info(stream);
  }
  await nc.close();
  console.log('ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
