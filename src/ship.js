import * as THREE from 'three';
import { loadKitPart, neonMat, NEON, punchKit } from './assets.js';
import { spawnSparks } from './fx.js';

export async function createShip(scene, { position = new THREE.Vector3(), maxSize = 4.4 } = {}) {
  const root = new THREE.Group();
  root.name = 'player-ship';
  let mesh = await loadKitPart('spaceCraft1', { maxSize, nose: '-z' });
  if (!mesh) mesh = fallbackCraft(NEON.orange);
  else punchKit(mesh, 0.5);
  root.add(mesh);
  addEngines(root, NEON.cyan);
  const fill = new THREE.PointLight(0xd7e8ff, 18, 16, 2);
  fill.position.set(0, 1.6, 2.2);
  root.add(fill);
  root.position.copy(position);
  scene.add(root);

  const velocity = new THREE.Vector3();
  const projectiles = [];
  let fireCd = 0;

  function fire() {
    if (fireCd > 0) return false;
    fireCd = 0.14;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(root.quaternion).normalize();
    const bolt = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 1.35),
      neonMat(NEON.cyan, 2.8),
    );
    bolt.quaternion.copy(root.quaternion);
    bolt.position.copy(root.position).addScaledVector(dir, 2.4);
    scene.add(bolt);
    projectiles.push({ mesh: bolt, vel: dir.multiplyScalar(120), life: 1.6 });
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
      const keys = input._keys;
      const lookX = input.look.x;
      const lookY = input.look.y;
      input.look.set(0, 0);

      let pitch = -lookY * 1.55;
      let yaw = -lookX * 1.55;
      if (keys?.has('ArrowUp')) pitch += 1.2;
      if (keys?.has('ArrowDown')) pitch -= 1.2;
      if (keys?.has('ArrowLeft')) yaw += 1.2;
      if (keys?.has('ArrowRight')) yaw -= 1.2;

      let roll = 0;
      if (keys?.has('KeyA')) roll += 1.8;
      if (keys?.has('KeyD')) roll -= 1.8;
      if (input.usingStick) roll += -input.move.x * 1.7;

      root.rotateX(pitch * dt);
      root.rotateY(yaw * dt);
      root.rotateZ(roll * dt);

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(root.quaternion);
      let thrust = 0;
      if (keys?.has('KeyW')) thrust += 1;
      if (keys?.has('KeyS')) thrust -= 0.55;
      if (input.usingStick) thrust += input.move.y;
      thrust = Math.max(-0.75, Math.min(1, thrust));
      const boosting = !!(keys?.has('ShiftLeft') || keys?.has('ShiftRight') || actions.dodge);
      const power = (boosting ? 52 : 30) * thrust;
      velocity.addScaledVector(forward, power * dt);
      velocity.multiplyScalar(Math.pow(0.22, dt));
      root.position.addScaledVector(velocity, dt);

      if (actions.fire || actions.light) fire();

      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.mesh.position.addScaledVector(p.vel, dt);
        p.life -= dt;
        for (const c of chasers) {
          if (!c.alive) continue;
          const reach = (c.radius || 2.2) + 0.8;
          if (p.mesh.position.distanceTo(c.mesh.position) < reach) {
            c.hp -= 36;
            c.flashT = 0.14;
            spawnSparks(scene, p.mesh.position.clone(), NEON.cyan, 8);
            if (c.hp <= 0 && c.alive) {
              c.hp = 0;
              c.alive = false;
              c.dying = 0.9;
              spawnSparks(scene, c.mesh.position.clone(), NEON.magenta, 18);
            }
            p.life = 0;
          }
        }
        if (p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          projectiles.splice(i, 1);
        }
      }

      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(root.quaternion);
      const camDesired = root.position.clone()
        .addScaledVector(forward, -6.4)
        .addScaledVector(up, 2.1);
      camera.position.lerp(camDesired, 1 - Math.pow(0.00035, dt));
      camera.up.lerp(up, 1 - Math.pow(0.0008, dt));
      camera.lookAt(root.position.clone().addScaledVector(forward, 16));
    },
  };
}

function addEngines(root, color) {
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const mat = neonMat(color, 2.2);
  const geo = new THREE.SphereGeometry(Math.max(0.14, size.y * 0.1), 10, 8);
  for (const side of [-1, 1]) {
    const glow = new THREE.Mesh(geo, mat);
    glow.position.set(center.x + side * size.x * 0.22, center.y, box.max.z);
    root.add(glow);
  }
}

function fallbackCraft(color) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 4), neonMat(color, 0.4));
  hull.rotation.x = Math.PI / 2;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.7), chromeLike());
  g.add(hull, wing);
  return g;
}

function chromeLike() {
  return new THREE.MeshStandardMaterial({ color: 0xc5d0dc, metalness: 0.8, roughness: 0.25 });
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
