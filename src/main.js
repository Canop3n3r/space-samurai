import * as THREE from 'three';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createCombat } from './combat.js';
import { createUI } from './ui.js';
import { createDojoScene } from './scenes/dojo.js';
import { createStreetScene } from './scenes/street.js';
import { createFlightScene } from './scenes/flight.js';
import { createShip } from './ship.js';
import { billboardBars } from './fx.js';

const HELP = {
  DOJO: 'Click to look · WASD move · LMB light · RMB heavy · Space dodge · Q lock · neon door exits',
  STREET: 'Defeat the captain · walk to the pad · E / BOARD steals the fighter',
  FLIGHT: 'W/S thrust · mouse or arrows aim · A/D roll · Shift boost · LMB / F guns',
};

async function makeRenderer(canvas) {
  let renderer;
  let backend = 'webgl';
  try {
    const { WebGPURenderer } = await import('three/webgpu');
    renderer = new WebGPURenderer({ canvas, antialias: true });
    await renderer.init();
    backend = 'webgpu';
  } catch (e) {
    console.warn('WebGPU unavailable, falling back to WebGL', e);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x050510, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  return { renderer, backend };
}

export async function boot(root = document) {
  const canvas = root.querySelector('#game');
  const { renderer, backend } = await makeRenderer(canvas);
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
  camera.position.set(2, 3, 10);
  const clock = new THREE.Clock();
  const input = createInput(root);
  const ui = createUI(root);

  const dojo = await createDojoScene();
  let street = null;
  let flight = null;
  let player = await createPlayer(dojo.scene);
  player.position.copy(dojo.spawn);
  player.onDamaged = () => ui.flash();
  let combat = createCombat(player);
  let ship = null;
  let phase = 'dojo';
  let activeScene = dojo.scene;
  let padShip = null;
  let downFor = 0;

  ui.setMode('DOJO');
  ui.setHelp(HELP.DOJO);
  ui.setPrompt('Practice on the dummies — lock, strike, dodge. Leave through the neon door.');
  ui.setHealth(100, true);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);

  let transitioning = false;
  async function enterStreet() {
    if (phase !== 'dojo' || transitioning) return;
    transitioning = true;
    try {
      const next = await createStreetScene();
      dojo.scene.remove(player.mesh);
      next.scene.add(player.mesh);
      player.position.copy(next.spawn);
      player.resetLook();
      player.hp = player.maxHp;
      player.invuln = 0.6;
      street = next;
      activeScene = street.scene;
      combat = createCombat(player);
      padShip = await createShip(street.scene, {
        position: street.shipPad.position.clone().add(new THREE.Vector3(0, 0.2, 0)),
        maxSize: 4.6,
      });
      padShip.mesh.rotation.y = 0.8;
      phase = 'street';
      ui.setMode('STREET');
      ui.setHelp(HELP.STREET);
    } finally {
      transitioning = false;
    }
  }

  async function boardShip() {
    if (phase !== 'street' || !street?.shipPad.ready || transitioning) return;
    transitioning = true;
    try {
      const next = await createFlightScene();
      street.scene.remove(player.mesh);
      if (padShip) street.scene.remove(padShip.mesh);
      flight = next;
      ship = await createShip(flight.scene, { position: flight.spawn.clone(), maxSize: 4.2 });
      activeScene = flight.scene;
      phase = 'flight';
      camera.up.set(0, 1, 0);
      ui.setMode('FLIGHT');
      ui.setHelp(HELP.FLIGHT);
      ui.setTarget(null);
      ui.setLock(false);
    } finally {
      transitioning = false;
    }
  }

  function targetsForCombat() {
    if (phase === 'dojo') return dojo.dummies;
    if (phase === 'street') return street.enemies;
    return [];
  }

  function objective() {
    if (downFor > 0) return 'You went down. Back on your feet — keep your guard up.';
    if (phase === 'dojo') {
      const knocked = dojo.dummies.some((d) => d.knockdowns > 0);
      return knocked
        ? 'Dummy down. Walk through the neon door on the right when you want the street.'
        : 'Practice on the dummies. Lock on, light and heavy strikes, dodge. Then take the neon door.';
    }
    if (phase === 'street' && street) {
      const crew = street.enemies.filter((e) => e.alive && !e.isCaptain).length;
      if (!street.shipPad.ready) {
        return `Street fight. Defeat the captain to unlock the pad ship. Crew still up: ${crew}.`;
      }
      if (street.shipPad.contains(player.position)) return 'Press E / BOARD to steal the fighter.';
      return 'Captain down. Step onto the glowing pad and press E / BOARD.';
    }
    if (phase === 'flight' && flight) {
      const alive = flight.chasers.filter((c) => c.alive).length;
      return alive
        ? `Clear the chasers. Guns free — ${alive} left. The cyan station is the dojo.`
        : 'Chasers clear. Free flight. The cyan station ahead is the dojo landmark.';
    }
    return '';
  }

  function tick() {
    const dt = Math.min(0.05, clock.getDelta());
    input.update();
    const actions = input.consume();
    if (downFor > 0) downFor = Math.max(0, downFor - dt);

    if (!transitioning && (phase === 'dojo' || phase === 'street')) {
      const targets = targetsForCombat();
      const bounds = phase === 'dojo' ? dojo.bounds : street.bounds;
      player.step(dt, input, { lockedTarget: combat.lockedTarget, bounds });
      for (const t of targets) t.update?.(dt, player);
      combat.update(dt, actions, targets, activeScene, player.yaw());
      player.frameCamera(dt, camera, { lockedTarget: combat.lockedTarget });
      billboardBars(targets, camera);
      ui.setStamina(combat.stamina);
      ui.setHealth(player.hp, true);
      ui.setLock(!!combat.lockedTarget);
      if (combat.lockedTarget) {
        const t = combat.lockedTarget;
        ui.setTarget(t.label || 'Target', (t.hp / t.maxHp) * 100);
      } else ui.setTarget(null);

      if (player.hp <= 0) {
        player.hp = player.maxHp;
        player.invuln = 1.5;
        player.position.copy(phase === 'street' ? street.spawn : dojo.spawn);
        downFor = 2.4;
        ui.flash();
      }

      if (phase === 'dojo' && dojo.exitTrigger.contains(player.position)) enterStreet();
      if (phase === 'street' && street.captain && !street.captain.alive && !street.shipPad.ready) {
        street.onShipReady();
      }
      if (phase === 'street' && street.shipPad.ready && street.shipPad.contains(player.position) && actions.interact) {
        boardShip();
      }
    } else if (!transitioning && phase === 'flight' && ship && flight) {
      ship.update(dt, input, camera, { chasers: flight.chasers, actions });
      for (const c of flight.chasers) c.update(dt, ship.position);
      flight.update(dt);
      billboardBars(flight.chasers, camera);
      ui.setStamina(100);
      ui.setHealth(100, false);
      ui.setLock(false);
      ui.setTarget(null);
    }

    ui.setPrompt(objective());
    renderer.render(activeScene, camera);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  const api = {
    renderer,
    get scene() { return activeScene; },
    camera,
    clock,
    backend,
    get phase() { return phase; },
    player,
    get combat() { return combat; },
    input,
    ui,
    dojo,
    get street() { return street; },
    get flight() { return flight; },
    get ship() { return ship; },
    enterStreet,
    boardShip,
    async forceStreet() { await enterStreet(); },
    async forceBoard() {
      if (phase === 'dojo') await enterStreet();
      while (!street) await new Promise((r) => setTimeout(r, 20));
      street.onShipReady();
      await boardShip();
      while (phase !== 'flight' || !ship) await new Promise((r) => setTimeout(r, 20));
    },
    forceKillCaptain() {
      if (!street?.captain) return false;
      street.captain.hp = 0;
      street.captain.alive = false;
      street.captain.onDeath?.();
      street.onShipReady();
      return street.shipPad.ready;
    },
  };
  window.__SS = api;
  console.info(`[space-samurai] boot ok (${backend})`);
  return api;
}

boot().catch((e) => {
  console.error(e);
  const p = document.querySelector('#prompt');
  if (p) p.textContent = 'Boot failed — see console';
});
