import * as THREE from 'three';
import { neonMat, NEON, loadKitPart, chromeMat } from '../assets.js';
import { createEnemy } from '../enemy.js';

export async function createStreetScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04040c);
  scene.fog = new THREE.FogExp2(0x04040c, 0.028);

  scene.add(new THREE.HemisphereLight(0x6688ff, 0x220011, 0.9));
  const neonA = new THREE.PointLight(0xff2bd6, 55, 50); neonA.position.set(-6, 6, 4); scene.add(neonA);
  const neonB = new THREE.PointLight(0x39f6ff, 55, 50); neonB.position.set(8, 5, -3); scene.add(neonB);
  const neonC = new THREE.PointLight(0xff6a3d, 35, 40); neonC.position.set(0, 4, 10); scene.add(neonC);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x0a0a14, metalness: 0.7, roughness: 0.35, emissive: 0x10101c, emissiveIntensity: 0.25 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  scene.add(new THREE.GridHelper(60, 40, 0x39f6ff, 0x151528));

  // buildings
  function building(x, z, w, h, d, color) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.4, emissive: color, emissiveIntensity: 0.15 }),
    );
    m.position.set(x, h / 2, z);
    scene.add(m);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.12, 0.12), neonMat(NEON.cyan, 1.3));
    strip.position.set(x, h * 0.7, z + d / 2 + 0.05);
    scene.add(strip);
  }
  building(-14, -8, 8, 10, 8, 0x1a1028);
  building(-14, 8, 7, 14, 7, 0x101828);
  building(14, -6, 9, 12, 8, 0x201018);
  building(16, 10, 6, 8, 10, 0x12121f);

  // kit structures
  for (const [name, pos, scale] of [
    ['buildingOpen', new THREE.Vector3(-6, 0, -10), 2.5],
    ['buildingCorner', new THREE.Vector3(6, 0, -12), 2.2],
    ['barrelLarge', new THREE.Vector3(2, 0, 4), 1.4],
  ]) {
    const p = await loadKitPart(name, { scale, tint: NEON.cyan });
    if (p) { p.position.copy(pos); scene.add(p); }
  }

  // enemies — fight already on
  const enemies = [];
  const spots = [
    new THREE.Vector3(2, 0, -3),
    new THREE.Vector3(-2, 0, -5),
    new THREE.Vector3(4, 0, 2),
    new THREE.Vector3(-4, 0, 1),
    new THREE.Vector3(1, 0, 5),
  ];
  for (const s of spots) enemies.push(await createEnemy(scene, { position: s }));
  const captain = await createEnemy(scene, { position: new THREE.Vector3(0, 0, -8), isCaptain: true });
  enemies.push(captain);

  // ship pad
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.5, 0.25, 24),
    new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.8, roughness: 0.3, emissive: 0x39f6ff, emissiveIntensity: 0.25 }),
  );
  pad.position.set(8, 0.12, 8);
  scene.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.06, 8, 40), neonMat(NEON.magenta, 1.4));
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(pad.position).add(new THREE.Vector3(0, 0.2, 0));
  scene.add(ring);

  const shipPad = {
    position: pad.position.clone(),
    ready: false,
    contains(pos) {
      return pos.distanceTo(pad.position) < 3.5;
    },
  };

  function onShipReady() {
    shipPad.ready = true;
  }

  return {
    scene,
    enemies,
    captain,
    shipPad,
    onShipReady,
    spawn: new THREE.Vector3(-8, 0, 0),
  };
}
