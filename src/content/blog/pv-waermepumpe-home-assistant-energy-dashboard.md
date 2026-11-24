---
title: "PV, Wärmepumpe & Pufferspeicher in Home Assistant: Schritt-für-Schritt zur eigenen Energiezentrale"
description: "Verständliche Anleitung für Einsteiger und Fortgeschrittene: So verknüpfst du Solaranlage, Stromzähler und Wärmepumpe in Home Assistant – ohne Vorwissen, komplett Schritt für Schritt."
pubDate: 2026-11-24T20:20:00
heroImage: "/images/pv-waermepumpe-home-assistant-energy-dashboard.webp"
category: "Home Automation"
tags: ["Home Assistant", "Photovoltaik", "Wärmepumpe", "Energy Dashboard", "Anleitung", "Smart Home"]
---

Wer eine Photovoltaikanlage und eine Wärmepumpe besitzt, kennt das Problem: Die App des Wechselrichters zeigt, wie viel Strom vom Dach kommt, und die App der Heizung zeigt die Wassertemperatur – aber beide Systeme reden nicht miteinander. Wertvoller Solarstrom wandert für wenige Cent ins öffentliche Netz, während abends teuer Strom für die Heizung zugekauft wird.

Mit **Home Assistant** baust du dir eine lokale Schaltzentrale, die beide Welten verbindet – komplett ohne Cloud-Zwang und laufende Kosten. In dieser Anleitung gehen wir **wirklich Schritt für Schritt** vor: vom ersten Klick im Menü bis zur fertigen Automation, die deinen Pufferspeicher bei Sonnenschein automatisch auflädt.

---

## Was du vorab brauchst (und was wir gleich einrichten)

Damit Home Assistant deine Energieflüsse steuern kann, muss es drei Dinge kennen:
1. **Deinen Stromzähler** (wie viel Strom gerade aus dem Netz bezogen oder eingespeist wird – z. B. über einen Lesekopf wie *poweropti*, *Tibber Pulse* oder *Tasmota*).
2. **Deine PV-Erzeugung** (über die Integration deines Wechselrichters, z. B. Fronius, SMA, Huawei, Growatt oder Sungrow).
3. **Deine Heizung bzw. Wärmepumpe** (entweder bereits in Home Assistant eingebunden oder über eine lokale Netzwerkschnittstelle wie *Modbus TCP*).

---

## Schritt 1: Einen Datei-Editor in Home Assistant installieren

Für manche Erweiterungen müssen wir gleich ein paar Zeilen Text in die zentrale Konfigurationsdatei von Home Assistant (`configuration.yaml`) einfügen. Falls du noch keinen Editor installiert hast, erledigst du das in einer Minute direkt über die Oberfläche:

1. Öffne Home Assistant im Browser und klicke unten links auf **Einstellungen**.
2. Wähle **Add-ons** und klicke unten rechts auf den blauen Button **Add-on-Store**.
3. Suche oben nach **File editor**, klicke ihn an und wähle **Installieren**.
4. Aktiviere nach der Installation den Schalter **In Seitenleiste anzeigen** und klicke auf **Starten**.

Links im Hauptmenü erscheint jetzt der Punkt **File editor**. Darüber kannst du jederzeit deine Konfigurationsdateien öffnen und bearbeiten.

---

## Schritt 2: Deine eigenen Sensor-Namen („Entitäten“) herausfinden

In Home Assistant hat jeder Messwert einen eigenen technischen Namen – eine sogenannte **Entitäts-ID** (zum Beispiel `sensor.stromzaehler_einspeisung`). Da diese Namen bei jedem Haushalt etwas anders heißen, musst du dir deine eigenen Namen einmal kurz heraussuchen:

