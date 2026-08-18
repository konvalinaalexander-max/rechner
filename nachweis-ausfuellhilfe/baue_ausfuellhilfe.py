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
Q_SB = "Planbilanz 2026 (Nr. 0197-001, Imhof & Zaehner Betriebsgemeinschaft, gerechnet 10.06.2026)"
Q_BDI = "Betriebsdatenblatt Imhof 2026"
Q_BDZ = "Betriebsdatenblatt Zaehner 2026"

D["Allg"] = {
 "G4":  ("0197-001", "gruen", f"Gde.-Betr.-Nr. der gemeinsamen Bilanz. Quelle: {Q_SB}"),
 "G6":  (2026, "gruen", f"Erntejahr. Quelle: {Q_SB}"),
 "G7":  ("Planbilanz", "gruen", f"Variante. Quelle: {Q_SB}"),
 "C9":  ("Imhof & Zaehner Betriebsgemeinschaft", "gruen", f"Bewirtschafter. Quelle: {Q_SB}"),
 "C10": ("Eichhof", "gruen", f"Strasse/Hof. Quelle: {Q_BDI}"),
 "C11": ("8603 Schwerzenbach", "gruen", f"PLZ/Ort. Quelle: {Q_SB} und {Q_BDI}"),
 "G11": ("ZH", "gruen", "Kanton Zuerich"),
 "C12": ("+41 43 355 30 00", "gruen", f"Telefon. Quelle: {Q_BDI}"),
 "G12": ("h.imhof@imhofbio.ch", "gruen", f"E-Mail. Quelle: {Q_BDI}"),
 "C14": (None, "leer", "Hoehe ueber Meer: in der Planbilanz 2026 und im Kennziffernblatt leer gelassen. Ohne Einfluss auf die Bilanz, kann leer bleiben"),
 "G14": (None, "leer", "Winterfuetterung in Tagen: wird nur fuer den Hofduengeranfall (Blatt Hd) gebraucht, nicht fuer die Suisse-Bilanz"),
 "C15": ("Bio", "gruen", f"Bewirtschaftungsart Bio. Quelle: {Q_SB}, beide Betriebe mit Biolandbau-Beitrag"),
 "G15": ("Talzone", "gruen", f"Zone 31 Talzone. Quelle: {Q_SB}"),
 "C16": ("Betriebsgemeinschaft", "gruen", f"Quelle: {Q_SB} fuehrt Imhof & Zaehner als Betriebsgemeinschaft"),
 "G16": ("Nein", "gruen", "Silobetrieb Nein. Quelle: Kennziffernblatt Ziffer 1.5"),
 "C19": ("Braun Serge, Strickhof Lindau", "gruen", f"RechnerIn. Quelle: {Q_SB}"),
 "C39": (None, "leer", "Fuer die Suisse-Bilanz nicht erforderlich - massgebend sind die Flaechen im Blatt Flaeche. Nur fuer die Direktzahlungsberechnung noetig. Falls ausgefuellt: Partner A = Imhof, Total LN 89.1968 ha, Aufteilung Eigen-/Pachtland aus den Pachtvertraegen"),
 "E39": (None, "leer", "Partner A = Imhof, Pachtland. Siehe Hinweis bei C39"),
 "C40": (None, "leer", "Fuer die Suisse-Bilanz nicht erforderlich. Falls ausgefuellt: Partner B = Zaehner, Total LN 43.9260 ha"),
 "E40": (None, "leer", "Partner B = Zaehner, Pachtland. Siehe Hinweis bei C40"),
 "G45": (0, "gruen", "Bauzone ausserhalb LN = 0. Quelle: Kennziffernblatt Ziffer 1.4 und Formular C der Planbilanz 2026"),
}

