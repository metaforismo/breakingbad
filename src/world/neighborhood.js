// The Negra Arroyo Lane suburb: neighbor ranch houses with lawns and
// driveways on both sides of the street, Jesse's two-story place at the
// end of the lane, shade trees, streetlights along Central Ave and the
// street-name signs.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRng } from '../utils/noise.js';
import {
  stuccoTexture, stuccoBumpTexture, shingleTexture, brickTexture,
  concreteTexture, garageDoorTexture, lawnTexture, streetSignTexture,
  riverRockTexture
} from '../utils/textures.js';
import { hipRoof } from '../objects/house.js';
import { contactShadow } from '../objects/furniture.js';
import { createCar } from '../objects/cars.js';
import {
  RES_ROAD_Z, MAIN_ROAD_Z, RES_ROAD_X_MIN, RES_ROAD_X_MAX, CONN_ROAD_X, TOWN
} from './terrain.js';

const lawnMat = new THREE.MeshStandardMaterial({
  map: lawnTexture([4, 3]), roughness: 1,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
});
const driveMat = new THREE.MeshStandardMaterial({
  map: concreteTexture([2, 4]), roughness: 0.9,
  polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4
});
const glassMat = new THREE.MeshStandardMaterial({ color: 0x26384a, roughness: 0.1, metalness: 0.6 });
const trimWhite = new THREE.MeshStandardMaterial({ color: 0xe9e4d6, roughness: 0.7 });
const shrubMat = new THREE.MeshStandardMaterial({ color: 0x49652f, roughness: 1, flatShading: true });
const bumpTex = stuccoBumpTexture();

function box(w, h, d, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

function simpleWindow(g, w, h, x, y, z, rotY = 0) {
  const win = new THREE.Group();
  win.add(box(w + 0.14, h + 0.14, 0.06, trimWhite, 0, 0, -0.01, false));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
  glass.position.z = 0.03;
  win.add(glass);
  win.position.set(x, y, z);
  win.rotation.y = rotY;
  g.add(win);
}

/** A neighbor ranch house. Local: front faces +z, street at local z ~ +20. */
function ranchHouse(rng, { stucco, dark, shinglePalette, doorColor, garageRight }) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture(stucco, dark), bumpMap: bumpTex, bumpScale: 0.3, roughness: 0.95
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: shingleTexture(shinglePalette), roughness: 0.9
  });

  const W = 12 + rng() * 3, D = 8.5, H = 2.8;
  const gs = garageRight ? 1 : -1;
  const gw = 5.4;

  // main volume + flush garage, side by side (total facade W + gw, centered)
  g.add(box(W, H, D, wallMat, -gs * gw / 2, H / 2, 0));
  g.add(box(gw, H - 0.15, D - 0.5, wallMat, gs * W / 2, (H - 0.15) / 2, 0.25));

  const roof = hipRoof(W + gw * 0.0 + 1.6 + gw, D + 1.4, 1.6 + rng() * 0.4, roofMat);
  roof.position.set(0, H, 0);
  g.add(roof);
  g.add(box(W + gw + 1.7, 0.18, D + 1.5, trimWhite, 0, H - 0.04, 0, false));

  // garage door
  const gDoorMat = new THREE.MeshStandardMaterial({
    map: garageDoorTexture(rng() > 0.5 ? '#cfc8b8' : '#9a8d78', 'rgba(0,0,0,0.22)'),
    roughness: 0.75
  });
  const gx = gs * W / 2;
  const gDoor = new THREE.Mesh(new THREE.PlaneGeometry(gw - 1.2, 2.1), gDoorMat);
  gDoor.position.set(gx, 1.1, D / 2 + 0.01);
  gDoor.receiveShadow = true;
  g.add(gDoor);

  // door + windows on the front
  const doorX = -gs * (W * 0.12);
  g.add(box(1.0, 2.05, 0.1, new THREE.MeshStandardMaterial({ color: doorColor, roughness: 0.6 }),
    doorX, 1.02, D / 2 + 0.01));
  g.add(box(1.3, 0.12, 0.14, trimWhite, doorX, 2.12, D / 2 + 0.03, false));
  simpleWindow(g, 2.4, 1.4, -gs * (W * 0.34), 1.65, D / 2 + 0.02);
  simpleWindow(g, 1.6, 1.2, doorX - gs * 2.6, 1.7, D / 2 + 0.02);
  simpleWindow(g, 1.4, 1.1, -gs * ((W + gw) / 2 + 0.03), 1.7, 0, -gs * Math.PI / 2);

  // lawn + driveway + walkway
  const lotW = W + gw + 6;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(lotW, 13.5), lawnMat);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, 0.04, D / 2 + 7);
  lawn.receiveShadow = true;
  g.add(lawn);

  const drive = new THREE.Mesh(new THREE.PlaneGeometry(gw - 0.8, 12.5), driveMat);
  drive.rotation.x = -Math.PI / 2;
  drive.position.set(gx, 0.06, D / 2 + 6.6);
  drive.receiveShadow = true;
  g.add(drive);

  // shrubs by the door
  const shrubGeo = new THREE.IcosahedronGeometry(0.45, 1);
  for (const sx of [doorX - 1.3, doorX + 1.3, -gs * (W * 0.34) - 1.6]) {
    const shrub = new THREE.Mesh(shrubGeo, shrubMat);
    shrub.position.set(sx, 0.3, D / 2 + 0.7);
    shrub.scale.setScalar(0.7 + rng() * 0.5);
    shrub.castShadow = true;
    g.add(shrub);
  }

  g.userData.halfW = (W + gw) / 2 + 0.4;
  g.userData.halfD = D / 2 + 0.4;
  return g;
}

