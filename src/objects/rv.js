// The 1986 Fleetwood Bounder. Cream body with the brown/tan beltline
// stripes, big flat windshield, side entry door with fold-out step, roof
// AC units, rear ladder, dual rear wheels. Local +z is forward; the
// vehicle controller drives the group's position/rotation.
// Also exports the little cook-site camp dressing around the parking spot.

import * as THREE from 'three';

const creamMat = new THREE.MeshStandardMaterial({ color: 0xe9e2cf, roughness: 0.5, metalness: 0.05 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.6 });
const brownMat = new THREE.MeshStandardMaterial({ color: 0x6b4527, roughness: 0.6 });
const tanMat = new THREE.MeshStandardMaterial({ color: 0xb28e58, roughness: 0.6 });
const orangeMat = new THREE.MeshStandardMaterial({ color: 0xc56a1e, roughness: 0.6 });
const blackTrimMat = new THREE.MeshStandardMaterial({ color: 0x1d1d1d, roughness: 0.7 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x202e38, roughness: 0.06, metalness: 0.65 });
const chromeMat = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.95, roughness: 0.25 });
const tireMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 1 });
const rubberMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });

function box(w, h, d, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

function rvWindow(g, w, h, x, y, z, rotY = 0) {
  const win = new THREE.Group();
  win.add(box(w, h, 0.05, blackTrimMat, 0, 0, 0, false));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.07, h - 0.07), glassMat);
  glass.position.z = 0.03;
  win.add(glass);
  win.position.set(x, y, z);
  win.rotation.y = rotY;
  g.add(win);
}

function makeWheel(width) {
  const wheel = new THREE.Group();
  const tireGeo = new THREE.CylinderGeometry(0.43, 0.43, width, 18);
  tireGeo.rotateZ(Math.PI / 2); // axle along x
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheel.add(tire);
  const hubGeo = new THREE.CylinderGeometry(0.17, 0.17, width + 0.02, 12);
  hubGeo.rotateZ(Math.PI / 2);
  wheel.add(new THREE.Mesh(hubGeo, chromeMat));
  return wheel;
}

