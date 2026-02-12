import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { loadAdminCapabilities } from '../../backend/src/utils/adminOps.js';
import { listFiles, tailFile } from '../../backend/src/lib/fsSafe.js';

async function main() {
  const capabilities = await loadAdminCapabilities();
  if (!capabilities || !Array.isArray(capabilities.endpoints)) {
    throw new Error('Missing admin capabilities endpoints');
  }
  if (!capabilities.flags || typeof capabilities.flags.phase3_enabled !== 'boolean') {
    throw new Error('Missing admin capabilities flags');
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'qxb-logs-'));
  const logPath = path.join(tmpDir, 'ops.log');
  await fs.writeFile(logPath, ['one', 'two', 'three', 'four'].join('\n'));

  const files = await listFiles(tmpDir);
  if (!Array.isArray(files) || files.length !== 1) {
    throw new Error('Expected one log file in list');
  }

  const tail = await tailFile(tmpDir, 'ops.log', 2);
  if (!tail.lines || tail.lines.length !== 2 || tail.lines[1] !== 'four') {
    throw new Error('Tail should return last lines');
  }

  let threw = false;
  try {
    await tailFile(tmpDir, '../ops.log', 5);
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error('Traversal should be blocked');
  }

  console.log('ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