D["Fläche"] = {
 # ---------- Hauptkulturen: E = Flaeche ha, F = Ertrag dt/ha ----------
 "E10": (8.1344, "gruen", f"Winterweizen. {Q_BDI} 569.13 a + {Q_BDZ} 244.31 a"),
 "F10": (60, "gruen", f"Ertrag Winterweizen 60 dt/ha = Standardertrag. Quelle: {Q_SB}"),
 "T10": (None, "leer", "Ertragskorrektur nicht ankreuzen: der Ertrag entspricht dem Standardertrag von 60 dt/ha"),
 "E19": (6.9566, "gruen", f"Dinkel. {Q_BDI} 695.66 a"),
 "F19": (45, "gruen", f"Ertrag Dinkel 45 dt/ha = Standardertrag. Quelle: {Q_SB}"),
 "E24": (1.6211, "gruen", f"Getreide-Ganzpflanzensilage mit Leguminosen. {Q_BDI} Code 0569, 162.11 a. In der Planbilanz 2026 mit 1.62 ha auf dieser Zeile gefuehrt. ACHTUNG: das Betriebsdatenblatt deklariert Code 0569 zur Koernergewinnung - wenn die Ernte als Korn erfolgt, gehoert die Flaeche nicht zur Futterflaeche"),
 "F24": (106, "gruen", "Fixer Ertrag 106 dt TS/ha fuer Getreide-Ganzpflanzensilage gemaess Wegleitung"),
 "E30": (6.1825, "gruen", f"Kartoffeln, Pflanz-, Sortengruppe b. {Q_BDI} Code 0524, 618.25 a. Die Planbilanz 2026 fuehrt 6.18 ha Pflanzkartoffeln (b) - Flaeche stimmt ueberein. Die 8.00 ha Speisekartoffeln der Planbilanz sind 2026 nicht mehr deklariert"),
 "F30": (250, "gruen", f"Ertrag Pflanzkartoffeln 250 dt/ha = Standardertrag, N-Norm 100 kg/ha. Quelle: {Q_SB}"),
 "E32": (0.7336, "rot", f"Saatmais Vertragsanbau, {Q_BDI} Code 0519, 73.36 a. ZEILE BESTAETIGEN: als Koernermais erfassen? In der Planbilanz 2026 war diese Kultur nicht enthalten"),
 "F32": (None, "rot", "Ertrag Saatmais dt/ha. Standardertrag Koernermais 100 dt/ha, Saatmais liegt in der Regel deutlich darunter"),
 "B37": ("Nicht aufgefuehrte Ackerkultur", "gruen", "Freie Zeile fuer die kleinen Restflaechen"),
 "E37": (0.7660, "gruen", f"Restflaechen zusammengefasst: {Q_BDI} Code 0598 uebrige offene Ackerflaeche 8.72 a + Code 0898 uebrige Flaechen in der LN 12.20 a + Code 99999 noch nicht gewaehlte Kultur 37.02 a, dazu {Q_BDZ} Code 0898 18.66 a. Die Planbilanz 2026 fuehrte dafuer 0.75 ha als nicht aufgefuehrte Ackerkultur"),
 "E39": (41.6553, "gruen", f"Freilandgemuese, physische Flaeche. {Q_BDI} Code 0545, 4165.53 a. Die einzelnen Kulturen im Blatt Gem1"),
 "E41": (0.2255, "gruen", f"Erdbeeren einjaehrig. {Q_BDI} Code 0551, 22.55 a. Planbilanz 2026: 0.22 ha"),
 "E54": (0.1658, "gruen", f"Saum auf Ackerflaeche. {Q_BDZ} Code 0559, 16.58 a. Planbilanz 2026: 0.16 ha"),
 "E64": (0.5090, "gruen", f"Heil- und Gewuerzpflanzen mehrjaehrig. {Q_BDZ} Code 0706, 50.90 a. Planbilanz 2026: Kraeuter mehrjaehrig mittel 0.50 ha, Bedarf 70/30/160/15 kg je ha"),
 # ---------- Gruenland: N = Flaeche ha, O = Ertrag dt TS/ha ----------
 "N10": (14.0544, "gruen", f"Extensiv genutzte Wiesen. {Q_BDI} 698.48 a + {Q_BDZ} 706.96 a. Planbilanz 2026: Naturwiese extensiv 13.98 ha"),
 "O10": (25, "gruen", f"Ertrag 25 dt TS/ha. Quelle: {Q_SB}"),
 "N11": (19.4547, "gruen", f"Uebrige Dauerwiesen als wenig intensiv. {Q_BDI} 514.92 a + {Q_BDZ} 1430.55 a. Planbilanz 2026: Naturwiese wenig intensiv 19.44 ha - Flaeche stimmt ueberein"),
 "O11": (50, "gruen", f"Ertrag 50 dt TS/ha. Quelle: {Q_SB}"),
 "N15": (2.2204, "gruen", f"Extensiv genutzte Weiden. {Q_BDZ} Code 0617, 222.04 a. Planbilanz 2026: Weide extensiv 2.22 ha"),
 "O15": (20, "gruen", f"Ertrag 20 dt TS/ha. Quelle: {Q_SB}"),
 "N20": (5.3361, "rot", f"Weiden (Heimweiden). {Q_BDZ} Code 0616, 533.61 a. INTENSITAETSSTUFE BESTAETIGEN: hier auf intensiv gesetzt, weil Zaehner 2023 seine Weiden als Weide (Maeh-) intensiv fuehrte. Die Planbilanz 2026 kannte nur 0.12 ha Weide wenig intensiv. Bei anderer Stufe die Flaeche auf N16, N18 oder N20 verschieben"),
 "N22": (18.8762, "gruen", f"Kunstwiesen. {Q_BDI} 1142.20 a + {Q_BDZ} 745.42 a. Planbilanz 2026: 18.87 ha als intensive Wiese - Flaeche stimmt ueberein. Ertrag ist gesperrt, das Programm rechnet ihn als Restgroesse"),
 "N27": (1.2921, "gruen", f"Silo- und Gruenmais. {Q_BDZ} Code 0521, 129.21 a. Planbilanz 2026: Silomais 2.02 ha"),
 "O27": (185, "gruen", f"Ertrag Silomais 185 dt TS/ha = Standardertrag. Quelle: {Q_SB}"),
 "N32": (0.5879, "gruen", f"Geschuetzter Anbau ohne festes Fundament. {Q_BDI} Code 0811, 58.79 a. Kultur im Blatt Gem2 erfassen"),
 "N33": (1.2186, "gruen", f"Gewaechshaus mit festem Fundament. {Q_BDI} Code 0801, 121.86 a. Planbilanz 2026: Tomaten Bodenkultur 1.21 ha - Flaeche stimmt ueberein"),
 "N34": (0.5020, "gruen", f"Streueflaechen. {Q_BDZ} Code 0851, 50.20 a. Planbilanz 2026: Streue-/Torfland 0.50 ha"),
 "O34": (None, "leer", "Ertrag Streueflaeche: in der Planbilanz 2026 kein Ertrag erfasst, Bedarf ist ohnehin null"),
 "N35": (2.4764, "gruen", f"Hecken mit Krautsaum. {Q_BDI} 18.29 a + {Q_BDZ} 229.35 a. Planbilanz 2026: 2.47 ha"),
 "N36": (0.0310, "gruen", f"Hecken mit Pufferstreifen. {Q_BDI} Code 0857 0.61 a + {Q_BDZ} Code 0858 2.49 a. ABWEICHUNG: die Planbilanz 2026 fuehrte hier 3.01 ha. Massgebend ist die Strukturdatenerhebung 2026"),
 "N37": (0.1232, "rot", f"Uebrige Gruenflaeche. {Q_BDZ} Code 0697, 12.32 a. ZEILE BESTAETIGEN: hier auf Uferwiese gesetzt, in der Planbilanz 2026 nicht enthalten"),
 "N54": (255, "gruen", f"Hochstamm-Feldobst- und Nussbaeume in STUECK: {Q_BDI} 38 + 1, {Q_BDZ} 168 + 48. Die Planbilanz 2026 enthielt keine Hochstammbaeume, Zaehner 2023 dagegen 192 Baeume mit 45/15/56/8 kg je ha"),
 "N55": (8, "gruen", f"Einheimische Einzelbaeume in Stueck: {Q_BDI} 1 markanter Einzelbaum, {Q_BDZ} 7 standortgerechte. Diese Baeume haben keine Naehrstoffnorm (das Ertragsfeld daneben ist gesperrt), der Eintrag dient der Vollstaendigkeit"),
}

