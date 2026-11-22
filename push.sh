#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "-> 1. Prüfe Astro Build lokal..."
npm run build

echo "-> 2. Prüfe auf lokale Änderungen..."
if [ -n "$(git status --porcelain)" ]; then
    MSG="${1:-Update Blog $(date +'%Y-%m-%d %H:%M')}"
    echo "-> Stage & Commit: $MSG"
    git add .
    git commit -m "$MSG"
else
    echo "Keine lokalen Änderungen zum Committen."
fi

echo "-> 3. Synchronisiere mit GitHub (Decap CMS) & Push..."
git pull --rebase
git push

echo "-> Fertig! Cloudflare Pages baut die Seite jetzt live."
