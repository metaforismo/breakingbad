// The commercial strip along Central Ave: Los Pollos Hermanos (with a
// walkable dining room), Saul Goodman's strip-mall office, the A1A Car
// Wash, the Lavandería Brillante — whose interior is the superlab — plus
// the Crossroads Motel and the Dog House drive-in further west.

import * as THREE from 'three';
import {
  stuccoTexture, stuccoBumpTexture, concreteTexture, asphaltTexture,
  corrugatedTexture, rollupDoorTexture, losPollosLogoTexture,
  a1aSignTexture, saulBannerTexture, lavanderiaSignTexture, carWashWallTexture,
  checkerTileTexture, epoxyFloorTexture, hazardStripeTexture, menuBoardTexture,
  motelSignTexture, dogHouseSignTexture
} from '../utils/textures.js';
import { carPresets } from '../objects/cars.js';
import {
  wallWithGap, contactShadow, ceilingFixture, roundTable, dinerChair,
  flask, steelMat, blackMat, whiteGoodsMat
} from '../objects/furniture.js';

const glassMat = new THREE.MeshStandardMaterial({
  color: 0x3a505e, roughness: 0.05, metalness: 0.7, side: THREE.DoubleSide
});
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

function makeAddCollider(colliders) {
  return (minX, minZ, maxX, maxZ, h = 5) => {
    colliders.push(new THREE.Box3(
      new THREE.Vector3(minX, 0, minZ),
      new THREE.Vector3(maxX, h, maxZ)
    ));
  };
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

/** Glass curtain wall with mullions; if doorX is set the bay is left open. */
function storefront(g, x0, x1, y0, y1, z, doorX = null, doorW = 1.7) {
  const panes = doorX === null
    ? [[x0, x1]]
    : [[x0, doorX - doorW / 2], [doorX + doorW / 2, x1]];
  for (const [a, b] of panes) {
    if (b - a < 0.1) continue;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(b - a, y1 - y0), glassMat);
    glass.position.set((a + b) / 2, (y0 + y1) / 2, z);
    glass.rotation.y = Math.PI;
    g.add(glass);
  }
  const n = Math.round((x1 - x0) / 1.8);
  for (let i = 0; i <= n; i++) {
    g.add(box(0.08, y1 - y0, 0.08, mullionMat, x0 + (i * (x1 - x0)) / n, (y0 + y1) / 2, z, false));
  }
  g.add(box(x1 - x0, 0.1, 0.1, mullionMat, (x0 + x1) / 2, y1, z, false));
  if (doorX !== null) {
    // open doorway with a frame; one swung-open glass leaf
    g.add(box(0.08, y1 - y0, 0.12, mullionMat, doorX - doorW / 2, (y0 + y1) / 2, z, false));
    g.add(box(0.08, y1 - y0, 0.12, mullionMat, doorX + doorW / 2, (y0 + y1) / 2, z, false));
    g.add(box(doorW, 0.1, 0.12, mullionMat, doorX, y0 + 2.1, z, false));
    const leaf = new THREE.Group();
    leaf.position.set(doorX - doorW / 2, 0, z);
    const leafGlass = new THREE.Mesh(new THREE.PlaneGeometry(doorW / 2 - 0.05, 2.0), glassMat);
    leafGlass.position.set(doorW / 4, y0 + 1.05, 0);
    leaf.add(leafGlass);
    leaf.rotation.y = -0.9;
    g.add(leaf);
  }
}