D["Tierb"] = {
 "G33": (5, "gruen", f"Equiden ueber 148 cm, ueber 900-taegig. {Q_BDZ}: 4 Tiere Code 1222 + 1 Hengst Code 1223. Planbilanz 2026: 5 Plaetze"),
 "N33": (5, "gruen", f"Laufhof: 5 Tiere. Quelle: {Q_SB}"),
 "O33": (90, "gruen", f"Laufhoftage 90. Quelle: {Q_SB}"),
 "P33": (5, "gruen", f"Weide: 5 Tiere. Quelle: {Q_SB}"),
 "Q33": (4, "gruen", f"Weidestunden 4 pro Tag. Quelle: {Q_SB}"),
 "R33": (100, "gruen", f"Weidetage 100. Quelle: {Q_SB}"),
 "G36": (4, "gruen", f"Equiden bis 148 cm (Ponys), ueber 900-taegig. {Q_BDZ} Code 1262: 4 Tiere. Planbilanz 2026: 4 Plaetze"),
 "N36": (4, "gruen", f"Laufhof: 4 Tiere. Quelle: {Q_SB}"),
 "O36": (90, "gruen", f"Laufhoftage 90. Quelle: {Q_SB}"),
 "P36": (4, "gruen", f"Weide: 4 Tiere. Quelle: {Q_SB}"),
 "Q36": (4, "gruen", f"Weidestunden 4 pro Tag. Quelle: {Q_SB}"),
 "R36": (100, "gruen", f"Weidetage 100. Quelle: {Q_SB}"),
 "G40": (219, "gruen", "Milchschafe. Planbilanz 2026: 219 Plaetze. TVD-Auswertung vom 10.06.2026: 219.5063 Plaetze (54.8766 GVE bei 0.25 GVE je Tier) - gleicher Tag, gleiche Zahl"),
 "D40": (450, "gruen", f"Jahresmilchmenge je Schaf 450 kg. Quelle: {Q_SB}, Kopfzeile Formular A, und Angabe im Auftrag"),
 "G41": (45, "gruen", "Andere Schafe ueber 365 Tage. Planbilanz 2026: 45 Plaetze. TVD 10.06.2026: 45.1437"),
 "G42": (106, "gruen", "Jungschafe 180 bis 365 Tage. Planbilanz 2026: 106 Plaetze. TVD 10.06.2026: 106.0251"),
 "G43": (129, "gruen", "Laemmer bis 180 Tage. Planbilanz 2026: 129 Plaetze. TVD 10.06.2026: 128.8312"),
 "G44": (3, "gruen", f"Milchziegen. {Q_BDZ} Code 1461: 3 Stueck. Planbilanz 2026: 3 Plaetze"),
 "D44": (550, "gruen", f"Jahresmilchmenge je Ziege 550 kg. Quelle: {Q_SB}, Kopfzeile Formular A"),
 "G45": (2, "rot", f"Andere Ziegen ueber 365 Tage: {Q_BDZ} Code 1462 1 Stueck weiblich + Code 1464 1 Stueck maennlich. In der Planbilanz 2026 NICHT erfasst - bewusst weglassen oder ergaenzen?"),
 "G46": (6, "rot", f"Jungziegen 180 bis 365 Tage: {Q_BDZ} Code 1466, 6 Stueck. In der Planbilanz 2026 nicht erfasst"),
 "G47": (2, "rot", f"Zicklein bis 180 Tage aus Milchziegenherde: {Q_BDZ} Code 1468, 0.0598 GVE. In der Planbilanz 2026 nicht erfasst"),
 "G64": (None, "rot", f"Wollschweine: {Q_BDZ} Selbstdeklaration 2 Stueck, 0.0000 GVE. In der Planbilanz 2026 nicht erfasst. Passende Schweinekategorie waehlen oder weglassen"),
 "N40": (None, "leer", "Laufhof Milchschafe: in der Planbilanz 2026 kein Laufhofabzug erfasst"),
 "P40": (None, "leer", "Weide Milchschafe: in der Planbilanz 2026 kein Weideabzug erfasst"),
 "N41": (None, "leer", "Laufhof andere Schafe: in der Planbilanz 2026 nicht erfasst"),
 "P41": (None, "leer", "Weide andere Schafe: in der Planbilanz 2026 nicht erfasst"),
 "N44": (None, "leer", "Laufhof Ziegen: in der Planbilanz 2026 nicht erfasst"),
 "P44": (None, "leer", "Weide Ziegen: in der Planbilanz 2026 nicht erfasst"),
 "J40": (None, "leer", "Kein Soemmerungsabzug noetig: die TVD-Auswertung weist die Soemmerung getrennt als Normalstoesse aus, die Spalte Plaetze enthaelt nur die Tage auf dem Ganzjahresbetrieb. Die Planbilanz 2026 fuehrt entsprechend keinen Abzug"),
 "J41": (None, "leer", "Kein Soemmerungsabzug noetig, siehe Zeile 40"),
 "J42": (None, "leer", "Kein Soemmerungsabzug noetig, siehe Zeile 40"),
 "J43": (None, "leer", "Kein Soemmerungsabzug noetig, siehe Zeile 40"),
 "J44": (None, "leer", "Kein Soemmerungsabzug noetig, siehe Zeile 40"),
}

