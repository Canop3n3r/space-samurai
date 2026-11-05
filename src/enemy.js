import * as THREE from 'three';
import { placeholderCapsule, loadKitPart, neonMat, NEON, chromeMat } from './assets.js';

export async function createEnemy(scene, { position, isCaptain = false } = {}) {
  const root = new THREE.Group();
  let body = placeholderCapsule({ color: isCaptain ? NEON.orange : NEON.magenta, height: isCaptain ? 1.9 : 1.7 });
  // strip player blade look — enemies get darker blade
  const blade = body.getObjectByName('blade');
  if (blade) blade.material = neonMat(isCaptain ? NEON.orange : NEON.cyan, 1.1);

  const alien = await loadKitPart(isCaptain ? 'astronaut' : 'alien', {
    scale: isCaptain ? 1.35 : 1.15,
    tint: isCaptain ? NEON.orange : NEON.magenta,
  });
  if (alien) {
    const b = blade;
    body.clear();
    body.add(alien);
    if (b) {
      b.position.set(0.5, 1.1, 0);
      body.add(b);
    }
  }
  root.add(body);
  root.position.copy(position);
  scene.add(root);

  const maxHp = isCaptain ? 160 : 70;
  let attackCd = 0.5 + Math.random();
  const api = {
    mesh: root,
    hp: maxHp,
    maxHp,
    alive: true,
    isCaptain,
    practice: false,
    update(dt, player) {
      if (!this.alive) return;
      const to = player.position.clone().sub(root.position);
      to.y = 0;
      const dist = to.length();
      if (dist > 0.4) {
        to.normalize();
        root.position.addScaledVector(to, (isCaptain ? 3.2 : 2.6) * dt);
        root.lookAt(player.position.x, root.position.y, player.position.z);
      }
      attackCd -= dt;
      if (dist < 1.6 && attackCd <= 0 && player.invuln <= 0) {
        player.hp -= isCaptain ? 12 : 8;
        attackCd = isCaptain ? 1.1 : 1.4;
      }
      // tint by hp
    },
    onDeath() {
      root.visible = false;
    },
  };
  return api;
}
