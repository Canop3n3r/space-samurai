import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const cache = new Map();

export const NEON = {
  cyan: 0x39f6ff,
  magenta: 0xff2bd6,
  chrome: 0xb8c4d8,
  dark: 0x12121f,
  orange: 0xff6a3d,
  green: 0x3dff9a,
};

function kitBase() {
  const base = (import.meta.env && import.meta.env.BASE_URL) || '/';
  return `${base}assets/free/opengameart/space-kit/Models/`;
}

export function neonMat(color = NEON.cyan, emissiveIntensity = 1.6) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity,
    metalness: 0.25,
    roughness: 0.22,
    toneMapped: false,
  });
}

export function chromeMat() {
  return new THREE.MeshStandardMaterial({
    color: NEON.chrome,
    metalness: 0.92,
    roughness: 0.2,
    emissive: 0x1a3044,
    emissiveIntensity: 0.18,
  });
}

function toStandard(material) {
  if (!material) {
    return new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.4, roughness: 0.5 });
  }
  if (material.isMeshStandardMaterial) {
    material.side = THREE.DoubleSide;
    return material;
  }
  const std = new THREE.MeshStandardMaterial({
    name: material.name || '',
    color: material.color ? material.color.clone() : new THREE.Color(0xffffff),
    map: material.map || null,
    emissive: material.emissive ? material.emissive.clone() : new THREE.Color(0x000000),
    emissiveMap: material.emissiveMap || null,
    emissiveIntensity: material.emissiveIntensity || 0,
    metalness: 0.42,
    roughness: 0.46,
    transparent: !!material.transparent,
    opacity: material.opacity ?? 1,
    side: THREE.DoubleSide,
  });
  if (std.map) {
    std.emissiveMap = std.map;
    std.emissive = new THREE.Color(0xffffff);
    std.emissiveIntensity = Math.max(std.emissiveIntensity, 0.38);
  }
  const n = (std.name || '').toLowerCase();
  if (n.includes('light') || n.includes('portal')) {
    std.emissive = new THREE.Color(NEON.cyan);
    std.emissiveIntensity = 1.15;
    std.toneMapped = false;
  } else if (n.includes('alien')) {
    std.emissive = new THREE.Color(0x39ff9a);
    std.emissiveIntensity = 0.85;
  } else if (n === 'glass') {
    std.transparent = true;
    std.opacity = Math.min(std.opacity, 0.72);
    std.emissive = new THREE.Color(0x183040);
    std.emissiveIntensity = 0.35;
    std.roughness = 0.12;
    std.metalness = 0.1;
  } else if (n === 'metal') {
    std.metalness = 0.78;
    std.roughness = 0.32;
    std.emissive = new THREE.Color(0x3a1a10);
    std.emissiveIntensity = 0.18;
  } else if (n === 'rock') {
    std.metalness = 0.08;
    std.roughness = 0.92;
    std.emissiveIntensity = 0.05;
  }
  return std;
}

function uniquifyMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (Array.isArray(o.material)) o.material = o.material.map((m) => toStandard(m));
    else o.material = toStandard(o.material);
  });
}

function loadTemplate(name) {
  if (cache.has(name)) return cache.get(name);
  const pending = new Promise((resolve, reject) => {
    const manager = new THREE.LoadingManager();
    let objResult = null;
    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      if (err || !objResult) reject(err || new Error(`missing ${name}`));
      else resolve(objResult);
    };
    manager.onLoad = () => finish();
    const base = kitBase();
    const mtlLoader = new MTLLoader(manager);
    mtlLoader.setPath(base);
    mtlLoader.setResourcePath(base);
    mtlLoader.setMaterialOptions({ side: THREE.DoubleSide });
    mtlLoader.load(
      `${name}.mtl`,
      (materials) => {
        materials.preload();
        const objLoader = new OBJLoader(manager);
        objLoader.setMaterials(materials);
        objLoader.setPath(base);
        objLoader.load(
          `${name}.obj`,
          (obj) => { objResult = obj; },
          undefined,
          (err) => finish(err),
        );
      },
      undefined,
      (err) => finish(err),
    );
    setTimeout(() => { if (objResult) finish(); }, 6000);
  }).catch((err) => {
    cache.delete(name);
    throw err;
  });
  cache.set(name, pending);
  return pending;
}

