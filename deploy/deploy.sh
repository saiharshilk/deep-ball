#!/usr/bin/env bash
# Upload the game to the server, build it there and restart it. Run from your Mac:
#   deploy/deploy.sh ubuntu@<ip>
# Uses rsync over SSH, so the server never needs access to GitHub (the repo can stay private).
set -euo pipefail

TARGET="${1:?usage: deploy/deploy.sh ubuntu@<server-ip>}"
KEY="${DEEPBALL_SSH_KEY:-$HOME/.ssh/deepball-oracle.key}"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Checking puzzles locally"
(cd "$ROOT/deep-ball" && pnpm -s puzzles:check)

echo "==> Uploading to $TARGET"
# Never upload the local database, build output or dependencies.
rsync -az --delete \
  --exclude node_modules --exclude /.next --exclude /data --exclude '*.tsbuildinfo' --exclude .DS_Store \
  -e "${SSH[*]}" "$ROOT/deep-ball/" "$TARGET:/opt/deepball/app/"

echo "==> Installing, building and restarting on the server"
"${SSH[@]}" "$TARGET" bash -s <<'EOF'
set -euo pipefail
cd /opt/deepball/app
pnpm install --frozen-lockfile --silent
pnpm -s build
sudo systemctl restart deepball
for i in $(seq 1 30); do
  curl -fsS http://127.0.0.1:3000/api/match/today >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS http://127.0.0.1:3000/api/match/today | head -c 120; echo
echo "==> Live at https://$(cat /opt/deepball/DOMAIN)"
EOF
