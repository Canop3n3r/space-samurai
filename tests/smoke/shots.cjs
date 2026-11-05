const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const out = '/workspace/shots/space-samurai';
function stop(c){ try{c.kill('SIGTERM');}catch{} try{process.kill(-c.pid,'SIGKILL');}catch{} }
(async () => {
  const child = spawn('npx', ['vite','--host','127.0.0.1','--port','5190'], { cwd: root, stdio:['ignore','pipe','pipe'], detached:true });
  let ready=false; child.stdout.on('data', d=>{ if(String(d).includes('Local')) ready=true; });
  for (let i=0;i<80 && !ready;i++) await new Promise(r=>setTimeout(r,250));
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://127.0.0.1:5190/space-samurai/', { waitUntil:'networkidle', timeout:60000 });
  await page.waitForFunction(() => window.__SS?.phase === 'dojo');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/dojo.png` });
  await page.evaluate(async () => { await window.__SS.forceStreet(); });
  await page.waitForFunction(() => window.__SS.phase === 'street');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/street.png` });
  await page.evaluate(async () => {
    window.__SS.forceKillCaptain();
    await window.__SS.forceBoard();
  });
  await page.waitForFunction(() => window.__SS.phase === 'flight');
  await page.evaluate(() => { window.__SS.input._injectKey('KeyW', true); window.__SS.input.move.y = 1; });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/flight.png` });
  console.log('shots written', out);
  await browser.close(); stop(child);
})().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1);});
