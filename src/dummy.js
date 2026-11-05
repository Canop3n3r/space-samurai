import * as THREE from 'three';
import { loadKitPart, styleHologram, tintMaterials, setFlash, NEON } from './assets.js';
import { attachHealthBar, updateHealthBar, makeShadow } from './fx.js';

const KINDS = {
  astronaut: { file: 'astronaut', height: 1.82, color: NEON.cyan, label: 'Holo dummy' },
  alien: { file: 'alien', height: 1.68, color: NEON.green, label: 'Alien dummy' },
  robot: { file: 'robot', height: 1.55, color: NEON.orange, label: 'Robot dummy' },
};

export async function createDummy(scene, position, kind = 'astronaut') {
  const spec = KINDS[kind] || KINDS.astronaut;
  const mesh = new THREE.Group();
  mesh.name = `dummy-${kind}`;
  let body = await loadKitPart(spec.file, { height: spec.height });
  if (!body) body = fallbackBody(spec.color);
  if (kind === 'robot') tintMaterials(body, NEON.orange, 0.55);
  else styleHologram(body, spec.color);
  mesh.add(body);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.035, 8, 24),
    new THREE.MeshBasicMaterial({ color: spec.color, toneMapped: false }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.04;
  mesh.add(ring, makeShadow(0.5));
  attachHealthBar(mesh, spec.color, spec.height + 0.28);
  mesh.position.copy(position);
  scene.add(mesh);

  const maxHp = 70;
  let down = 0;
  const api = {
    mesh,
    hp: maxHp,
    maxHp,
    alive: true,
    practice: true,
    label: spec.label,
    knockdowns: 0,
    flashT: 0,
    update(dt) {
      if (this.flashT > 0) {
        this.flashT -= dt;
        setFlash(mesh, this.flashT > 0 ? 1 : 0);
      }
      if (!this.alive) {
        down -= dt;
        mesh.rotation.x = THREE.MathUtils.damp(mesh.rotation.x, -Math.PI / 2.15, 7, dt);
        mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 0.15, 6, dt);
        updateHealthBar(mesh, 0, maxHp);
        if (down <= 0) this.revive();
        return;
      }
      mesh.rotation.x = THREE.MathUtils.damp(mesh.rotation.x, 0, 6, dt);
      mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 0, 8, dt);
      updateHealthBar(mesh, this.hp, maxHp);
    },
    onHit() { this.flashT = 0.12; },
    onDeath() {
      this.alive = false;
      this.knockdowns += 1;
      down = 1.7;
      this.flashT = 0.16;
    },
    revive() {
      this.hp = maxHp;
      this.alive = true;
      mesh.visible = true;
      mesh.rotation.x = 0;
      mesh.position.y = 0;
      updateHealthBar(mesh, this.hp, maxHp);
    },
  };
  return api;
}

function fallbackBody(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4, flatShading: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.7, 4, 8), mat);
  body.position.y = 0.9;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat);
  head.position.y = 1.55;
  g.add(body, head);
  return g;
}
