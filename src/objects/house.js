// 308 Negra Arroyo Lane, modelled on the screen reference: cream stucco
// ranch with red-maroon trim, brown hipped shingle roofs, the garage wing
// jutting forward with its dark brown door, river-rock front yard behind
// low hedges, backyard pool behind a block wall — pizza on the garage roof
// and the pink teddy bear floating in the pool.
// Local frame: front faces +z, the street lies at local z ≈ +25.

import * as THREE from 'three';
import {
  stuccoTexture, stuccoBumpTexture, shingleTexture, brickTexture,
  concreteTexture, garageDoorTexture, pizzaTexture, waterBumpTexture,
  riverRockTexture, foliageTexture
} from '../utils/textures.js';

// ---- shared materials -------------------------------------------------
const creamStucco = new THREE.MeshStandardMaterial({
  map: stuccoTexture('#e6dcc3', '200, 184, 148'),
  bumpMap: stuccoBumpTexture(), bumpScale: 0.35, roughness: 0.95
});
const maroonMat = new THREE.MeshStandardMaterial({ color: 0x7d3a2c, roughness: 0.8 });
const brownRoofMat = new THREE.MeshStandardMaterial({ map: shingleTexture('brown'), roughness: 0.9 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.7 });
const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x4f3a28, roughness: 0.5, metalness: 0.3 });
const brickMat = new THREE.MeshStandardMaterial({ map: brickTexture(), roughness: 0.95 });
const concreteMat = new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.9 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x2a3d4a, roughness: 0.08, metalness: 0.7 });
const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x42281a, roughness: 0.7 });
const blockWallMat = new THREE.MeshStandardMaterial({ color: 0xc7b694, roughness: 1 });
const hedgeMat = new THREE.MeshStandardMaterial({
  map: foliageTexture(), roughness: 1, flatShading: true
});

