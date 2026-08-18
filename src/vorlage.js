/* =============================================================================
   Nährstoffbilanz – Vorlage / Startdatensatz
   Vorbefüllt mit den Kulturen und Tieren des Betriebs. Die Zahlen entsprechen
   der Planbilanz 2026 und dienen zugleich als Prüfdatensatz (siehe test/).
   ============================================================================= */
(function (root) {
  "use strict";

  function leer() {
    return {
      version: "1.20",
      betrieb: {
        name: "", jahr: new Date().getFullYear() + 1, variante: "Planbilanz",
        zone: "31", hoehenlage: "h600",
        ln: 0, bauzone: 0, df: 0, oa: 0, dgve: 0, bemerkung: ""
      },
      gfVerlust: 5, gfFehler: 5, schleppschlauchHa: 0,
      tiere: [], grundfutter: [], kulturen: [], hofduenger: [], duenger: [], vergaerung: [],
      planung: { duenger: [], proKultur: {}, grenzwerte: { aktiv: true, maxProzentNorm: 60, maxNproHa: 112.5 } }
    };
  }

  function betrieb() {
    var s = leer();
    s.betrieb = {
      name: "Betriebsgemeinschaft", jahr: 2026, variante: "Planbilanz",
      zone: "31", hoehenlage: "h600",
      ln: 137.05, bauzone: 0, df: 116.93, oa: 74.79, dgve: 58.32, bemerkung: ""
    };
    s.tiere = [
      { tier: "pferd_gross", anzahl: 5, laufhofTage: 90, weideTage: 100, weideStd: 4, vollmist: 100 },
      { tier: "pony", anzahl: 4, laufhofTage: 90, weideTage: 100, weideStd: 4, vollmist: 100 },
      { tier: "milchschaf", anzahl: 219, milchkg: 450, laufhofTage: 0, weideTage: 0, weideStd: 0, vollmist: 100 },
      { tier: "schaf", anzahl: 45, laufhofTage: 0, weideTage: 0, weideStd: 0, vollmist: 0 },
      { tier: "jungschaf", anzahl: 106, laufhofTage: 0, weideTage: 0, weideStd: 0, vollmist: 0 },
      { tier: "lamm", anzahl: 129, laufhofTage: 0, weideTage: 0, weideStd: 0, vollmist: 0 },
      { tier: "milchziege", anzahl: 3, milchkg: 550, laufhofTage: 0, weideTage: 0, weideStd: 0, vollmist: 0 }
    ];
    s.grundfutter = [
      { name: "Grassilage (Wegfuhr an Partnerbetrieb)", art: "wegfuhr", menge: 975, tsProzent: 35, arm: false },
      { name: "Graswürfel (Zufuhr)", art: "zufuhr", menge: 150, tsProzent: 88, arm: false },
      { name: "Zuckerrübenschnitzel frisch (Zufuhr)", art: "zufuhr", menge: 200, tsProzent: 30, arm: false }
    ];
    s.kulturen = [
      { kultur: "wi_ext", flaeche: 13.98, ertrag: 25 },
      { kultur: "wi_wenig", flaeche: 19.44, ertrag: 50 },
      { kultur: "wi_int", flaeche: 18.87, ertrag: 90 },
      { kultur: "we_ext", flaeche: 2.22, ertrag: 20 },
      { kultur: "we_wenig", flaeche: 0.12, ertrag: 45 },
      { kultur: "silomais", flaeche: 2.02, ertrag: 185 },
      { kultur: "getreidesilage_leg", flaeche: 1.62 },
      { kultur: "wweizen", flaeche: 4.88, ertrag: 60 },
      { kultur: "dinkel", flaeche: 6.96, ertrag: 45 },
      { kultur: "kart_pflanz_b", flaeche: 6.18, ertrag: 250 },
      { kultur: "kart_speise_c", flaeche: 8.00, ertrag: 450 },
      { kultur: "nichtaufg_nleg", flaeche: 0.75 },
      { kultur: "saum", flaeche: 0.16 },
      { kultur: "hecke_krautsaum", flaeche: 2.47 },
      { kultur: "hecke_puffer", flaeche: 3.01 },
      { kultur: "streue", flaeche: 0.50, ertrag: 0 },
      { kultur: "fenchel", flaeche: 14.00 },
      { kultur: "kuerbis", flaeche: 12.00 },
      { kultur: "salate_mittel", flaeche: 11.00 },
      { kultur: "zwiebeln", flaeche: 7.00 },
      { kultur: "kraeuter_mittel", flaeche: 0.50 },
      { kultur: "erdbeeren_1j_20", flaeche: 0.22 },
      { kultur: "gwh_tomaten_1800", flaeche: 1.21 }
    ];
    s.hofduenger = [
      { name: "Hühnermist (Zufuhr, Düngerkooperation)", richtung: "zufuhr", nges: 1890, p: 1530, vollmist: false },
      { name: "Rindergülle (Zufuhr, Düngerkooperation)", richtung: "zufuhr", nges: 420, p: 168, vollmist: false }
    ];
    s.duenger = [
      { name: "Biorga (Recyclingdünger)", typ: "organisch", nverf: 5040, p: 0 },
      { name: "Brinogia", typ: "organisch", nverf: 283.5, p: 120 }
    ];
    s.vergaerung = [];
    s.planung = {
      duenger: [
        { name: "Bio Hühnermist", einheit: "t", menge: 90, nverf: 9.3, p: 19.3 },
        { name: "Rindergülle Kooperation", einheit: "m³", menge: 140, nverf: 0.98, p: 1.8 },
        { name: "Biorga N", einheit: "t", menge: 39, nverf: 84, p: 0 },
        { name: "Brinogia Gewächshaus", einheit: "m³", menge: 41.7, nverf: 18.9, p: 8 }
      ],
      proKultur: {},
      grenzwerte: { aktiv: true, maxProzentNorm: 60, maxNproHa: 112.5 }
    };
    return s;
  }

  var API = { leer: leer, betrieb: betrieb };
  root.SBVorlage = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
