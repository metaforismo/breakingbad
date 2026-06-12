// Shared interior helpers: wall shells with door gaps, furniture pieces,
// ceiling light fixtures and the soft contact-shadow decal that grounds
// buildings. Everything is built from primitives and shared materials.

import * as THREE from 'three';
import { rectShadowTexture, windowGlowTexture } from '../utils/textures.js';

export const fabricMat = new THREE.MeshStandardMaterial({ color: 0x6b5a44, roughness: 1 });
export const cushionMat = new THREE.MeshStandardMaterial({ color: 0x7d6a50, roughness: 1 });
export const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x4f3522, roughness: 0.7 });
export const steelMat = new THREE.MeshStandardMaterial({ color: 0xb6bcc2, metalness: 0.85, roughness: 0.35 });
export const blackMat = new THREE.MeshStandardMaterial({ color: 0x16181a, roughness: 0.5 });
export const whiteGoodsMat = new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.4, metalness: 0.1 });

let glowTex = null;
let shadowTex = null;

export function box(w, h, d, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

/**
 * Wall run along x or z with an optional door gap. Returns meshes added to
 * `g` and pushes world-space colliders via addCollider(minX, minZ, maxX, maxZ).
 * Axis 'x': wall spans x0..x1 at fixed z. Axis 'z': spans z0..z1 at fixed x.
 */
export function wallWithGap(g, addCollider, mat, {
  axis, from, to, at, h, t = 0.26, y = 0, gapCenter = null, gapWidth = 1.2, gapHeight = 2.15
}) {
  const segs = [];
  if (gapCenter === null) {
    segs.push([from, to]);
  } else {
    segs.push([from, gapCenter - gapWidth / 2]);
    segs.push([gapCenter + gapWidth / 2, to]);
  }
  for (const [a, b] of segs) {
    if (b - a < 0.05) continue;
    const len = b - a, mid = (a + b) / 2;
    const wall = axis === 'x'
      ? box(len, h, t, mat, mid, y + h / 2, at)
      : box(t, h, len, mat, at, y + h / 2, mid);
    g.add(wall);
    if (axis === 'x') addCollider(a, at - t / 2, b, at + t / 2);
    else addCollider(at - t / 2, a, at + t / 2, b);
  }
  // header above the door gap
  if (gapCenter !== null && h > gapHeight) {
    const header = axis === 'x'
      ? box(gapWidth, h - gapHeight, t, mat, gapCenter, y + gapHeight + (h - gapHeight) / 2, at)
      : box(t, h - gapHeight, gapWidth, mat, at, y + gapHeight + (h - gapHeight) / 2, gapCenter);
    g.add(header);
  }
}

/** Bright warm pane that reads as a sunlit window from indoors. */
export function glowWindow(w, h) {
  if (!glowTex) glowTex = windowGlowTexture();
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: glowTex })
  );
  return mesh;
}

/** Soft AO decal under a building footprint. */
export function contactShadow(w, d, x, z, y = 0.025) {
  if (!shadowTex) shadowTex = rectShadowTexture();
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w + 3.2, d + 3.2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.renderOrder = 1;
  return mesh;
}

/** Fluorescent-style ceiling fixture (emissive, no real light). */
export function ceilingFixture(w, d, x, y, z) {
  const g = new THREE.Group();
  g.add(box(w, 0.08, d, new THREE.MeshStandardMaterial({ color: 0xd8d8d2, roughness: 0.6 }), x, y, z, false));
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.86, d * 0.8),
    new THREE.MeshBasicMaterial({ color: 0xfff6e2 })
  );
  pane.rotation.x = Math.PI / 2;
  pane.position.set(x, y - 0.05, z);
  g.add(pane);
  return g;
}

export function couch(width = 2.2) {
  const g = new THREE.Group();
  g.add(box(width, 0.42, 0.95, fabricMat, 0, 0.21, 0));
  g.add(box(width, 0.55, 0.22, fabricMat, 0, 0.62, -0.38));
  for (const side of [-1, 1]) {
    g.add(box(0.22, 0.32, 0.95, fabricMat, side * (width / 2 - 0.11), 0.55, 0));
  }
  const n = Math.max(2, Math.round(width / 0.75));
  for (let i = 0; i < n; i++) {
    g.add(box(width / n - 0.06, 0.16, 0.8, cushionMat, -width / 2 + (i + 0.5) * width / n, 0.5, 0.05, false));
  }
  return g;
}

