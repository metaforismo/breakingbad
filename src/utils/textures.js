// Procedural canvas textures: keeps the repo asset-free while still giving
// surfaces realistic grain. Every texture is generated once at startup.

import * as THREE from 'three';
import { makeRng } from './noise.js';

function makeTexture(size, draw, { srgb = true, repeat = null, w = null, h = null } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w || size;
  canvas.height = h || size;
  const ctx = canvas.getContext('2d');
  draw(ctx, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (repeat) tex.repeat.set(repeat[0], repeat[1]);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function speckle(ctx, size, rng, count, colors, minR = 0.5, maxR = 1.6) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
    ctx.globalAlpha = 0.12 + rng() * 0.3;
    const r = minR + rng() * (maxR - minR);
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function blotches(ctx, size, rng, count, color, maxR) {
  for (let i = 0; i < count; i++) {
    const x = rng() * size, y = rng() * size, r = maxR * (0.3 + rng() * 0.7);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.05 + rng() * 0.1;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- ground
export function sandTexture(repeat = [340, 340]) {
  const rng = makeRng(101);
  return makeTexture(512, (ctx, s) => {
    ctx.fillStyle = '#d4b078';
    ctx.fillRect(0, 0, s, s);
    // fine grain only — any larger feature in a tile repeated 340x reads as
    // a grid; the dunes get their large-scale variation from vertex colors
    speckle(ctx, s, rng, 11000, ['#a8804e', '#e8d2a0', '#bf9259', '#8f6a3e'], 0.4, 1.2);
  }, { repeat });
}

export function sandBumpTexture(repeat = [340, 340]) {
  const rng = makeRng(102);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, rng, 5000, ['#ffffff', '#404040', '#b0b0b0'], 0.4, 1.2);
  }, { srgb: false, repeat });
}

export function asphaltTexture(repeat = [1, 160], centerLine = true) {
  const rng = makeRng(103);
  return makeTexture(512, (ctx, s) => {
    ctx.fillStyle = '#3c3a38';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, 24, 'rgba(20, 20, 20, 1)', 160);
    blotches(ctx, s, rng, 16, 'rgba(90, 86, 80, 1)', 120);
    speckle(ctx, s, rng, 8000, ['#5a5650', '#23211f', '#6e6a62'], 0.4, 1.4);
    if (centerLine) {
      // faded yellow center dashes + worn white edge lines
      ctx.fillStyle = 'rgba(196, 168, 60, 0.85)';
      ctx.fillRect(s / 2 - 5, 0, 10, s * 0.55);
      ctx.fillStyle = 'rgba(200, 200, 195, 0.5)';
      ctx.fillRect(14, 0, 7, s);
      ctx.fillRect(s - 21, 0, 7, s);
    }
  }, { repeat });
}

export function dirtRoadTexture(repeat = [1, 70]) {
  const rng = makeRng(113);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#b08c5c';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, 18, 'rgba(140, 105, 64, 1)', 110);
    speckle(ctx, s, rng, 4200, ['#8f6f44', '#c8a878', '#7d5f3a'], 0.4, 1.5);
    // twin tire tracks worn lighter
    ctx.fillStyle = 'rgba(220, 195, 150, 0.32)';
    ctx.fillRect(s * 0.22, 0, s * 0.13, s);
    ctx.fillRect(s * 0.65, 0, s * 0.13, s);
  }, { repeat });
}

export function concreteTexture(repeat = [2, 5]) {
  const rng = makeRng(104);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#b9b2a6';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, 14, 'rgba(140, 132, 120, 1)', 90);
    speckle(ctx, s, rng, 3500, ['#978f82', '#cfc8bc', '#7e766a'], 0.4, 1.1);
    ctx.strokeStyle = 'rgba(80, 75, 68, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2);
    ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s);
    ctx.stroke();
  }, { repeat });
}

