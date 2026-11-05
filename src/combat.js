import * as THREE from 'three';
import { neonMat, NEON } from './assets.js';

export function createCombat(player, { maxStamina = 100 } = {}) {
  let stamina = maxStamina;
  let lockedTarget = null;
  let cooldown = 0;
  const slashPool = [];

  function spawnSlash(scene, from, to) {
    const dir = to.clone().sub(from);
    const len = Math.max(0.4, dir.length());
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, len),
      neonMat(NEON.magenta, 2.0),
    );
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.position.y += 1.1;
    mesh.lookAt(to.clone().setY(mesh.position.y));
    scene.add(mesh);
    slashPool.push({ mesh, life: 0.18 });
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
      if (dist > 14 || dist < 0.2) continue;
      to.normalize();
      const dot = forward.dot(to);
      if (dot < 0.35) continue;
      const score = dist * (1.5 - dot);
      if (score < bestScore) { bestScore = score; best = c; }
    }
    return best;
  }

  function tryHit(targets, range, damage) {
    const origin = player.position;
    const face = player.facing.clone().normalize();
    let hit = null;
    for (const t of targets) {
      if (!t.alive) continue;
      const to = t.mesh.position.clone().sub(origin);
      const dist = to.length();
      if (dist > range) continue;
      to.normalize();
      if (face.dot(to) < 0.2 && dist > 1.2) continue;
      t.hp -= damage;
      if (t.hp <= 0) { t.hp = 0; t.alive = false; t.onDeath?.(); }
      hit = t;
      break;
    }
    return hit;
  }

  return {
    get stamina() { return stamina; },
    get lockedTarget() { return lockedTarget; },
    setLockedTarget(t) { lockedTarget = t; },
    update(dt, inputActions, targets, scene, camYaw) {
      stamina = Math.min(maxStamina, stamina + 22 * dt);
      cooldown = Math.max(0, cooldown - dt);
      for (let i = slashPool.length - 1; i >= 0; i--) {
        const s = slashPool[i];
        s.life -= dt;
        s.mesh.material.opacity = Math.max(0, s.life / 0.18);
        s.mesh.material.transparent = true;
        if (s.life <= 0) {
          scene.remove(s.mesh);
          s.mesh.geometry.dispose();
          slashPool.splice(i, 1);
        }
      }

      if (inputActions.lock) {
        if (lockedTarget && lockedTarget.alive) lockedTarget = null;
        else lockedTarget = findLock(targets, camYaw);
      }
      if (lockedTarget && !lockedTarget.alive) lockedTarget = null;

      if (cooldown > 0) return;

      if (inputActions.dodge && stamina >= 25) {
        stamina -= 25;
        player.invuln = 0.3;
        player.position.addScaledVector(player.facing, 2.2);
        cooldown = 0.25;
        return;
      }

      if (inputActions.light && stamina >= 12) {
        stamina -= 12;
        cooldown = 0.28;
        const hit = tryHit(targets, 2.4, 18);
        const to = (hit?.mesh.position || player.position.clone().add(player.facing)).clone();
        spawnSlash(scene, player.position.clone(), to);
      } else if (inputActions.heavy && stamina >= 28) {
        stamina -= 28;
        cooldown = 0.55;
        const hit = tryHit(targets, 3.0, 38);
        const to = (hit?.mesh.position || player.position.clone().add(player.facing.clone().multiplyScalar(2))).clone();
        spawnSlash(scene, player.position.clone(), to);
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
