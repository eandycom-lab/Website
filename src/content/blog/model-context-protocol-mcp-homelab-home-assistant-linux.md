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

Ein lokales Sprachmodell mit **Ollama** und **Open-WebUI** auf eigener Hardware zu betreiben, fühlt sich bereits wie ein großer Schritt Richtung digitale Souveränität an. Doch in der Praxis stößt man schnell an eine unsichtbare Wand: Das Modell kann zwar Code erklären, Konfigurationen entwerfen oder Texte zusammenfassen – **es hat aber keinerlei Zugriff auf dein echtes System**. Es weiß nicht, wie warm es gerade im Wohnzimmer ist, ob ein Docker-Container hängt oder wie hoch die CPU-Last auf deinem Home-Server liegt.

Genau hier kommt das **Model Context Protocol (MCP)** ins Spiel. Statt für jedes Tool eigene API-Brücken, Webhooks oder fragilen Kleber-Code zu bauen, liefert MCP einen einheitlichen Standard, über den lokale wie cloudbasierte KI-Clients sicher auf Werkzeuge und Datenquellen zugreifen können.

## Was ist das Model Context Protocol (MCP) eigentlich?

Man kann sich MCP wie einen **USB-C-Standard für KI-Agenten** vorstellen. Entwickelt als offenes Protokoll, trennt es sauber zwischen dem Sprachmodell (dem „Gehirn“) und den konkreten Werkzeugen (den „Händen“):

* **MCP-Host / Client:** Deine Chat- oder Agenten-Oberfläche (z. B. Open-WebUI, Claude Desktop, Continue oder ein eigener Python-Agent), die das LLM ansteuert.
* **MCP-Server:** Leichtgewichtige Dienste, die klar definierte Funktionen (*Tools*), Datenquellen (*Resources*) und Vorlagen bereitstellen – etwa für Home Assistant, Linux-Shell-Abfragen, Git oder Datenbanken.
* **Transportweg:** Lokal per `stdio` (Subprozess) oder im Netzwerk sauber gekapselt über **HTTP / Server-Sent Events (SSE)** bzw. Streamable HTTP.

Das LLM entscheidet anhand der Tool-Beschreibungen selbstständig, wann es ein Werkzeug aufruft, übergibt strukturierte Parameter und verarbeitet das Ergebnis direkt in seiner Antwort weiter.

## Praxis-Szenario 1: Home Assistant über MCP anbinden

Gerade im Smart Home zeigt MCP seine Stärken. Während klassische Sprachassistenten oft an starrer Syntax scheitern, versteht ein LLM über den offiziellen **Home Assistant MCP-Server** den gesamten Kontext deiner Entitäten, Bereiche und Dienste.

### Was damit im Alltag möglich wird
* **Kontextbezogene Abfragen:** *„Welche Fenster stehen im Erdgeschoss noch offen und wie ist die aktuelle Außentemperatur?“* – das Modell liest die passenden Sensor- und Binary-Sensor-Zustände aus und fasst sie zusammen.
* **Mehrstufige Aktionen:** *„Schalte im Büro das Licht auf 40 % Warmweiß und prüfe, ob der 3D-Drucker-Stecker noch Strom zieht.“*
* **Diagnose & Automations-Hilfe:** Das Modell kann bestehende Entitäts-IDs prüfen, bevor es dir eine neue YAML-Automation vorschlägt – Schluss mit halluzinierten Sensor-Namen.

### Sicherheit in Home Assistant nicht vergessen
Da ein MCP-Server Zugriff auf `hass`-Services erhält, gelten drei Grundregeln:
1. **Dedizierten Benutzer anlegen:** Erstelle in Home Assistant einen eigenen Service-User (z. B. `mcp-agent`) und gib nur die wirklich benötigten Entitäten für Assist/MCP frei – kritische Aktoren wie Türschlösser oder Garagentore bleiben außen vor.
2. **Kein ungeschützter Internet-Zugriff:** Betreibe den MCP-Endpunkt ausschließlich im lokalen LAN/VLAN oder hinter einem abgesicherten Reverse Proxy mit Token-Authentifizierung.
3. **Lesen vor Schreiben:** Starte zunächst mit lesenden Sensor-Abfragen und schalte schreibende Service-Calls erst frei, wenn dein Prompt- und Modell-Setup zuverlässig arbeitet.

