// World terrain and zoning. One analytic height function drives the rendered
// mesh, physics and object placement. The map has three zones:
//   - the town (suburb + commercial strip) on a flat pad around the origin
//   - open desert dunes everywhere else
//   - the RV cook site far out southwest, reached by a dirt track
// Roads are flat decal strips laid over flattened bands of terrain.

import * as THREE from 'three';
import { fbm, smoothstep } from '../utils/noise.js';
import {
  sandTexture, sandBumpTexture, asphaltTexture, dirtRoadTexture, concreteTexture
} from '../utils/textures.js';

export const WORLD_RADIUS = 1400;

// main commercial road (Central Ave) runs along x
export const MAIN_ROAD_Z = 18;
export const MAIN_ROAD_HALF = 5;
// residential street (Negra Arroyo Lane) runs along x
export const RES_ROAD_Z = -60;
export const RES_ROAD_HALF = 3.6;
export const RES_ROAD_X_MIN = -210;
export const RES_ROAD_X_MAX = 150;
// connector street between the two, runs along z
export const CONN_ROAD_X = 130;
// dirt track to the cook site, runs along z
export const DIRT_ROAD_X = -500;
export const RV_SITE = { x: -500, z: -460 };

// flat town pad
export const TOWN = { minX: -270, maxX: 580, minZ: -170, maxZ: 130 };

function rawHeight(x, z) {
  let h = fbm(x * 0.0032, z * 0.0032, 4) * 17; // broad dune swells
  h += fbm(x * 0.015 + 31.7, z * 0.015 + 11.3, 3) * 2.6; // medium humps
  h += fbm(x * 0.085 + 5.2, z * 0.085 + 9.7, 2) * 0.32; // wind ripples
  return h;
}

// 1 = untouched dunes, 0 = flattened to street level
function flattenFactor(x, z) {
  // town pad
  const dx = Math.max(TOWN.minX - x, x - TOWN.maxX, 0);
  const dz = Math.max(TOWN.minZ - z, z - TOWN.maxZ, 0);
  const tTown = smoothstep(0, 70, Math.hypot(dx, dz));

  // main road continues out of town to the horizon
  const tMain = smoothstep(0, 40, Math.max(Math.abs(z - MAIN_ROAD_Z) - 9, 0));

  // dirt track down to the cook site
  let tDirt = 1;
  if (z < MAIN_ROAD_Z && z > RV_SITE.z - 20) {
    tDirt = smoothstep(0, 30, Math.max(Math.abs(x - DIRT_ROAD_X) - 7, 0));
  }

  // the cook site itself
  const tCamp = smoothstep(0, 34, Math.max(Math.hypot(x - RV_SITE.x, z - RV_SITE.z) - 24, 0));

  return Math.min(tTown, tMain, tDirt, tCamp);
}

export function groundHeight(x, z) {
  return rawHeight(x, z) * flattenFactor(x, z);
}

export function inTown(x, z) {
  return x > TOWN.minX && x < TOWN.maxX && z > TOWN.minZ && z < TOWN.maxZ;
}

/** Spots that must stay clear of scattered desert props. */
export function isReservedArea(x, z) {
  if (inTown(x, z)) return true;
  if (Math.abs(z - MAIN_ROAD_Z) < 16) return true;
  if (z < MAIN_ROAD_Z && z > RV_SITE.z - 30 && Math.abs(x - DIRT_ROAD_X) < 16) return true;
  if (Math.hypot(x - RV_SITE.x, z - RV_SITE.z) < 32) return true;
  return false;
}

export function createTerrain() {
  const size = WORLD_RADIUS * 2.15;
  const segments = 360;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cLow = new THREE.Color('#c9a268');
  const cHigh = new THREE.Color('#e3c490');
  const cDark = new THREE.Color('#a8804e');
  const cTown = new THREE.Color('#b3a079'); // packed dirt / dry grass
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeight(x, z);
    pos.setY(i, y);

    const t = THREE.MathUtils.clamp((y + 6) / 22, 0, 1);
    tmp.lerpColors(cLow, cHigh, t);
    const n = fbm(x * 0.01 + 99, z * 0.01 - 47, 2) * 0.5 + 0.5;
    tmp.lerp(cDark, n * 0.25);

    // blend toward packed dirt inside the town pad
    const dx = Math.max(TOWN.minX - x, x - TOWN.maxX, 0);
    const dz = Math.max(TOWN.minZ - z, z - TOWN.maxZ, 0);
    const townBlend = 1 - smoothstep(0, 90, Math.hypot(dx, dz));
    tmp.lerp(cTown, townBlend * 0.7);

    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: sandTexture(),
    bumpMap: sandBumpTexture(),
    bumpScale: 0.5,
    vertexColors: true,
    roughness: 1.0,
    metalness: 0.0
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}

function flatStrip(width, length, material, alongX = true) {
  const geo = new THREE.PlaneGeometry(width, length, 1, Math.ceil(length / 30));
  geo.rotateX(-Math.PI / 2);
  if (alongX) geo.rotateY(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

export function createRoads() {
  const group = new THREE.Group();

  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTexture([1, 220]),
    roughness: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  const plainAsphaltMat = new THREE.MeshStandardMaterial({
    map: asphaltTexture([1, 30], false),
    roughness: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  const dirtMat = new THREE.MeshStandardMaterial({
    map: dirtRoadTexture(),
    roughness: 1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: concreteTexture([1.4, 40]),
    roughness: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3
  });

  // Central Avenue
  const main = flatStrip(MAIN_ROAD_HALF * 2, WORLD_RADIUS * 2.15, roadMat);
  main.position.set(0, 0.04, MAIN_ROAD_Z);
  group.add(main);

  // Negra Arroyo Lane
  const resLen = RES_ROAD_X_MAX - RES_ROAD_X_MIN;
  const res = flatStrip(RES_ROAD_HALF * 2, resLen, plainAsphaltMat);
  res.position.set((RES_ROAD_X_MIN + RES_ROAD_X_MAX) / 2, 0.04, RES_ROAD_Z);
  group.add(res);

  // sidewalks on both sides of the lane
  for (const side of [-1, 1]) {
    const sw = flatStrip(1.6, resLen, sidewalkMat);
    sw.position.set((RES_ROAD_X_MIN + RES_ROAD_X_MAX) / 2, 0.06, RES_ROAD_Z + side * (RES_ROAD_HALF + 1.0));
    group.add(sw);
  }

  // connector street
  const conn = flatStrip(RES_ROAD_HALF * 2, MAIN_ROAD_Z - RES_ROAD_Z, plainAsphaltMat, false);
  conn.position.set(CONN_ROAD_X, 0.035, (MAIN_ROAD_Z + RES_ROAD_Z) / 2);
  group.add(conn);

  // dirt track out to the cook site
  const dirtLen = MAIN_ROAD_Z - (RV_SITE.z - 10);
  const dirt = flatStrip(6.5, dirtLen, dirtMat, false);
  dirt.position.set(DIRT_ROAD_X, 0.03, (MAIN_ROAD_Z + RV_SITE.z - 10) / 2);
  group.add(dirt);

  return group;
}
