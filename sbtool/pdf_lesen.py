"""
Zweite, unabhängige Lesung der Strickhof-Planbilanz.

Die erste Lesung war eine Layout-Textausgabe, die ich von Auge abgeschrieben
habe. Hier werden stattdessen die Wörter mit ihren Koordinaten geholt und die
Zahlen zeilenweise eingesammelt - eine andere Methode, damit ein Lesefehler
der ersten Lesung auffällt.
"""
import re
import pdfplumber

ZAHL = re.compile(r"^-?[\d'’]+(?:[.,]\d+)?%?$")


def zeilen(pfad, seite=None, toleranz=2.5):
    with pdfplumber.open(pfad) as pdf:
        seiten = pdf.pages if seite is None else [pdf.pages[seite - 1]]
        for nr, p in enumerate(seiten, (seite or 1)):
            woerter = p.extract_words(use_text_flow=False, keep_blank_chars=False)
            gruppen = {}
            for w in woerter:
                schl = round(w["top"] / toleranz)
                gruppen.setdefault(schl, []).append(w)
            for schl in sorted(gruppen):
                ws = sorted(gruppen[schl], key=lambda w: w["x0"])
                text = " ".join(w["text"] for w in ws)
                zahlen = []
                for w in ws:
                    t = w["text"].replace("'", "").replace("’", "")
                    if ZAHL.match(w["text"]):
                        try:
                            zahlen.append(float(t.rstrip("%").replace(",", ".")))
                        except ValueError:
                            pass
                yield nr, text, zahlen


def finde(pfad, muster, seite=None):
    """Alle Zeilen, deren Text das Muster enthält, mit ihren Zahlen."""
    raus = []
    for nr, text, zahlen in zeilen(pfad, seite):
        if re.search(muster, text, re.IGNORECASE):
            raus.append((nr, text, zahlen))
    return raus
