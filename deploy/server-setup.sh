#!/usr/bin/env bash
# One-time setup for a fresh Oracle Cloud Ubuntu VM. Run it ON the server:
#   ssh -i ~/.ssh/deepball-oracle.key ubuntu@<ip> 'bash -s' < deploy/server-setup.sh
# Safe to run again; every step checks before it changes anything.
set -euo pipefail

NODE_VERSION="${NODE_VERSION:-26.5.0}"   # same as local dev; node:sqlite needs a recent Node
PNPM_VERSION="${PNPM_VERSION:-11.18.0}"  # the version that wrote pnpm-lock.yaml
APP_DIR=/opt/deepball/app
DATA_DIR=/var/lib/deepball

log() { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }

# Address the site is served on. Default: <ip-with-dashes>.sslip.io, a free hostname
# that points at this IP, so HTTPS works without buying a domain.
PUBLIC_IP="$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me)"
DOMAIN="${DOMAIN:-${PUBLIC_IP//./-}.sslip.io}"

log "Packages"
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  curl rsync xz-utils sqlite3 debian-keyring debian-archive-keyring apt-transport-https iptables-persistent

log "Swap (2 GB) so the build can't run out of memory on small shapes"
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

log "Node $NODE_VERSION"
if [[ "$(node -v 2>/dev/null)" != "v$NODE_VERSION" ]]; then
  case "$(uname -m)" in
    aarch64) ARCH=arm64 ;;
    x86_64) ARCH=x64 ;;
    *) echo "Unsupported CPU: $(uname -m)"; exit 1 ;;
  esac
  TARBALL="node-v$NODE_VERSION-linux-$ARCH.tar.xz"
  curl -fsSLO "https://nodejs.org/dist/v$NODE_VERSION/$TARBALL"
  curl -fsSL "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt" | grep " $TARBALL\$" | sha256sum -c -
  sudo tar -xJf "$TARBALL" -C /usr/local --strip-components=1 --no-same-owner
  rm "$TARBALL"
fi
node -v

log "pnpm $PNPM_VERSION"
if [[ "$(pnpm -v 2>/dev/null)" != "$PNPM_VERSION" ]]; then
  sudo npm install -g --silent "pnpm@$PNPM_VERSION"
fi
pnpm -v

log "Folders"
sudo mkdir -p "$APP_DIR" "$DATA_DIR/backups"
sudo chown -R ubuntu:ubuntu /opt/deepball "$DATA_DIR"

log "Firewall: allow web traffic (Oracle's Ubuntu image rejects everything but SSH)"
for port in 80 443; do
  if ! sudo iptables -C INPUT -p tcp --dport "$port" -m state --state NEW -j ACCEPT 2>/dev/null; then
    # Insert above Oracle's catch-all REJECT rule, wherever it sits.
    REJECT_LINE="$(sudo iptables -L INPUT --line-numbers | awk '$2 == "REJECT" {print $1; exit}')"
    sudo iptables -I INPUT "${REJECT_LINE:-1}" -p tcp --dport "$port" -m state --state NEW -j ACCEPT
  fi
done
sudo netfilter-persistent save >/dev/null

log "Caddy (web server with automatic HTTPS)"
if ! command -v caddy >/dev/null; then
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | sudo gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq caddy
fi
sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
$DOMAIN {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000
}
EOF
sudo systemctl reload caddy || sudo systemctl restart caddy

log "App service"
sudo tee /etc/systemd/system/deepball.service >/dev/null <<EOF
[Unit]
Description=DEEP BALL
After=network.target

[Service]
User=ubuntu
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=DEEP_BALL_DB=$DATA_DIR/deepball.db
ExecStart=/usr/local/bin/node $APP_DIR/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3000
Restart=always
RestartSec=3
# Only the database folder and Next's cache are writable.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR $APP_DIR/.next

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable deepball >/dev/null 2>&1

log "Nightly database backup (keeps 14 days)"
sudo tee /etc/cron.d/deepball-backup >/dev/null <<EOF
15 4 * * * ubuntu sqlite3 $DATA_DIR/deepball.db ".backup '$DATA_DIR/backups/deepball-\$(date +\%F).db'" && find $DATA_DIR/backups -name 'deepball-*.db' -mtime +14 -delete
EOF

echo "$DOMAIN" | sudo tee /opt/deepball/DOMAIN >/dev/null
log "Done. Site address: https://$DOMAIN"
echo "Next: run deploy/deploy.sh from your Mac to upload and start the game."
