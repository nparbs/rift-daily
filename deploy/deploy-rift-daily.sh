#!/bin/sh
# Runs on the VM. Pulls main and rebuilds. Install as ~/deploy-rift-daily.sh and lock an SSH key to it:
#   command="/home/deb/deploy-rift-daily.sh",no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty ssh-ed25519 AAAA... rift-daily-deploy
set -eu
cd "$HOME/rift-daily"
git fetch --quiet origin main
git merge --ff-only --quiet origin/main
sg docker -c "docker compose up -d --build" 2>&1 | tail -5
sleep 2
sg docker -c "docker compose ps --format '{{.Name}} {{.Status}}'"
echo "Deployed $(git rev-parse --short HEAD)"