function box(w, h, d, mat, x, y, z, { shadow = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

// ---- hipped roof built from raw triangles (ridge along x) ----------------
export function hipRoof(w, d, h, mat = brownRoofMat) {
  const hw = w / 2, hd = d / 2;
  const rl = Math.max(w - d, 1) / 2;
  const A = [-hw, 0, -hd], B = [hw, 0, -hd], C = [hw, 0, hd], D = [-hw, 0, hd];
  const R1 = [-rl, h, 0], R2 = [rl, h, 0];
  const tris = [
    [D, C, R2], [D, R2, R1],
    [B, A, R1], [B, R1, R2],
    [A, D, R1],
    [C, B, R2],
    [A, B, C], [A, C, D]
  ];
  const positions = [];
  const uvs = [];
  for (const t of tris) {
    for (const v of t) {
      positions.push(v[0], v[1], v[2]);
      uvs.push(v[0] * 0.35, (v[2] + v[1]) * 0.35);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ---- window: maroon stucco surround, bronze frame, tinted glass -----------
function makeWindow(w, h, divided = true) {
  const g = new THREE.Group();
  g.add(box(w + 0.24, h + 0.24, 0.06, maroonMat, 0, 0, -0.02, { shadow: false }));
  const t = 0.07;
  g.add(box(w, t, 0.1, bronzeMat, 0, h / 2 - t / 2, 0));
  g.add(box(w, t, 0.1, bronzeMat, 0, -h / 2 + t / 2, 0));
  g.add(box(t, h, 0.1, bronzeMat, -w / 2 + t / 2, 0, 0));
  g.add(box(t, h, 0.1, bronzeMat, w / 2 - t / 2, 0, 0));
  if (divided) g.add(box(t * 0.8, h, 0.08, bronzeMat, 0, 0, 0));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - t, h - t), glassMat);
  glass.position.z = 0.01;
  g.add(glass);
  return g;
}

function hedgeRow(g, x0, x1, z, height = 0.65, depth = 0.7) {
  const len = Math.abs(x1 - x0);
  const n = Math.max(2, Math.round(len / 1.1));
  for (let i = 0; i < n; i++) {
    const hx = x0 + (i + 0.5) * (x1 - x0) / n;
    const jitter = ((i * 37) % 10) / 40;
    const hedge = box(len / n + 0.15, height + jitter, depth, hedgeMat, hx, (height + jitter) / 2 + 0.05, z);
    g.add(hedge);
  }
}

function numbersTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3a2c20';
  ctx.font = 'bold 42px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('308', 64, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWhiteHouse(ox, oz, flip = false) {
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);
  if (flip) g.rotation.y = Math.PI; // lot on the north side: front faces -z
  const colliders = [];
  const addCollider = (minX, minZ, maxX, maxZ, h = 4.5) => {
    colliders.push(flip
      ? new THREE.Box3(
        new THREE.Vector3(ox - maxX, 0, oz - maxZ),
        new THREE.Vector3(ox - minX, h, oz - minZ))
      : new THREE.Box3(
        new THREE.Vector3(ox + minX, 0, oz + minZ),
        new THREE.Vector3(ox + maxX, h, oz + maxZ))
    );
  };

  // ---- volumes: living wing left, garage jutting forward right ----------
  const living = box(13, 3.0, 10, creamStucco, -7, 1.5, -1);
  g.add(living);
  addCollider(-13.5, -6, -0.5, 4);

  const garage = box(7, 2.9, 11.5, creamStucco, 3, 1.45, 1.75);
  g.add(garage);
  addCollider(-0.5, -4, 6.5, 7.5);

  // ---- roofs (brown shingles, generous overhangs) ------------------------
  const livingRoof = hipRoof(14.6, 11.6, 2.0);
  livingRoof.position.set(-7, 3.0, -1);
  g.add(livingRoof);

  const garageRoof = hipRoof(13.1, 8.6, 1.95); // ridge runs toward the street
  garageRoof.rotation.y = Math.PI / 2;
  garageRoof.position.set(3, 2.9, 1.75);
  g.add(garageRoof);

  // cream fascia with maroon accents
  g.add(box(14.7, 0.2, 11.7, trimMat, -7, 2.96, -1, { shadow: false }));
  g.add(box(8.7, 0.2, 13.2, trimMat, 3, 2.86, 1.75, { shadow: false }));
  g.add(box(8.6, 0.26, 0.12, maroonMat, 3, 2.86, 8.32, { shadow: false })); // garage front fascia

  // ---- chimney -------------------------------------------------------------
  g.add(box(0.9, 2.8, 0.9, brickMat, -11, 4.0, -1.5));
  g.add(box(1.1, 0.16, 1.1, concreteMat, -11, 5.45, -1.5));

  // ---- entry nook between the wings ----------------------------------------
  // porch slab + flat canopy on white posts
  g.add(box(3.2, 0.14, 2.6, concreteMat, -2.1, 0.07, 5.3));
  g.add(box(3.6, 0.16, 3.0, trimMat, -2.1, 2.62, 5.4));
  g.add(box(0.14, 2.55, 0.14, trimMat, -3.7, 1.3, 6.7));
  g.add(box(0.14, 2.55, 0.14, trimMat, -0.6, 1.3, 6.7));
  // front door (set into the living wing's front wall)
  g.add(box(1.05, 2.1, 0.1, darkWoodMat, -2.1, 1.05, 4.02));
  g.add(box(1.35, 0.14, 0.16, maroonMat, -2.1, 2.2, 4.05));
  g.add(box(0.12, 2.26, 0.16, maroonMat, -2.85, 1.13, 4.05));
  g.add(box(0.12, 2.26, 0.16, maroonMat, -1.35, 1.13, 4.05));
  g.add(box(0.08, 0.08, 0.14, bronzeMat, -1.75, 1.0, 4.08));
  // porch light
  g.add(box(0.12, 0.22, 0.12, bronzeMat, -3.3, 2.0, 4.04, { shadow: false }));

  // ---- windows ----------------------------------------------------------------
  const FRONT = 4.04;
  const livingWin = makeWindow(3.0, 1.5);
  livingWin.position.set(-9.5, 1.7, FRONT);
  g.add(livingWin);
  const dinWin = makeWindow(1.8, 1.4);
  dinWin.position.set(-5.6, 1.75, FRONT);
  g.add(dinWin);

  const garageSideWin = makeWindow(1.3, 0.9, false);
  garageSideWin.position.set(6.54, 1.85, 0.5);
  garageSideWin.rotation.y = Math.PI / 2;
  g.add(garageSideWin);

  for (const wz of [-3.5, 0.8]) {
    const win = makeWindow(1.6, 1.2);
    win.position.set(-13.54, 1.7, wz);
    win.rotation.y = -Math.PI / 2;
    g.add(win);
  }
  const backWin = makeWindow(1.9, 1.3);
  backWin.position.set(-10, 1.7, -6.04);
  backWin.rotation.y = Math.PI;
  g.add(backWin);
  const slider = makeWindow(2.6, 2.05);
  slider.position.set(-4.5, 1.12, -6.04);
  slider.rotation.y = Math.PI;
  g.add(slider);

  // ---- garage door: dark brown panels, maroon surround ------------------------
  const gDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 2.3),
    new THREE.MeshStandardMaterial({ map: garageDoorTexture(), roughness: 0.75 })
  );
  gDoor.position.set(3, 1.2, 7.54);
  gDoor.receiveShadow = true;
  g.add(gDoor);
  g.add(box(5.8, 0.2, 0.16, maroonMat, 3, 2.45, 7.56));
  g.add(box(0.3, 2.5, 0.16, maroonMat, 0.15, 1.25, 7.56));
  g.add(box(0.3, 2.5, 0.16, maroonMat, 5.85, 1.25, 7.56));
  // security floodlight over the door
  g.add(box(0.3, 0.12, 0.14, bronzeMat, 3, 2.66, 7.6, { shadow: false }));

  // house numbers on the trim left of the garage door
  const numbers = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.28),
    new THREE.MeshStandardMaterial({ map: numbersTexture(), transparent: true })
  );
  numbers.position.set(0.16, 2.0, 7.65);
  g.add(numbers);

  // ---- yard: river rock, hedges, driveway, walkway ------------------------------
  const rockMat = new THREE.MeshStandardMaterial({
    map: riverRockTexture([7, 5]), roughness: 1,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const rockYard = new THREE.Mesh(new THREE.PlaneGeometry(17.5, 16.5), rockMat);
  rockYard.rotation.x = -Math.PI / 2;
  rockYard.position.set(-7.75, 0.045, 12.3);
  rockYard.receiveShadow = true;
  g.add(rockYard);

  const driveMat = new THREE.MeshStandardMaterial({
    map: concreteTexture([2.5, 5]), roughness: 0.9,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4
  });
  const driveway = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 13.7), driveMat);
  driveway.rotation.x = -Math.PI / 2;
  driveway.position.set(3.1, 0.06, 14.4);
  driveway.receiveShadow = true;
  g.add(driveway);

  const walkMat = new THREE.MeshStandardMaterial({
    map: concreteTexture([0.8, 8]), roughness: 0.9,
    polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5
  });
  const walkway = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 14.8), walkMat);
  walkway.rotation.x = -Math.PI / 2;
  walkway.position.set(-2.1, 0.07, 13.9);
  walkway.receiveShadow = true;
  g.add(walkway);

  // hedges along the front walls + tall hedge wall right of the driveway
  hedgeRow(g, -13.2, -3.8, 4.75);
  hedgeRow(g, 0.4, 5.6, 8.05, 0.55, 0.6);
  // tall hedge wall along the right edge of the driveway (as in the show)
  for (let i = 0; i < 9; i++) {
    const hz = 8.6 + i * 1.45;
    g.add(box(0.9, 1.25 + ((i * 13) % 7) / 18, 1.3, hedgeMat, 7.3, 0.68, hz));
  }
  addCollider(6.7, 8, 7.9, 21, 1.6);

  // landscape lights along the walkway
  for (const lz of [8, 11.5, 15, 18.5]) {
    g.add(box(0.08, 0.5, 0.08, bronzeMat, -2.95, 0.25, lz, { shadow: false }));
    g.add(box(0.2, 0.1, 0.2, darkWoodMat, -2.95, 0.52, lz, { shadow: false }));
  }

  // mailbox at the curb
  g.add(box(0.09, 1.0, 0.09, darkWoodMat, -3.4, 0.5, 20.6));
  const mailBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.5, 10, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x394048, metalness: 0.6, roughness: 0.5 })
  );
  mailBox.rotation.z = Math.PI / 2;
  mailBox.position.set(-3.4, 1.06, 20.6);
  mailBox.castShadow = true;
  g.add(mailBox);
  g.add(box(0.34, 0.18, 0.5, new THREE.MeshStandardMaterial({
    color: 0x394048, metalness: 0.6, roughness: 0.5
  }), -3.4, 0.97, 20.6));

  // ---- backyard: block wall, pool, deck, the bear ---------------------------------
  const WALL_H = 1.8;
  g.add(box(31, WALL_H, 0.25, blockWallMat, -1.5, WALL_H / 2, -24));
  addCollider(-17.2, -24.2, 14.2, -23.8, WALL_H);
  g.add(box(0.25, WALL_H, 18.2, blockWallMat, -16.9, WALL_H / 2, -15));
  addCollider(-17.1, -24, -16.7, -5.9, WALL_H);
  g.add(box(0.25, WALL_H, 18.2, blockWallMat, 13.9, WALL_H / 2, -15));
  addCollider(13.7, -24, 14.1, -5.9, WALL_H);
  g.add(box(31.2, 0.08, 0.35, trimMat, -1.5, WALL_H + 0.04, -24, { shadow: false }));
  g.add(box(7.6, WALL_H, 0.25, blockWallMat, 10.2, WALL_H / 2, -5.9));
  addCollider(6.5, -6.1, 14, -5.7, WALL_H);

  // patchy backyard lawn with a hole cut for the pool basin
  const yardMat = new THREE.MeshStandardMaterial({
    color: 0xb0a878, map: foliageTexture([10, 6]), roughness: 1,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });
  // shape lives in XY; after rotation.x = -PI/2, shape y maps to world -z
  const yardShape = new THREE.Shape();
  yardShape.moveTo(-16.7, 6.2);
  yardShape.lineTo(13.7, 6.2);
  yardShape.lineTo(13.7, 23.8);
  yardShape.lineTo(-16.7, 23.8);
  yardShape.closePath();
  const poolHole = new THREE.Path();
  poolHole.absellipse(-4, 15.5, 5.6, 3.25, 0, Math.PI * 2, true);
  yardShape.holes.push(poolHole);
  const yard = new THREE.Mesh(new THREE.ShapeGeometry(yardShape, 24), yardMat);
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(0, 0.03, 0);
  yard.receiveShadow = true;
  g.add(yard);

  // deck is a ring so the water shows through the middle
  const deckMat = concreteMat.clone();
  deckMat.polygonOffset = true;
  deckMat.polygonOffsetFactor = -2;
  deckMat.polygonOffsetUnits = -2;
  const deck = new THREE.Mesh(new THREE.RingGeometry(4.5, 6.6, 28), deckMat);
  deck.geometry.scale(1.25, 0.72, 1);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(-4, 0.05, -15.5);
  deck.receiveShadow = true;
  g.add(deck);

  const basin = new THREE.Mesh(
    new THREE.CylinderGeometry(4.4, 4.1, 1.4, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x9fd4e0, roughness: 0.4, side: THREE.BackSide })
  );
  basin.geometry.scale(1.25, 1, 0.72);
  basin.position.set(-4, -0.62, -15.5);
  g.add(basin);
  const poolFloor = new THREE.Mesh(
    new THREE.CircleGeometry(4.15, 28),
    new THREE.MeshStandardMaterial({ color: 0x8fc8d8, roughness: 0.5 })
  );
  poolFloor.geometry.scale(1.25, 0.72, 1);
  poolFloor.rotation.x = -Math.PI / 2;
  poolFloor.position.set(-4, -1.3, -15.5);
  g.add(poolFloor);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(4.52, 28),
    new THREE.MeshStandardMaterial({
      color: 0x2693b8, roughness: 0.1, metalness: 0.1,
      transparent: true, opacity: 0.85,
      bumpMap: waterBumpTexture(), bumpScale: 0.5
    })
  );
  water.geometry.scale(1.25, 0.72, 1);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-4, 0.04, -15.5);
  water.name = 'poolWater';
  g.add(water);
  const coping = new THREE.Mesh(new THREE.TorusGeometry(4.42, 0.14, 6, 36), concreteMat);
  coping.geometry.scale(1.25, 0.72, 1);
  coping.rotation.x = -Math.PI / 2;
  coping.position.set(-4, 0.08, -15.5);
  coping.receiveShadow = true;
  g.add(coping);
  addCollider(-9.6, -18.7, 1.6, -12.3, 1);

  // the pink teddy bear, floating face-up
  const pink = new THREE.MeshStandardMaterial({ color: 0xe48ab2, roughness: 0.95 });
  const charred = new THREE.MeshStandardMaterial({ color: 0x2e2622, roughness: 1 });
  const bear = new THREE.Group();
  const bearBody = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), pink);
  bearBody.scale.set(1, 0.75, 1.25);
  bear.add(bearBody);
  const bearHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), pink);
  bearHead.position.set(0, 0.05, 0.22);
  bear.add(bearHead);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), side > 0 ? charred : pink);
    ear.position.set(side * 0.09, 0.13, 0.26);
    bear.add(ear);
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), side > 0 ? charred : pink);
    arm.scale.set(1, 0.8, 1.6);
    arm.position.set(side * 0.17, 0.02, 0.05);
    bear.add(arm);
  }
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5),
    new THREE.MeshStandardMaterial({ color: 0x111111 }));
  eye.position.set(-0.045, 0.1, 0.32);
  bear.add(eye);
  bear.position.set(-5.5, 0.12, -14.5);
  bear.rotation.y = 0.8;
  bear.name = 'teddyBear';
  g.add(bear);

  // ---- roof props -------------------------------------------------------------------
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3),
    new THREE.MeshStandardMaterial({ color: 0xd8d8d2, roughness: 0.5, side: THREE.DoubleSide })
  );
  dish.rotation.x = -Math.PI * 0.68;
  dish.position.set(-9.5, 4.35, -3);
  dish.castShadow = true;
  g.add(dish);
  g.add(box(0.06, 0.5, 0.06, trimMat, -9.5, 4.05, -3));

  const ac = box(1.1, 0.9, 1.1, new THREE.MeshStandardMaterial({
    color: 0xb9bdb6, metalness: 0.4, roughness: 0.6
  }), 7.6, 0.45, -4.5);
  g.add(ac);

  // ---- THE pizza, on the garage roof's street-facing slope ---------------------------
  const slope = Math.atan2(1.95, 4.3);
  const pizza = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.045, 22),
    [
      new THREE.MeshStandardMaterial({ color: 0xc98e4a, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ map: pizzaTexture(), roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0xb87f3e, roughness: 0.9 })
    ]
  );
  pizza.position.set(3, 3.69, 6.6);
  pizza.rotation.x = slope;
  pizza.castShadow = true;
  g.add(pizza);

  return { group: g, colliders };
}
