"""
Wie genau kann ein Vergleich mit dem Strickhof-PDF überhaupt sein?

Das PDF zeigt Kilogramm ohne Nachkommastellen und den Ausnutzungsgrad auf
ein Zehntelprozent. Jede gedruckte Zahl trägt damit eine Unschärfe. Hier wird
ausgerechnet, wie breit das Band ist, in dem eine richtige Rechnung liegen darf.
"""


def band(A2_N, A3_N, C_N, D_N, T_P, A2_P, A3_P, C_P, D_P, ausn_proz):
    z = {}
    # Anzeige-Unschärfe: jede gedruckte ganze Zahl ± 0.5
    z["Anzeige N"] = 0.5 * 4          # A2verf, C, A3verf, D
    z["Anzeige P2O5"] = 0.5 * 5       # A2, C, A3, D, T
    # Ausnutzungsgrad auf 0.1 % gerundet -> ± 0.05 % auf (A2 + A3)
    z["Ausnutzungsgrad N"] = (A2_N + A3_N) * 0.0005
    # Der Ausnutzungsgrad selbst entsteht aus zwei auf 0.1 % gerundeten Anteilen
    z["OA-Anteil N"] = (A2_N + A3_N) * 0.15 * 0.0005 / 100 * 100
    z["Vollmist-Anteil N"] = (A2_N + A3_N) * 0.12 * 0.0005 / 100 * 100
    z["Summe N"] = z["Anzeige N"] + z["Ausnutzungsgrad N"]
    z["Summe P2O5"] = z["Anzeige P2O5"]
    return z