// ---- Los Pollos Hermanos ------------------------------------------------
function losPollos(colliders) {
  const g = new THREE.Group();
  const addC = makeAddCollider(colliders);
  const X = 210, Z = 73;
  const W = 24, D = 14, H = 3.6;
  const F = Z - D / 2, B = Z + D / 2, L = X - W / 2, R = X + W / 2;

  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#e3cfa8', '194, 168, 124'), bumpMap: bumpTex, bumpScale: 0.3, roughness: 0.95
  });

  // hollow shell: stucco flanks + glass storefront with an open door bay
  wallWithGap(g, addC, wallMat, { axis: 'x', from: L, to: R, at: B, h: H, t: 0.3 });
  wallWithGap(g, addC, wallMat, { axis: 'z', from: F, to: B, at: L, h: H, t: 0.3 });
  wallWithGap(g, addC, wallMat, { axis: 'z', from: F, to: B, at: R, h: H, t: 0.3 });
  // front: stucco shoulders + glass band with door gap at X-2
  g.add(box(2.8, H, 0.3, wallMat, L + 1.4, H / 2, F));
  addC(L, F - 0.15, L + 2.8, F + 0.15);
  g.add(box(8, H, 0.3, wallMat, R - 4, H / 2, F));
  addC(R - 8, F - 0.15, R, F + 0.15);
  // glass band header + sill
  g.add(box(13.2, H - 2.6, 0.3, wallMat, X - 2.4, 2.6 + (H - 2.6) / 2, F, false));
  g.add(box(13.2, 0.4, 0.3, mullionMat, X - 2.4, 0.2, F, false));
  storefront(g, X - 9, X + 4.2, 0.4, 2.6, F - 0.01, X - 2);
  // colliders along the glass, leaving the doorway open
  addC(X - 9, F - 0.15, X - 2.9, F + 0.15);
  addC(X - 1.1, F - 0.15, X + 4.2, F + 0.15);

  // red mansard band + parapet + roof slab
  const mansardMat = new THREE.MeshStandardMaterial({ color: 0xa34128, roughness: 0.8 });
  for (const [bw, bd, bx, bz, rot] of [
    [W + 1.6, 1.4, X, F - 0.3, 0],
    [W + 1.6, 1.4, X, B + 0.3, 1],
    [1.4, D + 1.6, L - 0.3, Z, 2],
    [1.4, D + 1.6, R + 0.3, Z, 3]
  ]) {
    const band = box(bw, 1.3, bd, mansardMat, bx, H + 0.45, bz);
    band.rotation.x = rot === 0 ? 0.32 : rot === 1 ? -0.32 : 0;
    band.rotation.z = rot === 2 ? -0.32 : rot === 3 ? 0.32 : 0;
    g.add(band);
  }
  g.add(box(W + 0.4, 0.25, D + 0.4, whiteMat, X, H + 1.05, Z, false));
  g.add(box(W - 0.5, 0.12, D - 0.5, whiteMat, X, H + 0.05, Z, false)); // roof slab
  g.add(box(1.6, 0.8, 1.2, acMat, X - 6, H + 1.5, Z - 2));
  g.add(box(1.4, 0.7, 1.2, acMat, X + 5, H + 1.5, Z + 1));

  // ---- dining room interior -------------------------------------------
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.5, D - 0.5),
    new THREE.MeshStandardMaterial({ map: checkerTileTexture([8, 5]), roughness: 0.4 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(X, 0.06, Z);
  floor.receiveShadow = true;
  g.add(floor);
  g.add(box(W - 0.5, 0.1, D - 0.5, whiteMat, X, 3.32, Z, false)); // ceiling
  g.add(ceilingFixture(2.2, 0.7, X - 5, 3.26, Z - 1.5));
  g.add(ceilingFixture(2.2, 0.7, X + 3, 3.26, Z - 1.5));
  g.add(ceilingFixture(2.2, 0.7, X - 1, 3.26, Z + 3));
  const lpLight = new THREE.PointLight(0xfff0d8, 22, 24, 1.8);
  lpLight.position.set(X - 1, 2.9, Z);
  g.add(lpLight);

  // warm back wall + service counter
  g.add(box(W - 0.7, 3.2, 0.06, new THREE.MeshStandardMaterial({ color: 0xe0b455, roughness: 0.9 }),
    X, 1.6, B - 0.21, false));
  const counter = box(9, 0.95, 0.75, new THREE.MeshStandardMaterial({ color: 0x8c3a26, roughness: 0.7 }),
    X - 2, 0.53, B - 3.4);
  g.add(counter);
  g.add(box(9.2, 0.06, 0.85, steelMat, X - 2, 1.03, B - 3.4, false));
  addC(X - 6.6, B - 3.8, X + 2.6, B - 3.0, 1.2);
  g.add(box(0.5, 0.32, 0.4, blackMat, X - 5, 1.22, B - 3.4)); // register
  // menu board above the kitchen pass
  const menu = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 1.7),
    new THREE.MeshBasicMaterial({ map: menuBoardTexture() })
  );
  menu.position.set(X - 2, 2.4, B - 0.25);
  menu.rotation.y = Math.PI;
  g.add(menu);
  // fryer line behind the counter
  for (const fx of [X - 5.5, X - 4.3, X - 3.1]) {
    g.add(box(1.0, 1.25, 0.8, steelMat, fx, 0.68, B - 1.1));
  }
  g.add(box(4.4, 0.5, 1.0, acMat, X - 4.3, 2.9, B - 1.1, false)); // vent hood
  addC(X - 6.2, B - 1.6, X - 2.4, B - 0.4, 1.5);
  // Gus's office door
  g.add(box(1.0, 2.05, 0.08, blackMat, X + 8, 1.03, B - 0.26, false));

  // tables + chairs
  const tableSpots = [
    [X - 6.5, Z - 1.5], [X - 3.5, Z + 0.8], [X - 0.5, Z - 1.8],
    [X + 2.5, Z + 0.6], [X + 5.5, Z - 1.6]
  ];
  for (const [tx, tz] of tableSpots) {
    g.add(roundTable(tx, tz));
    addC(tx - 0.5, tz - 0.5, tx + 0.5, tz + 0.5, 0.9);
    g.add(dinerChair(tx - 0.85, tz, Math.PI / 2));
    g.add(dinerChair(tx + 0.85, tz, -Math.PI / 2));
    g.add(dinerChair(tx, tz + 0.85, Math.PI));
  }
  // booth row along the front windows, east side
  const boothMat = new THREE.MeshStandardMaterial({ color: 0xa3402e, roughness: 0.7 });
  for (let i = 0; i < 3; i++) {
    const bx = X + 6 + 0; const bz = F + 1.2 + i * 2.2;
    g.add(box(0.55, 1.05, 1.6, boothMat, X + 9.5, 0.55, bz));
    g.add(box(1.4, 0.08, 1.4, whiteGoodsMat, X + 8.2, 0.78, bz, false));
    g.add(box(0.16, 0.7, 0.16, blackMat, X + 8.2, 0.4, bz, false));
    void bx;
  }
  addC(X + 7.4, F + 0.4, X + 10.2, F + 6.6, 1.2);

  // the mop bucket + wet-floor cone (Gus keeps it spotless)
  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.4, 12),
    new THREE.MeshStandardMaterial({ color: 0xe8c12c, roughness: 0.6 })
  );
  bucket.position.set(X + 6.8, 0.26, B - 1.4);
  bucket.castShadow = true;
  g.add(bucket);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.55, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8c12c, roughness: 0.6 })
  );
  cone.position.set(X + 5.9, 0.33, B - 2.2);
  cone.castShadow = true;
  g.add(cone);

  // ---- exterior dressing ------------------------------------------------
  const logoTex = losPollosLogoTexture();
  const wallLogo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 2.3),
    new THREE.MeshBasicMaterial({ map: logoTex })
  );
  wallLogo.position.set(X - 2, H + 1.35, F - 0.5);
  wallLogo.rotation.y = Math.PI;
  g.add(wallLogo);
  g.add(poleSign(logoTex, X - 13, 30, { w: 4.2, h: 4.2, poleH: 8 }));
  g.add(contactShadow(W, D, X, Z));

  g.add(parkingLot(34, 32, X - 1, F - 17));
  const c1 = carPresets.sedanWhite();
  c1.position.set(X - 9.5, 0, F - 4.6);
  c1.rotation.y = Math.PI;
  g.add(c1);
  const c2 = carPresets.sedanBlue();
  c2.position.set(X - 3.5, 0, F - 4.6);
  c2.rotation.y = Math.PI;
  g.add(c2);
  const c3 = carPresets.suvBlack();
  c3.position.set(X + 5.5, 0, F - 4.7);
  c3.rotation.y = Math.PI;
  g.add(c3);

  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x55703c, roughness: 1, flatShading: true });
  const shrubGeo = new THREE.IcosahedronGeometry(0.4, 1);
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(shrubGeo, shrubMat);
    s.position.set(X + 6 + i * 1.4, 0.28, F - 1.2);
    s.castShadow = true;
    g.add(s);
  }
  return { group: g, cars: [c1, c2, c3] };
}

