#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
npm run build
TMP=$(mktemp -d)
cp -a dist/. "$TMP/"
touch "$TMP/.nojekyll"
cd "$TMP"
git init -b gh-pages
git config user.email "gamebot@canop3n3r.local"
git config user.name "Game bot"
git add -A
git commit -m "deploy: $(date -u +%Y-%m-%dT%H:%MZ)"
git remote add origin https://github.com/Canop3n3r/space-samurai.git
git push -u origin gh-pages --force
echo "Published. Live: https://canop3n3r.github.io/space-samurai/"
