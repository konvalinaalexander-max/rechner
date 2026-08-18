# -*- coding: utf-8 -*-
"""Erzeugt die Ausfuellhilfe als exakte Nachbildung der Nachweis-Blaetter."""
import openpyxl, warnings
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
warnings.filterwarnings("ignore")

QUELLE = "nachweis.xlsm"
ZIEL   = "Nachweis_Ausfuellhilfe_Planbilanz_2026.xlsx"

GRUEN = PatternFill("solid", fgColor="C6E7C6")
ROT   = PatternFill("solid", fgColor="F5C6C6")
BLAU  = PatternFill("solid", fgColor="CFE0F0")
GRAU  = PatternFill("solid", fgColor="F2F2F2")
GELB  = PatternFill("solid", fgColor="FDF6DC")   # leeres Eingabefeld, fuer diesen Betrieb nicht noetig
duenn = Side(style="thin", color="B0B0B0")
RAHMEN = Border(left=duenn, right=duenn, top=duenn, bottom=duenn)

# ---------------------------------------------------------------- Eingabedaten
# (wert, "gruen"|"rot", "Bemerkung")
D = {}

D["Allg"] = {
 "G6": (2026, "gruen", "Erntejahr"),
 "G7": ("Planbilanz", "gruen", "Variante"),
 "G4": (None, "rot", "Betriebsnummer der gemeinsamen Bilanz festlegen: Imhof ZH0197/1/1 (Agate 3050808) oder Zaehner ZH0174/1/40 (Agate 3165556)"),
 "C9": ("Imhof Bioprodukte / Zaehner Bruno", "gruen", "Gemeinsame Naehrstoffbilanz zweier Betriebe"),
 "C10": (None, "rot", "Strasse der bilanzfuehrenden Adresse (Eichhof / Im Guggenbuel 3)"),
 "C11": (None, "rot", "PLZ/Ort (8603 Schwerzenbach / 8308 Illnau)"),
 "G11": ("ZH", "gruen", "Kanton"),
 "C12": (None, "rot", "Telefon"),
 "G12": (None, "rot", "E-Mail"),
 "C14": (None, "rot", "Hoehe ueber Meer des Betriebszentrums. Schwerzenbach ca. 440 m, Illnau ca. 520 m - beide unter 600 m"),
 "G14": (None, "rot", "Winterfuetterung in Tagen"),
 "C15": ("Bio", "gruen", "Produktionsform: beide Betriebe mit Biolandbau-Beitrag"),
 "G15": ("Talzone", "gruen", "Zone 31, beide Betriebe Talgebiet"),
 "C16": (None, "rot", "Art der Gemeinschaft waehlen (Betriebsgemeinschaft / Betriebszweiggemeinschaft)"),
 "G16": (None, "rot", "Silofuetterung ja/nein"),
 # Landw. Nutzflaeche ist nach Partnern und nach Eigen-/Pachtland aufgeteilt.
 # Die Totale je Partner sind belegt, die Aufteilung Eigenland/Pachtland fehlt mir.
 "C39": (None, "rot", "Partner A = Imhof, EIGENLAND in ha. Total LN Imhof 89.1968 ha - Aufteilung Eigenland/Pachtland fehlt mir"),
 "E39": (None, "rot", "Partner A = Imhof, PACHTLAND in ha"),
 "C40": (None, "rot", "Partner B = Zaehner, EIGENLAND in ha. Total LN Zaehner 43.9260 ha - Aufteilung Eigenland/Pachtland fehlt mir"),
 "E40": (None, "rot", "Partner B = Zaehner, PACHTLAND in ha"),
 "G45": (None, "rot", "Zusaetzlich Bauland ohne Beitragsberechtigung in ha, falls vorhanden"),
}