/** Hank & Marie's place: stone wainscot, purple accents everywhere. */
function schraderHouse() {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#ded4c2', '196, 184, 162'), bumpMap: bumpTex, bumpScale: 0.3, roughness: 0.95
  });
  const roofMat = new THREE.MeshStandardMaterial({ map: shingleTexture('gray'), roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ map: riverRockTexture([3, 1]), roughness: 1 });
  const purpleMat = new THREE.MeshStandardMaterial({ color: 0x5b3a78, roughness: 0.6 });

  const W = 15, D = 9.5, H = 3.2;
  g.add(box(W, H, D, wallMat, 0, H / 2, 0));
  g.add(box(W + 0.14, 1.1, D + 0.14, stoneMat, 0, 0.55, 0)); // stone wainscot
  const roof = hipRoof(W + 1.8, D + 1.6, 2.0, roofMat);
  roof.position.set(0, H, 0);
  g.add(roof);
  g.add(box(W + 1.9, 0.18, D + 1.7, trimWhite, 0, H - 0.04, 0, false));
  g.add(contactShadow(W, D, 0, 0));

  // purple front door under a small gable + purple shutters
  g.add(box(1.1, 2.1, 0.1, purpleMat, -1.5, 1.05, D / 2 + 0.02));
  g.add(box(1.5, 0.14, 0.2, purpleMat, -1.5, 2.2, D / 2 + 0.06, false));
  for (const wx of [-5, 2.4, 5.2]) {
    simpleWindow(g, 1.7, 1.3, wx, 1.8, D / 2 + 0.02);
    g.add(box(0.3, 1.45, 0.05, purpleMat, wx - 1.05, 1.8, D / 2 + 0.03, false));
    g.add(box(0.3, 1.45, 0.05, purpleMat, wx + 1.05, 1.8, D / 2 + 0.03, false));
  }
  // Hank's grill on the side patio
  const grill = new THREE.Group();
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.4, metalness: 0.5 }));
  kettle.position.y = 0.75;
  kettle.castShadow = true;
  grill.add(kettle);
  for (const a of [0, 2.1, 4.2]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6 }));
    leg.position.set(Math.cos(a) * 0.2, 0.3, Math.sin(a) * 0.2);
    grill.add(leg);
  }
  grill.position.set(W / 2 + 1.6, 0, -1);
  g.add(grill);

  // lawn + driveway
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(W + 7, 13.5), lawnMat);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, 0.04, D / 2 + 7);
  lawn.receiveShadow = true;
  g.add(lawn);
  const drive = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 12.5), driveMat);
  drive.rotation.x = -Math.PI / 2;
  drive.position.set(5.2, 0.06, D / 2 + 6.6);
  drive.receiveShadow = true;
  g.add(drive);
  // Hank's big black SUV
  const suv = createCar({ type: 'suv', color: 0x1d1f22 });
  suv.position.set(5.2, 0, D / 2 + 4.4);
  suv.rotation.y = Math.PI + 0.03;
  g.add(suv);

  g.userData.halfW = W / 2 + 0.4;
  g.userData.halfD = D / 2 + 0.4;
  return g;
}

