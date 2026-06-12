// Procedural canvas textures: keeps the repo asset-free while still giving
// surfaces realistic grain. Every texture is generated once at startup.

import * as THREE from 'three';
import { makeRng } from './noise.js';

function makeTexture(size, draw, { srgb = true, repeat = null } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
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

export function sandTexture(repeat = [340, 340]) {
  const rng = makeRng(101);
  return makeTexture(512, (ctx, s) => {
    ctx.fillStyle = '#d4b078';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, 26, 'rgba(173, 132, 80, 1)', 180);
    blotches(ctx, s, rng, 20, 'rgba(232, 203, 150, 1)', 140);
    speckle(ctx, s, rng, 9000, ['#a8804e', '#e8d2a0', '#bf9259', '#8f6a3e'], 0.4, 1.3);
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

export function asphaltTexture(repeat = [1, 160]) {
  const rng = makeRng(103);
  return makeTexture(512, (ctx, s) => {
    ctx.fillStyle = '#3c3a38';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, 24, 'rgba(20, 20, 20, 1)', 160);
    blotches(ctx, s, rng, 16, 'rgba(90, 86, 80, 1)', 120);
    speckle(ctx, s, rng, 8000, ['#5a5650', '#23211f', '#6e6a62'], 0.4, 1.4);
    // faded yellow center line (texture v runs along road length)
    ctx.fillStyle = 'rgba(196, 168, 60, 0.85)';
    ctx.fillRect(s / 2 - 5, 0, 10, s * 0.55);
    // worn white edge lines
    ctx.fillStyle = 'rgba(200, 200, 195, 0.5)';
    ctx.fillRect(14, 0, 7, s);
    ctx.fillRect(s - 21, 0, 7, s);
  }, { repeat });
}

export function concreteTexture(repeat = [2, 5]) {
  const rng = makeRng(104);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#b9b2a6';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, 14, 'rgba(140, 132, 120, 1)', 90);
    speckle(ctx, s, rng, 3500, ['#978f82', '#cfc8bc', '#7e766a'], 0.4, 1.1);
    // expansion joints
    ctx.strokeStyle = 'rgba(80, 75, 68, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2);
    ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s);
    ctx.stroke();
  }, { repeat });
}

export function stuccoTexture(repeat = [3, 1.5]) {
  const rng = makeRng(105);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#cdb592';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, 18, 'rgba(178, 150, 112, 1)', 80);
    speckle(ctx, s, rng, 4200, ['#b89d76', '#e0caa8', '#a78d68'], 0.4, 1.4);
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

export function shingleTexture(repeat = [6, 3]) {
  const rng = makeRng(107);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#665b52';
    ctx.fillRect(0, 0, s, s);
    const rows = 8, rh = s / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (s / 12);
      for (let cX = -1; cX < 7; cX++) {
        const shade = 86 + Math.floor(rng() * 34);
        ctx.fillStyle = `rgb(${shade + 14}, ${shade + 4}, ${shade - 4})`;
        ctx.fillRect(cX * (s / 6) + off + 1, r * rh + 1, s / 6 - 2, rh - 2);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, r * rh, s, 2);
    }
    speckle(ctx, s, rng, 2200, ['#2c2622', '#6a6058'], 0.3, 1);
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

export function garageDoorTexture() {
  const rng = makeRng(109);
  return makeTexture(256, (ctx, s) => {
    ctx.fillStyle = '#ddd8cd';
    ctx.fillRect(0, 0, s, s);
    const panels = 4;
    for (let r = 0; r < panels; r++) {
      const y = r * (s / panels);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, y, s, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(0, y + 4, s, 3);
      for (let c = 0; c < 4; c++) {
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 2;
        ctx.strokeRect(c * (s / 4) + 8, y + 12, s / 4 - 16, s / panels - 24);
      }
    }
    speckle(ctx, s, rng, 600, ['#b8b2a6', '#f0ece2'], 0.3, 0.9);
  });
}

export function pizzaTexture() {
  const rng = makeRng(110);
  return makeTexture(256, (ctx, s) => {
    const c = s / 2;
    ctx.clearRect(0, 0, s, s);
    // crust
    ctx.fillStyle = '#c98e4a';
    ctx.beginPath(); ctx.arc(c, c, c - 2, 0, Math.PI * 2); ctx.fill();
    // cheese
    ctx.fillStyle = '#e8b94e';
    ctx.beginPath(); ctx.arc(c, c, c - 22, 0, Math.PI * 2); ctx.fill();
    // sauce peeking through + browned cheese blobs
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
    for (let i = 0; i < 26; i++) {
      const x = s * 0.5 + (rng() - 0.5) * s * 0.6;
      const y = s * 0.55 + (rng() - 0.5) * s * 0.3;
      const r = s * (0.08 + rng() * 0.12);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
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
