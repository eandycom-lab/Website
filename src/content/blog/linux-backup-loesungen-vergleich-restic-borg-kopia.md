---
title: "Linux-Backup-Lösungen im Vergleich: Restic, BorgBackup, Kopia & Backrest im Praxistest"
description: "Welches Open-Source-Backup-Tool passt ins Homelab? Wir vergleichen Restic, BorgBackup, Kopia, Backrest und UrBackup ausführlich – inklusive schlüsselfertigem Setup-Skript für den Testsieger."
pubDate: 2026-11-24T19:30:00
heroImage: "/images/linux-backup-loesungen-vergleich-restic-borg-kopia.webp"
category: "Linux & OS"
tags: ["Linux", "Backup", "Restic", "BorgBackup", "Kopia", "Backrest", "Homelab", "Self-Hosting"]
---

Ein RAID-Verbund ersetzt kein Backup – er schützt nur vor Hardware-Ausfällen, nicht vor versehentlichem Löschen, kaputten Updates oder Ransomware. Wer einen Linux-Server oder ein Homelab betreibt, braucht eine zuverlässige **3-2-1-Backup-Strategie** (3 Kopien, 2 unterschiedliche Medien, 1 Offsite-Kopie) mit clientseitiger Verschlüsselung und sauberer Deduplizierung.

Doch welches Tool hat 2026 im Linux-Umfeld die Nase vorn? Wir vergleichen die **5 besten Open-Source-Backup-Lösungen** für Linux-Server und Docker-Hosts direkt gegeneinander – und zeigen am Ende, wie du den Testsieger in wenigen Minuten produktiv aufsetzt.

---

## Die 5 Kandidaten im Überblick

| Tool | Architektur | Web-UI | Deduplizierung & Verschlüsselung | Cloud / S3 nativ | Ideal für |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Restic** | Single-Binary (CLI) | Nein (nur CLI) | Ja (Block-basiert, AES-256) | Ja (S3, B2, SFTP, Rclone) | Automatisierte Skripte & Offsite-Backups |
| **Backrest** | Web-UI-Wrapper für Restic | **Ja** (schlank, Go) | Ja (100 % Restic-Engine) | Ja (via Restic / Rclone) | **Homelab-Allrounder mit Web-Oberfläche** |
| **BorgBackup** | CLI (Python/C) | Nein (Desktop: Vorta) | Ja (extrem effizient, Zstd) | Nein (nur lokal / SSH) | Reine Linux-zu-Linux / Storage-Box-Setups |
| **Kopia** | CLI + Server + GUI | **Ja** (Web & Desktop) | Ja (sehr schnell, viele Algorithmen) | Ja (S3, B2, WebDAV, SFTP) | Gemischte Umgebungen (Linux, Win, macOS) |
| **UrBackup** | Client/Server-Modell | **Ja** (klassisch) | Ja (Datei- & Image-Level) | Nein (lokale Server-Disks) | Zentrale Sicherung vieler Clients im LAN |

---

## 1. Restic: Der unverwüstliche Industriestandard

**Restic** ist eine einzelne, statisch kompilierte Go-Binary ohne externe Abhängigkeiten. Das Tool zerlegt Dateien in variable Blöcke (Content-Defined Chunking), dedupliziert sie über alle Snapshots hinweg und verschlüsselt jedes Repository zwingend clientseitig.

* **Stärken:** Extrem ausgereift, riesige Community, plattformübergreifend (Linux, BSD, macOS, Windows) und native Unterstützung für praktisch jedes Ziel – von der lokalen USB-Platte über SFTP/Hetzner Storage Box bis hin zu S3-Buckets und über 70 Backends via `rclone`. Snapshots lassen sich per `restic mount` direkt als Dateisystem einhängen.
* **Schwächen:** Reines Kommandozeilen-Werkzeug. Wer Zeitpläne, Retention-Policies und Benachrichtigungen ohne eigene Systemd-Timer oder Bash-Skripte verwalten möchte, muss selbst Hand anlegen.
* **Fazit:** Unter der Haube der zuverlässigste Motor auf dem Markt.

---

## 2. Backrest: Restic endlich mit modernem Web-UI

