import * as THREE from 'three';
import { neonMat, NEON, loadKitPart, loadTexture } from '../assets.js';
import { createDummy } from '../dummy.js';

export async function createDojoScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070814);
  scene.fog = new THREE.FogExp2(0x070814, 0.022);

  scene.add(new THREE.HemisphereLight(0xd5e6ff, 0x2a1020, 1.7));
  const sun = new THREE.DirectionalLight(0xfff4e4, 2.6);
  sun.position.set(-6, 12, 8);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x39f6ff, 0.7);
  rim.position.set(8, 5, -6);
  scene.add(rim);
  const mag = new THREE.PointLight(NEON.magenta, 18, 22, 2);
  mag.position.set(-2, 3.2, 1);
  const cyan = new THREE.PointLight(NEON.cyan, 16, 20, 2);
  cyan.position.set(4, 3.4, -2);
  scene.add(mag, cyan);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 18),
    new THREE.MeshStandardMaterial({
      color: 0x141824,
      metalness: 0.72,
      roughness: 0.4,
      emissive: 0x10131c,
      emissiveIntensity: 0.25,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(20, 20, 0x39f6ff, 0x1a2744);
  grid.position.y = 0.02;
  scene.add(grid);

  const practice = new THREE.Mesh(
    new THREE.TorusGeometry(3.3, 0.045, 8, 48),
    neonMat(NEON.magenta, 1.4),
  );
  practice.rotation.x = Math.PI / 2;
  practice.position.set(0, 0.05, 0.2);
  scene.add(practice);

  const net = loadTexture('Textures/net.png');
  net.repeat.set(3, 1.2);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x41566e,
    map: net,
    emissiveMap: net,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.22,
    metalness: 0.62,
    roughness: 0.42,
  });
  const trimMat = neonMat(NEON.cyan, 1.5);

  function panel(w, h, x, y, z, rotY = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.28), wallMat);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    scene.add(m);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.34), trimMat);
    trim.position.set(x, y + h / 2, z);
    trim.rotation.y = rotY;
    scene.add(trim);
    return m;
  }

  // Back wall has a gap for the neon door, straight ahead of spawn.
  panel(6.2, 3.5, -5.3, 1.75, -6.6);
  panel(6.2, 3.5, 5.3, 1.75, -6.6);
  panel(12.5, 3.5, -9.2, 1.75, 0.2, Math.PI / 2);
  panel(12.5, 3.5, 9.2, 1.75, 0.2, Math.PI / 2);
  doorFrame(scene, 0, -6.55);

  const [pillar, portal, console, barrel, screen, frame] = await Promise.all([
    loadKitPart('metalStructure', { height: 3.4 }),
    loadKitPart('portal', { height: 3.35 }),
    loadKitPart('console', { height: 1.15 }),
    loadKitPart('barrel', { height: 0.85 }),
    loadKitPart('consoleScreen', { height: 1.7 }),
    loadKitPart('frameHigh', { height: 3.1 }),
  ]);

  function drop(obj, x, z, rot = 0) {
    if (!obj) return null;
    obj.position.set(x, 0, z);
    obj.rotation.y = rot;
    scene.add(obj);
    return obj;
  }

  if (pillar) {
    drop(pillar, -6.4, -4.6);
    for (const [x, z, rot] of [[6.4, -4.6, 0.6], [-6.4, 5.4, 1.2], [6.2, 5.6, 0.4]]) {
      const copy = pillar.clone(true);
      drop(copy, x, z, rot);
    }
  }
  if (frame) {
    drop(frame, -6.4, -4.8, 0.15);
    const frameB = frame.clone(true);
    drop(frameB, 6.4, -4.8, -0.15);
  }
  drop(portal, 0, -6.35, Math.PI);
  drop(console, -5.2, -4.4, 0.4);
  drop(barrel, 4.6, -3.6, 0.8);
  drop(screen, -6.6, 2.2, Math.PI / 2);

  hangLamp(scene, -3.2, 3.15, 2.4, NEON.magenta);
  hangLamp(scene, 2.6, 3.15, -1.6, NEON.cyan);
  hangLamp(scene, 0.2, 3.2, 4.6, NEON.cyan);

  const dummies = await Promise.all([
    createDummy(scene, new THREE.Vector3(-3.1, 0, 1.1), 'astronaut'),
    createDummy(scene, new THREE.Vector3(0, 0, -2.5), 'alien'),
    createDummy(scene, new THREE.Vector3(3.1, 0, 1.1), 'robot'),
  ]);

  const exitTrigger = {
    contains(pos) {
      return pos.z < -5.55 && Math.abs(pos.x) < 1.7;
    },
  };

  return {
    scene,
    dummies,
    exitTrigger,
    spawn: new THREE.Vector3(0, 0, 4.6),
    bounds: { minX: -8.2, maxX: 8.2, minZ: -8.2, maxZ: 6.6 },
  };
}

function doorFrame(scene, x, z) {
  const post = new THREE.BoxGeometry(0.14, 3.25, 0.14);
  const cyan = neonMat(NEON.cyan, 2.1);
  const left = new THREE.Mesh(post, cyan);
  left.position.set(x - 1.35, 1.62, z);
  const right = left.clone();
  right.position.x = x + 1.35;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.14, 0.14), neonMat(NEON.magenta, 1.8));
  lintel.position.set(x, 3.2, z);
  scene.add(left, right, lintel);
  const glow = new THREE.PointLight(NEON.cyan, 14, 10, 2);
  glow.position.set(x, 1.8, z + 1.2);
  scene.add(glow);
}

function hangLamp(scene, x, y, z, color) {
  const group = new THREE.Group();
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6),
    new THREE.MeshStandardMaterial({ color: 0x22222c }),
  );
  cord.position.y = 0.35;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), neonMat(color, 2));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 6, 18), neonMat(color, 1.2));
  ring.rotation.x = Math.PI / 2;
  group.add(cord, bulb, ring);
  group.position.set(x, y, z);
  scene.add(group);
  const light = new THREE.PointLight(color, 6, 8, 2);
  light.position.set(x, y, z);
  scene.add(light);
}