export function riverRockTexture(repeat = [4, 4]) {
  const rng = makeRng(114);
  return makeTexture(512, (ctx, s) => {
    ctx.fillStyle = '#6e6258';
    ctx.fillRect(0, 0, s, s);
    const tones = ['#9b8d7d', '#b3a89a', '#857463', '#a99681', '#796a5c', '#c0b4a4', '#8d8276'];
    for (let i = 0; i < 900; i++) {
      const x = rng() * s, y = rng() * s;
      const rx = 6 + rng() * 14, ry = rx * (0.6 + rng() * 0.4);
      const a = rng() * Math.PI;
      const base = tones[Math.floor(rng() * tones.length)];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 0, 0, 0, rx);
      grad.addColorStop(0, '#cfc4b4');
      grad.addColorStop(0.35, base);
      grad.addColorStop(1, '#4a4138');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, { repeat });
}

export function lawnTexture(repeat = [3, 3]) {
  const rng = makeRng(115);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#5a7d3a';
    ctx.fillRect(0, 0, s, s);
    // mowing stripes
    for (let i = 0; i < 8; i++) {
      if (i % 2) continue;
      ctx.fillStyle = 'rgba(255, 255, 230, 0.06)';
      ctx.fillRect(i * (s / 8), 0, s / 8, s);
    }
    blotches(ctx, s, rng, 14, 'rgba(120, 140, 60, 1)', 70);
    blotches(ctx, s, rng, 8, 'rgba(60, 90, 36, 1)', 80);
    speckle(ctx, s, rng, 5200, ['#6d9344', '#48662e', '#83a455', '#3e5c28'], 0.3, 1.1);
  }, { repeat });
}

// --------------------------------------------------------------- building
export function stuccoTexture(base = '#cdb592', dark = '178, 150, 112', repeat = [3, 1.5]) {
  const rng = makeRng(105 + base.length * 7 + base.charCodeAt(1));
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, 18, `rgba(${dark}, 1)`, 80);
    speckle(ctx, s, rng, 4200, ['rgba(0,0,0,0.5)', 'rgba(255,255,255,0.5)'], 0.4, 1.2);
  }, { repeat });
}

export function stuccoBumpTexture(repeat = [3, 1.5]) {
  const rng = makeRng(106);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, rng, 6000, ['#ffffff', '#303030'], 0.4, 1.6);
  }, { srgb: false, repeat });
}

export function shingleTexture(palette = 'brown', repeat = [6, 3]) {
  const rng = makeRng(107 + palette.length);
  // [r, g, b] base + variation
  const tones = {
    brown: [122, 84, 58],
    gray: [96, 92, 86],
    tan: [140, 112, 80]
  }[palette] || [122, 84, 58];
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = `rgb(${tones[0] - 30}, ${tones[1] - 26}, ${tones[2] - 20})`;
    ctx.fillRect(0, 0, s, s);
    const rows = 8, rh = s / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (s / 12);
      for (let cX = -1; cX < 7; cX++) {
        const t = (rng() - 0.5) * 44;
        ctx.fillStyle = `rgb(${tones[0] + t | 0}, ${tones[1] + t * 0.8 | 0}, ${tones[2] + t * 0.7 | 0})`;
        ctx.fillRect(cX * (s / 6) + off + 1, r * rh + 1, s / 6 - 2, rh - 2);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(0, r * rh, s, 2);
    }
    speckle(ctx, s, rng, 2200, ['rgba(0,0,0,0.6)', 'rgba(255,255,255,0.35)'], 0.3, 1);
  }, { repeat });
}

export function brickTexture(repeat = [2, 2]) {
  const rng = makeRng(108);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#9a9285';
    ctx.fillRect(0, 0, s, s);
    const rows = 8, rh = s / rows, bw = s / 4;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * bw * 0.5;
      for (let c = -1; c < 5; c++) {
        const t = rng();
        const red = 142 + t * 36, grn = 74 + t * 22, blu = 58 + t * 16;
        ctx.fillStyle = `rgb(${red | 0}, ${grn | 0}, ${blu | 0})`;
        ctx.fillRect(c * bw + off + 2, r * rh + 2, bw - 4, rh - 4);
      }
    }
    speckle(ctx, s, rng, 1500, ['#5e3a2c', '#b08068'], 0.3, 1);
  }, { repeat });
}

