import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// step the player simulation directly: deterministic, no RAF throttling
async function tryWalk(x, z, frames = 300) {
  return page.evaluate(({ x, z, frames }) => {
    const p = window.__game.player;
    p.position.set(x, 0, z);
    p.velocity.set(0, 0, 0);
    p.yaw = Math.PI; // face +z
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    for (let i = 0; i < frames; i++) p.update(1 / 60);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    return { x: +p.position.x.toFixed(2), z: +p.position.z.toFixed(2) };
  }, { x, z, frames });
}

console.log('door walk  :', JSON.stringify(await tryWalk(2.1, -41.5)), '(should pass z > -38)');
console.log('wall walk  :', JSON.stringify(await tryWalk(6.0, -41.5)), '(should stop near z=-39.3)');
console.log('pollos walk:', JSON.stringify(await tryWalk(208, 63)), '(should pass z > 67)');
console.log('lab walk   :', JSON.stringify(await tryWalk(487, 73)), '(should pass z > 77)');
await browser.close();
