# Ausfüllhilfe für das AGRIDEA-Nachweis-Tool

Gemeinsame Nährstoffbilanz (Planbilanz 2026) der Betriebe
**H. Imhof Bioprodukte** (ZH0197/1/1, Schwerzenbach) und **Zähner Bruno** (ZH0174/1/40, Illnau).

## Dateien

| Datei | Inhalt |
|---|---|
| `Nachweis_Ausfuellhilfe_Planbilanz_2026.xlsx` | **Das Arbeitsdokument.** Bildet die Eingabeblätter des Nachweis-Tools mit denselben Zelladressen nach, ohne Formeln. |
| `NACHWEIS_EINGABESTRUKTUR.md` | Analyse des Nachweis-Tools: welche Zellen Eingabefelder, Klickzellen bzw. Rechenfelder sind. |
| `baue_ausfuellhilfe.py` | Erzeugt die Excel-Datei neu. Braucht `nachweis.xlsm` im selben Ordner. |

## Farben in der Excel-Datei

| Farbe | Bedeutung |
|---|---|
| grün | Wert steht drin und ist belegt (47 Felder) |
| rot | muss eingetragen werden, Wert fehlt (87 Felder) |
| blau | Summen- und Rechenfeld, nicht ausfüllen |
| hellgelb | Eingabefeld, das dieser Betrieb nicht braucht |

Die Blätter **Anleitung** und **Offene Punkte** zuerst lesen; letzteres listet alle
134 Positionen mit Zelle, Zeile und Quelle bzw. offener Frage.

## Wie die Eingabefelder bestimmt wurden

Alle Blätter des Nachweis-Tools sind blattgeschützt. Damit sind die Eingabefelder
eindeutig bestimmbar: **entsperrte Zellen sind Tastatureingaben**, gesperrte Zellen mit
Formel sind Rechenfelder. Klickzellen (Auswahllisten per Doppelklick) sind ebenfalls
gesperrt und werden im Dokument als Text vorgeschlagen.

Datenfluss im Nachweis: `Allg` + `Fläche` + `Tierb` → Schaltfläche «Aktualisieren» →
`SB1`/`SB2`/`Gem1`/`OB`/`RH` → Summen. Kulturen und Tiere werden also nicht in der
Suisse-Bilanz erfasst, sondern in `Fläche` und `Tierb`.

## Geprüfte Grundlagen

Die Flächenzuordnung deckt die Landwirtschaftliche Nutzfläche beider Betriebe
vollständig ab (Imhof 8'919.68 a, Zähner 4'392.60 a). Die Tierplätze sind über zwei
unabhängige Wege bestätigt: Aufenthaltstage geteilt durch Abfrageintervall sowie
GVE geteilt durch GVE-Faktor.

Gemeinsam: LN 133.1228 ha · düngbare Fläche 113.6728 ha · offene Ackerfläche 67.0541 ha

## Abgrenzung

Betriebseigenes Hilfsmittel, keine amtliche Berechnung. Massgebend sind die
Wegleitung Suisse-Bilanz und die geltende Gesetzgebung.
