#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/usr/bin:/bin:$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$PATH"
set -a
[ -f "$HOME/.radar-sync.env" ] && source "$HOME/.radar-sync.env"
set +a

REPO_DIR="$HOME/sysai.sh"
LOCK_FILE="/tmp/sysai-radar-sync.lock"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date -Is)] Sync laeuft bereits, ueberspringe."
  exit 0
fi

cd "$REPO_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[$(date -Is)] Arbeitsverzeichnis nicht sauber, breche Auto-Sync ab."
  exit 0
fi

git pull --rebase --quiet
node scripts/export-radar.mjs --approve-all

if git diff --quiet src/data/radar-snapshot.json; then
  echo "[$(date -Is)] Keine neuen Releases im Snapshot."
  exit 0
fi

echo "[$(date -Is)] Neue Releases gefunden - starte push.sh..."
./push.sh "chore(radar): auto-sync release snapshot"