D["SB1"] = {
 "J11": (None, "leer", "Kraftfutter Milchkuehe: entfaellt, der Betrieb haelt kein Rindvieh"),
 "G55": ("Huehnermist", "gruen", "Hofduengerzufuhr in die Gemeinschaft, 90 t gemaess Auftrag"),
 "K55": (90, "gruen", "90 t Huehnermist gemaess Auftrag. Auch die interne Planung des Betriebs rechnet mit 90 t"),
 "M55": (21.0, "gruen", "Nges 21 kg je t. Hergeleitet aus der Planbilanz 2026: 1890 kg Nges bei 90 t. Bitte gegen den HODUFLU-Lieferschein pruefen"),
 "N55": (17.0, "gruen", "P2O5 17 kg je t. Hergeleitet aus der Planbilanz 2026: 1530 kg P2O5 bei 90 t. Bitte gegen den HODUFLU-Lieferschein pruefen"),
 "O55": (None, "leer", "K2O je t Huehnermist: optional. Kalium und Magnesium gehen nicht in die ausgeglichene N/P-Bilanz ein. Falls der HODUFLU-Lieferschein Werte ausweist, koennen sie zur Information eingetragen werden"),
 "P55": (None, "leer", "Mg je t Huehnermist: optional, siehe Hinweis bei O55"),
 "X55": (None, "rot", "Vollmist ja/nein beim zugefuehrten Huehnermist. In der Planbilanz 2026 wurde V2 nicht gesetzt, der Vollmistanteil stammt allein aus dem eigenen Bestand"),
 "G57": ("Schweineguelle", "gruen", "Hofduengerzufuhr in die Gemeinschaft, ca. 60 m3 gemaess Auftrag"),
 "K57": (60, "gruen", "60 m3 Schweineguelle gemaess Auftrag"),
 "M57": (None, "rot", "Nges kg je m3 Schweineguelle. NEUER DUENGER - die Planbilanz 2026 enthielt Rinderguelle (420 kg Nges), nicht Schweineguelle. Gehalt aus dem HODUFLU-Lieferschein uebernehmen"),
 "N57": (None, "rot", "P2O5 kg je m3 Schweineguelle"),
 "O57": (None, "leer", "K2O je m3 Schweineguelle: optional, geht nicht in die N/P-Bilanz ein"),
 "P57": (None, "leer", "Mg je m3 Schweineguelle: optional, geht nicht in die N/P-Bilanz ein"),
 "E77": (975, "gruen", f"Grassilage WEGFUHR, 975 dt Frischsubstanz. Quelle: {Q_SB}. Pruefen ob die Menge 2026 noch stimmt"),
 "G77": (35, "gruen", f"TS-Gehalt Grassilage 35 Prozent. Quelle: {Q_SB}"),
 "I77": (341.25, "gruen", "Wegfuhr 341.25 dt TS = 975 x 35 Prozent. Falls das Programm den Wert selbst aus Menge und TS berechnet, hier nichts eintragen"),
 "E78": (150, "gruen", f"Graswuerfel ZUFUHR, 150 dt Frischsubstanz. Quelle: {Q_SB}"),
 "G78": (88, "gruen", f"TS-Gehalt Graswuerfel 88 Prozent. Quelle: {Q_SB}"),
 "K78": (132.0, "gruen", "Zufuhr 132 dt TS = 150 x 88 Prozent"),
 "E86": (200, "gruen", f"Zuckerruebenschnitzel frisch ZUFUHR, 200 dt Frischsubstanz. Quelle: {Q_SB}"),
 "G86": (30, "gruen", f"TS-Gehalt 30 Prozent. Quelle: {Q_SB}"),
 "K86": (60.0, "gruen", "Zufuhr 60 dt TS = 200 x 30 Prozent"),
 "M96": (5, "gruen", f"Fehlerbereich der Grundfutterbilanz 5.0 Prozent. Quelle: {Q_SB}"),
}

