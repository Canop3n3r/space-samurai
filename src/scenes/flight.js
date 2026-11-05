import * as THREE from 'three';
import { neonMat, NEON, loadKitPart, tintMaterials, setFlash, punchKit } from '../assets.js';
import { attachHealthBar, updateHealthBar } from '../fx.js';

export async function createFlightScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02020c);
  scene.fog = new THREE.FogExp2(0x02020c, 0.0028);

  scene.add(new THREE.AmbientLight(0x9eb4d8, 0.95));
  const sun = new THREE.DirectionalLight(0xe7f0ff, 2.3);
  sun.position.set(30, 40, 20);
  scene.add(sun);
  const nebula = new THREE.PointLight(NEON.magenta, 40, 180, 2);
  nebula.position.set(-40, 12, -30);
  scene.add(nebula);

  const starGeo = new THREE.BufferGeometry();
  const starCount = 900;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 40 + Math.random() * 220;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 1.7, sizeAttenuation: false,
  })));

  const station = new THREE.Group();
  station.name = 'dojo-station';
  const core = await loadKitPart('stationLarge', { height: 16 });
  if (core) {
    punchKit(core, 0.55);
    station.add(core);
  }
  const dish = await loadKitPart('satelliteDish', { height: 6 });
  if (dish) {
    dish.position.set(6, 0, 2);
    station.add(dish);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(14, 0.35, 8, 56), neonMat(NEON.cyan, 1.8));
  ring.rotation.x = Math.PI / 2.4;
  ring.position.y = 5;
  station.add(ring);
  station.position.set(0, 2, -58);
  scene.add(station);
  const beacon = new THREE.PointLight(NEON.cyan, 80, 90, 2);
  beacon.position.set(0, 10, -58);
  scene.add(beacon);

  const rockNames = ['rocks', 'rocksTall', 'rocksSmall', 'meteorFull', 'meteorHalf', 'rocksOre'];
  const rockTemplates = [];
  for (const name of rockNames) {
    const part = await loadKitPart(name, { maxSize: 1 });
    if (part) rockTemplates.push(part);
  }
  const asteroids = [];
  const rng = mulberry(42);
  for (let i = 0; i < 36; i++) {
    let rock;
    if (rockTemplates.length) {
      const src = rockTemplates[i % rockTemplates.length];
      rock = src.clone(true);
      punchKit(rock, 0.22);
      rock.scale.setScalar(4 + rng() * 8);
    } else {
      rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.4, 0),
        new THREE.MeshStandardMaterial({ color: 0x8a7568, flatShading: true, roughness: 0.9 }),
      );
    }
    const pos = new THREE.Vector3(
      (rng() - 0.5) * 90,
      (rng() - 0.45) * 28,
      -16 - rng() * 55,
    );
    if (pos.length() < 14) pos.z -= 16;
    if (pos.z < -36 && Math.abs(pos.x) < 16) pos.x += pos.x >= 0 ? 20 : -20;
    rock.position.copy(pos);
    rock.rotation.set(rng() * 6, rng() * 6, rng() * 6);
    rock.userData.spin = new THREE.Vector3(rng() * 0.2, rng() * 0.35, rng() * 0.15);
    scene.add(rock);
    asteroids.push(rock);
  }

  const chasers = [];
  const crafts = ['spaceCraft2', 'spaceCraft3'];
  for (let i = 0; i < 2; i++) {
    let mesh = await loadKitPart(crafts[i], { maxSize: 5.2, nose: '+z' });
    if (!mesh) {
      mesh = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.2, 4), neonMat(NEON.magenta, 0.5));
    }
    tintMaterials(mesh, i === 0 ? NEON.magenta : NEON.orange, 0.28);
    punchKit(mesh, 0.48);
    const g = new THREE.Group();
    g.add(mesh);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), neonMat(NEON.magenta, 2));
    glow.position.set(0, 0.3, -1.1);
    g.add(glow);
    g.position.set(i === 0 ? -7 : 8, 1.2 + i, -16 - i * 4);
    scene.add(g);
    const box = new THREE.Box3().setFromObject(g);
    const radius = box.getSize(new THREE.Vector3()).length() * 0.22;
    attachHealthBar(g, NEON.magenta, 1.8);
    chasers.push({
      mesh: g,
      hp: 100,
      maxHp: 100,
      alive: true,
      radius,
      flashT: 0,
      dying: 0,
      angle: i * 1.8,
      offset: i === 0 ? -1 : 1,
      label: `Chaser ${i + 1}`,
      update(dt, playerPos) {
        if (this.flashT > 0) {
          this.flashT -= dt;
          setFlash(g, this.flashT > 0 ? 1 : 0);
        }
        updateHealthBar(g, Math.max(0, this.hp), this.maxHp);
        if (!this.alive) {
          this.dying -= dt;
          g.rotateZ(dt * 2.4);
          g.position.y -= dt * 3;
          if (this.dying <= 0) g.visible = false;
          return;
        }
        this.angle += dt * 0.45;
        const desired = playerPos.clone();
        desired.x += Math.cos(this.angle) * 12 * this.offset;
        desired.y += 1.2 + Math.sin(this.angle * 0.8) * 2.4;
        desired.z += -16 + Math.sin(this.angle) * 5;
        const steer = desired.sub(g.position);
        if (steer.lengthSq() > 0.05) {
          const dist = steer.length();
          steer.multiplyScalar(1 / dist);
          g.position.addScaledVector(steer, Math.min(14, dist) * dt);
          const look = g.position.clone().add(steer);
          g.lookAt(look);
        }
      },
    });
  }

  return {
    scene,
    asteroids,
    chasers,
    stationLandmark: station,
    spawn: new THREE.Vector3(0, 5, 0),
    update(dt) {
      for (const rock of asteroids) {
        const s = rock.userData.spin;
        if (!s) continue;
        rock.rotation.x += s.x * dt;
        rock.rotation.y += s.y * dt;
        rock.rotation.z += s.z * dt;
      }
    },
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