1. Klicke in der linken Seitenleiste auf **Entwicklerwerkzeuge** (das Hammer-Symbol) und wähle oben den Reiter **Zustände**.
2. Tippe in das Suchfeld **„Entitäten filtern“** Begriffe wie `power`, `watt`, `einspeisung`, `bezug` oder den Namen deines Wechselrichters ein.
3. In der linken Spalte stehen nun die exakten Namen (z. B. `sensor.tasmota_lk13be_power_curr`), in der mittleren Spalte der aktuelle Messwert in Watt (`W`).
4. **Notiere dir drei Namen** für die nächsten Schritte:
   * Den Sensor für deinen **aktuellen Netzbezug in Watt**
   * Den Sensor für deine **aktuelle Netzeinspeisung in Watt** *(Hinweis: Manche Zähler nutzen nur einen einzigen Sensor – positive Werte bedeuten dann Netzbezug, negative Werte Einspeisung. Darauf gehen wir gleich ein.)*
   * Den Sensor für die **Temperatur deines Pufferspeichers** (falls vorhanden)

---

## Schritt 3: Den aktuellen PV-Überschuss berechnen lassen

Damit Home Assistant weiß, wie viel „kostenloser“ Strom gerade übrig ist, legen wir einen eigenen Hilfs-Sensor an. Er rechnet einfach: *Aktuelle Einspeisung minus aktueller Netzbezug = verfügbarer Überschuss in Watt*.

1. Öffne links im Menü den **File editor**.
2. Klicke oben links auf das Ordner-Symbol und öffne die Datei **`configuration.yaml`**.
3. Scrolle ganz ans Ende der Datei und füge folgenden Block ein – **ersetze dabei die beiden Platzhalter-Namen in den Anführungszeichen durch deine eigenen Sensor-Namen aus Schritt 2**:

```yaml
template:
  - sensor:
      - name: "Aktueller PV Überschuss"
        unique_id: aktueller_pv_ueberschuss
        unit_of_measurement: "W"
        device_class: power
        state_class: measurement
        state: >
          {% set einspeisung = states('sensor.DEIN_EINSPEISE_SENSOR') | float(0) %}
          {% set bezug = states('sensor.DEIN_BEZUGS_SENSOR') | float(0) %}
          {{ (einspeisung - bezug) | round(0) }}
```

*(Tipp: Falls dein Stromzähler nur einen einzigen Gesamt-Leistungssensor hat, der bei Überschuss ins Minus geht – z. B. `-2400` W –, nutze stattdessen einfach diese Zeile: `{{ (states('sensor.DEIN_GESAMT_SENSOR') | float(0) * -1) | round(0) }}`.)*

4. Klicke oben rechts im File editor auf das **rote Disketten-Symbol** zum Speichern.
5. Prüfe deine Eingabe: Gehe zu **Entwicklerwerkzeuge → YAML**, klicke auf **Konfiguration prüfen** (es sollte ein grünes *„Konfiguration will not prevent Home Assistant from starting“* erscheinen) und klicke anschließend unter *YAML-Konfiguration neu laden* auf **Template-Entitäten**.

*Erfolgskontrolle:* Unter **Entwicklerwerkzeuge → Zustände** findest du ab sofort den neuen Sensor `sensor.aktueller_pv_ueberschuss`, der dir live in Watt anzeigt, wie viel Strom gerade übrig ist.

---

## Schritt 4: Wärmepumpe & Pufferspeicher einbinden

Wenn deine Wärmepumpe bereits über eine offizielle Integration in Home Assistant eingebunden ist (z. B. über *Settings → Geräte & Dienste*), hast du deine Temperatur- und Sollwert-Regler schon direkt parat und kannst diesen Schritt überspringen.

Viele moderne Wärmepumpen und Heizungsregler lassen sich alternativ **ohne Hersteller-Cloud direkt im Heimnetz über Modbus TCP** auslesen. Dafür benötigst du lediglich die **IP-Adresse deiner Heizung** im Router (z. B. `192.168.178.116`) und die Register-Tabelle aus dem Handbuch des Herstellers. Der Eintrag in der `configuration.yaml` sieht dann so aus:

```yaml
modbus:
  - name: waermepumpe
    type: tcp
    host: 192.168.178.116
    port: 502
    delay: 1
    timeout: 5
    sensors:
      - name: "Pufferspeicher Oben"
        unique_id: pufferspeicher_oben
        address: 105
        input_type: input
        unit_of_measurement: "°C"
        device_class: temperature
        scale: 0.1
        precision: 1
        scan_interval: 30
```