D["SB2"] = {
 "J58": (1.0, "gruen", "Normduengungsfaktor P fuer Kraeuter mehrjaehrig. Planbilanz 2026: 1.0"),
 "K58": (1.0, "gruen", "Normduengungsfaktor K. Planbilanz 2026: 1.0"),
 "L58": (1.0, "gruen", "Normduengungsfaktor Mg. Planbilanz 2026: 1.0"),
 "N58": (70, "gruen", f"Kraeuter mehrjaehrig mittel: N 70 kg je ha. Quelle: {Q_SB}"),
 "O58": (30, "gruen", f"P2O5 30 kg je ha. Quelle: {Q_SB}"),
 "P58": (160, "gruen", f"K2O 160 kg je ha. Quelle: {Q_SB}"),
 "Q58": (15, "gruen", f"Mg 15 kg je ha. Quelle: {Q_SB}"),
 "D73": ("Biorga (Recyclingduenger)", "gruen", f"Zugefuehrter Handelsduenger. Quelle: {Q_SB} und Auftrag"),
 "J73": (40, "gruen", "40 t Biorga gemaess Auftrag"),
 "N73": (None, "rot", "Nverf kg je t Biorga. Die Planbilanz 2026 erfasste nur die Gesamtmenge 5040 kg Nverf ohne Mengenangabe, daraus laesst sich kein Gehalt je Tonne ableiten. Produkt genau bezeichnen und Deklaration verwenden"),
 "O73": (None, "rot", "P2O5 kg je t Biorga. Planbilanz 2026: 0 kg P2O5 insgesamt"),
 "P73": (None, "leer", "K2O je t Biorga: optional, geht nicht in die N/P-Bilanz ein"),
 "Q73": (None, "leer", "Mg je t Biorga: optional, geht nicht in die N/P-Bilanz ein"),
 "D74": ("Brinogia", "gruen", f"Zugefuehrter Handelsduenger. Quelle: {Q_SB} und Auftrag"),
 "J74": (10, "gruen", "10 t Brinogia gemaess Auftrag. EINHEIT PRUEFEN: Zeile 74 rechnet in dt, die Angabe lautet auf Tonnen"),
 "N74": (None, "rot", "Nverf kg je Einheit Brinogia. Die Planbilanz 2026 erfasste nur die Gesamtmenge 283.5 kg Nverf ohne Mengenangabe"),
 "O74": (None, "rot", "P2O5 kg je Einheit Brinogia. Planbilanz 2026: 120 kg P2O5 insgesamt"),
 "P74": (None, "leer", "K2O je Einheit Brinogia: optional, geht nicht in die N/P-Bilanz ein"),
 "Q74": (None, "leer", "Mg je Einheit Brinogia: optional, geht nicht in die N/P-Bilanz ein"),
 "J72": (None, "leer", "Emissionsmindernd beguellte Flaeche: in der Planbilanz 2026 nicht erfasst"),
 "J83": (None, "rot", "Zukauf Weizenstroh zum Einstreuen in dt FS. In der Planbilanz 2026 NICHT enthalten, Zaehner 2023 dagegen mit 485.3 dt (92 kg P2O5, 383 kg K2O). Bei Schafhaltung mit Einstreu bitte pruefen"),
 "I98": (60, "gruen", f"Basis-N-Ausnutzungsgrad 60.0 Prozent. Quelle: {Q_SB}"),
}