D["Fläche"] = {
 # --- Hauptkulturen, E = Flaeche ha, F = Ertrag dt/ha ---
 "E10": (8.1344, "gruen", "Winterweizen: Imhof 5.6913 + Zaehner 2.4431 ha"),
 "F10": (None, "rot", "Ertrag Winterweizen dt/ha. Standardertrag 60. Nur bei nachgewiesenem 3-Jahres-Schnitt daneben Feld T ankreuzen"),
 "E19": (6.9566, "gruen", "Dinkel: Imhof 695.66 a"),
 "F19": (None, "rot", "Ertrag Dinkel dt/ha. Standardertrag 45"),
 "E28": (6.1825, "rot", "Kartoffeln 618.25 a gesichert. ZEILE PRUEFEN: Speise-/Industrie (r28), Frueh- (r29) oder Pflanz- (r30). Zusaetzlich Sortengruppe a/b/c - bestimmt die N-Norm"),
 "F28": (None, "rot", "Ertrag Kartoffeln dt/ha"),
 "E39": (41.6553, "gruen", "Freilandgemuese, physische Flaeche Imhof 4165.53 a. Kulturen einzeln im Blatt Gem1"),
 "E41": (0.2255, "gruen", "Erdbeeren einjaehrig, Imhof 22.55 a"),
 "E54": (0.1658, "gruen", "Saum auf Ackerflaeche, Zaehner 16.58 a"),
 "E64": (0.5090, "gruen", "Heil-/Gewuerzpflanzen mehrjaehrig, Zaehner 50.90 a"),
 "E32": (0.7336, "rot", "Saatmais Vertragsanbau 73.36 a (Code 0519). ZEILE PRUEFEN: Koernermais r32 oder Saatgutproduktion"),
 "E33": (1.6211, "rot", "Mischung Bohnen/Wicken/Erbsen mit Getreide, min. 30 % Leguminosen, Koernergewinnung 162.11 a (Code 0569). Passende Zeile waehlen"),
 # --- Gruenland, N = Flaeche ha, O = Ertrag dt TS/ha ---
 "N10": (14.0544, "gruen", "Extensiv genutzte Wiesen: Imhof 698.48 + Zaehner 706.96 a"),
 "O10": (None, "rot", "Ertrag extensive Wiese dt TS/ha, Richtwert 10-30. Bilanz 2023 Zaehner: 25"),
 "N11": (None, "rot", "Anteil wenig intensive Wiesen. Siehe Aufteilung uebrige Dauerwiesen unten"),
 "O11": (None, "rot", "Ertrag wenig intensiv, Richtwert 20-65"),
 "N15": (2.2204, "gruen", "Extensiv genutzte Weiden, Zaehner 222.04 a"),
 "O15": (None, "rot", "Ertrag extensive Weide dt TS/ha, Richtwert 10-25. Bilanz 2023 Zaehner: 25"),
 "N17": (None, "rot", "Anteil mittelintensive Wiesen"),
 "O17": (None, "rot", "Ertrag mittelintensiv, Richtwert 40-100"),
 "N19": (None, "rot", "Anteil intensive Naturwiesen. UEBRIGE DAUERWIESEN TOTAL 19.4547 ha (Imhof 514.92 + Zaehner 1430.55 a) auf N11/N17/N19 aufteilen"),
 "N16": (None, "rot", "Anteil wenig intensive Dauerweiden"),
 "N18": (None, "rot", "Anteil mittelintensive Weiden"),
 "N20": (None, "rot", "Anteil intensive Weiden. WEIDEN TOTAL 5.3361 ha (Zaehner 533.61 a) auf N15/N16/N18/N20 aufteilen"),
 "N22": (18.8762, "gruen", "Kunstwiesen: Imhof 1142.20 + Zaehner 745.42 a"),
 "N27": (1.2921, "gruen", "Silo- und Gruenmais, Zaehner 129.21 a"),
 "O27": (None, "rot", "Ertrag Silomais dt TS/ha. Standardertrag 185. Bilanz 2023 Zaehner: 170"),
 "N32": (0.5879, "gruen", "Geschuetzter Anbau ohne festes Fundament, Imhof 58.79 a"),
 "N33": (1.2186, "gruen", "Gewaechshaus mit festem Fundament, Imhof 121.86 a"),
 "N34": (0.5020, "gruen", "Streueflaechen, Zaehner 50.20 a"),
 "O34": (None, "rot", "Ertrag Streueflaeche dt TS/ha"),
 "N35": (2.4764, "gruen", "Hecken mit Krautsaum: Imhof 18.29 + Zaehner 229.35 a"),
 "N36": (0.0310, "gruen", "Hecken mit Pufferstreifen: Imhof 0.61 + Zaehner 2.49 a"),
 "N37": (0.1232, "rot", "Uebrige Gruenflaeche Zaehner 12.32 a (Code 0697). Zuordnung pruefen"),
 "N54": (255, "gruen", "Hochstamm-Feldobst- und Nussbaeume in STUECK: Imhof 38+1, Zaehner 168+48"),
 "N55": (8, "rot", "Einzelbaeume in Stueck: Imhof 1 markanter + Zaehner 7 standortgerechte. Anrechenbarkeit pruefen"),
}

