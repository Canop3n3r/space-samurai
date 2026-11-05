import * as THREE from 'three';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createCombat } from './combat.js';
import { createUI } from './ui.js';
import { createDojoScene } from './scenes/dojo.js';
import { createStreetScene } from './scenes/street.js';
import { createFlightScene } from './scenes/flight.js';
import { createShip } from './ship.js';

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
  return { renderer, backend };
}

export async function boot(root = document) {
  const canvas = root.querySelector('#game');
  const { renderer, backend } = await makeRenderer(canvas);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 2, 6);
  const clock = new THREE.Clock();
  const input = createInput(root);
  const ui = createUI(root);

  const dojo = await createDojoScene();
  let street = null;
  let flight = null;
  let player = await createPlayer(dojo.scene);
  player.position.copy(dojo.spawn);
  let combat = createCombat(player);
  let ship = null;
  let phase = 'dojo'; // dojo | street | flight
  let activeScene = dojo.scene;
  let padShip = null;

  ui.setMode('DOJO');
  ui.setPrompt('Warm up on the dummies. Walk through the neon door when ready.');

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
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
      street = next;
      activeScene = street.scene;
      combat = createCombat(player);
      padShip = await createShip(street.scene, { position: street.shipPad.position.clone().add(new THREE.Vector3(0, 0.4, 0)) });
      phase = 'street';
      ui.setMode('STREET');
      ui.setPrompt('Street fight! Cut down the crew. Defeat the captain to unlock the pad ship.');
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
      ship = await createShip(flight.scene, { position: flight.spawn.clone() });
      activeScene = flight.scene;
      phase = 'flight';
      ui.setMode('FLIGHT');
      ui.setPrompt('6DOF flight — W/S thrust, mouse aim, A/D roll, Shift boost, LMB/FIRE guns. Find the glowing station.');
    } finally {
      transitioning = false;
    }
  }

  function targetsForCombat() {
    if (phase === 'dojo') return dojo.dummies;
    if (phase === 'street') return street.enemies;
    return [];
  }

  let lastPrompt = '';
  function tick() {
    const dt = Math.min(0.05, clock.getDelta());
    input.update();
    const actions = input.consume();

    if (transitioning) {
      renderer.render(activeScene, camera);
      requestAnimationFrame(tick);
      return;
    }

    if (phase === 'dojo' || (phase === 'street' && street)) {
      const targets = targetsForCombat();
      for (const t of targets) t.update?.(dt, player);
      combat.update(dt, actions, targets, activeScene, player.yaw());
      player.update(dt, input, camera, { lockedTarget: combat.lockedTarget });
      ui.setStamina(combat.stamina);
      ui.setLock(!!combat.lockedTarget);

      if (phase === 'dojo' && dojo.exitTrigger.contains(player.position)) {
        enterStreet();
      }
      if (phase === 'street') {
        if (street.captain && !street.captain.alive && !street.shipPad.ready) {
          street.onShipReady();
          ui.setPrompt('Captain down. Approach the pad and press E / BOARD to steal the ship.');
        }
        if (street.shipPad.ready && street.shipPad.contains(player.position)) {
          ui.setPrompt('Press E / BOARD to take the fighter.');
          if (actions.interact) boardShip();
        }
      }
    } else if (phase === 'flight' && ship && flight) {
      ship.update(dt, input, camera, { chasers: flight.chasers, actions });
      for (const c of flight.chasers) c.update(dt, ship.position);
      ui.setStamina(100);
      ui.setLock(false);
      const alive = flight.chasers.filter((c) => c.alive).length;
      if (alive === 0) {
        ui.setPrompt('Chasers clear. Free-fly the asteroid belt — station landmark glows cyan.');
      } else {
        ui.setPrompt(`Chasers remaining: ${alive}. Guns free.`);
      }
    }

    renderer.render(activeScene, camera);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  const api = {
    renderer,
    scene: activeScene,
    camera,
    clock,
    backend,
    get phase() { return phase; },
    player,
    combat,
    input,
    ui,
    dojo,
    get street() { return street; },
    get flight() { return flight; },
    get ship() { return ship; },
    enterStreet,
    boardShip,
    /** force helpers for smokes */
    async forceStreet() { await enterStreet(); },
    async forceBoard() {
      if (phase === 'dojo') await enterStreet();
      // wait until street exists
      while (!street) await new Promise((r) => setTimeout(r, 20));
      street.onShipReady();
      await boardShip();
      while (phase !== 'flight' || !ship) await new Promise((r) => setTimeout(r, 20));
    },
    forceKillCaptain() {
      if (!street) return false;
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
