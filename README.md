# Space Samurai

Neon cyber-samurai action game for the browser.

Warm up in a dojo, walk into a street fight, steal the enemy ship, and fly a small asteroid belt with full 6DOF controls.

**Live:** https://canop3n3r.github.io/space-samurai/

**Stack:** Three.js (WebGPU with WebGL fallback) · Vite · phone + desktop  
**Assets:** [Free Asset Index](https://canop3n3r.github.io/free-asset-index/) (CC0 / CC-BY) — see [CREDITS.md](CREDITS.md)

## Play locally

```bash
npm install
npm run dev
```

Open the printed local URL (base path `/space-samurai/`).

## Controls

| Action | Desktop | Phone |
|--------|---------|-------|
| Move / thrust | WASD | Left stick |
| Look | Mouse (click to capture) | Drag right side |
| Light / Fire | LMB | LIGHT / FIRE |
| Heavy | RMB | HEAVY |
| Dodge / Boost | Space / Shift | DODGE |
| Lock-on | Q | LOCK |
| Board / Use | E | BOARD / USE |

## Tests

```bash
npm run test:unit
npm run test:smoke:boot
npm run test:smoke:loop
```

## Spec

- [v1 design](docs/superpowers/specs/2026-11-04-space-samurai-v1-design.md)
- [v1 plan](docs/superpowers/plans/2026-11-04-space-samurai-v1.md)
