#!/bin/sh
# Builds the image on this laptop and ships it to the VPS; the 2 GB VPS never runs the Vite build.
#   scripts/deploy.sh user@vps [/opt/defuse]
# The VPS needs Docker with the compose plugin and a .env (DOMAIN, GM_PIN, POSTGRES_PASSWORD) in the target dir.
# Rollback to the image before the last deploy:
#   ssh user@vps 'cd /opt/defuse && docker tag defuse-app:previous defuse-app && docker compose up -d --no-build'
set -eu
host=${1:?usage: scripts/deploy.sh user@vps [dir]}
dir=${2:-/opt/defuse}
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes: commit first so the deployed image matches a commit." >&2
  exit 1
fi
ssh "$host" "test -f '$dir/.env'" || { echo "Missing $dir/.env on $host. Create it from .env.example first." >&2; exit 1; }

docker build -t defuse-app .
echo "Sending image ($(git rev-parse --short HEAD))…"
ssh "$host" "docker image inspect defuse-app >/dev/null 2>&1 && docker tag defuse-app defuse-app:previous || true"
docker save defuse-app | gzip | ssh "$host" "gunzip | docker load"

ssh "$host" "mkdir -p '$dir/scripts'"
scp docker-compose.yml Caddyfile "$host:$dir/"
scp scripts/event-db.sh "$host:$dir/scripts/"
ssh "$host" "cd '$dir' && docker compose up -d --no-build && docker image prune -f >/dev/null"

domain=$(ssh "$host" "sed -n 's/^DOMAIN=//p' '$dir/.env'")
echo "Waiting for https://$domain/health …"
for _ in $(seq 1 30); do
  if curl -fsS "https://$domain/health"; then echo; echo "Deployed."; exit 0; fi
  sleep 2
done
echo "No healthy answer after 60 s. Check: ssh $host 'cd $dir && docker compose logs --tail 50'" >&2
exit 1