D["Tierb"] = {
 "G33": (5, "gruen", "Equiden > 148 cm, ueber 900-taegig: 4 Tiere (1222) + 1 Hengst (1223)"),
 "G36": (4, "gruen", "Equiden <= 148 cm, ueber 900-taegig: 4 Tiere (1262)"),
 "G40": (219.51, "gruen", "Milchschafe, Plaetze aus TVD-Auswertung 10.06.2026 (54.8766 GVE / 0.25)"),
 "D40": (450, "gruen", "Ø Jahresmilchmenge Milchschaf 450 kg gemaess Angabe"),
 "G41": (45.14, "gruen", "Andere Schafe ueber 365-taegig, Plaetze aus TVD (7.6744 GVE / 0.17)"),
 "G42": (106.03, "gruen", "Jungschafe 180-365-taegig, Plaetze aus TVD (6.3615 GVE / 0.06)"),
 "G43": (128.83, "gruen", "Laemmer bis 180-taegig, Plaetze aus TVD (3.8649 GVE / 0.03)"),
 "G44": (3, "gruen", "Milchziegen, Betriebsdatenblatt Zaehner"),
 "D44": (None, "rot", "Ø Jahresmilchmenge Milchziege kg. Standard 550"),
 "G45": (2, "gruen", "Andere Ziegen ueber 365-taegig: 1 weiblich + 1 maennlich"),
 "G46": (6, "gruen", "Jungziegen 180-365-taegig"),
 "G47": (2, "gruen", "Zicklein bis 180-taegig aus Milchziegenherde (0.0598 GVE / 0.03)"),
 "J40": (None, "rot", "SOEMMERUNG: Abzug Milchschafe. Betriebsdatenblatt weist Soem-Inland 12.2158 GVE aus, Alpung total 60.03 NST. Bilanz 2023 hatte -47.21 Plaetze"),
 "K40": (None, "rot", "Anzahl Abwesenheitstage Soemmerung Milchschafe"),
 "J41": (None, "rot", "Soemmerungsabzug andere Schafe (Soem-Inland 2.3041 GVE)"),
 "J42": (None, "rot", "Soemmerungsabzug Jungschafe (Soem-Inland 1.5100 GVE)"),
 "J43": (None, "rot", "Soemmerungsabzug Laemmer (Soem-Inland 0.1850 GVE)"),
 "J44": (None, "rot", "Soemmerungsabzug Milchziegen (Soem-Inland 0.1595 GVE)"),
 "N33": (None, "rot", "Laufhof Equiden >148 cm: Anzahl Tiere. Bilanz 2023: 3"),
 "O33": (None, "rot", "Laufhoftage Equiden. Bilanz 2023: 90"),
 "P33": (None, "rot", "Weide Equiden: Anzahl Tiere. Bilanz 2023: 3"),
 "Q33": (None, "rot", "Weidestunden pro Tag. Bilanz 2023: 4"),
 "R33": (None, "rot", "Weidetage. Bilanz 2023: 100"),
 "N36": (None, "rot", "Laufhof Ponys: Anzahl Tiere. Bilanz 2023: 3"),
 "O36": (None, "rot", "Laufhoftage Ponys. Bilanz 2023: 90"),
 "P36": (None, "rot", "Weide Ponys: Anzahl Tiere. Bilanz 2023: 3"),
 "Q36": (None, "rot", "Weidestunden. Bilanz 2023: 4"),
 "R36": (None, "rot", "Weidetage. Bilanz 2023: 100"),
 "N40": (None, "rot", "Laufhof Milchschafe: Anzahl Tiere. Bilanz 2023: 226"),
 "O40": (None, "rot", "Laufhoftage Milchschafe. Bilanz 2023: 150"),
 "P40": (None, "rot", "Weide Milchschafe: Anzahl Tiere. Bilanz 2023: 226"),
 "Q40": (None, "rot", "Weidestunden pro Tag. Bilanz 2023: 20. ACHTUNG ab Wegleitung 1.20: bei mehr als 12 h kein zusaetzlicher Laufhofabzug"),
 "R40": (None, "rot", "Weidetage Milchschafe. Bilanz 2023: 100"),
 "N41": (None, "rot", "Laufhof andere Schafe. Bilanz 2023: 63 Tiere, 150 Tage"),
 "O41": (None, "rot", "Laufhoftage andere Schafe"),
 "P41": (None, "rot", "Weide andere Schafe. Bilanz 2023: 63 Tiere"),
 "Q41": (None, "rot", "Weidestunden. Bilanz 2023: 24"),
 "R41": (None, "rot", "Weidetage. Bilanz 2023: 100"),
 "N44": (None, "rot", "Laufhof Ziegen. Bilanz 2023: 5 Tiere, 150 Tage"),
 "P44": (None, "rot", "Weide Ziegen. Bilanz 2023: 5 Tiere, 20 h, 100 Tage"),
 "G64": (None, "rot", "Wollschweine: 2 Stueck gemaess Selbstdeklaration. Passende Schweinekategorie waehlen"),
}

