// Dev helper: captures in-game screenshots headlessly for visual review.
// Usage: node scripts/screenshot.mjs (vite preview must be running on :4173)

import { chromium } from 'playwright';

const VIEWS = [
  { name: 'house-front', pos: [1, 2.0, -56], yaw: 3.14, pitch: 0.02 },
  { name: 'house-drive', pos: [-10, 2.2, -54], yaw: 3.14 - 0.53, pitch: -0.02 },
  { name: 'house-back-pool', pos: [12, 3.4, -14], yaw: 0.96, pitch: -0.2 },
  { name: 'street', pos: [-30, 2.2, -60], yaw: -1.57, pitch: 0.0 },
  { name: 'jesse', pos: [-185, 2.0, -66], yaw: 0, pitch: 0.03 },
  { name: 'los-pollos', pos: [207, 2.0, 40], yaw: 3.1, pitch: 0.04 },
  { name: 'saul', pos: [70, 2.0, 46], yaw: 3.14, pitch: 0.06 },
  { name: 'carwash', pos: [353, 2.0, 44], yaw: 3.1, pitch: 0.04 },
  { name: 'laundry', pos: [478, 2.5, 52], yaw: 3.14, pitch: 0.05 },
  { name: 'rv-site', pos: [-493, 2.2, -448], yaw: 0.55, pitch: -0.04 },
  { name: 'overview', pos: [120, 100, -190], yaw: 3.14, pitch: -0.5 }
];

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.evaluate(() => {
  document.getElementById('overlay').style.display = 'none';
});

for (const v of VIEWS) {
  await page.evaluate(({ pos, yaw, pitch }) => {
    const { camera } = window.__game;
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }, v);
  await page.waitForTimeout(650);
  await page.screenshot({ path: `shots/${v.name}.png` });
  console.log('captured', v.name);
}
await browser.close();