D["Gem1"] = {
 "D12": (1400, "gruen", f"Fenchel 14 ha = 1400 Aren. Quelle: Auftrag und {Q_SB}"),
 "D13": (1100, "gruen", f"Salate diverse, mittlerer Ertrag: 11 ha = 1100 Aren. Quelle: Auftrag und {Q_SB}"),
 "D14": (800, "gruen", "Karotten 8 ha = 800 Aren gemaess Auftrag. NEU - in der Planbilanz 2026 nicht enthalten. Sorte ueber die Klickzelle waehlen, die Naehrstoffnormen unterscheiden sich deutlich (Pariser 50, Bund-/Frueh- 100, Verarbeitung/Lager 110 bis 130 kg N je ha)"),
 "D15": (700, "gruen", f"Zwiebeln 7 ha = 700 Aren. Quelle: Auftrag und {Q_SB}"),
 "D16": (1200, "gruen", f"Kuerbis 12 ha = 1200 Aren. Quelle: Auftrag und {Q_SB}"),
 "D17": (None, "rot", "Diverses Kleingemuese: im Auftrag steht Fenchel plus diverses Kleingemuese. Falls dieses zusaetzlich zu den 14 ha Fenchel angebaut wird, Kulturen und Flaechen hier einzeln erfassen"),
}

D["Gem2"] = {
 "D12": (121.86, "gruen", f"Tomaten Bodenkultur, mittlerer Ertrag: 121.86 Aren. {Q_BDI} Code 0801. Planbilanz 2026: 1.21 ha mit 250 kg N je ha - Flaeche stimmt ueberein"),
 "F12": (None, "leer", "Nmin-Korrektur: in der Planbilanz 2026 nicht verwendet, es galt der Normbedarf von 250 kg N je ha"),
 "D13": (58.79, "rot", f"Geschuetzter Anbau ohne festes Fundament, 58.79 Aren. {Q_BDI} Code 0811. KULTUR FEHLT - in der Planbilanz 2026 nicht enthalten"),
}

