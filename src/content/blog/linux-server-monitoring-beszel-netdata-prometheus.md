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
| **Docker-Stats & S.M.A.R.T.** | ✅ Integriert | ✅ Sehr detailliert | ⚠️ Über Exporter |
| **Ideal für …** | **Schlanke Homelabs & 2–10 Nodes** | Echtzeit-Fehlersuche & Deep-Dive | Große Setups & eigene Dashboards |

---

## 1. Beszel – Der schlanke Preis-Leistungs-Sieger

<img src="/images/logos/beszel.svg" alt="Beszel Logo" style="height: 44px; width: auto; margin-bottom: 0.75rem;" />

**Beszel** verfolgt einen radikal einfachen Ansatz: Ein zentraler **Hub** (Web-UI + SQLite-Datenbank) sammelt über einen extrem leichtgewichtigen **Agenten** die Metriken beliebig vieler Linux-Server ein – abgesichert über SSH-Keys, ohne dass auf den Zielsystemen offene HTTP-Ports ins Netzwerk freigegeben werden müssen.

* **Pro:** Minimaler Ressourcenverbrauch (~15–25 MB RAM), sofort einsatzbereite Übersichten für CPU, RAM, Disk-I/O, Docker-Container und S.M.A.R.T.-Werte sowie integrierte Benachrichtigungen (E-Mail, Discord, Telegram, Gotify, ntfy).
* **Contra:** Keine frei zusammenklickbaren Custom-Panels wie in Grafana; der Fokus liegt bewusst auf System- und Container-Metriken.

**Fazit:** Für 90 % aller Homelabs und Multi-Node-Setups der klare Testsieger – in unter 5 Minuten produktiv und extrem sparsam.

---

## 2. Netdata – Maximaler Tiefgang in Echtzeit

<img src="/images/logos/netdata.svg" alt="Netdata Logo" style="height: 44px; width: auto; margin-bottom: 0.75rem;" />

**Netdata** liefert direkt nach dem Start hunderte Metriken im Sekundentakt – vom Kernel-Interrupt über Festplatten-Latenzen bis zu einzelnen Systemd-Services.

* **Pro:** Zero-Config-Erkennung fast aller Dienste und extreme Granularität bei akuten Performance-Engpässen („Warum ist der Server gerade träge?“).
* **Contra:** Deutlich höherer RAM- und CPU-Bedarf auf kleinen Mini-PCs; für Multi-Server-Ansichten oft auf Netdata Cloud angewiesen.

**Fazit:** Das perfekte Diagnose-Werkzeug für gezielte Live-Fehlersuche auf stark belasteten Maschinen, für Dauer-Monitoring kleiner Nodes aber oft zu schwergewichtig.

---

## 3. Prometheus + Grafana – Der maximale Baukasten

<img src="/images/logos/prometheus.svg" alt="Prometheus Logo" style="height: 44px; width: auto; margin-bottom: 0.75rem;" />

Die Kombination aus **Prometheus** (Zeitreihendatenbank), **Node Exporter / cAdvisor** und **Grafana** ist der Industriestandard – ideal, wenn neben Linux-Servern auch Router oder Smart-Home-Systeme in einem Dashboard zusammenlaufen sollen.

* **Pro:** Unbegrenzte Anpassbarkeit, riesige Auswahl an Community-Dashboards und beliebig lange Datenhistorie.
* **Contra:** Höherer Wartungsaufwand (`prometheus.yml`, Scrape-Targets, Exporter) und spürbar mehr Speicher- sowie Einarbeitungsbedarf.

**Fazit:** Spielt seine Stärke erst bei komplexen, systemübergreifenden Dashboards aus, in denen viele verschiedene Datenquellen zusammenlaufen.

---

## Quick-Start: Beszel in 5 Minuten per Docker installieren

Beszel besteht aus zwei schlanken Programmen, die im Hintergrund als Docker-Container laufen:
* **Beszel Hub:** Die zentrale Weboberfläche, in der du alle Messwerte im Browser anschaust und Warnmeldungen einrichtest.
* **Beszel Agent:** Ein winziger Datensammler, der auf jedem Linux-Rechner läuft, den du überwachen möchtest (auch auf demselben Server, auf dem schon der Hub liegt).

### Vorbereitung: Server-IP herausfinden & Einbauort wählen

Bevor du startest, brauchst du die lokale IP-Adresse deines Linux-Servers (z. B. `192.168.178.50`). Falls du sie nicht auswendig kennst, melde dich per SSH am Server an und gib `hostname -I` ein – die erste angezeigte Zahl ist deine IP.

Die folgenden YAML-Vorlagen kannst du auf zwei Arten starten:
* **Bequem per Browser in Portainer:** Öffne Portainer → **Stacks → + Add stack**, vergib einen Namen (z. B. `beszel`), füge den Text in das große Editor-Feld ein und klicke unten auf **Deploy the stack**.
* **Direkt im Terminal:** Lege einen Ordner an (z. B. `mkdir -p /opt/beszel && cd /opt/beszel`), speichere den Text in einer Datei namens `docker-compose.yml` und starte ihn mit `docker compose up -d`.

---

### Schritt 1: Den Beszel Hub (die Weboberfläche) starten

Starte zuerst den zentralen Hub auf deinem Hauptserver mit dieser Vorlage:

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

*Erfolgskontrolle:* Öffne deinen Browser und rufe `http://DEINE-SERVER-IP:8090` auf (ersetze `DEINE-SERVER-IP` durch deine echte IP). Es erscheint die Willkommensseite von Beszel, auf der du beim ersten Besuch deine E-Mail-Adresse und ein Admin-Passwort festlegst.

---

### Schritt 2: Deinen ersten Server (Agent) verbinden

Damit im Dashboard Zahlen erscheinen, verknüpfst du jetzt deinen ersten Linux-Server mit dem Hub:

1. Klicke im Beszel-Dashboard oben rechts auf **System hinzufügen** (*Add System*).
2. Trage einen beliebigen **Namen** ein (z. B. `Mein-Server`), darunter die **IP-Adresse** des zu überwachenden Servers (läuft der Agent auf demselben Rechner wie der Hub, trage `127.0.0.1` ein) und belasse den Port auf **`45876`**.
3. Klicke auf **Öffentlichen Schlüssel kopieren** (*Copy Public Key*) – dieser Schlüssel sorgt dafür, dass nur dein Hub die Daten abrufen darf.

Starte nun auf dem zu überwachenden Server den **Agenten** (wieder über Portainer *Stacks* oder als `docker-compose.yml`) und füge deinen kopierten Schlüssel zwischen den Anführungszeichen hinter `KEY:` ein:

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
      KEY: "ssh-ed25519 HIER_DEINEN_KOPIERTEN_SCHLUESSEL_EINFUEGEN"
```

*Erfolgskontrolle:* Wechsle zurück in deinen Browser-Tab mit Beszel. Nach etwa 10 Sekunden springt der Statuspunkt neben deinem Server von Grau auf **Grün** – und CPU-Auslastung, Arbeitsspeicher, Festplatten-Belegung sowie alle laufenden Docker-Container erscheinen live im Dashboard.
