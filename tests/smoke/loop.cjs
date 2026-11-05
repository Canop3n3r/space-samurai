const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const PORT = 5174;

function stop(child) {
  try { child.kill('SIGTERM'); } catch {}
  try { process.kill(-child.pid, 'SIGKILL'); } catch {}
}

async function runAt(size) {
  const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: process.env, detached: true,
  });
  let ready = false;
  child.stdout.on('data', (d) => { if (String(d).includes('Local')) ready = true; });
  for (let i = 0; i < 80 && !ready; i++) await new Promise((r) => setTimeout(r, 250));
  if (!ready) { stop(child); throw new Error('vite not ready'); }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: size });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`http://127.0.0.1:${PORT}/space-samurai/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => window.__SS, null, { timeout: 45000 });

    await page.evaluate(() => {
      const ss = window.__SS;
      const d = ss.dojo.dummies[0];
      ss.player.position.set(d.mesh.position.x, 0, d.mesh.position.z + 1.2);
      const to = d.mesh.position.clone().sub(ss.player.position).setY(0).normalize();
      ss.player.facing.copy(to);
    });
    const hpBefore = await page.evaluate(() => window.__SS.dojo.dummies[0].hp);
    await page.evaluate(() => {
      const ss = window.__SS;
      ss.combat.update(0.016, { light: true, heavy: false, dodge: false, lock: false }, ss.dojo.dummies, ss.dojo.scene, ss.player.yaw());
    });
    const hpAfter = await page.evaluate(() => window.__SS.dojo.dummies[0].hp);
    if (!(hpAfter < hpBefore)) throw new Error(`dummy hp did not drop ${hpBefore} -> ${hpAfter}`);

    await page.evaluate(async () => { await window.__SS.forceStreet(); });
    await page.waitForFunction(() => window.__SS.phase === 'street', null, { timeout: 20000 });
    const readyPad = await page.evaluate(() => window.__SS.forceKillCaptain());
    if (!readyPad) throw new Error('pad not ready after captain kill');

    await page.evaluate(async () => { await window.__SS.forceBoard(); });
    await page.waitForFunction(() => window.__SS.phase === 'flight' && window.__SS.ship, null, { timeout: 30000 });
    const d0 = await page.evaluate(() => {
      const p = window.__SS.ship.position;
      return { x:p.x, y:p.y, z:p.z };
    });
    await page.evaluate(() => {
      const ss = window.__SS;
      ss.input._injectKey('KeyW', true);
      ss.input.move.y = 1;
    });
    await page.waitForTimeout(2000);
    const d1 = await page.evaluate(() => {
      const p = window.__SS.ship.position;
      return { x:p.x, y:p.y, z:p.z };
    });
    const moved = Math.hypot(d1.x - d0.x, d1.y - d0.y, d1.z - d0.z);
    if (!(moved > 2)) throw new Error(`ship did not move enough ${JSON.stringify(d0)} -> ${JSON.stringify(d1)} moved=${moved}`);

    const fatal = errors.filter((e) => !/WebGPU unavailable/i.test(e));
    if (fatal.length) throw new Error(fatal.join(' | '));
    console.log(`loop OK @ ${size.width}x${size.height}`, { hpBefore, hpAfter, d0, d1 });
  } finally {
    await browser.close();
    stop(child);
    await new Promise((r) => setTimeout(r, 400));
  }
}

(async () => {
  await runAt({ width: 1280, height: 800 });
  await runAt({ width: 390, height: 844 });
})().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
