import * as THREE from 'three';

export function createInput(dom) {
  const move = new THREE.Vector2();
  const look = new THREE.Vector2();
  const keys = new Set();
  const state = {
    move,
    look,
    light: false,
    heavy: false,
    dodge: false,
    lock: false,
    interact: false,
    fire: false,
    pointerLocked: false,
  };

  const canvas = dom.querySelector('#game');
  const touchRoot = dom.querySelector('#touch');
  const stick = dom.querySelector('#stick');
  const knob = dom.querySelector('#stick-knob');

  function onKey(e, down) {
    if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
    const k = e.code;
    if (down) keys.add(k); else keys.delete(k);
    if (down) {
      if (k === 'KeyE') state.interact = true;
      if (k === 'KeyQ') state.lock = true;
      if (k === 'Space') { state.dodge = true; e.preventDefault(); }
      if (k === 'KeyF') state.fire = true;
    }
  }

  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  canvas.addEventListener('click', () => {
    if (canvas.requestPointerLock) canvas.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', () => {
    state.pointerLocked = document.pointerLockElement === canvas;
  });
  window.addEventListener('mousemove', (e) => {
    if (!state.pointerLocked) return;
    look.x += e.movementX * 0.0025;
    look.y += e.movementY * 0.0025;
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) state.light = true;
    if (e.button === 2) state.heavy = true;
  });
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // touch stick
  let stickId = null;
  const stickCenter = new THREE.Vector2();
  function setStick(dx, dy) {
    const max = 48;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, max);
    const nx = (dx / len) * clamped;
    const ny = (dy / len) * clamped;
    knob.style.transform = `translate(${nx}px, ${ny}px)`;
    move.x = nx / max;
    move.y = -ny / max;
  }
  function resetStick() {
    knob.style.transform = 'translate(0,0)';
    move.set(0, 0);
    stickId = null;
  }
  stick?.addEventListener('pointerdown', (e) => {
    stick.setPointerCapture(e.pointerId);
    stickId = e.pointerId;
    const r = stick.getBoundingClientRect();
    stickCenter.set(r.left + r.width / 2, r.top + r.height / 2);
    setStick(e.clientX - stickCenter.x, e.clientY - stickCenter.y);
  });
  stick?.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickId) return;
    setStick(e.clientX - stickCenter.x, e.clientY - stickCenter.y);
  });
  stick?.addEventListener('pointerup', resetStick);
  stick?.addEventListener('pointercancel', resetStick);

  touchRoot?.querySelectorAll('[data-act]').forEach((btn) => {
    const act = btn.getAttribute('data-act');
    const press = (e) => {
      e.preventDefault();
      state[act] = true;
      if (act === 'light' || act === 'heavy' || act === 'fire') {
        // hold-capable via repeat on pointerdown only once per press
      }
    };
    btn.addEventListener('pointerdown', press);
  });

  // look via right half drag on touch
  let lookId = null;
  let lastLook = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' && e.clientX > window.innerWidth * 0.45) {
      lookId = e.pointerId;
      lastLook = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookId || !lastLook) return;
    look.x += (e.clientX - lastLook.x) * 0.004;
    look.y += (e.clientY - lastLook.y) * 0.004;
    lastLook = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerId === lookId) { lookId = null; lastLook = null; }
  });

  function pollKeys() {
    const kMove = new THREE.Vector2(
      (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0),
      (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0),
    );
    if (stickId == null) {
      move.copy(kMove);
      if (move.lengthSq() > 1) move.normalize();
    } else if (kMove.lengthSq() > 0) {
      move.add(kMove).clampLength(0, 1);
    }
  }

  function consume() {
    const out = {
      light: state.light,
      heavy: state.heavy,
      dodge: state.dodge,
      lock: state.lock,
      interact: state.interact,
      fire: state.fire,
    };
    state.light = state.heavy = state.dodge = state.lock = state.interact = state.fire = false;
    return out;
  }

  function update() {
    pollKeys();
  }

  // test hooks
  state._keys = keys;
  state._injectKey = (code, down = true) => onKey({ code, preventDefault() {}, target: document.body }, down);
  state._force = (flags) => Object.assign(state, flags);

  return {
    move,
    look,
    update,
    consume,
    _state: state,
    _keys: keys,
    _injectKey: state._injectKey,
    get usingStick() { return stickId != null; },
  };
}