export function createRV() {
  const g = new THREE.Group();
  const W = 2.5, BODY_H = 2.3, L = 9;

  // chassis + body shell
  g.add(box(2.2, 0.4, 8.4, blackTrimMat, 0, 0.5, 0));
  const body = box(W, BODY_H, L, creamMat, 0, 0.7 + BODY_H / 2, 0);
  g.add(body);
  // gently domed roof cap
  const roof = box(W - 0.25, 0.14, L - 0.3, roofMat, 0, 0.7 + BODY_H + 0.07, 0);
  g.add(roof);

  // beltline stripes wrap all four sides (slightly proud boxes)
  g.add(box(W + 0.04, 0.5, L + 0.04, brownMat, 0, 1.25, 0, false));
  g.add(box(W + 0.04, 0.26, L + 0.04, tanMat, 0, 1.68, 0, false));
  g.add(box(W + 0.045, 0.06, L + 0.045, orangeMat, 0, 1.88, 0, false));

  // ---- front (cab) ------------------------------------------------------
  const FRONT = L / 2;
  // windshield: two big panes in black trim
  g.add(box(2.3, 1.05, 0.06, blackTrimMat, 0, 2.35, FRONT + 0.01, false));
  for (const side of [-1, 1]) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.94), glassMat);
    pane.position.set(side * 0.56, 2.35, FRONT + 0.05);
    g.add(pane);
  }
  // wipers
  for (const side of [-1, 1]) {
    const wiper = box(0.03, 0.55, 0.02, blackTrimMat, side * 0.55, 1.95, FRONT + 0.06, false);
    wiper.rotation.z = side * 0.5;
    g.add(wiper);
  }
  // grille, bumper, lights
  g.add(box(1.5, 0.28, 0.08, blackTrimMat, 0, 0.95, FRONT + 0.02, false));
  for (let i = 0; i < 4; i++) {
    g.add(box(1.4, 0.03, 0.1, chromeMat, 0, 0.85 + i * 0.07, FRONT + 0.02, false));
  }
  g.add(box(W + 0.1, 0.3, 0.22, chromeMat, 0, 0.5, FRONT + 0.08));
  for (const side of [-1, 1]) {
    const lightGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12);
    lightGeo.rotateX(Math.PI / 2);
    const headlight = new THREE.Mesh(lightGeo, new THREE.MeshStandardMaterial({
      color: 0xf5f1d8, roughness: 0.2, emissive: 0x55502e
    }));
    headlight.position.set(side * 0.92, 1.18, FRONT + 0.03);
    g.add(headlight);
    g.add(box(0.16, 0.1, 0.05, orangeMat, side * 1.1, 0.92, FRONT + 0.03, false));
  }
  // clearance marker lights across the top of the cab
  for (let i = -2; i <= 2; i++) {
    g.add(box(0.12, 0.06, 0.05, orangeMat, i * 0.32, 3.02, FRONT + 0.02, false));
  }
  // mirrors on swing arms
  for (const side of [-1, 1]) {
    g.add(box(0.5, 0.05, 0.05, blackTrimMat, side * (W / 2 + 0.25), 2.45, FRONT - 0.25, false));
    g.add(box(0.05, 0.42, 0.26, chromeMat, side * (W / 2 + 0.5), 2.2, FRONT - 0.25, false));
  }

  // ---- rear ---------------------------------------------------------------
  const REAR = -L / 2;
  g.add(box(W + 0.1, 0.3, 0.22, chromeMat, 0, 0.5, REAR - 0.08));
  rvWindow(g, 1.3, 0.7, 0, 2.45, REAR - 0.03, Math.PI);
  for (const side of [-1, 1]) {
    g.add(box(0.18, 0.32, 0.05, new THREE.MeshStandardMaterial({
      color: 0x8c1f1f, roughness: 0.4, emissive: 0x2a0505
    }), side * 0.95, 0.95, REAR - 0.03, false));
  }
  // rear ladder
  const ladder = new THREE.Group();
  const railGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.3, 8);
  for (const rx of [0.72, 1.04]) {
    const rail = new THREE.Mesh(railGeo, chromeMat);
    rail.position.set(rx, 1.95, REAR - 0.12);
    ladder.add(rail);
  }
  const rungGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.34, 8);
  rungGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 6; i++) {
    const rung = new THREE.Mesh(rungGeo, chromeMat);
    rung.position.set(0.88, 1.0 + i * 0.38, REAR - 0.12);
    ladder.add(rung);
  }
  g.add(ladder);

  // ---- right side: entry door + step ---------------------------------------
  const RIGHT = W / 2;
  const door = box(0.78, 1.85, 0.07, creamMat, RIGHT + 0.01, 1.72, 1.6);
  g.add(door);
  g.add(box(0.82, 1.89, 0.04, blackTrimMat, RIGHT - 0.01, 1.72, 1.6, false));
  rvWindow(g, 0.5, 0.5, RIGHT + 0.06, 2.2, 1.6, Math.PI / 2);
  g.add(box(0.05, 0.22, 0.06, chromeMat, RIGHT + 0.06, 1.45, 1.32, false));
  g.add(box(0.6, 0.07, 0.45, rubberMat, RIGHT + 0.18, 0.48, 1.6)); // fold-out step
  // door marker so the player knows where to interact
  const doorAnchor = new THREE.Object3D();
  doorAnchor.position.set(RIGHT + 1.0, 1.2, 1.6);
  doorAnchor.name = 'doorAnchor';
  g.add(doorAnchor);

  // side windows
  rvWindow(g, 1.1, 0.65, RIGHT + 0.03, 2.35, 3.35, Math.PI / 2); // passenger
  rvWindow(g, 1.5, 0.7, RIGHT + 0.03, 2.3, -0.4, Math.PI / 2); // dinette
  rvWindow(g, 1.0, 0.6, RIGHT + 0.03, 2.3, -3.1, Math.PI / 2); // bedroom
  const LEFT = -W / 2;
  rvWindow(g, 1.1, 0.65, LEFT - 0.03, 2.35, 3.35, -Math.PI / 2); // driver
  rvWindow(g, 1.9, 0.75, LEFT - 0.03, 2.3, 0.2, -Math.PI / 2); // lounge
  rvWindow(g, 1.0, 0.6, LEFT - 0.03, 2.3, -3.1, -Math.PI / 2); // bedroom

  // awning roll on the left flank
  const awningGeo = new THREE.CylinderGeometry(0.09, 0.09, 4.4, 10);
  awningGeo.rotateX(Math.PI / 2);
  const awning = new THREE.Mesh(awningGeo, new THREE.MeshStandardMaterial({
    color: 0x77704f, roughness: 0.8
  }));
  awning.position.set(LEFT - 0.12, 2.78, -0.4);
  awning.castShadow = true;
  g.add(awning);
  for (const az of [-2.4, 1.6]) {
    g.add(box(0.06, 0.3, 0.06, blackTrimMat, LEFT - 0.1, 2.6, az, false));
  }

  // ---- roof gear -----------------------------------------------------------
  for (const az of [1.7, -1.4]) {
    g.add(box(0.78, 0.32, 1.15, roofMat, 0.25, 3.18, az)); // AC shrouds
  }
  g.add(box(0.34, 0.12, 0.34, roofMat, -0.75, 3.1, 0.4, false)); // vent cap
  g.add(box(0.34, 0.12, 0.34, roofMat, -0.75, 3.1, -2.6, false));

  // ---- wheels ----------------------------------------------------------------
  const wheels = [];
  const frontWheels = [];
  const AXLE_F = 3.0, AXLE_R = -2.3;
  for (const side of [-1, 1]) {
    const fw = makeWheel(0.3);
    fw.position.set(side * 1.12, 0.43, AXLE_F);
    g.add(fw);
    wheels.push(fw);
    frontWheels.push(fw);
    const rw = makeWheel(0.52); // visually reads as duals
    rw.position.set(side * 1.05, 0.43, AXLE_R);
    g.add(rw);
    wheels.push(rw);
    // wheel arches
    g.add(box(0.16, 0.6, 1.15, rubberMat, side * (W / 2 - 0.04), 0.8, AXLE_F, false));
    g.add(box(0.16, 0.6, 1.15, rubberMat, side * (W / 2 - 0.04), 0.8, AXLE_R, false));
  }

  g.userData.wheels = wheels;
  g.userData.frontWheels = frontWheels;
  return g;
}

