---
title: "Home Assistant: Bare-Metal (HAOS) oder Docker? Vor- und Nachteile im Praxisvergleich"
description: "Soll Home Assistant auf einem eigenen Mini-PC (Bare-Metal) oder als Docker-Container auf dem Homeserver laufen? Alle Unterschiede bei Add-ons, USB-Sticks, Updates und Wartung verständlich erklärt."
pubDate: 2026-11-24T21:00:00
heroImage: "/images/home-assistant-bare-metal-vs-docker-vergleich.webp"
category: "Home Automation"
tags: ["Home Assistant", "Docker", "Bare-Metal", "HAOS", "Self-Hosting", "Smart Home", "Vergleich"]
---

Wer mit **Home Assistant** startet oder sein Smart Home ausbaut, steht früher oder später vor einer grundlegenden Architektur-Frage: Installiere ich Home Assistant als eigenes Betriebssystem direkt auf einem kleinen Rechner (**Bare-Metal / Home Assistant OS**) – oder lasse ich es als einen von vielen Diensten im **Docker-Container** auf meinem bestehenden Linux-Server mitlaufen?

Beide Wege funktionieren im Alltag zuverlässig, unterscheiden sich aber deutlich beim Wartungsaufwand, bei Zusatzfunktionen (**Add-ons**) und beim Umgang mit Funk-Sticks für Zigbee oder Matter over Thread.

---

## Was bedeuten „Bare-Metal“ und „Docker“ konkret?

- **Bare-Metal (Home Assistant OS / HAOS):** Du nimmst einen eigenen kleinen Rechner (z. B. einen sparsamen Mini-PC mit Intel N100 oder einen x64 Thin Client wie einen Wyse 5070) und spielst darauf ausschließlich das offizielle **Home Assistant Operating System** auf. Der Rechner macht nichts anderes als dein Smart Home zu steuern.
- **Docker (Home Assistant Container):** Auf deinem Linux-Server läuft bereits ein normales Betriebssystem (z. B. Ubuntu Server) mit Docker und Portainer. Home Assistant läuft darin als isolierter Container neben Diensten wie Nextcloud, Paperless-ngx oder Pi-hole.

---

## Direkter Vergleich: Bare-Metal (HAOS) vs. Docker

| Kriterium | Bare-Metal (Home Assistant OS) | Docker (Home Assistant Container) |
| :--- | :--- | :--- |
| **Einrichtung** | Sehr einfach (Image flashen, booten, fertig) | Mittel (Docker-Compose & Verzeichnisse anlegen) |
| **Add-on-Store (1-Klick)** | **Ja, voll integriert** (Zigbee2MQTT, Mosquitto, File Editor, Studio Code) | **Nein** – Zusatzdienste müssen als eigene Docker-Container gestartet werden |
| **Updates & Backups** | Ein Klick direkt in der Home-Assistant-Oberfläche | Image-Update über Portainer/Compose; Backups per Datei-Sicherung |
| **USB-Funksticks (Zigbee / Thread)** | Plug & Play ohne Umwege | Müssen im Compose-File explizit durchgereicht werden (`/dev/serial/by-id/...`) |
| **Hardware-Auslastung** | Eigener Mini-PC nötig (ca. 6–12 Watt Dauerverbrauch) | Nutzt vorhandene Server-Ressourcen mit (0 € Extra-Hardware) |
| **Unabhängigkeit bei Server-Wartung** | **Hoch** – läuft weiter, wenn der Hauptserver neu startet | Fällt kurz aus, wenn der Docker-Host gewartet oder neu gestartet wird |

---

## Architektur im Detail: HAOS vs. Docker Container

Der wesentliche Unterschied liegt in der Systemarchitektur und dem Supervisor. Während HAOS das gesamte Host-System samt Add-on-Infrastruktur verwaltet, ist der Docker-Container eine reine Anwendung ohne Zugriff auf ein internes Betriebssystem-Management:

![Architektur-Vergleich Bare-Metal HAOS vs. Docker Container](/images/home-assistant-bare-metal-vs-docker-vergleich-2.webp)

---

## Warum der Add-on-Store in der Praxis den Unterschied macht

Einsteiger unterschätzen oft, was der **Add-on-Store** in Home Assistant OS eigentlich leistet. In HAOS ist der sogenannte **Supervisor** aktiv. Willst du Zigbee-Geräte anbinden oder MQTT nutzen, klickst du im Store auf „Installieren“ bei **Zigbee2MQTT** und **Mosquitto broker**. Der Supervisor lädt, konfiguriert und verknüpft diese Container im Hintergrund vollautomatisch mit Home Assistant.

