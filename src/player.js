import * as THREE from 'three';
import { createSamurai, swingSword } from './avatar.js';
import { makeShadow } from './fx.js';

export async function createPlayer(scene) {
  const root = new THREE.Group();
  root.name = 'player';
  const avatar = await createSamurai();
  root.add(avatar);
  root.add(makeShadow(0.55));
  scene.add(root);

  const facing = new THREE.Vector3(0, 0, -1);
  let yaw = 0;
  let pitch = 0.18;
  let swing = 0;
  root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), facing.clone());

  const api = {
    mesh: root,
    avatar,
    get position() { return root.position; },
    facing,
    yaw: () => yaw,
    pitch: () => pitch,
    invuln: 0,
    hp: 100,
    maxHp: 100,
    swing(kind) { swing = kind === 'heavy' ? 1 : 0.62; },
    resetLook() {
      yaw = 0;
      pitch = 0.18;
      facing.set(0, 0, -1);
      root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), facing);
    },
    step(dt, input, { lockedTarget = null, bounds = null } = {}) {
      yaw -= input.look.x;
      pitch = THREE.MathUtils.clamp(pitch - input.look.y, -0.45, 0.9);
      input.look.set(0, 0);

      const camForward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(-1);
      const right = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0));
      const wish = new THREE.Vector3()
        .addScaledVector(camForward, input.move.y)
        .addScaledVector(right, input.move.x);
      if (wish.lengthSq() > 1) wish.normalize();

      if (lockedTarget?.alive && lockedTarget.mesh) {
        facing.copy(lockedTarget.mesh.position).sub(root.position);
        facing.y = 0;
        if (facing.lengthSq() < 1e-6) facing.copy(camForward);
        else facing.normalize();
      } else if (wish.lengthSq() > 0.001) {
        facing.copy(wish).normalize();
      } else {
        facing.copy(camForward);
      }

      const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), facing);
      root.quaternion.slerp(targetQuat, 1 - Math.pow(0.0008, dt));

      root.position.addScaledVector(wish, 6.4 * dt);
      root.position.y = 0;
      if (bounds) {
        root.position.x = THREE.MathUtils.clamp(root.position.x, bounds.minX, bounds.maxX);
        root.position.z = THREE.MathUtils.clamp(root.position.z, bounds.minZ, bounds.maxZ);
      }
      if (this.invuln > 0) this.invuln -= dt;
      avatar.visible = this.invuln <= 0 || Math.floor(this.invuln * 16) % 2 === 0;
      swing = swingSword(avatar, dt, swing);
    },
    frameCamera(dt, camera, { lockedTarget = null } = {}) {
      const offset = new THREE.Vector3(1.45, 1.7, 5.1);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      offset.y += Math.sin(pitch) * 1.15;
      const desired = root.position.clone().add(offset);
      desired.y = Math.max(1.1, desired.y);
      camera.position.lerp(desired, 1 - Math.pow(0.0004, dt));
      camera.up.lerp(new THREE.Vector3(0, 1, 0), 1 - Math.pow(0.002, dt));
      const lookAt = root.position.clone().add(new THREE.Vector3(0, 1.15, 0));
      if (lockedTarget?.alive && lockedTarget.mesh) {
        lookAt.lerp(lockedTarget.mesh.position.clone().setY(1.15), 0.42);
      }
      camera.lookAt(lookAt);
    },
    update(dt, input, camera, opts = {}) {
      this.step(dt, input, opts);
      this.frameCamera(dt, camera, opts);
    },
  };
  return api;
}
