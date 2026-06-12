// Captures clean promo screenshots (HUD hidden) into docs/screenshots/ for
// the README. Run with `npm run preview` serving on :4173.

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('docs/screenshots', { recursive: true });

const VIEWS = [
  { name: 'house-front', pos: [1, 2.0, -56], yaw: 3.14, pitch: 0.02 },
  { name: 'house-living', pos: [2.5, 1.7, -36], yaw: -1.72, pitch: 0.0 },
  { name: 'house-kitchen', pos: [9.5, 1.7, -33], yaw: 2.07, pitch: -0.05 },
  { name: 'pool', pos: [12, 3.4, -14], yaw: 0.96, pitch: -0.2 },
  { name: 'street', pos: [-30, 2.2, -60], yaw: -1.57, pitch: 0.0 },
  { name: 'los-pollos', pos: [207, 2.0, 40], yaw: 3.1, pitch: 0.04 },
  { name: 'pollos-interior', pos: [208, 1.7, 68], yaw: 2.9, pitch: 0.0 },
  { name: 'superlab', pos: [487, 1.7, 79], yaw: 2.05, pitch: 0.0 },
  { name: 'saul-interior', pos: [70, 1.7, 71.5], yaw: 3.1, pitch: 0.0 },
  { name: 'carwash', pos: [353, 2.0, 44], yaw: 3.1, pitch: 0.04 },
  { name: 'motel', pos: [-170, 2.0, 50], yaw: 3.14, pitch: 0.05 },
  { name: 'rv-site', pos: [-493, 2.2, -448], yaw: 0.55, pitch: -0.04 }
];

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
// hide overlay + the whole HUD for clean promo shots
await page.evaluate(() => {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('hud').style.display = 'none';
});

for (const v of VIEWS) {
  await page.evaluate(({ pos, yaw, pitch }) => {
    const { camera } = window.__game;
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }, v);
  await page.waitForTimeout(650);
  await page.screenshot({ path: `docs/screenshots/${v.name}.png` });
  console.log('captured', v.name);
}
await browser.close();
