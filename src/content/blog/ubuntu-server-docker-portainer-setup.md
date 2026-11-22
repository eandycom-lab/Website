---
title: "Ubuntu Server, Docker & Portainer: Das perfekte Fundament für dein Homelab"
description: "Schritt-für-Schritt-Guide: Ubuntu Server 24.04 LTS aufsetzen, SSH & UFW absichern (VPN-only-Betrieb), Docker Engine installieren und Portainer CE zur Container-Verwaltung einrichten."
pubDate: 2026-11-22T16:00:00
heroImage: "/images/ubuntu-server-docker-portainer-setup.webp"
category: "Linux & OS"
tags: ["Ubuntu", "Docker", "Portainer", "Homelab", "Self-Hosting", "Security"]
---

Wenn du dein eigenes Homelab aufbauen willst, kommst du an einem soliden Fundament nicht vorbei: Linux, Docker und ein übersichtliches Management-Interface. Während viele Einsteiger zu überladenen All-in-One-Lösungen greifen, ist die Kombination aus **Ubuntu Server 24.04 LTS**, der offiziellen **Docker Engine** und **Portainer CE** der Industriestandard für Stabilität, Performance und maximale Flexibilität.

In diesem Guide setzen wir dein Homelab-Fundament auf – von der Server-Härtung über die Docker-Installation bis hin zum Web-Dashboard für deine Container. Und das Wichtigste: **Wir konfigurieren das System für den reinen lokalen bzw. VPN-Betrieb ohne direkte Internet-Exposition.**

---

## 1. Die Basis: Ubuntu Server 24.04 LTS installieren & absichern

### Installation & Netzwerkkonfiguration
Lade dir das offizielle Ubuntu Server ISO herunter und bringe es per Ventoy oder Rufus auf einen USB-Stick. Bei der Installation gilt:
- **Minimale Installation** wählen (keine unnötigen Pakete).
- **Statische IP vergeben** (oder feste DHCP-Reservierung im Router).
- **SSH aktivieren** (importiere am besten direkt deinen SSH-Key von GitHub oder hinterlege deinen Public Key).

### Sicherheits-Grundregel: VPN-only & kein Port-Forwarding!
Dein Homelab gehört **nicht** direkt ins Internet. Setze keine Portweiterleitungen am Router auf Port 80, 443 oder gar 22. Der Zugang von außen sollte **ausschließlich über ein VPN** erfolgen (z. B. WireGuard auf der OPNsense/Fritz!Box, Tailscale oder Netbird).

### SSH absichern & Passwort-Login deaktivieren
Verbinde dich per SSH mit deinem Server und schalte den unsicheren Passwort-Login ab:

```bash
sudo nano /etc/ssh/sshd_config.d/99-custom.conf
```

Füge dort folgende Zeilen ein:
```text
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
```

Starte den SSH-Dienst neu:
```bash
sudo systemctl restart ssh
```

### Firewall (UFW) konfigurieren
Standardmäßig blockieren wir jeglichen eingehenden Traffic und erlauben nur SSH sowie die lokalen Ports für Portainer:

```bash
# Standardregeln
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH erlauben
sudo ufw allow 22/tcp comment 'SSH'

# Docker / Portainer Ports (nur im lokalen Subnetz oder VPN!)
sudo ufw allow 9443/tcp comment 'Portainer HTTPS'

# Firewall aktivieren
sudo ufw enable
```

---

## 2. Docker Engine & Docker Compose installieren

Installiere Docker nicht über Snap oder die veralteten Ubuntu-Standard-Paketquellen, sondern direkt über das offizielle Docker-Repository, um immer die aktuellsten Versionen zu erhalten.

### Docker-Repository hinzufügen
```bash
# Erforderliche Werkzeuge installieren
sudo apt update && sudo apt install -y ca-certificates curl gnupg

# Docker GPG-Key hinzufügen
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Repository einbinden
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Paketquellen aktualisieren
sudo apt update
```

### Docker Engine & Plugins installieren
```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Docker ohne root ausführen (Optional, aber empfohlen)
Damit du Docker-Befehle als normaler Benutzer ohne `sudo` ausführen kannst, füge deinen Benutzer zur Gruppe `docker` hinzu:
```bash
sudo usermod -aG docker $USER
```
*Wichtig: Einmal ab- und wieder anmelden (`exit` und neu per SSH verbinden), damit die Gruppenänderung aktiv wird.*

Prüfe die Installation:
```bash
docker compose version && docker run --rm hello-world
```

---

## 3. Best Practices: Struktur für deine Stacks anlegen

Wild verstreute Docker-Container auf dem Server führen schnell zu Chaos. Erstelle eine feste Verzeichnisstruktur unter `/opt/stacks/` für alle kommenden Dienste:

```bash
sudo mkdir -p /opt/stacks/portainer
sudo chown -R $USER:$USER /opt/stacks
```

Jeder Dienst bekommt dort seinen eigenen Unterordner mit einer dedizierten `docker-compose.yml` und einem `data`-Verzeichnis für persistente Volumes.

---

## 4. Portainer CE via Docker Compose starten

Portainer bietet ein schlankes Web-Interface, um Container, Images, Netzwerke und Volumes im Blick zu behalten, Logs zu prüfen und Stacks direkt per Compose-Code zu verwalten.

Wechsle in das Verzeichnis und erstelle die Konfiguration:
```bash
cd /opt/stacks/portainer
nano docker-compose.yml
```

Füge folgenden Inhalt ein:

```yaml
services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "9443:9443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/data
```

Starte Portainer:
```bash
docker compose up -d
```

Rufe nun im Browser über dein lokales Netz oder VPN die Adresse auf:
`https://<DEINE-SERVER-IP>:9443`

*Hinweis: Da Portainer ein selbstsigniertes SSL-Zertifikat nutzt, wird dein Browser eine Warnung anzeigen. Bestätige diese (Erweitert -> Weiter zu ...).* Erstelle direkt dein Administrator-Passwort und wähle **"Get Started"**, um die lokale Docker-Instanz zu verbinden.

---

## 5. Wie geht es weiter? (Interne Verweise)

Dein Fundament steht! Jetzt kannst du tiefer in das Docker-Management einsteigen oder deinen Server überwachen:
- **Docker-Manager vergleichen:** Falls du neben Portainer auch schlankere Alternativen suchst, lies meinen [Docker-Manager-Vergleich (Portainer vs. Dockge vs. Komodo)](/blog/docker-manager-vergleich-portainer-dockge-komodo).
- **Server-Monitoring:** Binde deinen neuen Server direkt an dein Monitoring an, siehe [Linux-Server-Monitoring mit Beszel, Netdata und Prometheus](/blog/linux-server-monitoring-beszel-netdata-prometheus).
- **Automatisierung & KI:** Wenn dein Host läuft, integriere ihn mit [Home Assistant & MCP im Homelab](/blog/model-context-protocol-mcp-homelab-home-assistant-linux).

---

## Praxis-Empfehlung & One-Liner für die Shell

Hier ist das schlüsselfertige Setup-Skript, das das System aktualisiert, Docker installiert, die Verzeichnisstruktur anlegt und Portainer startet:

```bash
# Update & Docker-Installation
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Rechte anpassen
sudo usermod -aG docker $USER

# Portainer Stack anlegen & starten
mkdir -p /opt/stacks/portainer/data
cat << 'STACK' > /opt/stacks/portainer/docker-compose.yml
services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "9443:9443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /opt/stacks/portainer/data:/data
STACK

cd /opt/stacks/portainer && docker compose up -d
echo "=== Portainer läuft unter https://$(hostname -I | awk '{print $1}'):9443 ==="
```
