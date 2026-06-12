// Arcade driving shared by the RV and the cars: throttle/brake/steer with
// terrain-following pitch and roll, spinning wheels, steering front wheels
// and a smoothed chase camera. Per-vehicle tuning comes from
// group.userData.drive.

import * as THREE from 'three';
import { keys } from './player.js';
import { groundHeight, WORLD_RADIUS } from '../world/terrain.js';

const DRAG = 0.55;

export class Vehicle {
  constructor(group, colliders, otherVehicles = []) {
    this.group = group;
    this.p = group.userData.drive;
    this.colliders = colliders;
    this.others = otherVehicles;
    this.heading = group.rotation.y;
    this.speed = 0;
    this.steer = 0;
    this._camPos = new THREE.Vector3();
    this._camTarget = new THREE.Vector3();
    this._camInit = false;
  }

  get position() {
    return this.group.position;
  }

  update(dt) {
    const p = this.p;
    let throttle = 0;
    if (keys.KeyW || keys.ArrowUp) throttle += 1;
    if (keys.KeyS || keys.ArrowDown) throttle -= 1;
    let steerInput = 0;
    if (keys.KeyA || keys.ArrowLeft) steerInput += 1;
    if (keys.KeyD || keys.ArrowRight) steerInput -= 1;

    if (throttle > 0) {
      this.speed += (this.speed < 0 ? p.brake : p.accel) * dt;
    } else if (throttle < 0) {
      this.speed -= (this.speed > 0 ? p.brake : p.accel) * dt;
    } else {
      this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), DRAG * 9 * dt);
    }
    this.speed = THREE.MathUtils.clamp(this.speed, -p.maxRev, p.maxFwd);

    // steering tightens at low speed, relaxes at highway speed
    const targetSteer = steerInput * 0.55 / (1 + Math.abs(this.speed) * 0.05);
    this.steer += (targetSteer - this.steer) * (1 - Math.exp(-8 * dt));
    this.heading += this.steer * (this.speed / p.wheelbase) * dt;

    const fwdX = Math.sin(this.heading);
    const fwdZ = Math.cos(this.heading);
    const pos = this.group.position;
    pos.x += fwdX * this.speed * dt;
    pos.z += fwdZ * this.speed * dt;

    // soft collision with buildings: nose, center and tail circles
    const r = p.collisionR;
    for (const b of this.colliders) {
      for (const t of [-p.collisionHalfL, 0, p.collisionHalfL]) {
        const px = pos.x + fwdX * t;
        const pz = pos.z + fwdZ * t;
        const cx = THREE.MathUtils.clamp(px, b.min.x, b.max.x);
        const cz = THREE.MathUtils.clamp(pz, b.min.z, b.max.z);
        const dx = px - cx;
        const dz = pz - cz;
        const distSq = dx * dx + dz * dz;
        if (distSq < r * r && distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          pos.x += (dx / dist) * (r - dist);
          pos.z += (dz / dist) * (r - dist);
          this.speed *= 0.4;
        }
      }
    }

    // don't drive through parked vehicles (coarse circle test)
    for (const other of this.others) {
      if (other === this.group) continue;
      const dx = pos.x - other.position.x;
      const dz = pos.z - other.position.z;
      const minDist = p.collisionHalfL + (other.userData.obb ? other.userData.obb.halfL : 2.5);
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist && distSq > 1e-8) {
        const dist = Math.sqrt(distSq);
        pos.x += (dx / dist) * (minDist - dist) * 0.5;
        pos.z += (dz / dist) * (minDist - dist) * 0.5;
        this.speed *= 0.5;
      }
    }

    // world bounds
    const d = Math.hypot(pos.x, pos.z);
    if (d > WORLD_RADIUS - 40) {
      const s = (WORLD_RADIUS - 40) / d;
      pos.x *= s;
      pos.z *= s;
      this.speed *= 0.5;
    }

    // terrain following: sample under axles and sides for pitch/roll
    const rightX = fwdZ, rightZ = -fwdX;
    const half = p.wheelbase / 2;
    const hF = groundHeight(pos.x + fwdX * half, pos.z + fwdZ * half);
    const hB = groundHeight(pos.x - fwdX * half, pos.z - fwdZ * half);
    const hR = groundHeight(pos.x + rightX * 1.1, pos.z + rightZ * 1.1);
    const hL = groundHeight(pos.x - rightX * 1.1, pos.z - rightZ * 1.1);

    pos.y = (hF + hB) / 2 + 0.06;
    const pitch = -Math.atan2(hF - hB, p.wheelbase);
    const roll = Math.atan2(hR - hL, 2.2);
    this.group.rotation.set(pitch, this.heading, roll, 'YXZ');

    // spin the tire meshes; steer the front wheel groups
    const spin = (this.speed / p.wheelRadius) * dt;
    for (const w of this.group.userData.wheels) {
      for (const part of w.children) part.rotation.x += spin;
    }
    for (const w of this.group.userData.frontWheels) w.rotation.y = this.steer * 0.9;
  }

  /** Smoothed chase camera. */
  updateCamera(camera, dt) {
    const p = this.p;
    const fwdX = Math.sin(this.heading);
    const fwdZ = Math.cos(this.heading);
    const pos = this.group.position;

    this._camTarget.set(
      pos.x - fwdX * p.camDist,
      pos.y + p.camHeight,
      pos.z - fwdZ * p.camDist
    );
    this._camTarget.y = Math.max(
      this._camTarget.y,
      groundHeight(this._camTarget.x, this._camTarget.z) + 1.4
    );

    if (!this._camInit) {
      this._camPos.copy(this._camTarget);
      this._camInit = true;
    }
    this._camPos.lerp(this._camTarget, 1 - Math.exp(-4.5 * dt));
    camera.position.copy(this._camPos);
    camera.lookAt(pos.x + fwdX * 3, pos.y + p.lookHeight, pos.z + fwdZ * 3);
  }

  resetCamera() {
    this._camInit = false;
  }

  get mph() {
    return Math.abs(Math.round(this.speed * 2.237));
  }
}
