---
title: "Linux-Server Monitoring: Beszel, Netdata oder Prometheus?"
description: "Die 3 besten Self-Hosted Monitoring-Tools für Linux-Server und Docker im Praxistest – inklusive Quick-Start-Anleitung für Beszel."
pubDate: "2026-11-20"
heroImage: "/images/linux-server-monitoring-beszel-netdata-prometheus.webp"
category: "Self-Hosting"
tags: ["Linux", "Docker", "Monitoring", "Beszel", "Self-Hosting", "Homelab"]
---

Wer mehrere Linux-Server oder Docker-Hosts betreibt, kennt das Problem: Läuft ein Container heimlich voll, klettert die CPU-Last durch einen hängenden Prozess oder meldet eine NVMe erste S.M.A.R.T.-Warnungen, merkt man es ohne Monitoring oft erst, wenn ein Dienst ausfällt.

Klassische Enterprise-Systeme wie Zabbix oder Checkmk sind im Homelab oder auf kompakten Produktiv-Servern meist überdimensioniert. Drei moderne Open-Source-Lösungen haben sich stattdessen als praxistaugliche Favoriten etabliert: **Beszel**, **Netdata** und der Stack aus **Prometheus + Grafana**.

## Die 3 Kandidaten im direkten Vergleich

| Kriterium | Beszel | Netdata | Prometheus + Grafana |
| :--- | :--- | :--- | :--- |
| **RAM-Verbrauch (Agent)** | **~15–25 MB** | ~150–300 MB | ~40–80 MB (+ ~250 MB Stack) |
| **Setup-Zeit** | **Unter 5 Minuten** | ca. 5 Minuten | 30–60 Minuten |
| **Docker-Container-Stats** | Integriert (CPU, RAM, Netz) | Sehr detailliert | Über cAdvisor / Exporter |
| **Multi-Server-Übersicht** | **Zentraler Hub inkl. Alerts** | Netdata Cloud oder Parent/Child | Zentraler Prometheus-Server |
| **S.M.A.R.T. & Temperaturen** | Ja (ab v0.9+) | Ja | Über Node-Exporter-Skripte |
| **Ideal für …** | **Schlanke Homelabs & 2–10 Nodes** | Echtzeit-Fehlersuche & Deep-Dive | Große Setups & eigene Dashboards |

---

## 1. Beszel – Der schlanke Preis-Leistungs-Sieger

**Beszel** verfolgt einen radikal einfachen Ansatz: Ein zentraler **Hub** (Web-UI + SQLite-Datenbank) sammelt über einen extrem leichtgewichtigen **Agenten** die Metriken beliebig vieler Linux-Server ein – abgesichert über SSH-Keys, ohne dass auf den Zielsystemen offene HTTP-Ports ins Netzwerk freigegeben werden müssen.

* **Stärken:** Minimaler Ressourcenverbrauch, sofort einsatzbereite Übersichten für CPU, RAM, Disk-I/O, Docker-Container und S.M.A.R.T.-Werte sowie integrierte Benachrichtigungen (E-Mail, Discord, Telegram, Gotify, ntfy).
* **Schwächen:** Keine frei zusammenklickbaren Custom-Panels wie in Grafana; Fokus liegt bewusst auf System- und Container-Metriken.

## 2. Netdata – Maximaler Tiefgang in Echtzeit

**Netdata** liefert direkt nach dem Start hunderte Metriken im Sekundentakt – vom Kernel-Interrupt über Festplatten-Latenzen bis zu einzelnen Systemd-Services.

* **Stärken:** Zero-Config-Erkennung fast aller Dienste, extrem hilfreich bei akuten Performance-Engpässen („Warum ist der Server gerade träge?“).
* **Schwächen:** Deutlich höherer RAM- und CPU-Bedarf auf kleinen Mini-PCs; für Multi-Server-Ansichten oft auf Netdata Cloud angewiesen.

## 3. Prometheus + Grafana – Der maximale Baukasten

Die Kombination aus **Prometheus** (Zeitreihendatenbank), **Node Exporter / cAdvisor** und **Grafana** ist der Industriestandard – ideal, wenn neben Linux-Servern auch Router oder Smart-Home-Systeme in einem Dashboard zusammenlaufen sollen.

* **Stärken:** Unbegrenzte Anpassbarkeit, riesige Auswahl an Community-Dashboards, lange Datenhistorie.
* **Schwächen:** Höherer Wartungsaufwand (`prometheus.yml`, Scrape-Targets, Exporter) und spürbar mehr Speicherbedarf.

---

## Fazit: Welches Tool passt zu welchem Setup?

* **Für 90 % aller Homelabs und Multi-Node-Setups ist Beszel die beste Wahl:** Kaum Ressourcenverbrauch, Docker- und S.M.A.R.T.-Überwachung inklusive und in wenigen Minuten produktiv.
* **Netdata** lohnt sich als gezieltes Diagnose-Werkzeug auf stark belasteten Maschinen.
* **Prometheus + Grafana** spielt seine Stärke erst bei komplexen, systemübergreifenden Dashboards aus.

---

## Quick-Start: Beszel in 5 Minuten per Docker installieren

Beszel besteht aus zwei Komponenten: dem **Hub** (auf deinem Hauptserver) und dem **Agenten** (auf jedem zu überwachenden Linux-Host – inklusive dem Hauptserver selbst).

### Schritt 1: Beszel Hub starten

Lege auf deinem Hauptserver ein Verzeichnis an (z. B. `/opt/beszel`) und starte den Hub über `docker-compose.yml` (oder als **Stack in Portainer**):

```yaml
services:
  beszel:
    image: henrygd/beszel:latest
    container_name: beszel-hub
    restart: unless-stopped
    ports:
      - "8090:8090"
    volumes:
      - ./beszel_data:/beszel_data
```

Starte den Stack mit `docker compose up -d` und öffne `http://<SERVER-IP>:8090` im Browser. Lege dort beim ersten Aufruf deinen Admin-Account an.

### Schritt 2: Ersten Server (Agent) verbinden

1. Klicke im Beszel-Dashboard oben rechts auf **System hinzufügen** (*Add System*).
2. Vergib einen **Namen** (z. B. `docker-host-01`), trage die **IP-Adresse oder den Hostnamen** des Servers ein und belasse den Port auf **`45876`**.
3. Kopiere den angezeigten **Public Key** (oder direkt das fertige Docker-Compose-Snippet aus dem Dialog).

Starte anschließend auf dem Zielserver den Agenten:

```yaml
services:
  beszel-agent:
    image: henrygd/beszel-agent:latest
    container_name: beszel-agent
    restart: unless-stopped
    network_mode: host
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      PORT: 45876
      KEY: "ssh-ed25519 DEIN_KOPIERTER_PUBLIC_KEY"
```

*(Hinweis: Wenn der Agent auf demselben Host wie der Hub läuft, kannst du beide Services auch direkt in einer gemeinsamen `docker-compose.yml` kombinieren und als Hostnamen `127.0.0.1` eintragen.)*

Nach wenigen Sekunden springt der Status im Hub auf **Grün** – und CPU-, RAM-, Netzwerk- sowie alle laufenden Docker-Container-Metriken werden live aufgezeichnet.