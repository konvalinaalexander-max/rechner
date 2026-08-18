# AGRIDEA Nachweis – Eingabestruktur (analysiert aus test1.xlsm)

Merkmal: Alle Blätter sind geschützt. **Entsperrte Zellen = Tastatur-Eingabefelder (gelb).**
**Gesperrte Klickzellen (blau)** reagieren nur auf Doppelklick (VBA-Auswahllisten).
Weisse Zellen = berechnet, nicht eintragbar.

Datenfluss: Allg + Fläche + Tierb  --[Knopf «Aktualisieren»]-->  SB1/SB2/Gem/OB/RH  --> Summen

## Blatt «Allg» – Allgemeine Angaben (120 Felder)
G4 Betriebsnummer · G6 Erntejahr · G7 Variante
C9 Name/Vorname · C10 Strasse · C11 PLZ/Ort · G11 Kanton · C12 Telefon · G12 Fax/E-Mail
C14 Höhe über Meer · G14 Winterfütterung (Tage)
C15 Produktionsform (Klickzelle) · G15 Zoneneinteilung (Klickzelle) · C16 Gemeinschaften · G16 Silofütterung
C19 BeraterIn · C21-C28/E/G Familie · C30-C35 Gemeinschaft · C39-C43 Landw. Nutzfläche
C47-G48 Flächen nach Zonen

## Blatt «Fläche» – Kulturen und Flächen (242 Felder)  ⇒ speist C1/C2/C3
Linker Block (Hauptkulturen, Zeilen 10-75):
  E = Fläche ha (Hauptprodukt) · F = Ertrag dt/ha
  G = Fläche ha (Nebenprodukt) · H = Ertrag dt/ha
  T = Ankreuzfeld «Durchschnittsertrag über Standardertrag» (ertragsabhängige N-Korrektur)
Rechter Block (Grünland/Futterbau, Zeilen 10-55):
  N = Fläche ha · O = Feldertrag dt TS/ha
Grünland-Zeilen: r10/11 Naturwiese, r12 Übrige Wiesen mit Düngeverbot, r13 Heuwiesen Sömmerung,
  r14 Waldweide, r15/16 Dauerweide, r17-20 Naturwiese/Weide, r21/22 Kunstwiese,
  r23/24 Saatgutproduktion, r25 Schweineweide, r26-31 Futterhackfrüchte/Silomais/CCM,
  r32/33 geschützter Anbau, r34 Streue/Torfland, r35/36 Hecken, r37 Uferwiese,
  r38 LN+Bauland, r39 Wald, r40 unproduktiv, r41 Betriebsfläche,
  r43-53 Zweit-/Zwischenkulturen, r54 Hochstamm, r55 Einzelbäume

## Blatt «Tierb» – Tierbestand (859 Felder)  ⇒ speist A1
Je Tierzeile (r9-r79):
  G = Anzahl Einheiten          (obligatorisch)
  D = Ø Milchmenge kg/Jahr      (nur Milchkühe r9, Milchschafe r40, Milchziegen r44)
  E = weiteres Feld Milchkühe   (r9)
  J = Abzug/Zuschlag ± Tiere · K = Tage    (Alpung/Pensionsvieh)
  N = Anzahl Tiere Laufhof · O = Laufhoftage
  P = Anzahl Tiere Weide · Q = Weidestunden/Tag · R = Weidetage
  C/F/H = nur bei «Anderes»-Zeilen: Bezeichnung, Einheit, GVE-Faktor
  W/X/Y = RAUS/BTS/Tierhaltungssystem  → nur Direktzahlungen, NICHT Suisse-Bilanz
Zeilen: r9-31 Rindvieh · r33-38 Equiden · r40-49 Kleinwiederkäuer
        r52-61 weitere Raufutterverzehrer/Kaninchen · r64-71 Schweine · r73-79 Geflügel

