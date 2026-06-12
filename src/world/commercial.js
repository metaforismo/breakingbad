// The commercial strip along Central Ave: Los Pollos Hermanos, the A1A
// Car Wash, Saul Goodman's strip-mall office (inflatable Statue of Liberty
// included) and the Lavandería Brillante industrial laundry.

import * as THREE from 'three';
import {
  stuccoTexture, stuccoBumpTexture, concreteTexture, asphaltTexture,
  corrugatedTexture, rollupDoorTexture, losPollosLogoTexture,
  a1aSignTexture, saulBannerTexture, lavanderiaSignTexture, carWashWallTexture
} from '../utils/textures.js';
import { carPresets } from '../objects/cars.js';

const glassMat = new THREE.MeshStandardMaterial({ color: 0x3a505e, roughness: 0.05, metalness: 0.7 });
const mullionMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.4 });
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe8e6df, roughness: 0.7 });
const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4e54, metalness: 0.6, roughness: 0.5 });
const acMat = new THREE.MeshStandardMaterial({ color: 0xb0b4ae, metalness: 0.4, roughness: 0.6 });
const bumpTex = stuccoBumpTexture();

function box(w, h, d, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

function parkingLot(w, d, x, z, stallRows = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    map: asphaltTexture([Math.round(w / 8), Math.round(d / 8)], false),
    roughness: 0.95,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  lot.rotation.x = -Math.PI / 2;
  lot.position.set(x, 0.045, z);
  lot.receiveShadow = true;
  g.add(lot);

  // painted stall lines along the building side (north edge)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xd8d8d0 });
  const stallW = 3;
  const count = Math.floor((w - 4) / stallW);
  for (let r = 0; r < stallRows; r++) {
    const zr = z + d / 2 - 3 - r * 11;
    for (let i = 0; i <= count; i++) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 5), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x - w / 2 + 2 + i * stallW, 0.055, zr);
      g.add(line);
    }
  }
  return g;
}

function poleSign(texture, x, z, { w = 4, h = 4, poleH = 7, double = true } = {}) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, poleH, 10), poleMat);
  pole.position.set(x, poleH / 2, z);
  pole.castShadow = true;
  g.add(pole);
  // unlit so the sign reads bright like a backlit panel
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    side: double ? THREE.DoubleSide : THREE.FrontSide
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  panel.position.set(x, poleH + h / 2 - 0.4, z);
  panel.castShadow = true;
  g.add(panel);
  return g;
}

function storefront(g, x0, x1, y0, y1, z, doorX = null) {
  // glass wall divided by mullions, optional door bay
  const w = x1 - x0;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), glassMat);
  glass.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
  glass.rotation.y = Math.PI; // storefronts face -z
  g.add(glass);
  const n = Math.round(w / 1.8);
  for (let i = 0; i <= n; i++) {
    g.add(box(0.08, y1 - y0, 0.08, mullionMat, x0 + (i * w) / n, (y0 + y1) / 2, z, false));
  }
  g.add(box(w, 0.1, 0.1, mullionMat, (x0 + x1) / 2, y1, z, false));
  if (doorX !== null) {
    g.add(box(1.9, 0.08, 0.12, mullionMat, doorX, y0 + 2.1, z + 0.02, false));
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.05), glassMat);
    door.position.set(doorX, y0 + 1.03, z + 0.03);
    door.rotation.y = Math.PI;
    g.add(door);
    g.add(box(0.06, 2.05, 0.1, mullionMat, doorX, y0 + 1.03, z + 0.03, false));
  }
}