D["SB1"] = {
 "G55": ("Huehnermist (Zufuhr)", "gruen", "Hofduengerzufuhr in die Gemeinschaft"),
 "K55": (90, "gruen", "90 t Huehnermist gemaess Angabe"),
 "M55": (None, "rot", "Nges kg je t Huehnermist gemaess HODUFLU-Lieferschein. Frueher verwendet: 21 kg/t"),
 "N55": (None, "rot", "P2O5 kg je t. Frueher verwendet: 17 kg/t"),
 "O55": (None, "rot", "K2O kg je t"),
 "P55": (None, "rot", "Mg kg je t"),
 "X55": (None, "rot", "Vollmist ja/nein: senkt den N-Ausnutzungsgrad"),
 "G57": ("Schweineguelle (Zufuhr)", "gruen", "Hofduengerzufuhr in die Gemeinschaft"),
 "K57": (60, "gruen", "ca. 60 m3 Schweineguelle gemaess Angabe"),
 "M57": (None, "rot", "Nges kg je m3 Schweineguelle gemaess HODUFLU"),
 "N57": (None, "rot", "P2O5 kg je m3"),
 "O57": (None, "rot", "K2O kg je m3"),
 "P57": (None, "rot", "Mg kg je m3"),
 "E77": (None, "rot", "Gras/Grassilage Zu- oder Wegfuhr in dt FS. ACHTUNG: Lieferungen zwischen Imhof und Zaehner sind in der gemeinsamen Bilanz INTERN und duerfen NICHT erfasst werden"),
 "G77": (None, "rot", "TS-Gehalt in Prozent, Grassilage in der Regel 35"),
 "M96": (5, "gruen", "Fehlerbereich der Grundfutterbilanz, zulaessig 0-5 Prozent"),
 "J11": (None, "rot", "Kraftfutter Milchkuehe: entfaellt, kein Rindvieh im Bestand"),
}

D["SB2"] = {
 "D73": ("Biorga", "gruen", "Zugefuehrter Handelsduenger"),
 "J73": (40, "gruen", "40 t Biorga gemaess Angabe"),
 "N73": (None, "rot", "Nverf kg je t Biorga gemaess Deklaration. Achtung: Produkt genau bezeichnen, Biorga N und Biorga Quick haben verschiedene Gehalte"),
 "O73": (None, "rot", "P2O5 kg je t Biorga"),
 "P73": (None, "rot", "K2O kg je t"),
 "Q73": (None, "rot", "Mg kg je t"),
 "D74": ("Brinogia", "gruen", "Zugefuehrter Handelsduenger"),
 "J74": (10, "gruen", "10 t Brinogia gemaess Angabe. Einheit pruefen: Zeile 74 rechnet in dt, frueher wurde Brinogia in m3 erfasst"),
 "N74": (None, "rot", "Nverf kg je Einheit Brinogia gemaess Deklaration"),
 "O74": (None, "rot", "P2O5 kg je Einheit"),
 "P74": (None, "rot", "K2O kg je Einheit"),
 "Q74": (None, "rot", "Mg kg je Einheit"),
 "J72": (None, "rot", "Emissionsmindernd beguellte Flaeche in ha, ergibt 6 kg Nverf je ha"),
 "J83": (None, "rot", "Zukauf Weizenstroh zum Einstreuen in dt FS. Bilanz 2023 Zaehner: 485.3 dt"),
}

