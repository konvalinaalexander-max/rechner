"""
Rechner für die AGRIDEA-Nachweis-Mappe (Suisse-Bilanz).

Warum es diesen Rechner braucht
-------------------------------
Die Mappe lässt sich nicht einfach "lesen": was in den Zellen steht, ist der
Stand der letzten Excel-Berechnung. Wer wissen will, was nach einer Änderung
herauskommt, muss die Mappe rechnen. Und zwei Blöcke - die Tierliste auf SB1
und Formular C2 auf SB2 - enthalten überhaupt keine Formeln, sondern das, was
VBA beim Knopfdruck hineinschreibt.

Dieser Rechner macht beides:

* Er wertet die echten Formeln der Mappe aus (pycel). Die Probe: er muss die
  gespeicherten Werte der unveränderten Mappe treffen.
* Er bildet Sub D_Fläche_nach_Nb2 aus Modul M_Uebertragen_NW nach - die
  Übertragung der Ackerkulturen von D_Fläche nach SB2. Nur so lässt sich
  vorhersagen, was nach dem Knopfdruck dasteht.

Eingaben werden in eine Kopie der Mappe geschrieben und danach vollständig
neu gerechnet. Damit kann kein Zwischenstand veralten.

Kennwerte werden über ihre Beschriftung gesucht, nicht über feste Zellen:
das Makro fügt Zeilen ein und entfernt sie, die Mappe verschiebt sich.
"""
import re
import openpyxl
from pycel import ExcelCompiler
from xlsmpatch import Mappe

# Spalten der Übertragung D_Fläche -> SB2 (aus dem VBA-Quelltext)
UEBERTRAG = [
    ("C", "B"),   # Ackerkultur
    ("D", "C"),   # Zusatz (Gruppe a/b/c)
    ("I", "P"),   # Fläche  <- FlächeMinusAckerSF
    ("H", "D"),   # Standardertrag
    ("J", "M"),   # Feldertrag
    ("L", "L"),   # N-Bedarf Darstellung
    ("M", "K"),   # N-Bedarf
    ("O", "H"),   # P2O5
    ("P", "I"),   # K2O
    ("Q", "J"),   # Mg
]


def _zeilen(bereich):
    out = []
    for teil in bereich.split(","):
        teil = teil.split("!")[-1].replace("$", "")
        if ":" in teil:
            a, b = teil.split(":")
            out.extend(range(int(re.search(r"\d+", a).group()),
                             int(re.search(r"\d+", b).group()) + 1))
        else:
            out.append(int(re.search(r"\d+", teil).group()))
    return out


# Kennwert, Blatt, Text in der Beschriftungsspalte, Spalte des Werts, Sollwert
KENNWERTE = [
    ("Grundfutterverzehr GFverz", "SB1", "Grundfutterverzehr, Nährstoffanfall", "K", 3142),
    ("A1 Nges Tierhaltung",       "SB1", "Grundfutterverzehr, Nährstoffanfall", "R", 4609),
    ("A2 Nges nach Abzügen",      "SB1", "A2: Nährstoffe aus der Tierhaltung",  "R", 3778),
    ("A2 P2O5",                   "SB1", "A2: Nährstoffe aus der Tierhaltung",  "S", 2122),
    ("V1 Vollmist Betrieb",       "SB1", "Grundfutterverzehr, Nährstoffanfall", "Y", 2953),
    ("A3 Hofdünger Nges",         "SB1", "A3: Zu- und Wegfuhren von Hofdüngern", "R", 2310),
    ("A3 Hofdünger P2O5",         "SB1", "A3: Zu- und Wegfuhren von Hofdüngern", "S", 1698),
    ("GFprod Futterfläche",       "SB1", "zu produzierendes Grundfutter",       "O", 3620),
    ("Ertrag intensive Wiesen",   "SB2", "Intensive Wiesen und Weiden",         "J", 90),
    ("C1 Grundfutter N",          "SB2", "C1: Zwischentotal Futterflächen",     "R", 2907),
    ("C1 Grundfutter P2O5",       "SB2", "C1: Zwischentotal Futterflächen",     "S", 2290),
    ("C2 Ackerkulturen N",        "SB2", "C2: Zwischentotal",                   "R", 3337),
    ("C2 Ackerkulturen P2O5",     "SB2", "C2: Zwischentotal",                   "S", 1408),
    ("C3 Spezialkulturen N",      "SB2", "C3: Zwischentotal Spezialkulturen",   "R", 6060),
    ("C3 Spezialkulturen P2O5",   "SB2", "C3: Zwischentotal Spezialkulturen",   "S", 1443),
    ("C Bedarf total N",          "SB2", "C = C1 + C2 + C3",                    "R", 12304),
    ("C Bedarf total P2O5",       "SB2", "C = C1 + C2 + C3",                    "S", 5142),
    ("Fläche C (muss = LN)",      "SB2", "C = C1 + C2 + C3",                    "I", 137.05),
    ("Offene Ackerfläche %",      "SB2", "Offene Ackerfläche x 0.15",           "D", 54.6),
    ("Anteil Vollmist %",         "SB2", "Anteil Nges-Vollmist x 0.12",         "D", 42.7),
    ("N-Ausnutzungsgrad %",       "SB2", "Total betriebsspezifischer Ausnutz",  "I", 46.7),
    ("D übrige Dünger Nverf",     "SB2", "D: Gesamttotal Zufuhr übriger",       "R", 5324),
    ("Transfer T P2O5",           "SB2", "[ - ] Nährstofftransfer",              "J", 140),
    ("GESAMTBILANZ Nverf",        "SB2", "Gesamtbilanz: alle Nährstoffe",       "H", -4137),
    ("GESAMTBILANZ P2O5",         "SB2", "Gesamtbilanz: alle Nährstoffe",       "J", -1341),
]


