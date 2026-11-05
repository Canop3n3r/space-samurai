import * as THREE from 'three';
import { neonMat, NEON, loadKitPart, placeholderAsteroid, placeholderShip } from '../assets.js';

export async function createFlightScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020208);
  scene.fog = new THREE.FogExp2(0x020208, 0.012);

  scene.add(new THREE.AmbientLight(0x334466, 0.6));
  const sun = new THREE.DirectionalLight(0xaaccff, 1.2);
  sun.position.set(20, 30, 10);
  scene.add(sun);
  const glow = new THREE.PointLight(0xff2bd6, 80, 120);
  glow.position.set(-30, 10, -40);
  scene.add(glow);

  // stars
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1200;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 400;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35 })));

  // station landmark (dojo station)
  const station = new THREE.Group();
  const core = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 6), chromeish());
  const disc = new THREE.Mesh(new THREE.TorusGeometry(8, 0.35, 8, 48), neonMat(NEON.cyan, 1.2));
  disc.rotation.x = Math.PI / 2;
  station.add(core, disc);
  const kitStation = await loadKitPart('buildingOpen', { scale: 4, tint: NEON.cyan });
  if (kitStation) {
    kitStation.position.set(0, -1, 0);
    station.add(kitStation);
  }
  station.position.set(0, 0, 40);
  scene.add(station);

  function chromeish() {
    return new THREE.MeshStandardMaterial({ color: 0x99aacc, metalness: 0.9, roughness: 0.25, emissive: 0x223355, emissiveIntensity: 0.3 });
  }

  // asteroids
  const asteroids = [];
  const rng = mulberry(42);
  const rockTemplate = await loadKitPart('rocks', { scale: 1, tint: 0x8899aa });
  for (let i = 0; i < 48; i++) {
    let rock;
    if (rockTemplate && i % 2 === 0) {
      rock = rockTemplate.clone(true);
      rock.scale.setScalar(1.5 + rng() * 2.5);
    } else {
      rock = placeholderAsteroid(rng);
    }
    rock.position.set(
      (rng() - 0.5) * 120,
      (rng() - 0.5) * 50,
      (rng() - 0.5) * 120 - 20,
    );
    rock.rotation.set(rng() * 6, rng() * 6, rng() * 6);
    scene.add(rock);
    asteroids.push(rock);
  }

  // chase ships
  const chasers = [];
  for (let i = 0; i < 2; i++) {
    let mesh = placeholderShip({ color: NEON.magenta });
    const kit = await loadKitPart(i === 0 ? 'spaceCraft2' : 'spaceCraft3', { scale: 0.45, tint: NEON.magenta });
    if (kit) { kit.rotation.y = Math.PI; mesh = kit; }
    const g = new THREE.Group();
    g.add(mesh);
    g.position.set((i === 0 ? -8 : 8), 3 + i, -15);
    scene.add(g);
    chasers.push({
      mesh: g,
      hp: 80,
      alive: true,
      offset: i === 0 ? -1 : 1,
      update(dt, playerPos) {
        if (!this.alive) return;
        const to = playerPos.clone().sub(g.position);
        const dist = to.length();
        if (dist > 1) {
          to.normalize();
          g.position.addScaledVector(to, 10 * dt);
          g.lookAt(playerPos);
        }
      },
    });
  }

  return {
    scene,
    asteroids,
    chasers,
    stationLandmark: station,
    spawn: new THREE.Vector3(0, 4, 0),
  };
}

function mulberry(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