// ---- A1A Car Wash ----------------------------------------------------------
function carWash(colliders) {
  const g = new THREE.Group();
  const addC = makeAddCollider(colliders);
  const X = 355, Z = 70;
  const W = 18, D = 11, H = 4.6;

  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#e9eef2', '198, 208, 216'), bumpMap: bumpTex, bumpScale: 0.25, roughness: 0.9
  });
  g.add(box(W, H, D, wallMat, X, H / 2, Z));
  addC(X - W / 2, Z - D / 2, X + W / 2, Z + D / 2, 6);
  g.add(contactShadow(W, D, X, Z));

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2a5d9e, roughness: 0.6 });
  g.add(box(W + 0.2, 0.7, D + 0.2, blueMat, X, H - 0.35, Z, false));
  const letters = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 2.3),
    new THREE.MeshBasicMaterial({ map: carWashWallTexture(), transparent: true })
  );
  letters.position.set(X - 3, 2.6, Z - D / 2 - 0.01);
  letters.rotation.y = Math.PI;
  g.add(letters);

  const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x0d1114, roughness: 1 });
  for (const side of [-1, 1]) {
    const opening = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.9), tunnelMat);
    opening.position.set(X + 5, 1.45, Z + side * (D / 2 + 0.02));
    if (side < 0) opening.rotation.y = Math.PI;
    g.add(opening);
    g.add(box(4.2, 0.35, 0.2, blueMat, X + 5, 3.1, Z + side * (D / 2 + 0.05), false));
    g.add(box(0.35, 3.1, 0.2, blueMat, X + 3.1, 1.55, Z + side * (D / 2 + 0.05), false));
    g.add(box(0.35, 3.1, 0.2, blueMat, X + 6.9, 1.55, Z + side * (D / 2 + 0.05), false));
  }

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
  const addC = makeAddCollider(colliders);
  const X = 70, Z = 76;
  const W = 34, D = 12, H = 4.2;

  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#d9c8a4', '182, 160, 122'), bumpMap: bumpTex, bumpScale: 0.3, roughness: 0.95
  });
  g.add(box(W, H, D, wallMat, X, H / 2, Z));
  addC(X - W / 2, Z - D / 2, X + W / 2, Z + D / 2, 6);
  g.add(box(W + 0.4, 0.5, D + 0.4, whiteMat, X, H + 0.2, Z, false));
  g.add(contactShadow(W, D, X, Z));

  g.add(box(W + 0.4, 0.22, 3.2, whiteMat, X, 3.2, Z - D / 2 - 1.6));
  for (let i = 0; i < 8; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 10), whiteMat);
    col.position.set(X - W / 2 + 1.4 + i * (W - 2.8) / 7, 1.6, Z - D / 2 - 2.9);
    col.castShadow = true;
    g.add(col);
  }

  storefront(g, X - 15, X - 6.5, 0.35, 2.7, Z - D / 2 - 0.01);
  storefront(g, X - 5.5, X + 5.5, 0.35, 2.7, Z - D / 2 - 0.01);
  storefront(g, X + 6.5, X + 15, 0.35, 2.7, Z - D / 2 - 0.01);

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
  for (let i = 0; i < 5; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.45, 6), greenMat);
    const a = -Math.PI / 2 + (i / 4) * Math.PI;
    spike.position.set(Math.cos(a) * 0.4, 3.95 + Math.abs(Math.sin(a)) * 0.12, Math.sin(a) * 0.12 - 0.12);
    spike.rotation.z = -Math.cos(a) * 0.7;
    liberty.add(spike);
  }
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