class Nachweis:
    def __init__(self, pfad, etiketten=None):
        """etiketten: Mappe, aus der die Beschriftungen gelesen werden.

        Nötig, sobald in `pfad` die zwischengespeicherten Formelergebnisse
        verworfen wurden - dann stehen dort auch die Beschriftungen nicht
        mehr, denn sie sind selbst Formeln (=Texte!A858).
        """
        self.pfad = pfad
        self.exc = ExcelCompiler(pfad)
        self.wbf = openpyxl.load_workbook(pfad, data_only=False)
        self.wbv = openpyxl.load_workbook(etiketten or pfad, data_only=True)
        self.quellzeilen = _zeilen(self.wbf["D_Fläche"].defined_names["Ackerkultur"].value)
        self.zielzeilen = _zeilen(self.wbf["SB2"].defined_names["Ackerkultur"].value)

    # ---------- Werte ----------
    def wert(self, zelle):
        return self.exc.evaluate(zelle)

    def zeile_suchen(self, blatt, text, spalten=(2, 3, 6)):
        """Zeilennummer, in der eine der Beschriftungsspalten mit `text` beginnt."""
        ws = self.wbv[blatt]
        for r in range(1, ws.max_row + 1):
            for c in spalten:
                v = ws.cell(r, c).value
                if isinstance(v, str) and text in v:
                    return r
        raise KeyError(f"{blatt}: Beschriftung {text!r} nicht gefunden")

    # ---------- Makro-Nachbildung ----------
    def c2_zeilen(self):
        """Was der Knopf «Nährstoffbedarf ausfüllen» nach SB2 überträgt."""
        raus = []
        for qz in self.quellzeilen:
            fl = self.wert(f"D_Fläche!N{qz}")
            er = self.wert(f"D_Fläche!M{qz}")
            if not isinstance(fl, (int, float)) or fl <= 0:
                continue
            if not isinstance(er, (int, float)) or er <= 0:
                continue
            z = {zs: self.wert(f"D_Fläche!{qs}{qz}") for zs, qs in UEBERTRAG}
            z["_quelle"] = qz
            raus.append(z)
        return raus

    # ---------- Bericht ----------
    def bericht(self, toleranz=1.0):
        zeilen, abw = [], 0
        for name, blatt, text, sp, soll in KENNWERTE:
            try:
                r = self.zeile_suchen(blatt, text)
                zelle = f"{blatt}!{sp}{r}"
                ist = self.wert(zelle)
            except Exception as e:
                zeilen.append((name, "?", soll, f"FEHLER {e}", None, False))
                abw += 1
                continue
            try:
                d = float(ist) - soll
            except (TypeError, ValueError):
                d = None
            ok = d is not None and abs(d) <= toleranz
            abw += 0 if ok else 1
            zeilen.append((name, zelle, soll, ist, d, ok))
        return zeilen, abw

    @staticmethod
    def drucke(zeilen):
        print(f"{'':3}{'Kennwert':26} {'Zelle':11} {'Strickhof':>10} {'gerechnet':>12} {'Diff':>9}")
        print("-" * 76)
        for name, zelle, soll, ist, d, ok in zeilen:
            i = f"{ist:12.2f}" if isinstance(ist, (int, float)) else f"{str(ist):>12.12}"
            dd = f"{d:9.2f}" if d is not None else "        -"
            print(f"{'OK ' if ok else 'XX '}{name:26.26} {zelle:11} {soll:10} {i} {dd}")


