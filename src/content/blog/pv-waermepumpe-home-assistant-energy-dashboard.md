---
title: "PV, Wärmepumpe & Pufferspeicher im Home Assistant Energy-Dashboard: Praxis-Setup mit Modbus & Automationen"
description: "So machst du Home Assistant zur lokalen Energiezentrale: PV-Ertrag, Wärmepumpe per Modbus TCP, Pufferspeicher-Sensorik und schlüsselfertige YAML-Automationen für maximalen Eigenverbrauch."
pubDate: 2026-11-24T20:20:00
heroImage: "/images/pv-waermepumpe-home-assistant-energy-dashboard.webp"
category: "Home Automation"
tags: ["Home Assistant", "Photovoltaik", "Wärmepumpe", "Modbus", "Energy Dashboard", "YAML", "Smart Home"]
---

Wer eine Photovoltaikanlage und eine Wärmepumpe betreibt, merkt schnell: Die herstellereigenen Cloud-Apps zeigen zwar hübsche Einzelgrafiken, reden aber kaum miteinander. Der Wechselrichter weiß nicht, wann der Pufferspeicher aufgeheizt werden muss, und die Wärmepumpe kennt den aktuellen PV-Überschuss nicht.

Genau hier spielt **Home Assistant** seine volle Stärke aus. Lokal auf eigener Hardware betrieben, verknüpft es Stromzähler, Wechselrichter, Wärmepumpe und Wetterprognose in Echtzeit – ganz ohne Cloud-Zwang oder laufende Abo-Kosten.

---

## Die 4 Bausteine der lokalen Energiezentrale

| Baustein | Typische Datenquelle | Relevante Messwerte | Nutzen im Energy-Dashboard |
| :--- | :--- | :--- | :--- |
| **Netz- & Hauszähler** | IR-Lesekopf (poweropti, Tibber Pulse, Tasmota) | Netzbezug (W / kWh), Einspeisung (W / kWh) | Exakte Bilanz aus Bezug, Einspeisung & Hausverbrauch |
| **PV-Anlage & Speicher** | Wechselrichter-API / Modbus TCP | Erzeugung (W / kWh), String-Leistung, SoC (%) | Berechnung des echten Direktverbrauchs |
| **Wärmepumpe & Puffer** | **Modbus TCP** oder SG-Ready-Relais | Vorlauf/Rücklauf, Puffertemperatur, Kompressor-Start | Thermische Speicherung bei PV-Überschuss |
| **Wetter & Solar-Forecast** | Forecast.Solar / lokale Wetterstation | Erwartete kWh heute/morgen, Außentemperatur | Vorausschauende Heiz- & Speicherplanung |

---

## 1. Saubere kWh-Sensoren für das Energy-Dashboard

Das Home Assistant Energy-Dashboard erwartet für Stromflüsse **akkumulierte Energiewerte in kWh** (`state_class: total_increasing`). Viele Zähler oder Modbus-Register liefern jedoch nur die aktuelle Momentanleistung in Watt (`W`).

Falls dein Smart Meter oder Zwischenzähler nur Watt-Werte liefert, wandelst du diese über die integrierte **Riemann-Summen-Integration** (seit Home Assistant 2026.11 direkt im Energy-Dashboard-Dialog oder per YAML) sauber in kWh um. Zusätzlich lohnt sich ein Template-Sensor für den **echten aktuellen PV-Überschuss**:

```yaml
# configuration.yaml (oder ausgelagert unter packages/energy.yaml)
sensor:
  - platform: integration
    source: sensor.haus_netz_bezug_watt
    name: "Haus Netzbezug kWh"
    unique_id: haus_netz_bezug_kwh
    unit_prefix: k
    round: 3
    method: left

  - platform: integration
    source: sensor.haus_netz_einspeisung_watt
    name: "Haus Netzeinspeisung kWh"
    unique_id: haus_netz_einspeisung_kwh
    unit_prefix: k
    round: 3
    method: left

template:
  - sensor:
      - name: "Aktueller PV Überschuss"
        unique_id: aktueller_pv_ueberschuss
        unit_of_measurement: "W"
        device_class: power
        state_class: measurement
        state: >
          {% set einspeisung = states('sensor.haus_netz_einspeisung_watt') | float(0) %}
          {% set bezug = states('sensor.haus_netz_bezug_watt') | float(0) %}
          {{ (einspeisung - bezug) | round(0) }}
```

*(Wichtig: Bei stark schwankenden Leistungswerten durch Wolkenzug oder Taktung liefert `method: left` deutlich genauere kWh-Werte als die Standard-Trapezregel, weil Leistungsspitzen nicht künstlich über Minuten hinweg interpoliert werden.)*

---

## 2. Wärmepumpe & Pufferspeicher per Modbus TCP anbinden