/** Jesse's place: two-story with brick base and a columned porch. */
function jesseHouse() {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    map: stuccoTexture('#d9c9a8', '186, 162, 120'), bumpMap: bumpTex, bumpScale: 0.3, roughness: 0.95
  });
  const roofMat = new THREE.MeshStandardMaterial({ map: shingleTexture('gray'), roughness: 0.9 });
  const brickMat = new THREE.MeshStandardMaterial({ map: brickTexture([3, 1]), roughness: 0.95 });

  const W = 13, D = 10, H = 5.6;
  g.add(box(W, H, D, wallMat, 0, H / 2, 0));
  g.add(box(W + 0.12, 1.3, D + 0.12, brickMat, 0, 0.65, 0)); // brick skirt
  const roof = hipRoof(W + 1.6, D + 1.6, 2.2, roofMat);
  roof.position.set(0, H, 0);
  g.add(roof);
  g.add(box(W + 1.7, 0.18, D + 1.7, trimWhite, 0, H - 0.04, 0, false));

  // porch with columns
  g.add(box(5.4, 0.18, 2.4, brickMat, -2, 0.09, D / 2 + 1.2));
  g.add(box(5.8, 0.2, 2.8, roofMat, -2, 3.0, D / 2 + 1.3));
  for (const px of [-4.4, -2, 0.4]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.9, 10), trimWhite);
    col.position.set(px, 1.55, D / 2 + 2.2);
    col.castShadow = true;
    g.add(col);
  }
  // red front door
  g.add(box(1.1, 2.15, 0.1, new THREE.MeshStandardMaterial({ color: 0x7e2218, roughness: 0.55 }),
    -2, 1.07, D / 2 + 0.02));

  // window grid
  for (const wy of [1.8, 4.3]) {
    for (const wx of [-4.4, 0.6, 3.8]) {
      if (wy < 3 && wx === -2) continue;
      simpleWindow(g, 1.5, 1.25, wx, wy, D / 2 + 0.02);
    }
  }
  simpleWindow(g, 1.5, 1.25, -W / 2 - 0.03, 4.3, 1, -Math.PI / 2);
  simpleWindow(g, 1.5, 1.25, W / 2 + 0.03, 4.3, -1, Math.PI / 2);

  // dry, patchy lawn (Jesse doesn't water)
  const dryLawn = new THREE.MeshStandardMaterial({
    color: 0x9a8d5a, map: lawnTexture([3, 2]), roughness: 1,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(W + 6, 13), dryLawn);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, 0.04, D / 2 + 6.5);
  lawn.receiveShadow = true;
  g.add(lawn);
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 12), driveMat);
  walk.rotation.x = -Math.PI / 2;
  walk.position.set(-2, 0.06, D / 2 + 6.8);
  walk.receiveShadow = true;
  g.add(walk);

  g.userData.halfW = W / 2 + 0.4;
  g.userData.halfD = D / 2 + 0.4;
  return g;
}

