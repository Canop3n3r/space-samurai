const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const PORT = 5173;
const BASE = `http://127.0.0.1:${PORT}/space-samurai/`;

function stop(child) {
  try { child.kill('SIGTERM'); } catch {}
  try { process.kill(-child.pid, 'SIGKILL'); } catch {}
}

async function main() {
  const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: process.env, detached: true,
  });
  let ready = false;
  child.stdout.on('data', (d) => { if (String(d).includes('Local')) ready = true; });
  child.stderr.on('data', (d) => process.stderr.write(d));
  for (let i = 0; i < 60 && !ready; i++) await new Promise((r) => setTimeout(r, 250));
  if (!ready) { stop(child); throw new Error('vite not ready'); }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => window.__SS && window.__SS.backend, null, { timeout: 30000 });
    if (!(await page.$('#game'))) throw new Error('no canvas');
    await page.waitForTimeout(1500);
    if (pageErrors.length) throw new Error('pageerrors: ' + pageErrors.join(' | '));
    console.log('boot OK', await page.evaluate(() => window.__SS.backend));
  } finally {
    await browser.close();
    stop(child);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