def anwenden(quelle, aenderungen, ziel):
    """Eingaben in eine Kopie schreiben. aenderungen: [(Blatt, Zelle, Wert)]"""
    m = Mappe(quelle)
    for blatt, zelle, wert in aenderungen:
        if wert is None:
            m.leeren(blatt, zelle)
        elif isinstance(wert, str):
            m.text(blatt, zelle, wert)
        else:
            m.zahl(blatt, zelle, wert)
    m.speichern(ziel)
    return m.protokoll


def knopf_c2(quelle, ziel):
    """Führt die Makro-Übertragung D_Fläche -> SB2 aus und schreibt sie in die Mappe."""
    n = Nachweis(quelle)
    neu = n.c2_zeilen()
    frei = n.zielzeilen[1:-1]        # erste/letzte Zeile des Bereichs sind Vorlage und Anker
    if len(neu) > len(frei):
        raise RuntimeError(
            f"{len(neu)} Ackerkulturen, aber nur {len(frei)} Zeilen im Bereich "
            f"{n.zielzeilen[0]}-{n.zielzeilen[-1]}. Das Makro fügt hier Zeilen ein; "
            "diese Übertragung muss in Excel selbst ausgelöst werden.")
    aend = []
    for i, zz in enumerate(frei):
        for zs, _ in UEBERTRAG:
            aend.append(("SB2", f"{zs}{zz}", neu[i][zs] if i < len(neu) else None))
    anwenden(quelle, aend, ziel)
    return neu


# ============================================================================
# Sub D_Tierb_nach_Nb1  (Modul M_Uebertragen_NW)
# Knopf «Tabelle "Tierart" ausfüllen, aktualisieren» auf SB1.
# Zwei Durchgänge: Weidevieh und Nichtweidetiere. Übernommen wird eine Zeile,
# wenn auf D_Tierb die korrigierte Anzahl grösser als null ist.
# ============================================================================
TIER_WEIDE = [          # Ziel SB1 <- Quelle D_Tierb
    ("B", "B"),   # Tierart
    ("G", "G"),   # Anzahl unkorrigiert
    ("E", "D"),   # Milchmenge
    ("F", "F"),   # Einheit
    ("I", "H"),   # Anzahl korrigiert
    ("J", "J"),   # Grundfutterverzehr je Jahr
    ("L", "Q"),   # N-Umsatz
    ("M", "R"),   # Nges
    ("N", "S"),   # P2O5
    ("O", "T"),   # K2O
    ("P", "U"),   # Mg
    ("W", "AB"),  # Weidejahre
    ("V", "X"),   # Laufhofjahre
    ("H", "AD"),  # Ab- und Zuschlag
]
TIER_STALL = [(z, q) for z, q in TIER_WEIDE if z != "W"]   # Nichtweidetiere: keine Weide


