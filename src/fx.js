import * as THREE from 'three';
import { NEON, neonMat } from './assets.js';

export function attachHealthBar(mesh, color = NEON.cyan, y = 2.05) {
  const g = new THREE.Group();
  g.name = 'hpbar';
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.09),
    new THREE.MeshBasicMaterial({ color: 0x12080e, depthTest: false, transparent: true, opacity: 0.9 }),
  );
  const fg = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.05),
    new THREE.MeshBasicMaterial({ color, depthTest: false }),
  );
  fg.position.z = 0.01;
  g.add(bg, fg);
  g.position.y = y;
  g.renderOrder = 20;
  mesh.add(g);
  g.userData.fg = fg;
  return g;
}

export function updateHealthBar(mesh, hp, max) {
  const bar = mesh.getObjectByName('hpbar');
  if (!bar) return;
  const t = Math.max(0, Math.min(1, hp / Math.max(1, max)));
  const fg = bar.userData.fg;
  fg.scale.x = Math.max(0.001, t);
  fg.position.x = (t - 1) * 0.36;
  bar.visible = hp < max || t <= 0;
}

export function billboardBars(list, camera) {
  const camQ = new THREE.Quaternion();
  camera.getWorldQuaternion(camQ);
  const parentQ = new THREE.Quaternion();
  for (const entry of list) {
    const mesh = entry?.mesh;
    const bar = mesh?.getObjectByName('hpbar');
    if (!bar?.parent) continue;
    bar.parent.getWorldQuaternion(parentQ);
    bar.quaternion.copy(parentQ.invert()).multiply(camQ);
  }
}

export function spawnSparks(scene, position, color = NEON.cyan, count = 12) {
  const mat = new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const sparks = [];
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045 + Math.random() * 0.04, 5, 4), mat);
    m.position.copy(position);
    m.position.y += 1.05;
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 7,
      Math.random() * 5 + 1.2,
      (Math.random() - 0.5) * 7,
    );
    group.add(m);
    sparks.push({ m, vel });
  }
  scene.add(group);
  const started = performance.now();
  const step = () => {
    const dt = 0.016;
    for (const s of sparks) {
      s.vel.y -= 12 * dt;
      s.m.position.addScaledVector(s.vel, dt);
      s.m.scale.multiplyScalar(0.96);
    }
    if (performance.now() - started < 420) requestAnimationFrame(step);
    else {
      scene.remove(group);
      mat.dispose();
    }
  };
  requestAnimationFrame(step);
}

export function makeShadow(radius = 0.46) {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 18),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  return mesh;
}

export function slashMaterial(color = NEON.magenta) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

export { neonMat };