D["Gem1"] = {
 "D12": (1400, "gruen", "Fenchel 14 ha = 1400 Aren. ACHTUNG: Angabe lautet Fenchel plus diverses Kleingemuese - Kleingemuese separat erfassen"),
 "D13": (1100, "gruen", "Salat 11 ha = 1100 Aren"),
 "D14": (800, "gruen", "Karotten 8 ha = 800 Aren"),
 "D15": (700, "gruen", "Zwiebeln 7 ha = 700 Aren"),
 "D16": (1200, "gruen", "Kuerbis 12 ha = 1200 Aren"),
 "D17": (None, "rot", "Diverses Kleingemuese: Kulturen und Flaechen einzeln erfassen"),
}

# ------------------------------------------------------------- Nachbau-Logik
BLAETTER = [("Allg",10), ("Fläche",20), ("Tierb",25), ("SB1",26), ("SB2",25), ("Gem1",16), ("FormE",18)]

wf = openpyxl.load_workbook(QUELLE, data_only=False)
wv = openpyxl.load_workbook(QUELLE, data_only=True)
neu = openpyxl.Workbook()
neu.remove(neu.active)

def ist_offen(cell):
    return bool(cell.protection and cell.protection.locked is False)

bemerkungen = []   # (Blatt, Zelle, Status, Bezeichnung, Bemerkung)

for name, maxc in BLAETTER:
    src, srcv = wf[name], wv[name]
    zs = neu.create_sheet(name)
    daten = D.get(name, {})
    maxr = min(src.max_row, 130)

    for r in range(1, maxr+1):
        for c in range(1, maxc+1):
            ref = f"{get_column_letter(c)}{r}"
            f_cell = src.cell(row=r, column=c)
            wert = srcv.cell(row=r, column=c).value
            formel = f_cell.value
            ist_formel = isinstance(formel, str) and formel.startswith("=")
            ziel = zs.cell(row=r, column=c)

            if ref in daten:
                v, status, bem = daten[ref]
                ziel.value = v
                ziel.fill = GRUEN if status == "gruen" else ROT
                ziel.border = RAHMEN
                ziel.font = Font(bold=True, size=10)
                ziel.alignment = Alignment(horizontal="right" if isinstance(v,(int,float)) else "left")
                # Bezeichnung der Zeile fuer die Bemerkungsliste
                # Im Blatt Flaeche stehen zwei Bloecke nebeneinander: Hauptkulturen (B..I)
                # und Gruenland (K..P). Fuer den rechten Block darf die Beschriftung
                # nicht aus dem linken Block geholt werden.
                bez = ""
                if name == "Fläche" and c >= 13:
                    # Gruenlandblock: Bezeichnung steht in K und L, M ist die Codespalte
                    teile = [srcv.cell(row=r, column=x).value for x in (11, 12)]
                    bez = " ".join(str(t).strip() for t in teile if isinstance(t,str) and t.strip())
                grenze = 1
                for cc in ([] if bez else range(c-1, grenze-1, -1)):
                    tv = srcv.cell(row=r, column=cc).value
                    if isinstance(tv,str) and len(tv.strip())>1:
                        bez = tv.strip()
                        nach = srcv.cell(row=r, column=cc+1).value
                        if isinstance(nach,str) and len(nach.strip())>1 and cc+1 < c:
                            bez += " " + nach.strip()
                        break
                bemerkungen.append((name, ref, status, bez[:46], bem))
            elif ist_offen(f_cell):
                # Eingabefeld des Nachweis, fuer diesen Betrieb aber nicht noetig
                ziel.fill = GELB
                ziel.border = RAHMEN
            elif ist_formel and isinstance(wert,(int,float)):
                ziel.fill = BLAU
                ziel.border = RAHMEN
            elif isinstance(wert,str) and wert.strip():
                # Beschriftungen wie "= LN" wuerde Excel sonst als Formel lesen
                if wert.lstrip().startswith("="):
                    ziel.value = wert
                    ziel.data_type = "s"
                else:
                    ziel.value = wert
                ziel.font = Font(size=9, color="333333")
            elif isinstance(wert,(int,float)):
                ziel.value = wert
                ziel.font = Font(size=9, color="777777")

    for col, dim in src.column_dimensions.items():
        if dim.width:
            try:
                if openpyxl.utils.column_index_from_string(col) <= maxc:
                    zs.column_dimensions[col].width = dim.width
            except Exception:
                pass
    for rng in list(src.merged_cells.ranges):
        if rng.max_col <= maxc and rng.max_row <= maxr:
            try: zs.merge_cells(str(rng))
            except Exception: pass
    zs.freeze_panes = "A10" if name in ("Fläche","Tierb") else "A2"