class Tiere:
    """Nachbildung der Tierübertragung D_Tierb -> SB1."""

    def __init__(self, nachweis):
        self.n = nachweis
        wf = nachweis.wbf
        self.q_weide = _zeilen(wf["D_Tierb"].defined_names["WeideVieh"].value)
        self.q_stall = _zeilen(wf["D_Tierb"].defined_names["NichtWeideTiere"].value)
        self.z_weide = _zeilen(wf["SB1"].defined_names["WeideVieh"].value)
        self.z_stall = _zeilen(wf["SB1"].defined_names["NichtWeideTiere"].value)

    def _sammeln(self, quellzeilen, spalten):
        raus = []
        for qz in quellzeilen:
            anz = self.n.wert(f"D_Tierb!H{qz}")
            if not isinstance(anz, (int, float)) or isinstance(anz, bool) or anz <= 0:
                continue
            z = {}
            for zs, qs in spalten:
                try:
                    z[zs] = self.n.wert(f"D_Tierb!{qs}{qz}")
                except Exception as e:              # Kreisbezüge auf D_Tierb
                    z[zs] = f"<{type(e).__name__}>"
            z["_quelle"] = qz
            raus.append(z)
        return raus

    def zeilen(self):
        """[(Zielzeile in SB1, Werte je Spalte)] wie nach dem Knopfdruck."""
        raus = []
        for herkunft, quellen, ziele, spalten in (
                ("Weidevieh", self.q_weide, self.z_weide, TIER_WEIDE),
                ("Nichtweidetiere", self.q_stall, self.z_stall, TIER_STALL)):
            treffer = self._sammeln(quellen, spalten)
            if len(treffer) > len(ziele):
                raise RuntimeError(f"{herkunft}: {len(treffer)} Kategorien, "
                                   f"nur {len(ziele)} Zeilen auf SB1")
            for i, zz in enumerate(ziele):
                raus.append((zz, treffer[i] if i < len(treffer) else None, herkunft))
        return raus

    def vergleich(self):
        """Zelle für Zelle gegen das, was tatsächlich auf SB1 steht."""
        ist_wb = self.n.wbv["SB1"]
        befund = []
        for zz, soll, herkunft in self.zeilen():
            spalten = TIER_WEIDE if herkunft == "Weidevieh" else TIER_STALL
            for zs, _ in spalten:
                ist = ist_wb[f"{zs}{zz}"].value
                erw = soll[zs] if soll else None
                leer_ist = ist in (None, "", " ")
                leer_erw = erw in (None, "", " ")
                if leer_ist and leer_erw:
                    gleich = True
                elif isinstance(ist, (int, float)) and isinstance(erw, (int, float)):
                    gleich = abs(float(ist) - float(erw)) < 1e-9
                else:
                    gleich = str(ist).strip() == str(erw).strip()
                befund.append((f"SB1!{zs}{zz}", erw, ist, gleich))
        return befund


VOLLMIST_FAKTOR = {"Typ 0": 0, "Typ 50": 0.5, "Typ 100": 1, "Typ 50/100": 1, None: None}


def knopf_tiere(quelle, ziel, etiketten=None, vollmist=None):
    """Führt die Tierübertragung D_Tierb -> SB1 aus und schreibt sie in die Mappe.

    vollmist: {Zielzeile: "Typ 100"} - der Vollmist-Typ gehört nicht zur
    Übertragung. Das Makro rettet ihn über AlteEinträgeRetten und setzt ihn
    für neue Kategorien nicht. Er muss deshalb mitgegeben werden.

    Achtung: Spalte X ist nur die Beschriftung. Gerechnet wird mit dem Faktor
    in Spalte Z:  Y17 = IF(Z17=0, 0, (R17-V17-W17)*Z17).  Der Doppelklick in
    Excel setzt beide Spalten; wer nur X schreibt, ändert nichts an der Bilanz.

    Werte, die der Rechner wegen Kreisbezügen auf D_Tierb nicht ermitteln kann
    (Milchschaf und Milchziege: die leistungsabhängigen Gehalte kommen über
    D_Klick zurück), werden aus der Quellmappe übernommen, sofern dort in
    derselben Zeile dieselbe Tierart steht.
    """
    from xlsmpatch import Mappe
    n = Nachweis(quelle, etiketten=etiketten or quelle)
    t = Tiere(n)
    aend, uebernommen = [], []
    for zz, soll, herkunft in t.zeilen():
        spalten = TIER_WEIDE if herkunft == "Weidevieh" else TIER_STALL
        for zs, _ in spalten:
            wert = soll[zs] if soll else None
            if isinstance(wert, str) and wert.startswith("<") and wert.endswith(">"):
                alt_art = n.wbv["SB1"][f"B{zz}"].value
                neu_art = soll.get("B")
                if alt_art is not None and str(alt_art) == str(neu_art):
                    wert = n.wbv["SB1"][f"{zs}{zz}"].value
                    uebernommen.append(f"SB1!{zs}{zz}")
                else:
                    raise RuntimeError(
                        f"SB1!{zs}{zz}: Wert nicht berechenbar und nicht übernehmbar "
                        f"(Zeile enthielt {alt_art!r}, neu {neu_art!r})")
            aend.append(("SB1", f"{zs}{zz}", wert))
        if vollmist is not None:
            typ = vollmist.get(zz) if soll else None
            aend.append(("SB1", f"X{zz}", typ))
            aend.append(("SB1", f"Z{zz}", VOLLMIST_FAKTOR.get(typ)))
    m = Mappe(quelle)
    for blatt, zelle, wert in aend:
        if wert is None:
            m.leeren(blatt, zelle)
        elif isinstance(wert, str):
            m.text(blatt, zelle, wert)
        else:
            m.zahl(blatt, zelle, wert)
    m.speichern(ziel)
    return t.zeilen(), uebernommen
