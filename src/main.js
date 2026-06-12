import * as THREE from 'three';
import {
  createTerrain, createRoad, groundHeight, RV_SITE
} from './world/terrain.js';
import {
  createSky, createLights, createClouds, createMesas,
  updateShadowTarget, FOG_COLOR
} from './world/environment.js';
import { createVegetation, createTumbleweeds } from './world/vegetation.js';
import { createHouse } from './objects/house.js';
import { createRV, createCampsite } from './objects/rv.js';
import { Player, keys } from './player/player.js';
import { Vehicle } from './player/vehicle.js';

// ---- renderer ------------------------------------------------------------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); // 60fps headroom on hidpi
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(FOG_COLOR, 240, 1250);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 3200);

// image-based lighting from the sky itself: gives glass, chrome and the
// pool their reflections and adds soft sky bounce everywhere
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.add(createSky());
scene.environment = pmrem.fromScene(envScene, 0.06).texture;
pmrem.dispose();

// ---- world ------------------------------------------------------------------
scene.add(createTerrain());
scene.add(createRoad());
scene.add(createSky());
scene.add(createMesas());
const clouds = createClouds();
scene.add(clouds);
const { group: lightGroup, sun } = createLights();
scene.add(lightGroup);
scene.add(createVegetation());
const tumbleweeds = createTumbleweeds();
scene.add(tumbleweeds);

const { group: houseGroup, colliders: houseColliders } = createHouse();
scene.add(houseGroup);

const rv = createRV();
rv.position.set(RV_SITE.x, 0, RV_SITE.z);
rv.rotation.y = -0.7;
scene.add(rv);
scene.add(createCampsite(RV_SITE.x, RV_SITE.z));

// ---- player & vehicle ----------------------------------------------------------
const player = new Player(camera);
const vehicle = new Vehicle(rv, houseColliders);

player.colliders = houseColliders;
player.rv = rv; // collided as an oriented box, follows the RV wherever it parks

const doorAnchor = rv.getObjectByName('doorAnchor');
const doorWorld = new THREE.Vector3();

// ---- HUD / state -----------------------------------------------------------------
const overlay = document.getElementById('overlay');
const loading = document.getElementById('loading');
const promptEl = document.getElementById('prompt');
const fpsEl = document.getElementById('fps');
const speedoEl = document.getElementById('speedo');
const crosshairEl = document.getElementById('crosshair');
loading.textContent = 'Ready.';

let mode = 'walk'; // 'walk' | 'drive'
let locked = false;

overlay.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
  overlay.classList.toggle('hidden', locked);
});
document.addEventListener('mousemove', (e) => {
  if (locked && mode === 'walk') player.onMouseMove(e.movementX, e.movementY);
});

function nearRvDoor() {
  doorAnchor.getWorldPosition(doorWorld);
  return player.position.distanceTo(doorWorld) < 3.2;
}

window.addEventListener('keydown', (e) => {
  if (e.code !== 'KeyE' || !locked) return;
  if (mode === 'walk' && nearRvDoor()) {
    mode = 'drive';
    vehicle.resetCamera();
    keys.KeyW = keys.KeyS = keys.KeyA = keys.KeyD = false;
    crosshairEl.style.display = 'none';
    speedoEl.style.display = 'block';
  } else if (mode === 'drive') {
    mode = 'walk';
    vehicle.speed = 0;
    doorAnchor.getWorldPosition(doorWorld);
    player.position.set(doorWorld.x, groundHeight(doorWorld.x, doorWorld.z), doorWorld.z);
    player.velocity.set(0, 0, 0);
    player.yaw = vehicle.heading - Math.PI / 2; // face away from the door
    player.pitch = 0;
    crosshairEl.style.display = 'block';
    speedoEl.style.display = 'none';
  }
});

// ---- resize ----------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- main loop ---------------------------------------------------------------------
const clock = new THREE.Clock();
let fpsFrames = 0;
let fpsTime = 0;
const poolWater = houseGroup.getObjectByName('poolWater');

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (locked) {
    if (mode === 'walk') {
      player.update(dt);
      promptEl.style.display = nearRvDoor() ? 'block' : 'none';
      promptEl.textContent = 'Press E to drive the RV';
    } else {
      vehicle.update(dt);
      vehicle.updateCamera(camera, dt);
      const slow = Math.abs(vehicle.speed) < 1;
      promptEl.style.display = slow ? 'block' : 'none';
      if (slow) promptEl.textContent = 'W to drive — E to step out';
      speedoEl.childNodes[0].nodeValue = vehicle.mph + ' ';
    }
  }

  const focus = mode === 'drive' ? vehicle.position : player.position;
  updateShadowTarget(sun, focus);
  clouds.userData.update(dt);
  tumbleweeds.userData.update(dt, focus);
  if (poolWater) poolWater.material.bumpMap.offset.x += dt * 0.018;

  // fps meter
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fpsEl.textContent = Math.round(fpsFrames / fpsTime) + ' fps';
    fpsFrames = 0;
    fpsTime = 0;
  }

  renderer.render(scene, camera);
}

// set the initial view before the first unlock
player.update(0);

renderer.setAnimationLoop(animate);

// debug/screenshot handle
window.__game = { camera, player, vehicle, scene, renderer };
