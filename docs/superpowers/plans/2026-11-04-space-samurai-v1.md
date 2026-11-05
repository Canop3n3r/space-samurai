# Space Samurai v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a playable neon cyber-samurai vertical slice: dojo warm-up → street fight → steal ship → 6DOF asteroid belt flight, on phone and desktop via GitHub Pages.

**Architecture:** Single-page Three.js / WebGPU game with a thin scene graph (`DojoScene`, `StreetScene`, `FlightScene`) and shared systems for input, combat, and flight. Assets are pulled from Free Asset Index source pages into `assets/` with a generated `CREDITS.md`.

**Tech Stack:** Vanilla ES modules, Three.js (r170+), WebGPURenderer with WebGL fallback, Vite for local serve and Pages build, Playwright smoke tests.

## Global Constraints

- Public repo `Canop3n3r/space-samurai`, MIT license, GitHub Pages at `https://canop3n3r.github.io/space-samurai/`.
- CC0 / CC-BY assets only via Free Asset Index; every used asset listed in `CREDITS.md` with its attribution string.
- Neutral original names only; no real company or trademarked character names.
- Phone + desktop. Desktop: WASD + mouse look + click attacks. Phone: virtual stick + on-screen buttons.
- No Orbit Rush code copy-paste wholesale; share patterns, not files.
- Fast-forward pushes only; never force-push main.

## File map

- `index.html` — shell, HUD mounts, touch controls
- `src/main.js` — boot, renderer, scene switcher
- `src/input.js` — keyboard, mouse, touch stick, actions
- `src/player.js` — third-person controller + stamina
- `src/combat.js` — lock-on, light/heavy, dodge, hit detection
- `src/dummy.js` — training dummy
- `src/enemy.js` — street enemies + tougher captain
- `src/ship.js` — fighter craft + 6DOF flight
- `src/scenes/dojo.js` — dojo + dummies
- `src/scenes/street.js` — neon street fight + pad
- `src/scenes/flight.js` — asteroid belt + chase ships
- `src/assets.js` — load GLBs, apply neon materials
- `src/ui.js` — stamina, lock reticle, prompt text
- `assets/` — downloaded kits (git-lfs or compressed)
- `CREDITS.md` — attributions
- `tests/smoke/loop.cjs` — dojo → street → board → fly smoke
- `vite.config.js`, `package.json`

---

### Task 1: Repo scaffold + neon boot scene

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/ui.js`, `README.md`, `LICENSE`, `.gitignore`
- Test: `tests/smoke/boot.cjs`

**Interfaces:**
- Produces: `boot()` → `{ renderer, scene, camera, clock }`; canvas fills viewport; black neon clear color `#050510`

- [ ] **Step 1:** Init npm package with vite, three, and a smoke test script.
- [ ] **Step 2:** Write `index.html` with `#hud` and `#touch` mounts and a fullscreen canvas.
- [ ] **Step 3:** Write `src/main.js` that creates WebGPURenderer (WebGL fallback), a perspective camera, a lit neon ground plane, and a render loop.
- [ ] **Step 4:** Smoke: headless Chromium loads `/`, canvas exists, no console errors for 2s.
- [ ] **Step 5:** Commit `chore: scaffold space-samurai boot scene`.

### Task 2: Input + third-person player

**Files:**
- Create: `src/input.js`, `src/player.js`
- Modify: `src/main.js`, `index.html` (touch buttons)
- Test: `tests/unit/input.test.mjs`, `tests/smoke/move.cjs`

**Interfaces:**
- Produces: `createInput(dom)` → `{ move: Vector2, look: Vector2, light, heavy, dodge, lock, consume() }`
- Produces: `createPlayer(scene)` → `{ mesh, update(dt, input), position, facing }`

- [ ] **Step 1:** Unit test: pressing KeyW sets `move.y > 0`; click sets `light` true until consume.
- [ ] **Step 2:** Implement keyboard/mouse and touch stick + Attack / Heavy / Dodge / Lock buttons.
- [ ] **Step 3:** Capsule player with third-person follow camera; move relative to camera yaw.
- [ ] **Step 4:** Smoke: after 1s of synthetic KeyW, player z changes.
- [ ] **Step 5:** Commit `feat: third-person player and input`.

### Task 3: Combat + dojo dummies

**Files:**
- Create: `src/combat.js`, `src/dummy.js`, `src/scenes/dojo.js`
- Modify: `src/main.js`, `src/ui.js`
- Test: `tests/unit/combat.test.mjs`, `tests/smoke/dojo.cjs`