// ---- Lavandería Brillante: the superlab is inside ----------------------------
function laundromat(colliders) {
  const g = new THREE.Group();
  const addC = makeAddCollider(colliders);
  const X = 480, Z = 88;
  const W = 38, D = 24, H = 7;
  const F = Z - D / 2, B = Z + D / 2, L = X - W / 2, R = X + W / 2;

  const wallMat = new THREE.MeshStandardMaterial({
    map: corrugatedTexture([10, 1]), roughness: 0.7, metalness: 0.25
  });

  // hollow shell with a man-door gap on the front
  wallWithGap(g, addC, wallMat, {
    axis: 'x', from: L, to: R, at: F, h: H, t: 0.3,
    gapCenter: X + 7, gapWidth: 1.4, gapHeight: 2.3
  });
  wallWithGap(g, addC, wallMat, { axis: 'x', from: L, to: R, at: B, h: H, t: 0.3 });
  wallWithGap(g, addC, wallMat, { axis: 'z', from: F, to: B, at: L, h: H, t: 0.3 });
  wallWithGap(g, addC, wallMat, { axis: 'z', from: F, to: B, at: R, h: H, t: 0.3 });
  g.add(box(W + 0.4, 0.4, D + 0.4, whiteMat, X, H + 0.15, Z, false));
  g.add(box(W - 0.4, 0.14, D - 0.4, new THREE.MeshStandardMaterial({
    color: 0x6e7276, roughness: 0.9
  }), X, H - 0.1, Z, false)); // roof deck / interior ceiling
  g.add(contactShadow(W, D, X, Z));

  // exterior dressing
  const band = new THREE.Mesh(new THREE.PlaneGeometry(W - 6, 1.1), glassMat);
  band.position.set(X, H - 1.4, F - 0.16);
  band.rotation.y = Math.PI;
  g.add(band);
  for (let i = 0; i <= 10; i++) {
    g.add(box(0.1, 1.1, 0.08, mullionMat, X - (W - 6) / 2 + i * (W - 6) / 10, H - 1.4, F - 0.18, false));
  }
  const rollMat = new THREE.MeshStandardMaterial({ map: rollupDoorTexture(), roughness: 0.7, metalness: 0.3 });
  for (const dx of [-10, -2]) {
    const roll = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.6), rollMat);
    roll.position.set(X + dx, 1.8, F - 0.16);
    roll.rotation.y = Math.PI;
    roll.receiveShadow = true;
    g.add(roll);
  }
  g.add(box(10, 0.6, 4, new THREE.MeshStandardMaterial({
    map: concreteTexture([3, 1]), roughness: 0.9
  }), X - 6, 0.3, F - 2));
  addC(X - 11, F - 4, X - 1, F, 0.7);
  for (const [sx, sh] of [[X - 12, 3.2], [X - 8, 2.4]]) {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, sh, 12), acMat);
    stack.position.set(sx, H + sh / 2, Z + 4);
    stack.castShadow = true;
    g.add(stack);
  }
  for (let i = 0; i < 4; i++) {
    g.add(box(1.3, 0.7, 1.3, acMat, X + 4 + i * 3.4, H + 0.35, Z + 2));
  }
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 2.75),
    new THREE.MeshBasicMaterial({ map: lavanderiaSignTexture() })
  );
  sign.position.set(X + 8, H - 2.9, F - 0.2);
  sign.rotation.y = Math.PI;
  g.add(sign);
  g.add(parkingLot(44, 26, X - 2, F - 14, 0));

  // ---- THE SUPERLAB -----------------------------------------------------
  const lab = new THREE.Group();
  const epoxy = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.7, D - 0.7),
    new THREE.MeshStandardMaterial({ map: epoxyFloorTexture([7, 5]), roughness: 0.3, metalness: 0.05 })
  );
  epoxy.rotation.x = -Math.PI / 2;
  epoxy.position.set(X, 0.06, Z);
  epoxy.receiveShadow = true;
  lab.add(epoxy);

  // cool industrial lighting
  for (const [fx, fz] of [[X - 10, Z - 5], [X - 10, Z + 5], [X, Z - 5], [X, Z + 5], [X + 10, Z - 5], [X + 10, Z + 5]]) {
    lab.add(ceilingFixture(2.6, 0.5, fx, H - 0.25, fz));
  }
  const labLight1 = new THREE.PointLight(0xeaf2ff, 30, 30, 1.7);
  labLight1.position.set(X - 7, 5.4, Z);
  lab.add(labLight1);
  const labLight2 = new THREE.PointLight(0xeaf2ff, 30, 30, 1.7);
  labLight2.position.set(X + 8, 5.4, Z);
  lab.add(labLight2);

  // the twin stainless reaction vessels with overhead pipework
  // (kept low-metalness so the shaded side doesn't go black indoors)
  const tankMat = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 0.55, roughness: 0.35 });
  for (const [tx, tz] of [[X - 9, Z - 1], [X - 4, Z + 3.5]]) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.4, 22), tankMat);
    tank.position.set(tx, 1.76, tz);
    tank.castShadow = true;
    lab.add(tank);
    const domeTop = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), tankMat);
    domeTop.position.set(tx, 3.46, tz);
    domeTop.castShadow = true;
    lab.add(domeTop);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, H - 4.2, 10), tankMat);
    pipe.position.set(tx, 4.6 + (H - 4.2) / 2 - 0.4, tz);
    lab.add(pipe);
    // valve wheel
    const valve = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 14),
      new THREE.MeshStandardMaterial({ color: 0xb02418, roughness: 0.5, metalness: 0.4 }));
    valve.position.set(tx + 1.52, 1.6, tz);
    valve.rotation.y = Math.PI / 2;
    lab.add(valve);
    addC(tx - 1.6, tz - 1.6, tx + 1.6, tz + 1.6, 3.5);
  }
  // horizontal pipe run between the vessels near the ceiling
  const run = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7, 10), tankMat);
  run.rotation.z = Math.PI / 2;
  run.rotation.y = -0.74;
  run.position.set(X - 6.5, H - 0.7, Z + 1.2);
  lab.add(run);

  // yellow safety railing around the vessel zone
  const railMat = new THREE.MeshStandardMaterial({ color: 0xe8c12c, roughness: 0.5, metalness: 0.3 });
  const railPosts = [
    [X - 12.5, Z - 4.5], [X - 8, Z - 4.5], [X - 1.5, Z - 4.5],
    [X - 1.5, Z + 1], [X - 1.5, Z + 6.5]
  ];
  for (const [px, pz] of railPosts) {
    lab.add(box(0.07, 1.05, 0.07, railMat, px, 0.58, pz, false));
  }
  lab.add(box(11, 0.06, 0.06, railMat, X - 7, 1.05, Z - 4.5, false));
  lab.add(box(0.06, 0.06, 11, railMat, X - 1.5, 1.05, Z + 1, false));
  lab.add(box(11, 0.06, 0.06, railMat, X - 7, 0.6, Z - 4.5, false));
  lab.add(box(0.06, 0.06, 11, railMat, X - 1.5, 0.6, Z + 1, false));
  addC(X - 12.5, Z - 4.65, X - 1.4, Z - 4.35, 1.1);
  addC(X - 1.65, Z - 4.5, X - 1.35, Z + 6.5, 1.1);

  // lab bench rows with glassware (and the blue stuff cooling)
  for (const bz of [Z - 2.5, Z + 1.5]) {
    const bench = box(4.2, 0.78, 1.1, steelMat, X + 6, 0.45, bz);
    g.add(bench);
    addC(X + 3.9, bz - 0.55, X + 8.1, bz + 0.55, 1);
    lab.add(flask(0x2a7fd4, X + 4.8, 0.84, bz - 0.2, 1.3));
    lab.add(flask(0xc23a2a, X + 6.1, 0.84, bz + 0.25, 1.1));
    lab.add(flask(0xd8a32a, X + 7.3, 0.84, bz - 0.1, 1.2));
    // tray of blue crystal
    const tray = box(0.8, 0.07, 0.5, blackMat, X + 6.8, 0.88, bz + 0.3, false);
    lab.add(tray);
    const crystals = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({
        color: 0x49a8e8, roughness: 0.1, transparent: true, opacity: 0.9,
        emissive: 0x0a2a4a
      })
    );
    crystals.position.set(X + 6.8, 0.97, bz + 0.3);
    crystals.scale.set(1.6, 0.7, 1);
    lab.add(crystals);
  }

  // barrel row along the back wall (blue methylamine + black drums)
  for (let i = 0; i < 6; i++) {
    const blue = i % 2 === 0;
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.92, 14),
      new THREE.MeshStandardMaterial({
        color: blue ? 0x1d4f8a : 0x24262a, roughness: 0.5, metalness: 0.3
      })
    );
    drum.position.set(X - 14 + i * 1.1, 0.52, B - 1.2);
    drum.castShadow = true;
    lab.add(drum);
  }
  addC(X - 14.6, B - 1.8, X - 8, B - 0.6, 1.1);

  // hazard stripes inside the doorway
  const hazard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.8),
    new THREE.MeshBasicMaterial({ map: hazardStripeTexture([3, 1]) })
  );
  hazard.rotation.x = -Math.PI / 2;
  hazard.position.set(X + 7, 0.07, F + 1.1);
  lab.add(hazard);

  // the two yellow hazmat suits hanging on the east wall
  const suitMat = new THREE.MeshStandardMaterial({ color: 0xe8c12c, roughness: 0.8 });
  for (const sz of [Z - 1.2, Z + 0.6]) {
    const suit = new THREE.Group();
    const bodySuit = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.85, 6, 10), suitMat);
    bodySuit.scale.set(1, 1, 0.45);
    bodySuit.position.y = 0;
    suit.add(bodySuit);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), suitMat);
    hood.scale.set(1, 1.1, 0.5);
    hood.position.y = 0.85;
    suit.add(hood);
    for (const side of [-1, 1]) {
      const armSuit = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.6, 4, 8), suitMat);
      armSuit.scale.set(1, 1, 0.5);
      armSuit.rotation.z = side * 0.5;
      armSuit.position.set(side * 0.38, 0.25, 0);
      suit.add(armSuit);
    }
    suit.position.set(R - 0.45, 1.7, sz);
    suit.rotation.y = -Math.PI / 2;
    suit.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    lab.add(suit);
  }

  // rolling cart
  const cart = new THREE.Group();
  cart.add(box(0.9, 0.05, 0.55, steelMat, 0, 0.75, 0));
  cart.add(box(0.9, 0.05, 0.55, steelMat, 0, 0.35, 0));
  for (const [cx2, cz2] of [[-0.4, -0.22], [0.4, -0.22], [-0.4, 0.22], [0.4, 0.22]]) {
    cart.add(box(0.04, 0.75, 0.04, steelMat, cx2, 0.4, cz2, false));
  }
  cart.add(flask(0x2a7fd4, 0.1, 0.8, 0, 1));
  cart.position.set(X + 1.5, 0, Z - 1);
  cart.rotation.y = 0.4;
  lab.add(cart);

  g.add(lab);
  return { group: g, cars: [] };
}