# ------------------------------------------------------- Blatt "Anleitung"
an = neu.create_sheet("Anleitung", 0)
an.column_dimensions["A"].width = 3
an.column_dimensions["B"].width = 30
an.column_dimensions["C"].width = 108
def z(r, b, c, fett=False, fill=None, groesse=10):
    an.cell(row=r, column=2, value=b).font = Font(bold=True, size=groesse)
    zc = an.cell(row=r, column=3, value=c)
    zc.font = Font(bold=fett, size=groesse)
    zc.alignment = Alignment(wrap_text=True, vertical="top")
    if fill: an.cell(row=r, column=2).fill = fill
    return r+1

r = 2
an.cell(row=r, column=2, value="Ausfuellhilfe AGRIDEA Nachweis - Planbilanz 2026").font = Font(bold=True, size=14)
r += 2
r = z(r, "Worum es geht", "Gemeinsame Naehrstoffbilanz der Betriebe H. Imhof Bioprodukte (ZH0197/1/1, Schwerzenbach) und Zaehner Bruno (ZH0174/1/40, Illnau).")
r = z(r, "", "Dieses Dokument enthaelt KEINE Formeln. Es bildet die Eingabeblaetter des Nachweis-Tools mit denselben Zelladressen nach, damit die Werte eins zu eins uebertragen werden koennen.")
r += 1
an.cell(row=r, column=2, value="Farben").font = Font(bold=True, size=11); r += 1
an.cell(row=r, column=2).fill = GRUEN
r = z(r, "gruen", "Wert steht drin und ist belegt. Quelle in der Spalte Bemerkung und im Blatt Offene Punkte.")
an.cell(row=r, column=2).fill = ROT
r = z(r, "rot", "Muss eingetragen werden, der Wert fehlt mir. Wo ein Wert drinsteht, ist die Zahl belegt, aber die Zeile oder die Einheit muss geprueft werden.")
an.cell(row=r, column=2).fill = BLAU
r = z(r, "blau", "Summen- und Rechenfeld. Nicht ausfuellen, das Nachweis rechnet es selber.")
an.cell(row=r, column=2).fill = GELB
r = z(r, "hellgelb", "Eingabefeld des Nachweis, das dieser Betrieb nicht braucht. Leer lassen. Diese Felder sind im Nachweis ebenfalls gelb.")
r += 1
an.cell(row=r, column=2, value="Vor dem Ausfuellen beachten").font = Font(bold=True, size=11); r += 1
r = z(r, "1  Interne Lieferungen", "In einer gemeinsamen Bilanz sind Lieferungen zwischen Imhof und Zaehner INTERN. Grundfutter von Imhof an Zaehner und Hofduenger von Zaehner an Imhof duerfen NICHT als Zu- oder Wegfuhr erfasst werden, sonst wird doppelt gezaehlt. Nur Zu- und Wegfuhren ueber die Grenze der Gemeinschaft hinaus gehoeren in die Bilanz.", fett=True)
r = z(r, "2  Einheiten", "Die Betriebsdatenblaetter fuehren die Flaechen in AREN, das Nachweis-Blatt Flaeche rechnet in HEKTAREN. Ich habe bereits umgerechnet. Das Zusatzblatt Gem1 dagegen verlangt AREN - dort stehen die Gemuesekulturen in Aren.")
r = z(r, "3  Intensive Wiesen", "Bei Naturwiese intensiv (Zeile 19), Weide intensiv (Zeile 20) und Kunstwiese intensiv (Zeile 22) ist das Ertragsfeld im Nachweis gesperrt. Das Programm rechnet diese Ertraege als Restgroesse aus der Grundfutterbilanz. Nur die Flaeche eintragen.")
r = z(r, "4  Tierzahlen", "Die Plaetze stammen aus der TVD-Auswertung vom 10.06.2026. Diese deckt nur den Zeitraum 1.1. bis 9.6.2026 ab. Fuer eine Planbilanz ueber das ganze Jahr ist zu pruefen, ob der Bestand so bleibt.")
r = z(r, "5  Soemmerung", "Der Betrieb Zaehner weist 60.03 Normalstoesse Alpung aus. Die gesoemmerten Tiere muessen in der Spalte Abzug/Zuschlag abgezogen werden, sonst faellt der Naehrstoffanfall zu hoch aus.")
r = z(r, "6  Gemuese", "Die geplanten Gemuesekulturen ergeben 52 ha, die Strukturdatenerhebung weist 41.66 ha Freilandgemuese aus. Die Differenz von rund 10 ha erklaert sich durch Folgekulturen auf derselben Flaeche. Im Blatt Flaeche steht die physische Flaeche, im Blatt Gem1 jede Kultur einzeln.")
r += 1

