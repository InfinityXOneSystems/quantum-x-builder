import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import express from 'express';

const opsPath = new URL('../../backend/src/routes/ops.js', import.meta.url).href;

async function writeFlags(rootDir, phase3Enabled) {
  const stateDir = path.join(rootDir, '_state');
  await fs.mkdir(stateDir, { recursive: true });
  const flags = {
    version: 'v1',
    admin: { enabled: true, expansion: { phase3: { enabled: phase3Enabled } } },
    autonomy: { enabled: false },
  };
  await fs.writeFile(path.join(stateDir, 'feature_flags.v1.json'), JSON.stringify(flags, null, 2));
}

async function startServer(workspaceRoot) {
  process.env.WORKSPACE_ROOT = workspaceRoot;
  const { registerOpsRoutes } = await import(`${opsPath}?t=${Date.now()}`);
  const app = express();
  registerOpsRoutes(app);
  const server = await new Promise(resolve => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const port = server.address().port;
  return { server, port };
}

function patRecord() {
  return JSON.stringify({
    policy: { allowed: ['ops:admin:capabilities'], denied: [] },
    authority: {
      actor: 'ops',
      scope: ['admin'],
      permissions: ['ops:admin:capabilities'],
      approvals_required: false,
    },
    truth: { verdict: 'PASS', evidence: ['EVIDENCE_MANIFEST.json'], hashes: ['HASHES.sha256'] },
    evidence_paths: ['EVIDENCE_MANIFEST.json'],
    hashes: ['HASHES.sha256'],
    response_state: 'ALLOW: proceed',
  });
}

async function main() {
  const rootDisabled = await fs.mkdtemp(path.join(os.tmpdir(), 'qxb-flags-disabled-'));
  await writeFlags(rootDisabled, false);
  const disabled = await startServer(rootDisabled);
  const disabledUrl = `http://127.0.0.1:${disabled.port}/__ops/admin/capabilities`;

  const respDisabled = await fetch(disabledUrl);
  if (respDisabled.status !== 404) {
    throw new Error(`Expected 404 when phase3 disabled, got ${respDisabled.status}`);
  }
  disabled.server.close();

  const rootEnabled = await fs.mkdtemp(path.join(os.tmpdir(), 'qxb-flags-enabled-'));
  await writeFlags(rootEnabled, true);
  const enabled = await startServer(rootEnabled);
  const enabledUrl = `http://127.0.0.1:${enabled.port}/__ops/admin/capabilities`;

  const respMissingPat = await fetch(enabledUrl);
  if (respMissingPat.status !== 428) {
    throw new Error(`Expected 428 when PAT missing, got ${respMissingPat.status}`);
  }

  const respOk = await fetch(enabledUrl, { headers: { 'X-PAT-RECORD': patRecord() } });
  const jsonOk = await respOk.json();
  if (!respOk.ok || !jsonOk.ok) {
    throw new Error('Expected ok response with PAT');
  }

  enabled.server.close();
  console.log('ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
