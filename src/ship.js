import * as THREE from 'three';
import { placeholderShip, loadKitPart, neonMat, NEON } from './assets.js';

export async function createShip(scene, { position = new THREE.Vector3() } = {}) {
  const root = new THREE.Group();
  let mesh = placeholderShip();
  const kit = await loadKitPart('spaceCraft1', { scale: 0.55, tint: NEON.orange });
  if (kit) {
    kit.rotation.y = Math.PI;
    mesh = kit;
  }
  root.add(mesh);
  root.position.copy(position);
  root.position.y = Math.max(0.6, root.position.y);
  scene.add(root);

  const velocity = new THREE.Vector3();
  const projectiles = [];
  let fireCd = 0;

  function fire() {
    if (fireCd > 0) return false;
    fireCd = 0.12;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(root.quaternion);
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), neonMat(NEON.cyan, 2));
    bolt.position.copy(root.position).addScaledVector(dir, 1.6);
    scene.add(bolt);
    projectiles.push({ mesh: bolt, vel: dir.multiplyScalar(90), life: 2.2 });
    return true;
  }

  return {
    mesh: root,
    get position() { return root.position; },
    get quaternion() { return root.quaternion; },
    velocity,
    projectiles,
    fire,
    impulse(forwardAmt = 20) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(root.quaternion);
      velocity.addScaledVector(forward, forwardAmt);
    },
    update(dt, input, camera, { chasers = [], actions = {} } = {}) {
      fireCd = Math.max(0, fireCd - dt);

      const keys = input._keys || input._state?._keys;
      const lookX = input.look.x;
      const lookY = input.look.y;
      input.look.set(0, 0);

      // 6DOF: mouse pitch/yaw, A/D roll, W/S thrust, Shift boost
      const pitchRate = -lookY * 1.4 + (-input.move.y) * 0.15;
      const yawRate = -lookX * 1.4;
      let rollRate = 0;
      if (keys?.has('KeyA')) rollRate += 2.0;
      if (keys?.has('KeyD')) rollRate -= 2.0;
      // touch: horizontal stick rolls + yaws lightly
      rollRate += -input.move.x * 1.5;

      root.rotateX(pitchRate * dt);
      root.rotateY(yawRate * dt);
      root.rotateZ(rollRate * dt);

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(root.quaternion);
      let thrust = 0;
      if (keys?.has('KeyW') || keys?.has('ArrowUp')) thrust += 1;
      if (keys?.has('KeyS') || keys?.has('ArrowDown')) thrust -= 0.45;
      // stick always contributes (touch + residual move vector)
      thrust += input.move.y;
      thrust = Math.max(-1, Math.min(1.5, thrust));
      const boosting = !!(keys?.has('ShiftLeft') || keys?.has('ShiftRight') || actions.dodge);
      const thrustPower = (boosting ? 48 : 26) * thrust;
      velocity.addScaledVector(forward, thrustPower * dt);
      velocity.multiplyScalar(Math.pow(0.18, dt));
      root.position.addScaledVector(velocity, dt);

      if (actions.fire || actions.light) fire();

      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.mesh.position.addScaledVector(p.vel, dt);
        p.life -= dt;
        for (const c of chasers) {
          if (!c.alive) continue;
          if (p.mesh.position.distanceTo(c.mesh.position) < 2.0) {
            c.hp -= 40;
            if (c.hp <= 0) {
              c.alive = false;
              c.mesh.visible = false;
            }
            p.life = 0;
          }
        }
        if (p.life <= 0) {
          scene.remove(p.mesh);
          projectiles.splice(i, 1);
        }
      }

      const back = forward.clone().multiplyScalar(-9).add(new THREE.Vector3(0, 2.8, 0).applyQuaternion(root.quaternion));
      camera.position.lerp(root.position.clone().add(back), 1 - Math.pow(0.0004, dt));
      camera.up.copy(new THREE.Vector3(0, 1, 0).applyQuaternion(root.quaternion));
      camera.lookAt(root.position.clone().addScaledVector(forward, 14));
    },
  };
}

export function applyRotation(quat, { pitch = 0, yaw = 0, roll = 0 }, dt) {
  const q = quat.clone();
  const x = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch * dt);
  const y = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw * dt);
  const z = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll * dt);
  q.multiply(y).multiply(x).multiply(z);
  return q;
}

export function applyThrust(velocity, forward, amount, dt) {
  return velocity.clone().addScaledVector(forward.clone().normalize(), amount * dt);
}
