"""
Störungstest: jede Eingabezelle einzeln verändern und sehen, ob sich die
Gesamtbilanz bewegt. Zellen ohne Wirkung sind unverdächtig. Zellen mit
Wirkung müssen stimmen - dort lohnt das Nachprüfen.
"""
import os, time
from xlsmpatch import Mappe
from sbrechner import Nachweis, UEBERTRAG
from pruef import BILANZBLAETTER

ZIEL_N = "SB2!H120"
ZIEL_P = "SB2!J120"


def _bauen(quelle, aenderungen, ziel):
    m = Mappe(quelle)
    for blatt, zelle, wert in aenderungen:
        if wert is None:
            m.leeren(blatt, zelle)
        elif isinstance(wert, str):
            m.text(blatt, zelle, wert)
        else:
            m.zahl(blatt, zelle, wert)
    m.formelwerte_verwerfen(BILANZBLAETTER)
    m.speichern(ziel)


def bilanz(quelle, aenderungen, etiketten, arbeit="_st.xlsm", mit_makro=True):
    """Bilanz nach den Änderungen - mit nachgebildetem Knopfdruck."""
    _bauen(quelle, aenderungen, arbeit)
    n = Nachweis(arbeit, etiketten=etiketten)
    if mit_makro:
        c2 = n.c2_zeilen()
        frei = n.zielzeilen[1:-1]
        if len(c2) > len(frei):
            return None, None, f"Zeilenzahl aendert sich ({len(c2)})"
        aend, anders = [], False
        for i, zz in enumerate(frei):
            for zs, _ in UEBERTRAG:
                neu = c2[i][zs] if i < len(c2) else None
                alt = n.wert(f"SB2!{zs}{zz}")
                if isinstance(neu, (int, float)) and isinstance(alt, (int, float)):
                    if abs(float(neu) - float(alt)) > 1e-9:
                        anders = True
                elif str(neu or "").strip() != str(alt or "").strip():
                    anders = True
                aend.append(("SB2", f"{zs}{zz}", neu))
        if anders:                      # zweiter Bau nur, wenn das Makro etwas ändert
            _bauen(arbeit, aend, "_st2.xlsm")
            n = Nachweis("_st2.xlsm", etiketten=etiketten)
    return n.wert(ZIEL_N), n.wert(ZIEL_P), None


def testreihe(quelle, kandidaten, etiketten, delta=1.0, laut=True):
    """kandidaten: [(Blatt, Zelle, jetziger Wert)]"""
    basis_n, basis_p, _ = bilanz(quelle, [], etiketten)
    if laut:
        print(f"Ausgangslage: N {basis_n:.2f}  P2O5 {basis_p:.2f}")
    raus = []
    t0 = time.time()
    for i, (blatt, zelle, alt) in enumerate(kandidaten):
        if isinstance(alt, (int, float)) and not isinstance(alt, bool):
            neu = float(alt) + delta
        elif alt in (None, ""):
            neu = delta
        else:
            continue                       # Text lassen wir in Ruhe
        try:
            n, p, hinweis = bilanz(quelle, [(blatt, zelle, neu)], etiketten)
        except Exception as e:
            raus.append((blatt, zelle, alt, None, None, f"{type(e).__name__}"))
            continue
        if n is None:
            raus.append((blatt, zelle, alt, None, None, hinweis))
            continue
        raus.append((blatt, zelle, alt, n - basis_n, p - basis_p, None))
        if laut and i and i % 10 == 0:
            print(f"    ... {i}/{len(kandidaten)}  ({time.time()-t0:.0f}s)")
    return basis_n, basis_p, raus
