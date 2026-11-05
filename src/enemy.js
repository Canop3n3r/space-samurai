import * as THREE from 'three';
import { loadKitPart, styleSaber, tintMaterials, setFlash, NEON } from './assets.js';
import { attachHealthBar, updateHealthBar, makeShadow } from './fx.js';

export async function createEnemy(scene, { position, isCaptain = false } = {}) {
  const root = new THREE.Group();
  const height = isCaptain ? 2.2 : 1.72;
  const body = await loadKitPart(isCaptain ? 'robot' : 'alien', { height });
  const meshBody = body || fallback(isCaptain);
  if (isCaptain) tintMaterials(meshBody, NEON.orange, 0.35);
  root.add(meshBody);

  const weapon = await loadKitPart(isCaptain ? 'itemWeapon' : 'laserSabelOff', {
    height: isCaptain ? 0.7 : 0.85,
  });
  if (weapon) {
    if (!isCaptain) styleSaber(weapon, NEON.cyan);
    weapon.position.set(0.38, height * 0.42, 0.15);
    weapon.rotation.z = -0.7;
    root.add(weapon);
  }

  root.add(makeShadow(isCaptain ? 0.7 : 0.48));
  attachHealthBar(root, isCaptain ? NEON.orange : NEON.magenta, height + 0.32);
  root.position.copy(position);
  scene.add(root);

  const maxHp = isCaptain ? 150 : 64;
  let attackCd = 0.6 + Math.random() * 0.4;
  const api = {
    mesh: root,
    hp: maxHp,
    maxHp,
    alive: true,
    isCaptain,
    practice: false,
    label: isCaptain ? 'Captain' : 'Crew',
    friends: [],
    flashT: 0,
    update(dt, player) {
      if (this.flashT > 0) {
        this.flashT -= dt;
        setFlash(root, this.flashT > 0 ? 1 : 0);
      }
      updateHealthBar(root, this.hp, maxHp);
      if (!this.alive) return;
      const to = player.position.clone().sub(root.position);
      to.y = 0;
      const dist = to.length();
      if (dist > 1.25) {
        to.multiplyScalar(1 / dist);
        const speed = isCaptain ? 2.7 : 3.35;
        root.position.addScaledVector(to, speed * dt);
      }
      separate(this, root);
      root.lookAt(player.position.x, root.position.y, player.position.z);
      attackCd -= dt;
      if (dist < 1.65 && attackCd <= 0 && player.invuln <= 0) {
        const dmg = isCaptain ? 14 : 8;
        player.hp = Math.max(0, player.hp - dmg);
        player.onDamaged?.();
        attackCd = isCaptain ? 1.15 : 1.35;
      }
    },
    onHit() { this.flashT = 0.14; },
    onDeath() {
      this.alive = false;
      root.rotation.x = -Math.PI / 2.2;
      root.position.y = 0.2;
      updateHealthBar(root, 0, maxHp);
    },
  };
  return api;
}

function separate(self, root) {
  for (const other of self.friends || []) {
    if (other === self || !other.alive) continue;
    const d = root.position.clone().sub(other.mesh.position);
    d.y = 0;
    const len = d.length();
    if (len > 0.001 && len < 1.35) {
      root.position.addScaledVector(d.multiplyScalar(1 / len), (1.35 - len) * 0.35);
    }
  }
}

function fallback(isCaptain) {
  const g = new THREE.Group();
  const color = isCaptain ? NEON.orange : NEON.magenta;
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, flatShading: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(isCaptain ? 0.38 : 0.28, 0.8, 4, 7), mat);
  body.position.y = 1;
  g.add(body);
  return g;
}