// ---- Crossroads Motel ---------------------------------------------------------
function motel(colliders) {
  const g = new THREE.Group();
  const addC = makeAddCollider(colliders);
  const X = -170, Z = 76;
  const W = 28, D = 7, H = 3.1;

  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#d8c8ac', '180, 160, 128'), bumpMap: bumpTex, bumpScale: 0.3, roughness: 0.95
  });
  g.add(box(W, H, D, wallMat, X, H / 2, Z));
  addC(X - W / 2, Z - D / 2, X + W / 2, Z + D / 2, 4);
  g.add(box(W + 0.6, 0.35, D + 0.8, new THREE.MeshStandardMaterial({
    color: 0x6e4a30, roughness: 0.9
  }), X, H + 0.12, Z, false));
  g.add(contactShadow(W, D, X, Z));

  // walkway canopy on posts along the room fronts
  g.add(box(W + 0.4, 0.14, 2.2, whiteMat, X, 2.6, Z - D / 2 - 1.1));
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), poleMat);
    p.position.set(X - W / 2 + 1 + i * (W - 2) / 7, 1.3, Z - D / 2 - 2);
    p.castShadow = true;
    g.add(p);
  }
  const walkway = new THREE.Mesh(
    new THREE.PlaneGeometry(W + 0.4, 2.4),
    new THREE.MeshStandardMaterial({
      map: concreteTexture([8, 1]), roughness: 0.9,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
    })
  );
  walkway.rotation.x = -Math.PI / 2;
  walkway.position.set(X, 0.06, Z - D / 2 - 1.2);
  walkway.receiveShadow = true;
  g.add(walkway);

  // six room doors + windows + AC units; office with glass at the east end
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x7e3a28, roughness: 0.6 });
  for (let i = 0; i < 6; i++) {
    const dx = X - W / 2 + 3 + i * 3.6;
    g.add(box(0.95, 2.05, 0.08, doorMat, dx, 1.02, Z - D / 2 - 0.02));
    g.add(box(1.15, 0.1, 0.12, whiteMat, dx, 2.12, Z - D / 2 - 0.04, false));
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), glassMat);
    win.position.set(dx + 1.75, 1.55, Z - D / 2 - 0.02);
    win.rotation.y = Math.PI;
    g.add(win);
    g.add(box(1.4, 1.1, 0.05, whiteMat, dx + 1.75, 1.55, Z - D / 2 + 0.02, false));
    g.add(box(0.8, 0.45, 0.3, acMat, dx + 1.75, 0.35, Z - D / 2 - 0.1, false));
    // room number plate
    g.add(box(0.14, 0.18, 0.02, whiteMat, dx - 0.62, 1.75, Z - D / 2 - 0.05, false));
  }
  // office storefront
  storefront(g, X + W / 2 - 3.4, X + W / 2 - 0.4, 0.4, 2.3, Z - D / 2 - 0.02);

  // ice machine + vending
  g.add(box(0.9, 1.6, 0.8, whiteGoodsMat, X + W / 2 - 4.4, 0.8, Z - D / 2 - 0.6));
  g.add(box(0.9, 1.7, 0.7, new THREE.MeshStandardMaterial({
    color: 0xa32430, roughness: 0.4 }), X + W / 2 - 5.5, 0.85, Z - D / 2 - 0.55));

  // the big roadside sign + parking
  g.add(poleSign(motelSignTexture(), X - 10, 30, { w: 4.4, h: 2.6, poleH: 8.5 }));
  g.add(parkingLot(30, 18, X, Z - D / 2 - 12, 0));
  const car = carPresets.sedanRed();
  car.position.set(X - 6, 0, Z - D / 2 - 6);
  car.rotation.y = Math.PI - 0.08;
  g.add(car);

  return { group: g, cars: [car] };
}

