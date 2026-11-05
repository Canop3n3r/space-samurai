import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const loader = new OBJLoader();
const cache = new Map();

const NEON = {
  cyan: 0x39f6ff,
  magenta: 0xff2bd6,
  chrome: 0xb8c4d8,
  dark: 0x12121f,
  orange: 0xff6a3d,
};

export function neonMat(color = NEON.cyan, emissiveIntensity = 0.85) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.7,
    roughness: 0.25,
    emissive: color,
    emissiveIntensity,
  });
}

export function chromeMat() {
  return new THREE.MeshStandardMaterial({
    color: NEON.chrome,
    metalness: 0.95,
    roughness: 0.18,
    emissive: 0x223344,
    emissiveIntensity: 0.2,
  });
}

export function applyNeon(root, tint = NEON.cyan) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const base = o.material?.color ? o.material.color.getHex() : tint;
    o.material = new THREE.MeshStandardMaterial({
      color: base,
      metalness: 0.65,
      roughness: 0.35,
      emissive: tint,
      emissiveIntensity: 0.35,
    });
    o.castShadow = false;
    o.receiveShadow = false;
  });
  return root;
}

function loadObj(url) {
  if (cache.has(url)) return cache.get(url);
  const p = new Promise((resolve, reject) => {
    loader.load(
      url,
      (obj) => resolve(obj),
      undefined,
      (err) => reject(err),
    );
  });
  cache.set(url, p);
  return p;
}

const KIT = `${import.meta.env.BASE_URL}assets/free/opengameart/space-kit/Models`;

export async function loadKitPart(name, { scale = 1, tint = NEON.cyan } = {}) {
  try {
    const obj = await loadObj(`${KIT}/${name}.obj`);
    const clone = obj.clone(true);
    clone.scale.setScalar(scale);
    applyNeon(clone, tint);
    clone.name = name;
    return clone;
  } catch (e) {
    console.warn('kit miss', name, e);
    return null;
  }
}

export function placeholderCapsule({ color = NEON.chrome, height = 1.7, radius = 0.35 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(radius, height - radius * 2, 4, 8), chromeMat());
  body.position.y = height / 2;
  g.add(body);
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.05, 0.04),
    neonMat(NEON.magenta, 1.4),
  );
  blade.position.set(0.45, height * 0.65, 0);
  blade.name = 'blade';
  g.add(blade);
  g.userData.height = height;
  return g;
}

export function placeholderDummy() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 8), chromeMat());
  pole.position.y = 0.8;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), neonMat(NEON.cyan, 0.5));
  head.position.y = 1.7;
  g.add(pole, head);
  return g;
}

export function placeholderShip({ color = NEON.orange } = {}) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.4, 6), neonMat(color, 0.4));
  hull.rotation.x = Math.PI / 2;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.7), chromeMat());
  wing.position.z = 0.2;
  const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.5, 8), neonMat(NEON.cyan, 1.2));
  engine.rotation.x = Math.PI / 2;
  engine.position.z = 1.15;
  g.add(hull, wing, engine);
  return g;
}

export function placeholderAsteroid(rng = Math.random) {
  const geo = new THREE.IcosahedronGeometry(0.8 + rng() * 1.6, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6a7080,
    metalness: 0.2,
    roughness: 0.85,
    flatShading: true,
    emissive: 0x1a2030,
    emissiveIntensity: 0.15,
  });
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(0.6 + rng(), 0.5 + rng(), 0.6 + rng());
  return m;
}

export { NEON };
