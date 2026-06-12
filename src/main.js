import * as THREE from 'three';
import { createTerrain, createRoads, groundHeight, RV_SITE, MONEY_SITE } from './world/terrain.js';
import {
  createSky, createLights, createClouds, createMesas,
  updateShadowTarget, FOG_COLOR
} from './world/environment.js';
import { createVegetation, createTumbleweeds } from './world/vegetation.js';
import { createNeighborhood } from './world/neighborhood.js';
import { createCommercialStrip } from './world/commercial.js';
import { createWhiteHouse } from './objects/house.js';
import { createRV, createCampsite, createMoneyPit } from './objects/rv.js';
import { carPresets } from './objects/cars.js';
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
scene.fog = new THREE.Fog(FOG_COLOR, 260, 1500);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 4000);

// image-based lighting from the sky itself: gives glass, chrome and the
// pool their reflections and adds soft sky bounce everywhere
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.add(createSky());
scene.environment = pmrem.fromScene(envScene, 0.04).texture;
pmrem.dispose();

// ---- world ------------------------------------------------------------------
scene.add(createTerrain());
scene.add(createRoads());
scene.add(createSky());
scene.add(createMesas());
const clouds = createClouds();
scene.add(clouds);
const { group: lightGroup, sun } = createLights();
scene.add(lightGroup);
scene.add(createVegetation());
const tumbleweeds = createTumbleweeds();
scene.add(tumbleweeds);

// the White residence: north side of the lane so the famous facade gets sun
const HOUSE = { x: 0, z: -35 };
const { group: houseGroup, colliders: houseColliders } = createWhiteHouse(HOUSE.x, HOUSE.z, true);
scene.add(houseGroup);

// suburb + commercial strip
const { group: suburb, colliders: suburbColliders } = createNeighborhood();
scene.add(suburb);
const { group: strip, colliders: stripColliders, parkedCars } = createCommercialStrip();
scene.add(strip);

const allColliders = [...houseColliders, ...suburbColliders, ...stripColliders];

// the RV at the cook site
const rv = createRV();
rv.position.set(RV_SITE.x, 0, RV_SITE.z);
rv.rotation.y = 0.55;
scene.add(rv);
scene.add(createCampsite(RV_SITE.x, RV_SITE.z));
scene.add(createMoneyPit(MONEY_SITE.x, MONEY_SITE.z, groundHeight));

// Walt's Aztek and Skyler's Wagoneer on the driveway (as in the pizza scene)
const wagoneer = carPresets.wagoneer();
wagoneer.position.set(HOUSE.x - 1.6, 0, HOUSE.z - 14);
wagoneer.rotation.y = 0.02;
scene.add(wagoneer);
const aztek = carPresets.aztek();
aztek.position.set(HOUSE.x - 4.7, 0, HOUSE.z - 16);
aztek.rotation.y = -0.02;
scene.add(aztek);

// ---- player & vehicles -----------------------------------------------------
const player = new Player(camera);
player.position.set(HOUSE.x + 2.1, 0, HOUSE.z - 17);
player.yaw = Math.PI; // face the house
player.colliders = allColliders;

const drivables = [rv, aztek, wagoneer];
const allVehicleGroups = [...drivables, ...parkedCars];
player.vehicles = allVehicleGroups;

const vehicles = new Map();
for (const g of drivables) {
  vehicles.set(g, new Vehicle(g, allColliders, allVehicleGroups));
}

// ---- HUD / state -----------------------------------------------------------------
const overlay = document.getElementById('overlay');
const loading = document.getElementById('loading');
const promptEl = document.getElementById('prompt');
const fpsEl = document.getElementById('fps');
const speedoEl = document.getElementById('speedo');
const crosshairEl = document.getElementById('crosshair');
const locationEl = document.getElementById('location');
loading.textContent = 'Ready.';

let mode = 'walk'; // 'walk' | 'drive'
let activeVehicle = null; // Vehicle instance while driving
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

