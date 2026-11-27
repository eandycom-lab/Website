---
title: 'MCP im Homelab: Lokale KI sicher mit Home Assistant & Linux verbinden'
description: Mit dem Model Context Protocol (MCP) greifen lokale LLMs wie Ollama oder Claude Desktop kontrolliert auf Home Assistant und Linux zu – inkl. Schritt-für-Schritt-Setup, Variablen-Guide und Sicherheitsregeln.
pubDate: 2026-11-17
updatedDate: ''
heroImage: ''
category: Local AI
tags:
  - MCP
  - Local AI
  - Home Assistant
  - Ollama
  - Linux
  - Docker
---

Ohne direkte Schnittstelle bleibt ein Sprachmodell im Homelab ein reiner Text-Berater: Du fragst nach einer Lösung, kopierst Logzeilen in den Chat und tippst jeden Befehl von Hand ab. Auf echte Zustände zu Hause – ob ein Fenster noch offen steht, wie viel Leistung die PV-Anlage liefert oder welcher Docker-Container gerade den Arbeitsspeicher füllt – hat das Modell keinen Zugriff.

Das **Model Context Protocol (MCP)** schließt genau diese Lücke als offener Standard. Wie ein einheitlicher USB-C-Stecker verbindet MCP moderne KI-Oberflächen (*Open WebUI* mit *Ollama*, *Claude Desktop* oder *Cursor*) direkt mit **Home Assistant** und **Linux-Servern** – ohne eigene Bastel-Skripte und exakt innerhalb der von dir freigegebenen Rechte.

![MCP-Architektur im Homelab: Verbindung zwischen Claude Desktop, Open WebUI/Ollama, Home Assistant und Linux-Servern](/images/model-context-protocol-mcp-homelab-home-assistant-linux-2.webp)

---

## Was dir MCP im Homelab-Alltag konkret abnimmt

| Einsatzbereich | Typische Frage im Chat | Was im Hintergrund passiert |
| :--- | :--- | :--- |
| **Smart Home (Status & Energie)** | *„Welche Fenster sind noch offen und wie hoch ist der aktuelle PV-Überschuss?“* | Die KI liest ausschließlich die von dir freigegebenen Sensor-Zustände aus Home Assistant aus. |
| **Steuerung & Routinen** | *„Schalte im Arbeitszimmer das Licht aus und prüfe, ob die Wärmepumpe läuft.“* | Die KI ruft definierte Home-Assistant-Aktionen auf – kritische Geräte bleiben unsichtbar. |
| **Linux-Server & Docker** | *„Warum braucht mein Nextcloud-Container gerade so viel RAM? Zeig die letzten 20 Logzeilen.“* | Ein lokaler MCP-Server führt lesende Diagnose-Abfragen aus und fasst die Ursache zusammen. |

> **Praxis-Tipp vor dem Start:** Du brauchst für den Einstieg **keinen** separaten Linux-MCP-Container. Home Assistant bringt seinen eigenen MCP-Server direkt ab Werk mit – in unter 10 Minuten steht deine erste funktionierende Verbindung.

---

## Deine lokalen Variablen im Überblick (bitte anpassen!)

Damit die folgende Anleitung auf jedem Heimnetz funktioniert, nutzen wir drei Platzhalter, die du durch die Werte deiner eigenen Umgebung ersetzt:

* **`DEINE-HA-IP`:** Die lokale IP-Adresse deines Home-Assistant-Servers im Heimnetz (z. B. `192.168.178.50`) oder dein lokaler Hostname (z. B. `homeassistant.local`).
* **`DEIN-HA-PORT`:** Standardmäßig **`8123`**. Falls du Home Assistant über einen Reverse Proxy mit HTTPS ansprichst, nutzt du stattdessen `https://ha.deine-lokale-domain.tld` ohne Portnummer.
* **`DEIN_LANGLEBIGES_TOKEN`:** Dein persönlicher API-Schlüssel aus Home Assistant (erstellst du gleich in Schritt 2).

---

## Schritt 1: Integrierten MCP-Server in Home Assistant aktivieren

Home Assistant stellt die MCP-Schnittstelle direkt über seine Weboberfläche bereit – auf der Kommandozeile musst du nichts installieren:

1. Öffne Home Assistant im Browser und gehe unten links auf **Einstellungen → Geräte & Dienste**.
2. Klicke unten rechts auf **+ Integration hinzufügen** und suche nach **Model Context Protocol Server**.
3. Bestätige die Einrichtung. Ab sofort läuft der lokale Endpunkt unter:
   `http://DEINE-HA-IP:8123/mcp_server/sse`

### Pflichtschritt für Einsteiger: Sichtbare Geräte eingrenzen (*Expose*)
Standardmäßig soll die KI nicht deinen gesamten Haushalt sehen. Lege deshalb sofort fest, welche Entitäten freigegeben sind:
1. Gehe zu **Einstellungen → Sprachassistenten → Verfügbar machen** (*Expose*).
2. Aktiviere dort gezielt nur unkritische Lampen, Raumtemperaturen, Stromzähler oder Fensterkontakte.
3. **Wichtig:** Lasse Türschlösser, Garagentore, Alarmanlagen und Hauptschalter für Server-Steckdosen konsequent deaktiviert.

