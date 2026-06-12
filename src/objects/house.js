// 308 Negra Arroyo Lane — a single-story ranch house: tan stucco, hipped
// shingle roofs, attached garage, driveway, backyard pool behind a block
// wall... and the pizza on the roof. Returns the mesh group plus a list of
// world-space AABB colliders for the player/vehicle.

import * as THREE from 'three';
import {
  stuccoTexture, stuccoBumpTexture, shingleTexture, brickTexture,
  concreteTexture, garageDoorTexture, pizzaTexture, waterBumpTexture
} from '../utils/textures.js';

// ---- shared materials -------------------------------------------------
const stuccoMat = new THREE.MeshStandardMaterial({
  map: stuccoTexture(), bumpMap: stuccoBumpTexture(), bumpScale: 0.4, roughness: 0.95
});
const shingleMat = new THREE.MeshStandardMaterial({ map: shingleTexture(), roughness: 0.9 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.7 });
const brickMat = new THREE.MeshStandardMaterial({ map: brickTexture(), roughness: 0.95 });
const concreteMat = new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.9 });
const glassMat = new THREE.MeshStandardMaterial({
  color: 0x2a3d4a, roughness: 0.08, metalness: 0.7
});
const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1c, roughness: 0.7 });
const blockWallMat = new THREE.MeshStandardMaterial({ color: 0xc7b694, roughness: 1 });