const doorWorld = new THREE.Vector3();
function nearestDrivable() {
  let best = null;
  let bestDist = 3.4;
  for (const g of drivables) {
    const anchor = g.getObjectByName('doorAnchor');
    anchor.getWorldPosition(doorWorld);
    const d = player.position.distanceTo(doorWorld);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

window.addEventListener('keydown', (e) => {
  if (e.code !== 'KeyE' || !locked) return;
  if (mode === 'walk') {
    const g = nearestDrivable();
    if (!g) return;
    mode = 'drive';
    activeVehicle = vehicles.get(g);
    player.activeVehicle = g;
    activeVehicle.resetCamera();
    keys.KeyW = keys.KeyS = keys.KeyA = keys.KeyD = false;
    crosshairEl.style.display = 'none';
    speedoEl.style.display = 'block';
  } else {
    mode = 'walk';
    activeVehicle.speed = 0;
    const g = activeVehicle.group;
    g.getObjectByName('doorAnchor').getWorldPosition(doorWorld);
    player.position.set(doorWorld.x, groundHeight(doorWorld.x, doorWorld.z), doorWorld.z);
    player.velocity.set(0, 0, 0);
    player.yaw = activeVehicle.heading - Math.PI / 2;
    player.pitch = 0;
    player.activeVehicle = null;
    activeVehicle = null;
    crosshairEl.style.display = 'block';
    speedoEl.style.display = 'none';
  }
});

// ---- location label ---------------------------------------------------------------
const ZONES = [
  { x: HOUSE.x, z: HOUSE.z - 8, r: 38, label: '308 Negra Arroyo Lane' },
  { x: -185, z: -86, r: 26, label: "Jesse Pinkman's House" },
  { x: 145, z: -86, r: 26, label: 'The Schrader Residence' },
  { x: 70, z: 64, r: 42, label: 'Saul Goodman & Associates' },
  { x: 210, z: 60, r: 45, label: 'Los Pollos Hermanos' },
  { x: 355, z: 60, r: 38, label: 'A1A Car Wash' },
  { x: 480, z: 80, r: 50, label: 'Lavandería Brillante' },
  { x: -170, z: 60, r: 40, label: 'Crossroads Motel' },
  { x: -85, z: 56, r: 30, label: 'The Dog House' },
  { x: MONEY_SITE.x, z: MONEY_SITE.z, r: 30, label: 'N 34° 59\' 20" — W 106° 36\' 52"' },
  { x: RV_SITE.x, z: RV_SITE.z, r: 60, label: 'The Cook Site — Tohajiilee' }
];
function locationLabel(p) {
  for (const zn of ZONES) {
    if (Math.hypot(p.x - zn.x, p.z - zn.z) < zn.r) return zn.label;
  }
  if (Math.abs(p.z - 18) < 14 && p.x > -280 && p.x < 600) return 'Central Avenue SE';
  if (p.x > -260 && p.x < 180 && p.z > -140 && p.z < -30) return 'Negra Arroyo Lane';
  return 'Tohajiilee Desert — New Mexico';
}

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
let zoneTime = 0;
const poolWater = houseGroup.getObjectByName('poolWater');
const teddyBear = houseGroup.getObjectByName('teddyBear');
const liberty = strip.getObjectByName('liberty');

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = performance.now() * 0.001;

  if (locked) {
    if (mode === 'walk') {
      player.update(dt);
      const g = nearestDrivable();
      promptEl.style.display = g ? 'block' : 'none';
      if (g) {
        promptEl.textContent = `Press E to drive the ${g.userData.drive.label}`;
      }
    } else {
      activeVehicle.update(dt);
      activeVehicle.updateCamera(camera, dt);
      const slow = Math.abs(activeVehicle.speed) < 1;
      promptEl.style.display = slow ? 'block' : 'none';
      if (slow) promptEl.textContent = 'W to drive — E to step out';
      speedoEl.childNodes[0].nodeValue = activeVehicle.mph + ' ';
    }
  }

  const focus = mode === 'drive' ? activeVehicle.position : player.position;
  updateShadowTarget(sun, focus);
  clouds.userData.update(dt);
  tumbleweeds.userData.update(dt, focus);
  if (poolWater) poolWater.material.bumpMap.offset.x += dt * 0.018;
  if (teddyBear) {
    teddyBear.position.y = 0.12 + Math.sin(t * 0.8) * 0.015;
    teddyBear.rotation.y += dt * 0.03;
    teddyBear.rotation.z = Math.sin(t * 0.6) * 0.04;
  }
  if (liberty) liberty.rotation.z = Math.sin(t * 1.7) * 0.05; // wobbles in the wind

  zoneTime += dt;
  if (zoneTime > 0.4) {
    zoneTime = 0;
    locationEl.textContent = locationLabel(focus);
  }

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
window.__game = { camera, player, vehicles, scene, renderer };
