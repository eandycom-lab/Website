---
title: "PV, Wärmepumpe & Pufferspeicher in Home Assistant: Schritt-für-Schritt zur eigenen Energiezentrale"
description: "DAU-sichere Schritt-für-Schritt-Anleitung für Einsteiger: So verknüpfst du Solaranlage, Stromzähler, Wärmepumpe und Pufferspeicher lokal in Home Assistant – inkl. Variablen-Guide, geprüften YAML-Vorlagen und Schutz vor Kompressor-Takten."
pubDate: 2026-11-24T20:20:00
heroImage: "/images/pv-waermepumpe-home-assistant-energy-dashboard.webp"
category: "Home Automation"
tags: ["Home Assistant", "Photovoltaik", "Wärmepumpe", "Energy Dashboard", "Anleitung", "Smart Home"]
---

Ohne zentrale Steuerung arbeiten Wechselrichter und Heizung im Alltag komplett aneinander vorbei: Die Solar-App zeigt den aktuellen Überschuss auf dem Dach, die Heizungs-App zeigt die Puffertemperatur – aber überschüssiger Strom wandert für wenige Cent ins Netz, während abends teuer für Warmwasser und Heizung zugekauft wird.

Mit **Home Assistant** baust du dir eine rein lokale Energiezentrale, die beide Systeme ohne Hersteller-Cloud verbindet. In dieser Anleitung gehen wir **lückenlos Schritt für Schritt** vor: vom Einrichten des Editors über das Anpassen deiner eigenen Variablen bis zur fertigen Automation, die deinen Pufferspeicher bei Sonnenschein intelligent vorheizt.

![Lokales Energiemanagement in Home Assistant: Datenfluss von PV-Anlage und Smart Meter über Home Assistant zur Wärmepumpe und zum Pufferspeicher](/images/pv-waermepumpe-home-assistant-energy-dashboard-2.webp)

---

## Was du vorab brauchst (und was wir gleich einrichten)

Damit Home Assistant deine Energieflüsse auswerten und steuern kann, benötigt das System drei Mess- bzw. Steuerpunkte:

1. **Deinen Stromzähler:** Aktuelle Leistung für Netzbezug und Netzeinspeisung in Watt (`W`), z. B. über einen optischen Lesekopf wie *poweropti*, *Tibber Pulse* oder *Tasmota*.
2. **Deine PV-Erzeugung:** Über die lokale Integration deines Wechselrichters (z. B. Fronius, SMA, Huawei, Growatt oder Sungrow).
3. **Deine Heizung bzw. Wärmepumpe:** Entweder über eine bestehende Home-Assistant-Integration oder direkt im Heimnetz per *Modbus TCP*.

---

## Deine lokalen Variablen im Überblick (bitte vorab anpassen!)

Jeder Haushalt hat andere Geräte-Namen und IP-Adressen. In den folgenden Code-Vorlagen tauchen diese Platzhalter auf, die du durch deine eigenen Werte ersetzt:

* **`sensor.DEIN_EINSPEISE_SENSOR`:** Dein Sensor für die **aktuelle Netzeinspeisung in Watt** (falls getrennt gemessen).
* **`sensor.DEIN_BEZUGS_SENSOR`:** Dein Sensor für den **aktuellen Netzbezug in Watt**.
* **`sensor.DEIN_GESAMT_SENSOR`:** Alternative, falls dein Zähler nur **einen einzigen Sensor** liefert (positiv = Bezug, negativ = Einspeisung).
* **`DEINE-HEIZUNGS-IP`:** Die lokale IP-Adresse deiner Wärmepumpe bzw. Heizungssteuerung im Router (z. B. `192.168.178.116`), falls du sie per Modbus TCP einbindest.
* **`climate.DEIN_HEIZUNGS_REGLER`:** Die Ziel-Entität für deinen Warmwasser- oder Pufferspeicher-Sollwert (wählst du am Ende bequem per Dropdown-Menü aus).

---

## Schritt 1: Einen Datei-Editor in Home Assistant installieren