// ---- Los Pollos Hermanos ------------------------------------------------
function losPollos(colliders) {
  const g = new THREE.Group();
  const X = 210, Z = 73; // building center
  const W = 24, D = 14, H = 3.6;

  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#e3cfa8', '194, 168, 124'), bumpMap: bumpTex, bumpScale: 0.3, roughness: 0.95
  });
  g.add(box(W, H, D, wallMat, X, H / 2, Z));
  colliders.push(new THREE.Box3(
    new THREE.Vector3(X - W / 2, 0, Z - D / 2), new THREE.Vector3(X + W / 2, 6, Z + D / 2)
  ));

  // red mansard band around the roofline
  const mansardMat = new THREE.MeshStandardMaterial({ color: 0xa34128, roughness: 0.8 });
  for (const [bw, bd, bx, bz, rot] of [
    [W + 1.6, 1.4, X, Z - D / 2 - 0.3, 0],
    [W + 1.6, 1.4, X, Z + D / 2 + 0.3, 1],
    [1.4, D + 1.6, X - W / 2 - 0.3, Z, 2],
    [1.4, D + 1.6, X + W / 2 + 0.3, Z, 3]
  ]) {
    const band = box(bw, 1.3, bd, mansardMat, bx, H + 0.45, bz);
    band.rotation.x = rot === 0 ? 0.32 : rot === 1 ? -0.32 : 0;
    band.rotation.z = rot === 2 ? -0.32 : rot === 3 ? 0.32 : 0;
    g.add(band);
  }
  g.add(box(W + 0.4, 0.25, D + 0.4, whiteMat, X, H + 1.05, Z, false)); // parapet cap
  // roof AC units
  g.add(box(1.6, 0.8, 1.2, acMat, X - 6, H + 1.5, Z - 2));
  g.add(box(1.4, 0.7, 1.2, acMat, X + 5, H + 1.5, Z + 1));

  // storefront facing the lot (south)
  storefront(g, X - 9, X + 4, 0.4, 2.6, Z - D / 2 - 0.01, X - 2);
  g.add(box(W, 0.45, 0.1, mullionMat, X, 0.2, Z - D / 2 - 0.02, false)); // base skirt

  // logo over the entrance + pole sign by the road
  const logoTex = losPollosLogoTexture();
  const wallLogo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 2.3),
    new THREE.MeshBasicMaterial({ map: logoTex })
  );
  wallLogo.position.set(X - 2, H + 1.35, Z - D / 2 - 0.5); // rides above the parapet
  wallLogo.rotation.y = Math.PI;
  g.add(wallLogo);
  g.add(poleSign(logoTex, X - 13, 30, { w: 4.2, h: 4.2, poleH: 8 }));

  // parking + cars + planting strip
  g.add(parkingLot(34, 32, X - 1, Z - D / 2 - 17));
  const c1 = carPresets.sedanWhite();
  c1.position.set(X - 9.5, 0, Z - D / 2 - 4.6);
  c1.rotation.y = Math.PI;
  g.add(c1);
  const c2 = carPresets.sedanBlue();
  c2.position.set(X - 3.5, 0, Z - D / 2 - 4.6);
  c2.rotation.y = Math.PI;
  g.add(c2);
  const c3 = carPresets.suvBlack();
  c3.position.set(X + 5.5, 0, Z - D / 2 - 4.7);
  c3.rotation.y = Math.PI;
  g.add(c3);

  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x55703c, roughness: 1, flatShading: true });
  const shrubGeo = new THREE.IcosahedronGeometry(0.4, 1);
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(shrubGeo, shrubMat);
    s.position.set(X + 6 + i * 1.4, 0.28, Z - D / 2 - 1.2);
    s.castShadow = true;
    g.add(s);
  }
  return { group: g, cars: [c1, c2, c3] };
}

