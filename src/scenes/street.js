import * as THREE from 'three';
import { neonMat, NEON, loadKitPart, punchKit } from '../assets.js';
import { createEnemy } from '../enemy.js';

export async function createStreetScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07060f);
  scene.fog = new THREE.FogExp2(0x07060f, 0.016);

  scene.add(new THREE.HemisphereLight(0xc9d6ff, 0x2a0818, 1.55));
  const sun = new THREE.DirectionalLight(0xfff0dd, 2.4);
  sun.position.set(8, 14, 10);
  scene.add(sun);
  const neonA = new THREE.PointLight(NEON.magenta, 30, 36, 2);
  neonA.position.set(-8, 6, 4);
  const neonB = new THREE.PointLight(NEON.cyan, 28, 34, 2);
  neonB.position.set(8, 5, -4);
  scene.add(neonA, neonB);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.MeshStandardMaterial({
      color: 0x10131c,
      metalness: 0.7,
      roughness: 0.42,
      emissive: 0x0c1018,
      emissiveIntensity: 0.2,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const lane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 36),
    neonMat(NEON.cyan, 1.1),
  );
  lane.rotation.x = -Math.PI / 2;
  lane.position.set(0, 0.03, 0);
  scene.add(lane);

  const grid = new THREE.GridHelper(60, 30, 0x245056, 0x121624);
  grid.position.y = 0.015;
  scene.add(grid);

  const kitNames = ['buildingOpen', 'buildingCorner', 'buildingCorridor', 'buildingCorridorOpen'];
  const templates = {};
  await Promise.all(kitNames.map(async (name) => {
    templates[name] = await loadKitPart(name, { height: 9.5 });
  }));

  const layout = [
    ['buildingOpen', -11.5, 6, 0.15],
    ['buildingCorner', -11.5, -4, 1.1],
    ['buildingCorridor', -12, -13, 0.4],
    ['buildingOpen', 11.5, 5, Math.PI],
    ['buildingCorner', 12, -5, -0.5],
    ['buildingCorridorOpen', 11.5, -14, 2.2],
  ];
  for (const [name, x, z, rot] of layout) {
    const src = templates[name];
    if (!src) continue;
    const obj = src.clone(true);
    punchKit(obj, 0.5);
    obj.position.set(x, 0, z);
    obj.rotation.y = rot;
    scene.add(obj);
  }

  const barrel = await loadKitPart('barrelLarge', { height: 1.3 });
  if (barrel) {
    barrel.position.set(-3.2, 0, 6);
    scene.add(barrel);
    const b2 = barrel.clone(true);
    b2.position.set(3.4, 0, 1.5);
    scene.add(b2);
  }

  const spots = [
    new THREE.Vector3(-2.2, 0, 5.2),
    new THREE.Vector3(1.4, 0, 4.4),
    new THREE.Vector3(-1.8, 0, 1.2),
    new THREE.Vector3(1.6, 0, -1.4),
    new THREE.Vector3(-2.2, 0, -3.6),
  ];
  const enemies = [];
  for (const s of spots) enemies.push(await createEnemy(scene, { position: s }));
  const captain = await createEnemy(scene, { position: new THREE.Vector3(0.2, 0, -6.4), isCaptain: true });
  enemies.push(captain);
  for (const e of enemies) e.friends = enemies;

  const padPos = new THREE.Vector3(4.6, 0, 2.4);
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(3.1, 3.4, 0.22, 28),
    new THREE.MeshStandardMaterial({
      color: 0x242838,
      metalness: 0.82,
      roughness: 0.28,
      emissive: NEON.cyan,
      emissiveIntensity: 0.28,
    }),
  );
  pad.position.copy(padPos);
  pad.position.y = 0.11;
  scene.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.07, 8, 40), neonMat(NEON.magenta, 1.6));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(padPos.x, 0.28, padPos.z);
  scene.add(ring);
  const padLight = new THREE.PointLight(NEON.cyan, 12, 12, 2);
  padLight.position.set(padPos.x, 2.2, padPos.z);
  scene.add(padLight);

  const shipPad = {
    position: padPos.clone(),
    ready: false,
    contains(pos) {
      return pos.distanceTo(padPos) < 3.6;
    },
  };

  function onShipReady() {
    shipPad.ready = true;
    ring.material = neonMat(NEON.green, 1.8);
    pad.material.emissive = new THREE.Color(NEON.green);
  }

  return {
    scene,
    enemies,
    captain,
    shipPad,
    onShipReady,
    spawn: new THREE.Vector3(0, 0, 9.2),
    bounds: { minX: -18, maxX: 18, minZ: -16, maxZ: 18 },
  };
}