export function coffeeTable() {
  const g = new THREE.Group();
  g.add(box(1.2, 0.06, 0.6, darkWoodMat, 0, 0.42, 0));
  for (const [px, pz] of [[-0.52, -0.24], [0.52, -0.24], [-0.52, 0.24], [0.52, 0.24]]) {
    g.add(box(0.06, 0.42, 0.06, darkWoodMat, px, 0.21, pz, false));
  }
  return g;
}

export function tvUnit() {
  const g = new THREE.Group();
  g.add(box(1.5, 0.5, 0.45, darkWoodMat, 0, 0.25, 0));
  const screen = box(1.15, 0.68, 0.07, blackMat, 0, 0.92, 0.02);
  g.add(screen);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 0.58),
    new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.1, metalness: 0.4 })
  );
  panel.position.set(0, 0.92, 0.065);
  g.add(panel);
  return g;
}

export function diningSet(rng = Math.random) {
  const g = new THREE.Group();
  g.add(box(1.5, 0.06, 0.95, darkWoodMat, 0, 0.74, 0));
  for (const [px, pz] of [[-0.65, -0.38], [0.65, -0.38], [-0.65, 0.38], [0.65, 0.38]]) {
    g.add(box(0.06, 0.74, 0.06, darkWoodMat, px, 0.37, pz, false));
  }
  for (const [cx, cz, rot] of [[-0.4, 0.75, 0], [0.4, 0.75, 0], [-0.4, -0.75, Math.PI], [0.4, -0.75, Math.PI]]) {
    g.add(chair(cx, cz, rot + (rng() - 0.5) * 0.3));
  }
  return g;
}

export function chair(x = 0, z = 0, rot = 0) {
  const g = new THREE.Group();
  g.add(box(0.42, 0.05, 0.42, darkWoodMat, 0, 0.45, 0));
  g.add(box(0.42, 0.5, 0.05, darkWoodMat, 0, 0.72, -0.19));
  for (const [px, pz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) {
    g.add(box(0.04, 0.45, 0.04, darkWoodMat, px, 0.22, pz, false));
  }
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  return g;
}

export function kitchenCounter(len, mat, topMat) {
  const g = new THREE.Group();
  g.add(box(len, 0.85, 0.62, mat, 0, 0.425, 0));
  g.add(box(len + 0.04, 0.05, 0.66, topMat, 0, 0.88, 0));
  // cabinet door seams
  const n = Math.round(len / 0.6);
  for (let i = 1; i < n; i++) {
    g.add(box(0.015, 0.7, 0.02, new THREE.MeshStandardMaterial({ color: 0x2e2218 }),
      -len / 2 + i * (len / n), 0.42, 0.315, false));
  }
  return g;
}

export function roundTable(x, z) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: 0xd8cfc0, roughness: 0.5 })
  );
  top.position.y = 0.74;
  top.castShadow = true;
  g.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), blackMat);
  stem.position.y = 0.37;
  g.add(stem);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.05, 12), blackMat);
  base.position.y = 0.03;
  g.add(base);
  g.position.set(x, 0, z);
  return g;
}

export function dinerChair(x, z, rot) {
  const g = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0xa3402e, roughness: 0.6 });
  g.add(box(0.4, 0.05, 0.4, seatMat, 0, 0.46, 0));
  g.add(box(0.4, 0.42, 0.05, seatMat, 0, 0.7, -0.18));
  for (const [px, pz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 6), steelMat);
    leg.position.set(px, 0.23, pz);
    g.add(leg);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  return g;
}

/** Erlenmeyer-ish flask with tinted "liquid". */
export function flask(color, x, y, z, scale = 1) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.16, 10),
    new THREE.MeshStandardMaterial({
      color: 0xdce8ec, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.45
    })
  );
  glass.position.y = 0.08;
  g.add(glass);
  const liquid = new THREE.Mesh(
    new THREE.ConeGeometry(0.075, 0.08, 10),
    new THREE.MeshStandardMaterial({ color, roughness: 0.2, transparent: true, opacity: 0.85 })
  );
  liquid.position.y = 0.045;
  g.add(liquid);
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.08, 8),
    glass.material
  );
  neck.position.y = 0.2;
  g.add(neck);
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  return g;
}