// ---- A1A Car Wash ----------------------------------------------------------
function carWash(colliders) {
  const g = new THREE.Group();
  const X = 355, Z = 70;
  const W = 18, D = 11, H = 4.6;

  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#e9eef2', '198, 208, 216'), bumpMap: bumpTex, bumpScale: 0.25, roughness: 0.9
  });
  g.add(box(W, H, D, wallMat, X, H / 2, Z));
  colliders.push(new THREE.Box3(
    new THREE.Vector3(X - W / 2, 0, Z - D / 2), new THREE.Vector3(X + W / 2, 6, Z + D / 2)
  ));

  // blue band + wall lettering
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2a5d9e, roughness: 0.6 });
  g.add(box(W + 0.2, 0.7, D + 0.2, blueMat, X, H - 0.35, Z, false));
  const letters = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 2.3),
    new THREE.MeshBasicMaterial({ map: carWashWallTexture(), transparent: true })
  );
  letters.position.set(X - 3, 2.6, Z - D / 2 - 0.01);
  letters.rotation.y = Math.PI;
  g.add(letters);

  // wash tunnel through the building (dark openings, blue surrounds)
  const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x0d1114, roughness: 1 });
  for (const side of [-1, 1]) {
    const opening = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.9), tunnelMat);
    opening.position.set(X + 5, 1.45, Z + side * (D / 2 + 0.02));
    if (side < 0) opening.rotation.y = Math.PI; // south face looks -z
    g.add(opening);
    g.add(box(4.2, 0.35, 0.2, blueMat, X + 5, 3.1, Z + side * (D / 2 + 0.05), false));
    g.add(box(0.35, 3.1, 0.2, blueMat, X + 3.1, 1.55, Z + side * (D / 2 + 0.05), false));
    g.add(box(0.35, 3.1, 0.2, blueMat, X + 6.9, 1.55, Z + side * (D / 2 + 0.05), false));
  }

  // entrance canopy on poles (the wave)
  const canopyGeo = new THREE.CylinderGeometry(2.6, 2.6, 5, 18, 1, true, -Math.PI * 0.18, Math.PI * 0.5);
  canopyGeo.rotateZ(Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, new THREE.MeshStandardMaterial({
    color: 0x2a5d9e, roughness: 0.5, side: THREE.DoubleSide
  }));
  canopy.position.set(X + 5, 2.2, Z - D / 2 - 3.4);
  canopy.castShadow = true;
  g.add(canopy);
  for (const [px, pz] of [[X + 3.4, Z - D / 2 - 1.4], [X + 6.6, Z - D / 2 - 1.4],
  [X + 3.4, Z - D / 2 - 5.2], [X + 6.6, Z - D / 2 - 5.2]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.4, 8), poleMat);
    p.position.set(px, 1.7, pz);
    p.castShadow = true;
    g.add(p);
  }

  // vacuum stations + queued car + pole sign
  for (let i = 0; i < 3; i++) {
    g.add(box(0.22, 1.1, 0.22, blueMat, X - 7 + i * 2.2, 0.55, Z - D / 2 - 8));
    g.add(box(0.4, 0.34, 0.4, acMat, X - 7 + i * 2.2, 1.25, Z - D / 2 - 8));
  }
  const car = carPresets.sedanGold();
  car.position.set(X + 5, 0, Z - D / 2 - 7.5);
  g.add(car);
  g.add(poleSign(a1aSignTexture(), X - 11, 30, { w: 4.6, h: 2.3, poleH: 9 }));
  g.add(parkingLot(26, 26, X, Z - D / 2 - 14, 0));

  return { group: g, cars: [car] };
}

// ---- Saul Goodman's strip mall ----------------------------------------------
function saulOffice(colliders) {
  const g = new THREE.Group();
  const X = 70, Z = 76;
  const W = 34, D = 12, H = 4.2;

  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#d9c8a4', '182, 160, 122'), bumpMap: bumpTex, bumpScale: 0.3, roughness: 0.95
  });
  g.add(box(W, H, D, wallMat, X, H / 2, Z));
  colliders.push(new THREE.Box3(
    new THREE.Vector3(X - W / 2, 0, Z - D / 2), new THREE.Vector3(X + W / 2, 6, Z + D / 2)
  ));
  g.add(box(W + 0.4, 0.5, D + 0.4, whiteMat, X, H + 0.2, Z, false)); // parapet

  // covered walkway with columns
  g.add(box(W + 0.4, 0.22, 3.2, whiteMat, X, 3.2, Z - D / 2 - 1.6));
  for (let i = 0; i < 8; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 10), whiteMat);
    col.position.set(X - W / 2 + 1.4 + i * (W - 2.8) / 7, 1.6, Z - D / 2 - 2.9);
    col.castShadow = true;
    g.add(col);
  }

  // three storefronts; Saul's is the middle one
  storefront(g, X - 15, X - 6.5, 0.35, 2.7, Z - D / 2 - 0.01);
  storefront(g, X - 5.5, X + 5.5, 0.35, 2.7, Z - D / 2 - 0.01, X);
  storefront(g, X + 6.5, X + 15, 0.35, 2.7, Z - D / 2 - 0.01);

  // the banner: BETTER CALL SAUL!
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(9.5, 2.2),
    new THREE.MeshBasicMaterial({ map: saulBannerTexture() })
  );
  banner.position.set(X, H + 0.9, Z - D / 2 - 0.4);
  banner.rotation.y = Math.PI;
  banner.castShadow = true;
  g.add(banner);
  for (const bx of [X - 4.5, X + 4.5]) {
    g.add(box(0.08, 1.6, 0.08, poleMat, bx, H + 0.6, Z - D / 2 - 0.35, false));
  }

  // inflatable Statue of Liberty on the roof
  const liberty = new THREE.Group();
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x4f9e84, roughness: 0.65 });
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.05, 3.2, 12), greenMat);
  robe.position.y = 1.6;
  liberty.add(robe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), greenMat);
  head.position.y = 3.55;
  liberty.add(head);
  // crown spikes
  for (let i = 0; i < 5; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.45, 6), greenMat);
    const a = -Math.PI / 2 + (i / 4) * Math.PI;
    spike.position.set(Math.cos(a) * 0.4, 3.95 + Math.abs(Math.sin(a)) * 0.12, Math.sin(a) * 0.12 - 0.12);
    spike.rotation.z = -Math.cos(a) * 0.7;
    liberty.add(spike);
  }
  // raised torch arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.7, 10), greenMat);
  arm.position.set(0.62, 4.1, 0);
  arm.rotation.z = -0.35;
  liberty.add(arm);
  const torch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8b43a, roughness: 0.5, emissive: 0x3a2a08 }));
  torch.position.set(0.9, 5.05, 0);
  liberty.add(torch);
  liberty.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  liberty.position.set(X + 1.5, H + 0.4, Z + 1);
  liberty.name = 'liberty';
  g.add(liberty);

  // parking + cars
  g.add(parkingLot(34, 28, X, Z - D / 2 - 18));
  const c1 = carPresets.sedanRed();
  c1.position.set(X - 6, 0, Z - D / 2 - 6.6);
  c1.rotation.y = Math.PI;
  g.add(c1);
  const c2 = carPresets.sedanWhite();
  c2.position.set(X + 7.5, 0, Z - D / 2 - 6.6);
  c2.rotation.y = Math.PI + 0.06;
  g.add(c2);

  return { group: g, cars: [c1, c2] };
}

