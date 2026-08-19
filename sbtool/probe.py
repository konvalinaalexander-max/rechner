"""
Durchrechnen von Änderungen an der Nachweis-Mappe.

  aus = probiere("nachweis.xlsm", [("D_Fläche", "N35", 8)])

Ablauf, damit nichts veraltet:
 1. Änderungen in eine Kopie schreiben
 2. alle zwischengespeicherten Formelergebnisse verwerfen
 3. rechnen und die Makro-Übertragung D_Fläche -> SB2 nachbilden
 4. deren Ergebnis in die Mappe schreiben, wieder alles verwerfen, neu rechnen
"""
import os
from xlsmpatch import Mappe
from sbrechner import Nachweis, UEBERTRAG

BLAETTER = ["Fläche", "D_Fläche", "Tierb", "D_Tierb", "SB1", "SB2", "Gem1", "Gem2",
            "OB", "Allg", "FormE", "Kennz", "Ff", "Hd", "D_Gemüse1", "D_Gemüse2",
            "D_ObstBeeren", "D_Klick", "Texte", "Q", "BioKennz", "Fzukauf"]


def _schreiben(quelle, aenderungen, ziel, frisch=True):
    m = Mappe(quelle)
    for blatt, zelle, wert in aenderungen:
        if wert is None:
            m.leeren(blatt, zelle)
        elif isinstance(wert, str):
            m.text(blatt, zelle, wert)
        else:
            m.zahl(blatt, zelle, wert)
    if frisch:
        m.formelwerte_verwerfen(BLAETTER)
    m.speichern(ziel)
    return m.protokoll


def probiere(quelle, aenderungen, arbeitsordner=".", behalten=None, still=False):
    z1 = os.path.join(arbeitsordner, "_probe1.xlsm")
    _schreiben(quelle, aenderungen, z1)

    n1 = Nachweis(z1, etiketten=quelle)
    c2 = n1.c2_zeilen()
    frei = n1.zielzeilen[1:-1]
    if len(c2) > len(frei):
        raise RuntimeError(
            f"{len(c2)} Ackerkulturen, aber nur {len(frei)} Zeilen im Bereich. "
            "Das Makro würde Zeilen einfügen; das lässt sich hier nicht nachbilden.")

    aend2 = []
    for i, zz in enumerate(frei):
        for zs, _ in UEBERTRAG:
            aend2.append(("SB2", f"{zs}{zz}", c2[i][zs] if i < len(c2) else None))
    z2 = behalten or os.path.join(arbeitsordner, "_probe2.xlsm")
    _schreiben(z1, aend2, z2)

    n2 = Nachweis(z2, etiketten=quelle)
    zeilen, abw = n2.bericht()
    if not still:
        print("Ackerkulturen nach dem Knopfdruck:")
        for z in c2:
            print("   D_Fläche %-3d  %-36.36s %-9.9s Fläche %-8s N/ha %s"
                  % (z["_quelle"], str(z["C"]), str(z["D"] or ""), z["I"], z["M"]))
        print()
        n2.drucke(zeilen)
        print(f"\nAbweichungen über 1 kg: {abw}")
    return n2, zeilen, abw, c2
