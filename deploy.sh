#!/usr/bin/env bash
# Build a nasazení na GitHub Pages (branch gh-pages). Použití: ./deploy.sh
set -euo pipefail
npm run build
SHA=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
cp -r dist/* "$TMP"/ && touch "$TMP/.nojekyll"
git fetch origin gh-pages -q || true
git worktree add -q "$TMP/wt" gh-pages 2>/dev/null || git worktree add -q --orphan -b gh-pages "$TMP/wt"
rm -rf "$TMP/wt"/* && cp -r "$TMP"/.nojekyll "$TMP"/index.html "$TMP"/assets "$TMP"/brand "$TMP/wt"/
git -C "$TMP/wt" add -A && git -C "$TMP/wt" commit -qm "Deploy na GitHub Pages (build z main $SHA)" && git -C "$TMP/wt" push origin gh-pages
git worktree remove --force "$TMP/wt"
echo "Nasazeno: https://pcclassa.github.io/stoukit/"
