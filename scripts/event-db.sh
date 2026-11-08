#!/bin/sh
# Run on the VPS next to docker-compose.yml.
#   scripts/event-db.sh backup   full pg_dump before the event (keeps players, for restoring mid-event)
#   scripts/event-db.sh archive  after the event: delete every player (NFR-07), then dump the scores
# Restore a dump: docker compose exec -T db psql -U defuse defuse < backups/<file>.sql
set -eu
mkdir -p backups
stamp=$(date +%Y%m%d-%H%M%S)
dump() { docker compose exec -T db pg_dump -U defuse --clean --if-exists defuse > "backups/defuse-$1-$stamp.sql"; echo "backups/defuse-$1-$stamp.sql"; }

case "${1:-}" in
  backup) dump backup ;;
  archive)
    # Turns keep defuser ids, and the awards keep nicknames; nothing else identifies a player.
    docker compose exec -T db psql -U defuse -v ON_ERROR_STOP=1 defuse -c "delete from players"
    dump archive ;;
  *) echo "usage: $0 backup|archive" >&2; exit 2 ;;
esac