# ------------------------------------------------------------- Nachbau-Logik
BLAETTER = [("Allg",10), ("Fläche",20), ("Tierb",25), ("SB1",26), ("SB2",25), ("Gem1",16), ("Gem2",16), ("FormE",18)]

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
                ziel.fill = GRUEN if status == "gruen" else ROT if status == "rot" else GELB
                ziel.border = RAHMEN
                ziel.font = Font(bold=(status != "leer"), size=10)
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
r = z(r, "Quellen", "Planbilanz 2026 Nr. 0197-001 (Imhof & Zaehner Betriebsgemeinschaft, Strickhof, gerechnet 10.06.2026) · Kennziffernblatt dazu · Betriebsdatenblaetter 2026 beider Betriebe · TVD-Auswertung Schafe vom 10.06.2026 · Suisse-Bilanz Zaehner 2023 · Angaben aus dem Auftrag.")
r += 1
an.cell(row=r, column=2, value="Farben").font = Font(bold=True, size=11); r += 1
an.cell(row=r, column=2).fill = GRUEN
r = z(r, "gruen", "Wert steht drin und ist belegt. Die Quelle steht in der Spalte Bemerkung und im Blatt Offene Punkte.")
an.cell(row=r, column=2).fill = ROT
r = z(r, "rot", "Muss von dir eingetragen oder bestaetigt werden. Wo trotzdem eine Zahl drinsteht, ist die Zahl belegt, aber die Zeile, die Einheit oder die Zuordnung ist offen.")
an.cell(row=r, column=2).fill = BLAU
r = z(r, "blau", "Summen- und Rechenfeld. Nicht ausfuellen, das Nachweis rechnet es selber.")
an.cell(row=r, column=2).fill = GELB
r = z(r, "hellgelb", "Eingabefeld, das leer bleiben soll. Entweder braucht der Betrieb es nicht, oder es war in der Planbilanz 2026 bewusst leer. Begruendung jeweils im Blatt Offene Punkte.")
r += 1

an.cell(row=r, column=2, value="Vollmist-Typ je Tierkategorie (Blatt SB1, Spalte X)").font = Font(bold=True, size=11); r += 1
r = z(r, "So war es 2026", "Diese Spalte ist eine Klickzelle und laesst sich nicht bevorschriften. Aus der Planbilanz 2026: Pferde Typ 100 · Ponys Typ 100 · Milchschafe Typ 100 · andere Schafe, Jungschafe, Laemmer und Ziegen Typ 0. Daraus ergab sich ein Vollmistanteil von 42.7 Prozent.", fett=True)
r += 1

an.cell(row=r, column=2, value="Vor dem Ausfuellen beachten").font = Font(bold=True, size=11); r += 1
r = z(r, "1  Interne Lieferungen", "Die Planbilanz 2026 ist bereits die gemeinsame Bilanz beider Betriebe. Lieferungen zwischen Imhof und Zaehner sind darin intern und duerfen nicht als Zu- oder Wegfuhr erscheinen. Die Grassilage-Wegfuhr von 975 dt und die Hofduengerzufuhr gehen an Dritte bzw. kommen von Dritten.", fett=True)
r = z(r, "2  Einheiten", "Die Betriebsdatenblaetter fuehren die Flaechen in AREN, das Blatt Flaeche rechnet in HEKTAREN - ich habe umgerechnet. Die Blaetter Gem1 und Gem2 verlangen dagegen AREN.")
r = z(r, "3  Intensive Wiesen", "Bei Naturwiese intensiv (Zeile 19), Weide intensiv (Zeile 20) und Kunstwiese intensiv (Zeile 22) ist das Ertragsfeld im Nachweis gesperrt. Das Programm rechnet diese Ertraege als Restgroesse aus der Grundfutterbilanz. Nur die Flaeche eintragen.")
r = z(r, "4  Keine Soemmerungs-abzuege noetig", "Die TVD-Auswertung weist die Soemmerung getrennt als Normalstoesse aus. Die Spalte Plaetze enthaelt nur die Tage auf dem Ganzjahresbetrieb. Deshalb fuehrt auch die Planbilanz 2026 keinen Abzug - die Spalten Abzug/Zuschlag bleiben leer.")
r = z(r, "5  Gemuese: 52 gegen 41.66 ha", "Die geplanten Kulturen ergeben 52 ha (Fenchel 14, Salat 11, Karotten 8, Zwiebeln 7, Kuerbis 12). Die Strukturdatenerhebung weist 41.66 ha Freilandgemuese aus. Die Planbilanz 2026 kam mit 44 ha Kulturen aus, neu sind 8 ha Karotten. Die Differenz von rund 10 ha muss geklaert werden: Folgekulturen auf derselben Flaeche oder Anpassung der Flaechendeklaration.", fett=True)
r = z(r, "6  Kartoffeln", "Die Planbilanz 2026 fuehrte 6.18 ha Pflanzkartoffeln (b) und 8.00 ha Speisekartoffeln (c). Die Strukturdatenerhebung 2026 weist nur noch 6.1825 ha Kartoffeln aus - das entspricht genau den Pflanzkartoffeln. Die 8 ha Speisekartoffeln sind eingetragen als nicht mehr vorhanden.")
r = z(r, "7  Hochstammbaeume", "Die Planbilanz 2026 enthielt keine Hochstammbaeume, obwohl beide Betriebe welche haben (255 Stueck). Zaehner 2023 rechnete 192 Baeume mit 45/15/56/8 kg je ha. Neu aufgenommen - bitte bestaetigen.")
r = z(r, "8  Code 99999", "Das Betriebsdatenblatt Imhof fuehrt 37.02 Aren unter Bitte Kultur waehlen. Diese Flaeche ist in der Sammelzeile Nicht aufgefuehrte Ackerkultur enthalten. In der Strukturdatenerhebung noch richtig deklarieren.")
r += 1