Für individuelle Berechnungen und Modbus-Sensoren fügen wir gleich ein paar Zeilen in die zentrale Konfigurationsdatei (`configuration.yaml`) ein. Mit dem offiziellen **File editor** erledigst du das direkt im Browser:

1. Öffne Home Assistant im Browser und klicke unten links auf **Einstellungen → Add-ons**.
2. Klicke unten rechts auf den blauen Button **Add-on-Store**.
3. Suche oben nach **File editor**, öffne den Eintrag und klicke auf **Installieren**.
4. Aktiviere nach der Installation den Schalter **In Seitenleiste anzeigen** und klicke auf **Starten**.

Links im Hauptmenü erscheint ab sofort der Eintrag **File editor**.

---

## Schritt 2: Deine eigenen Sensor-Namen („Entitäten“) heraussuchen

In Home Assistant besitzt jeder Messwert eine eindeutige technische ID – die sogenannte **Entitäts-ID** (z. B. `sensor.stromzaehler_einspeisung`):

1. Klicke in der linken Seitenleiste auf **Entwicklerwerkzeuge** (Hammer-Symbol) und öffne oben den Reiter **Zustände**.
2. Tippe in das Filterfeld **„Entitäten filtern“** Begriffe wie `power`, `watt`, `einspeisung`, `bezug` oder den Namen deines Wechselrichters ein.
3. In der linken Spalte stehen die exakten Entitäts-IDs, in der mittleren Spalte der aktuelle Live-Wert in Watt (`W`).
4. **Notiere dir deine Sensor-Namen** für Netzbezug, Netzeinspeisung (bzw. Gesamtleistung) und – falls bereits vorhanden – für die Temperatur deines Pufferspeichers.

> **Zwischen-Fazit (Schritte 1 & 2):** Du hast jetzt Zugriff auf deine `configuration.yaml` und kennst die genauen technischen Namen deiner Stromzähler-Sensoren.

---

## Schritt 3: Den aktuellen PV-Überschuss live berechnen lassen

Damit Home Assistant jederzeit weiß, wie viel ungenutzter Solarstrom gerade übrig ist, legen wir einen eigenen Hilfs-Sensor an. Er rechnet: *Aktuelle Einspeisung minus aktueller Netzbezug = verfügbarer Überschuss in Watt*.

1. Öffne links im Menü den **File editor** und wähle über das Ordner-Symbol oben links die Datei **`configuration.yaml`**.
2. Scrolle ganz ans Ende der Datei und füge diesen Block ein – **achte exakt auf die Leerzeichen am Zeilenanfang** und ersetze die beiden Platzhalter durch deine Sensor-Namen aus Schritt 2:

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

> **Variante für Ein-Sensor-Stromzähler:** Liefert dein Lesekopf nur **einen** Gesamtwert, der bei Überschuss ins Minus geht (z. B. `-2400 W`), nutze statt den letzten drei Zeilen einfach:
> `{{ (states('sensor.DEIN_GESAMT_SENSOR') | float(0) * -1) | round(0) }}`

3. Klicke oben rechts im File editor auf das **rote Disketten-Symbol** zum Speichern.
4. Gehe zu **Entwicklerwerkzeuge → YAML**, klicke auf **Konfiguration prüfen** (es muss eine grüne Bestätigung erscheinen) und danach unter *YAML-Konfiguration neu laden* auf **Template-Entitäten**.

*Erfolgskontrolle:* Unter **Entwicklerwerkzeuge → Zustände** erscheint ab sofort `sensor.aktueller_pv_ueberschuss` mit dem aktuellen Überschuss in Watt.

---

## Schritt 4: Wärmepumpe & Pufferspeicher einbinden

Wenn deine Wärmepumpe bereits über eine offizielle Integration in Home Assistant eingebunden ist (**Einstellungen → Geräte & Dienste**), stehen dir deine Temperatur- und Sollwert-Regler schon direkt zur Verfügung und du kannst direkt zu Schritt 5 springen.

