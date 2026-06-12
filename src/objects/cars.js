// Low-poly but well-proportioned cars. Local +z is forward. Cars with
// userData.drive set can be entered and driven; all of them block the
// player as oriented boxes. Includes the two icons: Walt's Pontiac Aztek
// and Skyler's wood-panelled Jeep Wagoneer.

import * as THREE from 'three';
import { woodPanelTexture, shadowBlobTexture } from '../utils/textures.js';

const glassMat = new THREE.MeshStandardMaterial({ color: 0x1c262e, roughness: 0.08, metalness: 0.6 });
const tireMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 1 });
const hubMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.9, roughness: 0.3 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
const chromeMat = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.95, roughness: 0.25 });

let shadowTex = null;

function box(w, h, d, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

function wheel(r, width) {
  const g = new THREE.Group();
  const tireGeo = new THREE.CylinderGeometry(r, r, width, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  g.add(tire);
  const hubGeo = new THREE.CylinderGeometry(r * 0.45, r * 0.45, width + 0.02, 10);
  hubGeo.rotateZ(Math.PI / 2);
  g.add(new THREE.Mesh(hubGeo, hubMat));
  return g;
}

/**
 * type: 'sedan' | 'suv' | 'wagon'
 */
export function createCar({
  type = 'sedan',
  color = 0x8a2e24,
  woodPanel = false,
  roofRack = false,
  drivable = false
} = {}) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.25 });

  const L = type === 'sedan' ? 4.6 : 4.8;
  const W = 1.82;
  const tall = type !== 'sedan';
  const bodyH = tall ? 0.72 : 0.6;
  const bodyY = 0.35 + bodyH / 2; // body floor clears the wheels

  // lower body
  g.add(box(W, bodyH, L, bodyMat, 0, bodyY, 0));

  // cabin / greenhouse
  const cabinH = tall ? 0.62 : 0.52;
  const cabinL = type === 'sedan' ? L * 0.52 : L * 0.62;
  const cabinZ = type === 'sedan' ? -0.25 : -0.35;
  const cabinY = bodyY + bodyH / 2 + cabinH / 2;
  const cabin = box(W - 0.28, cabinH, cabinL, glassMat, 0, cabinY, cabinZ);
  g.add(cabin);
  // pillars + roof
  g.add(box(W - 0.22, 0.07, cabinL + 0.08, bodyMat, 0, cabinY + cabinH / 2 + 0.03, cabinZ));
  for (const pz of [cabinZ - cabinL / 2, cabinZ + cabinL / 2]) {
    g.add(box(W - 0.26, cabinH, 0.09, bodyMat, 0, cabinY, pz, false));
  }
  // hood slope for sedans/suvs (front of cabin to nose)
  const hood = box(W - 0.06, 0.1, L / 2 - (cabinZ + cabinL / 2) + 0.1, bodyMat,
    0, bodyY + bodyH / 2 + 0.02, (cabinZ + cabinL / 2 + L / 2) / 2);
  hood.castShadow = false;
  g.add(hood);

  // bumpers, lights, grille
  for (const end of [-1, 1]) {
    g.add(box(W + 0.06, 0.16, 0.12, trimMat, 0, 0.42, end * (L / 2 + 0.04)));
  }
  for (const side of [-1, 1]) {
    g.add(box(0.26, 0.12, 0.05, new THREE.MeshStandardMaterial({
      color: 0xf0ecd0, roughness: 0.25, emissive: 0x444022
    }), side * (W / 2 - 0.28), bodyY + bodyH / 2 - 0.06, L / 2 + 0.01, false));
    g.add(box(0.22, 0.12, 0.05, new THREE.MeshStandardMaterial({
      color: 0x8c1f1f, roughness: 0.4, emissive: 0x250404
    }), side * (W / 2 - 0.26), bodyY + bodyH / 2 - 0.06, -L / 2 - 0.01, false));
  }
  g.add(box(W * 0.45, 0.12, 0.04, trimMat, 0, bodyY + bodyH / 2 - 0.08, L / 2 + 0.02, false));

  // side windows hint: thin dark strips on the body sides
  if (woodPanel) {
    const wood = new THREE.MeshStandardMaterial({ map: woodPanelTexture(), roughness: 0.6 });
    for (const side of [-1, 1]) {
      g.add(box(0.03, bodyH * 0.55, L * 0.82, wood, side * (W / 2 + 0.005), bodyY, -0.05, false));
    }
  }
  if (roofRack) {
    for (const side of [-0.55, 0.55]) {
      g.add(box(0.05, 0.07, cabinL * 0.85, chromeMat, side, cabinY + cabinH / 2 + 0.1, cabinZ, false));
    }
    for (const rz of [-1, 0, 1]) {
      g.add(box(1.2, 0.04, 0.05, chromeMat, 0, cabinY + cabinH / 2 + 0.09, cabinZ + rz * cabinL * 0.38, false));
    }
  }

  // wheels
  const wheels = [];
  const frontWheels = [];
  const r = 0.34;
  for (const side of [-1, 1]) {
    for (const [az, isFront] of [[L * 0.32, true], [-L * 0.32, false]]) {
      const wh = wheel(r, 0.24);
      wh.position.set(side * (W / 2 - 0.1), r, az);
      g.add(wh);
      wheels.push(wh);
      if (isFront) frontWheels.push(wh);
    }
  }

  // cheap contact shadow
  if (!shadowTex) shadowTex = shadowBlobTexture();
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(W + 1.1, L + 1.1),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.02;
  g.add(blob);

  g.userData.wheels = wheels;
  g.userData.frontWheels = frontWheels;
  g.userData.obb = { halfW: W / 2 + 0.1, halfL: L / 2 + 0.15 };

  if (drivable) {
    g.userData.drive = {
      maxFwd: 31, maxRev: 7, accel: 11, brake: 20,
      wheelbase: L * 0.64, wheelRadius: r,
      camDist: 8.5, camHeight: 3.4, lookHeight: 1.4,
      collisionHalfL: L / 2, collisionR: 1.3,
      label: 'car'
    };
    const anchor = new THREE.Object3D();
    anchor.position.set(-(W / 2 + 0.8), 1.0, 0.4); // driver door, left side
    anchor.name = 'doorAnchor';
    g.add(anchor);
  }

  return g;
}

export const carPresets = {
  aztek: () => createCar({ type: 'suv', color: 0x95a294, drivable: true }),
  wagoneer: () => createCar({ type: 'wagon', color: 0x7a1f1a, woodPanel: true, roofRack: true, drivable: true }),
  sedanRed: () => createCar({ type: 'sedan', color: 0x84352c }),
  sedanBlue: () => createCar({ type: 'sedan', color: 0x2c4a6e }),
  sedanWhite: () => createCar({ type: 'sedan', color: 0xd8d4c8 }),
  sedanGold: () => createCar({ type: 'sedan', color: 0xa08a50 }),
  suvBlack: () => createCar({ type: 'suv', color: 0x222426 })
};
