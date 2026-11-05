import * as THREE from 'three';
import { neonMat, chromeMat, NEON, loadKitPart } from '../assets.js';
import { createDummy } from '../dummy.js';

export async function createDojoScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);
  scene.fog = new THREE.FogExp2(0x050510, 0.035);

  const hemi = new THREE.HemisphereLight(0x66ccff, 0x220033, 1.1);
  const key = new THREE.PointLight(0xff2bd6, 40, 40);
  key.position.set(2, 5, 2);
  const fill = new THREE.PointLight(0x39f6ff, 30, 40);
  fill.position.set(-3, 4, -2);
  scene.add(hemi, key, fill);

  // floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ color: 0x0b0b18, metalness: 0.6, roughness: 0.4, emissive: 0x101828, emissiveIntensity: 0.3 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // neon grid lines
  const grid = new THREE.GridHelper(24, 24, 0x39f6ff, 0x1a2040);
  grid.position.y = 0.01;
  scene.add(grid);

  // walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x12121f, metalness: 0.5, roughness: 0.55, emissive: 0x1a1030, emissiveIntensity: 0.25 });
  function wall(w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  }
  wall(24, 5, 0.4, 0, 2.5, -12);
  wall(24, 5, 0.4, 0, 2.5, 12);
  wall(0.4, 5, 24, -12, 2.5, 0);
  wall(0.4, 5, 10, 12, 2.5, -7);
  wall(0.4, 5, 10, 12, 2.5, 7);
  // doorway gap on +X toward street
  const doorGlow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 3.2), neonMat(NEON.cyan, 1.2));
  doorGlow.position.set(11.7, 1.6, 0);
  scene.add(doorGlow);

  // neon trim
  const trim = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.05, 8, 48), neonMat(NEON.magenta, 1.5));
  trim.rotation.x = Math.PI / 2;
  trim.position.set(0, 0.05, 0);
  scene.add(trim);

  // props from kit
  const console = await loadKitPart('console', { scale: 1.4, tint: NEON.cyan });
  if (console) { console.position.set(-4, 0, -4); scene.add(console); }
  const barrel = await loadKitPart('barrel', { scale: 1.2, tint: NEON.orange });
  if (barrel) { barrel.position.set(4, 0, -5); scene.add(barrel); }

  const dummies = [
    createDummy(scene, new THREE.Vector3(-3, 0, -2)),
    createDummy(scene, new THREE.Vector3(0, 0, -4)),
    createDummy(scene, new THREE.Vector3(3, 0, -2)),
  ];

  const exitTrigger = {
    contains(pos) {
      return pos.x > 10.5 && Math.abs(pos.z) < 1.6;
    },
  };

  return { scene, dummies, exitTrigger, spawn: new THREE.Vector3(0, 0, 3) };
}