Viele Wärmepumpen und Frischwasser-/Heizungsregler lassen sich alternativ **komplett lokal über Modbus TCP** auslesen. Dafür benötigst du die **IP-Adresse deiner Heizung** im Router (hier als Platzhalter `DEINE-HEIZUNGS-IP`) und die Register-Nummer aus der Modbus-Tabelle des Herstellers:

```yaml
modbus:
  - name: waermepumpe
    type: tcp
    host: DEINE-HEIZUNGS-IP
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

> **Hinweis zu deinen lokalen Registern:** Die Register-Adresse (`105`) und der Skalierungsfaktor (`0.1`) unterscheiden sich je nach Heizungshersteller. Prüfe in deiner Hersteller-Dokumentation, ob das Register als `input` oder `holding` abgefragt wird.

Nach dem Speichern und einem Neustart (**Entwicklerwerkzeuge → YAML → Neu starten**) steht `sensor.pufferspeicher_oben` als regulärer Temperatursensor bereit.

---

## Schritt 5: Die Automation – Pufferspeicher bei Sonnenschein aufladen

Jetzt verknüpfen wir den PV-Überschuss mit der Solltemperatur deines Pufferspeichers. Damit der Kompressor deiner Wärmepumpe nicht bei jeder kleinen Wolke ein- und ausschaltet (sogenanntes *Takten*), bauen wir eine klare Hysterese mit Zeitverzögerung ein:

![Schaltlogik und Hysterese in Home Assistant: Wann die Wärmepumpe bei PV-Überschuss den Pufferspeicher aufheizt und wann sie wieder absenkt](/images/pv-waermepumpe-home-assistant-energy-dashboard-3.webp)

* **Einschalten (Wärme speichern):** Wenn mindestens **10 Minuten am Stück** mehr als **2.200 Watt** Überschuss ins Netz fließen **und** der Pufferspeicher noch unter **54 °C** liegt → hebe den Sollwert auf **52 °C** an.
* **Absenken (Normalbetrieb):** Wenn der Überschuss mindestens **15 Minuten am Stück** unter **400 Watt** fällt → senke die Zieltemperatur wieder auf **45 °C** ab.

### So richtest du die Automation ein:

1. Gehe in Home Assistant zu **Einstellungen → Automationen & Szenen**.
2. Klicke unten rechts auf **+ Automation erstellen → Neue Automation erstellen**.
3. Klicke oben rechts auf das **Drei-Punkte-Menü (⋮)** und wähle **Als YAML bearbeiten**.
4. Ersetze den kurzen Standardtext vollständig durch diese Vorlage:

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

5. Klicke oben rechts wieder auf das **Drei-Punkte-Menü (⋮) → Im visuellen Editor bearbeiten**. Jetzt kannst du im Dropdown-Menü bequem deinen eigenen Heizungs- bzw. Warmwasserregler auswählen.
6. Klicke unten rechts auf **Speichern**.

---

## Drei wichtige Praxis-Tipps für den dauerhaften Betrieb

| Stellschraube | Empfohlener Richtwert | Warum das in der Praxis entscheidend ist |
| :--- | :--- | :--- |
| **Einschalt-Verzögerung** | Mindestens `10 Minuten` | Verhindert, dass eine kurze Wolkenlücke die Wärmepumpe anwirft und sofort wieder abwürgt. |
| **Ausschalt-Verzögerung** | Mindestens `15 Minuten` | Sorgt für lange, effiziente Laufzeiten und schont den Kompressor vor vorzeitigem Verschleiß. |
| **Sommer-Pause** | Mai bis September | Im Hochsommer solltest du die Automation über den Schalter in Home Assistant deaktivieren, damit der Heizkreis nicht unnötig aufheizt. |

---

## Gesamtfazit

Du brauchst weder teure Zusatz-Hardware noch eine Hersteller-Cloud, um deine PV-Anlage und deine Wärmepumpe sinnvoll miteinander zu koppeln. Mit dem **File editor**, deinen angepassten **Entitäts-Namen** und einer einzigen sauberen **Hysterese-Automation** nutzt du deinen eigenen Solarstrom genau dann als Wärmespeicher, wenn er auf dem Dach entsteht.
