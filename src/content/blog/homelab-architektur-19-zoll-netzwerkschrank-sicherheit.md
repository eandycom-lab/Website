---
title: "Mein Homelab-Setup im 19-Zoll-Schrank: Hardware, Rollenverteilung und VPN-Sicherheit"
description: "Drei leise Mini-PCs im 19-Zoll-Netzwerkschrank statt einer All-in-One-Kiste: Wie du mit klaren Rollen, USB-Storage plus Offline-Backup und WireGuard-VPN über die FRITZ!Box 5690 ein ausfallsicheres Homelab aufbaust."
pubDate: 2026-11-25T21:30:00
heroImage: "/images/homelab-architektur-19-zoll-netzwerkschrank-sicherheit.webp"
category: "Self-Hosting"
tags: ["Homelab", "Netzwerk", "WireGuard", "Pi-hole", "Docker", "Home Assistant", "Architektur"]
---

Wer sein komplettes Homelab auf einem einzigen Server bündelt, zahlt bei jeder Wartung denselben Preis: Ein Kernel-Update oder ein hängender Docker-Stack legt gleichzeitig das Smart Home, die interne Namensauflösung und den Passwort-Manager lahm.

In meinem kompakten **19-Zoll-Netzwerkschrank** laufen deshalb **drei spezialisierte, extrem sparsame Mini-PCs** mit klar getrennten Aufgaben – kombiniert mit einer FRITZ!Box 5690 direkt am Glasfaseranschluss und null offenen Ports ins Internet.

---

## Das Grundprinzip: Drei spezialisierte Nodes statt einer All-in-One-Kiste

Jeder Rechner im Rack übernimmt genau die Rolle, für die seine Hardware gebaut ist: Basis-Infrastruktur, Smart Home oder rechenintensive Apps.

| Baustein / Node | Hardware & Ausstattung | Betriebssystem & Rolle | Laufende Dienste |
| :--- | :--- | :--- | :--- |
| **Internet & Router** | **FRITZ!Box 5690** (direkt am Glasfaseranschluss, ohne separates Modem) | FRITZ!OS – zentrales Gateway & **WireGuard-VPN-Server** | Glasfaser-Einwahl, Firewall (keine Portfreigaben), VPN-Endpunkt |
| **Netzwerk-Backbone** | **TP-Link TL-SG1024DE** (24-Port Gigabit Smart Switch) | Lokale Gigabit-Vernetzung im 19"-Rack | Verbindet Router, alle drei Server-Nodes und Hausverkabelung |
| **Node 1: Core & Gateway** | **Dell Wyse 5070** (Intel J4105, 8 GB RAM, 256 GB SSD) | Schlankes Linux + Docker & Portainer | **Pi-hole** (DNS-Filter), **Vaultwarden** (Passwörter), **Nginx Proxy Manager** |
| **Node 2: Smart Home** | **Dell Wyse 5070** (Intel J4105, 20 GB RAM, 256 GB SSD) | **Home Assistant OS (Bare-Metal)** | Zentrale Haussteuerung (Wärmepumpe, PV-Anlage, Zigbee/Thread, Wetterstation) |
| **Node 3: Apps & Medien** | **SOYO M4 Mini** (Intel Twin Lake N150, 12 GB DDR5, 512 GB SSD) | Linux + Docker, Portainer & Monitorix | **Nextcloud**, **Paperless-ngx**, **Immich**, **PhotoPrism**, **Jellyfin**, **Syncthing**, **NetAlertX** |
| **Storage & Backup** | **12 TB WD Elements** + **10 TB WD Elements** (USB 3.0 an Node 3) | Zwei-stufiges Speicherkonzept | 12 TB als dauerhafter Daten-/Medienspeicher; 10 TB als dedizierte Backup-Platte |

---

## Die drei Rechner im Detail: Warum diese Aufteilung?

### 1. Node 1 (Dell Wyse 5070, 8 GB RAM): Die stille Basis-Infrastruktur
Gebrauchte **Dell Wyse 5070 Thin Clients** sind lüfterlos, komplett lautlos und ziehen im Leerlauf rund 4 bis 6 Watt. Auf dem ersten Wyse laufen genau die Dienste, die im Heimnetz **immer** erreichbar bleiben müssen – selbst wenn der große App-Server neu startet:
* **Pi-hole:** Filtert Werbung und Tracker netzwerkweit und übernimmt die interne DNS-Auflösung für lokale Dienste.
* **Vaultwarden:** Selbst gehosteter Passwort-Manager für die gesamte Familie.
* **Nginx Proxy Manager (NPM):** Liefert lokale HTTPS-Zertifikate und sprechende interne Domains statt IP-Adressen und Portnummern.