Statt über träge Hersteller-Clouds zuzugreifen, liest du moderne Wärmepumpen und Heizungsregler am zuverlässigsten direkt im lokalen Netz über **Modbus TCP** (Port `502`) aus. Damit hast du Sekunden-genaue Werte für Vorlauf, Rücklauf, Pufferspeicher-Schichtung und Betriebsstatus – und kannst gezielt Sollwerte anheben, sobald die Sonne scheint.

```yaml
# Modbus-Anbindung der Heizungs-/Wärmepumpen-Steuerung
modbus:
  - name: waermepumpe
    type: tcp
    host: 192.168.178.116
    port: 502
    delay: 1
    timeout: 5
    sensors:
      - name: "WP Vorlauftemperatur"
        unique_id: wp_vorlauftemperatur
        address: 100
        input_type: input
        unit_of_measurement: "°C"
        device_class: temperature
        scale: 0.1
        precision: 1
        scan_interval: 30

      - name: "WP Rücklauftemperatur"
        unique_id: wp_ruecklauftemperatur
        address: 101
        input_type: input
        unit_of_measurement: "°C"
        device_class: temperature
        scale: 0.1
        precision: 1
        scan_interval: 30

      - name: "Pufferspeicher Oben"
        unique_id: pufferspeicher_oben
        address: 105
        input_type: input
        unit_of_measurement: "°C"
        device_class: temperature
        scale: 0.1
        precision: 1
        scan_interval: 30

      - name: "WP Betriebsstatus"
        unique_id: wp_betriebsstatus
        address: 110
        input_type: input
        scan_interval: 15
```

*(Hinweis: Die exakten Register-Adressen (`address`) und Skalierungen (`0.1` für Zehntelgrad) entnimmst du der Modbus-Registerliste deines jeweiligen Herstellers – z. B. Stiebel Eltron, Viessmann, Vaillant, Wolf oder IDM.)*

---

## 3. Praxis-Automation: Pufferspeicher bei PV-Überschuss gezielt überhöhen

Ein großer thermischer Pufferspeicher (z. B. 2.000 bis 3.000 Liter) wirkt im Winter und in der Übergangszeit wie ein **günstiger Wärmespeicher für Solarstrom**. Statt PV-Überschuss für wenige Cent einzuspeisen und abends teuren Netzstrom für die Heizung zuzukaufen, hebt Home Assistant bei anhaltendem Überschuss die Zieltemperatur an – inklusive **Hysterese und Mindestlaufzeit**, damit der Kompressor nicht taktet:

```yaml
alias: "Energie: PV-Überschuss in Pufferspeicher laden"
description: "Hebt den Heizungs-/Pufferspeicher-Sollwert bei stabiler Einspeisung an und schützt vor Takten."
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
  # Nur aktiv, wenn der Puffer noch nicht voll durchgeladen ist
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
              entity_id: climate.pufferspeicher_sollwert
            data:
              temperature: 52
          - service: notify.mobile_app_iphone
            data:
              title: "PV-Überschuss aktiv"
              message: "Pufferspeicher-Sollwert auf 52 °C angehoben ({{ states('sensor.aktueller_pv_ueberschuss') }} W Überschuss)."

      - conditions:
          - condition: trigger
            id: pv_niedrig
        sequence:
          - service: climate.set_temperature
            target:
              entity_id: climate.pufferspeicher_sollwert
            data:
              temperature: 45
```

### Drei wichtige Praxis-Regeln gegen Kompressor-Verschleiß

1. **Verzögerung (`for: minutes: 10`) erzwingen:** Eine einzelne Wolkenlücke darf die Wärmepumpe niemals einschalten. Erst wenn über mindestens 10 bis 15 Minuten stabiler Überschuss anliegt, lohnt sich der Start.
2. **Mindestlaufzeit beim Abschalten einplanen:** Fällt die PV-Leistung ab, läuft die Wärmepumpe noch mindestens 15 Minuten weiter (`for: minutes: 15`), bevor der Sollwert wieder abgesenkt wird – das verhindert kurzes Takten.
3. **Saisonale Grenzen setzen:** Im Hochsommer (wenn ohnehin nur Warmwasser benötigt wird) sollte die Heizkreis-Überhöhung deaktiviert bleiben, damit die Räume nicht unnötig aufheizen.

---

## Fazit: Lokale Kontrolle statt Hersteller-Silos

Mit einer sauberen Trennung aus **kWh-Bilanzierung im Energy-Dashboard**, **lokaler Modbus-Telemetrie** und **trägen Hysterese-Automationen** holst du deutlich mehr Eigenverbrauch aus deiner PV-Anlage heraus – ganz ohne teure Cloud-Energiemanager. Und weil alle Daten lokal auf deinem Home-Assistant-Server bleiben, funktioniert die Steuerung auch dann zuverlässig, wenn das Internet einmal ausfällt.