function fitInner(inner, { height, maxSize, nose } = {}) {
  inner.position.set(0, 0, 0);
  inner.rotation.set(0, 0, 0);
  inner.scale.set(1, 1, 1);
  inner.updateWorldMatrix(true, true);
  const raw = new THREE.Box3().setFromObject(inner);
  const size = raw.getSize(new THREE.Vector3());
  const limit = Math.max(size.x, size.y, size.z) || 1;
  let s = 1;
  if (height) s = height / (size.y || 1);
  else if (maxSize) s = maxSize / limit;
  inner.scale.setScalar(s);
  if (nose) {
    inner.updateWorldMatrix(true, true);
    const glass = new THREE.Vector3();
    let count = 0;
    inner.traverse((o) => {
      if (!o.isMesh) return;
      const mats = [].concat(o.material);
      if (!mats.some((m) => (m?.name || '').toLowerCase().includes('glass'))) return;
      const c = new THREE.Vector3();
      new THREE.Box3().setFromObject(o).getCenter(c);
      glass.add(c);
      count += 1;
    });
    if (count) {
      glass.multiplyScalar(1 / count);
      const mid = new THREE.Box3().setFromObject(inner).getCenter(new THREE.Vector3());
      const dir = glass.sub(mid);
      dir.y = 0;
      if (dir.lengthSq() > 1e-4) {
        const current = Math.atan2(dir.x, dir.z);
        const target = nose === '+z' ? 0 : Math.PI;
        inner.rotation.y = target - current;
      }
    }
  }
  inner.updateWorldMatrix(true, true);
  const fitted = new THREE.Box3().setFromObject(inner);
  const center = fitted.getCenter(new THREE.Vector3());
  inner.position.x -= center.x;
  inner.position.z -= center.z;
  inner.position.y -= fitted.min.y;
}

/**
 * Load one Kenney Space Kit OBJ with its MTL colors and textures.
 * The returned group is grounded and centered. `height` or `maxSize` is in meters.
 * `nose` turns the glass centroid toward -Z (player craft) or +Z (lookAt enemies).
 */
export async function loadKitPart(name, opts = {}) {
  try {
    const template = await loadTemplate(name);
    const inner = template.clone(true);
    uniquifyMaterials(inner);
    const wrapper = new THREE.Group();
    wrapper.name = name;
    wrapper.add(inner);
    fitInner(inner, opts);
    wrapper.userData.inner = inner;
    return wrapper;
  } catch (err) {
    console.warn('kit miss', name, err);
    return null;
  }
}

export function punchKit(root, amount = 0.42) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (!m?.color || !m.emissive) continue;
      const name = (m.name || '').toLowerCase();
      if (name === 'rock') {
        m.emissive.copy(m.color).multiplyScalar(0.25);
        m.emissiveIntensity = 0.2;
        continue;
      }
      m.emissive.copy(m.color);
      m.emissiveIntensity = Math.max(m.emissiveIntensity || 0, amount);
    }
  });
}

export function tintMaterials(root, color, amount = 0.45) {
  const target = new THREE.Color(color);
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (m?.color) m.color.lerp(target, amount);
    }
  });
}

export function styleHologram(root, color = NEON.cyan) {
  const c = new THREE.Color(color);
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (!m) continue;
      if (m.color) m.color.lerp(c, m.map ? 0.22 : 0.45);
      if (m.emissive) {
        m.emissive.copy(c);
        m.emissiveIntensity = m.map ? 0.28 : 0.5;
      }
      if (m.map) m.emissiveMap = m.map;
      m.transparent = true;
      m.opacity = 0.97;
      m.roughness = 0.25;
      m.metalness = 0.15;
    }
  });
}

export function styleSaber(root, color = NEON.magenta) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const next = [].concat(o.material).map((m) => {
      const n = (m?.name || '').toLowerCase();
      if (n.includes('alien') || n.includes('plant') || n.includes('blade')) {
        return neonMat(color, 2.4);
      }
      if (n.includes('glass') || n.includes('grip')) {
        return new THREE.MeshStandardMaterial({
          name: 'grip',
          color: 0x14141c,
          metalness: 0.35,
          roughness: 0.55,
          emissive: 0x1a0610,
          emissiveIntensity: 0.15,
        });
      }
      return new THREE.MeshStandardMaterial({
        name: 'guard',
        color: 0xdbe7f2,
        metalness: 0.88,
        roughness: 0.18,
        emissive: NEON.cyan,
        emissiveIntensity: 0.55,
      });
    });
    o.material = next.length === 1 ? next[0] : next;
  });
}

export function setFlash(root, amount) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (!m?.emissive) continue;
      if (!m.userData.baseEm) {
        m.userData.baseEm = m.emissive.clone();
        m.userData.baseEmI = m.emissiveIntensity ?? 0;
      }
      if (amount > 0) {
        m.emissive.set(0xffffff);
        m.emissiveIntensity = 1.6;
      } else {
        m.emissive.copy(m.userData.baseEm);
        m.emissiveIntensity = m.userData.baseEmI;
      }
    }
  });
}

export function loadTexture(file) {
  const tex = new THREE.TextureLoader().load(kitBase() + file);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