function box(w, h, d, mat, x, y, z, { shadow = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

// ---- hipped roof built from raw triangles ------------------------------
function hipRoof(w, d, h) {
  const hw = w / 2, hd = d / 2;
  const rl = Math.max(w - d, 1) / 2; // ridge half-length, runs along x
  const A = [-hw, 0, -hd], B = [hw, 0, -hd], C = [hw, 0, hd], D = [-hw, 0, hd];
  const R1 = [-rl, h, 0], R2 = [rl, h, 0];

  const tris = [
    [D, C, R2], [D, R2, R1], // front slope (+z)
    [B, A, R1], [B, R1, R2], // back slope (-z)
    [A, D, R1],              // left hip
    [C, B, R2],              // right hip
    [A, B, C], [A, C, D]     // underside (eaves soffit)
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
  const mesh = new THREE.Mesh(geo, shingleMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ---- window with white frame, sill and tinted glass --------------------
function makeWindow(w, h, divided = true) {
  const g = new THREE.Group();
  const t = 0.08, depth = 0.1;
  g.add(box(w, t, depth, trimMat, 0, h / 2 - t / 2, 0));
  g.add(box(w, t, depth, trimMat, 0, -h / 2 + t / 2, 0));
  g.add(box(t, h, depth, trimMat, -w / 2 + t / 2, 0, 0));
  g.add(box(t, h, depth, trimMat, w / 2 - t / 2, 0, 0));
  if (divided) g.add(box(t * 0.8, h, depth * 0.8, trimMat, 0, 0, 0));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - t, h - t), glassMat);
  glass.position.z = -0.01;
  g.add(glass);
  const sill = box(w + 0.16, 0.09, 0.16, trimMat, 0, -h / 2 - 0.04, 0.04);
  g.add(sill);
  return g;
}

function numbersTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3a2c20';
  ctx.font = 'bold 44px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('308', 64, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createHouse() {
  const g = new THREE.Group();
  const colliders = [];

  const addCollider = (minX, minZ, maxX, maxZ, h = 4) => {
    colliders.push(new THREE.Box3(
      new THREE.Vector3(minX, 0, minZ),
      new THREE.Vector3(maxX, h, maxZ)
    ));
  };

  // ---- main volume + garage ------------------------------------------
  const main = box(18, 3.1, 10, stuccoMat, -3, 1.55, -3);
  g.add(main);
  addCollider(-12, -8, 6, 2);

  const garage = box(6.5, 2.9, 8.5, stuccoMat, 9.25, 1.45, -2.25);
  g.add(garage);
  addCollider(6, -6.5, 12.5, 2);

  // ---- roofs ------------------------------------------------------------
  const mainRoof = hipRoof(19.4, 11.4, 1.8);
  mainRoof.position.set(-3, 3.1, -3);
  g.add(mainRoof);
  const garageRoof = hipRoof(7.9, 9.9, 1.3);
  garageRoof.position.set(9.25, 2.9, -2.25);
  g.add(garageRoof);

  // fascia trim under the eaves
  g.add(box(19.5, 0.18, 11.5, trimMat, -3, 3.06, -3, { shadow: false }));
  g.add(box(8.0, 0.18, 10.0, trimMat, 9.25, 2.86, -2.25, { shadow: false }));

  // ---- chimney ----------------------------------------------------------
  const chimney = box(0.9, 2.6, 0.9, brickMat, -9.5, 4.0, -3.5);
  g.add(chimney);
  g.add(box(1.1, 0.18, 1.1, concreteMat, -9.5, 5.35, -3.5));

  // ---- front entry: recessed door under a small canopy -------------------
  const door = box(1.1, 2.15, 0.08, darkWoodMat, -1, 1.075, 2.06);
  g.add(door);
  g.add(box(0.09, 0.09, 0.12, new THREE.MeshStandardMaterial({
    color: 0xb8a268, metalness: 0.9, roughness: 0.3
  }), -0.6, 1.0, 2.12)); // handle
  g.add(box(1.5, 0.16, 0.2, trimMat, -1, 2.28, 2.1)); // header
  g.add(box(0.12, 2.3, 0.14, trimMat, -1.72, 1.15, 2.08));
  g.add(box(0.12, 2.3, 0.14, trimMat, -0.28, 1.15, 2.08));
  // canopy
  g.add(box(2.6, 0.14, 1.6, shingleMat, -1, 2.62, 2.7));
  g.add(box(0.14, 2.55, 0.14, trimMat, -2.1, 1.28, 3.3));
  g.add(box(0.14, 2.55, 0.14, trimMat, 0.1, 1.28, 3.3));
  // step + brick planter beside the entry
  g.add(box(2.2, 0.16, 1.4, concreteMat, -1, 0.08, 2.8));
  const planter = box(2.6, 0.55, 0.8, brickMat, -3.6, 0.275, 2.5);
  g.add(planter);

  // house numbers next to the door
  const numbers = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.31),
    new THREE.MeshStandardMaterial({ map: numbersTexture(), transparent: true })
  );
  numbers.position.set(-2.3, 1.85, 2.06);
  g.add(numbers);

  // ---- windows -----------------------------------------------------------
  const FRONT_Z = 2.06;
  const livingWin = makeWindow(2.8, 1.5);
  livingWin.position.set(-8, 1.7, FRONT_Z);
  g.add(livingWin);
  const bedWin = makeWindow(1.9, 1.3);
  bedWin.position.set(3, 1.75, FRONT_Z);
  g.add(bedWin);
  const garageWin = makeWindow(1.3, 0.9, false);
  garageWin.position.set(9.25, 1.9, -6.44);
  garageWin.rotation.y = Math.PI;
  g.add(garageWin);

  const leftWin1 = makeWindow(1.6, 1.2);
  leftWin1.position.set(-12.06, 1.7, -1.5);
  leftWin1.rotation.y = -Math.PI / 2;
  g.add(leftWin1);
  const leftWin2 = makeWindow(1.6, 1.2);
  leftWin2.position.set(-12.06, 1.7, -5);
  leftWin2.rotation.y = -Math.PI / 2;
  g.add(leftWin2);

  const backWin1 = makeWindow(1.9, 1.3);
  backWin1.position.set(-8, 1.7, -8.06);
  backWin1.rotation.y = Math.PI;
  g.add(backWin1);
  // sliding glass door to the backyard
  const slider = makeWindow(2.6, 2.05);
  slider.position.set(-2, 1.12, -8.06);
  slider.rotation.y = Math.PI;
  g.add(slider);

  // ---- garage door --------------------------------------------------------
  const gDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(4.9, 2.2),
    new THREE.MeshStandardMaterial({ map: garageDoorTexture(), roughness: 0.7 })
  );
  gDoor.position.set(9.25, 1.15, 2.06);
  gDoor.receiveShadow = true;
  g.add(gDoor);
  g.add(box(5.4, 0.18, 0.16, trimMat, 9.25, 2.36, 2.1));
  g.add(box(0.22, 2.4, 0.16, trimMat, 6.6, 1.2, 2.1));
  g.add(box(0.22, 2.4, 0.16, trimMat, 11.9, 1.2, 2.1));

  // ---- driveway + walkway + curb ------------------------------------------
  const driveway = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 11.5), concreteMat.clone());
  driveway.material.polygonOffset = true;
  driveway.material.polygonOffsetFactor = -2;
  driveway.rotation.x = -Math.PI / 2;
  driveway.position.set(9.25, 0.05, 7.85);
  driveway.receiveShadow = true;
  g.add(driveway);

  const walkway = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 11.3), concreteMat.clone());
  walkway.material.polygonOffset = true;
  walkway.material.polygonOffsetFactor = -2;
  walkway.rotation.x = -Math.PI / 2;
  walkway.position.set(-1, 0.05, 7.9);
  walkway.receiveShadow = true;
  g.add(walkway);

  // gravel front yard patches (the show house has a xeriscaped yard)
  const gravelMat = new THREE.MeshStandardMaterial({ color: 0xb59f7d, roughness: 1 });
  const gravel = new THREE.Mesh(new THREE.CircleGeometry(6.5, 24), gravelMat);
  gravel.rotation.x = -Math.PI / 2;
  gravel.position.set(-7.5, 0.03, 7.5);
  gravel.receiveShadow = true;
  g.add(gravel);

  // ---- mailbox --------------------------------------------------------------
  const mailPost = box(0.09, 1.0, 0.09, darkWoodMat, 0.6, 0.5, 12.6);
  g.add(mailPost);
  const mailBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.5, 10, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x394048, metalness: 0.6, roughness: 0.5 })
  );
  mailBox.rotation.z = Math.PI / 2;
  mailBox.position.set(0.6, 1.06, 12.6);
  mailBox.castShadow = true;
  g.add(mailBox);
  g.add(box(0.34, 0.18, 0.5, new THREE.MeshStandardMaterial({
    color: 0x394048, metalness: 0.6, roughness: 0.5
  }), 0.6, 0.97, 12.6));

  // ---- backyard: block wall + pool -----------------------------------------
  const WALL_H = 1.8;
  const wallBack = box(28.5, WALL_H, 0.25, blockWallMat, -3, WALL_H / 2, -24);
  g.add(wallBack);
  addCollider(-17.25, -24.2, 11.25, -23.8, WALL_H);
  const wallLeft = box(0.25, WALL_H, 16, blockWallMat, -17.1, WALL_H / 2, -16);
  g.add(wallLeft);
  addCollider(-17.3, -24, -16.9, -8, WALL_H);
  const wallRight = box(0.25, WALL_H, 16, blockWallMat, 11.1, WALL_H / 2, -16);
  g.add(wallRight);
  addCollider(10.9, -24, 11.3, -8, WALL_H);
  // wall caps
  g.add(box(28.7, 0.08, 0.35, trimMat, -3, WALL_H + 0.04, -24, { shadow: false }));

  // pool deck
  const deck = new THREE.Mesh(new THREE.CircleGeometry(5.4, 28), concreteMat.clone());
  deck.material.polygonOffset = true;
  deck.material.polygonOffsetFactor = -2;
  deck.geometry.scale(1.25, 1, 1);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(-2, 0.04, -16.5);
  deck.receiveShadow = true;
  g.add(deck);

  // pool basin: plaster ring + water surface
  const basin = new THREE.Mesh(
    new THREE.CylinderGeometry(4.4, 4.1, 1.4, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x9fd4e0, roughness: 0.4, side: THREE.BackSide })
  );
  basin.geometry.scale(1.25, 1, 0.75);
  basin.position.set(-2, -0.62, -16.5);
  g.add(basin);
  const poolFloor = new THREE.Mesh(
    new THREE.CircleGeometry(4.15, 28),
    new THREE.MeshStandardMaterial({ color: 0x8fc8d8, roughness: 0.5 })
  );
  poolFloor.geometry.scale(1.25, 0.75, 1);
  poolFloor.rotation.x = -Math.PI / 2;
  poolFloor.position.set(-2, -1.3, -16.5);
  g.add(poolFloor);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(4.38, 28),
    new THREE.MeshStandardMaterial({
      color: 0x2693b8,
      roughness: 0.12,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82,
      bumpMap: waterBumpTexture(),
      bumpScale: 0.6
    })
  );
  water.geometry.scale(1.25, 0.75, 1);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-2, -0.28, -16.5);
  water.name = 'poolWater';
  g.add(water);
  // coping lip
  const coping = new THREE.Mesh(
    new THREE.TorusGeometry(4.42, 0.14, 6, 36),
    concreteMat
  );
  coping.geometry.scale(1.25, 0.75, 1);
  coping.rotation.x = -Math.PI / 2;
  coping.position.set(-2, 0.08, -16.5);
  coping.receiveShadow = true;
  g.add(coping);
  // keep the player from walking on water
  addCollider(-7.6, -19.9, 3.6, -13.1, 1);

  // ---- props: AC unit, satellite dish, shrubs ------------------------------
  const ac = box(1.1, 0.9, 1.1, new THREE.MeshStandardMaterial({
    color: 0xb9bdb6, metalness: 0.4, roughness: 0.6
  }), 13.3, 0.45, -3);
  g.add(ac);

  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3),
    new THREE.MeshStandardMaterial({ color: 0xd8d8d2, roughness: 0.5, side: THREE.DoubleSide })
  );
  dish.rotation.x = -Math.PI * 0.68; // bowl tipped to face the southern sky
  dish.position.set(4.5, 4.35, -5.5);
  dish.castShadow = true;
  g.add(dish);
  g.add(box(0.06, 0.5, 0.06, trimMat, 4.5, 4.05, -5.5));

  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x4d6b3a, roughness: 1, flatShading: true });
  const shrubGeo = new THREE.IcosahedronGeometry(0.55, 1);
  for (const [sx, sz, ss] of [[-5.2, 3.4, 1], [-10.8, 3.6, 0.8], [4.8, 3.2, 0.9], [12.8, 3.6, 0.7]]) {
    const shrub = new THREE.Mesh(shrubGeo, shrubMat);
    shrub.position.set(sx, 0.3 * ss, sz);
    shrub.scale.setScalar(ss);
    shrub.castShadow = true;
    g.add(shrub);
  }

  // ---- THE pizza on the roof ------------------------------------------------
  const slope = Math.atan2(1.8, 5.7);
  const pizza = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.045, 22),
    [
      new THREE.MeshStandardMaterial({ color: 0xc98e4a, roughness: 0.9 }), // edge
      new THREE.MeshStandardMaterial({ map: pizzaTexture(), roughness: 0.85 }), // top
      new THREE.MeshStandardMaterial({ color: 0xb87f3e, roughness: 0.9 }) // bottom
    ]
  );
  pizza.position.set(-6.5, 3.81, 0.55);
  pizza.rotation.x = slope;
  pizza.castShadow = true;
  g.add(pizza);

  return { group: g, colliders };
}
