"""Innere Stimmigkeit der Strickhof-Planbilanz prüfen."""

def pruefen(w):
    p = []
    def t(name, links, rechts, formel):
        p.append((name, formel, links, rechts, round(links - rechts, 3)))
    t("A1 + A3",            w["A1"] + w["A3_N"],            w["A1A3"],   "4609 + 2310")
    t("Anteil Vollmist %",  round(w["V1V2"] / w["A1A3"] * 100, 1), w["Vollmist"], "V1+V2 / (A1+A3)")
    t("Ausnutzungsgrad %",  round(60 - 0.15 * w["OA"] - 0.12 * w["Vollmist"], 1), w["Ausn"],
      "60 - 0.15*OA - 0.12*Vollmist")
    t("A2 Nges",            w["A1"] - w["AbzugArm_N"] - w["AbzugWeide"], w["A2_N"], "A1 - 823 - 9")
    t("A2 P2O5",            w["A1_P"] - w["AbzugArm_P"],    w["A2_P"],   "A1_P - 137")
    t("C Nges",             w["C1_N"] + w["C2_N"] + w["C3_N"], w["C_N"], "C1 + C2 + C3")
    t("C P2O5",             w["C1_P"] + w["C2_P"] + w["C3_P"], w["C_P"], "C1 + C2 + C3")
    t("Fläche C",           round(w["F1"] + w["F2"] + w["F3"], 2), w["F_C"], "58.27 + 32.91 + 45.87")
    t("GFprod",             w["NettoGF"] + w["Lager"] + w["Fehler"], w["GFprod"], "3291 + 165 + 165")
    t("A2 Nverf",           round(w["A2_N"] * w["Ausn"] / 100), w["A2_Nverf"], "A2 * Ausnutzungsgrad")
    t("A3 Nverf",           round(w["A3_N"] * w["Ausn"] / 100), w["A3_Nverf"], "A3 * Ausnutzungsgrad")
    t("Bilanz Nverf",       w["A2_Nverf"] - w["C_N"] + w["A3_Nverf"] + w["D_N"], w["Bil_N"],
      "A2 - C + A3 + D + E - T")
    t("Bilanz P2O5",        w["A2_P"] - w["C_P"] + w["A3_P"] + w["D_P"] - w["T"], w["Bil_P"],
      "A2 - C + A3 + D + E - T")
    t("T",                  round(w["GFT"] * 0.4), w["T"], "350 dt TS * 0.4")
    return p