> **Zwischen-Fazit (Schritt 1):** Dein Home-Assistant-MCP-Server läuft jetzt lokal im Heimnetz und zeigt nach außen nur genau die Sensoren und Schalter, die du unter *Verfügbar machen* explizit freigeschaltet hast.

---

## Schritt 2: Zugangsschlüssel (Langlebiges Zugriffstoken) erstellen

Damit sich dein KI-Client sicher gegenüber Home Assistant ausweisen kann, benötigt er ein persönliches Token:

1. Klicke in Home Assistant ganz unten links auf **deinen Benutzernamen** (Profil).
2. Wechsle oben auf den Reiter **Sicherheit** und scrolle ganz nach unten zu **Langlebige Zugriffstoken**.
3. Klicke auf **Token erstellen**, vergib einen eindeutigen Namen (z. B. `MCP KI-Assistent`) und kopiere die angezeigte Zeichenkette sofort in deine Zwischenablage.

> **Stolperfalle:** Home Assistant zeigt diesen Schlüssel aus Sicherheitsgründen **nur ein einziges Mal** an. Wenn du das Fenster schließt, ohne ihn zu kopieren, musst du das Token löschen und ein neues anlegen.

---

## Schritt 3: KI-Client verbinden (Open WebUI oder Claude Desktop)

### Variante A: In Open WebUI (für lokale Modelle mit Ollama)
1. Öffne **Open WebUI** im Browser und navigiere zu **Admin-Bereich → Einstellungen → Externe Tools** (je nach Version *Tools / MCP*).
2. Klicke auf **+ Verbindung hinzufügen** und wähle als Typ **MCP (SSE)**.
3. Trage als Server-URL `http://DEINE-HA-IP:8123/mcp_server/sse` ein und hinterlege dein kopiertes Token im Feld **Bearer Token / API Key**.
4. Nach dem Speichern erscheint unter deinem Chat-Eingabefeld ein **Werkzeug-/Stecker-Symbol**, mit dem du Home Assistant pro Chat aktivieren kannst.

> **Tipp für lokale LLMs in Ollama:** Nutze für MCP-Werkzeugaufrufe Modelle mit sauberem *Tool-Calling*-Support (z. B. `qwen2.5` ab 7B/14B oder `llama3.1` / `mistral-nemo`). Sehr kleine Modelle unter 4B erfinden oft falsche Parameter oder ignorieren verfügbare Tools.

### Variante B: In Claude Desktop (Windows / macOS / Linux)
1. Öffne in Claude Desktop das Menü **Datei → Einstellungen → Entwickler → Konfiguration bearbeiten** (*Edit Config*).
2. Öffne die Datei `claude_desktop_config.json` in einem Texteditor und trage diesen Block ein (passe `DEINE-HA-IP` und `DEIN_LANGLEBIGES_TOKEN` an):

    {
      "mcpServers": {
        "home-assistant": {
          "command": "npx",
          "args": [
            "-y",
            "mcp-remote",
            "http://DEINE-HA-IP:8123/mcp_server/sse",
            "--header",
            "Authorization: Bearer DEIN_LANGLEBIGES_TOKEN"
          ]
        }
      }
    }

3. Speichere die Datei und starte Claude Desktop **komplett** neu (unter Windows auch unten rechts im Infobereich beenden). Danach listet das Stecker-Symbol deine Home-Assistant-Werkzeuge auf.

---

## Schritt 4: Sicherheit & Linux-Erweiterung – drei goldene Regeln

Sobald eine KI nicht nur Text erzeugt, sondern echte Schnittstellen aufruft, gelten im Homelab drei klare Leitplanken:

![MCP-Sicherheits- und Berechtigungsmodell im Homelab: Freigegebene Sensoren vs. gesperrte kritische Geräte und Ports](/images/model-context-protocol-mcp-homelab-home-assistant-linux-3.webp)

1. **Keine Portfreigaben im Router:** Der Endpunkt `/mcp_server/sse` gehört ausschließlich ins lokale Heimnetz oder hinter deinen eigenen VPN-Tunnel (z. B. WireGuard auf der FRITZ!Box) – niemals ungeschützt ins Internet.
2. **Minimal-Prinzip bei Entitäten:** Gib unter *Verfügbar machen* wirklich nur das frei, was du im Alltag per Chat abfragen oder schalten möchtest.
3. **Lesen vor Schreiben auf Linux-Servern:** Wenn du im nächsten Schritt zusätzlich einen Linux- oder Docker-MCP-Server ergänzt, starte immer mit reinen Lese-Rechten (`docker ps`, `docker logs`, `df -h`), bevor du schreibende Aktionen wie Neustarts freigibst.

---

## Gesamtfazit

Mit dem **Model Context Protocol** wird dein Sprachmodell vom passiven Textgenerator zum echten Werkzeug im Homelab – ohne Cloud-Zwang und ohne unübersichtliche Einzel-Skripte. Durch den integrierten MCP-Server in Home Assistant und die gezielte Freigabe über *Verfügbar machen* behältst du jederzeit die volle Kontrolle darüber, welche Sensoren deine KI lesen und welche Schalter sie bedienen darf.
