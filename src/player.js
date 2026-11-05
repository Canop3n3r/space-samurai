import * as THREE from 'three';
import { placeholderCapsule, loadKitPart, NEON } from './assets.js';

export async function createPlayer(scene) {
  const root = new THREE.Group();
  root.name = 'player';

  let mesh = placeholderCapsule();
  const astronaut = await loadKitPart('astronaut', { scale: 1.2, tint: NEON.chrome });
  const saber = await loadKitPart('laserSabel', { scale: 1.8, tint: NEON.magenta });
  if (astronaut) {
    const blade = mesh.getObjectByName('blade');
    mesh.clear();
    astronaut.position.y = 0;
    mesh.add(astronaut);
    if (saber) {
      saber.position.set(0.45, 1.1, 0);
      saber.rotation.z = -0.4;
      saber.name = 'blade';
      mesh.add(saber);
    } else if (blade) {
      mesh.add(blade);
    }
  }
  root.add(mesh);
  scene.add(root);

  const velocity = new THREE.Vector3();
  const facing = new THREE.Vector3(0, 0, -1);
  let yaw = 0;
  let pitch = 0.25;
  const camOffset = new THREE.Vector3(0, 1.6, 4.2);

  const api = {
    mesh: root,
    get position() { return root.position; },
    facing,
    yaw: () => yaw,
    pitch: () => pitch,
    invuln: 0,
    hp: 100,
    mode: 'ground', // ground | ship
    update(dt, input, camera, { lockedTarget = null, flying = false } = {}) {
      if (flying) return;
      yaw -= input.look.x;
      pitch = THREE.MathUtils.clamp(pitch - input.look.y, -0.6, 0.85);
      input.look.set(0, 0);

      const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const right = new THREE.Vector3(forward.z, 0, -forward.x);
      const wish = new THREE.Vector3()
        .addScaledVector(forward, -input.move.y)
        .addScaledVector(right, input.move.x);
      if (wish.lengthSq() > 0) {
        wish.normalize();
        facing.copy(wish);
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), wish);
        root.quaternion.slerp(targetQuat, 1 - Math.pow(0.001, dt));
      }

      const speed = 5.5;
      root.position.addScaledVector(wish, speed * dt);
      root.position.y = 0;
      if (this.invuln > 0) this.invuln -= dt;

      // third-person camera
      if (lockedTarget?.mesh) {
        const to = lockedTarget.mesh.position.clone().sub(root.position);
        if (to.lengthSq() > 0.01) yaw = Math.atan2(to.x, to.z);
      }
      const offset = camOffset.clone();
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      offset.y += Math.sin(pitch) * 1.5;
      const desired = root.position.clone().add(offset);
      desired.y = Math.max(1.2, desired.y);
      camera.position.lerp(desired, 1 - Math.pow(0.0002, dt));
      const lookAt = root.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      if (lockedTarget?.mesh) lookAt.lerp(lockedTarget.mesh.position.clone().setY(1.2), 0.35);
      camera.lookAt(lookAt);
    },
  };
  return api;
}
