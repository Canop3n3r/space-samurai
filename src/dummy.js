import * as THREE from 'three';
import { placeholderDummy, neonMat, NEON } from './assets.js';

export function createDummy(scene, position) {
  const mesh = placeholderDummy();
  mesh.position.copy(position);
  scene.add(mesh);
  const maxHp = 100;
  const api = {
    mesh,
    hp: maxHp,
    maxHp,
    alive: true,
    practice: true,
    update() {
      // pulse when damaged
      const t = mesh.children[1];
      if (t?.material) {
        t.material.emissiveIntensity = 0.4 + (1 - this.hp / maxHp) * 1.2;
      }
      if (!this.alive) {
        // respawn practice dummy
        this.hp = maxHp;
        this.alive = true;
        mesh.visible = true;
      }
    },
    onDeath() {
      // flash then revive
      mesh.visible = false;
      setTimeout(() => {
        this.hp = maxHp;
        this.alive = true;
        mesh.visible = true;
      }, 600);
    },
  };
  return api;
}