an.cell(row=r, column=2, value="Zur Frage: Warum 1500 statt 450?").font = Font(bold=True, size=11); r += 1
r = z(r, "Antwort", "Der Unterschied kommt nicht von den Tierzahlen, sondern von den Referenzwerten der verwendeten Tierkategorie.")
r = z(r, "", "In der Bilanz 2023 wurde die Kategorie Milchschafplatz mit 17.85 kg Nges je Platz und Jahr gerechnet (Grundfutterverzehr 11.0 dt TS). Diese Werte gehoeren zu einem deutlich hoeheren Milchniveau als 450 kg.")
r = z(r, "", "Nach der aktuellen Wegleitung 1.20 hat ein Milchschaf bei der Standardleistung von 500 kg einen Anfall von 13.66 kg Nges je Platz. Je 25 kg weniger Milch sinkt der Wert um 0.50 kg. Bei 450 kg sind das 500 minus 450 gleich 50 kg, also zwei Schritte: 13.66 minus 1.00 gleich 12.66 kg Nges je Platz.")
r = z(r, "", "Pro Tier also 12.66 statt 17.85 kg Nges, rund 29 Prozent weniger. Dass die Tierzahlen 2023 tiefer waren und der Gesamtanfall trotzdem hoeher wirkte, liegt genau an diesen hoeheren Werten je Platz.", fett=True)
r = z(r, "Zu pruefen", "Die Bilanz 2023 wurde mit Wegleitung 1.16 gerechnet. Deren Referenzwerte liegen mir nicht vor, ich kann daher nur den Vergleich zur heute gueltigen Fassung 1.20 belegen. Wenn 450 kg der tatsaechliche Schnitt ist, ist 12.66 kg Nges je Platz der korrekte Wert fuer 2026.")
r += 1
r = z(r, "Abgrenzung", "Diese Ausfuellhilfe ersetzt weder die Referenzmethode noch eine amtliche Pruefung. Massgebend sind die Wegleitung Suisse-Bilanz und die geltende Gesetzgebung.")

# --------------------------------------------------- Blatt "Offene Punkte"
op = neu.create_sheet("Offene Punkte", 1)
for i, (b, w) in enumerate([("Blatt",12),("Zelle",8),("Status",9),("Zeile im Nachweis",44),("Was zu tun ist / Quelle",104)], start=1):
    zc = op.cell(row=1, column=i, value=b)
    zc.font = Font(bold=True, color="FFFFFF"); zc.fill = PatternFill("solid", fgColor="4A6E4A")
    op.column_dimensions[get_column_letter(i)].width = w
zeile = 2
for status in ("rot","gruen"):
    for (blatt, ref, st, bez, bem) in bemerkungen:
        if st != status: continue
        op.cell(row=zeile, column=1, value=blatt)
        op.cell(row=zeile, column=2, value=ref)
        zc = op.cell(row=zeile, column=3, value="offen" if st=="rot" else "belegt")
        zc.fill = ROT if st=="rot" else GRUEN
        op.cell(row=zeile, column=4, value=bez)
        zc2 = op.cell(row=zeile, column=5, value=bem)
        zc2.alignment = Alignment(wrap_text=True, vertical="top")
        for cc in range(1,6): op.cell(row=zeile, column=cc).border = RAHMEN
        zeile += 1
op.freeze_panes = "A2"
op.auto_filter.ref = f"A1:E{zeile-1}"

neu.save(ZIEL)
rot = sum(1 for x in bemerkungen if x[2]=="rot")
gruen = sum(1 for x in bemerkungen if x[2]=="gruen")
print(f"{ZIEL} erstellt")
print(f"  Blaetter: {', '.join(neu.sheetnames)}")
print(f"  gruen (belegt): {gruen}   rot (offen): {rot}")
