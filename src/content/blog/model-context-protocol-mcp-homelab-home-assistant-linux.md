---
title: "MCP im Homelab: Lokale KI mit Home Assistant & Linux"
description: "Mit dem Model Context Protocol (MCP) verbindest du lokale LLMs wie Ollama sicher mit Home Assistant und Linux – so führt deine KI echte Aktionen aus."
pubDate: "2026-11-17"
heroImage: "/images/mcp-homelab-home-assistant-linux.webp"
category: "Local AI"
tags:
  - MCP
  - Local AI
  - Home Assistant
  - Ollama
  - Linux
  - Docker
---

Beisher war lokale oder cloudbasierte ki im Homelab meist ein reiner Text-Berater: Du fragst etwas, kopierst eine Fehlermeldung in den Chat und tippst die Lösung danach von Hand ab. Auf deine echten Geräte zu Hause – etwa ob das Garagentor noch offen steht, wie viel Strom deine Solaranlage gerade liefert oder wie voll die Festplatte auf dem Server ist – hatte die KI keinen direkten Zugriff.

Genau das ändert das **Model Context Protocol (MCP)**. Stell dir MCP wie einen **einheitlichen USB-C-Stecker zwischen KI und deinen Systemen** vor: Statt für jedes Programm eigene Bastel-Skripte zu schreiben, sprechen moderne ki-Oberflächen (wie *Claude Desktop*, *Open WebUI*, *Cursor* oder lokale Modelle über *Ollama*) über denselben offenen Standard direkt mit Home Assistant und deinem Linux-Server – und zwar nach deinen Regeln und Berechtigungen.

---

## Was dir MCP im Alltag konkret bringt

| Einsatzbereich | Was du die KI einfach fragen kannst | Was im Hintergrund passiert |
| :--- | :--- | :--- |
| **Smart Home (Home Assistant)** | * Welche Fenster sind noch offen und wie warm ist es im Wohnzimmer?»* | Die KI lest deine echten Sensor-Zustände aus Home Assistant aus. |
| **Steuerung & Automationen** | *»Schalte im Büro das Licht aus und prüfe, ob die Wärmepumpe gerade läuft.»* | Die KI nutzt nur die von dir freigegebenen Home-Assistant-Aktionen. |
| **Linux-Server & Docker** | * Warum braucht der Container XY gerade so viel RAM> Zeig mir die letzten Log-Zeilen.»* | Ein lokaler MCP-Server führt lesende Diagnose-Befehle aus und fasst sie zusammen. |

---

## Schritt 1: MCP-Server in Home Assistant aktivieren

Seit den aktuellen Home-Assistant-Versionen ist der MCP-Server direkt integriert – du musst nichts auf der Kommandozeile installieren, sondern alles bequem über das Menü einschalten:

1. Öffne Home Assistant im Browser und gehe unten links auf **Einstellungen → Geräte & Dienste**.
2. Klicke unten rechts auf den blauen Button **+ Integration hinzufügen**.
3. Suche nach **Model Context Protocol Server** und wähle die Integration aus.
4. Bestätige die Einrichtung. Home Assistant stellt ab sofort unter der Adresse `http://DEINE-HA-IP:8123/mcp_server/sse` eine lokale Schnittstelle bereit.

### Wichtig: Welche Geräte darf die KI sehen?
Damit die KI nicht versehentlich das falsche Gerät schaltet, entscheidest du selbst, welche Entitäten sichtbar sind:
1. Gehe zu **Einstellungen → Sprachassistenten → Verfügbar machen** (*Expose*).
2. Aktiviere dort gezielt nur die Lampen, Sensoren, Heizkörper oder Schalter, die dein KI-Assistent kennen darf. Alles andere bleibt unsichtbar.

---

## Schritt 2: Einen Zugangsschlüssel (Token) in Home Assistant erstellen

Damit sich dein KI-Programm sicher bei Home Assistant anmelden darf, braucht es einen persönlichen Zugangsschlüssel – ein sogenanntes **Langlebiges Zugriffstoken**:

