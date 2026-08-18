# Nährstoffbilanz – Suisse-Bilanz

Betriebseigenes Werkzeug zur Berechnung der Nährstoffbilanz nach der Referenzmethode
**Suisse-Bilanz, Wegleitung Version 1.20** (gültig 2026/2027).

**Benutzung:** `naehrstoffbilanz.html` doppelklicken. Eine einzige Datei, läuft offline
in jedem Browser, ohne Installation und ohne Internet.

---

## Was das Werkzeug kann

* Vollständige Bilanz nach den **elf Schritten der Wegleitung**, Formulare A1 bis F
* **Referenzwerte** aus Tab. 1 bis 6: 69 Tierkategorien, 253 Kulturen
* Bilanz **und** Düngungsplanung aus denselben Eingaben – keine getrennte Datenhaltung
* **PDF-Ausgabe** aller Formularteile mit Unterschriftsfeldern über den Druckdialog
* **Speichern und Laden** als Datei; der Stand bleibt zudem im Browser erhalten
* **Selbstprüfung**: 166 Tests laufen im Register «Prüfung» direkt im Browser mit

### Umgesetzte Regeln

| Bereich | Regel |
|---|---|
| Tiere | Anfall und Grundfutterverzehr je Kategorie (Tab. 1) |
| Milchkühe | Anfall nach Milchleistung (Tab. 2a), Grundfutter nach Milch- und Kraftfutterverzehr (Tab. 2b/2c) |
| Rindviehmast > 160 d | Lineare Korrektur nach Tageszuwachs und Ausstall-Lebendgewicht (Tab. 2d) |
| Kleinwiederkäuer | Milchschaf und Milchziege nach Milchleistung (Tab. 2e) |
| Laufstall Rindvieh | Nges LSR mit 20 % statt 15 % unvermeidbaren Verlusten |
| Laufhof | Ein Zehntel des Tagesanfalls, davon 50 % Abzug; Mastpoulets höchstens 180 Tage |
| Weide | Abzug 70 %; kein Weideabzug für Geflügel; bei über 12 h kein zusätzlicher Laufhofabzug |
| Vollmist | Typ 0/50/100 auf dem im Stall anfallenden Nges; Anteil auf 0–100 % begrenzt |
| Grundfutter | Zu- und Wegfuhr, Produktion ausserhalb der Futterfläche, Lager- und Krippenverluste, Fehlerbereich |
| Ertragsniveau | Ertrag der intensiven Wiesen wahlweise als Restgrösse aus der Grundfutterbilanz |
| Ackerkulturen | Ertragsabhängige N-Korrektur für Getreide, Raps und Mais mit Deckelung am Maximalertrag |
| Übrige Ackerkulturen | N-Reduktion ab 20 % unter dem Standardertrag |
| Nährstoffarmes Grundfutter | Abzug 0.6 kg N und 0.1 kg P₂O₅ je dt TS |
| Hofdünger | Zu- und Wegfuhr nach HODUFLU, Vollmistanteil V2 |
| Übrige Dünger | Mineral- und Recyclingdünger, Kompost mit 10 % des Nges, emissionsmindernde Ausbringung mit 6 kg Nverf je ha |
| Vergärungsprodukte | Gärgülle und Gärdünngülle betriebsspezifisch, feste Produkte 20 %, Gärgut direkt, Ernterückstände Gemüse |
| Ausnutzungsgrad | 60 % − 0.15 je % offene Ackerfläche − 0.12 je % Vollmist |
| Transfer | 0.4 kg P₂O₅ je dt TS ungedüngtes Grundfutter, höchstens ein Viertel des GFprod |

Version 1.19 lässt sich zum Nachrechnen bestehender Bilanzen wählen.

---

## Prüfung der Richtigkeit

```
node test/alle.js
```

276 Prüfungen in drei Läufen:

* **Rechenkern (166)** – sämtliche Rechenbeispiele der Wegleitung als Prüfvektoren,
  die vollständig gerechnete Bilanz dieses Betriebs mit 21 Sollwerten, Invarianten
  sowie Prüfsummen über alle Referenzwerte
* **Oberfläche (58)** – Darstellung, Eingaben, Dialoge, Speichern und Laden,
  Druckansicht, Verhalten auf kleinem Bildschirm (echter Browser)
* **Belastung (52)** – Extremwerte, Fehleingaben, alle 322 Kategorien gleichzeitig,
  Leistungsverhalten, Zustand nach dem Neuladen

Die Prüfsummen über die Referenzwerte schlagen bei jeder unbeabsichtigten Änderung
einer einzelnen Zahl in den Tabellen 1 bis 6 an.

### Abgleich mit der gerechneten Bilanz

Der Rechenkern wurde gegen die mit dem AGRIDEA-Programm erstellte Bilanz des Betriebs
geprüft. Alle 21 Zwischen- und Endsummen stimmen, unter anderem:

| Kennwert | Soll | Ist |
|---|---:|---:|
| Nges Tierhaltung (A1) | 4’609 | 4’609 |
| Nges nach Abzügen (A2) | 3’778 | 3’778 |
| Anteil Vollmist | 42.7 % | 42.7 % |
| N-Ausnutzungsgrad | 46.7 % | 46.7 % |
| Zu produzierendes Grundfutter | 3’620 | 3’620 |
| Nährstoffbedarf Kulturen N | 12’304 | 12’297 |
| **Gesamtbilanz Nverf** | **−4’137** | **−4’131** |
| **Gesamtbilanz P₂O₅** | **−1’341** | **−1’337** |

Die Abweichungen von wenigen Kilogramm stammen aus Zwischenrundungen im
Vergleichsprogramm.

---

## Aufbau

```
naehrstoffbilanz.html   Das fertige Werkzeug – diese Datei genügt
src/daten.js            Referenzwerte der Wegleitung (Tab. 1 bis 6)
src/engine.js           Rechenkern, die elf Schritte
src/vorlage.js          Startdatensatz mit den Kulturen und Tieren des Betriebs
src/tests.js            Testsuite, läuft auch im Browser
src/ui.js               Bedienoberfläche
src/style.css           Gestaltung, einschliesslich Druckbild
build.js                Baut aus src/ die einzelne HTML-Datei
test/alle.js            Führt alle Testläufe aus
```

Nach Änderungen an `src/`:

```
node build.js && node test/alle.js
```

Der Build bricht ab, wenn das gebündelte Skript einen Syntaxfehler enthält.

---

## Bei einer neuen Wegleitung

1. Geänderte Werte in `src/daten.js` nachführen.
2. Die beiden Prüfsummen in `src/tests.js` bewusst auf die neuen Werte setzen –
   sie schlagen sonst an und melden genau, dass sich Referenzwerte geändert haben.
3. `node build.js && node test/alle.js`

Einzelne Werte lassen sich auch ohne Codeänderung direkt im Werkzeug überschreiben:
im Register «Kulturen» oder «Tiere» über das Stift-Symbol. Diese Anpassungen werden
mitgespeichert.

---

## Abgrenzung

Dies ist ein betriebseigenes Hilfsmittel und ersetzt weder die Referenzmethode noch
eine amtliche Prüfung. Massgebend sind die Wegleitung Suisse-Bilanz und die geltende
Gesetzgebung. Nicht abgebildet sind die Zusatzmodule 6 und 7 (nährstoffreduziertes
Futter, Import/Export-Bilanz); deren Ergebnisse lassen sich je Tierkategorie von Hand
eintragen. Der Nachweis der Direktzahlungen ist nicht Gegenstand dieses Werkzeugs.