export function garageDoorTexture(base = '#4a3527', panelShade = 'rgba(0,0,0,0.3)') {
  const rng = makeRng(109);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const panels = 4;
    for (let r = 0; r < panels; r++) {
      const y = r * (s / panels);
      ctx.fillStyle = panelShade;
      ctx.fillRect(0, y, s, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, y + 5, s, 3);
      ctx.strokeStyle = panelShade;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, y + 14, s - 20, s / panels - 26);
    }
    speckle(ctx, s, rng, 700, ['rgba(0,0,0,0.4)', 'rgba(255,255,255,0.2)'], 0.3, 0.9);
  });
}

export function rollupDoorTexture() {
  const rng = makeRng(116);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#8e9296';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, y, s, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(0, y + 3, s, 2);
    }
    speckle(ctx, s, rng, 900, ['rgba(120,80,40,0.5)', 'rgba(0,0,0,0.3)'], 0.4, 1.4);
  });
}

export function corrugatedTexture(repeat = [8, 1]) {
  const rng = makeRng(117);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#aeb2b0';
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 16) {
      const grad = ctx.createLinearGradient(x, 0, x + 16, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0.32)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0.32)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 16, s);
    }
    blotches(ctx, s, rng, 10, 'rgba(110, 90, 70, 1)', 70);
    speckle(ctx, s, rng, 700, ['rgba(90,60,30,0.5)'], 0.4, 1.6);
  }, { repeat });
}

export function woodPanelTexture() {
  const rng = makeRng(118);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = `rgba(${40 + rng() * 60 | 0}, ${25 + rng() * 35 | 0}, ${10 + rng() * 18 | 0}, ${0.25 + rng() * 0.3})`;
      ctx.lineWidth = 1 + rng() * 2.5;
      const y = rng() * s;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(s * 0.3, y + (rng() - 0.5) * 14, s * 0.7, y + (rng() - 0.5) * 14, s, y);
      ctx.stroke();
    }
  });
}