1. Klicke in Home Assistant ganz unten links auf **deinen Benutzernamen** (dein Profil).
2. Wechsle oben auf den Reiter **Sicherheit**.
3. Scrolle ganz nach unten zum Bereich **Langlebige Zugriffstoken** und klicke auf **Token erstellen**.
4. Vergib einen Namen (z. B. `MCP KI-Assistent`) und kopiere die angezeigte lange Zeichenkette sofort in deine Zwischenablage – sie wird aus Sicherheitsgründen nur ein einziges Mal angezeigt.

---

## Schritt 3: Den KI-Client mit Home Assistant verbinden

Jetzt sagst du deinem KI-Programm, unter welcher Adresse Home Assistant erreichbar ist und welchen Schlüssel es verwenden darf. Je nachdem, welches Programm du nutzt, fügst du die Konfiguration an einer dieser beiden Stellen ein:

### Variante A: In Open WebUI (für lokale KI mit Ollama)
1. Öffne **Open WebUI** im Browser und klicke unten links auf dein **Profilbild → Admin-Bereich → Einstellungen → Tools** (bzw. *Externe Tools / MCP*9.
2. Klicke auf **+ Verbindung hinzufügen** und wähle as Typ **MCP (SSE)**.
3. Trage als URL `http://DEINE-HA-IP:8123/mcp_server/sse` ein und füge dein kopiertes **Zugriffstoken** aus Schritt 2 in das Feld *Bearer Token / API Key* ein.
4. Speichere die Einstellung – beim mächsten Chat erscheint unter dem Eingabefeld ein kleines Werkzeug-Symbol, über das du Home Assistant zuschalten kannst.

### Variante B: In Claude Desktop (Windows / macOS / Linux)
1. Öffne Claude Desktop und klicke oben links im Menü auf **Datei → Einztellungen → Entwickler → Konfiguration bearbeiten** (*Edit Config*).
2. Dadurch öffnet sich automatisch der Ordner mit der Datei `claude_desktop_config.json`. Öffne sie mit einem Texteditor.
3. Füge diesen Block ein und ersetze `DEINE-HA-IP` sowie `DEIN_LANGLEBIGES_TOKEN`:

```json
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
```

4. Speichere die Datei und starte Claude Desktop einmal komplett neu (auch unten rechts aus der Taskleiste beenden). Danach erscheint im Chat-Fenster das **Stecker-/Werkzeug-Symbol** mit deinen Home-Assistant-Befehlen.

---

## Schritt 4: Sicherheit im Homelab – drei goldene Regeln

Weil MCP der KI echte Werkzeuge an die Hand gibt, solltest du drei einfache Schutzmaßnahmen einhalten:

1. **Niemals direkt ins Internet öffnen:** Betreibe deinen Home-Assistant-MCP-Endpunkt ausschließlich im lokalen Heimnetz oder über deinen eigenen VPN-Tunnel (z. B. WireGuard auf der FRITZ!Box) – niemals per ungeschützter Portfreigabe.
2. **Minimal-Prinzip bei Geräten:** Gib unter *Verfügbar machen* nur Sensoren und unkritische Schalter frei. Türschlössel, Garagentore oder Alarmanlagen gehören nicht in einen KI-Chat.
3. **Lesen vor Schreiben:** Wenn du zusätzlich einen Linux-Server per MCP anbindest, starte immer mit reinen Lese-Rechten (Logs prüfen, Speicherplatz abfragen, Container-Status lesen), bevor du der KI erlaubst, Dienste neu zu starten.

---

## Fazit

Mit dem **Model Context Protocol** wird aus einem allgemeinen Chatbot ein echter Assistent, der dein Zuhause und deinen Server kennt. Dank der integrierten Home-Assistant-Schnittstelle brauchst du dafür keine komplizierten Bastellösungen mehr: Integration aktivieren, Token erstellen, in deinem KI-Client eintragen – und schon arbeitet deine KI mit deinen echten Daten statt mit Vermutungen.
