import * as THREE from 'three';
import { neonMat, NEON } from './assets.js';
import { spawnSparks, slashMaterial } from './fx.js';

export function createCombat(player, { maxStamina = 100 } = {}) {
  let stamina = maxStamina;
  let lockedTarget = null;
  let cooldown = 0;
  const slashPool = [];
  let ring = null;

  function spawnSlash(scene, origin, dir) {
    const mat = slashMaterial(NEON.magenta);
    const group = new THREE.Group();
    const yaw = Math.atan2(dir.x, dir.z);
    for (let i = 0; i < 6; i++) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.15), mat);
      plane.position.copy(origin);
      plane.position.y += 1.15;
      plane.position.addScaledVector(dir, 0.35 + i * 0.16);
      plane.rotation.y = yaw;
      plane.rotation.z = -0.9 + i * 0.32;
      group.add(plane);
    }
    scene.add(group);
    slashPool.push({ mesh: group, life: 0.22, mat });
  }

  function ensureRing() {
    if (ring) return ring;
    ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.035, 8, 28),
      neonMat(NEON.magenta, 2),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    return ring;
  }

  function attachRing(target) {
    const marker = ensureRing();
    if (marker.parent) marker.parent.remove(marker);
    if (target?.mesh) target.mesh.add(marker);
  }

  function findLock(candidates, camYaw) {
    const origin = player.position;
    const forward = new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw)).multiplyScalar(-1);
    let best = null;
    let bestScore = Infinity;
    for (const c of candidates) {
      if (!c.alive) continue;
      const to = c.mesh.position.clone().sub(origin);
      const dist = to.length();
      if (dist > 16 || dist < 0.2) continue;
      to.normalize();
      const dot = forward.dot(new THREE.Vector3(to.x, 0, to.z).normalize());
      if (dot < 0.2) continue;
      const score = dist * (1.6 - dot);
      if (score < bestScore) { bestScore = score; best = c; }
    }
    return best;
  }

  function applyHit(target, damage) {
    target.hp -= damage;
    target.onHit?.();
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      target.onDeath?.();
    }
  }

  function tryHit(targets, range, damage) {
    const origin = player.position;
    const face = player.facing.clone();
    if (face.lengthSq() < 1e-6) face.set(0, 0, -1);
    else face.normalize();

    if (lockedTarget?.alive) {
      const dist = lockedTarget.mesh.position.distanceTo(origin);
      if (dist <= range + 0.45) {
        applyHit(lockedTarget, damage);
        return lockedTarget;
      }
    }

    let hit = null;
    for (const t of targets) {
      if (!t.alive) continue;
      const to = t.mesh.position.clone().sub(origin);
      const dist = to.length();
      if (dist > range) continue;
      if (dist > 1.15) {
        to.normalize();
        if (face.dot(new THREE.Vector3(to.x, 0, to.z)) < 0.15) continue;
      }
      applyHit(t, damage);
      hit = t;
      break;
    }
    return hit;
  }

  return {
    get stamina() { return stamina; },
    get lockedTarget() { return lockedTarget; },
    setLockedTarget(t) {
      lockedTarget = t;
      attachRing(t);
    },
    update(dt, inputActions, targets, scene, camYaw) {
      stamina = Math.min(maxStamina, stamina + 20 * dt);
      cooldown = Math.max(0, cooldown - dt);
      for (let i = slashPool.length - 1; i >= 0; i--) {
        const s = slashPool[i];
        s.life -= dt;
        s.mat.opacity = Math.max(0, s.life / 0.22);
        if (s.life <= 0) {
          scene.remove(s.mesh);
          s.mat.dispose();
          slashPool.splice(i, 1);
        }
      }

      if (inputActions.lock) {
        if (lockedTarget && lockedTarget.alive) {
          lockedTarget = null;
          attachRing(null);
        } else {
          lockedTarget = findLock(targets, camYaw);
          attachRing(lockedTarget);
        }
      }
      if (lockedTarget && !lockedTarget.alive) {
        lockedTarget = null;
        attachRing(null);
      }

      if (cooldown > 0) return;

      if (inputActions.dodge && stamina >= 25) {
        stamina -= 25;
        player.invuln = 0.3;
        const dash = player.facing.clone();
        if (dash.lengthSq() < 1e-6) dash.set(0, 0, -1);
        player.position.addScaledVector(dash.normalize(), 2.4);
        cooldown = 0.22;
        return;
      }

      if (inputActions.light && stamina >= 12) {
        stamina -= 12;
        cooldown = 0.26;
        player.swing?.('light');
        const hit = tryHit(targets, 2.35, 24);
        const dir = (hit?.mesh.position.clone().sub(player.position) || player.facing.clone());
        dir.y = 0;
        if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
        dir.normalize();
        spawnSlash(scene, player.position.clone(), dir);
        if (hit) spawnSparks(scene, hit.mesh.position.clone(), NEON.cyan, 10);
      } else if (inputActions.heavy && stamina >= 28) {
        stamina -= 28;
        cooldown = 0.5;
        player.swing?.('heavy');
        const hit = tryHit(targets, 2.9, 42);
        const dir = (hit?.mesh.position.clone().sub(player.position) || player.facing.clone().multiplyScalar(2));
        dir.y = 0;
        if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
        dir.normalize();
        spawnSlash(scene, player.position.clone(), dir);
        if (hit) spawnSparks(scene, hit.mesh.position.clone(), NEON.magenta, 16);
      }
    },
  };
}

/** Pure helpers for unit tests */
export function hitInRange(attackerPos, attackerFacing, targetPos, range) {
  const to = targetPos.clone().sub(attackerPos);
  const dist = to.length();
  if (dist > range) return false;
  if (dist < 1e-6) return true;
  to.normalize();
  return attackerFacing.clone().normalize().dot(to) >= 0.2;
}

export function canAfford(stamina, cost) {
  return stamina >= cost;
}

export function dodgeInvulnDuration() {
  return 0.3;
}
