---
title: "Mein Homelab-Setup im 19-Zoll-Schrank: Hardware, Rollenverteilung und VPN-Sicherheit"
description: "Wie baut man ein stromsparendes, ausfallsicheres Homelab auf? Ein Blick hinter die Kulissen: Drei leise Mini-PCs im 19-Zoll-Netzwerkschrank, klare Dienstetrennung, USB-Storage mit Offline-Backup und abgesicherter Zugriff per WireGuard-VPN und Pi-hole."
pubDate: 2026-11-25T21:30:00
heroImage: "/images/homelab-architektur-19-zoll-netzwerkschrank-sicherheit.webp"
category: "Self-Hosting"
tags: ["Homelab", "Netzwerk", "WireGuard", "Pi-hole", "Docker", "Home Assistant", "Architektur"]
---

Ein gutes Homelab muss weder laut noch stromhungrig sein – und schon gar nicht aus teurer Enterprise-Serverhardware bestehen. Viel wichtiger als rohe Rechenleistung ist eine **saubere Architektur**: Welcher Dienst läuft auf welcher Maschine, wie sind Daten gegen Ausfälle gesichert und wie bleibt das Heimnetz von außen geschützt?

In diesem Artikel zeige ich dir den kompletten Aufbau meines eigenen Homelabs in einem kompakten **19-Zoll-Netzwerkschrank** – inklusive der Hardware-Auswahl, der Aufgabenverteilung auf drei spezialisierte Mini-PCs und dem Sicherheitskonzept ganz ohne offene Ports im Router.

---

## Das Grundprinzip: Drei spezialisierte Nodes statt einer All-in-One-Kiste

Viele Einsteiger starten mit einem einzigen Server, auf dem alles gleichzeitig läuft. Das funktioniert am Anfang gut, hat im Alltag aber einen Haken: Wenn du am Linux-Kernel schraubst, Docker-Stacks neu startest oder experimentierst, fällt im ganzen Haus gleichzeitig das Smart Home, die Namensauflösung und der Passwort-Manager aus.

Deshalb teilt mein Setup die Aufgaben konsequent auf **drei getrennte, extrem sparsame Rechner** im 19-Zoll-Schrank auf:

| Baustein / Node | Hardware & Ausstattung | Betriebssystem & Rolle | Laufende Dienste |
| :--- | :--- | :--- | :--- |
| **Internet & Router** | **FRITZ!Box 5690** (direkt am Glasfaseranschluss, kein separates Modem) | FRITZ!OS – zentrales Gateway & **WireGuard-VPN-Server** | Glasfaser-Einwahl, Firewall (keine Portfreigaben), VPN-Endpunkt |
| **Netzwerk-Backbone** | **TP-Link TL-SG1024DE** (24-Port Gigabit Smart Switch) | Lokale Gigabit-Vernetzung im 19"-Rack | Verbindet Router, alle drei Server-Nodes und Hausverkabelung |
| **Node 1: Core & Gateway** | **Dell Wyse 5070** (Intel J4105, 8 GB RAM, 256 GB SSD) | Schlankes Linux + Docker & Portainer | **Pi-hole** (DNS-Filter), **Vaultwarden** (Passwörter), **Nginx Proxy Manager** |
| **Node 2: Smart Home** | **Dell Wyse 5070** (Intel J4105, 20 GB RAM, 256 GB SSD) | **Home Assistant OS (Bare-Metal)** | Zentrale Haussteuerung (Wärmepumpe, PV-Anlage, Zigbee/Thread, Wetterstation) |
| **Node 3: Apps & Medien** | **SOYO M4 Mini** (Intel Twin Lake N150, 12 GB DDR5, 512 GB SSD) | Linux + Docker, Portainer & Monitorix | **Nextcloud**, **Paperless-ngx**, **Immich**, **PhotoPrism**, **Jellyfin**, **Syncthing**, **NetAlertX** |
| **Storage & Backup** | **12 TB WD Elements** + **10 TB WD Elements** (USB 3.0 an Node 3) | Zwei-stufiges Speicherkonzept | 12 TB als dauerhafter Daten-/Medienspeicher; 10 TB als dedizierte Backup-Platte |

---

## Die drei Rechner im Detail: Warum diese Aufteilung?

### 1. Node 1 (Dell Wyse 5070, 8 GB RAM): Die stille Basis-Infrastruktur
Gebrauchte **Dell Wyse 5070 Thin Clients** sind für ein Homelab echte Geheimtipps: Sie sind lüfterlos, komplett lautlos und begnügen sich im Leerlauf mit rund 4 bis 6 Watt. Auf dem ersten Wyse laufen genau die Dienste, die im Netzwerk **immer** erreichbar sein müssen – selbst wenn der große App-Server gerade gewartet wird:
* **Pi-hole:** Filtert Werbung und Tracker netzwerkweit für alle Geräte im Haus – und übernimmt gleichzeitig die interne DNS-Auflösung für lokale Dienste.
* **Vaultwarden:** Der selbst gehostete Passwort-Manager für die gesamte Familie.
* **Nginx Proxy Manager (NPM):** Sorgt für saubere lokale HTTPS-Zertifikate und sprechende interne Adressen statt kryptischer IP-Nummern und Ports.