Bei der **Docker-Installation** (Home Assistant Container) gibt es **keinen Supervisor** und **keinen Add-on-Store**. Du musst jeden Begleitdienst manuell in deinem Docker-Compose-Stack aufsetzen und vernetzen:

```yaml
services:
  homeassistant:
    container_name: homeassistant
    image: ghcr.io/home-assistant/home-assistant:stable
    volumes:
      - /opt/homeassistant/config:/config
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped
    privileged: true
    network_mode: host

  mosquitto:
    image: eclipse-mosquitto:latest
    container_name: mosquitto
    ports:
      - "1883:1883"
    volumes:
      - /opt/mosquitto/config:/mosquitto/config
      - /opt/mosquitto/data:/mosquitto/data
    restart: unless-stopped

  zigbee2mqtt:
    image: koenkk/zigbee2mqtt:latest
    container_name: zigbee2mqtt
    restart: unless-stopped
    volumes:
      - /opt/zigbee2mqtt/data:/app/data
      - /run/udev:/run/udev:ro
    ports:
      - "8080:8080"
    devices:
      - /dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2-if00-port0:/dev/ttyACM0
    environment:
      - TZ=Europe/Berlin
    depends_on:
      - mosquitto
```

*Wichtig bei Docker:* Verwende für USB-Sticks niemals `/dev/ttyUSB0` oder `/dev/ttyACM0`, sondern immer den eindeutigen Pfad unter `/dev/serial/by-id/...`. Andernfalls kann sich der Port nach einem Neustart oder USB-Wechsel ändern und die Funkverbindung bricht ab.

---

## Wann lohnt sich welcher Weg?

![Entscheidungs-Matrix und 3-Schritt-Migration von Docker zu HAOS](/images/home-assistant-bare-metal-vs-docker-vergleich-3.webp)

### Wann Docker die richtige Wahl ist:
- Du möchtest Home Assistant erst einmal unverbindlich ausprobieren.
- Du betreibst bereits einen Linux-Homeserver, der 24/7 läuft, und hast keine Zigbee/Thread-Funksticks im Einsatz (z. B. rein cloud- oder LAN-basierte Smart-Home-Komponenten).
- Du liebst es, deine Infrastruktur komplett per Git und Docker-Compose zu verwalten und scheust den manuellen Setup-Aufwand nicht.

### Wann Bare-Metal (HAOS) gewinnt:
- **Kritische Infrastruktur:** Dein Smart Home steuert Heizung, PV-Überschuss, Lüftung oder die tägliche Beleuchtung.
- **Family Acceptance Factor (WAF):** Wenn du deinen Hauptserver wartest, Kernel-Updates machst oder Docker neu startest, darf das Smart Home nicht ausfallen. Licht und Heizung müssen 100 % autark laufen.
- **Funk-Komponenten:** Du nutzt Zigbee (z. B. Sonoff, ConBee) oder Matter over Thread. Plug & Play in HAOS spart dir unzählige Stunden Fehlersuche.
- **Wartungsfreiheit:** System-Backups und Add-on-Updates sind mit einem Klick in der App erledigt.

---

## Praxiserfahrung: Warum mein Home Assistant von Docker auf Bare-Metal umgezogen ist

Ich habe Home Assistant anfangs selbst lange in Docker betrieben. Solange es nur um ein paar smarte Steckdosen ging, war das kein Problem. Sobald jedoch Heizkörperthermostate, Präsenzmelder und die Photovoltaik-Steuerung hinzukamen, wurde das Setup kritisch.

Jedes Mal, wenn am Docker-Host Updates anstanden, Docker-Neustarts durchgeführt wurden oder USB-Geräte durchgereicht werden mussten, gab es unruhige Momente im Haushalt.

**Die Lösung:** Der Umzug auf einen dedizierten, extrem sparsamen x64 Thin Client (ca. 6–7 Watt Dauerverbrauch, z. B. Intel N100 oder Wyse 5070) mit nativem Home Assistant OS.

Der Umzug dauerte dank der integrierten Backup-Funktion keine 15 Minuten:
1. Vollständiges Backup in der Docker-Instanz erstellen und herunterladen.
2. Mini-PC mit HAOS flashen (z. B. via BalenaEtcher / Ventoy).
3. Beim ersten Start auf dem Mini-PC „Backup wiederherstellen“ wählen, USB-Zigbee-Stick umstecken – fertig.

Seitdem läuft das Smart Home völlig entkoppelt von jeglicher Server-Bastelei mit maximaler Stabilität und 100 % Akzeptanz im Alltag.