// ---- the cook site around the RV -------------------------------------------
export function createCampsite(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  // fire ring: scorched patch, stones, charred logs
  const scorch = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 16),
    new THREE.MeshStandardMaterial({ color: 0x241f1a, roughness: 1 })
  );
  scorch.rotation.x = -Math.PI / 2;
  scorch.position.set(6, 0.03, 2);
  g.add(scorch);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7e6c58, roughness: 1, flatShading: true });
  const stoneGeo = new THREE.DodecahedronGeometry(0.16, 0);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const s = new THREE.Mesh(stoneGeo, stoneMat);
    s.position.set(6 + Math.cos(a) * 0.85, 0.1, 2 + Math.sin(a) * 0.85);
    s.castShadow = true;
    g.add(s);
  }
  const logMat = new THREE.MeshStandardMaterial({ color: 0x35291e, roughness: 1 });
  const logGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.9, 7);
  logGeo.rotateZ(Math.PI / 2);
  for (const [lx, lz, r] of [[5.8, 2.1, 0.4], [6.2, 1.9, 1.7], [6.1, 2.3, 2.6]]) {
    const log = new THREE.Mesh(logGeo, logMat);
    log.position.set(lx, 0.12, lz);
    log.rotation.y = r;
    log.castShadow = true;
    g.add(log);
  }

  // folding camp chairs
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x365478, roughness: 0.8 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.5 });
  for (const [cx, cz, rot] of [[4.4, 3.2, 0.7], [7.6, 3.4, -0.6]]) {
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), chairMat);
    seat.position.y = 0.45;
    chair.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.05), chairMat);
    back.position.set(0, 0.75, -0.24);
    back.rotation.x = 0.18;
    chair.add(back);
    for (const [px, pz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), frameMat);
      leg.position.set(px, 0.22, pz);
      chair.add(leg);
    }
    chair.position.set(cx, 0, cz);
    chair.rotation.y = rot;
    chair.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.add(chair);
  }

  // the blue methylamine barrel + a couple of crates
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.92, 14),
    new THREE.MeshStandardMaterial({ color: 0x1d4f8a, roughness: 0.5, metalness: 0.3 })
  );
  barrel.position.set(-4.6, 0.46, 1.4);
  barrel.castShadow = true;
  g.add(barrel);
  for (const ry of [0.18, 0.46, 0.74]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.33, 0.015, 6, 18),
      new THREE.MeshStandardMaterial({ color: 0x163d6b, roughness: 0.5 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-4.6, ry, 1.4);
    g.add(ring);
  }
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a6c44, roughness: 0.95 });
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), crateMat);
  crate1.position.set(-4.0, 0.25, 2.4);
  crate1.rotation.y = 0.4;
  crate1.castShadow = true;
  g.add(crate1);
  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), crateMat);
  crate2.position.set(-4.3, 0.7, 2.3);
  crate2.rotation.y = 0.9;
  crate2.castShadow = true;
  g.add(crate2);

  // propane tank
  const tank = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.4, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: 0.4, metalness: 0.3 })
  );
  tank.position.set(-3.4, 0.42, 1.2);
  tank.castShadow = true;
  g.add(tank);

  return g;
}