## Praxis-Szenario 2: Linux-Server & Docker-Stacks per MCP überwachen

Der zweite große Hebel im Homelab ist ein **Linux- bzw. System-MCP-Server**, der kontrollierte Einblicke in deine Server-Infrastruktur gibt. Statt dich für jeden Routine-Check per SSH einzuloggen, fragst du deinen lokalen Assistenten direkt im Chat:

| Einsatzbereich | Beispiel-Prompt | Genutztes MCP-Tool |
| :--- | :--- | :--- |
| **Container-Status** | *„Laufen alle Docker-Stacks auf dem Server fehlerfrei oder gibt es Restarts?“* | `docker ps` / Container-Inspect (Read-Only) |
| **Ressourcen-Check** | *„Wie viel Platz ist noch auf `/mnt` frei und wie hoch ist die aktuelle RAM-Auslastung?“* | `df -h` / `free -m` / System-Metriken |
| **Log-Analyse** | *„Zeig mir die letzten 30 Zeilen aus dem Nginx-Proxy-Log und fasse mögliche Fehler zusammen.“* | Gezielter Log-Reader auf definierte Pfade |

### So hältst du einen Linux-MCP-Server sicher
Einem Sprachmodell unbegrenzten `root`-Shell-Zugriff zu geben, wäre fahrlässig – selbst bei rein lokalen Modellen kann ein missverstandener Prompt oder ein Prompt-Injection-Inhalt aus einer Logdatei unerwünschte Befehle auslösen.

Setze deshalb konsequent auf **Whitelisting statt Vollzugriff**:
* **Nur definierte Kommandos erlauben:** Kapsle erlaubte Befehle (`docker ps`, `docker logs`, `systemctl status`, `df`, `uptime`) in eigene MCP-Tools statt einer offenen `bash -c`-Schnittstelle.
* **Read-Only-Mounts:** Wenn der MCP-Server als Docker-Container läuft, binde `/var/run/docker.sock` (falls überhaupt nötig) über einen **Docker-Socket-Proxy** ein, der nur `CONTAINERS=1` und `INFO=1` erlaubt, aber kein Löschen oder Starten von Containern zulässt.
* **Bestätigung bei Schreibaktionen:** Falls du Neustarts von Diensten erlaubst, konfiguriere deinen MCP-Client so, dass schreibende Tool-Aufrufe vor der Ausführung im UI bestätigt werden müssen.

## Welche lokalen Modelle eignen sich für MCP & Tool-Calling?

Nicht jedes kleine GGUF-Modell beherrscht zuverlässiges **Function / Tool Calling**. Aus der Praxis auf Homelab-Hardware ohne riesige Server-GPUs haben sich vor allem kompakte, moderne Instruktionsmodelle bewährt:

* **Qwen 2.5 / Qwen 3 (7B bis 14B):** Sehr starkes, strukturiertes Tool-Calling und saubere JSON-Parameterübergabe – auch bei mehreren verschachtelten Abfragen.
* **Llama 3.1 / 3.2 (8B+):** Solide Allrounder für Kombinationen aus Home-Assistant-Abfragen und deutschsprachigen Zusammenfassungen.
* **Mistral Nemo (12B):** Ebenfalls sehr zuverlässig bei Tool-Definitionen, wenn genügend VRAM oder schneller System-RAM zur Verfügung steht.

## Fazit: Vom Chatbot zum echten Homelab-Werkzeug

Mit **MCP** verlässt lokale KI die reine Textbox. In Kombination mit **Home Assistant** und einem sauber abgesicherten **Linux-MCP-Server** entsteht ein Assistent, der deinen tatsächlichen Systemzustand kennt, Logfiles korreliert und Routine-Abfragen in Sekunden erledigt – vollständig lokal, ohne Cloud-Abhängigkeit und ohne dass sensible Infrastrukturdaten dein Netzwerk verlassen.
