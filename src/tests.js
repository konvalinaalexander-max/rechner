/* =============================================================================
   Nährstoffbilanz – Testsuite
   Prüft den Rechenkern gegen:
   (A) die Rechenbeispiele der Wegleitung 1.20 (Kap. 3.5, 3.6, 3.7, Tab. 2b–2e)
   (B) die gerechnete Suisse-Bilanz des Betriebs (Version 1.19) – 21 Kennwerte
   (C) Invarianten und Grenzfälle (Robustheit gegen Fehleingaben)
   Läuft identisch in Node (test/run.js) und im Browser (Register «Prüfung»).
   ============================================================================= */
(function (root) {
  "use strict";

  var D = root.SBDaten || (typeof require !== "undefined" ? require("./daten.js") : null);
  var E = root.SBEngine || (typeof require !== "undefined" ? require("./engine.js") : null);
  var V = root.SBVorlage || (typeof require !== "undefined" ? require("./vorlage.js") : null);

  function suite() {
    var tests = [];
    function t(gruppe, name, ist, soll, tol) {
      tol = tol === undefined ? 0.5 : tol;
      var ok = Math.abs(ist - soll) <= tol;
      tests.push({ gruppe: gruppe, name: name, ist: ist, soll: soll, tol: tol, ok: ok });
    }
    function tBool(gruppe, name, bedingung, beschreibung) {
      tests.push({ gruppe: gruppe, name: name, ist: bedingung ? "erfüllt" : "verletzt", soll: beschreibung || "erfüllt", ok: !!bedingung, boolean: true });
    }

    /* =====================================================================
       (A) Rechenbeispiele der Wegleitung 1.20
       ===================================================================== */
    var G = "Wegleitung 1.20 – Rechenbeispiele";

    /* Kap. 3.5 – Laufhof: 15 Mutterkühe leicht (Nges 57.6), 185 Laufhoftage */
    var lh = 15 * 185 * 57.60 * D.K.LAUFHOF_ANTEIL / 365;
    t(G, "Laufhof-Nges (15 Mutterkühe leicht, 185 Tage)", lh, 43.8, 0.1);

    /* Kap. 3.5 – Weide: 15 Mutterkühe leicht, 180 Tage à 12 h */
    var wd = 15 * 12 * 180 * 57.60 / (24 * 365);
    t(G, "Weide-Nges (15 Mutterkühe leicht, 180 Tage à 12 h)", wd, 213.0, 0.5);

    /* Kap. 3.6 – Anteil Vollmist, Beispiel 1: A1 1850, V1 290, A3 −400, V2 −160 */
    var vm1 = 100 * (290 + -160) / (1850 + -400);
    t(G, "Anteil Vollmist-Nges Beispiel 1", vm1, 9, 0.5);
    /* Beispiel 2: A1 250, V1 0, A3 +1400, V2 +1400 */
    var vm2 = 100 * (0 + 1400) / (250 + 1400);
    t(G, "Anteil Vollmist-Nges Beispiel 2", vm2, 85, 0.5);

    /* Tab. 2b/2c – Milchkuh GF-Verzehr, Beispiel 1: 8'500 kg Milch, 1'500 kg KF */
    var mk1 = E.tierWerte({ tier: "milchkuh", anzahl: 1, milchkg: 8500, kfkg: 1500 });
    t(G, "Milchkuh 8'500 kg / 1'500 kg KF – Standard-KF", mk1.kfStandard, 1126, 1);
    t(G, "Milchkuh 8'500 kg / 1'500 kg KF – GF nach Milch", mk1.gfMilchkorrigiert, 57.1, 0.05);
    t(G, "Milchkuh 8'500 kg / 1'500 kg KF – KF-Korrektur", mk1.gfKfKorrektur, -4.5, 0.05);
    t(G, "Milchkuh 8'500 kg / 1'500 kg KF – GF total", mk1.gf, 52.6, 0.05);
    /* Beispiel 2: 5'200 kg Milch, 200 kg KF */
    var mk2 = E.tierWerte({ tier: "milchkuh", anzahl: 1, milchkg: 5200, kfkg: 200 });
    t(G, "Milchkuh 5'200 kg / 200 kg KF – Standard-KF", mk2.kfStandard, 260, 1);
    t(G, "Milchkuh 5'200 kg / 200 kg KF – GF nach Milch", mk2.gfMilchkorrigiert, 51.2, 0.05);
    t(G, "Milchkuh 5'200 kg / 200 kg KF – GF total", mk2.gf, 51.9, 0.05);
    /* Tab. 2a – Nährstoffanfall Milchkuh: −0.48 kg Nges je 100 kg unter 7'500 */
    t(G, "Milchkuh 5'200 kg – Nges korrigiert", mk2.nges, 95.20 - 23 * 0.48, 0.01);
    /* KF-Korrektur darf den Nährstoffanfall NICHT verändern */
    var mkA = E.tierWerte({ tier: "milchkuh", anzahl: 1, milchkg: 8500, kfkg: 500 });
    var mkB = E.tierWerte({ tier: "milchkuh", anzahl: 1, milchkg: 8500, kfkg: 2500 });
    tBool(G, "KF-Verzehr verändert den Nährstoffanfall nicht", Math.abs(mkA.nges - mkB.nges) < 1e-9, "Nges identisch");
    tBool(G, "KF-Verzehr verändert den GF-Verzehr", Math.abs(mkA.gf - mkB.gf) > 1, "GF unterschiedlich");

    /* Tab. 2d – Rindviehmast > 160 d: TZW 1'300 g, Ausstall-LG 460 kg → P2O5 11.62 */
    var rv = E.tierWerte({ tier: "rvmast_160p", anzahl: 1, tzw: 1300, ausstallLG: 460 });
    t(G, "Rindviehmast TZW 1'300 / LG 460 – P₂O₅", rv.p, 11.62, 0.01);
    /* Gültigkeitsbereich wird begrenzt */
    var rvClamp = E.tierWerte({ tier: "rvmast_160p", anzahl: 1, tzw: 2000, ausstallLG: 700 });
    var rvMax = E.tierWerte({ tier: "rvmast_160p", anzahl: 1, tzw: 1500, ausstallLG: 580 });
    t(G, "Rindviehmast ausserhalb Gültigkeitsbereich wird begrenzt", rvClamp.nges, rvMax.nges, 0.001);

    /* Tab. 2e – Milchschaf 450 kg (2 Schritte unter 500) */
    var ms = E.tierWerte({ tier: "milchschaf", anzahl: 1, milchkg: 450 });
    t(G, "Milchschaf 450 kg – Nges", ms.nges, 13.66 - 2 * 0.50, 0.001);
    t(G, "Milchschaf 450 kg – GF-Verzehr", ms.gf, 9.3 - 2 * 0.20, 0.001);
    t(G, "Milchschaf 450 kg – P₂O₅", ms.p, 6.6 - 2 * 0.16, 0.001);

    /* Kap. 3.7 – ertragsabhängige N-Korrektur Winterweizen (Standard 60, Faktor 1.0, max 80) */
    var ww = D.kultur("wweizen");
    [[85, 160], [75, 155], [60, 140], [50, 130]].forEach(function (f) {
      var r = E.kulturBedarf(ww, 1, f[0], true);
      t(G, "Winterweizen " + f[0] + " dt/ha → N-Bedarf kg/ha", r.nProHa, f[1], 0.01);
    });
    /* Kap. 3.7 – übrige Ackerkulturen: Zuckerrüben (Standard 900, Norm 100) */
    var zr = D.kultur("zuckerrueben");
    [[1080, 100], [900, 100], [747, 100], [675, 75]].forEach(function (f) {
      var r = E.kulturBedarf(zr, 1, f[0], false);
      t(G, "Zuckerrüben " + f[0] + " dt/ha → N-Bedarf kg/ha", r.nProHa, f[1], 0.5);
    });
    /* Silomais: Standard 185, Faktor 0.7, max 230 */
    t(G, "Silomais 230 dt/ha → N-Bedarf kg/ha", E.kulturBedarf(D.kultur("silomais"), 1, 230, true).nProHa, 110 + 45 * 0.7, 0.01);
    t(G, "Silomais 260 dt/ha (über Max) → N-Bedarf gedeckelt", E.kulturBedarf(D.kultur("silomais"), 1, 260, true).nProHa, 110 + 45 * 0.7, 0.01);

    /* Kap. 3.9 – Ausnutzungsgrad Vergärungsprodukte */
    var sVerg = V.leer();
    sVerg.betrieb.ln = 100; sVerg.betrieb.oa = 50;
    sVerg.vergaerung = [{ name: "Gärgülle", typ: "fluessig", richtung: "zufuhr", nges: 1000, p: 100 }];
    var rVerg = E.berechne(sVerg);
    t(G, "Ausnutzungsgrad Gärgülle bei 50 % OA", rVerg.ausnutzVerg * 100, 65 - 0.15 * 50, 0.001);
    t(G, "Nverf Gärgülle 1'000 kg Nges bei 50 % OA", rVerg.E.nverf, 1000 * (65 - 7.5) / 100, 0.01);
    var sFest = V.leer(); sFest.betrieb.ln = 100; sFest.betrieb.oa = 50;
    sFest.vergaerung = [{ name: "Gärmist", typ: "fest", richtung: "zufuhr", nges: 1000, p: 100 }];
    t(G, "Nverf feste Vergärungsprodukte (20 %, keine OA-Reduktion)", E.berechne(sFest).E.nverf, 200, 0.01);

    /* Kap. 3.8 – Kompost: 10 % des Nges als Nverf */
    var sKomp = V.leer(); sKomp.betrieb.ln = 10;
    sKomp.duenger = [{ name: "Kompost", typ: "kompost", nges: 1000, p: 50 }];
    t(G, "Kompost 1'000 kg Nges → Nverf", E.berechne(sKomp).D.nverf, 100, 0.01);

    /* Kap. 3.8 – emissionsmindernde Ausbringung: 6 kg Nverf/ha */
    var sSchlepp = V.leer(); sSchlepp.betrieb.ln = 10; sSchlepp.schleppschlauchHa = 5.5;
    t(G, "Schleppschlauch 5.5 ha → 33 kg Nverf", E.berechne(sSchlepp).D.nverf, 33, 0.01);

    /* Kap. 3.4 – innerbetrieblicher Transfer: 0.4 kg P₂O₅/dt TS, max ¼ des GFprod */
    var sT = V.leer();
    sT.betrieb.ln = 100;
    sT.tiere = [{ tier: "mutterkuh_m", anzahl: 100, vollmist: 0 }];      // GF-Verzehr 4'500 dt TS
    sT.gfVerlust = 0; sT.gfFehler = 0;
    sT.kulturen = [{ kultur: "wi_ext", flaeche: 100, ertrag: 25 }];       // 2'500 dt TS ungedüngt
    var rT = E.berechne(sT);
    t(G, "Transfer T gedeckelt auf ¼ des GFprod", rT.T, 0.4 * (4500 / 4), 0.01);
    var sT2 = JSON.parse(JSON.stringify(sT));
    sT2.kulturen = [{ kultur: "wi_ext", flaeche: 10, ertrag: 25 }];       // nur 250 dt TS ungedüngt
    t(G, "Transfer T unter dem Deckel = 0.4 × dt TS", E.berechne(sT2).T, 0.4 * 250, 0.01);

    /* =====================================================================
       (B) Gerechnete Suisse-Bilanz des Betriebs (Version 1.19)
       ===================================================================== */
    var GB = "Betriebsbilanz – Sollwerte Version 1.19";
    var sb = V.betrieb();
    sb.version = "1.19";
    var r = E.berechne(sb);
    [
      ["Grundfutterverzehr Tiere (A1)", r.A1.gf, 3142, 3],
      ["Nges Tierhaltung (A1)", r.A1.nges, 4609, 3],
      ["P₂O₅ Tierhaltung (A1)", r.A1.p, 2259, 3],
      ["Nährstoffarmes Grundfutter (dt TS)", r.gfArm, 1371, 3],
      ["Nges nach Abzügen (A2)", r.A2.nges, 3778, 3],
      ["P₂O₅ nach Abzügen (A2)", r.A2.p, 2122, 3],
      ["Nges Hofdünger (A3)", r.A3.nges, 2310, 1],
      ["P₂O₅ Hofdünger (A3)", r.A3.p, 1698, 1],
      ["Vollmist-Nges Betrieb (V1)", r.V1, 2953, 3],
      ["Anteil Vollmist (%)", r.vollmistProz, 42.7, 0.1],
      ["Offene Ackerfläche (%)", r.oaProz, 54.6, 0.1],
      ["N-Ausnutzungsgrad (%)", r.ausnutzProz, 46.7, 0.1],
      ["Zu produzierendes Grundfutter (GFprod)", r.gfProd, 3620, 3],
      ["Nährstoffbedarf Kulturen N (C)", r.C.n, 12304, 10],
      ["Nährstoffbedarf Kulturen P₂O₅ (C)", r.C.p, 5142, 10],
      ["Innerbetrieblicher Transfer (T)", r.T, 140, 2],
      ["Nverf aus Tierhaltung (A2)", r.A2verf, 1764, 3],
      ["Nverf aus Hofdünger (A3)", r.A3verf, 1079, 3],
      ["Nverf übrige Dünger (D)", r.D.nverf, 5324, 1],
      ["Gesamtbilanz Nverf", r.bilN, -4137, 10],
      ["Gesamtbilanz P₂O₅", r.bilP, -1341, 10]
    ].forEach(function (x) { t(GB, x[0], x[1], x[2], x[3]); });

    tBool(GB, "Bilanz enthält keine Rechenfehler", r.fehler.length === 0, "0 Fehler");
    tBool(GB, "Stickstoffbilanz ausgeglichen", r.ausgeglichenN, "ausgeglichen");
    tBool(GB, "Phosphorbilanz ausgeglichen", r.ausgeglichenP, "ausgeglichen");

    /* Version 1.20 muss wegen geänderter Gemüse-Referenzwerte abweichen */
    var GV = "Versionsvergleich";
    var sb20 = V.betrieb();
    var r20 = E.berechne(sb20);
    tBool(GV, "Version 1.20 liefert andere Werte als 1.19 (Tab. 5 geändert)", Math.abs(r20.C.n - r.C.n) > 1, "Differenz vorhanden");
    t(GV, "Kürbis 12 ha: N-Mehrbedarf 1.20 gegenüber 1.19", (r20.C.n - r.C.n), 12 * (150 - 130), 0.5);
    t(GV, "Kürbis 12 ha: P₂O₅-Mehrbedarf 1.20 gegenüber 1.19", (r20.C.p - r.C.p), 12 * (60 - 20), 0.5);

    /* =====================================================================
       (C) Invarianten, Grenzfälle, Robustheit
       ===================================================================== */
    var GI = "Invarianten & Grenzfälle";

    /* Leerer Betrieb darf nicht abstürzen und liefert Nullen */
    var leer = E.berechne(V.leer());
    tBool(GI, "Leerer Betrieb rechnet ohne Absturz", isFinite(leer.bilN) && isFinite(leer.bilP), "endliche Werte");
    t(GI, "Leerer Betrieb: Bilanz N", leer.bilN, 0, 0.001);
    t(GI, "Leerer Betrieb: Bilanz P₂O₅", leer.bilP, 0, 0.001);
    t(GI, "Leerer Betrieb: Ausnutzungsgrad = Basiswert", leer.ausnutzProz, 60, 0.001);

    /* Fehleingaben (Text, null, undefined, negative Werte) dürfen kein NaN erzeugen */
    var sMuell = V.betrieb();
    sMuell.betrieb.ln = "abc"; sMuell.betrieb.oa = null;
    sMuell.tiere.push({ tier: "schaf", anzahl: "zwölf", laufhofTage: undefined, weideTage: "", weideStd: null, vollmist: 0 });
    sMuell.kulturen.push({ kultur: "wweizen", flaeche: "", ertrag: "keine Ahnung" });
    sMuell.grundfutter.push({ name: "Unfug", art: "zufuhr", menge: "x", tsProzent: "y" });
    sMuell.duenger.push({ name: "Unfug", nverf: "-", p: undefined });
    var rMuell = E.berechne(sMuell);
    var alleZahlen = [rMuell.bilN, rMuell.bilP, rMuell.C.n, rMuell.C.p, rMuell.A1.nges, rMuell.A2.nges,
      rMuell.gfProd, rMuell.T, rMuell.ausnutz, rMuell.vollmistProz, rMuell.oaProz];
    tBool(GI, "Fehleingaben erzeugen kein NaN/Infinity", alleZahlen.every(function (v) { return isFinite(v); }), "alle Werte endlich");

    /* Komma statt Punkt muss als Dezimaltrennzeichen akzeptiert werden */
    var sKomma = V.leer();
    sKomma.betrieb.ln = 10; sKomma.kulturen = [{ kultur: "wweizen", flaeche: "2,5", ertrag: "60" }];
    t(GI, "Dezimalkomma wird korrekt gelesen", E.berechne(sKomma).C.n, 2.5 * 140, 0.01);

    /* A2 darf nie negativ werden */
    var sNeg = V.leer();
    sNeg.betrieb.ln = 50;
    sNeg.tiere = [{ tier: "mutterkuh_m", anzahl: 10, laufhofTage: 365, weideTage: 365, weideStd: 24, vollmist: 0 }];
    sNeg.kulturen = [{ kultur: "wi_ext", flaeche: 50, ertrag: 30 }];
    var rNeg = E.berechne(sNeg);
    tBool(GI, "A2 Nges wird nie negativ", rNeg.A2.nges >= 0, "≥ 0");
    tBool(GI, "A2 P₂O₅ wird nie negativ", rNeg.A2.p >= 0, "≥ 0");

    /* Vollmistanteil immer zwischen 0 und 100 % – auch wenn rechnerisch mehr
       Vollmist deklariert wird als insgesamt Nges anfällt (Kap. 3.6). */
    var sVM = V.leer(); sVM.betrieb.ln = 20;
    sVM.tiere = [{ tier: "mutterkuh_m", anzahl: 10, vollmist: 100 }];   // A1 = 680, V1 = 680
    sVM.hofduenger = [
      { name: "Vollmist-Zufuhr", richtung: "zufuhr", nges: 5000, p: 100, vollmist: true },
      { name: "Gülle-Wegfuhr", richtung: "wegfuhr", nges: 4800, p: 80, vollmist: false }
    ];
    var rVM = E.berechne(sVM);   // V1+V2 = 5680 gegenüber Basis A1+A3 = 880 → muss gekappt werden
    tBool(GI, "Vollmistanteil bleibt zwischen 0 und 100 %", rVM.vollmistProz >= 0 && rVM.vollmistProz <= 100, "0–100 %");
    t(GI, "Übermässiger Vollmist wird auf 100 % gekappt", rVM.vollmistProz, 100, 0.001);
    /* Negativer Vollmistsaldo darf nicht unter 0 % fallen */
    var sVMn = V.leer(); sVMn.betrieb.ln = 20;
    sVMn.tiere = [{ tier: "mutterkuh_m", anzahl: 10, vollmist: 0 }];
    sVMn.hofduenger = [{ name: "Vollmist-Wegfuhr", richtung: "wegfuhr", nges: 300, p: 50, vollmist: true }];
    t(GI, "Negativer Vollmistsaldo wird auf 0 % gekappt", E.berechne(sVMn).vollmistProz, 0, 0.001);

    /* Laufhofabzug: exakt 50 % des im Laufhof anfallenden Nges (Kap. 3.5) */
    var sLH = V.leer(); sLH.betrieb.ln = 50;
    sLH.tiere = [{ tier: "mutterkuh_m", anzahl: 100, laufhofTage: 365, weideTage: 0, weideStd: 0, vollmist: 0 }];
    var rLH = E.berechne(sLH);
    t(GI, "Laufhof-Nges bei ganzjähriger Laufhofhaltung", rLH.laufhofN, 100 * 68 * 0.1, 0.01);
    t(GI, "Laufhofabzug beträgt 50 % des Laufhof-Nges", rLH.abzLaufhof, 0.5 * rLH.laufhofN, 0.001);
    t(GI, "A2 nach Laufhofabzug (100 Mutterkühe, 365 Tage)", rLH.A2.nges, 6800 - 340, 0.01);

    /* Weideabzug: exakt 70 % des auf der Weide anfallenden Nges (Kap. 3.5) */
    var sWE = V.leer(); sWE.betrieb.ln = 50;
    sWE.tiere = [{ tier: "mutterkuh_m", anzahl: 100, laufhofTage: 0, weideTage: 365, weideStd: 12, vollmist: 0 }];
    var rWE = E.berechne(sWE);
    t(GI, "Weide-Nges bei ganzjähriger Weide à 12 h", rWE.weideN, 100 * 68 * 12 / 24, 0.01);
    t(GI, "Weideabzug beträgt 70 % des Weide-Nges", rWE.abzWeide, 0.7 * rWE.weideN, 0.001);
    t(GI, "A2 nach Weideabzug (100 Mutterkühe, 365 Tage à 12 h)", rWE.A2.nges, 6800 - 0.7 * 3400, 0.01);

    /* Ausnutzungsgrad nie negativ (extreme OA + Vollmist) */
    var sAus = V.leer(); sAus.betrieb.ln = 100; sAus.betrieb.oa = 100;
    sAus.tiere = [{ tier: "mutterkuh_m", anzahl: 50, vollmist: 100 }];
    var rAus = E.berechne(sAus);
    tBool(GI, "N-Ausnutzungsgrad bleibt ≥ 0", rAus.ausnutzProz >= 0, "≥ 0");
    t(GI, "N-Ausnutzungsgrad bei 100 % OA und 100 % Vollmist", rAus.ausnutzProz, 60 - 15 - 12, 0.1);

    /* Wegfuhr Hofdünger reduziert A3 korrekt (Vorzeichen) */
    var sWeg = V.leer(); sWeg.betrieb.ln = 10;
    sWeg.hofduenger = [
      { name: "Zufuhr", richtung: "zufuhr", nges: 1000, p: 500, vollmist: false },
      { name: "Wegfuhr", richtung: "wegfuhr", nges: 400, p: 200, vollmist: false }
    ];
    var rWeg = E.berechne(sWeg);
    t(GI, "Hofdünger-Saldo Nges (1'000 zu, 400 weg)", rWeg.A3.nges, 600, 0.01);
    t(GI, "Hofdünger-Saldo P₂O₅ (500 zu, 200 weg)", rWeg.A3.p, 300, 0.01);
    /* Wegfuhr wird auch dann als Abzug gerechnet, wenn der Betrag positiv eingegeben wird */
    var sWeg2 = V.leer(); sWeg2.betrieb.ln = 10;
    sWeg2.hofduenger = [{ name: "Wegfuhr", richtung: "wegfuhr", nges: -400, p: -200, vollmist: false }];
    t(GI, "Wegfuhr mit negativer Eingabe bleibt Wegfuhr", E.berechne(sWeg2).A3.nges, -400, 0.01);

    /* Grundfutter: Wegfuhr erhöht, Zufuhr senkt das zu produzierende GF */
    var sGF = V.leer(); sGF.betrieb.ln = 10;
    sGF.tiere = [{ tier: "mutterkuh_m", anzahl: 10, vollmist: 0 }];  // 450 dt TS
    sGF.gfVerlust = 0; sGF.gfFehler = 0;
    sGF.grundfutter = [
      { name: "Wegfuhr", art: "wegfuhr", menge: 100, tsProzent: 35 },
      { name: "Zufuhr", art: "zufuhr", menge: 100, tsProzent: 88 },
      { name: "Ausserhalb FF", art: "ausserFF", menge: 100, tsProzent: 30 }
    ];
    t(GI, "Netto-GF-Bedarf mit Zu-/Wegfuhr", E.berechne(sGF).nettoGF, 450 + 35 - 88 - 30, 0.01);
    /* Zuschläge Lager + Fehlerbereich */
    var sGF2 = JSON.parse(JSON.stringify(sGF));
    sGF2.gfVerlust = 5; sGF2.gfFehler = 5;
    t(GI, "GFprod mit 5 % Lager- und 5 % Fehlerzuschlag", E.berechne(sGF2).gfProd, (450 + 35 - 88 - 30) * 1.10, 0.01);

    /* Geflügel: kein Weideabzug */
    var sGefl = V.leer(); sGefl.betrieb.ln = 10;
    sGefl.tiere = [{ tier: "legehenne_band", anzahl: 10, weideTage: 200, weideStd: 8, laufhofTage: 100, vollmist: 100 }];
    var rGefl = E.berechne(sGefl);
    t(GI, "Geflügel: kein Weideabzug", rGefl.weideN, 0, 0.001);
    tBool(GI, "Geflügel: Laufhofabzug bleibt zulässig", rGefl.laufhofN > 0, "> 0");

    /* Weide > 12 h/Tag: kein zusätzlicher Laufhofabzug für dieselben Tage */
    var sW12 = V.leer(); sW12.betrieb.ln = 10;
    sW12.tiere = [{ tier: "mutterkuh_m", anzahl: 10, weideTage: 200, weideStd: 14, laufhofTage: 200, vollmist: 0 }];
    t(GI, "Weide > 12 h: Laufhoftage vollständig verrechnet", E.berechne(sW12).laufhofN, 0, 0.001);
    var sW10 = V.leer(); sW10.betrieb.ln = 10;
    sW10.tiere = [{ tier: "mutterkuh_m", anzahl: 10, weideTage: 200, weideStd: 10, laufhofTage: 200, vollmist: 0 }];
    tBool(GI, "Weide ≤ 12 h: Laufhofabzug bleibt bestehen", E.berechne(sW10).laufhofN > 0, "> 0");

    /* Mastpoulets: max. 180 Laufhoftage */
    var sMP = V.leer(); sMP.betrieb.ln = 10;
    sMP.tiere = [{ tier: "mastpoulet", anzahl: 10, laufhofTage: 365, vollmist: 100 }];
    var sMP180 = V.leer(); sMP180.betrieb.ln = 10;
    sMP180.tiere = [{ tier: "mastpoulet", anzahl: 10, laufhofTage: 180, vollmist: 100 }];
    t(GI, "Mastpoulets: Laufhoftage auf 180 begrenzt", E.berechne(sMP).laufhofN, E.berechne(sMP180).laufhofN, 0.001);

    /* Laufstall Rindvieh: Nges LSR statt Nges */
    var sLS = V.leer(); sLS.betrieb.ln = 10;
    sLS.tiere = [{ tier: "jungvieh_12", anzahl: 10, vollmist: 0, laufstall: true }];
    t(GI, "Laufstall Rindvieh nutzt Nges LSR", E.berechne(sLS).A1.nges, 10 * 34.00, 0.01);
    var sAB = V.leer(); sAB.betrieb.ln = 10;
    sAB.tiere = [{ tier: "jungvieh_12", anzahl: 10, vollmist: 0 }];
    t(GI, "Anbindehaltung nutzt Standard-Nges", E.berechne(sAB).A1.nges, 10 * 36.13, 0.01);

    /* Vollmist berücksichtigt nur den im Stall anfallenden Nges */
    var sVM2 = V.leer(); sVM2.betrieb.ln = 10;
    sVM2.tiere = [{ tier: "mutterkuh_l", anzahl: 15, laufhofTage: 185, weideTage: 180, weideStd: 12, vollmist: 100 }];
    var rVM2 = E.berechne(sVM2);
    t(GI, "Vollmist = Nges − Laufhof − Weide", rVM2.V1, rVM2.A1.nges - rVM2.laufhofN - rVM2.weideN, 0.01);
    /* Typ 50 = halber Stallanfall */
    var sVM50 = JSON.parse(JSON.stringify(sVM2)); sVM50.tiere[0].vollmist = 50;
    t(GI, "Vollmist Typ 50 = halber Stallanfall", E.berechne(sVM50).V1, rVM2.V1 / 2, 0.01);
    var sVM0 = JSON.parse(JSON.stringify(sVM2)); sVM0.tiere[0].vollmist = 0;
    t(GI, "Vollmist Typ 0 = kein Vollmist", E.berechne(sVM0).V1, 0, 0.001);

    /* Saldo-Ertrag: intensive Wiesen als Restgrösse aus der Grundfutterbilanz */
    var sSaldo = V.leer(); sSaldo.betrieb.ln = 30;
    sSaldo.tiere = [{ tier: "mutterkuh_m", anzahl: 10, vollmist: 0 }];   // 450 dt TS
    sSaldo.gfVerlust = 0; sSaldo.gfFehler = 0;
    sSaldo.kulturen = [
      { kultur: "wi_ext", flaeche: 5, ertrag: 20 },                       // 100 dt TS fix
      { kultur: "wi_int", flaeche: 10, ertragModus: "saldo" }             // Rest: 350 / 10 = 35
    ];
    var rSaldo = E.berechne(sSaldo);
    t(GI, "Saldo-Ertrag intensive Wiese", rSaldo.saldoErtrag, 35, 0.01);
    t(GI, "Saldo deckt die Grundfutterbilanz exakt", rSaldo.gfKulturenTS, rSaldo.gfProd, 0.01);

    /* Nährstoffarmes GF senkt den Anfall in A2 */
    var sArm = V.leer(); sArm.betrieb.ln = 20;
    sArm.tiere = [{ tier: "mutterkuh_m", anzahl: 10, vollmist: 0 }];
    sArm.kulturen = [{ kultur: "wi_ext", flaeche: 10, ertrag: 25 }];      // 250 dt TS arm
    var rArm = E.berechne(sArm);
    t(GI, "Abzug nährstoffarmes GF – N", rArm.abzArmN, 250 * 0.6, 0.01);
    t(GI, "Abzug nährstoffarmes GF – P₂O₅", rArm.abzArmP, 250 * 0.1, 0.01);
    t(GI, "A2 = A1 − Abzug nährstoffarm", rArm.A2.nges, rArm.A1.nges - 250 * 0.6, 0.01);

    /* Gesamtbilanz-Identität: F = A2 − C + A3 + D + E − T */
    var rB = E.berechne(V.betrieb());
    t(GI, "Bilanzidentität N: A2verf − C + A3verf + D + E", rB.bilN,
      rB.A2verf - rB.C.n + rB.A3verf + rB.D.nverf + rB.E.nverf, 0.001);
    t(GI, "Bilanzidentität P₂O₅: A2 − C + A3 + D + E − T", rB.bilP,
      rB.A2.p - rB.C.p + rB.A3.p + rB.D.p + rB.E.p - rB.T, 0.001);
    /* Teilsummen C1+C2+C3+BFF müssen das Total C ergeben */
    t(GI, "C1 + C2 + C3 + BFF = C (Stickstoff)", rB.C1.n + rB.C2.n + rB.C3.n + rB.CB.n, rB.C.n, 0.001);
    t(GI, "C1 + C2 + C3 + BFF = C (Phosphor)", rB.C1.p + rB.C2.p + rB.C3.p + rB.CB.p, rB.C.p, 0.001);
    /* Summe der Tierzeilen muss A1 ergeben */
    var sumNges = rB.tierRows.reduce(function (a, x) { return a + x.nges; }, 0);
    var sumGf = rB.tierRows.reduce(function (a, x) { return a + x.gf; }, 0);
    t(GI, "Summe Tierzeilen = A1 Nges", sumNges, rB.A1.nges, 0.001);
    t(GI, "Summe Tierzeilen = A1 Grundfutterverzehr", sumGf, rB.A1.gf, 0.001);
    /* Summe der Kulturzeilen muss C ergeben */
    var sumCn = rB.kultRows.reduce(function (a, x) { return a + x.n; }, 0);
    t(GI, "Summe Kulturzeilen = C Stickstoff", sumCn, rB.C.n, 0.001);

    /* Linearität: doppelter Tierbestand → doppelter Anfall */
    var sLin1 = V.leer(); sLin1.betrieb.ln = 10;
    sLin1.tiere = [{ tier: "schaf", anzahl: 50, vollmist: 0 }];
    var sLin2 = V.leer(); sLin2.betrieb.ln = 10;
    sLin2.tiere = [{ tier: "schaf", anzahl: 100, vollmist: 0 }];
    t(GI, "Doppelter Tierbestand → doppelter Nges-Anfall",
      E.berechne(sLin2).A1.nges, 2 * E.berechne(sLin1).A1.nges, 0.001);

    /* Eigene Kulturen und Tiere mit selbst gepflegten Referenzwerten */
    var sEigen = V.leer(); sEigen.betrieb.ln = 10;
    sEigen.kulturen = [{ eigen: { label: "Eigene Kultur", modus: "flach", n: 100, p: 50, k: 80, mg: 10, bereich: "ackerbau" }, flaeche: 3 }];
    sEigen.tiere = [{ eigen: { label: "Eigene Kategorie", einheit: "Pl", gf: 10, nges: 20, p: 8, k: 30, mg: 2, raufutter: true }, anzahl: 5, vollmist: 0 }];
    var rEigen = E.berechne(sEigen);
    t(GI, "Eigene Kultur: N-Bedarf", rEigen.C.n, 300, 0.01);
    t(GI, "Eigene Tierkategorie: Nges", rEigen.A1.nges, 100, 0.01);
    t(GI, "Eigene Tierkategorie: Grundfutterverzehr", rEigen.A1.gf, 50, 0.01);

    /* Überschriebene Referenzwerte (z. B. neue Wegleitungsversion) */
    var sOv = V.leer(); sOv.betrieb.ln = 10;
    sOv.kulturen = [{ kultur: "zwiebeln", flaeche: 2, override: { n: 999 } }];
    t(GI, "Überschriebener Referenzwert wird verwendet", E.berechne(sOv).C.n, 1998, 0.01);

    /* Ertragskorrektur abschaltbar */
    var sNoKorr = V.leer(); sNoKorr.betrieb.ln = 10;
    sNoKorr.kulturen = [{ kultur: "wweizen", flaeche: 1, ertrag: 80, ertragKorrektur: false }];
    t(GI, "Abgeschaltete Ertragskorrektur nutzt die Norm", E.berechne(sNoKorr).C.n, 140, 0.01);

    /* Referenzdaten-Integrität */
    var GD = "Referenzdaten";
    var idsT = {}, dupT = 0;
    D.TIERE.forEach(function (x) { if (idsT[x.id]) dupT++; idsT[x.id] = 1; });
    tBool(GD, "Tierkategorien haben eindeutige Kennungen", dupT === 0, "keine Doubletten");
    var idsK = {}, dupK = 0;
    D.KULTUREN.forEach(function (x) { if (idsK[x.id]) dupK++; idsK[x.id] = 1; });
    tBool(GD, "Kulturen haben eindeutige Kennungen", dupK === 0, "keine Doubletten");
    var badT = D.TIERE.filter(function (x) {
      return !x.label || !isFinite(x.nges) || !isFinite(x.p) || !isFinite(x.gf) || x.nges < 0 || x.p < 0;
    });
    tBool(GD, "Alle Tierkategorien haben gültige Werte", badT.length === 0, "0 fehlerhaft");
    var badK = D.KULTUREN.filter(function (x) {
      return !x.label || (x.modus !== "null" && (!isFinite(x.n) || !isFinite(x.p) || x.n < 0 || x.p < 0));
    });
    tBool(GD, "Alle Kulturen haben gültige Werte", badK.length === 0, "0 fehlerhaft");
    var badKorr = D.KULTUREN.filter(function (x) { return x.korr && (!(x.korr.max > x.korr.std) || !(x.korr.kf > 0)); });
    tBool(GD, "Ertragskorrekturen sind schlüssig (max > Standard)", badKorr.length === 0, "0 fehlerhaft");
    tBool(GD, "Jede Kultur ist einem Bereich zugeordnet", D.KULTUREN.every(function (x) {
      return ["futterbau", "ackerbau", "spezial", "bff"].indexOf(x.bereich) >= 0;
    }), "alle zugeordnet");
    /* Jede Kultur muss rechenbar sein */
    var unrechenbar = D.KULTUREN.filter(function (x) {
      var res = E.kulturBedarf(x, 1, E.standardErtrag(x, "h600"), true);
      return !isFinite(res.n) || !isFinite(res.p) || !isFinite(res.k) || !isFinite(res.mg);
    });
    tBool(GD, "Alle " + D.KULTUREN.length + " Kulturen liefern endliche Werte", unrechenbar.length === 0, "0 fehlerhaft");
    var unrechenbarT = D.TIERE.filter(function (x) {
      var w = E.tierWerte({ tier: x.id, anzahl: 1 });
      return !w || !isFinite(w.nges) || !isFinite(w.gf) || !isFinite(w.p);
    });
    tBool(GD, "Alle " + D.TIERE.length + " Tierkategorien liefern endliche Werte", unrechenbarT.length === 0, "0 fehlerhaft");

    /* Stichproben aus Tab. 1 – die im Betrieb verwendeten und häufigsten Kategorien */
    [
      ["milchkuh", 56, 95.20, 39], ["mutterkuh_m", 45, 68.00, 28], ["jungvieh_12", 26, 36.13, 14],
      ["pferd_gross", 28, 30.10, 21], ["pony", 10.4, 10.99, 8.2],
      ["milchschaf", 9.3, 13.66, 6.6], ["schaf", 6.5, 8.11, 3.8], ["jungschaf", 4.9, 8.36, 3.5],
      ["lamm", 1.4, 2.85, 1.5], ["milchziege", 6.2, 7.87, 3.6], ["ziege", 5.7, 6.96, 3.3],
      ["mastschwein_pl", 0, 10.40, 5.3], ["legehenne_band", 0, 56.00, 46]
    ].forEach(function (x) {
      var tk = D.tier(x[0]);
      t(GD, "Tab. 1 – " + tk.label + ": GF/Nges/P₂O₅",
        tk.gf * 1e6 + tk.nges * 1e3 + tk.p, x[1] * 1e6 + x[2] * 1e3 + x[3], 0.001);
    });
    /* Stichproben aus Tab. 4/5/6 */
    [
      ["wweizen", 140, 0.83], ["dinkel", 100, 0.80], ["silomais", 110, 0.58],
      ["zuckerrueben", 100, 0.06], ["kart_speise_c", 160, 0.16], ["kart_pflanz_b", 100, 0.19],
      ["fenchel", 160, 30], ["zwiebeln", 130, 60], ["salate_mittel", 90, 20],
      ["kuerbis", 150, 60], ["lauch", 200, 40], ["kraeuter_mittel", 70, 30],
      ["gwh_tomaten_1800", 250, 100], ["erdbeeren_1j_20", 100, 34]
    ].forEach(function (x) {
      var kk = D.kultur(x[0]);
      t(GD, "Tab. 4–6 – " + kk.label + ": N/P₂O₅", kk.n * 1e3 + kk.p, x[1] * 1e3 + x[2], 0.001);
    });

    /* Prüfsumme über sämtliche Referenzwerte: schlägt bei jeder unbeabsichtigten
       Änderung an Tab. 1 bzw. Tab. 3–6 an. Bei einer neuen Wegleitungsversion
       müssen diese beiden Sollwerte bewusst nachgeführt werden. */
    function digest(arr, felder) {
      var s = 0;
      arr.forEach(function (x, i) {
        felder.forEach(function (f, j) {
          var v = x[f];
          if (typeof v === "number" && isFinite(v)) s += v * (i + 1) * (j + 7);
        });
      });
      return Math.round(s * 1000) / 1000;
    }
    t(GD, "Prüfsumme Tierwerte (Tab. 1) unverändert",
      digest(D.TIERE, ["gf", "n", "nges", "ngesLSR", "p", "k", "mg"]), 2844369.59, 0.02);
    t(GD, "Prüfsumme Kulturwerte (Tab. 3–6) unverändert",
      digest(D.KULTUREN, ["n", "p", "k", "mg", "ertragStd", "ertragRef"]), 186757450.64, 0.02);
    var dHoehe = 0;
    D.HOEHENLAGEN.forEach(function (h, i) {
      ["wiese", "weide"].forEach(function (a, j) {
        ["int", "mittel", "wenig"].forEach(function (st, m) { dHoehe += h[a][st] * (i + 1) * (j + 3) * (m + 5); });
      });
    });
    t(GD, "Prüfsumme Wiesen-/Weideerträge nach Höhenlage (Tab. 3)", dHoehe, 210715, 0.02);
    var dW = 0, iW = 0;
    Object.keys(D.W).forEach(function (key) {
      ["n", "p", "k", "mg"].forEach(function (f, j) { dW += D.W[key][f] * (++iW) * (j + 3); });
    });
    t(GD, "Prüfsumme Nährstoffbedarf Wiesen kg/dt (Tab. 3)", dW, 518.15, 0.002);
    t(GD, "Anzahl Tierkategorien", D.TIERE.length, 69, 0);
    t(GD, "Anzahl Kulturen", D.KULTUREN.length, 253, 0);
    t(GD, "Anzahl Höhenlagen-Klassen", D.HOEHENLAGEN.length, 7, 0);

    /* Speichern/Laden: JSON-Rundreise darf das Ergebnis nicht verändern */
    var GS = "Speichern & Laden";
    var orig = V.betrieb();
    var kopie = JSON.parse(JSON.stringify(orig));
    var rO = E.berechne(orig), rK = E.berechne(kopie);
    t(GS, "JSON-Rundreise: Bilanz N unverändert", rK.bilN, rO.bilN, 0.0001);
    t(GS, "JSON-Rundreise: Bilanz P₂O₅ unverändert", rK.bilP, rO.bilP, 0.0001);
    tBool(GS, "Berechnung verändert die Eingabedaten nicht",
      JSON.stringify(orig) === JSON.stringify(kopie), "Daten unverändert");

    var bestanden = tests.filter(function (x) { return x.ok; }).length;
    return { tests: tests, bestanden: bestanden, total: tests.length, alleOk: bestanden === tests.length };
  }

  var API = { suite: suite };
  root.SBTests = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