Nach dem Speichern und einem kurzen Neustart (**Entwicklerwerkzeuge → YAML → Neu starten**) taucht `sensor.pufferspeicher_oben` als ganz normaler Temperatursensor in Home Assistant auf.

---

## Schritt 5: Die Automation – Pufferspeicher bei Sonnenschein aufladen

Jetzt verknüpfen wir den PV-Überschuss mit deiner Heizung. Die Logik dahinter ist bewusst simpel und schont den Kompressor deiner Wärmepumpe:

* **Wenn** mindestens **10 Minuten am Stück** mehr als **2.200 Watt** Überschuss ins Netz fließen **und** der Pufferspeicher noch unter **54 °C** liegt → hebe die Zieltemperatur auf **52 °C** an.
* **Wenn** der Überschuss mindestens **15 Minuten am Stück** unter **400 Watt** fällt → senke die Zieltemperatur wieder auf den Normalwert von **45 °C** ab.

### So fügst du die Automation ein (ohne in Dateien zu schreiben):

1. Gehe in Home Assistant zu **Einstellungen → Automationen & Szenen**.
2. Klicke unten rechts auf **+ Automation erstellen** und wähle **Neue Automation erstellen**.
3. Klicke ganz oben rechts auf das **Drei-Punkte-Menü (⋮)** und wähle **Als YAML bearbeiten**.
4. Lösche den kurzen Standardtext im Fenster und füge stattdessen diese Vorlage ein:

```yaml
alias: "Energie: PV-Überschuss in Pufferspeicher laden"
description: "Hebt den Sollwert bei stabilem PV-Überschuss an und schützt vor häufigem Takten."
mode: single

trigger:
  - platform: numeric_state
    entity_id: sensor.aktueller_pv_ueberschuss
    above: 2200
    for:
      minutes: 10
    id: pv_hoch

  - platform: numeric_state
    entity_id: sensor.aktueller_pv_ueberschuss
    below: 400
    for:
      minutes: 15
    id: pv_niedrig

condition:
  - condition: numeric_state
    entity_id: sensor.pufferspeicher_oben
    below: 54

action:
  - choose:
      - conditions:
          - condition: trigger
            id: pv_hoch
        sequence:
          - service: climate.set_temperature
            target:
              entity_id: climate.DEIN_HEIZUNGS_REGLER
            data:
              temperature: 52

      - conditions:
          - condition: trigger
            id: pv_niedrig
        sequence:
          - service: climate.set_temperature
            target:
              entity_id: climate.DEIN_HEIZUNGS_REGLER
            data:
              temperature: 45
```

5. Klicke oben rechts wieder auf das **Drei-Punkte-Menü (⋮) → Im visuellen Editor bearbeiten**. Jetzt siehst du die gesamte Regel als übersichtliche Bausteine und kannst im Dropdown-Menü bequem deinen eigenen Heizungs- bzw. Warmwasserregler auswählen.
6. Klicke unten rechts auf **Speichern**.

---

## Drei wichtige Praxis-Tipps für den Alltag

| Punkt | Empfohlener Wert | Warum das wichtig ist |
| :--- | :--- | :--- |
| **Einschalt-Verzögerung** | Mindestens `10 Minuten` | Verhindert, dass eine einzelne Wolkenlücke die Wärmepumpe kurz anwirft und sofort wieder abwürgt. |
| **Ausschalt-Verzögerung** | Mindestens `15 Minuten` | Sorgt für ruhige, lange Laufzeiten und schont den Kompressor vor Verschleiß. |
| **Sommer-Pause** | Mai bis September | Im Hochsommer solltest du die Automation über den Schalter in Home Assistant deaktivieren, damit die Heizung nicht unnötig anspringt. |

---

## Fazit

Du musst kein Programmierer sein, um deine Solaranlage und deine Wärmepumpe intelligent miteinander zu verknüpfen. Mit dem **File editor**, drei notierten **Entitäts-Namen** und einer einzigen sauberen **Automation** nutzt du deinen eigenen Solarstrom genau dann, wenn er anfällt – lokal, transparent und ohne monatliche Cloud-Gebühren.