// ----------------------------------------------------------------- props
export function pizzaTexture() {
  const rng = makeRng(110);
  return makeTexture(256, (ctx, s) => {
    const c = s / 2;
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = '#c98e4a';
    ctx.beginPath(); ctx.arc(c, c, c - 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8b94e';
    ctx.beginPath(); ctx.arc(c, c, c - 22, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 60; i++) {
      const a = rng() * Math.PI * 2, r = rng() * (c - 34);
      ctx.fillStyle = rng() > 0.5 ? 'rgba(196, 88, 42, 0.5)' : 'rgba(214, 158, 52, 0.7)';
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 4 + rng() * 9, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function waterBumpTexture() {
  const rng = makeRng(111);
  return makeTexture(128, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      const x = rng() * s, y = rng() * s, r = 6 + rng() * 18;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rng() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)');
      g.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }, { srgb: false, repeat: [3, 3] });
}

export function cloudTexture() {
  const rng = makeRng(112);
  return makeTexture(256, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    // shaded undersides first, bright puffs above: reads as cumulus
    for (let i = 0; i < 18; i++) {
      const x = s * 0.5 + (rng() - 0.5) * s * 0.6;
      const y = s * 0.62 + (rng() - 0.5) * s * 0.2;
      const r = s * (0.07 + rng() * 0.11);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(205, 198, 196, 0.4)');
      g.addColorStop(1, 'rgba(205, 198, 196, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 24; i++) {
      const x = s * 0.5 + (rng() - 0.5) * s * 0.58;
      const y = s * 0.48 + (rng() - 0.5) * s * 0.24;
      const r = s * (0.07 + rng() * 0.12);
      const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.3, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.65)');
      g.addColorStop(0.6, 'rgba(252, 250, 246, 0.3)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

export function sunTexture() {
  return makeTexture(128, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(255, 252, 240, 1)');
    g.addColorStop(0.18, 'rgba(255, 244, 200, 1)');
    g.addColorStop(0.45, 'rgba(255, 214, 130, 0.35)');
    g.addColorStop(1, 'rgba(255, 200, 110, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

export function foliageTexture(repeat = [2, 1]) {
  const rng = makeRng(119);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#42582e';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const tones = ['#37502a', '#4e6a35', '#2c4222', '#5d7840', '#46603a'];
      ctx.fillStyle = tones[Math.floor(rng() * tones.length)];
      ctx.globalAlpha = 0.5 + rng() * 0.5;
      const r = 2 + rng() * 5;
      ctx.beginPath();
      ctx.ellipse(rng() * s, rng() * s, r, r * 0.7, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, { repeat });
}

/** Soft dark blob laid under cars/props as a cheap contact shadow. */
export function shadowBlobTexture() {
  return makeTexture(128, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(0,0,0,0.5)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.28)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

// ----------------------------------------------------------------- signs
export function losPollosLogoTexture() {
  return makeTexture(512, (ctx, s) => {
    // panel
    ctx.fillStyle = '#f7f3e8';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#a33d2b';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, s - 20, s - 20);
    // sunburst circle
    const c = s / 2;
    ctx.fillStyle = '#f2c12e';
    ctx.beginPath(); ctx.arc(c, c - 10, 140, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a33d2b';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(c, c - 10, 140, 0, Math.PI * 2); ctx.stroke();
    // chicken
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(c, c + 14, 64, 52, 0, 0, Math.PI * 2); ctx.fill(); // body
    ctx.beginPath(); ctx.arc(c + 38, c - 44, 28, 0, Math.PI * 2); ctx.fill(); // head
    ctx.fillStyle = '#c2452e';
    for (const [cx, cy] of [[c + 24, c - 70], [c + 38, c - 76], [c + 52, c - 70]]) {
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill(); // comb
    }
    ctx.beginPath(); ctx.moveTo(c + 60, c - 44); ctx.lineTo(c + 84, c - 38);
    ctx.lineTo(c + 60, c - 30); ctx.closePath(); ctx.fill(); // beak
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(c + 42, c - 48, 5, 0, Math.PI * 2); ctx.fill(); // eye
    ctx.strokeStyle = '#e0930f';
    ctx.lineWidth = 6;
    for (const dx of [-14, 6]) {
      ctx.beginPath(); ctx.moveTo(c + dx, c + 60); ctx.lineTo(c + dx, c + 86); ctx.stroke(); // legs
    }
    // text
    ctx.fillStyle = '#a33d2b';
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px Georgia';
    ctx.fillText('LOS POLLOS', c, 78);
    ctx.fillText('HERMANOS', c, s - 36);
  });
}

export function a1aSignTexture() {
  return makeTexture(512, (ctx, s) => {
    ctx.fillStyle = '#f4f6f8';
    ctx.fillRect(0, 0, s, s / 2);
    ctx.fillStyle = '#1b4f8f';
    ctx.fillRect(0, 0, s, 22);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1b4f8f';
    ctx.font = 'bold 150px Arial';
    ctx.fillText('A1A', s / 2, 158);
    ctx.fillStyle = '#c43c2a';
    ctx.font = 'bold 56px Arial';
    ctx.fillText('CAR WASH', s / 2, 222);
  }, { w: 512, h: 256 });
}

export function saulBannerTexture() {
  return makeTexture(512, (ctx, s, h) => {
    ctx.fillStyle = '#ffd84d';
    ctx.fillRect(0, 0, s, h);
    ctx.strokeStyle = '#c43c2a';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, s - 12, h - 12);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c43c2a';
    ctx.font = 'bold 56px Arial';
    ctx.fillText('BETTER CALL SAUL!', s / 2, 62);
    ctx.fillStyle = '#16365c';
    ctx.font = 'bold 30px Arial';
    ctx.fillText('505-503-4455', s / 2, 102);
  }, { w: 512, h: 128 });
}

export function lavanderiaSignTexture() {
  return makeTexture(512, (ctx, s, h) => {
    ctx.fillStyle = '#eef1f3';
    ctx.fillRect(0, 0, s, h);
    ctx.strokeStyle = '#27649c';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, s - 8, h - 8);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#27649c';
    ctx.font = 'italic bold 54px Georgia';
    ctx.fillText('Lavandería Brillante', s / 2, 58);
    ctx.fillStyle = '#7c8895';
    ctx.font = '26px Georgia';
    ctx.fillText('INDUSTRIAL LAUNDRY', s / 2, 96);
  }, { w: 512, h: 128 });
}

export function streetSignTexture(text = 'NEGRA ARROYO LN') {
  return makeTexture(256, (ctx, s, h) => {
    ctx.fillStyle = '#1f6e3c';
    ctx.fillRect(0, 0, s, h);
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, s - 4, h - 4);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(text, s / 2, h / 2 + 9);
  }, { w: 256, h: 48 });
}

export function carWashWallTexture() {
  return makeTexture(512, (ctx, s, h) => {
    ctx.clearRect(0, 0, s, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1b4f8f';
    ctx.font = 'bold 96px Arial';
    ctx.fillText('A1A', s / 2, 96);
    ctx.fillStyle = '#c43c2a';
    ctx.font = 'bold 44px Arial';
    ctx.fillText('CAR WASH', s / 2, 150);
  }, { w: 512, h: 170 });
}

// ------------------------------------------------------------- interiors
export function woodFloorTexture(repeat = [4, 4]) {
  const rng = makeRng(120);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#9c7448';
    ctx.fillRect(0, 0, s, s);
    const plank = s / 8;
    for (let r = 0; r < 8; r++) {
      const off = (r % 2) * plank * 1.5;
      for (let c = -1; c < 4; c++) {
        const t = rng() * 30 - 15;
        ctx.fillStyle = `rgb(${156 + t | 0}, ${116 + t * 0.8 | 0}, ${72 + t * 0.6 | 0})`;
        ctx.fillRect(c * plank * 3 + off + 1, r * plank + 1, plank * 3 - 2, plank - 2);
      }
    }
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = `rgba(90, 60, 30, ${0.1 + rng() * 0.2})`;
      ctx.lineWidth = 1;
      const y = rng() * s;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(s * 0.3, y + (rng() - 0.5) * 6, s * 0.7, y + (rng() - 0.5) * 6, s, y);
      ctx.stroke();
    }
  }, { repeat });
}

export function checkerTileTexture(repeat = [6, 4]) {
  const rng = makeRng(121);
  return makeTexture(256, (ctx, s) => {
    const n = 4, c = s / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#c8b89a' : '#a3402e';
        ctx.fillRect(i * c, j * c, c, c);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(i * c, j * c, c, c);
      }
    }
    speckle(ctx, s, rng, 800, ['rgba(255,255,255,0.25)', 'rgba(0,0,0,0.2)'], 0.3, 1);
  }, { repeat });
}

export function epoxyFloorTexture(repeat = [6, 4]) {
  const rng = makeRng(122);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#7e2c20';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, 16, 'rgba(120, 50, 38, 1)', 90);
    blotches(ctx, s, rng, 10, 'rgba(60, 22, 16, 1)', 70);
    speckle(ctx, s, rng, 1200, ['rgba(255,255,255,0.12)', 'rgba(0,0,0,0.25)'], 0.3, 0.9);
  }, { repeat });
}

export function hazardStripeTexture(repeat = [6, 1]) {
  return makeTexture(128, (ctx, s) => {
    ctx.fillStyle = '#e8c12c';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#1a1a1a';
    for (let i = -1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s / 2, s);
      ctx.lineTo(i * s / 2 + s / 2, 0);
      ctx.lineTo(i * s / 2 + s * 0.75, 0);
      ctx.lineTo(i * s / 2 + s / 4, s);
      ctx.closePath();
      ctx.fill();
    }
  }, { repeat });
}

export function menuBoardTexture() {
  return makeTexture(512, (ctx, s, h) => {
    ctx.fillStyle = '#2e2520';
    ctx.fillRect(0, 0, s, h);
    ctx.fillStyle = '#f2c12e';
    ctx.fillRect(0, 0, s, 54);
    ctx.fillStyle = '#a33d2b';
    ctx.font = 'bold 34px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('LOS POLLOS HERMANOS', s / 2, 38);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f3ead8';
    ctx.font = '24px Georgia';
    const items = [
      ['Pollos Classic', '$4.99'], ['Spicy Curly Fries', '$2.49'],
      ['Hermanos Combo', '$7.99'], ['Pollos Burrito', '$5.49'],
      ['Cherry Limeade', '$1.99'], ['Family Bucket', '$12.99']
    ];
    items.forEach(([name, price], i) => {
      const col = i % 2, row = (i - col) / 2;
      ctx.fillText(name, 30 + col * 250, 100 + row * 44);
      ctx.fillStyle = '#f2c12e';
      ctx.fillText(price, 180 + col * 250, 100 + row * 44);
      ctx.fillStyle = '#f3ead8';
    });
  }, { w: 512, h: 256 });
}

export function motelSignTexture() {
  return makeTexture(512, (ctx, s, h) => {
    ctx.fillStyle = '#1d3f66';
    ctx.fillRect(0, 0, s, h);
    ctx.fillStyle = '#e8762c';
    ctx.fillRect(0, 0, s, 96);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px Arial';
    ctx.fillText('CROSSROADS', s / 2, 64);
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = '#f2d12e';
    ctx.fillText('MOTEL', s / 2, 178);
    ctx.font = '30px Arial';
    ctx.fillStyle = '#cfe3f5';
    ctx.fillText('VACANCY  ·  FREE HBO', s / 2, 228);
  }, { w: 512, h: 256 });
}

export function dogHouseSignTexture() {
  return makeTexture(512, (ctx, s, h) => {
    ctx.fillStyle = '#f5efdf';
    ctx.fillRect(0, 0, s, h);
    ctx.strokeStyle = '#b02418';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, s - 16, h - 16);
    // the dachshund
    ctx.fillStyle = '#c42818';
    ctx.beginPath();
    ctx.ellipse(s / 2, 120, 150, 44, 0, 0, Math.PI * 2); // body
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s / 2 + 160, 86, 34, 0, Math.PI * 2); // head
    ctx.fill();
    ctx.beginPath(); // snout
    ctx.ellipse(s / 2 + 196, 92, 28, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath(); // ear
    ctx.ellipse(s / 2 + 150, 102, 12, 24, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath(); // tail up
    ctx.moveTo(s / 2 - 145, 96);
    ctx.quadraticCurveTo(s / 2 - 185, 40, s / 2 - 158, 30);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#c42818';
    ctx.stroke();
    for (const lx of [-95, -40, 45, 100]) { // legs
      ctx.fillRect(s / 2 + lx, 150, 16, 46);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#b02418';
    ctx.font = 'italic bold 52px Georgia';
    ctx.fillText('the DOG HOUSE', s / 2, 236);
  }, { w: 512, h: 256 });
}

/** Warm glowing pane standing in for sunlit blinds, seen from inside. */
export function windowGlowTexture() {
  return makeTexture(128, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, '#fff3d8');
    g.addColorStop(0.5, '#ffe9bd');
    g.addColorStop(1, '#f5d9a8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(120, 90, 50, 0.35)';
    ctx.lineWidth = 3;
    for (let y = 8; y < s; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
  });
}

/** Soft rectangular gradient used as cheap ambient occlusion under buildings. */
export function rectShadowTexture() {
  return makeTexture(256, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    const m = 70;
    const g = (x0, y0, x1, y1) => {
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, 'rgba(0,0,0,0.38)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      return grad;
    };
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(m, m, s - m * 2, s - m * 2);
    ctx.fillStyle = g(0, m, 0, 0); ctx.fillRect(m, 0, s - m * 2, m);
    ctx.fillStyle = g(0, s - m, 0, s); ctx.fillRect(m, s - m, s - m * 2, m);
    ctx.fillStyle = g(m, 0, 0, 0); ctx.fillRect(0, m, m, s - m * 2);
    ctx.fillStyle = g(s - m, 0, s, 0); ctx.fillRect(s - m, m, m, s - m * 2);
    // corners
    for (const [cx, cy] of [[m, m], [s - m, m], [m, s - m], [s - m, s - m]]) {
      const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, m);
      rad.addColorStop(0, 'rgba(0,0,0,0.38)');
      rad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rad;
      const x0 = cx === m ? 0 : s - m, y0 = cy === m ? 0 : s - m;
      ctx.fillRect(x0, y0, m, m);
    }
  });
}
