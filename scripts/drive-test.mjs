import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.mouse.click(480, 270);
await page.waitForTimeout(800);

const samples = await page.evaluate(async () => {
  const out = [];
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 200));
    const p = window.__game.player;
    out.push({
      t: i * 0.2,
      z: +p.position.z.toFixed(2),
      vz: +p.velocity.z.toFixed(2),
      locked: document.pointerLockElement !== null
    });
  }
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
  return out;
});
console.log(JSON.stringify(samples, null, 1));
await browser.close();
