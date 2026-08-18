/* =============================================================================
   Nährstoffbilanz – Referenzdaten
   Quelle: Wegleitung Suisse-Bilanz, Version 1.20 (Dezember 2025, gültig 2026/2027)
           Tab. 1 (Tiere), Tab. 2a–2e (Korrekturen), Tab. 3 (Wiesen/Weiden),
           Tab. 4 (Ackerkulturen), Tab. 5 (Gemüse), Tab. 6 (Dauerkulturen)
   Version 1.19 wird nur über gezielte Abweichungen (V119) abgebildet – zum
   Gegenrechnen bestehender Bilanzen.

   WICHTIG: Diese Datei enthält ausschliesslich Zahlenwerte der Referenzmethode,
   keine Texte oder Layouts aus AGRIDEA-Publikationen.
   ============================================================================= */
(function (root) {
  "use strict";

  /* ---------------------------------------------------------------------------
     TAB. 1 – Grundfutterverzehr und Nährstoffanfall der Tierkategorien
     gf      = Grundfutterverzehr dt TS/Jahr
     n       = Stickstoff brutto kg/Jahr (Information)
     nges    = massgeblicher Gesamtstickstoff kg/Jahr
     ngesLSR = Nges bei Laufstallhaltung Rindvieh (20 % Verluste); nur wo abweichend
     p,k,mg  = P2O5, K2O, Mg kg/Jahr
     einheit = "St" Stück | "Pl" Platz | "100Pl" | "100St" | "Einh"
     raufutter = Raufutterverzehrer (relevant für Weideabzug)
     korr    = Korrekturschema nach Tab. 2a/2d/2e
     --------------------------------------------------------------------------- */
  var TIERE = [
    // ---- Rindvieh ----
    { id: "milchkuh", label: "Milchkuh (Ø 7'500 kg Jahresmilch)", gruppe: "Rindvieh", einheit: "St", gf: 56, n: 112, nges: 95.20, ngesLSR: 89.60, p: 39, k: 172, mg: 14, raufutter: true, korr: { typ: "milchkuh" } },
    { id: "ausmastkuh", label: "Ausmastkuh", gruppe: "Rindvieh", einheit: "Pl", gf: 53.2, n: 93.5, nges: 79.48, ngesLSR: 74.80, p: 30, k: 155, mg: 10.8, raufutter: true, spezial: true },
    { id: "galtkuh", label: "Galtkuh", gruppe: "Rindvieh", einheit: "Pl", gf: 40.6, n: 80.5, nges: 68.43, ngesLSR: 64.40, p: 28.7, k: 128.8, mg: 8.4, raufutter: true, spezial: true },
    { id: "mutterkuh_s", label: "Mutterkuh schwer (> 700 kg LG, ohne Kalb)", gruppe: "Rindvieh", einheit: "St", gf: 50, n: 95, nges: 76.00, p: 31, k: 158, mg: 10, raufutter: true },
    { id: "mutterkuh_m", label: "Mutterkuh mittel (600–700 kg LG, ohne Kalb)", gruppe: "Rindvieh", einheit: "St", gf: 45, n: 85, nges: 68.00, p: 28, k: 141, mg: 9, raufutter: true },
    { id: "mutterkuh_l", label: "Mutterkuh leicht (bis 600 kg LG, ohne Kalb)", gruppe: "Rindvieh", einheit: "St", gf: 38, n: 72, nges: 57.60, p: 24, k: 118, mg: 8, raufutter: true },
    { id: "jungvieh_160", label: "Jungvieh bis 160 Tage", gruppe: "Rindvieh", einheit: "Pl", gf: 6, n: 23, nges: 19.55, ngesLSR: 18.40, p: 5, k: 22.9, mg: 1.3, raufutter: true },
    { id: "jungvieh_160_365", label: "Jungvieh 160–365 Tage", gruppe: "Rindvieh", einheit: "Pl", gf: 20.2, n: 31, nges: 26.35, ngesLSR: 24.80, p: 12, k: 51.9, mg: 6.1, raufutter: true },
    { id: "jungvieh_12", label: "Jungvieh 1–2-jährig", gruppe: "Rindvieh", einheit: "Pl", gf: 26, n: 42.5, nges: 36.13, ngesLSR: 34.00, p: 14, k: 62.5, mg: 5.5, raufutter: true },
    { id: "jungvieh_2p", label: "Jungvieh über 2-jährig", gruppe: "Rindvieh", einheit: "Pl", gf: 33, n: 55, nges: 46.75, ngesLSR: 44.00, p: 20, k: 75, mg: 7, raufutter: true },
    { id: "mastkalb", label: "Mastkälberplatz (60–220 kg)", gruppe: "Rindvieh", einheit: "Pl", gf: 1.0, n: 18.8, nges: 15.04, p: 6.7, k: 13.3, mg: 0.9, raufutter: true },
    { id: "mkkalb_160", label: "Mutterkuhkalb bis 160 d", gruppe: "Rindvieh", einheit: "Pl", gf: 2.8, n: 21.5, nges: 17.20, p: 7.5, k: 18.1, mg: 0.9, raufutter: true },
    { id: "mkkalb_l", label: "Mutterkuhkalb > 160 d, leicht (bis 200 kg SG)", gruppe: "Rindvieh", einheit: "Pl", gf: 17.8, n: 39.8, nges: 31.84, p: 12.3, k: 61.3, mg: 3.5, raufutter: true },
    { id: "mkkalb_m", label: "Mutterkuhkalb > 160 d, mittelschwer (200–250 kg SG)", gruppe: "Rindvieh", einheit: "Pl", gf: 18.8, n: 46.3, nges: 37.04, p: 13.9, k: 66.3, mg: 3.9, raufutter: true },
    { id: "mkkalb_s", label: "Mutterkuhkalb > 160 d, schwer (> 250 kg SG)", gruppe: "Rindvieh", einheit: "Pl", gf: 19.7, n: 52.4, nges: 41.92, p: 15.3, k: 70.0, mg: 4.2, raufutter: true },
    { id: "rvmast_160", label: "Rindviehmast bis 160 d", gruppe: "Rindvieh", einheit: "Pl", gf: 5.2, n: 22.6, nges: 18.08, p: 8, k: 14.6, mg: 3.4, raufutter: true },
    { id: "rvmast_160p", label: "Rindviehmast > 160 d (1'400 g TZW, 530 kg Ausstall-LG)", gruppe: "Rindvieh", einheit: "Pl", gf: 21, n: 44.6, nges: 35.68, p: 13.4, k: 36.2, mg: 5.8, raufutter: true, korr: { typ: "rvmast" } },
    { id: "rvmast_weide", label: "Rindviehmast Weidemast > 4 Monate", gruppe: "Rindvieh", einheit: "Pl", gf: 24, n: 45, nges: 36.00, p: 18, k: 65, mg: 5, raufutter: true, spezial: true },
    { id: "zuchtstier", label: "Zuchtstier", gruppe: "Rindvieh", einheit: "St", gf: 30, n: 50, nges: 40.00, p: 18, k: 85, mg: 5, raufutter: true },

    // ---- Pferde ----
    { id: "pferd_gross", label: "Pferde (> 180 d, > 148 cm)", gruppe: "Pferde", einheit: "Pl", gf: 28, n: 43, nges: 30.10, p: 21, k: 72, mg: 4.5, raufutter: true },
    { id: "pferd_jung", label: "Pferde (bis 180 d, > 148 cm)", gruppe: "Pferde", einheit: "Pl", gf: 5, n: 28, nges: 19.60, p: 9, k: 26, mg: 1.6, raufutter: true },
    { id: "maultier_gross", label: "Maultiere, Maulesel (> 180 d)", gruppe: "Pferde", einheit: "Pl", gf: 17, n: 26, nges: 18.20, p: 13, k: 43, mg: 3, raufutter: true },
    { id: "maultier_jung", label: "Maultiere, Maulesel (bis 180 d)", gruppe: "Pferde", einheit: "Pl", gf: 3, n: 14, nges: 9.80, p: 8.2, k: 16, mg: 1, raufutter: true },
    { id: "pony", label: "Ponys, Kleinpferde, Esel (jeden Alters)", gruppe: "Pferde", einheit: "Pl", gf: 10.4, n: 15.7, nges: 10.99, p: 8.2, k: 26.8, mg: 1.8, raufutter: true },

    // ---- Kleinwiederkäuer ----
    { id: "milchziege", label: "Milchziege (Ø 550 kg Jahresmilch)", gruppe: "Kleinwiederkäuer", einheit: "Pl", gf: 6.2, n: 9.3, nges: 7.87, p: 3.6, k: 15.7, mg: 0.9, raufutter: true, korr: { typ: "kws", basis: 550, schritt: 25, d: { gf: 0.03, n: 0.10, nges: 0.09, p: 0.03, k: 0.13, mg: 0.02 } } },
    { id: "ziege", label: "Andere Ziegen über 365 Tage", gruppe: "Kleinwiederkäuer", einheit: "Pl", gf: 5.7, n: 8.2, nges: 6.96, p: 3.3, k: 14.5, mg: 0.8, raufutter: true },
    { id: "jungziege", label: "Jungziegen 180–365 Tage", gruppe: "Kleinwiederkäuer", einheit: "Pl", gf: 3.5, n: 7.7, nges: 6.55, p: 3.3, k: 12.1, mg: 0.8, raufutter: true },
    { id: "zicklein_milch", label: "Zicklein bis 180 d (Milchziegenherde)", gruppe: "Kleinwiederkäuer", einheit: "Pl", gf: 0.7, n: 2.9, nges: 2.49, p: 1, k: 3.6, mg: 0.2, raufutter: true },
    { id: "zicklein_mutter", label: "Zicklein bis 180 d (Mutterziegenherde)", gruppe: "Kleinwiederkäuer", einheit: "Pl", gf: 1.7, n: 5.5, nges: 4.70, p: 1.9, k: 3.8, mg: 0.4, raufutter: true },
    { id: "milchschaf", label: "Milchschaf (Ø 500 kg Jahresmilch)", gruppe: "Kleinwiederkäuer", einheit: "Pl", gf: 9.3, n: 16.1, nges: 13.66, p: 6.6, k: 28.1, mg: 1.6, raufutter: true, korr: { typ: "kws", basis: 500, schritt: 25, d: { gf: 0.20, n: 0.58, nges: 0.50, p: 0.16, k: 0.83, mg: 0.06 } } },
    { id: "schaf", label: "Andere Schafe über 365 Tage", gruppe: "Kleinwiederkäuer", einheit: "Pl", gf: 6.5, n: 9.5, nges: 8.11, p: 3.8, k: 16.7, mg: 1, raufutter: true },
    { id: "jungschaf", label: "Jungschafe 180–365 Tage", gruppe: "Kleinwiederkäuer", einheit: "Pl", gf: 4.9, n: 9.8, nges: 8.36, p: 3.5, k: 16.5, mg: 1, raufutter: true },
    { id: "lamm", label: "Lämmer bis 180 Tage", gruppe: "Kleinwiederkäuer", einheit: "Pl", gf: 1.4, n: 3.3, nges: 2.85, p: 1.5, k: 5.2, mg: 0.4, raufutter: true },

    // ---- Übrige Raufutterverzehrer ----
    { id: "damhirsch", label: "Damhirsch (1 Muttertier + Nachwuchs = 1 Einheit)", gruppe: "Übrige Raufutterverzehrer", einheit: "Einh", gf: 10, n: 20, nges: 17.00, p: 7, k: 29, mg: 2.4, raufutter: true },
    { id: "rothirsch", label: "Rothirsch (1 Muttertier + Nachwuchs = 1 Einheit)", gruppe: "Übrige Raufutterverzehrer", einheit: "Einh", gf: 20, n: 40, nges: 34.00, p: 14, k: 58, mg: 4.8, raufutter: true },
    { id: "wapiti", label: "Wapiti (1 Muttertier + Nachwuchs = 1 Einheit)", gruppe: "Übrige Raufutterverzehrer", einheit: "Einh", gf: 40, n: 80, nges: 68.00, p: 28, k: 116, mg: 9.6, raufutter: true },
    { id: "bison_gross", label: "Bison > 900 d", gruppe: "Übrige Raufutterverzehrer", einheit: "St", gf: 39, n: 60, nges: 51.00, p: 30, k: 110, mg: 6, raufutter: true },
    { id: "bison_jung", label: "Bison bis 900 d", gruppe: "Übrige Raufutterverzehrer", einheit: "St", gf: 18, n: 20, nges: 17.00, p: 10, k: 45, mg: 2.5, raufutter: true },
    { id: "lama_gross", label: "Lama über 2-jährig", gruppe: "Übrige Raufutterverzehrer", einheit: "St", gf: 8.5, n: 17, nges: 14.45, p: 6.5, k: 28, mg: 1.7, raufutter: true },
    { id: "lama_jung", label: "Lama bis 2-jährig", gruppe: "Übrige Raufutterverzehrer", einheit: "St", gf: 4.9, n: 11, nges: 9.35, p: 4, k: 15, mg: 1, raufutter: true },
    { id: "alpaca_gross", label: "Alpaca über 2-jährig", gruppe: "Übrige Raufutterverzehrer", einheit: "St", gf: 5.5, n: 11, nges: 9.35, p: 4, k: 18, mg: 1, raufutter: true },
    { id: "alpaca_jung", label: "Alpaca bis 2-jährig", gruppe: "Übrige Raufutterverzehrer", einheit: "St", gf: 3, n: 7, nges: 5.95, p: 2.5, k: 9, mg: 0.5, raufutter: true },

    // ---- Schweine ----
    { id: "mastschwein_pl", label: "Mastschweineplatz (26–108 kg LG)", gruppe: "Schweine", einheit: "Pl", gf: 0, gfMax: 0.34, n: 13, nges: 10.40, p: 5.3, k: 5.8, mg: 1.4, freiland: true },
    { id: "mastschwein_st", label: "Mastschwein / Remonte (pro Stück)", gruppe: "Schweine", einheit: "St", gf: 0, n: 3.92, nges: 3.14, p: 1.6, k: 1.75, mg: 0.42, freiland: true, spezial: true },
    { id: "zuchtschwein_pl", label: "Zuchtschweineplatz inkl. Ferkel bis 26 kg", gruppe: "Schweine", einheit: "Pl", gf: 0, gfMax: 6.5, n: 44, nges: 35.20, p: 21, k: 23, mg: 4.2, freiland: true },
    { id: "eber", label: "Eber", gruppe: "Schweine", einheit: "Pl", gf: 0, gfMax: 0.5, n: 18, nges: 14.40, p: 10, k: 9.6, mg: 1.5, freiland: true },
    { id: "galtsau_pl", label: "Galtsauenplatz (2.94 Umtriebe/Jahr)", gruppe: "Schweine", einheit: "Pl", gf: 0, gfMax: 9.0, n: 24.5, nges: 19.60, p: 15, k: 16, mg: 2.3, freiland: true },
    { id: "galtsau_st", label: "Galtsau (pro Umtrieb, 124 d)", gruppe: "Schweine", einheit: "St", gf: 0, n: 8.33, nges: 6.66, p: 5.1, k: 5.44, mg: 0.78, freiland: true, spezial: true },
    { id: "zuchtsau_pl", label: "Säugende Zuchtsau (9.86 Umtriebe/Jahr)", gruppe: "Schweine", einheit: "Pl", gf: 0, gfMax: 6.5, n: 49, nges: 39.20, p: 23, k: 18, mg: 4.4, freiland: true },
    { id: "zuchtsau_st", label: "Säugende Zuchtsau (pro Umtrieb, 37 d)", gruppe: "Schweine", einheit: "St", gf: 0, n: 4.97, nges: 3.98, p: 2.33, k: 1.83, mg: 0.45, freiland: true, spezial: true },
    { id: "ferkel_pl", label: "Abgesetzte Ferkel Platz (8–26 kg LG)", gruppe: "Schweine", einheit: "Pl", gf: 0, n: 3.9, nges: 3.12, p: 1.68, k: 2.3, mg: 0.5 },
    { id: "ferkel_st", label: "Abgesetzte Ferkel (pro Stück)", gruppe: "Schweine", einheit: "St", gf: 0, n: 0.41, nges: 0.33, p: 0.17, k: 0.24, mg: 0.05, spezial: true },

    // ---- Geflügel (kein Weideabzug zulässig) ----
    { id: "legehenne_band", label: "Legehennenplätze (Kotband)", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 80, nges: 56.00, p: 46, k: 30, mg: 6.5, gefluegel: true },
    { id: "legehenne_grube", label: "Legehennen (Kotgrube, Bodenhaltung)", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 80, nges: 40.00, p: 46, k: 30, mg: 6.5, gefluegel: true },
    { id: "junghenne_pl", label: "Junghennenplätze (2.25 Umtriebe)", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 30, nges: 18.00, p: 17, k: 12, mg: 2.5, gefluegel: true },
    { id: "junghenne_st", label: "Junghennen (pro 100 Stück)", gruppe: "Geflügel", einheit: "100St", gf: 0, n: 13.3, nges: 7.98, p: 7.6, k: 5.3, mg: 1.11, gefluegel: true, spezial: true },
    { id: "mastpoulet", label: "Mastpouletplätze", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 36, nges: 21.60, p: 13, k: 22, mg: 4.4, gefluegel: true, laufhofMax: 180 },
    { id: "masttrute_pl", label: "Masttrutenplätze (2.8 Umtriebe)", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 140, nges: 84.00, p: 70, k: 40, mg: 18, gefluegel: true },
    { id: "masttrute_st", label: "Masttruten (pro 100 Stück)", gruppe: "Geflügel", einheit: "100St", gf: 0, n: 50, nges: 30.00, p: 25, k: 14.29, mg: 6.43, gefluegel: true, spezial: true },
    { id: "trute_vormast", label: "Truten-Vormastplätze (bis 1.5 kg, 6 Umtriebe)", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 40, nges: 24.00, p: 20.6, k: 12, mg: 5, gefluegel: true },
    { id: "trute_ausmast", label: "Truten-Ausmastplätze (1.5–13 kg, 2.9 Umtriebe)", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 230, nges: 138.00, p: 114.6, k: 70, mg: 29, gefluegel: true },
    { id: "strauss_gross", label: "Strauss älter als 13 Monate", gruppe: "Geflügel", einheit: "St", gf: 11, n: 24, nges: 14.40, p: 10, k: 15, mg: 1.3, gefluegel: true },
    { id: "strauss_jung", label: "Strauss bis 13 Monate", gruppe: "Geflügel", einheit: "St", gf: 2, n: 11, nges: 6.60, p: 6, k: 8, mg: 0.8, gefluegel: true },
    { id: "enten", label: "Enten", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 66, nges: 39.60, p: 34, k: 24, mg: 5, gefluegel: true },
    { id: "gaense", label: "Gänse", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 105, nges: 63.00, p: 53, k: 30, mg: 14, gefluegel: true },
    { id: "perlhuhn", label: "Perlhühner", gruppe: "Geflügel", einheit: "100Pl", gf: 0, n: 38, nges: 22.80, p: 19, k: 14, mg: 3, gefluegel: true },
    { id: "wachteln", label: "Wachteln (pro 100 Stück)", gruppe: "Geflügel", einheit: "100St", gf: 0, n: 30, nges: 18.00, p: 18, k: 6.5, mg: 0, gefluegel: true },

    // ---- Kaninchen ----
    { id: "zibbe", label: "Produzierende Zibbe (inkl. Jungtier bis ca. 35 d)", gruppe: "Kaninchen", einheit: "St", gf: 0.36, n: 2.6, nges: 2.21, p: 1.5, k: 2.5, mg: 0 },
    { id: "kaninchen_jung", label: "Kaninchen-Jungtier (ab ca. 35 d)", gruppe: "Kaninchen", einheit: "100Pl", gf: 4.0, n: 79, nges: 67.15, p: 48, k: 75, mg: 0 }
  ];

  /* Tab. 2a – Korrektur Nährstoffanfall Milchkuh, je 100 kg Abweichung von 7'500 kg */
  var MILCHKUH_KORR = { basis: 7500, schritt: 100, gfBasis: 56, d: { nges: 0.48, ngesLSR: 0.452, p: 0.27, k: 0.52, mg: 0.10 } };

  /* Tab. 2d – Rindviehmast > 160 d: je 100 g/d Abweichung von 1'400 g/d bzw. je 20 kg von 530 kg */
  var RVMAST_KORR = {
    tzwStd: 1400, tzwMin: 850, tzwMax: 1500,
    lgStd: 530, lgMin: 400, lgMax: 580,
    tzw: { gf: -0.43, n: 1.76, nges: 1.408, p: 0.66, k: 0.1, mg: 0.42 },
    lg: { gf: 0.58, n: 0.93, nges: 0.744, p: 0.32, k: 0.94, mg: 0.06 }
  };

  /* ---------------------------------------------------------------------------
     TAB. 3 – Erträge Wiesen und Weiden nach Höhenlage (dt TS/ha)
     --------------------------------------------------------------------------- */
  var HOEHENLAGEN = [
    { id: "h600", label: "bis 600 m ü. M.", wiese: { int: 135, mittel: 100, wenig: 65 }, weide: { int: 110, mittel: 85, wenig: 50 } },
    { id: "h700", label: "601–700 m ü. M.", wiese: { int: 125, mittel: 90, wenig: 60 }, weide: { int: 105, mittel: 80, wenig: 50 } },
    { id: "h800", label: "701–800 m ü. M.", wiese: { int: 115, mittel: 85, wenig: 55 }, weide: { int: 100, mittel: 75, wenig: 45 } },
    { id: "h900", label: "801–900 m ü. M.", wiese: { int: 110, mittel: 80, wenig: 50 }, weide: { int: 95, mittel: 70, wenig: 40 } },
    { id: "h1100", label: "901–1'100 m ü. M.", wiese: { int: 100, mittel: 75, wenig: 45 }, weide: { int: 90, mittel: 65, wenig: 40 } },
    { id: "h1500", label: "1'101–1'500 m ü. M.", wiese: { int: 85, mittel: 60, wenig: 35 }, weide: { int: 70, mittel: 50, wenig: 30 } },
    { id: "h1500p", label: "über 1'500 m ü. M.", wiese: { int: 65, mittel: 45, wenig: 25 }, weide: { int: 60, mittel: 40, wenig: 20 } }
  ];

  /* Netto-Nährstoffbedarf Wiesen/Weiden in kg pro dt TS (Tab. 3) */
  var W = {
    int: { n: 1.20, p: 0.82, k: 2.70, mg: 0.25 },
    mittel: { n: 0.95, p: 0.71, k: 2.30, mg: 0.20 },
    wenig: { n: 0.50, p: 0.57, k: 1.70, mg: 0.15 },
    ext: { n: 0, p: 0, k: 0, mg: 0 },
    weideExt: { n: 0.5, p: 0.5, k: 1.2, mg: 0.2 }  // unechter Bedarf = Ausscheidungen der Tiere
  };

  /* ---------------------------------------------------------------------------
     KULTUREN
     modus: "wiese"  → N,P,K,Mg in kg/dt TS   · Bedarf = Fläche × Ertrag × Wert
            "acker"  → N in kg/ha (ertragskorrigierbar), P,K,Mg in kg/dt
            "flach"  → N,P,K,Mg in kg/ha      · Bedarf = Fläche × Wert
            "null"   → kein Nährstoffbedarf
     istGF     : liefert Grundfutter (zählt zur Futterfläche / GF-Ertragsbilanz)
     ertragTyp : "wiese"|"weide" + stufe → Standardertrag aus Höhenlage
     gfArm     : Futter gilt als nährstoffarm (Abzug beim Tieranfall)
     gfUnged   : ungedüngte Wiese → innerbetrieblicher P2O5-Transfer
     oa        : zählt zur offenen Ackerfläche
     korr      : ertragsabhängige N-Korrektur {std, kf, max} nach Kap. 3.7
     ertragFix : Ertrag ist fix vorgegeben
     ertragMax : maximal zulässiger Ertrag (Plausibilitätsprüfung)
     --------------------------------------------------------------------------- */
  function wiese(id, label, stufe, art, extra) {
    var w = stufe === "ext" ? W.ext : stufe === "weideExt" ? W.weideExt : W[stufe];
    var o = { id: id, label: label, gruppe: "Wiesen & Weiden", bereich: "futterbau", modus: "wiese", n: w.n, p: w.p, k: w.k, mg: w.mg, istGF: true, ertragTyp: art, ertragStufe: stufe === "weideExt" ? "ext" : stufe };
    return Object.assign(o, extra || {});
  }

  var KULTUREN = [
    /* ---- Wiesen und Weiden (Tab. 3) ---- */
    wiese("wi_int", "Naturwiese intensiv", "int", "wiese"),
    wiese("wi_mittel", "Naturwiese mittelintensiv", "mittel", "wiese"),
    wiese("wi_wenig", "Naturwiese wenig intensiv", "wenig", "wiese", { gfArm: true }),
    wiese("wi_ext", "Extensiv genutzte Wiese", "ext", "wiese", { gfArm: true, gfUnged: true, ertragStd: 25, ertragMax: 30 }),
    wiese("ku_int", "Kunstwiese (intensiv)", "int", "wiese", { oa: true }),
    wiese("we_int", "Weide intensiv", "int", "weide"),
    wiese("we_mittel", "Weide mittelintensiv", "mittel", "weide"),
    wiese("we_wenig", "Weide wenig intensiv", "wenig", "weide", { gfArm: true }),
    wiese("we_ext", "Extensiv genutzte Weide (unechter Bedarf)", "weideExt", "weide", { gfArm: true, ertragStd: 20, ertragMax: 25 }),
    { id: "zwischenfutter", label: "Zwischenfutter / Äugstlen / Frühjahrsschnitt (pro Nutzung)", gruppe: "Wiesen & Weiden", bereich: "futterbau", modus: "wiese", n: 1.20, p: 0.82, k: 2.70, mg: 0.25, istGF: true, ertragStd: 25, ertragMax: 25, oa: true },
    { id: "fruehjahrsschnitt", label: "Frühjahrsschnitt vor Umbruch (1. Schnitt)", gruppe: "Wiesen & Weiden", bereich: "futterbau", modus: "wiese", n: 1.20, p: 0.82, k: 2.70, mg: 0.25, istGF: true, ertragStd: 50, ertragMax: 50, oa: true },
    { id: "leg_reinsaat", label: "Leguminosen-Samenproduktion (Reinsaat)", gruppe: "Wiesen & Weiden", bereich: "ackerbau", modus: "wiese", n: 0.00, p: 0.71, k: 2.30, mg: 0.25, ertragStd: 120, oa: true },
    { id: "gras_reinsaat", label: "Grassamen-Produktion (Reinsaat)", gruppe: "Wiesen & Weiden", bereich: "ackerbau", modus: "wiese", n: 1.70, p: 0.71, k: 2.30, mg: 0.25, ertragStd: 120, oa: true },

    /* ---- Ackerkulturen (Tab. 4) ---- */
    { id: "wweizen", label: "Winterweizen (Brot- und Biskuitweizen)", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 140, p: 0.83, k: 0.10, mg: 0.12, ertragStd: 60, oa: true, korr: { std: 60, kf: 1.0, max: 80 } },
    { id: "futterweizen", label: "Futterweizen", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 140, p: 0.83, k: 0.14, mg: 0.12, ertragStd: 75, oa: true, korr: { std: 75, kf: 1.0, max: 95 } },
    { id: "sweizen", label: "Sommerweizen", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 120, p: 0.82, k: 0.44, mg: 0.12, ertragStd: 50, oa: true },
    { id: "wgerste", label: "Wintergerste", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 110, p: 0.85, k: 0.11, mg: 0.12, ertragStd: 60, oa: true, korr: { std: 60, kf: 0.7, max: 90 } },
    { id: "sgerste", label: "Sommergerste", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 90, p: 0.84, k: 0.55, mg: 0.11, ertragStd: 55, oa: true },
    { id: "whafer", label: "Winterhafer", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 90, p: 0.80, k: 0.00, mg: 0.11, ertragStd: 55, oa: true },
    { id: "shafer", label: "Sommerhafer", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 90, p: 0.80, k: 0.51, mg: 0.11, ertragStd: 55, oa: true },
    { id: "wroggen_pop", label: "Winterroggen (Populationssorten)", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 90, p: 0.80, k: 0.10, mg: 0.11, ertragStd: 55, oa: true, korr: { std: 55, kf: 0.8, max: 80 } },
    { id: "wroggen_hyb", label: "Winterroggen (Hybridsorten)", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 90, p: 0.80, k: 0.13, mg: 0.11, ertragStd: 65, oa: true, korr: { std: 65, kf: 1.2, max: 90 } },
    { id: "dinkel", label: "Dinkel", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 100, p: 0.80, k: 0.04, mg: 0.11, ertragStd: 45, oa: true },
    { id: "wtriticale", label: "Wintertriticale", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 110, p: 0.72, k: 0.00, mg: 0.08, ertragStd: 60, oa: true, korr: { std: 60, kf: 0.3, max: 95 } },
    { id: "striticale", label: "Sommertriticale", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 100, p: 0.71, k: 0.49, mg: 0.09, ertragStd: 55, oa: true },
    { id: "emmer", label: "Emmer, Einkorn", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 30, p: 0.80, k: 0.06, mg: 0.16, ertragStd: 25, oa: true },
    { id: "hirse", label: "Hirse", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 70, p: 0.66, k: 0.29, mg: 0.11, ertragStd: 35, oa: true },
    { id: "quinoa", label: "Quinoa", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 120, p: 1.15, k: 1.40, mg: 0.47, ertragStd: 20, oa: true },
    { id: "koernermais", label: "Körnermais", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 110, p: 0.76, k: 0.40, mg: 0.09, ertragStd: 100, oa: true, korr: { std: 100, kf: 1.2, max: 135 } },
    { id: "reis", label: "Reis", gruppe: "Getreide", bereich: "ackerbau", modus: "acker", n: 110, p: 0.70, k: 0.53, mg: 0.08, ertragStd: 60, oa: true },

    { id: "silomais", label: "Silomais / Ganzpflanzen-Sorghum", gruppe: "Futterbau Acker", bereich: "futterbau", modus: "acker", n: 110, p: 0.58, k: 1.30, mg: 0.13, ertragStd: 185, istGF: true, oa: true, korr: { std: 185, kf: 0.7, max: 230 } },
    { id: "gruenmais", label: "Grünmais / GP-Sorghum als 2. Kultur", gruppe: "Futterbau Acker", bereich: "futterbau", modus: "acker", n: 70, p: 0.65, k: 2.70, mg: 0.10, ertragStd: 60, istGF: true, oa: true },
    { id: "futterrueben", label: "Futterrüben", gruppe: "Futterbau Acker", bereich: "futterbau", modus: "acker", n: 100, p: 0.50, k: 1.12, mg: 0.13, ertragStd: 175, istGF: true, oa: true },
    { id: "getreidesilage", label: "Getreide-Ganzpflanzensilage", gruppe: "Futterbau Acker", bereich: "futterbau", modus: "flach", n: 110, p: 63, k: 102, mg: 11, ertragStd: 106, ertragFix: true, istGF: true, oa: true },
    { id: "getreidesilage_leg", label: "Getreide-Ganzpflanzensilage mit Leguminosen", gruppe: "Futterbau Acker", bereich: "futterbau", modus: "flach", n: 80, p: 60, k: 120, mg: 10, ertragStd: 106, ertragFix: true, istGF: true, oa: true },
    { id: "stroh_futter", label: "Stroh (betriebseigen, verfüttert)", gruppe: "Futterbau Acker", bereich: "futterbau", modus: "acker", n: 0, p: 0.22, k: 0.92, mg: 0.13, ertragStd: 40, istGF: true, ohneFlaeche: true },
    { id: "ruebenblatt_futter", label: "Rübenblätter (betriebseigen, verfüttert)", gruppe: "Futterbau Acker", bereich: "futterbau", modus: "acker", n: 0, p: 0.52, k: 2.62, mg: 0.60, ertragStd: 50, istGF: true, ohneFlaeche: true },

    { id: "kart_speise_a", label: "Kartoffeln Speise-/Verarbeitung, Gruppe a (geringer N-Bedarf)", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 80, p: 0.16, k: 0.71, mg: 0.03, ertragStd: 450, oa: true },
    { id: "kart_speise_b", label: "Kartoffeln Speise-/Verarbeitung, Gruppe b (Standard)", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 120, p: 0.16, k: 0.71, mg: 0.03, ertragStd: 450, oa: true },
    { id: "kart_speise_c", label: "Kartoffeln Speise-/Verarbeitung, Gruppe c (höherer N-Bedarf)", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 160, p: 0.16, k: 0.71, mg: 0.03, ertragStd: 450, oa: true },
    { id: "kart_frueh_a", label: "Frühkartoffeln, Gruppe a", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 70, p: 0.19, k: 0.69, mg: 0.03, ertragStd: 300, oa: true },
    { id: "kart_frueh_b", label: "Frühkartoffeln, Gruppe b", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 110, p: 0.19, k: 0.69, mg: 0.03, ertragStd: 300, oa: true },
    { id: "kart_frueh_c", label: "Frühkartoffeln, Gruppe c", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 150, p: 0.19, k: 0.69, mg: 0.03, ertragStd: 300, oa: true },
    { id: "kart_pflanz_a", label: "Pflanzkartoffeln, Gruppe a", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 60, p: 0.19, k: 0.71, mg: 0.03, ertragStd: 250, oa: true },
    { id: "kart_pflanz_b", label: "Pflanzkartoffeln, Gruppe b", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 100, p: 0.19, k: 0.71, mg: 0.03, ertragStd: 250, oa: true },
    { id: "kart_pflanz_c", label: "Pflanzkartoffeln, Gruppe c", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 140, p: 0.19, k: 0.71, mg: 0.03, ertragStd: 250, oa: true },
    { id: "zuckerrueben", label: "Zuckerrüben", gruppe: "Hackfrüchte", bereich: "ackerbau", modus: "acker", n: 100, p: 0.06, k: 0.09, mg: 0.03, ertragStd: 900, oa: true },

    { id: "wraps", label: "Winterraps", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 150, p: 1.43, k: 0.86, mg: 0.23, ertragStd: 35, oa: true, korr: { std: 35, kf: 3.0, max: 45 } },
    { id: "sraps", label: "Sommerraps", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 120, p: 1.48, k: 0.84, mg: 0.28, ertragStd: 25, oa: true },
    { id: "sonnenblume", label: "Sonnenblume", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 60, p: 1.10, k: 0.83, mg: 0.30, ertragStd: 30, oa: true },
    { id: "oelhanf", label: "Ölhanf", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 60, p: 2.54, k: 1.08, mg: 0.54, ertragStd: 13, oa: true },
    { id: "faserhanf", label: "Faserhanf", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 100, p: 0.30, k: 0.90, mg: 0.05, ertragStd: 100, oa: true },
    { id: "oellein", label: "Öllein", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 80, p: 1.20, k: 0.95, mg: 0.05, ertragStd: 20, oa: true },
    { id: "faserlein", label: "Faserlein", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 60, p: 0.71, k: 2.00, mg: 0.20, ertragStd: 45, oa: true },
    { id: "kenaf", label: "Kenaf", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 70, p: 1.20, k: 1.60, mg: 0.20, ertragStd: 50, oa: true },
    { id: "eiweisserbsen", label: "Eiweisserbsen", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 0, p: 0.98, k: 1.84, mg: 0.13, ertragStd: 40, oa: true },
    { id: "ackerbohnen", label: "Ackerbohnen", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 0, p: 1.40, k: 2.13, mg: 0.25, ertragStd: 40, oa: true },
    { id: "sojabohnen", label: "Sojabohnen", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 0, p: 1.17, k: 2.75, mg: 0.20, ertragStd: 30, oa: true },
    { id: "suesslupine", label: "Süsslupine", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 0, p: 1.00, k: 2.04, mg: 0.20, ertragStd: 30, oa: true },
    { id: "tabak_burley", label: "Tabak Burley", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 170, p: 0.72, k: 5.00, mg: 0.28, ertragStd: 25, oa: true },
    { id: "tabak_virginie", label: "Tabak Virginie", gruppe: "Ölsaaten & Eiweisspflanzen", bereich: "ackerbau", modus: "acker", n: 30, p: 0.56, k: 4.76, mg: 0.20, ertragStd: 25, oa: true },

    { id: "gruenduengung_leg", label: "Gründüngung (Leguminosen)", gruppe: "Übrige Ackerkulturen", bereich: "ackerbau", modus: "flach", n: 0, p: 0, k: 0, mg: 0, ertragStd: 35, oa: true },
    { id: "gruenduengung_nleg", label: "Gründüngung (Nicht-Leguminosen)", gruppe: "Übrige Ackerkulturen", bereich: "ackerbau", modus: "flach", n: 0, p: 0, k: 0, mg: 0, ertragStd: 35, oa: true },
    { id: "zwischenfrucht", label: "Zwischenfrüchte (ohne Kunstwiesen, pro Nutzung)", gruppe: "Übrige Ackerkulturen", bereich: "ackerbau", modus: "acker", n: 30, p: 0.96, k: 2.88, mg: 0.29, ertragStd: 25, oa: true },
    { id: "nichtaufg_leg", label: "Nicht aufgeführte Ackerkultur (Leguminosen)", gruppe: "Übrige Ackerkulturen", bereich: "ackerbau", modus: "flach", n: 0, p: 60, k: 120, mg: 10, oa: true },
    { id: "nichtaufg_nleg", label: "Nicht aufgeführte Ackerkultur (Nicht-Leg. / Mischungen)", gruppe: "Übrige Ackerkulturen", bereich: "ackerbau", modus: "flach", n: 80, p: 60, k: 120, mg: 10, oa: true },
    { id: "stroh_weg", label: "Stroh (Wegfuhr oder Zukauf zum Einstreuen)", gruppe: "Übrige Ackerkulturen", bereich: "ackerbau", modus: "acker", n: 0, p: 0.19, k: 0.79, mg: 0.11, ertragStd: 50, ohneFlaeche: true },
    { id: "ruebenblatt_weg", label: "Rübenblätter (Wegfuhr)", gruppe: "Übrige Ackerkulturen", bereich: "ackerbau", modus: "acker", n: 0, p: 0.08, k: 0.40, mg: 0.09, ertragStd: 325, ohneFlaeche: true },

    /* ---- BFF und übrige Flächen (kein Nährstoffbedarf) ---- */
    { id: "saum", label: "Saum / Buntbrache / Rotationsbrache / Nützlingsstreifen", gruppe: "BFF & übrige Flächen", bereich: "bff", modus: "null" },
    { id: "hecke_krautsaum", label: "Hecke / Feldgehölz mit Krautsaum", gruppe: "BFF & übrige Flächen", bereich: "bff", modus: "null" },
    { id: "hecke_puffer", label: "Hecke / Feldgehölz mit Pufferstreifen", gruppe: "BFF & übrige Flächen", bereich: "bff", modus: "null" },
    { id: "streue", label: "Streuefläche / Torfland", gruppe: "BFF & übrige Flächen", bereich: "bff", modus: "null", istGF: true, gfArm: true, gfUnged: true, ertragStd: 0 },
    { id: "wiese_duengeverbot", label: "Wiese mit Düngeverbot", gruppe: "BFF & übrige Flächen", bereich: "bff", modus: "null", istGF: true, gfArm: true, gfUnged: true, ertragStd: 25 },
    { id: "uebrige_flaeche", label: "Übrige Fläche ohne Nährstoffbedarf", gruppe: "BFF & übrige Flächen", bereich: "bff", modus: "null" },

    /* ---- Freilandgemüse (Tab. 5) – Bedarf in kg/ha, Ertrag in kg/a (Referenz) ---- */
    ...[
      ["asia_salate", "Asia-Salate", 200, 150, 30, 135, 10],
      ["blumenkohl", "Blumenkohl, Standard", 350, 290, 40, 150, 15],
      ["blumenkohl_frueh", "Blumenkohl, früh", 350, 300, 40, 150, 15],
      ["blumenkohl_verarb", "Blumenkohl, Verarbeitung", 400, 310, 40, 150, 15],
      ["bodenkohlrabi", "Bodenkohlrabi", 400, 150, 30, 120, 20],
      ["broccoli", "Broccoli", 180, 220, 30, 90, 10],
      ["broccoli_verarb", "Broccoli, Verarbeitung", 250, 300, 35, 100, 10],
      ["cima_di_rapa", "Cima di rapa", 400, 140, 40, 160, 10],
      ["chinakohl", "Chinakohl", 600, 160, 60, 200, 10],
      ["chinakohl_verarb", "Chinakohl, Verarbeitung", 700, 200, 60, 200, 15],
      ["federkohl", "Federkohl", 300, 250, 50, 160, 10],
      ["kabis_frueh", "Kabis Früh-, Folie", 300, 140, 40, 150, 10],
      ["kabis_lager", "Kabis Lager", 500, 190, 50, 200, 20],
      ["kabis_einschneide", "Kabis Einschneide-", 800, 260, 60, 250, 20],
      ["kohlrabi", "Kohlrabi", 300, 130, 40, 120, 20],
      ["kohlrabi_verarb", "Kohlrabi, Verarbeitung", 450, 170, 50, 150, 30],
      ["pak_choi", "Pak Choi", 250, 180, 45, 200, 15],
      ["radies", "Radies (10 Bund/m²)", 300, 50, 20, 80, 10],
      ["rettich", "Rettich (8–9 Stk/m²)", 400, 110, 40, 150, 10],
      ["rosenkohl", "Rosenkohl, Strünke abgeführt", 250, 260, 50, 170, 5],
      ["rucola_1", "Rucola, ein Schnitt", 200, 150, 30, 150, 10],
      ["rucola_2", "Rucola, zwei Schnitte", 300, 210, 40, 180, 20],
      ["rueben_herbst", "Rüben Herbst-, Mai-", 400, 140, 30, 150, 20],
      ["wirz_leicht", "Wirz leicht", 300, 120, 30, 140, 10],
      ["wirz_schwer", "Wirz schwer", 400, 140, 40, 160, 10],
      ["chicoree", "Chicorée, Wurzelanbau", 400, 70, 50, 150, 30],
      ["cicorino", "Cicorino rosso, Radicchio", 160, 110, 20, 90, 10],
      ["cicorino_verarb", "Cicorino rosso, Radicchio, Verarbeitung", 250, 130, 25, 140, 15],
      ["endivie_mittel", "Endivie, mittlerer Ertrag", 350, 130, 30, 160, 20],
      ["endivie_hoch", "Endivie, hoher Ertrag", 600, 160, 40, 200, 20],
      ["salate_mittel", "Salate, diverse, mittlerer Ertrag", 350, 90, 20, 70, 10],
      ["salate_hoch", "Salate, diverse, hoher Ertrag", 600, 110, 40, 120, 10],
      ["schnittsalat", "Schnittsalat", 150, 60, 20, 60, 20],
      ["schwarzwurzel", "Schwarzwurzel", 250, 120, 30, 100, 10],
      ["zuckerhut", "Zuckerhut", 350, 130, 20, 90, 10],
      ["zuckerhut_conv", "Zuckerhut (Convenience)", 600, 160, 20, 90, 10],
      ["fenchel", "Fenchel, Knollen", 400, 160, 30, 180, 20],
      ["karotten_pariser", "Karotten Pariser", 250, 50, 30, 100, 10],
      ["karotten_bund", "Karotten Bund-, Früh-", 350, 100, 40, 140, 20],
      ["karotten_lager600", "Karotten Verarbeitung-, Lager- (600 kg/a)", 600, 110, 40, 250, 20],
      ["karotten_lager900", "Karotten Verarbeitung-, Lager- (900 kg/a)", 900, 130, 50, 300, 20],
      ["pastinake", "Pastinake", 400, 180, 90, 290, 25],
      ["petersilie_1", "Petersilie, bis zum ersten Schnitt", 250, 130, 30, 150, 15],
      ["petersilie_w", "Petersilie, je weiterem Schnitt", 150, 75, 20, 100, 5],
      ["petersilienwurzel", "Petersilienwurzeln", 350, 130, 40, 250, 25],
      ["sellerie_knollen", "Sellerie Knollen", 600, 190, 70, 300, 20],
      ["sellerie_stangen", "Sellerie Stangen-", 600, 180, 70, 300, 20],
      ["bohnen_busch", "Bohnen Busch-, Handpflück-", 150, 0, 20, 70, 5],
      ["bohnen_verarb", "Bohnen, Verarbeitung-", 90, 0, 10, 30, 5],
      ["erbsen_verarb", "Erbsen, Verarbeitung-", 70, 0, 20, 60, 5],
      ["erbsen_kefen", "Erbsen, Kefen", 100, 0, 30, 110, 10],
      ["gd_leguminosen_g", "Gründüngung Leguminosen (Gemüsebau)", 300, 0, 0, 0, 0],
      ["krautstiel", "Krautstiel", 1000, 150, 60, 220, 30],
      ["randen", "Randen", 600, 140, 40, 160, 20],
      ["spinat_1_vor", "Spinat, 1 Schnitt, vor Mitte April gesät", 150, 180, 25, 150, 20],
      ["spinat_2_vor", "Spinat, 2 Schnitte, vor Mitte April gesät", 200, 190, 40, 180, 25],
      ["spinat_1_nach", "Spinat, 1 Schnitt, nach Mitte April gesät", 150, 160, 25, 150, 20],
      ["spinat_2_nach", "Spinat, 2 Schnitte, nach Mitte April gesät", 200, 170, 40, 180, 25],
      ["winterspinat_1", "Winterspinat, 1 Schnitt", 250, 185, 25, 170, 15],
      ["winterspinat_2", "Winterspinat, 2 Schnitte", 300, 200, 40, 180, 20],
      ["spinat_ind_1_vor", "Spinat Industrie, 1 Schnitt, vor Mitte April", 250, 190, 30, 190, 25],
      ["spinat_ind_2_vor", "Spinat Industrie, 2 Schnitte, vor Mitte April", 300, 200, 35, 200, 25],
      ["spinat_ind_1_nach", "Spinat Industrie, 1 Schnitt, nach Mitte April", 250, 180, 30, 190, 25],
      ["spinat_ind_2_nach", "Spinat Industrie, 2 Schnitte, nach Mitte April", 300, 190, 35, 200, 25],
      ["winterspinat_ind_1", "Winterspinat Industrie, 1 Schnitt", 250, 190, 30, 190, 25],
      ["winterspinat_ind_2", "Winterspinat Industrie, 2 Schnitte", 300, 200, 35, 200, 25],
      ["gurken_essig", "Gurken, Essiggurken", 300, 140, 30, 170, 20],
      ["melone", "Melone", 400, 140, 30, 170, 40],
      ["zucchetti_sommer", "Zucchetti, gepflanzt, Sommer und Herbst", 500, 190, 35, 140, 20],
      ["zucchetti_kurz", "Zucchetti, gepflanzt, frühe Kurzkultur", 450, 180, 30, 135, 20],
      ["zucchetti_gesaet", "Zucchetti, gesät, Sommer und Herbst", 450, 170, 30, 110, 15],
      ["kuerbis", "Patisson, Kürbis", 400, 150, 60, 220, 30],
      ["aubergine", "Aubergine", 400, 170, 20, 130, 10],
      ["tomaten_frei", "Tomaten (Freiland)", 800, 130, 50, 260, 30],
      ["spargel_bleich", "Spargel Bleich-", 50, 140, 30, 130, 20],
      ["spargel_gruen", "Spargel Grün-", 25, 150, 30, 110, 20],
      ["knoblauch", "Knoblauch", 200, 120, 30, 120, 10],
      ["lauch", "Lauch", 500, 200, 40, 180, 20],
      ["lauch_frueh", "Lauch, früh gepflanzt", 400, 230, 40, 180, 20],
      ["lauch_spaet", "Lauch, spät gepflanzt", 500, 230, 45, 190, 20],
      ["lauch_ueberwint", "Lauch, gepflanzt, Überwinterung", 400, 240, 35, 150, 15],
      ["lauch_gesaet", "Lauch, gesät", 550, 230, 40, 180, 20],
      ["schnittlauch", "Schnittlauch", 300, 170, 30, 120, 20],
      ["zwiebeln", "Zwiebeln", 600, 130, 60, 160, 20],
      ["bundzwiebeln_fj", "Bundzwiebeln, Frühjahr", 250, 155, 30, 120, 10],
      ["bundzwiebeln_so", "Bundzwiebeln, Sommer", 250, 145, 30, 120, 10],
      ["bundzwiebeln_ue", "Bundzwiebeln, Überwinterung", 250, 145, 20, 70, 5],
      ["gd_nichtleg_g", "Gründüngung Nichtleguminosen (Gemüsebau)", 400, 0, 0, 0, 0],
      ["kraeuter_klein", "Kräuter, 1-/mehrjährig, klein", 8, 40, 15, 60, 10],
      ["kraeuter_mittel", "Kräuter, 1-/mehrjährig, mittel", 25, 70, 30, 160, 15],
      ["kraeuter_mgross", "Kräuter, 1-/mehrjährig, mittel–gross", 50, 120, 40, 200, 20],
      ["kraeuter_gross", "Kräuter, 1-/mehrjährig, gross", 75, 160, 50, 250, 25],
      ["nuesslisalat", "Nüsslisalat, Feldsalat", 100, 50, 20, 60, 10],
      ["rhabarber", "Rhabarber", 450, 130, 30, 120, 10],
      ["schnittblumen_klein", "Schnittblumen, klein", null, 140, 100, 150, 30],
      ["schnittblumen_mittel", "Schnittblumen, mittel", null, 230, 140, 250, 40],
      ["schnittblumen_gross", "Schnittblumen, gross", null, 320, 180, 350, 60],
      ["suesskartoffeln", "Süsskartoffeln", 350, 90, 60, 150, 15],
      ["viola", "Viola (Stiefmütterchen)", null, 50, 10, 60, 10],
      ["zuckermais", "Zuckermais", 180, 150, 50, 100, 20],
      ["mittelwert_freiland", "Mittelwert Freilandgemüse (kleine Pflanzungen)", 350, 120, 30, 120, 15]
    ].map(function (r) {
      return { id: r[0], label: r[1], gruppe: "Freilandgemüse", bereich: "spezial", modus: "flach", ertragRef: r[2], n: r[3], p: r[4], k: r[5], mg: r[6], oa: true };
    }),

    /* ---- Gewächshaus / Hochtunnel (Tab. 5) ---- */
    ...[
      ["gwh_aubergine", "Aubergine, Erdkultur", 900, 200, 100, 350, 50],
      ["gwh_bohnen_stangen", "Bohnen Stangen-", 500, 40, 80, 180, 30],
      ["gwh_endivie_herbst", "Endivie Herbst-", 450, 140, 50, 180, 30],
      ["gwh_gurken_30", "Gurken, 30 Stk/m², Erdkultur", 1500, 200, 100, 300, 60],
      ["gwh_gurken_50", "Gurken, 50 Stk/m², Erdkultur", 2500, 300, 150, 400, 80],
      ["gwh_kohlrabi", "Kohlrabi", 450, 140, 60, 200, 30],
      ["gwh_krautstiel", "Krautstiel", 900, 200, 100, 400, 50],
      ["gwh_kresse", "Kresse", 130, 20, 10, 30, 10],
      ["gwh_lauch", "Lauch", 500, 160, 60, 220, 30],
      ["gwh_nuesslisalat", "Nüsslisalat, Feldsalat", 120, 50, 10, 60, 10],
      ["gwh_paprika", "Paprika, Bodenkultur", 600, 160, 50, 250, 30],
      ["gwh_petersilie", "Petersilie", 300, 100, 50, 180, 20],
      ["gwh_portulak", "Portulak", 150, 70, 20, 90, 20],
      ["gwh_radies", "Radies (20 Bund/m²)", 400, 60, 30, 100, 20],
      ["gwh_rettich", "Rettich (18 Stk/m²)", 600, 90, 50, 200, 30],
      ["gwh_rucola_1", "Rucola, ein Schnitt", 200, 150, 30, 150, 10],
      ["gwh_rucola_2", "Rucola, zwei Schnitte", 300, 210, 40, 180, 20],
      ["gwh_salate", "Salate Kopf-, Eisberg, Lollo", 400, 80, 30, 140, 20],
      ["gwh_schnittlauch", "Schnittlauch (Kultur)", 300, 100, 40, 180, 30],
      ["gwh_schnittsalat", "Schnittsalat", 150, 50, 10, 50, 10],
      ["gwh_sellerie_suppen", "Sellerie Suppen- (40 Stk/m²)", 600, 120, 70, 220, 30],
      ["gwh_spinat", "Spinat", 120, 100, 30, 140, 20],
      ["gwh_tomaten_1200", "Tomaten, Bodenkultur (1'200 kg/a)", 1200, 170, 80, 340, 60],
      ["gwh_tomaten_1800", "Tomaten, Bodenkultur (1'800 kg/a)", 1800, 250, 100, 500, 80],
      ["gwh_tomaten_2400", "Tomaten, Bodenkultur (2'400 kg/a)", 2400, 330, 160, 680, 120],
      ["gwh_tomaten_3000", "Tomaten, Bodenkultur (3'000 kg/a)", 3000, 400, 200, 850, 150],
      ["gwh_zucchetti", "Zucchetti", 600, 190, 35, 150, 15],
      ["gwh_kuerbis", "Patisson, Kürbis", 600, 160, 60, 220, 30],
      ["gwh_mittelwert", "Mittelwert Gewächshausgemüse", 670, 130, 60, 220, 35]
    ].map(function (r) {
      return { id: r[0], label: r[1], gruppe: "Gewächshaus & Hochtunnel", bereich: "spezial", modus: "flach", ertragRef: r[2], n: r[3], p: r[4], k: r[5], mg: r[6] };
    }),

    /* ---- Dauerkulturen (Tab. 6) ---- */
    ...[
      ["weinreben", "Weinreben", 50, 27, 78, 25],
      ["tafeltrauben", "Tafeltrauben", 50, 27, 78, 25],
      ["tafeltrauben_hoch", "Tafeltrauben, hoher Ertrag", 60, 34, 102, 25],
      ["kernobst", "Kernobst", 60, 20, 75, 20],
      ["kernobst_hoch", "Kernobst, hoher Ertrag", 80, 30, 110, 40],
      ["kirschen", "Kirschen", 60, 20, 50, 20],
      ["kirschen_hoch", "Kirschen, hoher Ertrag", 100, 40, 85, 40],
      ["zwetschgen", "Zwetschgen", 60, 15, 50, 15],
      ["zwetschgen_hoch", "Zwetschgen, hoher Ertrag", 80, 20, 65, 20],
      ["aprikosen", "Aprikosen", 60, 25, 75, 20],
      ["aprikosen_hoch", "Aprikosen, hoher Ertrag", 75, 30, 90, 30],
      ["pfirsiche", "Pfirsiche", 60, 15, 55, 20],
      ["pfirsiche_hoch", "Pfirsiche, hoher Ertrag", 75, 20, 70, 30],
      ["kiwi", "Kiwi", 50, 15, 75, 15],
      ["kiwi_hoch", "Kiwi, hoher Ertrag", 65, 20, 90, 20],
      ["kleine_anlagen", "Kleine Anlagen (< 20 a) mit verschiedenen Dauerkulturen", 60, 20, 75, 20],
      ["hochstamm", "Hochstamm-Feldobstbäume, Nussbäume, Edelkastanien", 45, 15, 56, 8],
      ["walnuss_klein", "Walnussbäume < 185 Bäume/ha", 80, 30, 100, 30],
      ["walnuss_gross", "Walnussbäume ≥ 185 Bäume/ha", 120, 50, 140, 50],
      ["haselnuesse", "Haselnüsse", 90, 25, 50, 15],
      ["selve", "Gepflegte Selve < 100 Bäume", 0, 0, 0, 0],
      ["hopfen", "Hopfen", 180, 60, 200, 50],
      ["christbaeume", "Christbäume", 50, 35, 95, 20],
      ["baumschulen_zier", "Baumschulen, Ziersträucher, Ziergehölze, Zierstauden", 50, 17, 37, 5],
      ["baumschulen_obst", "Baumschulen für den Erwerbsobstbau (hohe Pflanzdichte)", 115, 45, 95, 13],
      ["chinaschilf", "Chinaschilf", 30, 20, 112, 6],
      ["maulbeerbaum", "Maulbeerbaumanlagen (Fütterung Seidenraupen)", 85, 25, 0, 0],
      ["erdbeeren_1j_20", "Erdbeeren, einjährig, 2.0 kg/m²", 100, 34, 121, 20],
      ["erdbeeren_1j_30", "Erdbeeren, einjährig, 3.0 kg/m²", 120, 46, 157, 25],
      ["erdbeeren_1j_40", "Erdbeeren, einjährig, 4.0 kg/m²", 180, 80, 247, 40],
      ["erdbeeren_mj", "Erdbeeren mehrjährig", 100, 34, 121, 20],
      ["erdbeeren_jung", "Erdbeeren-Jungpflanzen (Tray-Pflanzen)", 120, 34, 114, 20],
      ["himbeeren_jung", "Himbeeren-Jungpflanzen (Long-Cane)", 130, 80, 169, 15],
      ["himbeeren_15", "Himbeeren, 1.5 kg/m²", 45, 23, 60, 15],
      ["himbeeren_25", "Himbeeren, 2.5 kg/m²", 75, 46, 96, 20],
      ["himbeeren_35", "Himbeeren, 3.5 kg/m²", 105, 69, 133, 30],
      ["brombeeren_20", "Brombeeren, 2.0 kg/m²", 55, 34, 66, 15],
      ["brombeeren_30", "Brombeeren, 3.0 kg/m²", 85, 57, 102, 20],
      ["brombeeren_40", "Brombeeren, 4.0 kg/m²", 115, 80, 145, 25],
      ["johannisbeeren_20", "Rote Johannisbeeren, 2.0 kg/m²", 85, 46, 121, 15],
      ["johannisbeeren_25", "Rote Johannisbeeren, 2.5 kg/m²", 110, 57, 151, 20],
      ["johannisbeeren_35", "Rote Johannisbeeren, 3.5 kg/m²", 160, 80, 253, 25],
      ["cassis_25", "Cassis, 2.5 kg/m²", 90, 46, 157, 20],
      ["cassis_35", "Cassis, 3.5 kg/m²", 130, 69, 229, 25],
      ["stachelbeeren_17", "Stachelbeeren, 1.7 kg/m²", 60, 34, 78, 15],
      ["stachelbeeren_25", "Stachelbeeren, 2.5 kg/m²", 95, 57, 127, 20],
      ["heidelbeeren_15", "Heidelbeeren, 1.5 kg/m²", 55, 23, 72, 20],
      ["heidelbeeren_25", "Heidelbeeren, 2.5 kg/m²", 65, 46, 84, 30],
      ["strauchbeeren_alt", "Alternative Strauchbeeren (Minikiwi, Holunder, Goji, Aronia, Lonicera)", 85, 46, 121, 15]
    ].map(function (r) {
      return { id: r[0], label: r[1], gruppe: "Dauerkulturen, Obst & Beeren", bereich: "spezial", modus: "flach", n: r[2], p: r[3], k: r[4], mg: r[5] };
    })
  ];

  /* ---------------------------------------------------------------------------
     Abweichungen Version 1.19 (nur zum Gegenrechnen bestehender Bilanzen).
     Erfasst sind die bekannten Änderungen in Tab. 5 zwischen 1.19 und 1.20.
     --------------------------------------------------------------------------- */
  var V119 = {
    kuerbis: { n: 130, p: 20, k: 100, mg: 10 },
    zucchetti_sommer: { n: 130, p: 20, k: 100, mg: 10 },
    zucchetti_kurz: { n: 130, p: 20, k: 100, mg: 10 },
    zucchetti_gesaet: { n: 130, p: 20, k: 100, mg: 10 }
  };

  /* Nährstoffgehalte Ernterückstände Gemüse, kg pro t Frischsubstanz (Kap. 3.9) */
  var ERNTERUECKSTAENDE = { nges: 3.3, p: 0.9, k: 4.0, mg: 0.6 };

  /* Konstanten der Referenzmethode */
  var K = {
    AUSNUTZUNG_BASIS: 60,          // % N-Ausnutzungsgrad Hofdünger
    AUSNUTZUNG_OA: 0.15,           // % Abzug je % offene Ackerfläche
    AUSNUTZUNG_VOLLMIST: 0.12,     // % Abzug je % Vollmist-Nges
    VERG_BASIS: 65,                // % Ausnutzungsgrad Gärgülle/Gärdünngülle
    VERG_OA: 0.15,                 // % Abzug je % offene Ackerfläche
    VERG_FEST: 0.20,               // Ausnutzungsgrad feste Vergärungsprodukte
    KOMPOST_NVERF: 0.10,           // Anteil Nges als Nverf bei Kompost
    LAUFHOF_ANTEIL: 0.1,           // 1/10 der Exkremente fallen im Laufhof an
    LAUFHOF_ABZUG: 0.5,            // 50 % des Laufhof-Nges wird abgezogen
    WEIDE_ABZUG: 0.7,              // 70 % des Weide-Nges wird abgezogen
    ARM_N: 0.6,                    // kg N Abzug je dt TS nährstoffarmes GF
    ARM_P: 0.1,                    // kg P2O5 Abzug je dt TS nährstoffarmes GF
    TRANSFER_PRO_DT: 0.4,          // kg P2O5 je dt TS ungedüngtes GF
    TRANSFER_MAX_ANTEIL: 0.25,     // max. 1/4 des GFprod
    GF_LAGERVERLUST: 5,            // % Lagerungs- und Krippenverluste
    GF_LAGERVERLUST_VIEHLOS: 2.5,  // % max. für viehlose Betriebe
    GF_FEHLERBEREICH: 5,           // % max. Fehlerbereich
    SCHLEPPSCHLAUCH_N: 6,          // kg Nverf je ha emissionsmindernd begüllte Fläche
    WEIDE_STD_MAX_LAUFHOF: 12,     // > 12 h Weide → kein zusätzlicher Laufhofabzug
    UEBRIGE_ACKER_REDUKTION: 0.8   // N-Reduktion erst ab 20 % unter Standardertrag
  };

  /* DGVE-Grenzwerte für die Befreiung von der Bilanzpflicht (Ziff. 2.6) */
  var DGVE_GRENZEN = { "31": 2.0, "41": 1.6, "51": 1.4, "52": 1.1, "53": 0.9, "54": 0.8 };
  var ZONEN = [
    { id: "31", label: "Talzone" }, { id: "41", label: "Hügelzone" },
    { id: "51", label: "Bergzone I" }, { id: "52", label: "Bergzone II" },
    { id: "53", label: "Bergzone III" }, { id: "54", label: "Bergzone IV" }
  ];

  var API = {
    TIERE: TIERE, KULTUREN: KULTUREN, HOEHENLAGEN: HOEHENLAGEN, W: W,
    MILCHKUH_KORR: MILCHKUH_KORR, RVMAST_KORR: RVMAST_KORR,
    V119: V119, ERNTERUECKSTAENDE: ERNTERUECKSTAENDE, K: K,
    DGVE_GRENZEN: DGVE_GRENZEN, ZONEN: ZONEN,
    tier: function (id) { for (var i = 0; i < TIERE.length; i++) if (TIERE[i].id === id) return TIERE[i]; return null; },
    kultur: function (id) { for (var i = 0; i < KULTUREN.length; i++) if (KULTUREN[i].id === id) return KULTUREN[i]; return null; },
    hoehenlage: function (id) { for (var i = 0; i < HOEHENLAGEN.length; i++) if (HOEHENLAGEN[i].id === id) return HOEHENLAGEN[i]; return HOEHENLAGEN[0]; }
  };

  root.SBDaten = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
