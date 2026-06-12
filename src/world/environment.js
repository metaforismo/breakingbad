// Sky dome, sunlight, drifting clouds and the hazy mesas on the horizon.

import * as THREE from 'three';
import { makeRng } from '../utils/noise.js';
import { cloudTexture, sunTexture } from '../utils/textures.js';
import { WORLD_RADIUS } from './terrain.js';

// afternoon sun from the south-east so the street-facing facades are lit
export const SUN_DIR = new THREE.Vector3(0.55, 0.6, -0.42).normalize();
export const FOG_COLOR = 0xe9cfa5;

export function createSky() {
  const group = new THREE.Group();

  const skyGeo = new THREE.SphereGeometry(WORLD_RADIUS * 1.6, 32, 18);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x4f8ad0) },
      midColor: { value: new THREE.Color(FOG_COLOR) },
      botColor: { value: new THREE.Color(0xcfa46e) },
      sunDir: { value: SUN_DIR.clone() }
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 botColor;
      uniform vec3 sunDir;
      void main() {
        float h = vDir.y;
        vec3 col = h > 0.0
          ? mix(midColor, topColor, pow(h, 0.55))
          : mix(midColor, botColor, pow(-h, 0.7));
        float sunAmt = pow(max(dot(vDir, sunDir), 0.0), 24.0);
        col += vec3(1.0, 0.78, 0.5) * sunAmt * 0.4;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  group.add(sky);

  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTexture(),
    transparent: true,
    depthWrite: false,
    fog: false
  }));
  sun.position.copy(SUN_DIR).multiplyScalar(WORLD_RADIUS * 1.45);
  sun.scale.setScalar(380);
  group.add(sun);

  return group;
}

export function createLights() {
  const group = new THREE.Group();

  const sun = new THREE.DirectionalLight(0xfff0d6, 3.4);
  sun.position.copy(SUN_DIR).multiplyScalar(160);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const ext = 78; // tight ortho box that follows the player
  sun.shadow.camera.left = -ext;
  sun.shadow.camera.right = ext;
  sun.shadow.camera.top = ext;
  sun.shadow.camera.bottom = -ext;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 420;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.3;
  group.add(sun);
  group.add(sun.target);

  const hemi = new THREE.HemisphereLight(0xbcd2ee, 0xcfa771, 0.75);
  group.add(hemi);

  return { group, sun };
}

/** Keep the shadow box centered on the player without shimmer. */
export function updateShadowTarget(sun, focus) {
  const snap = 4;
  const x = Math.round(focus.x / snap) * snap;
  const z = Math.round(focus.z / snap) * snap;
  sun.position.set(x + SUN_DIR.x * 160, SUN_DIR.y * 160, z + SUN_DIR.z * 160);
  sun.target.position.set(x, 0, z);
  sun.target.updateMatrixWorld();
}

export function createClouds() {
  const rng = makeRng(2026);
  const group = new THREE.Group();
  const tex = cloudTexture();
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45 + rng() * 0.3,
      fog: false
    });
    const c = new THREE.Sprite(mat);
    const a = rng() * Math.PI * 2;
    const r = 400 + rng() * 1000;
    c.position.set(Math.cos(a) * r, 240 + rng() * 200, Math.sin(a) * r);
    c.scale.set(300 + rng() * 320, 100 + rng() * 90, 1);
    c.userData.speed = 1.2 + rng() * 1.6;
    group.add(c);
    clouds.push(c);
  }
  group.userData.update = (dt) => {
    for (const c of clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > WORLD_RADIUS * 1.4) c.position.x = -WORLD_RADIUS * 1.4;
    }
  };
  return group;
}

export function createMesas() {
  const rng = makeRng(777);
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xa37a55,
    roughness: 1,
    flatShading: true
  });

  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + rng() * 0.5;
    const dist = 1050 + rng() * 250;
    const radius = 110 + rng() * 160;
    const height = 32 + rng() * 42; // low and flat-topped, true mesa profile
    const geo = new THREE.CylinderGeometry(radius * (0.6 + rng() * 0.25), radius, height, 8, 2);
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      // ragged silhouette
      const jx = (rng() - 0.5) * radius * 0.3;
      const jz = (rng() - 0.5) * radius * 0.3;
      if (Math.abs(pos.getY(v)) < height * 0.49) {
        pos.setX(v, pos.getX(v) + jx);
        pos.setZ(v, pos.getZ(v) + jz);
      }
    }
    geo.computeVertexNormals();
    const mesa = new THREE.Mesh(geo, mat);
    mesa.position.set(Math.cos(a) * dist, height * 0.32, Math.sin(a) * dist);
    mesa.rotation.y = rng() * Math.PI;
    group.add(mesa);
  }
  return group;
}