// ---- trees -------------------------------------------------------------
export function createTrees(houseLots) {
  const rng = makeRng(909);
  const group = new THREE.Group();

  // merged trunk+canopy geometries, separate materials via groups: simpler to
  // use two instanced meshes sharing transforms
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 2.6, 7);
  trunkGeo.translate(0, 1.3, 0);
  const canopyParts = [];
  const tmpRng = makeRng(910);
  for (let i = 0; i < 5; i++) {
    const r = 1.1 + tmpRng() * 0.7;
    const blob = new THREE.IcosahedronGeometry(r, 1);
    blob.translate((tmpRng() - 0.5) * 1.9, 2.9 + tmpRng() * 1.5, (tmpRng() - 0.5) * 1.9);
    canopyParts.push(blob);
  }
  const canopyGeo = mergeGeometries(canopyParts);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4330, roughness: 1 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x5b6b3e, roughness: 1, flatShading: true });

  const spots = [];
  let guard = 0;
  while (spots.length < 64 && guard++ < 1600) {
    const x = -210 + rng() * 380;
    const z = -135 + rng() * 120;
    if (Math.abs(z - RES_ROAD_Z) < 8) continue; // street + sidewalks
    if (z > -20) continue; // keep clear of Central Ave
    let blocked = false;
    for (const lot of houseLots) {
      if (Math.abs(x - lot.x) < lot.halfW + 2.5 && Math.abs(z - lot.z) < lot.halfD + 2.5) {
        blocked = true;
        break;
      }
    }
    if (!blocked) spots.push({ x, z, s: 0.75 + rng() * 0.7, r: rng() * Math.PI * 2 });
  }

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, spots.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  spots.forEach((sp, i) => {
    q.setFromAxisAngle(up, sp.r);
    m.compose(new THREE.Vector3(sp.x, 0, sp.z), q, new THREE.Vector3(sp.s, sp.s, sp.s));
    trunks.setMatrixAt(i, m);
    canopies.setMatrixAt(i, m);
  });
  trunks.castShadow = true;
  canopies.castShadow = true;
  group.add(trunks, canopies);

  // tall cypress pair by the White residence (visible in the show's drive-up shots)
  const cypressMat = new THREE.MeshStandardMaterial({ color: 0x35502c, roughness: 1, flatShading: true });
  for (const [cx, cz, h] of [[17.5, -36, 7.5], [19.8, -33, 6]]) {
    const cy = new THREE.Mesh(new THREE.ConeGeometry(0.9, h, 8), cypressMat);
    cy.position.set(cx, h / 2, cz);
    cy.castShadow = true;
    group.add(cy);
  }

  return group;
}

// ---- streetlights + signs ----------------------------------------------
export function createStreetFurniture() {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3c4046, metalness: 0.5, roughness: 0.6 });

  const poleGeo = mergeGeometries([
    new THREE.CylinderGeometry(0.07, 0.1, 7, 8).translate(0, 3.5, 0),
    new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6).rotateZ(Math.PI / 2).translate(1.2, 6.9, 0),
    new THREE.BoxGeometry(0.8, 0.16, 0.3).translate(2.2, 6.86, 0)
  ]);

  const positions = [];
  for (let x = -240; x <= 560; x += 80) {
    const side = (x / 80) % 2 === 0 ? 1 : -1;
    positions.push({ x, z: MAIN_ROAD_Z + side * 7.5, rot: side > 0 ? Math.PI : 0 });
  }
  const lights = new THREE.InstancedMesh(poleGeo, poleMat, positions.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  positions.forEach((p, i) => {
    q.setFromAxisAngle(up, p.rot + Math.PI / 2);
    m.compose(new THREE.Vector3(p.x, 0, p.z), q, new THREE.Vector3(1, 1, 1));
    lights.setMatrixAt(i, m);
  });
  lights.castShadow = true;
  group.add(lights);

  // street-name signs at the lane's corner
  const signMat = new THREE.MeshBasicMaterial({
    map: streetSignTexture(), side: THREE.DoubleSide
  });
  const sign2Mat = new THREE.MeshBasicMaterial({
    map: streetSignTexture('CENTRAL AVE SE'), side: THREE.DoubleSide
  });
  for (const [sx, sz] of [[CONN_ROAD_X + 5, RES_ROAD_Z + 5], [CONN_ROAD_X - 5, MAIN_ROAD_Z - 7]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 6), poleMat);
    post.position.set(sx, 1.4, sz);
    post.castShadow = true;
    group.add(post);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.24), signMat);
    plate.position.set(sx, 2.6, sz);
    plate.rotation.y = Math.PI / 6;
    group.add(plate);
    const plate2 = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.24), sign2Mat);
    plate2.position.set(sx, 2.36, sz);
    plate2.rotation.y = Math.PI / 6 + Math.PI / 2;
    group.add(plate2);
  }

  return group;
}

