import { runIntegrityGateV3 } from '../../backend/src/utils/gates.js';

const originalVarz = process.env.NATS_VARZ_URL;
const originalNats = process.env.NATS_URL;

process.env.NATS_VARZ_URL = 'http://127.0.0.1:9/varz';
process.env.NATS_URL = 'nats://127.0.0.1:9';

runIntegrityGateV3()
  .then(report => {
    if (!report || report.gate !== 'INTEGRITY_V3') {
      throw new Error('Missing integrity report');
    }
    console.log('ok');
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    if (originalVarz === undefined) delete process.env.NATS_VARZ_URL;
    else process.env.NATS_VARZ_URL = originalVarz;
    if (originalNats === undefined) delete process.env.NATS_URL;
    else process.env.NATS_URL = originalNats;
  });
