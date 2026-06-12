// Desert terrain. A single analytic height function drives the rendered mesh,
// player/vehicle physics, and object placement so everything stays glued to
// the ground. Flat "pads" are blended in around the house, the road and the
// RV cook site.

import * as THREE from 'three';
import { fbm, smoothstep } from '../utils/noise.js';
import { sandTexture, sandBumpTexture, asphaltTexture } from '../utils/textures.js';

export const WORLD_RADIUS = 950;
export const ROAD_Z = 18;
export const ROAD_HALF_WIDTH = 4.5;
export const HOUSE_CENTER = { x: 2, z: -8 };
export const RV_SITE = { x: 86, z: -150 };

function rawHeight(x, z) {
  let h = fbm(x * 0.0032, z * 0.0032, 4) * 17; // broad dune swells
  h += fbm(x * 0.015 + 31.7, z * 0.015 + 11.3, 3) * 2.6; // medium humps
  h += fbm(x * 0.085 + 5.2, z * 0.085 + 9.7, 2) * 0.32; // wind ripples
  return h;
}

// 1 = untouched dunes, 0 = flattened to street level.
function flattenFactor(x, z) {
  const dRoad = Math.max(Math.abs(z - ROAD_Z) - 7, 0);
  const tRoad = smoothstep(0, 34, dRoad);

  const dx = Math.max(Math.abs(x - HOUSE_CENTER.x) - 40, 0);
  const dz = Math.max(Math.abs(z - HOUSE_CENTER.z) - 34, 0);
  const tPad = smoothstep(0, 36, Math.hypot(dx, dz));

  const dCamp = Math.max(Math.hypot(x - RV_SITE.x, z - RV_SITE.z) - 20, 0);
  const tCamp = smoothstep(0, 30, dCamp);

  return Math.min(tRoad, tPad, tCamp);
}

export function groundHeight(x, z) {
  return rawHeight(x, z) * flattenFactor(x, z);
}

/** True if this spot must stay clear of scattered props. */
export function isReservedArea(x, z) {
  if (Math.abs(z - ROAD_Z) < 13) return true;
  if (Math.abs(x - HOUSE_CENTER.x) < 44 && Math.abs(z - HOUSE_CENTER.z) < 38) return true;
  if (Math.hypot(x - RV_SITE.x, z - RV_SITE.z) < 26) return true;
  return false;
}

export function createTerrain() {
  const size = WORLD_RADIUS * 2.2;
  const segments = 300;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cLow = new THREE.Color('#c9a268');
  const cHigh = new THREE.Color('#e3c490');
  const cDark = new THREE.Color('#a8804e');
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeight(x, z);
    pos.setY(i, y);

    // tint by elevation with a little noise so the dunes read at distance
    const t = THREE.MathUtils.clamp((y + 6) / 22, 0, 1);
    tmp.lerpColors(cLow, cHigh, t);
    const n = fbm(x * 0.01 + 99, z * 0.01 - 47, 2) * 0.5 + 0.5;
    tmp.lerp(cDark, n * 0.25);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: sandTexture(),
    bumpMap: sandBumpTexture(),
    bumpScale: 0.6,
    vertexColors: true,
    roughness: 1.0,
    metalness: 0.0
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}

export function createRoad() {
  const length = WORLD_RADIUS * 2.2;
  const geo = new THREE.PlaneGeometry(ROAD_HALF_WIDTH * 2, length, 1, 64);
  geo.rotateX(-Math.PI / 2);
  geo.rotateY(Math.PI / 2); // run along the x axis

  const mat = new THREE.MeshStandardMaterial({
    map: asphaltTexture(),
    roughness: 0.95,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0.04, ROAD_Z);
  mesh.receiveShadow = true;
  mesh.name = 'road';
  return mesh;
}
