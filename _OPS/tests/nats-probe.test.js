const varzUrl = process.env.NATS_VARZ_URL || 'http://nats:8222/varz';

async function main() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(varzUrl, { signal: controller.signal });
    if (!response.ok) {
      console.log(`skip: NATS varz not ok (${response.status})`);
      return;
    }
    console.log('ok');
  } catch (error) {
    console.log(`skip: NATS varz unreachable (${String(error)})`);
  } finally {
    clearTimeout(timeout);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