Genau hier setzt **Backrest** an. Backrest ist kein eigenes Backup-Format, sondern eine extrem schlanke, moderne Web-Oberfläche (ebenfalls in Go geschrieben), die direkt auf der offiziellen Restic-Binary aufsetzt.

* **Stärken:** Du bekommst alle Vorteile von Restic (kompatible Repositories, maximale Stabilität, kein Vendor-Lock-in) kombiniert mit einem aufgeräumten Browser-Dashboard. Zeitpläne (Cron), Aufbewahrungsregeln (z. B. 7 tägliche, 4 wöchentliche, 6 monatliche Snapshots), Integritätsprüfungen (`check`), Hooks vor/nach dem Backup (z. B. für Datenbank-Dumps) und Webhooks (Discord, Gotify, Ntfy, E-Mail) sind in Sekunden konfiguriert. Dateien lassen sich direkt im Browser durchsuchen und wiederherstellen.
* **Schwächen:** Da Restic die Arbeit erledigt, erbt Backrest auch dessen Verhalten bei `prune`-Läufen (hoher RAM-Verbrauch bei riesigen Repositories mit Millionen kleiner Dateien).
* **Fazit:** Der Sweetspot zwischen maximaler Sicherheit und minimalem Wartungsaufwand.

---

## 3. BorgBackup: Maximaler Speichereffizienz-Champion

**BorgBackup** (kurz *Borg*) ist seit Jahren der Favorit vieler Linux-Admins. Besonders in Kombination mit Zstandard-Kompression (`zstd`) und Chunk-basierter Deduplizierung holt Borg oft noch einmal spürbar mehr Speicherplatzersparnis heraus als die Konkurrenz.

* **Stärken:** Hervorragende Kompressionsraten, extrem schnelle inkrementelle Läufe und ein echter **Append-Only-Modus** auf Serverseite (`borg serve --append-only`). Damit kann ein kompromittierter Client zwar neue Backups schreiben, bestehende Archive aber weder verändern noch löschen – ideal als Ransomware-Schutz.
* **Schwächen:** Borg unterstützt nativ **nur lokale Pfade und SSH**. Wer direkt in einen S3-Bucket sichern will, braucht umständliche Workarounds. Zudem existiert kein offizielles Web-UI für Headless-Server (Vorta ist eine reine Desktop-App).
* **Fazit:** Unschlagbar für reine Linux-Setups mit SSH-Zielspeicher (z. B. eigener Backup-Server oder Hetzner Storage Box), aber weniger flexibel bei Cloud-Zielen.

---

## 4. Kopia: Moderne Architektur mit Server-Modus

**Kopia** tritt als moderner Herausforderer an und bringt sowohl ein CLI, eine Desktop-App als auch einen integrierten Web-Server samt Repository-Server-Modus mit.

* **Stärken:** Sehr hohe Geschwindigkeit durch parallele Verarbeitung, flexible Auswahl bei Verschlüsselungs- und Kompressionsalgorithmen und die Möglichkeit, einen zentralen Kopia-Repository-Server zu betreiben, an den mehrere Clients ihre Backups schicken – ohne dass die Clients direkten Zugriff auf die zugrundeliegenden Cloud-Credentials benötigen.
* **Schwächen:** Die Community und das Ökosystem rund um Recovery-Tools sind kleiner als bei Restic oder Borg. Das Web-UI wirkt stellenweise funktional, aber weniger poliert als Backrest.
* **Fazit:** Starke Alternative, wenn du viele verschiedene Clients (Linux-Server plus Windows-/macOS-Rechner) über eine einheitliche Oberfläche sichern willst.

---

## 5. UrBackup: Der Spezialist für lokale Client-Flotten

**UrBackup** verfolgt einen klassischen Client/Server-Ansatz: Auf dem Backup-Server läuft die zentrale Instanz mit Web-Oberfläche, auf den zu sichernden Systemen ein kleiner Hintergrund-Agent.

