import * as THREE from 'three';
import { loadKitPart, styleSaber, neonMat, NEON } from './assets.js';

function edgeLines(mesh, color = NEON.cyan) {
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 28),
    new THREE.LineBasicMaterial({ color, toneMapped: false }),
  );
  lines.scale.copy(mesh.scale);
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  return lines;
}

function mesh(geo, mat, x, y, z, s = null) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (s) m.scale.set(s[0], s[1], s[2]);
  return m;
}

export async function createSamurai() {
  const plate = new THREE.MeshStandardMaterial({
    color: 0x9eb0c4,
    metalness: 0.86,
    roughness: 0.24,
    emissive: 0x123044,
    emissiveIntensity: 0.28,
    flatShading: true,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x141820,
    metalness: 0.55,
    roughness: 0.46,
    emissive: 0x0a1018,
    emissiveIntensity: 0.12,
    flatShading: true,
  });
  const cloth = new THREE.MeshStandardMaterial({
    color: 0x1a0c18,
    metalness: 0.12,
    roughness: 0.78,
    emissive: 0x3a1028,
    emissiveIntensity: 0.22,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const visorMat = neonMat(NEON.cyan, 2.2);
  const trim = neonMat(NEON.magenta, 1.5);

  const root = new THREE.Group();
  root.name = 'samurai';

  const bootGeo = new THREE.CapsuleGeometry(0.09, 0.12, 3, 6);
  root.add(mesh(bootGeo, dark, -0.15, 0.16, 0.08));
  root.add(mesh(bootGeo, dark, 0.15, 0.16, 0.08));

  const hakama = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.46, 0.66, 7), cloth);
  hakama.position.set(0, 0.4, 0.02);
  root.add(hakama);
  root.add(edgeLines(hakama, 0xff4ad4));

  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.016, 6, 18), trim);
  hem.rotation.x = Math.PI / 2;
  hem.position.set(0, 0.1, 0.02);
  root.add(hem);

  const obi = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.09, 8), trim);
  obi.position.y = 0.74;
  root.add(obi);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.44, 8), plate);
  torso.position.y = 1.02;
  root.add(torso);
  root.add(edgeLines(torso));

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), plate);
  chest.scale.set(1.15, 0.85, 0.5);
  chest.position.set(0, 1.08, 0.12);
  root.add(chest);

  const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), trim);
  emblem.position.set(0, 1.1, 0.2);
  root.add(emblem);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.08, 8), dark);
  neck.position.y = 1.28;
  root.add(neck);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 9), plate);
  helmet.scale.set(1.02, 1.12, 1.06);
  helmet.position.y = 1.5;
  root.add(helmet);
  root.add(edgeLines(helmet));

  const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.12, 0.4, 3), plate);
  crest.position.set(0, 1.82, -0.02);
  root.add(crest);
  const crestGlow = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.34, 0.02), visorMat);
  crestGlow.position.set(0, 1.84, 0.02);
  root.add(crestGlow);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.05), visorMat);
  visor.position.set(0, 1.48, 0.17);
  root.add(visor);

  const hornGeo = new THREE.ConeGeometry(0.045, 0.2, 6);
  const hornMat = neonMat(NEON.cyan, 1.3);
  const hornL = new THREE.Mesh(hornGeo, hornMat);
  hornL.position.set(-0.14, 1.64, 0.02);
  hornL.rotation.z = 0.85;
  const hornR = hornL.clone();
  hornR.position.x = 0.14;
  hornR.rotation.z = -0.85;
  root.add(hornL, hornR);

  const pauldronGeo = new THREE.SphereGeometry(0.13, 8, 6);
  for (const side of [-1, 1]) {
    const p = new THREE.Mesh(pauldronGeo, plate);
    p.scale.set(1.3, 0.62, 1.05);
    p.position.set(0.34 * side, 1.22, 0.02);
    root.add(p);
    root.add(edgeLines(p, NEON.magenta));
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 5), trim);
    spike.position.set(0.4 * side, 1.32, 0.02);
    spike.rotation.z = -0.4 * side;
    root.add(spike);
  }

  const armGeo = new THREE.CapsuleGeometry(0.055, 0.2, 3, 6);
  const armL = new THREE.Mesh(armGeo, dark);
  armL.position.set(-0.48, 1.02, 0.06);
  armL.rotation.z = 0.35;
  const armR = new THREE.Mesh(armGeo, dark);
  armR.position.set(0.5, 0.98, 0.1);
  armR.rotation.z = -0.9;
  armR.rotation.x = 0.3;
  root.add(armL, armR);

  const capeShape = new THREE.Shape();
  capeShape.moveTo(-0.32, 0);
  capeShape.lineTo(0.32, 0);
  capeShape.lineTo(0.46, -0.18);
  capeShape.lineTo(0.16, -1.02);
  capeShape.lineTo(-0.16, -1.02);
  capeShape.lineTo(-0.46, -0.18);
  const cape = new THREE.Mesh(new THREE.ShapeGeometry(capeShape), cloth);
  cape.position.set(0, 1.28, -0.2);
  root.add(cape);
  const lining = new THREE.Mesh(new THREE.ShapeGeometry(capeShape), trim);
  lining.position.set(0, 1.27, -0.23);
  lining.scale.set(1.04, 1.02, 1);
  root.add(lining);

  const pivot = new THREE.Group();
  pivot.name = 'swordPivot';
  pivot.position.set(-0.42, 0.98, 0.08);
  root.add(pivot);

  let saber = await loadKitPart('laserSabel', { height: 1.45 });
  if (saber) {
    styleSaber(saber, NEON.magenta);
    saber.rotation.set(0.15, 0.1, -0.15);
  } else {
    saber = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.25, 0.02), neonMat(NEON.magenta, 2.4));
    blade.position.y = 0.7;
    saber.add(blade);
  }
  pivot.add(saber);

  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 6, 14), chromeGuard());
  guard.position.y = 0.18;
  guard.rotation.x = Math.PI / 2;
  pivot.add(guard);

  root.userData.swordPivot = pivot;
  return root;
}

function chromeGuard() {
  return new THREE.MeshStandardMaterial({
    color: 0xe7eef6,
    metalness: 0.9,
    roughness: 0.16,
    emissive: 0x39f6ff,
    emissiveIntensity: 0.4,
  });
}

export function swingSword(avatar, dt, swing) {
  const pivot = avatar?.userData?.swordPivot;
  if (!pivot) return swing;
  const arc = Math.sin(Math.min(1, swing) * Math.PI);
  const heavy = swing > 0.72;
  pivot.rotation.z = arc * (heavy ? 1.35 : 0.95);
  pivot.rotation.x = 0.15 + arc * 0.55;
  if (swing > 0) return Math.max(0, swing - dt * (heavy ? 2.1 : 3.1));
  return 0;
}
