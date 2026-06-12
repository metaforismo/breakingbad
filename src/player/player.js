// First-person walking controller: mouselook, WASD with acceleration,
// sprint, a small jump, terrain-following and circle-vs-AABB collision
// against the buildings/pool/RV.

import * as THREE from 'three';
import { groundHeight, WORLD_RADIUS } from '../world/terrain.js';

export const keys = Object.create(null);
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

const EYE_HEIGHT = 1.7;
const RADIUS = 0.35;
const WALK_SPEED = 5.2;
const RUN_SPEED = 9.5;
const GRAVITY = 24;
const JUMP_SPEED = 7;

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.position = new THREE.Vector3(-1, 0, 9); // on the walkway, facing the house
    this.velocity = new THREE.Vector3();
    this.yaw = 0; // look toward -z (the front door)
    this.pitch = -0.05;
    this.onGround = true;
    this.colliders = [];
    this.rv = null; // the RV group; collided as an oriented box
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
  }

  onMouseMove(dx, dy) {
    this.yaw -= dx * 0.0022;
    this.pitch -= dy * 0.0022;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
  }

  update(dt) {
    const fwd = this._fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = this._right.set(-fwd.z, 0, fwd.x);

    let mx = 0, mz = 0;
    if (keys.KeyW || keys.ArrowUp) mz += 1;
    if (keys.KeyS || keys.ArrowDown) mz -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;

    const speed = (keys.ShiftLeft || keys.ShiftRight) ? RUN_SPEED : WALK_SPEED;
    const targetX = (fwd.x * mz + right.x * mx);
    const targetZ = (fwd.z * mz + right.z * mx);
    const len = Math.hypot(targetX, targetZ) || 1;

    // smooth acceleration toward the desired velocity
    const k = 1 - Math.exp(-12 * dt);
    this.velocity.x += ((targetX / len) * speed * (mx || mz ? 1 : 0) - this.velocity.x) * k;
    this.velocity.z += ((targetZ / len) * speed * (mx || mz ? 1 : 0) - this.velocity.z) * k;

    if (this.onGround && keys.Space) {
      this.velocity.y = JUMP_SPEED;
      this.onGround = false;
    }
    if (!this.onGround) this.velocity.y -= GRAVITY * dt;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.position.y += this.velocity.y * dt;

    // keep inside the world
    const d = Math.hypot(this.position.x, this.position.z);
    if (d > WORLD_RADIUS - 30) {
      const s = (WORLD_RADIUS - 30) / d;
      this.position.x *= s;
      this.position.z *= s;
    }

    this.resolveCollisions();

    const ground = groundHeight(this.position.x, this.position.z);
    if (this.position.y <= ground) {
      this.position.y = ground;
      this.velocity.y = 0;
      this.onGround = true;
    }

    this.camera.position.set(
      this.position.x,
      this.position.y + EYE_HEIGHT,
      this.position.z
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  resolveCollisions() {
    const p = this.position;

    // RV: circle vs oriented box in the RV's local frame
    if (this.rv) {
      const heading = this.rv.rotation.y;
      const cos = Math.cos(heading), sin = Math.sin(heading);
      const dx = p.x - this.rv.position.x;
      const dz = p.z - this.rv.position.z;
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;
      const halfW = 1.45, halfL = 4.75;
      const cx = THREE.MathUtils.clamp(lx, -halfW, halfW);
      const cz = THREE.MathUtils.clamp(lz, -halfL, halfL);
      const ox = lx - cx, oz = lz - cz;
      const distSq = ox * ox + oz * oz;
      if (distSq < RADIUS * RADIUS && distSq > 1e-8) {
        const dist = Math.sqrt(distSq);
        const push = (RADIUS - dist) / dist;
        const wx = ox * push, wz = oz * push;
        p.x += wx * cos + wz * sin;
        p.z += -wx * sin + wz * cos;
      } else if (distSq <= 1e-8) {
        // standing inside: shove out the nearest side
        const sideX = lx >= 0 ? halfW + RADIUS : -halfW - RADIUS;
        const wx = sideX - lx;
        p.x += wx * cos;
        p.z += -wx * sin;
      }
    }

    for (const b of this.colliders) {
      if (p.y > b.max.y || p.y + EYE_HEIGHT < b.min.y) continue;
      const cx = THREE.MathUtils.clamp(p.x, b.min.x, b.max.x);
      const cz = THREE.MathUtils.clamp(p.z, b.min.z, b.max.z);
      const dx = p.x - cx;
      const dz = p.z - cz;
      const distSq = dx * dx + dz * dz;
      if (distSq >= RADIUS * RADIUS) continue;

      if (distSq > 1e-8) {
        const dist = Math.sqrt(distSq);
        const push = RADIUS - dist;
        p.x += (dx / dist) * push;
        p.z += (dz / dist) * push;
      } else {
        // inside the box: push out through the nearest face
        const exitL = p.x - b.min.x, exitR = b.max.x - p.x;
        const exitB = p.z - b.min.z, exitF = b.max.z - p.z;
        const m = Math.min(exitL, exitR, exitB, exitF);
        if (m === exitL) p.x = b.min.x - RADIUS;
        else if (m === exitR) p.x = b.max.x + RADIUS;
        else if (m === exitB) p.z = b.min.z - RADIUS;
        else p.z = b.max.z + RADIUS;
      }
    }
  }
}
