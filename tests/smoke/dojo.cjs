const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const PORT = 5175;

function stop(child) {
  try { child.kill('SIGTERM'); } catch {}
  try { process.kill(-child.pid, 'SIGKILL'); } catch {}
}

(async () => {
  const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
  });
  let ready = false;
  child.stdout.on('data', (d) => { if (String(d).includes('Local')) ready = true; });
  for (let i = 0; i < 60 && !ready; i++) await new Promise((r) => setTimeout(r, 250));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/space-samurai/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => window.__SS?.dojo, null, { timeout: 30000 });
    await page.evaluate(() => {
      const ss = window.__SS;
      const d = ss.dojo.dummies[0];
      ss.player.position.set(d.mesh.position.x, 0, d.mesh.position.z + 1.2);
      ss.player.facing.set(0, 0, -1);
      ss.combat.update(0.016, { light: true }, ss.dojo.dummies, ss.dojo.scene, 0);
    });
    const hp = await page.evaluate(() => window.__SS.dojo.dummies[0].hp);
    if (hp >= 100) throw new Error('expected damage, hp=' + hp);
    console.log('dojo OK hp', hp);
  } finally {
    await browser.close();
    stop(child);
  }
})().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