**Interfaces:**
- Consumes: player, input
- Produces: `createCombat(player)` → `{ update, lockedTarget, stamina }`
- Produces: `createDojoScene()` → `{ scene, dummies[], exitTrigger }`

- [ ] **Step 1:** Unit test: light hit within range reduces dummy HP; dodge sets invuln for 0.3s; stamina blocks spam.
- [ ] **Step 2:** Soft lock-on (nearest in front cone), light/heavy hitboxes, neon slash VFX (simple emissive quad trail).
- [ ] **Step 3:** Dojo room: neon walls, 3 dummies, exit doorway trigger.
- [ ] **Step 4:** Smoke: load dojo, dummy HP drops after forced light attack.
- [ ] **Step 5:** Commit `feat: dojo combat and training dummies`.

### Task 4: Street fight + ship unlock

**Files:**
- Create: `src/enemy.js`, `src/scenes/street.js`
- Modify: `src/main.js`
- Test: `tests/smoke/street.cjs`

**Interfaces:**
- Produces: `createStreetScene()` → `{ scene, enemies[], shipPad, onShipReady }`
- Produces: `createEnemy(opts)` → `{ update, hp, isCaptain }`

- [ ] **Step 1:** 4–5 basic enemies + 1 captain; simple chase / attack AI.
- [ ] **Step 2:** Crossing dojo exit loads street with fight already started.
- [ ] **Step 3:** Defeating captain enables boarding prompt on the pad fighter.
- [ ] **Step 4:** Smoke: force-kill captain → boarding prompt true.
- [ ] **Step 5:** Commit `feat: street fight and ship unlock`.

### Task 5: 6DOF flight + asteroid belt

**Files:**
- Create: `src/ship.js`, `src/scenes/flight.js`
- Modify: `src/main.js`, `src/input.js`, `src/ui.js`
- Test: `tests/unit/flight.test.mjs`, `tests/smoke/flight.cjs`

**Interfaces:**
- Produces: `createShip(scene)` → `{ update(dt, input), fire(), position, quaternion }`
- Produces: `createFlightScene()` → `{ scene, asteroids[], chasers[], stationLandmark }`

- [ ] **Step 1:** Unit test: pitch/yaw/roll inputs change ship quaternion; throttle changes forward velocity.
- [ ] **Step 2:** Boarding swaps control scheme; guns spawn projectiles; 2 chase ships.
- [ ] **Step 3:** Asteroid belt field + glowing station landmark in view from spawn.
- [ ] **Step 4:** Smoke: board ship, after 2s with throttle, distance from pad > threshold.
- [ ] **Step 5:** Commit `feat: 6DOF flight and asteroid belt`.

### Task 6: Free Asset Index pull + neon materials + credits

**Files:**
- Create: `scripts/pull-assets.mjs`, `src/assets.js`, `CREDITS.md`
- Modify: scenes to use loaded meshes where available
- Test: `tests/unit/credits.test.mjs`

**Interfaces:**
- Produces: `loadKit(name)` → `Group`; `applyNeon(mat)` emissive tint
- Produces: `CREDITS.md` generated from Free Asset Index attribution strings

- [ ] **Step 1:** Script searches Free Asset Index (`space-kit`, swords, cyberpunk street, characters), downloads from `url` / official download links only, writes attribution into `CREDITS.md`.
- [ ] **Step 2:** Swap placeholder meshes for kit meshes when present; keep placeholders as fallback.
- [ ] **Step 3:** Unit test: `CREDITS.md` contains at least one `CC0` or `CC-BY` line and no empty attribution.
- [ ] **Step 4:** Commit `feat: asset index kits and credits`.

### Task 7: Phone HUD, Pages deploy, loop smoke

**Files:**
- Modify: `index.html`, `src/ui.js`, touch CSS
- Create: `tests/smoke/loop.cjs`, `.github/workflows/pages.yml` (or deploy script)
- Test: loop smoke at 390×844 and 1280×800

**Interfaces:**
- Produces: live `https://canop3n3r.github.io/space-samurai/`

- [ ] **Step 1:** Touch controls usable; stamina + lock reticle readable at 390 wide.
- [ ] **Step 2:** Full loop smoke: dojo → street → board → fly, both viewports.
- [ ] **Step 3:** Deploy to GitHub Pages; curl live URL returns 200.
- [ ] **Step 4:** Commit `feat: mobile HUD and pages deploy`; tag `v0.1.0`.

## Spec coverage check

- Opening loop: Tasks 3–5
- Combat: Task 3–4
- Flight 6DOF + asteroid belt: Task 5
- Neon vibe + asset index: Task 6
- Phone + desktop + Pages: Tasks 1, 2, 7
- Credits: Task 6