## Blatt «SB1» – Suisse-Bilanz Teil 1 (107 Felder)
J11  Total Kraftfutterverbrauch Milchkühe (kg/Jahr)
X17-X38  **Vollmist-Typ je Tierkategorie (Klickzelle: Typ 0 / 50 / 100)**
Hofdünger (HODUFLU), Spalten G=Bezeichnung K=Menge M=Nges N=P2O5 O=K2O P=Mg (je Einheit!):
  r55/56 Zufuhr Mist (t)   · r57/58 Zufuhr Gülle (m³)
  r59/60 Wegfuhr Mist (t)  · r61/62 Wegfuhr Gülle (m³)
  X55/56/59/60 = Vollmist-Kennzeichen beim Mist
Grundfutter Zu-/Wegfuhr r77-89, Spalten E=Menge dt FS · G=% TS · I=Wegfuhr dt TS ·
  K=Zufuhr dt TS · M=Produktion ausserhalb Futterfläche:
  r77 Gras/Grassilage · r78 Dürrfutter · r79 Dürrfutter nährstoffarm · r80 Silomais
  r81 Futterrüben · r82 frei · r83 Zuckerrüben · r84 Biertreber · r85 Nebenprod. Müllerei
  r86 Zuckerrübenschnitzel · r87 Zuckerrübenblätter · r88 Kartoffeln · r89 Strohzukauf Verfütterung
M96  Fehlerbereich der Grundfutterbilanz (0-5 %)

## Blatt «SB2» – Suisse-Bilanz Teil 2 (104 Felder)
K17/K18  Verfüttertes Stroh / Rübenblätter, betriebseigen (Menge)
r23      freie Kulturzeile (C Bezeichnung, K Menge, N-Q Gehalte)
W33      Innerbetrieblicher Nährstofftransfer T
K43/K44  Vom Betrieb weggeführtes Stroh / Rübenblätter
r50/51/58 Dauerkulturen: J/K/L/M Normdüngungsfaktoren
Formular D «Übrige Dünger», Spalten D=Bezeichnung J=Menge N=Nverf O=P2O5 P=K2O Q=Mg (je Einheit!):
  r70/71 Kompost (t/dt) · r72 Emissionsmindernde Ausbringung (ha, fix 6 kg Nverf/ha)
  r73-82 Mineral- und andere Dünger (m³/dt) · r83 Zukauf Weizenstroh zum Einstreuen (dt FS)
I98      Basis-N-Ausnutzungsgrad
D121     Ort, Datum

## Blatt «Gem1»/«Gem2» – Zusatzformular Gemüse (je 226 Felder)
Je Zeile r12-r?: B = Kultur (Klickzelle) · **D = Fläche in AREN** · F = Nmin-Korrektur
  N/O/P = Korrekturfaktoren P, K, Mg (Standard je 1)
Gem1 = Freilandgemüse · Gem2 = geschützter Anbau

## Blatt «OB»/«RH» – Obst und Beeren (121 / 214 Felder)

## Blatt «FormE» – Vergärungsprodukte und Ernterückstände (104 Felder)
r15/16 flüssige Vergärungsprodukte: G=Menge m³, H=Nges, I=Nverf, J=P2O5, K=K2O, L=Mg je Einheit
r22/23 feste Vergärungsprodukte: G=Menge t + Gehalte
r29    Ernterückstände Gemüse: G=Menge t (Gehalte fix 3.3/0.9/4.0/0.6)

## Blatt «Hd» – Hofdüngeranfall/Lagerkapazität (102 Felder) – nicht Teil der Suisse-Bilanz

## WICHTIG für die Ausfüllhilfe
Dünger und Hofdünger verlangen **Menge × Gehalt je Einheit**, nicht die Gesamtmenge.
Aus der gerechneten Bilanz kenne ich nur die Gesamtmengen (kg Nges / kg P2O5).
→ Für jede Position werden Menge (t bzw. m³) UND Gehalt je Einheit benötigt.
