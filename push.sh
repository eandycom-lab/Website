#!/bin/bash
set -e

cd "$(dirname "$0")"

# 0. Automatische Bild-Optimierung aus inbox/ -> public/images/*.webp
shopt -s nullglob nocaseglob
IMAGES=(inbox/*.jpg inbox/*.jpeg inbox/*.png)
if [ ${#IMAGES[@]} -gt 0 ]; then
    echo "-> 0. Optimiere & konvertiere ${#IMAGES[@]} Bild(er) nach WebP..."
    for img in "${IMAGES[@]}"; do
        base=$(basename "${img%.*}")
        cwebp -q 82 -resize 1200 0 "$img" -o "public/images/${base}.webp"
        rm "$img"
        echo "   Erstellt: public/images/${base}.webp"
    done
fi
shopt -u nullglob nocaseglob

MSG="${1:-Update Blog $(date +'%Y-%m-%d %H:%M')}"

# Deploy-Metadaten für Admin-Statusleiste schreiben
python3 -c 'import json, datetime, sys; json.dump({"builtAt": datetime.datetime.now().strftime("%d.%m.%Y %H:%M"), "commit": sys.argv[1]}, open("public/deploy-info.json", "w"))' "$MSG"

echo "-> 1. Prüfe Astro Build lokal..."
npm run build

echo "-> 2. Prüfe auf lokale Änderungen..."
if [ -z "$(git status --porcelain)" ]; then
    echo "Keine lokalen Änderungen zum Committen."
else
    echo "-> Stage & Commit: $MSG"
    git add .
    git commit -m "$MSG"
fi

echo "-> 3. Synchronisiere mit GitHub (Decap CMS) & Push..."
git pull --rebase
git push

echo "-> Fertig! Cloudflare Pages baut die Seite jetzt live."
