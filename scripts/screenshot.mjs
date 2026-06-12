// Dev helper: captures in-game screenshots headlessly for visual review.
// Usage: node scripts/screenshot.mjs (vite preview must be running on :4173)

import { chromium } from 'playwright';

const VIEWS = [
  { name: 'house-front', pos: [-1, 1.8, 11.5], yaw: 0.05, pitch: 0.02 },
  { name: 'house-back-pool', pos: [-9, 3.4, -21], yaw: -2.6, pitch: -0.18 },
  { name: 'rv-site', pos: [92, 2.2, -145], yaw: 1.05, pitch: -0.06 },
  { name: 'rv-front', pos: [82, 2.0, -141], yaw: -2.6, pitch: -0.05 },
  { name: 'desert-vista', pos: [40, 12, 60], yaw: 0.6, pitch: -0.04 },
  { name: 'roof-pizza', pos: [-6.5, 4.6, 5.5], yaw: 0.0, pitch: -0.35 }
];

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.evaluate(() => {
  document.getElementById('overlay').style.display = 'none';
});

for (const v of VIEWS) {
  await page.evaluate(({ pos, yaw, pitch }) => {
    const { camera } = window.__game;
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }, v);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `shots/${v.name}.png` });
  console.log('captured', v.name);
}

const fps = await page.evaluate(() => document.getElementById('fps').textContent);
console.log('reported fps (software renderer):', fps);
await browser.close();