### 2. Node 2 (Dell Wyse 5070, 20 GB RAM): Dediziertes Home Assistant OS
Der zweite Wyse 5070 ist ausschließlich für das Smart Home reserviert und läuft **Bare-Metal mit Home Assistant OS**. Durch die physische Trennung von den übrigen Docker-Containern laufen Lichtschalter, Heizungs- und Wärmepumpen-Regelung sowie Alarme selbst dann weiter, wenn auf einem der anderen Rechner Updates eingespielt werden. Dank aufgerüstetem Arbeitsspeicher hat das System reichlich Reserven für Datenbank, Add-ons und Kamerastreams.

### 3. Node 3 (SOYO M4 Mini, Intel N150, 12 GB DDR5): Das Arbeitstier für Daten & Medien
Wo mehr CPU-Leistung gefragt ist – etwa bei der Texterkennung in **Paperless-ngx**, der Bilderkennung in **Immich** und **PhotoPrism**, bei **Nextcloud** oder beim Streaming über **Jellyfin** –, kommt der moderne **Intel N150 Mini-PC** zum Einsatz. Verwaltet werden beide Linux-Nodes einheitlich über **Portainer** (für die Container-Stacks) und **Monitorix** (für schnelle System- und Last-Graphen).

---

## Speicher & Backup: 12 TB Storage + 10 TB Backup-Trennung

Große Medienbibliotheken, Fotos und Dokumentenarchive brauchen viel Platz, ohne teure NVMe-SSDs vollzuschreiben. Deshalb hängen am App-Node per USB 3.0 zwei externe **WD Elements Festplatten** mit klar getrennten Rollen:

1. **Produktiv-Storage (12 TB):** Liegt dauerhaft bereit und speichert Filme, Serien, Fotoarchive sowie lokale Container-Sicherungen.
2. **Dedizierte Backup-Platte (10 TB):** Wird gezielt für Sicherungsläufe zugeschaltet – so bleiben die Backups im Alltag physisch vom Produktivspeicher getrennt und sind vor versehentlichem Löschen oder Überspielen geschützt.

---

## Netzwerk & Security: Kein offener Port, alles durch VPN und Pi-hole

Ein zentraler Grundsatz meines Setups lautet: **Kein einziger Dienst aus dem Homelab ist direkt aus dem Internet erreichbar.** Im Router gibt es keinerlei Portweiterleitungen auf den Reverse Proxy oder einzelne Container.

  * **Glasfaser direkt an der FRITZ!Box 5690:** Der Glasfaseranschluss geht ohne vorgeschaltetes externes Modem direkt in die FRITZ!Box 5690. Sie bildet die einzige Grenze zum Internet.
  * **Zugriff von unterwegs per WireGuard-VPN:** Smartphones und Laptops verbinden sich unterwegs per **WireGuard** direkt mit der FRITZ!Box 5690. Auf Reisen übernimmt das ein kompakter **GL.iNet Reiserouter**, der den Tunnel automatisch für alle verbundenen Geräte im Hotel-WLAN aufbaut.
  * **Voller Pi-hole-Schutz auch mobil:** Weil der WireGuard-Tunnel den DNS-Verkehr der mobilen Geräte direkt an **Pi-hole** auf Node 1 weiterleitet, greifen Werbeblocker und interne DNS-Namen unterwegs exakt genauso wie zu Hause im WLAN.

---

## Vor- und Nachteile dieser Drei-Node-Architektur

  * **Vorteile:**
    * **Hohe Ausfallsicherheit:** Wartungsarbeiten am App-Server beeinträchtigen weder Internet, DNS noch das Smart Home.
    * **Extrem geringer Stromverbrauch:** Alle drei Mini-PCs zusammen verbrauchen im Normalbetrieb oft weniger als ein einziger älterer Tower-Server.
    * **Maximale Sicherheit:** Ohne offene Ports im Router gibt es keine Angriffsfläche für automatisierte Bots aus dem Internet.
    * **Günstig & modular erweiterbar:** Jede Komponente lässt sich einzeln aufrüsten oder ersetzen, ohne das Gesamtsystem neu aufzusetzen.
  * **Nachteile:**
    * **Mehr Verwaltungsaufwand am Anfang:** Drei Systeme bedeuten auch drei Betriebssysteme, die aktuell gehalten und überwacht werden müssen.
    * **Mehr Verkabelung im Schrank:** Drei Netzteile und Patchkabel erfordern sauberes Kabelmanagement im 19-Zoll-Rack.

**Fazit:** Die Kombination aus zwei gebrauchten, lautlosen Thin Clients für die kritische Basis und einem modernen N150-Mini-PC für datenintensive Apps trifft im Homelab den perfekten Sweetspot aus Preis, Stromverbrauch und Ausfallsicherheit. Wer einmal erlebt hat, wie entspannt Updates laufen, wenn Smart Home und DNS auf eigener Hardware getrennt sind, will nicht mehr zur All-in-One-Lösung zurück.