* **Stärken:** Deduplizierung über **alle Clients hinweg** (identische Systemdateien auf fünf Linux-VMs werden nur einmal gespeichert). Zudem beherrscht UrBackup neben Datei-Backups auch vollständige Image-Backups für Bare-Metal-Wiederherstellungen.
* **Schwächen:** Stark auf lokale Netzwerke (LAN) und direkte Server-Festplatten ausgelegt; keine native S3-/Cloud-Integration und keine clientseitige Ende-zu-Ende-Verschlüsselung wie bei Restic oder Borg.
* **Fazit:** Ideal für das Heimnetz mit mehreren PCs und VMs, aber nicht als modernes Offsite-Tool für einen einzelnen Linux-Host.

---

## Testsieger & Praxis-Empfehlung: Backrest (Restic + Web-UI)

Für den typischen Linux-Server oder Docker-Host (wie wir ihn im Artikel [Ubuntu Server, Docker & Portainer: Das perfekte Fundament für dein Homelab](/blog/ubuntu-server-docker-portainer-setup) aufgebaut haben) ist **Backrest** der klare Testsieger:

1. **Kein Lock-in:** Deine Daten liegen in einem offenen Standard-Restic-Repository. Selbst wenn Backrest irgendwann nicht mehr existieren sollte, kannst du deine Backups jederzeit auf jedem beliebigen System mit dem normalen `restic`-Befehl wiederherstellen.
2. **Sofort einsatzbereit:** Keine komplexen Bash-Skripte für Cronjobs, Rotation (`forget --prune`) und Fehler-Alerts nötig – alles läuft übersichtlich im Browser (abgesichert über dein lokales Netz oder deinen Router-VPN-Tunnel).
3. **Host- und Docker-ready:** Wenn du Backrest als Docker-Container startest und die gewünschten Host-Verzeichnisse (z. B. `/opt/stacks` und `/etc`) read-only (`:ro`) hineinmountest, sicherst du deinen gesamten Server sauber weg.

*(Tipp: Kombiniere deine Backup-Jobs am besten direkt mit deinem [Linux-Server-Monitoring (Beszel, Netdata & Prometheus)](/blog/linux-server-monitoring-beszel-netdata-prometheus), damit du sofort siehst, wenn ein Snapshot ausbleibt oder der Speicherplatz knapp wird.)*

---

## Praxis-Skript: Testsieger Backrest per Docker Compose installieren

Mit diesem Skript richtest du **Backrest** unter `/opt/stacks/backrest` ein. Es mountet deine Docker-Stacks (`/opt/stacks`) und System-Konfigurationen (`/etc`) schreibgeschützt (`:ro`) in den Container, sodass du sofort dein erstes lokales Backup (z. B. auf eine gemountete USB-Festplatte unter `/mnt/backup`) oder ein Offsite-Backup per SFTP/S3 anlegen kannst.

```bash
# Verzeichnisse für Backrest anlegen
sudo mkdir -p /opt/stacks/backrest/{data,config,cache}
sudo chown -R $USER:$USER /opt/stacks/backrest

# docker-compose.yml erstellen
cat << 'STACK' > /opt/stacks/backrest/docker-compose.yml
services:
  backrest:
    image: garethgeorge/backrest:latest
    container_name: backrest
    hostname: linux-host
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "9898:9898"
    volumes:
      - /opt/stacks/backrest/data:/data
      - /opt/stacks/backrest/config:/config
      - /opt/stacks/backrest/cache:/cache
      # Zu sichernde Host-Verzeichnisse (Read-Only!)
      - /opt/stacks:/host/stacks:ro
      - /etc:/host/etc:ro
      # Optional: Lokales Backup-Ziel (z. B. externe USB-Platte oder NAS-Mount)
      # - /mnt/backup:/repos
    environment:
      - BACKREST_DATA=/data
      - BACKREST_CONFIG=/config/config.json
      - XDG_CACHE_HOME=/cache
      - TZ=Europe/Berlin
STACK

# Container starten
cd /opt/stacks/backrest && docker compose up -d
echo "=== Backrest läuft unter http://$(hostname -I | awk '{print $1}'):9898 ==="
```

Nach dem Start erreichst du Backrest im Browser über Port `9898` (im LAN oder via VPN), legst dort deinen Admin-Login fest, fügst unter **Repos** dein lokales Ziel (`/repos`) oder deinen SFTP-/S3-Speicher hinzu und erstellst deinen ersten **Plan** für `/host/stacks` und `/host/etc`.