// ---- Lavandería Brillante (the superlab upstairs) ----------------------------
function laundromat(colliders) {
  const g = new THREE.Group();
  const X = 480, Z = 88;
  const W = 38, D = 24, H = 7;

  const wallMat = new THREE.MeshStandardMaterial({
    map: corrugatedTexture([10, 1]), roughness: 0.7, metalness: 0.25
  });
  g.add(box(W, H, D, wallMat, X, H / 2, Z));
  colliders.push(new THREE.Box3(
    new THREE.Vector3(X - W / 2, 0, Z - D / 2), new THREE.Vector3(X + W / 2, 9, Z + D / 2)
  ));
  g.add(box(W + 0.4, 0.4, D + 0.4, whiteMat, X, H + 0.15, Z, false));

  // high window band
  const band = new THREE.Mesh(new THREE.PlaneGeometry(W - 6, 1.1), glassMat);
  band.position.set(X, H - 1.4, Z - D / 2 - 0.01);
  band.rotation.y = Math.PI;
  g.add(band);
  for (let i = 0; i <= 10; i++) {
    g.add(box(0.1, 1.1, 0.08, mullionMat, X - (W - 6) / 2 + i * (W - 6) / 10, H - 1.4, Z - D / 2 - 0.02, false));
  }

  // roll-up loading doors + man door
  const rollMat = new THREE.MeshStandardMaterial({ map: rollupDoorTexture(), roughness: 0.7, metalness: 0.3 });
  for (const dx of [-10, -2]) {
    const roll = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.6), rollMat);
    roll.position.set(X + dx, 1.8, Z - D / 2 - 0.01);
    roll.rotation.y = Math.PI;
    roll.receiveShadow = true;
    g.add(roll);
  }
  g.add(box(1.1, 2.2, 0.12, mullionMat, X + 7, 1.1, Z - D / 2 - 0.02));

  // dock slab, stacks and vents
  g.add(box(10, 0.6, 4, new THREE.MeshStandardMaterial({
    map: concreteTexture([3, 1]), roughness: 0.9
  }), X - 6, 0.3, Z - D / 2 - 2));
  for (const [sx, sh] of [[X - 12, 3.2], [X - 8, 2.4]]) {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, sh, 12), acMat);
    stack.position.set(sx, H + sh / 2, Z + 4);
    stack.castShadow = true;
    g.add(stack);
  }
  for (let i = 0; i < 4; i++) {
    g.add(box(1.3, 0.7, 1.3, acMat, X + 4 + i * 3.4, H + 0.35, Z + 2));
  }

  // sign
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 2.75),
    new THREE.MeshBasicMaterial({ map: lavanderiaSignTexture() })
  );
  sign.position.set(X + 8, H - 2.9, Z - D / 2 - 0.05);
  sign.rotation.y = Math.PI;
  g.add(sign);

  // fenced yard feel: low concrete kerb
  g.add(parkingLot(44, 26, X - 2, Z - D / 2 - 14, 0));

  return { group: g, cars: [] };
}

export function createCommercialStrip() {
  const group = new THREE.Group();
  const colliders = [];
  const parkedCars = [];

  for (const builder of [losPollos, carWash, saulOffice, laundromat]) {
    const { group: g, cars } = builder(colliders);
    group.add(g);
    parkedCars.push(...cars);
  }

  return { group, colliders, parkedCars };
}