// ---- the whole suburb ----------------------------------------------------
export function createNeighborhood() {
  const group = new THREE.Group();
  const colliders = [];
  const lots = [];
  const rng = makeRng(515);

  const variants = [
    { stucco: '#d8c4a0', dark: '180, 154, 116', shinglePalette: 'gray', doorColor: 0x37465a, garageRight: true },
    { stucco: '#cdb592', dark: '168, 140, 102', shinglePalette: 'brown', doorColor: 0x5a3322, garageRight: false },
    { stucco: '#ddd2b8', dark: '190, 172, 138', shinglePalette: 'tan', doorColor: 0x4a5d3a, garageRight: true },
    { stucco: '#c8b89a', dark: '160, 142, 110', shinglePalette: 'gray', doorColor: 0x6e2a1e, garageRight: false },
    { stucco: '#e2d6bc', dark: '196, 178, 142', shinglePalette: 'brown', doorColor: 0x32404e, garageRight: true }
  ];

  // south row (same side as Walter's, front faces +z toward the street)
  const southX = [-150, -100, -50, 50, 100];
  southX.forEach((hx, i) => {
    const h = ranchHouse(rng, variants[i % variants.length]);
    h.position.set(hx, 0, RES_ROAD_Z - 25);
    group.add(h);
    const hw = h.userData.halfW, hd = h.userData.halfD;
    colliders.push(new THREE.Box3(
      new THREE.Vector3(hx - hw, 0, RES_ROAD_Z - 25 - hd),
      new THREE.Vector3(hx + hw, 4, RES_ROAD_Z - 25 + hd)
    ));
    lots.push({ x: hx, z: RES_ROAD_Z - 25, halfW: hw + 3, halfD: hd + 8 });
  });

  // north row (front faces -z, between the lane and Central Ave)
  const northX = [-125, -75, 45, 95]; // gap at x≈0 is Walter's lot
  northX.forEach((hx, i) => {
    const h = ranchHouse(rng, variants[(i + 2) % variants.length]);
    h.position.set(hx, 0, RES_ROAD_Z + 25);
    h.rotation.y = Math.PI;
    group.add(h);
    const hw = h.userData.halfW, hd = h.userData.halfD;
    colliders.push(new THREE.Box3(
      new THREE.Vector3(hx - hw, 0, RES_ROAD_Z + 25 - hd),
      new THREE.Vector3(hx + hw, 4, RES_ROAD_Z + 25 + hd)
    ));
    lots.push({ x: hx, z: RES_ROAD_Z + 25, halfW: hw + 3, halfD: hd + 8 });
  });

  // Jesse's house at the west end of the lane
  const jx = -185, jz = RES_ROAD_Z - 26;
  const jesse = jesseHouse();
  jesse.position.set(jx, 0, jz);
  group.add(jesse);
  colliders.push(new THREE.Box3(
    new THREE.Vector3(jx - 7, 0, jz - 5.6),
    new THREE.Vector3(jx + 7, 7, jz + 5.6)
  ));
  lots.push({ x: jx, z: jz, halfW: 9, halfD: 13 });

  // Hank & Marie's at the east end
  const sx = 145, sz = RES_ROAD_Z - 26;
  const schrader = schraderHouse();
  schrader.position.set(sx, 0, sz);
  group.add(schrader);
  colliders.push(new THREE.Box3(
    new THREE.Vector3(sx - 8, 0, sz - 5.2),
    new THREE.Vector3(sx + 8, 5, sz + 5.2)
  ));
  lots.push({ x: sx, z: sz, halfW: 11, halfD: 13 });

  // Walter's lot (house built separately) so trees keep clear of it
  lots.push({ x: 0, z: -35, halfW: 18, halfD: 26 });

  group.add(createTrees(lots));
  group.add(createStreetFurniture());

  return { group, colliders };
}