### 2. Node 2 (Dell Wyse 5070, 20 GB RAM): Dediziertes Home Assistant OS
Der zweite Wyse 5070 steuert ausschließlich das Haus und läuft **Bare-Metal mit Home Assistant OS**. Lichtschalter, Heizungs- und Wärmepumpen-Regelung sowie Alarme arbeiten dadurch unabhängig von Docker-Updates auf den übrigen Maschinen. Der aufgerüstete Arbeitsspeicher hält genug Reserven für Datenbank, Add-ons und Kamerastreams bereit.

### 3. Node 3 (SOYO M4 Mini, Intel N150, 12 GB DDR5): Das Arbeitstier für Daten & Medien
Rechenintensive Aufgaben – Texterkennung in **Paperless-ngx**, Bilderkennung in **Immich** und **PhotoPrism**, **Nextcloud** oder Streaming über **Jellyfin** – laufen auf dem modernen **Intel N150 Mini-PC**. Verwaltet werden beide Linux-Nodes einheitlich über **Portainer** (Container-Stacks) und **Monitorix** (System- und Last-Graphen).

---

## Speicher & Backup: 12 TB Storage + 10 TB Backup-Trennung

Große Medienbibliotheken, Fotos und Dokumentenarchive belegen viel Platz, ohne interne SSDs vollzuschreiben. Am App-Node hängen deshalb per USB 3.0 zwei externe **WD Elements Festplatten** mit getrennten Aufgaben:

![Storage- und Backup-Konzept mit 12 TB Produktivspeicher und 10 TB Backup-Festplatte](/images/homelab-architektur-19-zoll-netzwerkschrank-sicherheit-2.webp)

1. **Produktiv-Storage (12 TB):** Liegt dauerhaft bereit und speichert Filme, Serien, Fotoarchive sowie lokale Container-Sicherungen.
2. **Dedizierte Backup-Platte (10 TB):** Wird gezielt für Sicherungsläufe zugeschaltet – so bleiben Backups im Alltag physisch vom Produktivspeicher getrennt und sind vor versehentlichem Löschen oder Überspielen geschützt.

---

## Netzwerk & Security: Kein offener Port, alles durch VPN und Pi-hole

Kein einziger Dienst aus dem Homelab ist direkt aus dem Internet erreichbar. Im Router existieren keinerlei Portweiterleitungen auf den Reverse Proxy oder einzelne Container.

![Zugriffs- und Sicherheitsarchitektur über WireGuard-VPN, FRITZ!Box 5690 und Pi-hole](/images/homelab-architektur-19-zoll-netzwerkschrank-sicherheit-3.webp)

  * **Glasfaser direkt an der FRITZ!Box 5690:** Der Glasfaseranschluss geht ohne vorgeschaltetes Modem direkt in die FRITZ!Box 5690. Sie bildet die einzige Grenze zum Internet.
  * **Zugriff von unterwegs per WireGuard-VPN:** Smartphones und Laptops verbinden sich unterwegs per **WireGuard** direkt mit der FRITZ!Box 5690. Auf Reisen übernimmt das ein kompakter **GL.iNet Reiserouter**, der den Tunnel automatisch für alle verbundenen Geräte im Hotel-WLAN aufbaut.
  * **Voller Pi-hole-Schutz auch mobil:** Weil der WireGuard-Tunnel den DNS-Verkehr der mobilen Geräte direkt an **Pi-hole** auf Node 1 weiterleitet, greifen Werbeblocker und interne DNS-Namen unterwegs exakt genauso wie zu Hause im WLAN.

---

## Vor- und Nachteile dieser Drei-Node-Architektur

  * **Vorteile:**
    * **Hohe Ausfallsicherheit:** Wartungsarbeiten am App-Server beeinträchtigen weder Internet, DNS noch das Smart Home.
    * **Geringer Stromverbrauch:** Alle drei Mini-PCs zusammen verbrauchen im Normalbetrieb weniger als ein einziger älterer Tower-Server.
    * **Minimale Angriffsfläche:** Ohne offene Ports im Router laufen automatisierte Angriffe aus dem Internet ins Leere.
    * **Modular erweiterbar:** Jede Node lässt sich einzeln aufrüsten oder ersetzen, ohne das Gesamtsystem neu aufzusetzen.
  * **Nachteile:**
    * **Mehr Pflegeaufwand:** Drei Rechner bedeuten drei Betriebssysteme, die aktuell gehalten und überwacht werden müssen.
    * **Mehr Verkabelung im Schrank:** Drei Netzteile und Patchkabel erfordern sauberes Kabelmanagement im 19-Zoll-Rack.

**Fazit:** Zwei gebrauchte, lautlose Thin Clients für die kritische Basis plus ein moderner N150-Mini-PC für datenintensive Apps treffen im Homelab den besten Kompromiss aus Kosten, Stromverbrauch und Ausfallsicherheit. Sobald Smart Home und DNS auf eigener Hardware getrennt laufen, verlieren Updates auf dem App-Server ihren Schrecken.