// ---- The Dog House drive-in ------------------------------------------------------
function dogHouse(colliders) {
  const g = new THREE.Group();
  const addC = makeAddCollider(colliders);
  const X = -85, Z = 68;
  const W = 8, D = 5, H = 3;

  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#efe9da', '210, 200, 182'), bumpMap: bumpTex, bumpScale: 0.25, roughness: 0.9
  });
  g.add(box(W, H, D, wallMat, X, H / 2, Z));
  addC(X - W / 2, Z - D / 2, X + W / 2, Z + D / 2, 4);
  g.add(box(W + 0.8, 0.5, D + 0.8, new THREE.MeshStandardMaterial({
    color: 0xb02418, roughness: 0.7
  }), X, H + 0.18, Z, false));
  g.add(contactShadow(W, D, X, Z));

  // service window + counter shelf
  const serviceWin = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.2), glassMat);
  serviceWin.position.set(X - 1, 1.6, Z - D / 2 - 0.01);
  serviceWin.rotation.y = Math.PI;
  g.add(serviceWin);
  g.add(box(3.0, 0.1, 0.5, whiteMat, X - 1, 0.95, Z - D / 2 - 0.2));
  g.add(box(2.8, 0.08, 0.05, blackMat, X - 1, 2.25, Z - D / 2 - 0.05, false));

  // THE sign: red dachshund on tall poles
  for (const px of [X + 2.4, X + 4.4]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 7.5, 8), poleMat);
    pole.position.set(px, 3.75, Z - D / 2 - 2.4);
    pole.castShadow = true;
    g.add(pole);
  }
  const dhSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 2.7),
    new THREE.MeshBasicMaterial({ map: dogHouseSignTexture(), side: THREE.DoubleSide })
  );
  dhSign.position.set(X + 3.4, 8.2, Z - D / 2 - 2.4);
  dhSign.castShadow = true;
  g.add(dhSign);

  // picnic table + trash can + lot
  const picnicMat = new THREE.MeshStandardMaterial({ color: 0x8a6c44, roughness: 0.95 });
  g.add(box(1.8, 0.06, 0.8, picnicMat, X - 4.5, 0.72, Z - D / 2 - 3));
  g.add(box(1.8, 0.05, 0.3, picnicMat, X - 4.5, 0.45, Z - D / 2 - 3.65));
  g.add(box(1.8, 0.05, 0.3, picnicMat, X - 4.5, 0.45, Z - D / 2 - 2.35));
  for (const [lx, lz] of [[-5.2, -3], [-3.8, -3]]) {
    g.add(box(0.08, 0.7, 0.9, picnicMat, X + lx, 0.36, Z - D / 2 + lz, false));
  }
  addC(X - 5.5, Z - D / 2 - 3.9, X - 3.5, Z - D / 2 - 2.1, 0.9);
  const trash = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.24, 0.75, 12),
    new THREE.MeshStandardMaterial({ color: 0x3a4044, roughness: 0.8, metalness: 0.4 })
  );
  trash.position.set(X + 1.4, 0.43, Z - D / 2 - 1.4);
  trash.castShadow = true;
  g.add(trash);
  g.add(parkingLot(18, 14, X - 1, Z - D / 2 - 9, 0));

  return { group: g, cars: [] };
}

export function createCommercialStrip() {
  const group = new THREE.Group();
  const colliders = [];
  const parkedCars = [];

  for (const builder of [losPollos, carWash, saulOffice, laundromat, motel, dogHouse]) {
    const { group: g, cars } = builder(colliders);
    group.add(g);
    parkedCars.push(...cars);
  }

  return { group, colliders, parkedCars };
}