an.cell(row=r, column=2, value="Zur Frage: Warum 1500 statt 450?").font = Font(bold=True, size=11); r += 1
r = z(r, "Antwort", "Der Unterschied kommt nicht von den Tierzahlen, sondern von den Referenzwerten der verwendeten Tierkategorie.")
r = z(r, "", "Die Bilanz 2023 rechnete mit der Kategorie Milchschafplatz und 17.85 kg Nges je Platz und Jahr, bei einem Grundfutterverzehr von 11.0 dt TS. Diese Werte gehoeren zu einem deutlich hoeheren Milchniveau als 450 kg.")
r = z(r, "", "Nach der Wegleitung hat ein Milchschaf bei der Standardleistung von 500 kg einen Anfall von 13.66 kg Nges je Platz. Je 25 kg weniger Milch sinkt der Wert um 0.50 kg. Bei 450 kg sind das zwei Schritte: 13.66 minus 1.00 gleich 12.66 kg Nges je Platz.")
r = z(r, "", "Pro Tier also 12.66 statt 17.85 kg Nges, rund 29 Prozent weniger. Genau mit 12.66 rechnet auch die Planbilanz 2026. Dass 2023 bei tieferen Tierzahlen mehr Stickstoff herauskam, liegt an diesen hoeheren Werten je Platz.", fett=True)
r = z(r, "Zu pruefen", "Die Bilanz 2023 wurde mit Wegleitung 1.16 gerechnet, deren Referenzwerte liegen mir nicht vor. Belegen kann ich den Vergleich zur Fassung 1.19, mit der die Planbilanz 2026 gerechnet wurde.")
r += 1
r = z(r, "Abgrenzung", "Diese Ausfuellhilfe ersetzt weder die Referenzmethode noch eine amtliche Pruefung. Massgebend sind die Wegleitung Suisse-Bilanz und die geltende Gesetzgebung.")

# --------------------------------------------------- Blatt "Offene Punkte"
op = neu.create_sheet("Offene Punkte", 1)
for i, (b, w) in enumerate([("Blatt",12),("Zelle",8),("Status",9),("Zeile im Nachweis",44),("Was zu tun ist / Quelle",104)], start=1):
    zc = op.cell(row=1, column=i, value=b)
    zc.font = Font(bold=True, color="FFFFFF"); zc.fill = PatternFill("solid", fgColor="4A6E4A")
    op.column_dimensions[get_column_letter(i)].width = w
zeile = 2
for status in ("rot","gruen","leer"):
    for (blatt, ref, st, bez, bem) in bemerkungen:
        if st != status: continue
        op.cell(row=zeile, column=1, value=blatt)
        op.cell(row=zeile, column=2, value=ref)
        zc = op.cell(row=zeile, column=3,
                     value="offen" if st=="rot" else "belegt" if st=="gruen" else "leer lassen")
        zc.fill = ROT if st=="rot" else GRUEN if st=="gruen" else GELB
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
