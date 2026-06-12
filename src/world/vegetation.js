// Instanced desert dressing: saguaro cacti, rocks, dry brush and a few
// tumbleweeds that roll with the wind. Instancing keeps this to a handful
// of draw calls regardless of object count.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRng } from '../utils/noise.js';
import { groundHeight, isReservedArea, WORLD_RADIUS } from './terrain.js';

const SCATTER_RADIUS = 620; // keep props inside the fog-visible bubble

function scatterTransforms(rng, count, { minScale, maxScale, sink = 0 }) {
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 30) {
    const a = rng() * Math.PI * 2;
    const r = 30 + Math.sqrt(rng()) * SCATTER_RADIUS;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (isReservedArea(x, z)) continue;
    out.push({
      x, z,
      y: groundHeight(x, z) - sink,
      rot: rng() * Math.PI * 2,
      scale: minScale + rng() * (maxScale - minScale)
    });
  }
  return out;
}

function buildInstanced(geo, mat, transforms, { castShadow = true, tint = null, rng = null } = {}) {
  const mesh = new THREE.InstancedMesh(geo, mat, transforms.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const color = new THREE.Color();

  transforms.forEach((t, i) => {
    q.setFromAxisAngle(up, t.rot);
    p.set(t.x, t.y, t.z);
    s.setScalar(t.scale);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    if (tint) {
      color.setHex(tint[Math.floor(rng() * tint.length)]);
      mesh.setColorAt(i, color);
    }
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = false;
  return mesh;
}

function saguaroGeometry() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.26, 0.34, 4.2, 8);
  trunk.translate(0, 2.1, 0);
  parts.push(trunk);

  // arm = quarter-torus elbow leaving the trunk sideways, then a vertical limb
  const addArm = (side, baseY, armH) => {
    const elbow = new THREE.TorusGeometry(0.55, 0.17, 6, 8, Math.PI / 2);
    elbow.rotateZ(side > 0 ? -Math.PI / 2 : Math.PI);
    elbow.translate(0, baseY + 0.55, 0);
    parts.push(elbow);
    const arm = new THREE.CylinderGeometry(0.15, 0.17, armH, 7);
    arm.translate(side * 0.55, baseY + 0.55 + armH / 2, 0);
    parts.push(arm);
    const tip = new THREE.SphereGeometry(0.15, 7, 5);
    tip.translate(side * 0.55, baseY + 0.55 + armH, 0);
    parts.push(tip);
  };
  addArm(1, 2.4, 1.5);
  addArm(-1, 1.8, 1.1);

  const top = new THREE.SphereGeometry(0.26, 8, 6);
  top.translate(0, 4.2, 0);
  parts.push(top);

  return mergeGeometries(parts);
}

function rockGeometry() {
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const pos = geo.attributes.position;
  const rng = makeRng(404);
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) * (0.75 + rng() * 0.5),
      pos.getY(i) * (0.55 + rng() * 0.4),
      pos.getZ(i) * (0.75 + rng() * 0.5)
    );
  }
  geo.computeVertexNormals();
  return geo;
}

function brushGeometry() {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  const rng = makeRng(405);
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) * (0.8 + rng() * 0.5),
      pos.getY(i) * (0.45 + rng() * 0.25),
      pos.getZ(i) * (0.8 + rng() * 0.5)
    );
  }
  geo.computeVertexNormals();
  return geo;
}

export function createVegetation() {
  const group = new THREE.Group();
  const rng = makeRng(31337);

  const cactusMat = new THREE.MeshStandardMaterial({ color: 0x5d7d4b, roughness: 0.9 });
  group.add(buildInstanced(
    saguaroGeometry(), cactusMat,
    scatterTransforms(rng, 170, { minScale: 0.55, maxScale: 1.5 })
  ));

  const rockMat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
  group.add(buildInstanced(
    rockGeometry(), rockMat,
    scatterTransforms(rng, 400, { minScale: 0.25, maxScale: 2.4, sink: 0.25 }),
    { tint: [0x8d7257, 0xa08566, 0x77614c, 0xb59a78], rng }
  ));

  const brushMat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
  const brush = buildInstanced(
    brushGeometry(), brushMat,
    scatterTransforms(rng, 900, { minScale: 0.3, maxScale: 1.1, sink: 0.1 }),
    { castShadow: false, tint: [0x9a8a55, 0x7c8a4e, 0xb09f6a, 0x6f7d46], rng }
  );
  group.add(brush);

  return group;
}

export function createTumbleweeds() {
  const group = new THREE.Group();
  const rng = makeRng(606);
  const geo = new THREE.IcosahedronGeometry(0.55, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x9c7e4e,
    roughness: 1,
    wireframe: true
  });

  const weeds = [];
  for (let i = 0; i < 4; i++) {
    const weed = new THREE.Mesh(geo, mat);
    weed.position.set((rng() - 0.5) * 300, 0, (rng() - 0.5) * 300);
    weed.userData.dir = new THREE.Vector3(0.8, 0, 0.25).normalize();
    weed.userData.speed = 3.5 + rng() * 3;
    group.add(weed);
    weeds.push(weed);
  }

  group.userData.update = (dt, playerPos) => {
    for (const w of weeds) {
      const v = w.userData.speed;
      w.position.addScaledVector(w.userData.dir, v * dt);
      w.position.y = groundHeight(w.position.x, w.position.z) + 0.5
        + Math.abs(Math.sin(performance.now() * 0.004 + w.id)) * 0.35;
      w.rotation.z -= (v / 0.55) * dt;
      // recycle weeds that wander too far from the player
      if (w.position.distanceTo(playerPos) > 260) {
        w.position.set(
          playerPos.x - w.userData.dir.x * 200 + (Math.random() - 0.5) * 120,
          0,
          playerPos.z - w.userData.dir.z * 200 + (Math.random() - 0.5) * 120
        );
      }
    }
  };
  return group;
}
