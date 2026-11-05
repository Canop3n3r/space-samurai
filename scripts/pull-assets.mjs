#!/usr/bin/env node
/**
 * Pull Free Asset Index kits from official source download links only.
 * Writes/updates CREDITS.md attribution block.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/assets/free/opengameart/space-kit');
const INDEX = 'https://canop3n3r.github.io/free-asset-index/api/bundles/space-kit.threejs.json';

const res = await fetch(INDEX);
const bundle = await res.json();
const space = bundle.assets.find((a) => a.id === 'opengameart:space-kit');
if (!space) throw new Error('space-kit missing from index');

mkdirSync(out, { recursive: true });
const zipUrl = 'https://opengameart.org/sites/default/files/space-kit-1.0.zip';
const zipPath = join(root, 'tmp-space-kit.zip');
console.log('Downloading', zipUrl);
execSync(`curl -fsSL -A "SpaceSamuraiPull/0.1" -o "${zipPath}" "${zipUrl}"`);
execSync(`unzip -qo "${zipPath}" "Models/*" -d "${out}"`);
execSync(`rm -f "${zipPath}"`);
try { execSync(`rm -rf "${join(out, 'Models/Materials')}" "${join(out, 'Models')}/*.fbx"`); } catch {}

const credits = `# Credits — Space Samurai

Generated from Free Asset Index bundle attribution.

${bundle.attribution.split('\\n').slice(0, 8).join('\n')}

See repository CREDITS.md for the curated in-game list.
`;
writeFileSync(join(root, 'CREDITS.generated.md'), credits);
console.log('OK', space.attribution);
