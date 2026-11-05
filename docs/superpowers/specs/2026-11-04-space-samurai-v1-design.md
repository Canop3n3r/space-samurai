# Space Samurai v1 Design

Date: 2026-11-04
Owner: Game bot
Status: Approved by Aaron (chat)

## Pitch

Neon cyber-samurai action game. You load into a dojo already geared up, warm up on training dummies, walk outside into a live street fight, steal the enemy ship, and fly a small asteroid belt with full 6DOF flight.

## Goals

- Feel first: lock-on sword combat and light-sim space flight.
- Asset-first: pull art and audio from Aaron's Free Asset Index (CC0 / CC-BY), layer neon materials and glow blades on top.
- Same delivery path as Orbit Rush: browser (phone + desktop), Three.js / WebGPU, GitHub Pages under Canop3n3r.

## Non-goals (v1)

- Story / dialogue trees
- Shops, inventory, crafting
- Multiplayer
- Deep combo trees or RPG stats
- Missiles / heavy ship systems
- Unity or Godot port (later)

## Opening loop

1. Spawn in neon cyber-dojo, already wearing chrome armor with a glow blade.
2. Training dummies nearby teach lock-on, dodge, light and heavy attacks.
3. Walk out the door into a street fight already in progress.
4. Defeat 4–6 street enemies; one tougher foe unlocks / drops access to the pad ship.
5. Board the enemy fighter; controls flip to 6DOF flight.
6. Clear a couple of chasing ships with guns (no missiles yet).
7. Freely fly a small neon asteroid belt; the dojo station stays visible as a landmark.

No menu maze. No story dump.

## Combat

- Third-person camera with soft lock-on (one target).
- Inputs: light attack, heavy attack, dodge (short invulnerability), lock toggle.
- Stamina bar limits spam.
- Glow-blade neon slash VFX on hit.
- Dojo dummies use the same moveset and take practice damage without ending the session.

## Ship + flight

- Boarding the pad fighter swaps the control scheme.
- Full 6DOF: pitch, yaw, roll, throttle, boost.
- Guns only for v1 chase clear.
- Open world: small asteroid belt, free flight, station landmark for orientation.

## Visual vibe

Neon cyber-samurai: glow swords, chrome, night city / neon station. Prefer low-poly / stylized kits from the Free Asset Index, then tint and emissive overlays for neon.

## Tech

- Browser, phone + desktop.
- Three.js / WebGPU (same stack as Orbit Rush).
- New public repo under Canop3n3r, GitHub Pages deploy.
- Desktop: mouse look + keyboard. Phone: virtual stick + action buttons.
- Credits page / in-game credits list every Free Asset Index item used (license + attribution).

## Assets source

Free Asset Index: https://canop3n3r.github.io/free-asset-index/

Prefer bundles and search API (`api/bundles/*.threejs.json`, `api/search-index.json`). Download from each item's source page only; never rehost without license clearance. Keep attribution strings.

Likely starting kits: Space Kit, sci-fi props, characters, buildings/cities, low-poly sci-fi swords, cyberpunk street packs (CC0 / CC-BY as listed).

## Done when

A player can load in, warm up on dummies, walk outside into a live fight, steal the ship, and freely fly the asteroid belt without a crash, on phone and desktop. Credits list every asset used.

## Team notes

- Separate project from Orbit Rush. Own BOARD at `/workspace/game-studio/space-samurai/BOARD.md`.
- Game bot owns main and deploys.
- Orbit Rush Feedback tickets stay queued on Orbit Rush unless Aaron redirects.
