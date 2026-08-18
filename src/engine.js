/* =============================================================================
   Nährstoffbilanz – Rechenkern
   Setzt die Referenzmethode Suisse-Bilanz (Wegleitung 1.20) in 11 Schritten um.
   Reine Funktionen, keine DOM-Zugriffe → in Node und im Browser identisch testbar.
   ============================================================================= */
(function (root) {
  "use strict";

  var D = root.SBDaten || (typeof require !== "undefined" ? require("./daten.js") : null);
  var K = D.K;

  /* ---------- Hilfsfunktionen ---------- */
  function num(v) {
    if (v === null || v === undefined || v === "") return 0;
    var n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return isFinite(n) ? n : 0;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function pos(v) { return v > 0 ? v : 0; }

  /* Meldungen sammeln (Fehler blockieren die Aussage, Warnungen nicht) */
  function Meldungen() {
    var list = [];
    return {
      add: function (stufe, bereich, text) { list.push({ stufe: stufe, bereich: bereich, text: text }); },
      fehler: function (b, t) { this.add("fehler", b, t); },
      warnung: function (b, t) { this.add("warnung", b, t); },
      info: function (b, t) { this.add("info", b, t); },
      list: list
    };
  }

  /* ---------------------------------------------------------------------------
     Referenzwerte einer Kultur für die gewählte Wegleitungs-Version,
     inkl. benutzerdefinierter Überschreibung.
     --------------------------------------------------------------------------- */
  function kulturRef(zeile, version) {
    var basis;
    if (zeile.eigen) {
      basis = {
        id: zeile.id, label: zeile.eigen.label || "Eigene Kultur",
        gruppe: "Eigene Kulturen", bereich: zeile.eigen.bereich || "ackerbau",
        modus: zeile.eigen.modus || "flach",
        n: num(zeile.eigen.n), p: num(zeile.eigen.p), k: num(zeile.eigen.k), mg: num(zeile.eigen.mg),
        istGF: !!zeile.eigen.istGF, gfArm: !!zeile.eigen.gfArm, gfUnged: !!zeile.eigen.gfUnged,
        oa: !!zeile.eigen.oa, ertragStd: num(zeile.eigen.ertragStd)
      };
    } else {
      var k = D.kultur(zeile.kultur);
      if (!k) return null;
      basis = Object.assign({}, k);
      if (version === "1.19" && D.V119[k.id]) basis = Object.assign(basis, D.V119[k.id]);
    }
    if (zeile.override) basis = Object.assign(basis, zeile.override);
    return basis;
  }

  /* Standardertrag einer Wiesen-/Weidekultur nach Höhenlage */
  function standardErtrag(ref, hoehenlageId) {
    if (ref.ertragStd !== undefined && ref.ertragStd !== null) return ref.ertragStd;
    if (ref.ertragTyp && ref.ertragStufe) {
      var h = D.hoehenlage(hoehenlageId);
      var t = h[ref.ertragTyp];
      if (t && t[ref.ertragStufe] !== undefined) return t[ref.ertragStufe];
    }
    return 0;
  }

  /* Maximal zulässiger Ertrag (Plausibilitätsgrenze nach Tab. 3) */
  function maxErtrag(ref, hoehenlageId) {
    if (ref.ertragMax !== undefined) return ref.ertragMax;
    if (ref.ertragTyp) {
      var h = D.hoehenlage(hoehenlageId);
      var t = h[ref.ertragTyp];
      if (t) return t.int;   // max = Ertrag der intensiven Nutzung derselben Höhenklasse
    }
    return null;
  }

  /* ---------------------------------------------------------------------------
     SCHRITT 1 – Tierwerte inkl. Korrekturen (Tab. 2a–2e)
     Liefert die Anfallswerte PRO EINHEIT für eine Tierzeile.
     --------------------------------------------------------------------------- */
  function tierWerte(zeile, meld) {
    var basis;
    if (zeile.eigen) {
      basis = {
        id: zeile.id, label: zeile.eigen.label || "Eigene Tierkategorie",
        gruppe: "Eigene Kategorien", einheit: zeile.eigen.einheit || "Pl",
        gf: num(zeile.eigen.gf), n: num(zeile.eigen.n), nges: num(zeile.eigen.nges),
        p: num(zeile.eigen.p), k: num(zeile.eigen.k), mg: num(zeile.eigen.mg),
        raufutter: !!zeile.eigen.raufutter
      };
    } else {
      var t = D.tier(zeile.tier);
      if (!t) return null;
      basis = Object.assign({}, t);
    }

    var w = {
      id: basis.id, label: basis.label, gruppe: basis.gruppe, einheit: basis.einheit,
      gf: basis.gf, n: basis.n, nges: basis.nges, p: basis.p, k: basis.k, mg: basis.mg,
      raufutter: !!basis.raufutter, gefluegel: !!basis.gefluegel, freiland: !!basis.freiland,
      laufhofMax: basis.laufhofMax, hinweise: []
    };

    /* Laufstallhaltung Rindvieh: Nges LSR (20 % statt 15 % unvermeidbare Verluste) */
    if (basis.ngesLSR !== undefined && zeile.laufstall) {
      w.nges = basis.ngesLSR;
      w.hinweise.push("Laufstall: Nges " + basis.ngesLSR.toFixed(2) + " statt " + basis.nges.toFixed(2));
    }

    var korr = basis.korr;
    if (korr && korr.typ === "milchkuh") {
      /* Tab. 2b: GF-Verzehr nach Milchleistung, dann nach Kraftfutterverzehr */
      var ml = num(zeile.milchkg) || D.MILCHKUH_KORR.basis;
      var abw = (ml - D.MILCHKUH_KORR.basis) / 100;
      var gfMilch = D.MILCHKUH_KORR.gfBasis + (0.14 * abw - 0.003 * abw * abw);
      var kfStd = (-80 + 0.025 * ml) * ml / 1000;
      var kfEff = zeile.kfkg === "" || zeile.kfkg === undefined || zeile.kfkg === null ? kfStd : num(zeile.kfkg);
      var gfKfKorr = (kfStd - kfEff) * 0.012;
      w.gf = gfMilch + gfKfKorr;
      w.kfStandard = kfStd;
      w.gfMilchkorrigiert = gfMilch;
      w.gfKfKorrektur = gfKfKorr;

      /* Tab. 2a: Nährstoffanfall nur nach Milchleistung (nicht nach KF) */
      var dl = D.MILCHKUH_KORR.d;
      var lsr = basis.ngesLSR !== undefined && zeile.laufstall;
      w.nges = (lsr ? basis.ngesLSR : basis.nges) + abw * (lsr ? dl.ngesLSR : dl.nges);
      w.p = basis.p + abw * dl.p;
      w.k = basis.k + abw * dl.k;
      w.mg = basis.mg + abw * dl.mg;
      w.label = basis.label.replace(/\(.*\)/, "(Ø " + Math.round(ml) + " kg Jahresmilch)");
      if (ml < 3000 || ml > 13000) meld && meld.warnung("tiere", w.label + ": Milchleistung " + ml + " kg wirkt unplausibel.");
    } else if (korr && korr.typ === "kws") {
      /* Tab. 2e: Milchschaf / Milchziege je 25 kg Abweichung */
      var mlk = zeile.milchkg === "" || zeile.milchkg === undefined || zeile.milchkg === null ? korr.basis : num(zeile.milchkg);
      var s = (mlk - korr.basis) / korr.schritt;
      w.gf = basis.gf + s * korr.d.gf;
      w.n = basis.n + s * korr.d.n;
      w.nges = basis.nges + s * korr.d.nges;
      w.p = basis.p + s * korr.d.p;
      w.k = basis.k + s * korr.d.k;
      w.mg = basis.mg + s * korr.d.mg;
      w.label = basis.label.replace(/\(.*\)/, "(Ø " + Math.round(mlk) + " kg Jahresmilch)");
    } else if (korr && korr.typ === "rvmast") {
      /* Tab. 2d: Rindviehmast > 160 d, linear nach Zuwachs und Ausstall-Lebendgewicht */
      var R = D.RVMAST_KORR;
      var tzwRoh = zeile.tzw === "" || zeile.tzw === undefined || zeile.tzw === null ? R.tzwStd : num(zeile.tzw);
      var lgRoh = zeile.ausstallLG === "" || zeile.ausstallLG === undefined || zeile.ausstallLG === null ? R.lgStd : num(zeile.ausstallLG);
      var tzw = clamp(tzwRoh, R.tzwMin, R.tzwMax);
      var lg = clamp(lgRoh, R.lgMin, R.lgMax);
      if (tzw !== tzwRoh) meld && meld.warnung("tiere", w.label + ": Tageszuwachs auf Gültigkeitsbereich " + R.tzwMin + "–" + R.tzwMax + " g/d begrenzt.");
      if (lg !== lgRoh) meld && meld.warnung("tiere", w.label + ": Ausstall-LG auf Gültigkeitsbereich " + R.lgMin + "–" + R.lgMax + " kg begrenzt.");
      var dt = (tzw - R.tzwStd) / 100, dg = (lg - R.lgStd) / 20;
      ["gf", "n", "nges", "p", "k", "mg"].forEach(function (f) {
        w[f] = basis[f] + dt * R.tzw[f] + dg * R.lg[f];
      });
      w.label = basis.label.replace(/\(.*\)/, "(" + Math.round(tzw) + " g TZW, " + Math.round(lg) + " kg Ausstall-LG)");
    }

    /* Grundfutterverzehr Schweine: nur bis zur zulässigen Obergrenze */
    if (basis.gfMax !== undefined && zeile.gfVerzehr !== undefined && zeile.gfVerzehr !== null && zeile.gfVerzehr !== "") {
      var g = num(zeile.gfVerzehr);
      if (g > basis.gfMax) {
        meld && meld.warnung("tiere", w.label + ": GF-Verzehr " + g + " dt TS/Platz übersteigt " + basis.gfMax + " dt TS – Nachweis via I/E-Bilanz bzw. Modul 6/7 nötig.");
      }
      w.gf = g;
    }

    /* Manuelle Überschreibung (z. B. Ergebnis Lineare Korrektur / I-E-Bilanz, Modul 6/7) */
    if (zeile.override) {
      ["gf", "n", "nges", "p", "k", "mg"].forEach(function (f) {
        if (zeile.override[f] !== undefined && zeile.override[f] !== null && zeile.override[f] !== "") {
          w[f] = num(zeile.override[f]);
          w.ueberschrieben = true;
        }
      });
    }
    return w;
  }

  /* ---------------------------------------------------------------------------
     SCHRITT 7 – Nährstoffbedarf einer Kultur, inkl. ertragsabhängiger N-Korrektur
     --------------------------------------------------------------------------- */
  function kulturBedarf(ref, flaeche, ertrag, ertragKorrekturAktiv, meld) {
    var r = { n: 0, p: 0, k: 0, mg: 0, dtTS: 0, nProHa: 0, korrekturHinweis: null };

    if (ref.modus === "null") return r;

    if (ref.modus === "wiese") {
      r.dtTS = flaeche * ertrag;
      r.n = r.dtTS * ref.n; r.p = r.dtTS * ref.p; r.k = r.dtTS * ref.k; r.mg = r.dtTS * ref.mg;
      r.nProHa = flaeche > 0 ? r.n / flaeche : 0;
      return r;
    }

    if (ref.modus === "acker") {
      r.dtTS = flaeche * ertrag;
      var nHa = ref.n;
      if (ref.korr && ertragKorrekturAktiv) {
        /* Kap. 3.7: ertragsabhängige N-Korrektur, Ertrag gedeckelt am Maximalertrag */
        var e = Math.min(ertrag, ref.korr.max);
        nHa = ref.n + (e - ref.korr.std) * ref.korr.kf;
        if (nHa !== ref.n) {
          r.korrekturHinweis = "N " + ref.n + " → " + Math.round(nHa * 10) / 10 +
            " kg/ha (Ertrag " + ertrag + " vs. Standard " + ref.korr.std + " dt/ha)";
        }
        if (ertrag > ref.korr.max) {
          r.korrekturHinweis += " · Ertrag für die Korrektur auf " + ref.korr.max + " dt/ha begrenzt";
        }
      } else if (!ref.korr && ref.ertragStd > 0 && ertrag > 0) {
        /* Übrige Ackerkulturen: N-Reduktion erst ab 20 % unter dem Standardertrag */
        var verh = ertrag / ref.ertragStd;
        if (verh < K.UEBRIGE_ACKER_REDUKTION) {
          nHa = ref.n * verh;
          r.korrekturHinweis = "N " + ref.n + " → " + Math.round(nHa * 10) / 10 +
            " kg/ha (Ertrag " + Math.round((1 - verh) * 100) + " % unter Standard)";
        }
      }
      nHa = pos(nHa);
      r.n = flaeche * nHa;
      r.p = r.dtTS * ref.p; r.k = r.dtTS * ref.k; r.mg = r.dtTS * ref.mg;
      r.nProHa = nHa;
      return r;
    }

    /* modus "flach": alle Werte in kg/ha */
    r.n = flaeche * ref.n; r.p = flaeche * ref.p; r.k = flaeche * ref.k; r.mg = flaeche * ref.mg;
    r.nProHa = ref.n;
    r.dtTS = ref.ertragStd ? flaeche * ref.ertragStd : 0;
    return r;
  }

  /* ===========================================================================
     HAUPTBERECHNUNG – 11 Schritte der Wegleitung
     =========================================================================== */
  function berechne(state) {
    var meld = Meldungen();
    var s = state, ver = s.version || "1.20";
    var b = s.betrieb || {};
    var hoehenlage = b.hoehenlage || "h600";

    /* ---- Flächenbasis ---------------------------------------------------- */
    var ln = num(b.ln), bauzone = num(b.bauzone), df = num(b.df);
    var gesamtflaecheC = ln + bauzone;   // "Gesamtfläche C" = LN + Flächen in der Bauzone
    var oaEingabe = num(b.oa);
    var oaProz = gesamtflaecheC > 0 ? 100 * oaEingabe / gesamtflaecheC : 0;

    /* =====================================================================
       SCHRITT 1 – Tierbestand und Grundfutterverzehr (Formular A1)
       ===================================================================== */
    var A1 = { gf: 0, n: 0, nges: 0, p: 0, k: 0, mg: 0 };
    var laufhofN = 0, weideN = 0, V1 = 0;
    var tierRows = [];

    (s.tiere || []).forEach(function (z, i) {
      var w = tierWerte(z, meld);
      if (!w) { meld.fehler("tiere", "Zeile " + (i + 1) + ": unbekannte Tierkategorie."); return; }
      var anz = num(z.anzahl);
      if (anz < 0) meld.info("tiere", w.label + ": negative Anzahl wird als Abzug (z. B. Sömmerung) gerechnet.");

      var gf = anz * w.gf, nges = anz * w.nges, p = anz * w.p, kk = anz * w.k, mg = anz * w.mg, nBr = anz * w.n;

      /* --- Laufhof (Kap. 3.5): 1/10 des Nges eines Laufhoftages --- */
      var laufhofTage = num(z.laufhofTage);
      var weideTage = num(z.weideTage), weideStd = num(z.weideStd);
      var laufhofEffektiv = laufhofTage;

      if (w.laufhofMax && laufhofEffektiv > w.laufhofMax) {
        laufhofEffektiv = w.laufhofMax;
        meld.warnung("tiere", w.label + ": Laufhoftage auf " + w.laufhofMax + " begrenzt (Wegleitung Kap. 3.5).");
      }
      /* An Weidetagen mit > 12 h kein zusätzlicher Laufhofabzug */
      if (weideStd > K.WEIDE_STD_MAX_LAUFHOF && weideTage > 0 && laufhofEffektiv > 0) {
        var vorher = laufhofEffektiv;
        laufhofEffektiv = pos(laufhofEffektiv - weideTage);
        if (laufhofEffektiv !== vorher) {
          meld.warnung("tiere", w.label + ": Weide > 12 h/Tag – Laufhoftage von " + vorher + " auf " +
            Math.round(laufhofEffektiv) + " reduziert (kein doppelter Abzug, Ziff. 2.11).");
        }
      }
      var lh = anz * laufhofEffektiv * w.nges * K.LAUFHOF_ANTEIL / 365;

      /* --- Weide (Kap. 3.5) --- */
      var wd = 0;
      if (weideTage > 0 && weideStd > 0) {
        if (w.gefluegel) {
          meld.warnung("tiere", w.label + ": Für Geflügel ist kein Weideabzug zulässig – Angabe ignoriert (Kap. 3.5).");
        } else if (!w.raufutter && !(w.freiland && z.freiland)) {
          meld.warnung("tiere", w.label + ": Weideabzug nur für Raufutterverzehrer und anerkannte Freilandschweine – Angabe ignoriert.");
        } else {
          wd = anz * weideStd * weideTage * w.nges / (24 * 365);
        }
      }
      if (weideStd > 24) meld.fehler("tiere", w.label + ": Weidestunden pro Tag können nicht über 24 liegen.");
      if (weideTage > 365) meld.fehler("tiere", w.label + ": Weidetage können nicht über 365 liegen.");
      if (laufhofTage > 365) meld.fehler("tiere", w.label + ": Laufhoftage können nicht über 365 liegen.");

      /* --- Vollmist (Kap. 3.5): nur der effektiv im Stall anfallende Nges --- */
      var typ = num(z.vollmist);
      var stallNges = nges - lh - wd;
      var vm = pos(stallNges) * (typ / 100);

      A1.gf += gf; A1.n += nBr; A1.nges += nges; A1.p += p; A1.k += kk; A1.mg += mg;
      laufhofN += lh; weideN += wd; V1 += vm;

      tierRows.push({
        idx: i, label: w.label, gruppe: w.gruppe, einheit: w.einheit, anzahl: anz,
        gfProEinheit: w.gf, ngesProEinheit: w.nges, pProEinheit: w.p,
        gf: gf, n: nBr, nges: nges, p: p, k: kk, mg: mg,
        laufhof: lh, weide: wd, vollmist: vm, vollmistTyp: typ,
        laufhofEffektiv: laufhofEffektiv, hinweise: w.hinweise,
        kfStandard: w.kfStandard, gfMilchkorrigiert: w.gfMilchkorrigiert, gfKfKorrektur: w.gfKfKorrektur,
        ueberschrieben: w.ueberschrieben
      });
    });

    /* =====================================================================
       SCHRITT 2 – Zu-/Wegfuhr Grundfutter, zu produzierendes GF (Formular B)
       ===================================================================== */
    var gfWeg = 0, gfZu = 0, gfAusser = 0, gfArmZufuhr = 0;
    var gfRows = [];
    (s.grundfutter || []).forEach(function (g, i) {
      var fs = num(g.menge), tsProz = num(g.tsProzent);
      if (tsProz < 0 || tsProz > 100) meld.fehler("grundfutter", (g.name || "Position " + (i + 1)) + ": TS-Gehalt muss zwischen 0 und 100 % liegen.");
      var ts = fs * tsProz / 100;
      if (g.art === "wegfuhr") gfWeg += ts;
      else if (g.art === "ausserFF") gfAusser += ts;
      else { gfZu += ts; if (g.arm) gfArmZufuhr += ts; }
      gfRows.push({ idx: i, name: g.name, art: g.art, menge: fs, tsProzent: tsProz, ts: ts, arm: !!g.arm });
    });

    var hatTiere = A1.gf > 0 || (s.tiere || []).length > 0;
    var lagerMax = hatTiere ? K.GF_LAGERVERLUST : K.GF_LAGERVERLUST_VIEHLOS;
    var gfVerlust = num(s.gfVerlust), gfFehler = num(s.gfFehler);
    if (gfVerlust > lagerMax) meld.warnung("grundfutter", "Lagerungs-/Krippenverluste " + gfVerlust + " % überschreiten das Maximum von " + lagerMax + " %" + (hatTiere ? "" : " (viehloser Betrieb, keine Krippenverluste)") + ".");
    if (gfFehler > K.GF_FEHLERBEREICH) meld.warnung("grundfutter", "Fehlerbereich " + gfFehler + " % überschreitet das Maximum von " + K.GF_FEHLERBEREICH + " %.");

    var nettoGF = A1.gf + gfWeg - gfZu - gfAusser;
    var gfProd = nettoGF * (1 + gfVerlust / 100 + gfFehler / 100);
    if (gfProd < 0) {
      meld.warnung("grundfutter", "Rechnerisch ist kein Grundfutter zu produzieren (Zufuhr übersteigt den Verzehr). Bitte Zu-/Wegfuhren prüfen.");
      gfProd = Math.max(gfProd, nettoGF * 1);
    }

    /* =====================================================================
       SCHRITT 3+4 – Kulturen, Flächen, Ertragsniveau, nährstoffarmes GF
       ===================================================================== */
    var kultVorlauf = [];
    (s.kulturen || []).forEach(function (z, i) {
      var ref = kulturRef(z, ver);
      if (!ref) { meld.fehler("kulturen", "Zeile " + (i + 1) + ": unbekannte Kultur."); return; }
      var fl = num(z.flaeche);
      if (fl < 0) meld.fehler("kulturen", ref.label + ": negative Fläche ist nicht zulässig.");
      var ertragStd = standardErtrag(ref, hoehenlage);
      var ertrag = (z.ertrag === "" || z.ertrag === undefined || z.ertrag === null) ? ertragStd : num(z.ertrag);
      if (ref.ertragFix) ertrag = ref.ertragStd;
      kultVorlauf.push({ idx: i, zeile: z, ref: ref, flaeche: fl, ertrag: ertrag, ertragStd: ertragStd, saldo: z.ertragModus === "saldo" });
    });

    /* Ertragsniveau der intensiven Wiesen als Restgrösse aus der GF-Bilanz (Kap. 3.4) */
    var saldoZeilen = kultVorlauf.filter(function (r) { return r.saldo && r.ref.istGF; });
    var saldoErtrag = null, saldoFlaeche = 0, gfAndereTS = 0;
    if (saldoZeilen.length) {
      kultVorlauf.forEach(function (r) {
        if (r.ref.istGF && !r.saldo) gfAndereTS += r.flaeche * r.ertrag;
      });
      saldoFlaeche = saldoZeilen.reduce(function (a, r) { return a + r.flaeche; }, 0);
      if (saldoFlaeche > 0) {
        saldoErtrag = (gfProd - gfAndereTS) / saldoFlaeche;
        if (saldoErtrag < 0) {
          meld.warnung("kulturen", "Die Grundfutterbilanz ergibt für die Saldo-Kulturen einen negativen Ertrag. Zu-/Wegfuhren und übrige Erträge prüfen.");
          saldoErtrag = 0;
        }
        saldoZeilen.forEach(function (r) {
          r.ertrag = saldoErtrag;
          var mx = maxErtrag(r.ref, hoehenlage);
          if (mx && saldoErtrag > mx) {
            meld.warnung("kulturen", r.ref.label + ": errechneter Ertrag " + Math.round(saldoErtrag) +
              " dt TS/ha übersteigt den Maximalertrag von " + mx + " dt TS/ha der Höhenlage (Ertragsschätzung nötig, Ziff. 2.10).");
          }
        });
      }
    }

    /* Nährstoffbedarf, Flächensummen, nährstoffarmes GF, Transfer-Basis */
    var C = { n: 0, p: 0, k: 0, mg: 0 };
    var C1 = { n: 0, p: 0, k: 0, mg: 0, flaeche: 0 };
    var C2 = { n: 0, p: 0, k: 0, mg: 0, flaeche: 0 };
    var C3 = { n: 0, p: 0, k: 0, mg: 0, flaeche: 0 };
    var CB = { n: 0, p: 0, k: 0, mg: 0, flaeche: 0 };
    var flaecheTotal = 0, oaBerechnet = 0, gfArmEigen = 0, gfT = 0, gfKulturenTS = 0;
    var kultRows = [];

    kultVorlauf.forEach(function (r) {
      var ref = r.ref, fl = r.flaeche, ertrag = r.ertrag;
      var ertragKorrAktiv = r.zeile.ertragKorrektur !== false && !!ref.korr;
      var bed = kulturBedarf(ref, fl, ertrag, ertragKorrAktiv, meld);

      /* Plausibilität Ertrag */
      var mx = maxErtrag(ref, hoehenlage);
      if (mx && ertrag > mx && !r.saldo) {
        meld.warnung("kulturen", ref.label + ": Ertrag " + ertrag + " dt TS/ha übersteigt den Maximalwert " + mx +
          " dt TS/ha der Höhenlage – nur mit Ertragsschätzung zulässig (Ziff. 2.10).");
      }

      C.n += bed.n; C.p += bed.p; C.k += bed.k; C.mg += bed.mg;
      if (!ref.ohneFlaeche) { flaecheTotal += fl; if (ref.oa) oaBerechnet += fl; }

      var ziel = ref.bereich === "futterbau" ? C1 : ref.bereich === "ackerbau" ? C2 : ref.bereich === "spezial" ? C3 : CB;
      ziel.n += bed.n; ziel.p += bed.p; ziel.k += bed.k; ziel.mg += bed.mg;
      if (!ref.ohneFlaeche) ziel.flaeche += fl;

      if (ref.istGF) {
        gfKulturenTS += bed.dtTS;
        if (ref.gfArm) gfArmEigen += bed.dtTS;
        if (ref.gfUnged) gfT += bed.dtTS;
      }

      kultRows.push({
        idx: r.idx, id: ref.id, label: ref.label, gruppe: ref.gruppe, bereich: ref.bereich, modus: ref.modus,
        flaeche: fl, ertrag: ertrag, ertragStd: r.ertragStd, ertragRef: ref.ertragRef, ertragFix: !!ref.ertragFix,
        ertragMax: mx, saldo: r.saldo, dtTS: bed.dtTS,
        n: bed.n, p: bed.p, k: bed.k, mg: bed.mg, nProHa: bed.nProHa,
        korrekturHinweis: bed.korrekturHinweis, hatKorrektur: !!ref.korr,
        ertragKorrAktiv: ertragKorrAktiv, istGF: !!ref.istGF, gfArm: !!ref.gfArm,
        gfUnged: !!ref.gfUnged, oa: !!ref.oa, ohneFlaeche: !!ref.ohneFlaeche,
        eigen: !!r.zeile.eigen, override: r.zeile.override
      });
    });

    /* Flächenkontrolle (Kap. 3.3) */
    if (gesamtflaecheC > 0 && Math.abs(flaecheTotal - gesamtflaecheC) > 0.05) {
      meld.warnung("kulturen", "Erfasste Kulturfläche " + flaecheTotal.toFixed(2) + " ha weicht von LN + Bauzone (" +
        gesamtflaecheC.toFixed(2) + " ha) ab – Differenz " + (flaecheTotal - gesamtflaecheC).toFixed(2) + " ha.");
    }
    if (oaEingabe > 0 && Math.abs(oaBerechnet - oaEingabe) > 0.05) {
      meld.info("betrieb", "Offene Ackerfläche: erfasst " + oaEingabe.toFixed(2) + " ha, aus den Kulturen errechnet " +
        oaBerechnet.toFixed(2) + " ha. Massgebend ist die Betriebsdatenerhebung.");
    }
    if (df > ln + bauzone && ln > 0) meld.warnung("betrieb", "Die düngbare Fläche ist grösser als LN + Bauzone.");

    /* Grundfutter-Deckungskontrolle */
    if (gfProd > 0 && gfKulturenTS > 0) {
      var abwGF = gfKulturenTS - gfProd;
      if (Math.abs(abwGF) > 0.10 * gfProd) {
        meld.warnung("grundfutter", "Grundfutterbilanz nicht ausgeglichen: Kulturen liefern " + Math.round(gfKulturenTS) +
          " dt TS, zu produzieren wären " + Math.round(gfProd) + " dt TS (Differenz " +
          (abwGF > 0 ? "+" : "") + Math.round(abwGF) + " dt TS).");
      }
    }

    /* =====================================================================
       SCHRITT 5 – Abzüge → A2 (Formular A2)
       ===================================================================== */
    var gfArm = gfArmEigen + gfArmZufuhr;
    var abzArmN = gfArm * K.ARM_N;
    var abzArmP = gfArm * K.ARM_P;
    var abzLaufhof = K.LAUFHOF_ABZUG * laufhofN;
    var abzWeide = K.WEIDE_ABZUG * weideN;

    var A2 = {
      nges: pos(A1.nges - abzArmN - abzLaufhof - abzWeide),
      p: pos(A1.p - abzArmP),
      k: A1.k, mg: A1.mg
    };
    if (A1.nges - abzArmN - abzLaufhof - abzWeide < 0) meld.info("tiere", "Der N-Anfall nach Abzügen wäre negativ und wurde auf 0 gesetzt (Kap. 3.5).");
    if (A1.p - abzArmP < 0) meld.info("tiere", "Der P₂O₅-Anfall nach Abzügen wäre negativ und wurde auf 0 gesetzt (Kap. 3.5).");

    /* =====================================================================
       SCHRITT 6 – Zu-/Wegfuhr unvergärte Hofdünger (Formular A3), Vollmist
       ===================================================================== */
    var A3 = { nges: 0, p: 0 }, V2 = 0;
    var hofdRows = [];
    (s.hofduenger || []).forEach(function (h, i) {
      var vz = h.richtung === "wegfuhr" ? -1 : 1;
      var nges = vz * Math.abs(num(h.nges)), p = vz * Math.abs(num(h.p));
      A3.nges += nges; A3.p += p;
      if (h.vollmist) V2 += nges;
      hofdRows.push({ idx: i, name: h.name, richtung: h.richtung, nges: nges, p: p, vollmist: !!h.vollmist });
    });

    if (A1.nges + A3.nges < 0) {
      meld.warnung("duenger", "Die Summe aus A1 und A3 ist negativ und wird auf 0 gesetzt (Kap. 3.6): es kann nicht mehr weggeführt werden als anfällt.");
    }
    var basisVollmist = pos(A1.nges + A3.nges);
    if (V1 + V2 > basisVollmist && basisVollmist > 0) {
      meld.warnung("duenger", "Es wird mehr Vollmist deklariert als insgesamt Nges anfällt – Anteil auf 100 % begrenzt.");
    }
    var vollmistProz = basisVollmist > 0 ? clamp(100 * (V1 + V2) / basisVollmist, 0, 100) : 0;

    /* =====================================================================
       SCHRITT 4 (Fortsetzung) – innerbetrieblicher Nährstofftransfer T
       ===================================================================== */
    var transferBasis = Math.min(gfT, gfProd * K.TRANSFER_MAX_ANTEIL);
    var T = pos(K.TRANSFER_PRO_DT * transferBasis);

    /* =====================================================================
       SCHRITT 8 – Zufuhr übriger Dünger (Formular D)
       ===================================================================== */
    var Dg = { nverf: 0, p: 0 };
    var duengRows = [];
    (s.duenger || []).forEach(function (d, i) {
      var nverf = num(d.nverf), p = num(d.p);
      if (d.typ === "kompost" && d.nges !== undefined && d.nges !== null && d.nges !== "") {
        nverf = num(d.nges) * K.KOMPOST_NVERF;   // Kompost: 10 % des Nges als Nverf
      }
      Dg.nverf += nverf; Dg.p += p;
      duengRows.push({ idx: i, name: d.name, typ: d.typ, nges: num(d.nges), nverf: nverf, p: p });
    });
    /* Emissionsmindernde Ausbringung: 6 kg Nverf je ha (Kap. 3.8) */
    var schleppHa = num(s.schleppschlauchHa);
    var schleppN = schleppHa * K.SCHLEPPSCHLAUCH_N;
    Dg.nverf += schleppN;

    /* =====================================================================
       SCHRITT 9 – Vergärungsprodukte, Ernterückstände Gemüse (Formular E)
       ===================================================================== */
    var ausnutzVerg = pos(K.VERG_BASIS - K.VERG_OA * oaProz) / 100;
    var E = { nverf: 0, p: 0 };
    var vergRows = [];
    (s.vergaerung || []).forEach(function (v, i) {
      var vz = v.richtung === "wegfuhr" ? -1 : 1;
      var nges = 0, nverf = 0, p = 0, faktor = null;
      if (v.typ === "ernterueckstaende") {
        var t = Math.abs(num(v.menge));
        nges = vz * t * D.ERNTERUECKSTAENDE.nges;
        p = vz * t * D.ERNTERUECKSTAENDE.p;
        faktor = ausnutzVerg;
        nverf = (v.nverf !== undefined && v.nverf !== null && v.nverf !== "") ? vz * Math.abs(num(v.nverf)) : nges * faktor;
      } else {
        nges = vz * Math.abs(num(v.nges));
        p = vz * Math.abs(num(v.p));
        if (v.typ === "fluessig") { faktor = ausnutzVerg; nverf = nges * faktor; }
        else if (v.typ === "fest") { faktor = K.VERG_FEST; nverf = nges * faktor; }
        else { nverf = vz * Math.abs(num(v.nverf)); faktor = nges !== 0 ? nverf / nges : null; }
      }
      E.nverf += nverf; E.p += p;
      vergRows.push({ idx: i, name: v.name, typ: v.typ, richtung: v.richtung, menge: num(v.menge), nges: nges, nverf: nverf, p: p, faktor: faktor });
    });

    /* =====================================================================
       SCHRITT 10 – Betriebsspezifischer N-Ausnutzungsgrad (Formular F)
       ===================================================================== */
    var abzugOA = K.AUSNUTZUNG_OA * oaProz;
    var abzugVM = K.AUSNUTZUNG_VOLLMIST * vollmistProz;
    var ausnutzProz = pos(K.AUSNUTZUNG_BASIS - abzugOA - abzugVM);
    var ausnutz = ausnutzProz / 100;

    /* =====================================================================
       SCHRITT 11 – Gesamtbilanz (Formular F)
       ===================================================================== */
    var A2verf = A2.nges * ausnutz;
    var A3verf = A3.nges * ausnutz;
    var bilN = A2verf - C.n + A3verf + Dg.nverf + E.nverf;
    var bilP = A2.p - C.p + A3.p + Dg.p + E.p - T;

    var eigenN = C.n > 0 ? 100 * A2verf / C.n : 0;
    var eigenP = C.p > 0 ? 100 * A2.p / C.p : 0;

    var zufuhrN = A2verf + A3verf + Dg.nverf + E.nverf;
    var zufuhrP = A2.p + A3.p + Dg.p + E.p - T;

    return {
      version: ver, hoehenlage: hoehenlage,
      ln: ln, bauzone: bauzone, df: df, gesamtflaecheC: gesamtflaecheC,
      oa: oaEingabe, oaProz: oaProz, oaBerechnet: oaBerechnet,

      tierRows: tierRows, A1: A1, laufhofN: laufhofN, weideN: weideN, V1: V1,
      abzArmN: abzArmN, abzArmP: abzArmP, abzLaufhof: abzLaufhof, abzWeide: abzWeide,
      A2: A2,

      gfRows: gfRows, gfWeg: gfWeg, gfZu: gfZu, gfAusser: gfAusser, gfArmZufuhr: gfArmZufuhr,
      nettoGF: nettoGF, gfProd: gfProd, gfVerlust: gfVerlust, gfFehler: gfFehler,
      gfArmEigen: gfArmEigen, gfArm: gfArm, gfKulturenTS: gfKulturenTS,
      saldoErtrag: saldoErtrag, saldoFlaeche: saldoFlaeche,

      kultRows: kultRows, C: C, C1: C1, C2: C2, C3: C3, CB: CB,
      flaecheTotal: flaecheTotal,

      hofdRows: hofdRows, A3: A3, V2: V2, vollmistProz: vollmistProz, basisVollmist: basisVollmist,
      duengRows: duengRows, D: Dg, schleppHa: schleppHa, schleppN: schleppN,
      vergRows: vergRows, E: E, ausnutzVerg: ausnutzVerg,

      gfT: gfT, transferBasis: transferBasis, T: T,
      abzugOA: abzugOA, abzugVM: abzugVM, ausnutzProz: ausnutzProz, ausnutz: ausnutz,
      A2verf: A2verf, A3verf: A3verf,
      bilN: bilN, bilP: bilP, eigenN: eigenN, eigenP: eigenP,
      zufuhrN: zufuhrN, zufuhrP: zufuhrP,
      ausgeglichenN: bilN <= 0, ausgeglichenP: bilP <= 0,
      meldungen: meld.list,
      fehler: meld.list.filter(function (m) { return m.stufe === "fehler"; }),
      warnungen: meld.list.filter(function (m) { return m.stufe === "warnung"; })
    };
  }

  var API = {
    berechne: berechne, tierWerte: tierWerte, kulturRef: kulturRef,
    kulturBedarf: kulturBedarf, standardErtrag: standardErtrag, maxErtrag: maxErtrag,
    num: num, clamp: clamp
  };
  root.SBEngine = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
