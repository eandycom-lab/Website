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

* **Bare-Metal (Home Assistant OS / HAOS):** Du nimmst einen eigenen kleinen Rechner (z. B. einen sparsamen Mini-PC mit Intel N100 oder einen Raspberry Pi 5) und spielst darauf ausschließlich das offizielle **Home Assistant Operating System** auf. Der Rechner macht nichts anderes als dein Smart Home zu steuern.
* **Docker (Home Assistant Container):** Auf deinem Linux-Server läuft bereits ein normales Betriebssystem (z. B. Ubuntu Server) mit Docker und Portainer. Home Assistant läuft darin als isolierter Container neben Diensten wie Nextcloud, Paperless-ngx oder Pi-hole.

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
