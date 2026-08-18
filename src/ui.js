/* =============================================================================
   Nährstoffbilanz – Bedienoberfläche
   ============================================================================= */
(function () {
  "use strict";
  var D = window.SBDaten, E = window.SBEngine, Vorlage = window.SBVorlage, T = window.SBTests;

  var state = null, aktiv = "betrieb", r = null;
  var SPEICHER = "naehrstoffbilanz.stand";

  /* ---------- Formatierung ---------- */
  function fmt(v, dez) {
    if (v === null || v === undefined || !isFinite(v)) return "–";
    dez = dez === undefined ? 0 : dez;
    var s = Math.abs(v).toFixed(dez);
    var teile = s.split(".");
    teile[0] = teile[0].replace(/\B(?=(\d{3})+(?!\d))/g, "’");
    return (v < 0 ? "−" : "") + teile.join(".");
  }
  function fmtS(v, dez) { var s = fmt(v, dez); return v > 0 ? "+" + s : s; }
  function h(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- Zustand lesen / schreiben ---------- */
  function hole(pfad) {
    var t = pfad.split("."), o = state;
    for (var i = 0; i < t.length; i++) { if (o === undefined || o === null) return undefined; o = o[t[i]]; }
    return o;
  }
  function setze(pfad, wert) {
    var t = pfad.split("."), o = state;
    for (var i = 0; i < t.length - 1; i++) {
      if (o[t[i]] === undefined || o[t[i]] === null) o[t[i]] = {};
      o = o[t[i]];
    }
    o[t[t.length - 1]] = wert;
  }
  window.sbSetZahl = function (pfad, roh) { setze(pfad, roh === "" ? "" : E.num(roh)); aktualisieren(); };
  window.sbSetText = function (pfad, roh) { setze(pfad, roh); aktualisieren(); };
  window.sbSetJa = function (pfad, ja) { setze(pfad, !!ja); aktualisieren(); };
  window.sbLoesche = function (liste, i) {
    var l = hole(liste);
    var name = l[i] && (l[i].name || (l[i].kultur && (D.kultur(l[i].kultur) || {}).label) || (l[i].tier && (D.tier(l[i].tier) || {}).label));
    if (name && !confirm("Zeile «" + name + "» wirklich löschen?")) return;
    l.splice(i, 1); aktualisieren();
  };

  /* ---------- Eingabe-Bausteine ---------- */
  /* Zahlenfeld als Textfeld mit numerischer Tastatur: So werden sowohl Punkt
     als auch Komma als Dezimaltrennzeichen angenommen. Ein <input type="number">
     würde eine Eingabe mit Komma stillschweigend verwerfen. */
  function zahl(pfad, wert, opt) {
    opt = opt || {};
    return '<input type="text" inputmode="decimal" class="zahl' + (opt.klasse ? " " + opt.klasse : "") + '"' +
      (opt.disabled ? " disabled" : "") +
      ' value="' + (wert === undefined || wert === null || wert === "" ? "" : wert) + '"' +
      (opt.titel ? ' title="' + h(opt.titel) + '"' : "") +
      ' onchange="sbSetZahl(\'' + pfad + '\',this.value)">';
  }
  function text(pfad, wert, opt) {
    opt = opt || {};
    return '<input type="text" class="' + (opt.klasse || "breit") + '" value="' + h(wert) + '"' +
      (opt.platzhalter ? ' placeholder="' + h(opt.platzhalter) + '"' : "") +
      ' onchange="sbSetText(\'' + pfad + '\',this.value)">';
  }
  function haken(pfad, an, titel) {
    return '<input type="checkbox"' + (an ? " checked" : "") +
      (titel ? ' title="' + h(titel) + '"' : "") +
      ' onchange="sbSetJa(\'' + pfad + '\',this.checked)">';
  }
  function wahl(pfad, wert, optionen) {
    return '<select onchange="sbSetText(\'' + pfad + '\',this.value)">' +
      optionen.map(function (o) {
        return '<option value="' + h(o[0]) + '"' + (String(wert) === String(o[0]) ? " selected" : "") + ">" + h(o[1]) + "</option>";
      }).join("") + "</select>";
  }
  function kennzahl(wert, label, art) {
    return '<div class="kennzahl' + (art ? " " + art : "") + '"><div class="w">' + wert + '</div><div class="l">' + label + "</div></div>";
  }

  /* =========================================================================
     Auswahldialog mit Suche
     ========================================================================= */
  var dialogWahl = null;
  function auswahl(titel, eintraege, onWahl, zusatz) {
    dialogWahl = { eintraege: eintraege, onWahl: onWahl, filter: "", titel: titel, zusatz: zusatz };
    zeigeDialog();
  }
  function zeigeDialog() {
    var d = dialogWahl;
    if (!d) { document.getElementById("dialogbereich").innerHTML = ""; return; }
    var f = d.filter.toLowerCase().trim();
    var gefiltert = d.eintraege.filter(function (e) {
      return !f || e.label.toLowerCase().indexOf(f) >= 0 || (e.gruppe || "").toLowerCase().indexOf(f) >= 0;
    });
    var html = "", letzteGruppe = "";
    gefiltert.slice(0, 400).forEach(function (e, i) {
      if (e.gruppe !== letzteGruppe) { letzteGruppe = e.gruppe; html += '<div class="gr">' + h(e.gruppe) + "</div>"; }
      html += '<button onclick="sbDialogWahl(' + i + ')">' + h(e.label) +
        (e.detail ? '<span class="det">' + h(e.detail) + "</span>" : "") + "</button>";
    });
    if (!gefiltert.length) html = '<div style="padding:22px;text-align:center;color:var(--grau)">Kein Eintrag gefunden.</div>';
    window.__dlgTreffer = gefiltert;
    document.getElementById("dialogbereich").innerHTML =
      '<div class="overlay" onclick="if(event.target===this)sbDialogSchliessen()"><div class="dialog">' +
      '<div class="kopf"><h3>' + h(d.titel) + '</h3>' +
      '<input type="text" id="dlgsuche" placeholder="Suchen …" value="' + h(d.filter) + '" oninput="sbDialogFilter(this.value)"></div>' +
      '<div class="liste">' + html + "</div>" +
      '<div class="fuss"><span class="hint">' + gefiltert.length + " von " + d.eintraege.length + " Einträgen</span><span>" +
      (d.zusatz ? '<button class="knopf hell" onclick="sbDialogZusatz()">' + h(d.zusatz.label) + "</button> " : "") +
      '<button class="knopf hell" onclick="sbDialogSchliessen()">Abbrechen</button></span></div></div></div>';
    var s = document.getElementById("dlgsuche");
    if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
  }
  window.sbDialogFilter = function (v) { dialogWahl.filter = v; zeigeDialog(); };
  window.sbDialogWahl = function (i) { var e = window.__dlgTreffer[i], cb = dialogWahl.onWahl; dialogWahl = null; zeigeDialog(); cb(e); };
  window.sbDialogSchliessen = function () { dialogWahl = null; zeigeDialog(); };
  window.sbDialogZusatz = function () { var z = dialogWahl.zusatz; dialogWahl = null; zeigeDialog(); z.aktion(); };

  /* Dialog zum Bearbeiten von Referenzwerten */
  var werteDialog = null;
  function zeigeWerteDialog() {
    var w = werteDialog;
    if (!w) { document.getElementById("dialogbereich").innerHTML = ""; return; }
    var zeilen = w.felder.map(function (f, i) {
      return '<div class="feld" style="margin-bottom:9px"><label>' + h(f.label) +
        (f.einheit ? ' <span class="einheit">' + h(f.einheit) + "</span>" : "") + "</label>" +
        '<input type="text"' + (f.typ === "text" ? "" : ' inputmode="decimal"') + ' class="' + (f.typ === "text" ? "breit" : "zahl") +
        '" id="wd' + i + '" value="' + h(w.werte[f.id] === undefined ? "" : w.werte[f.id]) + '"></div>';
    }).join("");
    document.getElementById("dialogbereich").innerHTML =
      '<div class="overlay" onclick="if(event.target===this)sbWerteAbbruch()"><div class="dialog" style="max-width:470px">' +
      '<div class="kopf"><h3>' + h(w.titel) + "</h3>" +
      (w.hinweis ? '<div class="hinweis" style="margin:0">' + h(w.hinweis) + "</div>" : "") + "</div>" +
      '<div class="liste" style="padding:14px 18px">' + zeilen + "</div>" +
      '<div class="fuss"><span>' + (w.zuruecksetzen ? '<button class="knopf hell" onclick="sbWerteReset()">Auf Referenzwert zurück</button>' : "") + "</span>" +
      '<span><button class="knopf hell" onclick="sbWerteAbbruch()">Abbrechen</button> ' +
      '<button class="knopf dunkel" onclick="sbWerteSpeichern()">Übernehmen</button></span></div></div></div>';
  }
  function werteBearbeiten(titel, hinweis, felder, werte, onSpeichern, zuruecksetzen) {
    werteDialog = { titel: titel, hinweis: hinweis, felder: felder, werte: werte, onSpeichern: onSpeichern, zuruecksetzen: zuruecksetzen };
    zeigeWerteDialog();
  }
  window.sbWerteSpeichern = function () {
    var w = werteDialog, out = {};
    w.felder.forEach(function (f, i) {
      var el = document.getElementById("wd" + i);
      if (!el) return;
      if (f.typ === "text") { if (el.value !== "") out[f.id] = el.value; }
      else if (el.value !== "") out[f.id] = E.num(el.value);
    });
    werteDialog = null; zeigeWerteDialog(); w.onSpeichern(out);
  };
  window.sbWerteAbbruch = function () { werteDialog = null; zeigeWerteDialog(); };
  window.sbWerteReset = function () { var w = werteDialog; werteDialog = null; zeigeWerteDialog(); w.onSpeichern(null); };

  /* =========================================================================
     Register 1 – Betrieb
     ========================================================================= */
  function rBetrieb() {
    var b = state.betrieb;
    var dgveProHa = b.df > 0 ? E.num(b.dgve) / E.num(b.df) : 0;
    var grenze = D.DGVE_GRENZEN[b.zone] || 2.0;
    return '<div class="karte"><h2>Allgemeine Angaben</h2>' +
      '<p class="hinweis">Diese Angaben bestimmen die weiteren Register. Die Flächen müssen mit der Betriebsdatenerhebung übereinstimmen.</p>' +
      '<div class="feldgruppe">' +
      '<div class="feld"><label>Betrieb / Bewirtschaftung</label>' + text("betrieb.name", b.name, { platzhalter: "Name des Betriebs" }) + "</div>" +
      '<div class="feld"><label>Erntejahr</label>' + zahl("betrieb.jahr", b.jahr, { step: 1, klasse: "klein" }) + "</div>" +
      '<div class="feld"><label>Variante</label>' + wahl("betrieb.variante", b.variante, [["Planbilanz", "Planbilanz"], ["Abgeschlossene Bilanz", "Abgeschlossene Bilanz"]]) + "</div>" +
      '<div class="feld"><label>Zone</label>' + wahl("betrieb.zone", b.zone, D.ZONEN.map(function (z) { return [z.id, z.label]; })) + "</div>" +
      '<div class="feld"><label>Höhenlage Betriebszentrum</label>' + wahl("betrieb.hoehenlage", b.hoehenlage, D.HOEHENLAGEN.map(function (x) { return [x.id, x.label]; })) + "</div>" +
      "</div>" +
      '<h3>Flächen</h3>' +
      '<div class="feldgruppe">' +
      '<div class="feld"><label>Landw. Nutzfläche LN <span class="einheit">ha</span></label>' + zahl("betrieb.ln", b.ln) + "</div>" +
      '<div class="feld"><label>Flächen in der Bauzone <span class="einheit">ha</span></label>' + zahl("betrieb.bauzone", b.bauzone) + "</div>" +
      '<div class="feld"><label>Düngbare Fläche DF <span class="einheit">ha</span></label>' + zahl("betrieb.df", b.df) + "</div>" +
      '<div class="feld"><label>Offene Ackerfläche OA <span class="einheit">ha</span></label>' + zahl("betrieb.oa", b.oa) + "</div>" +
      '<div class="feld"><label>Tierbestand <span class="einheit">DGVE, nur für Kennzahlen</span></label>' + zahl("betrieb.dgve", b.dgve) + "</div>" +
      "</div>" +
      '<div class="rechenweg">Gesamtfläche C (LN + Bauzone) = <b>' + fmt(r.gesamtflaecheC, 2) + " ha</b> · " +
      "Offene Ackerfläche = " + fmt(r.oa, 2) + " ha = <b>" + fmt(r.oaProz, 1) + " %</b> der Gesamtfläche C<br>" +
      "N-Ausnutzungsgrad Hofdünger = 60 % − " + fmt(r.abzugOA, 1) + " % (offene Ackerfläche) − " +
      fmt(r.abzugVM, 1) + " % (Vollmist " + fmt(r.vollmistProz, 1) + " %) = <b>" + fmt(r.ausnutzProz, 1) + " %</b></div>" +
      (r.oaBerechnet > 0 ? '<p class="hinweis">Aus den erfassten Kulturen errechnete offene Ackerfläche: ' + fmt(r.oaBerechnet, 2) +
        " ha. Massgebend bleibt die Betriebsdatenerhebung.</p>" : "") +
      "</div>" +

      '<div class="karte"><h2>Grundeinstellungen der Berechnung</h2>' +
      '<div class="feldgruppe">' +
      '<div class="feld"><label>Wegleitungs-Version</label>' + wahl("version", state.version,
        [["1.20", "Version 1.20 (2026/2027)"], ["1.19", "Version 1.19 – nur zum Gegenrechnen"]]) + "</div>" +
      '<div class="feld"><label>Lager- und Krippenverluste <span class="einheit">%</span></label>' + zahl("gfVerlust", state.gfVerlust, { step: 0.5, klasse: "klein" }) + "</div>" +
      '<div class="feld"><label>Fehlerbereich Grundfutterbilanz <span class="einheit">% · max. 5</span></label>' + zahl("gfFehler", state.gfFehler, { step: 0.5, klasse: "klein" }) + "</div>" +
      "</div>" +
      (state.version === "1.19" ? '<div class="notiz"><b>Version 1.19 aktiv.</b> Diese Fassung galt für 2025/2026 und dient hier nur zum Nachrechnen bestehender Bilanzen. Für eine gültige Bilanz 2026/2027 auf Version 1.20 wechseln.</div>' : "") +
      '<div class="feld" style="margin-top:12px"><label>Bemerkungen zur Bilanz</label>' +
      '<textarea class="breit" rows="2" onchange="sbSetText(\'betrieb.bemerkung\',this.value)" placeholder="z. B. Besonderheiten, Vereinbarungen, Annahmen">' + h(b.bemerkung) + "</textarea></div>" +
      "</div>" +

      '<div class="karte"><h2>Kennzahlen</h2><div class="kennzahlen">' +
      kennzahl(fmt(r.flaecheTotal, 2) + " ha", "Erfasste Kulturfläche (Soll: " + fmt(r.gesamtflaecheC, 2) + " ha)",
        Math.abs(r.flaecheTotal - r.gesamtflaecheC) > 0.05 ? "warn" : "") +
      kennzahl(fmt(dgveProHa, 2), "DGVE je ha düngbare Fläche (Grenzwert Zone: " + grenze.toFixed(1) + ")", dgveProHa > grenze ? "warn" : "") +
      kennzahl(fmt(r.A1.nges) + " kg", "Gesamtstickstoff aus der Tierhaltung (A1)") +
      kennzahl(fmt(r.C.n) + " kg", "Stickstoffbedarf aller Kulturen (C)") +
      "</div></div>";
  }

  /* =========================================================================
     Register 2 – Tiere
     ========================================================================= */
  function rTiere() {
    var zeilen = "", letzte = "";
    r.tierRows.forEach(function (t, i) {
      var z = state.tiere[i];
      var basis = z.eigen ? null : D.tier(z.tier);
      if (t.gruppe !== letzte) { letzte = t.gruppe; zeilen += '<tr class="gruppe"><td colspan="11">' + h(t.gruppe) + "</td></tr>"; }
      var extra = [];
      if (basis && basis.korr && basis.korr.typ === "milchkuh") {
        extra.push("Standard-Kraftfutter " + fmt(t.kfStandard) + " kg → GF-Korrektur " + fmtS(t.gfKfKorrektur, 1) + " dt TS");
      }
      (t.hinweise || []).forEach(function (x) { extra.push(x); });
      if (t.ueberschrieben) extra.push("Werte manuell überschrieben (Modul 6/7)");
      if (t.laufhofEffektiv !== E.num(z.laufhofTage)) extra.push("Laufhof wirksam: " + fmt(t.laufhofEffektiv) + " Tage");

      var name = z.eigen
        ? text("tiere." + i + ".eigen.label", z.eigen.label, { klasse: "" })
        : h(t.label);
      var milchFeld = "–";
      if (basis && basis.korr && (basis.korr.typ === "milchkuh" || basis.korr.typ === "kws")) {
        milchFeld = zahl("tiere." + i + ".milchkg", z.milchkg, { step: basis.korr.typ === "kws" ? 25 : 100, klasse: "klein", titel: "Ø Jahresmilchleistung in kg" });
      } else if (basis && basis.korr && basis.korr.typ === "rvmast") {
        milchFeld = zahl("tiere." + i + ".tzw", z.tzw, { step: 50, klasse: "mini", titel: "Tageszuwachs g/Tag" }) +
          " " + zahl("tiere." + i + ".ausstallLG", z.ausstallLG, { step: 10, klasse: "mini", titel: "Ausstall-Lebendgewicht kg" });
      }

      zeilen += "<tr><td>" + name +
        (basis && basis.ngesLSR !== undefined ? " " + haken("tiere." + i + ".laufstall", z.laufstall, "Laufstallhaltung: Nges nach LSR-Wert (20 % Verluste)") +
          '<span class="zeileninfo">Laufstall ' + (z.laufstall ? "ja" : "nein") + "</span>" : "") +
        (extra.length ? '<span class="zeileninfo">' + h(extra.join(" · ")) + "</span>" : "") +
        '</td><td class="num">' + zahl("tiere." + i + ".anzahl", z.anzahl, { step: 1, klasse: "klein" }) +
        '<span class="zeileninfo">' + h(t.einheit === "St" ? "Stück" : t.einheit === "Pl" ? "Platz" : t.einheit) + "</span></td>" +
        '<td class="num">' + milchFeld + "</td>" +
        '<td class="num abgeleitet">' + fmt(t.gf, 1) + "</td>" +
        '<td class="num abgeleitet">' + fmt(t.nges) + "</td>" +
        '<td class="num abgeleitet">' + fmt(t.p) + "</td>" +
        '<td class="num">' + zahl("tiere." + i + ".laufhofTage", z.laufhofTage, { step: 1, klasse: "mini" }) + "</td>" +
        '<td class="num">' + zahl("tiere." + i + ".weideTage", z.weideTage, { step: 1, klasse: "mini" }) + "</td>" +
        '<td class="num">' + zahl("tiere." + i + ".weideStd", z.weideStd, { step: 1, klasse: "mini" }) + "</td>" +
        "<td>" + wahl("tiere." + i + ".vollmist", z.vollmist, [["0", "Typ 0"], ["50", "Typ 50"], ["100", "Typ 100"]]) + "</td>" +
        '<td style="white-space:nowrap"><button class="iknopf stift" title="Anfallswerte überschreiben" onclick="sbTierWerte(' + i + ')">✎</button>' +
        '<button class="iknopf" title="Zeile löschen" onclick="sbLoesche(\'tiere\',' + i + ')">✕</button></td></tr>';
    });

    return '<div class="karte"><h2>Tierbestand und Grundfutterverzehr <span class="form">Formular A1</span></h2>' +
      '<p class="hinweis">Ein Platz entspricht einem Tier, das ganzjährig auf dem Betrieb steht; bei kürzerer Anwesenheit anteilig erfassen. ' +
      'Laufhof: nur Tage eintragen (angerechnet wird ein Zehntel des Tagesanfalls). Weide: Tage und Stunden pro Tag. ' +
      'Vollmist Typ 100 = nur Vollmist, Typ 50 = 10–90 % Vollmist, Typ 0 = Gülle bzw. Gülle und Stapelmist.</p>' +
      '<div class="tabellenrahmen"><table><thead><tr><th>Tierkategorie</th><th class="num">Anzahl</th>' +
      '<th class="num">Milch kg/J<br>bzw. TZW/LG</th><th class="num">Grundfutter<br>dt TS</th><th class="num">Nges<br>kg</th>' +
      '<th class="num">P₂O₅<br>kg</th><th class="num">Laufhof<br>Tage</th><th class="num">Weide<br>Tage</th>' +
      '<th class="num">Weide<br>h/Tag</th><th>Hofdünger</th><th></th></tr></thead><tbody>' + zeilen +
      '<tr class="summe"><td>Zwischenwert A1</td><td class="num"></td><td></td><td class="num">' + fmt(r.A1.gf) +
      '</td><td class="num">' + fmt(r.A1.nges) + '</td><td class="num">' + fmt(r.A1.p) + '</td><td colspan="5"></td></tr>' +
      "</tbody></table></div>" +
      '<button class="plus" onclick="sbTierHinzu()">+ Tierkategorie hinzufügen</button>' +
      "</div>" +

      '<div class="karte"><h2>Abzüge und Nährstoffanfall <span class="form">Formular A2</span></h2>' +
      '<div class="rechenweg">' +
      "Zwischenwert A1: <b>" + fmt(r.A1.nges) + " kg Nges</b> · <b>" + fmt(r.A1.p) + " kg P₂O₅</b><br>" +
      "− nährstoffarmes Grundfutter " + fmt(r.gfArm) + " dt TS × 0.6 kg N/dt = <b>−" + fmt(r.abzArmN) + " kg N</b>, × 0.1 kg P₂O₅/dt = <b>−" + fmt(r.abzArmP) + " kg P₂O₅</b><br>" +
      "− Laufhof: 50 % von " + fmt(r.laufhofN) + " kg = <b>−" + fmt(r.abzLaufhof) + " kg N</b><br>" +
      "− Weide: 70 % von " + fmt(r.weideN) + " kg = <b>−" + fmt(r.abzWeide) + " kg N</b><br>" +
      "= Total A2: <b>" + fmt(r.A2.nges) + " kg Nges</b> · <b>" + fmt(r.A2.p) + " kg P₂O₅</b>" +
      "</div>" +
      '<div class="kennzahlen">' +
      kennzahl(fmt(r.A2.nges) + " kg", "Gesamtstickstoff aus der Tierhaltung (A2)") +
      kennzahl(fmt(r.A2.p) + " kg", "P₂O₅ aus der Tierhaltung (A2)") +
      kennzahl(fmt(r.V1) + " kg", "Stickstoff im betriebseigenen Vollmist (V1)") +
      kennzahl(fmt(r.vollmistProz, 1) + " %", "Anteil Vollmist am Nges aus A1 + A3") +
      "</div></div>";
  }

  window.sbTierHinzu = function () {
    var liste = D.TIERE.map(function (t) {
      return {
        id: t.id, label: t.label, gruppe: t.gruppe,
        detail: "Grundfutter " + t.gf + " dt TS · Nges " + t.nges + " kg · P₂O₅ " + t.p + " kg je " +
          (t.einheit === "St" ? "Stück" : t.einheit === "Pl" ? "Platz" : t.einheit)
      };
    });
    auswahl("Tierkategorie wählen", liste, function (e) {
      state.tiere.push({ tier: e.id, anzahl: 0, laufhofTage: 0, weideTage: 0, weideStd: 0, vollmist: 0 });
      aktualisieren();
    }, {
      label: "Eigene Kategorie erfassen", aktion: function () {
        state.tiere.push({ eigen: { label: "Eigene Kategorie", einheit: "Pl", gf: 0, n: 0, nges: 0, p: 0, k: 0, mg: 0, raufutter: true }, anzahl: 0, laufhofTage: 0, weideTage: 0, weideStd: 0, vollmist: 0 });
        aktualisieren();
      }
    });
  };
  window.sbTierWerte = function (i) {
    var z = state.tiere[i], t = r.tierRows[i];
    var basis = z.eigen ? z.eigen : D.tier(z.tier);
    var start = z.eigen ? Object.assign({}, z.eigen) : Object.assign({}, z.override || {});
    werteBearbeiten(
      "Anfallswerte – " + t.label,
      z.eigen ? "Werte je Einheit und Jahr für die eigene Kategorie."
        : "Nur überschreiben, wenn ein abweichender Anfall nachgewiesen ist (Lineare Korrektur oder Import/Export-Bilanz nach Modul 6/7). Leer lassen = Referenzwert der Wegleitung.",
      (z.eigen ? [{ id: "label", label: "Bezeichnung", typ: "text" }] : []).concat([
        { id: "gf", label: "Grundfutterverzehr", einheit: "dt TS/Jahr (Referenz " + basis.gf + ")" },
        { id: "nges", label: "Gesamtstickstoff Nges", einheit: "kg/Jahr (Referenz " + basis.nges + ")" },
        { id: "p", label: "Phosphor P₂O₅", einheit: "kg/Jahr (Referenz " + basis.p + ")" },
        { id: "k", label: "Kalium K₂O", einheit: "kg/Jahr (Referenz " + basis.k + ")" },
        { id: "mg", label: "Magnesium Mg", einheit: "kg/Jahr (Referenz " + basis.mg + ")" }
      ]), start,
      function (out) {
        if (z.eigen) { if (out) Object.keys(out).forEach(function (kk) { z.eigen[kk] = out[kk]; }); }
        else z.override = out && Object.keys(out).length ? out : undefined;
        aktualisieren();
      }, !z.eigen);
  };

  /* =========================================================================
     Register 3 – Grundfutter
     ========================================================================= */
  function rGrundfutter() {
    var zeilen = r.gfRows.map(function (g, i) {
      var z = state.grundfutter[i];
      return "<tr><td>" + text("grundfutter." + i + ".name", z.name, { platzhalter: "Bezeichnung des Futtermittels" }) + "</td>" +
        "<td>" + wahl("grundfutter." + i + ".art", z.art, [["zufuhr", "Zufuhr"], ["wegfuhr", "Wegfuhr"], ["ausserFF", "Produktion ausserhalb Futterfläche"]]) + "</td>" +
        '<td class="num">' + zahl("grundfutter." + i + ".menge", z.menge, { step: 1, klasse: "klein" }) + "</td>" +
        '<td class="num">' + zahl("grundfutter." + i + ".tsProzent", z.tsProzent, { step: 1, klasse: "mini" }) + "</td>" +
        '<td class="num abgeleitet">' + fmt(g.ts, 1) + "</td>" +
        '<td style="text-align:center">' + haken("grundfutter." + i + ".arm", z.arm, "Nährstoffarmes Grundfutter") + "</td>" +
        '<td><button class="iknopf" onclick="sbLoesche(\'grundfutter\',' + i + ')">✕</button></td></tr>';
    }).join("");

    var wiesenTS = r.gfKulturenTS, diff = wiesenTS - r.gfProd;
    var abw = r.gfProd > 0 ? Math.abs(diff) / r.gfProd : 0;

    return '<div class="karte"><h2>Zu- und Wegfuhr von Grundfutter <span class="form">Formular B</span></h2>' +
      '<p class="hinweis">Alle Zu- und Wegfuhren lückenlos mit Belegen erfassen. Menge in dt Frischsubstanz, dazu der TS-Gehalt in Prozent ' +
      '(Grassilage in der Regel 35 %). «Produktion ausserhalb Futterfläche» meint betriebseigene verfütterte Kartoffeln, Zuckerrüben oder Maiskolbenmischungen.</p>' +
      '<div class="tabellenrahmen"><table><thead><tr><th>Futtermittel</th><th>Art</th><th class="num">Menge dt FS</th>' +
      '<th class="num">% TS</th><th class="num">dt TS</th><th style="text-align:center">nährstoffarm</th><th></th></tr></thead>' +
      "<tbody>" + zeilen + "</tbody></table></div>" +
      '<button class="plus" onclick="sbGfHinzu()">+ Position hinzufügen</button>' +
      "</div>" +

      '<div class="karte"><h2>Zu produzierendes Grundfutter</h2>' +
      '<div class="rechenweg">' +
      "Grundfutterverzehr der Tiere (Formular A1): <b>" + fmt(r.A1.gf) + " dt TS</b><br>" +
      "+ Wegfuhr " + fmt(r.gfWeg) + " − Zufuhr " + fmt(r.gfZu) + " − Produktion ausserhalb Futterfläche " + fmt(r.gfAusser) + "<br>" +
      "= Netto-Grundfutterbedarf: <b>" + fmt(r.nettoGF) + " dt TS</b><br>" +
      "+ " + fmt(r.gfVerlust, 1) + " % Lager-/Krippenverluste + " + fmt(r.gfFehler, 1) + " % Fehlerbereich<br>" +
      "= auf der Futterfläche zu produzieren (GFprod): <b>" + fmt(r.gfProd) + " dt TS</b>" +
      "</div>" +
      '<div class="kennzahlen">' +
      kennzahl(fmt(r.gfProd) + " dt TS", "Auf der Futterfläche zu produzieren") +
      kennzahl(fmt(wiesenTS) + " dt TS", "Ertrag der erfassten Futterkulturen (Register 4)") +
      kennzahl(fmtS(diff) + " dt TS", "Differenz – " + (abw > 0.10 ? "Grundfutterbilanz prüfen" : "Bilanz plausibel"), abw > 0.10 ? "warn" : "") +
      kennzahl(fmt(r.gfArm) + " dt TS", "davon nährstoffarmes Grundfutter") +
      "</div>" +
      (abw > 0.10 ? '<div class="notiz">Die Grundfutterbilanz geht nicht auf. Prüfen Sie die Zu- und Wegfuhren, die Tierzahlen und die Erträge der Futterkulturen. ' +
        'Alternativ können Sie im Register 4 den Ertrag der intensiven Wiesen als Restgrösse aus dieser Bilanz berechnen lassen.</div>' : "") +
      "</div>";
  }
  window.sbGfHinzu = function () {
    state.grundfutter.push({ name: "", art: "zufuhr", menge: 0, tsProzent: 35, arm: false });
    aktualisieren();
  };

  /* =========================================================================
     Register 4 – Kulturen
     ========================================================================= */
  function rKulturen() {
    var zeilen = "", letzte = "";
    r.kultRows.forEach(function (kr, i) {
      var z = state.kulturen[i];
      if (kr.gruppe !== letzte) { letzte = kr.gruppe; zeilen += '<tr class="gruppe"><td colspan="10">' + h(kr.gruppe) + "</td></tr>"; }

      var ref = E.kulturRef(z, state.version) || {};
      var werteText = kr.modus === "wiese" ? "N " + ref.n + " · P " + ref.p + " · K " + ref.k + " kg/dt TS"
        : kr.modus === "acker" ? "N " + ref.n + " kg/ha · P " + ref.p + " · K " + ref.k + " kg/dt"
          : kr.modus === "flach" ? "N " + ref.n + " · P " + ref.p + " · K " + ref.k + " kg/ha"
            : "kein Nährstoffbedarf";

      var zusatz = [werteText];
      if (kr.korrekturHinweis) zusatz.push(kr.korrekturHinweis);
      if (z.override) zusatz.push("Referenzwerte überschrieben");
      if (kr.saldo) zusatz.push("Ertrag aus Grundfutterbilanz: " + fmt(kr.ertrag, 1) + " dt TS/ha");
      if (kr.ertragRef) zusatz.push("Referenzertrag " + kr.ertragRef + " kg/a");

      var name = z.eigen ? text("kulturen." + i + ".eigen.label", z.eigen.label, { klasse: "" }) : h(kr.label);
      var ertragFeld = kr.modus === "null" && !kr.istGF ? "–"
        : kr.ertragFix ? '<span class="abgeleitet">' + fmt(kr.ertrag) + "</span>"
          : kr.saldo ? '<span class="abgeleitet">' + fmt(kr.ertrag, 1) + "</span>"
            : kr.modus === "flach" ? "–"
              : zahl("kulturen." + i + ".ertrag", z.ertrag, { step: 1, klasse: "klein", titel: "Standardertrag " + kr.ertragStd });

      zeilen += "<tr><td>" + name +
        '<span class="zeileninfo' + (kr.korrekturHinweis ? " warn" : "") + '">' + h(zusatz.join(" · ")) + "</span></td>" +
        '<td class="num">' + zahl("kulturen." + i + ".flaeche", z.flaeche, { klasse: "klein" }) + "</td>" +
        '<td class="num">' + ertragFeld + "</td>" +
        '<td style="text-align:center">' + (kr.istGF && kr.modus === "wiese" ?
          haken("kulturen." + i + ".ertragModusSaldo", kr.saldo, "Ertrag als Restgrösse aus der Grundfutterbilanz berechnen") : "") + "</td>" +
        '<td class="num abgeleitet">' + (kr.dtTS ? fmt(kr.dtTS) : "–") + "</td>" +
        '<td class="num abgeleitet">' + fmt(kr.n) + "</td>" +
        '<td class="num abgeleitet">' + fmt(kr.p) + "</td>" +
        '<td class="num abgeleitet">' + fmt(kr.k) + "</td>" +
        '<td style="text-align:center">' + (kr.hatKorrektur ?
          haken("kulturen." + i + ".ertragKorrektur", z.ertragKorrektur !== false, "Ertragsabhängige N-Korrektur anwenden") : "") + "</td>" +
        '<td style="white-space:nowrap"><button class="iknopf stift" title="Referenzwerte anpassen" onclick="sbKulturWerte(' + i + ')">✎</button>' +
        '<button class="iknopf" onclick="sbLoesche(\'kulturen\',' + i + ')">✕</button></td></tr>';
    });

    return '<div class="karte"><h2>Kulturen und Nährstoffbedarf <span class="form">Formular C1–C3</span></h2>' +
      '<p class="hinweis">Flächen gemäss Betriebsdatenerhebung; Parzellen mit mehreren Kulturen nur einmal anrechnen. ' +
      'Bei Wiesen und Weiden den geschätzten TS-Ertrag eintragen, bei Ackerkulturen den Ertrag des Hauptprodukts. ' +
      'Für Getreide, Raps und Mais wird der N-Bedarf automatisch ertragsabhängig korrigiert (Spalte «N-Korr.»). ' +
      'Gemüse- und Dauerkulturen rechnen mit festen Werten je Hektare.</p>' +
      '<div class="tabellenrahmen"><table><thead><tr><th>Kultur</th><th class="num">Fläche ha</th><th class="num">Ertrag</th>' +
      '<th style="text-align:center" title="Ertrag als Restgrösse aus der Grundfutterbilanz">Saldo</th>' +
      '<th class="num">dt TS</th><th class="num">N kg</th><th class="num">P₂O₅ kg</th><th class="num">K₂O kg</th>' +
      '<th style="text-align:center" title="Ertragsabhängige N-Korrektur">N-Korr.</th><th></th></tr></thead><tbody>' + zeilen +
      '<tr class="summe"><td>Total Kulturen (C)</td><td class="num">' + fmt(r.flaecheTotal, 2) + "</td>" +
      '<td colspan="2"></td><td class="num">' + fmt(r.gfKulturenTS) + '</td><td class="num">' + fmt(r.C.n) +
      '</td><td class="num">' + fmt(r.C.p) + '</td><td class="num">' + fmt(r.C.k) + '</td><td colspan="2"></td></tr>' +
      "</tbody></table></div>" +
      '<button class="plus" onclick="sbKulturHinzu()">+ Kultur hinzufügen</button>' +
      (r.saldoErtrag !== null ? '<div class="notiz">Ertrag der Saldo-Kulturen aus der Grundfutterbilanz: <b>' + fmt(r.saldoErtrag, 1) +
        " dt TS/ha</b> auf " + fmt(r.saldoFlaeche, 2) + " ha.</div>" : "") +
      "</div>" +

      '<div class="karte"><h2>Zusammenzug nach Formularteilen</h2><div class="kennzahlen">' +
      kennzahl(fmt(r.C1.n) + " / " + fmt(r.C1.p), "C1 Grundfutter – N / P₂O₅ kg · " + fmt(r.C1.flaeche, 2) + " ha") +
      kennzahl(fmt(r.C2.n) + " / " + fmt(r.C2.p), "C2 Ackerkulturen – N / P₂O₅ kg · " + fmt(r.C2.flaeche, 2) + " ha") +
      kennzahl(fmt(r.C3.n) + " / " + fmt(r.C3.p), "C3 Spezialkulturen – N / P₂O₅ kg · " + fmt(r.C3.flaeche, 2) + " ha") +
      kennzahl(fmt(r.CB.flaeche, 2) + " ha", "Biodiversitätsförder- und übrige Flächen ohne Nährstoffbedarf") +
      "</div>" +
      '<div class="rechenweg" style="margin-top:13px">Innerbetrieblicher Nährstofftransfer: ungedüngte Wiesen liefern ' + fmt(r.gfT) +
      " dt TS. Anrechenbar sind höchstens ein Viertel des GFprod (" + fmt(r.gfProd / 4) + " dt TS), also " + fmt(r.transferBasis) +
      " dt TS × 0.4 kg P₂O₅/dt = <b>" + fmt(r.T) + " kg P₂O₅</b>, die in der Gesamtbilanz abgezogen werden.</div>" +
      "</div>";
  }
  window.sbKulturHinzu = function () {
    var liste = D.KULTUREN.map(function (kk) {
      var det = kk.modus === "wiese" ? "N " + kk.n + " · P₂O₅ " + kk.p + " kg je dt TS"
        : kk.modus === "acker" ? "N " + kk.n + " kg/ha · P₂O₅ " + kk.p + " kg/dt · Standardertrag " + (kk.ertragStd || "–")
          : kk.modus === "flach" ? "N " + kk.n + " · P₂O₅ " + kk.p + " kg je ha" : "kein Nährstoffbedarf";
      return { id: kk.id, label: kk.label, gruppe: kk.gruppe, detail: det };
    });
    auswahl("Kultur wählen", liste, function (e) {
      state.kulturen.push({ kultur: e.id, flaeche: 0 });
      aktualisieren();
    }, {
      label: "Eigene Kultur erfassen", aktion: function () {
        state.kulturen.push({ eigen: { label: "Eigene Kultur", modus: "flach", bereich: "ackerbau", n: 0, p: 0, k: 0, mg: 0 }, flaeche: 0 });
        aktualisieren();
      }
    });
  };
  window.sbKulturWerte = function (i) {
    var z = state.kulturen[i], kr = r.kultRows[i];
    var ref = E.kulturRef(z, state.version);
    var einheitN = kr.modus === "wiese" ? "kg je dt TS" : kr.modus === "acker" ? "kg/ha" : "kg/ha";
    var einheitP = kr.modus === "flach" ? "kg/ha" : "kg je dt TS";
    var basisRef = z.eigen ? z.eigen : (state.version === "1.19" && D.V119[z.kultur]
      ? Object.assign({}, D.kultur(z.kultur), D.V119[z.kultur]) : D.kultur(z.kultur));
    werteBearbeiten(
      "Referenzwerte – " + kr.label,
      z.eigen ? "Nährstoffbedarf der eigenen Kultur."
        : "Anpassen, wenn eine neuere Wegleitung abweichende Werte vorgibt. Leer lassen = Wert der Version " + state.version + ".",
      (z.eigen ? [{ id: "label", label: "Bezeichnung", typ: "text" }] : []).concat([
        { id: "n", label: "Stickstoff N", einheit: einheitN + " (Referenz " + basisRef.n + ")" },
        { id: "p", label: "Phosphor P₂O₅", einheit: einheitP + " (Referenz " + basisRef.p + ")" },
        { id: "k", label: "Kalium K₂O", einheit: einheitP + " (Referenz " + basisRef.k + ")" },
        { id: "mg", label: "Magnesium Mg", einheit: einheitP + " (Referenz " + basisRef.mg + ")" }
      ]),
      z.eigen ? Object.assign({}, z.eigen) : Object.assign({}, z.override || {}),
      function (out) {
        if (z.eigen) { if (out) Object.keys(out).forEach(function (kk) { z.eigen[kk] = out[kk]; }); }
        else z.override = out && Object.keys(out).length ? out : undefined;
        aktualisieren();
      }, !z.eigen);
  };

  /* =========================================================================
     Register 5 – Dünger
     ========================================================================= */
  function rDuenger() {
    var hofd = r.hofdRows.map(function (x, i) {
      var z = state.hofduenger[i];
      return "<tr><td>" + text("hofduenger." + i + ".name", z.name, { platzhalter: "Bezeichnung gemäss HODUFLU" }) + "</td>" +
        "<td>" + wahl("hofduenger." + i + ".richtung", z.richtung, [["zufuhr", "Zufuhr (+)"], ["wegfuhr", "Wegfuhr (−)"]]) + "</td>" +
        '<td class="num">' + zahl("hofduenger." + i + ".nges", z.nges, { step: 1, klasse: "klein" }) + "</td>" +
        '<td class="num">' + zahl("hofduenger." + i + ".p", z.p, { step: 1, klasse: "klein" }) + "</td>" +
        '<td style="text-align:center">' + haken("hofduenger." + i + ".vollmist", z.vollmist, "Vollmist aus Aufstallung Typ 100 oder 50") + "</td>" +
        '<td class="num abgeleitet">' + fmtS(x.nges) + "</td>" +
        '<td><button class="iknopf" onclick="sbLoesche(\'hofduenger\',' + i + ')">✕</button></td></tr>';
    }).join("");

    var dueng = r.duengRows.map(function (x, i) {
      var z = state.duenger[i];
      var istKompost = z.typ === "kompost";
      return "<tr><td>" + text("duenger." + i + ".name", z.name, { platzhalter: "Bezeichnung des Düngers" }) + "</td>" +
        "<td>" + wahl("duenger." + i + ".typ", z.typ || "mineralisch",
          [["mineralisch", "Mineraldünger"], ["organisch", "Organischer Dünger / Recyclingdünger"], ["kompost", "Kompost (10 % des Nges)"], ["stroh", "Stroh / Einstreu"]]) + "</td>" +
        '<td class="num">' + (istKompost ? zahl("duenger." + i + ".nges", z.nges, { step: 1, klasse: "klein" }) : "–") + "</td>" +
        '<td class="num">' + (istKompost ? '<span class="abgeleitet">' + fmt(x.nverf, 1) + "</span>"
          : zahl("duenger." + i + ".nverf", z.nverf, { step: 0.1, klasse: "klein" })) + "</td>" +
        '<td class="num">' + zahl("duenger." + i + ".p", z.p, { step: 0.1, klasse: "klein" }) + "</td>" +
        '<td><button class="iknopf" onclick="sbLoesche(\'duenger\',' + i + ')">✕</button></td></tr>';
    }).join("");

    var verg = r.vergRows.map(function (x, i) {
      var z = state.vergaerung[i];
      var istER = z.typ === "ernterueckstaende", istDirekt = z.typ === "gaergut";
      return "<tr><td>" + text("vergaerung." + i + ".name", z.name, { platzhalter: "Bezeichnung gemäss HODUFLU" }) + "</td>" +
        "<td>" + wahl("vergaerung." + i + ".typ", z.typ,
          [["fluessig", "Gärgülle / Gärdünngülle"], ["fest", "Gärmist / festes Gärgut (20 %)"],
          ["gaergut", "Gärgut / flüssiges Gärgut (Nverf direkt)"], ["ernterueckstaende", "Ernterückstände Gemüse"]]) + "</td>" +
        "<td>" + wahl("vergaerung." + i + ".richtung", z.richtung, [["zufuhr", "Zufuhr (+)"], ["wegfuhr", "Wegfuhr (−)"]]) + "</td>" +
        '<td class="num">' + (istER ? zahl("vergaerung." + i + ".menge", z.menge, { step: 1, klasse: "klein", titel: "Tonnen Frischsubstanz" })
          : zahl("vergaerung." + i + ".nges", z.nges, { step: 1, klasse: "klein" })) + "</td>" +
        '<td class="num">' + (istDirekt ? zahl("vergaerung." + i + ".nverf", z.nverf, { step: 1, klasse: "klein" })
          : '<span class="abgeleitet">' + fmt(x.nverf, 1) + "</span>") + "</td>" +
        '<td class="num">' + (istER ? '<span class="abgeleitet">' + fmt(x.p, 1) + "</span>"
          : zahl("vergaerung." + i + ".p", z.p, { step: 1, klasse: "klein" })) + "</td>" +
        '<td><button class="iknopf" onclick="sbLoesche(\'vergaerung\',' + i + ')">✕</button></td></tr>';
    }).join("");

    return '<div class="karte"><h2>Zu- und Wegfuhr unvergärter Hofdünger <span class="form">Formular A3</span></h2>' +
      '<p class="hinweis">Massgebend sind die in HODUFLU bestätigten Lieferungen. Mengen positiv eintragen und die Richtung wählen. ' +
      '«Vollmist» nur ankreuzen, wenn der Mist aus einer Aufstallung vom Typ 100 oder 50 stammt – das senkt den N-Ausnutzungsgrad.</p>' +
      '<div class="tabellenrahmen"><table><thead><tr><th>Hofdünger</th><th>Richtung</th><th class="num">Nges kg</th>' +
      '<th class="num">P₂O₅ kg</th><th style="text-align:center">Vollmist</th><th class="num">Saldo Nges</th><th></th></tr></thead>' +
      "<tbody>" + hofd +
      '<tr class="summe"><td>Total A3</td><td></td><td class="num">' + fmt(r.A3.nges) + '</td><td class="num">' + fmt(r.A3.p) +
      '</td><td class="num">' + fmt(r.V2) + '</td><td colspan="2"></td></tr></tbody></table></div>' +
      '<button class="plus" onclick="sbHofdHinzu()">+ Hofdünger-Position</button>' +
      '<div class="rechenweg">Anteil Vollmist = (V1 ' + fmt(r.V1) + " + V2 " + fmt(r.V2) + ") ÷ (A1 " + fmt(r.A1.nges) +
      " + A3 " + fmt(r.A3.nges) + ") = <b>" + fmt(r.vollmistProz, 1) + " %</b></div></div>" +

      '<div class="karte"><h2>Übrige Dünger <span class="form">Formular D</span></h2>' +
      '<p class="hinweis">Alle Dünger, die weder unvergärter Hofdünger noch Vergärungsprodukt sind: Mineraldünger, Recyclingdünger, ' +
      'Kompost, zugeführte Rüstabfälle, zugekauftes Stroh. Bei Mineraldüngern entspricht Nverf dem deklarierten N-Gehalt; bei Kompost ' +
      'werden 10 % des Gesamtstickstoffs angerechnet.</p>' +
      '<div class="tabellenrahmen"><table><thead><tr><th>Dünger</th><th>Art</th><th class="num">Nges kg</th>' +
      '<th class="num">Nverf kg</th><th class="num">P₂O₅ kg</th><th></th></tr></thead><tbody>' + dueng +
      (r.schleppN ? '<tr><td colspan="3">Emissionsmindernde Ausbringung (' + fmt(r.schleppHa, 2) + ' ha × 6 kg Nverf/ha)</td>' +
        '<td class="num abgeleitet">' + fmt(r.schleppN) + '</td><td class="num">–</td><td></td></tr>' : "") +
      '<tr class="summe"><td>Total D</td><td></td><td></td><td class="num">' + fmt(r.D.nverf) + '</td><td class="num">' + fmt(r.D.p) +
      "</td><td></td></tr></tbody></table></div>" +
      '<button class="plus" onclick="sbDuengHinzu()">+ Dünger-Position</button>' +
      '<div class="feldgruppe" style="margin-top:13px"><div class="feld">' +
      '<label>Emissionsmindernd begüllte Fläche <span class="einheit">ha · 6 kg Nverf je ha</span></label>' +
      zahl("schleppschlauchHa", state.schleppschlauchHa) + "</div></div>" +
      "</div>" +

      '<div class="karte"><h2>Vergärungsprodukte und Ernterückstände Gemüse <span class="form">Formular E</span></h2>' +
      '<p class="hinweis">Gärgülle und Gärdünngülle: Nverf = Nges × betriebsspezifischer Ausnutzungsgrad (65 % − 0.15 % je % offene Ackerfläche), ' +
      'aktuell <b>' + fmt(r.ausnutzVerg * 100, 1) + ' %</b>. Feste Vergärungsprodukte: 20 %. Bei Gärgut wird der Nverf direkt aus HODUFLU übernommen. ' +
      'Ernterückstände in Tonnen Frischsubstanz erfassen; Wegfuhren über die Richtung wählen.</p>' +
      '<div class="tabellenrahmen"><table><thead><tr><th>Position</th><th>Art</th><th>Richtung</th>' +
      '<th class="num">Nges kg / t FS</th><th class="num">Nverf kg</th><th class="num">P₂O₅ kg</th><th></th></tr></thead><tbody>' +
      (verg || '<tr><td colspan="7" style="color:var(--grau);padding:11px 7px">Keine Vergärungsprodukte oder Ernterückstände erfasst.</td></tr>') +
      (verg ? '<tr class="summe"><td colspan="4">Total E</td><td class="num">' + fmt(r.E.nverf) + '</td><td class="num">' + fmt(r.E.p) + "</td><td></td></tr>" : "") +
      "</tbody></table></div>" +
      '<button class="plus" onclick="sbVergHinzu()">+ Position hinzufügen</button></div>';
  }
  window.sbHofdHinzu = function () { state.hofduenger.push({ name: "", richtung: "zufuhr", nges: 0, p: 0, vollmist: false }); aktualisieren(); };
  window.sbDuengHinzu = function () { state.duenger.push({ name: "", typ: "mineralisch", nverf: 0, p: 0 }); aktualisieren(); };
  window.sbVergHinzu = function () { state.vergaerung.push({ name: "", typ: "fluessig", richtung: "zufuhr", nges: 0, nverf: 0, p: 0, menge: 0 }); aktualisieren(); };

  /* =========================================================================
     Register 6 – Bilanz
     ========================================================================= */
  function zeileB(bez, erkl, n, p, klasse) {
    return '<tr' + (klasse ? ' class="' + klasse + '"' : "") + "><td>" + bez +
      (erkl ? '<span class="erklaerung">' + erkl + "</span>" : "") + "</td>" +
      '<td class="num">' + n + '</td><td class="num">' + p + "</td></tr>";
  }
  function rBilanz() {
    var okN = r.ausgeglichenN, okP = r.ausgeglichenP;
    return '<div class="karte"><h2>Gesamtbilanz <span class="form">Formular F</span></h2>' +
      '<p class="hinweis">Die Bilanz gilt als ausgeglichen, wenn die verfügbare Nährstoffmenge den Bedarf der Kulturen nicht übersteigt – ' +
      "der Saldo also null oder negativ ist.</p>" +
      '<div class="rechenweg">Betriebsspezifischer N-Ausnutzungsgrad: 60 % − ' + fmt(r.abzugOA, 1) +
      " % (" + fmt(r.oaProz, 1) + " % offene Ackerfläche × 0.15) − " + fmt(r.abzugVM, 1) +
      " % (" + fmt(r.vollmistProz, 1) + " % Vollmist × 0.12) = <b>" + fmt(r.ausnutzProz, 1) + " %</b></div>" +
      '<table class="bilanztabelle"><thead><tr><th></th><th class="num">Nverf kg</th><th class="num">P₂O₅ kg</th></tr></thead><tbody>' +
      zeileB("Nährstoffe aus der Tierhaltung (A2)",
        "Nges " + fmt(r.A2.nges) + " kg × " + fmt(r.ausnutzProz, 1) + " % Ausnutzungsgrad; Phosphor unverändert",
        fmt(r.A2verf), fmt(r.A2.p)) +
      zeileB("− Nährstoffbedarf der Kulturen (C)",
        "C1 Grundfutter " + fmt(r.C1.n) + " · C2 Ackerbau " + fmt(r.C2.n) + " · C3 Spezialkulturen " + fmt(r.C3.n) + " kg N",
        "−" + fmt(r.C.n), "−" + fmt(r.C.p)) +
      zeileB("Zwischenbilanz",
        "Eigenversorgungsgrad: " + fmt(r.eigenN) + " % beim Stickstoff, " + fmt(r.eigenP) + " % beim Phosphor",
        fmt(r.A2verf - r.C.n), fmt(r.A2.p - r.C.p), "hervor") +
      zeileB("+ Zu- und Wegfuhr unvergärter Hofdünger (A3)",
        "Nges " + fmt(r.A3.nges) + " kg × " + fmt(r.ausnutzProz, 1) + " % Ausnutzungsgrad",
        fmt(r.A3verf), fmt(r.A3.p)) +
      zeileB("+ Zufuhr übriger Dünger (D)", "Mineraldünger, Recyclingdünger, Kompost, Stroh", fmt(r.D.nverf), fmt(r.D.p)) +
      zeileB("+ Vergärungsprodukte und Ernterückstände (E)", "", fmt(r.E.nverf), fmt(r.E.p)) +
      zeileB("− Innerbetrieblicher Nährstofftransfer (T)",
        fmt(r.transferBasis) + " dt TS ungedüngtes Grundfutter × 0.4 kg P₂O₅/dt", "–", "−" + fmt(r.T)) +
      zeileB("<b>Gesamtbilanz</b>", "",
        '<span class="' + (okN ? "gut" : "schlecht") + '">' + fmtS(r.bilN) + "</span>",
        '<span class="' + (okP ? "gut" : "schlecht") + '">' + fmtS(r.bilP) + "</span>", "endsumme") +
      "</tbody></table>" +
      '<div class="kennzahlen">' +
      kennzahl(okN ? "ausgeglichen" : "Überschuss", okN
        ? "Stickstoffbilanz – Reserve " + fmt(-r.bilN) + " kg Nverf (" + fmt(r.C.n ? -100 * r.bilN / r.C.n : 0) + " % des Bedarfs)"
        : "Stickstoffbilanz – " + fmt(r.bilN) + " kg Nverf über dem Bedarf", okN ? "" : "fehler") +
      kennzahl(okP ? "ausgeglichen" : "Überschuss", okP
        ? "Phosphorbilanz – Reserve " + fmt(-r.bilP) + " kg P₂O₅ (" + fmt(r.C.p ? -100 * r.bilP / r.C.p : 0) + " % des Bedarfs)"
        : "Phosphorbilanz – " + fmt(r.bilP) + " kg P₂O₅ über dem Bedarf", okP ? "" : "fehler") +
      kennzahl(fmt(r.df > 0 ? r.zufuhrN / r.df : 0, 1) + " kg", "Verfügbarer Stickstoff je ha düngbare Fläche") +
      kennzahl(fmt(r.df > 0 ? r.zufuhrP / r.df : 0, 1) + " kg", "Phosphor P₂O₅ je ha düngbare Fläche") +
      "</div></div>" +

      '<div class="karte"><h2>Bilanz ausdrucken</h2>' +
      '<p class="hinweis">Der Ausdruck enthält alle Formularteile A bis F mit den Einzelpositionen und Unterschriftsfeldern. ' +
      "Im Druckdialog «Als PDF speichern» wählen.</p>" +
      '<button class="knopf stark" style="background:var(--gruen);color:#fff;border-color:var(--gruen);padding:11px 20px;font-size:14px" onclick="sbDrucken()">Bilanz als PDF ausgeben</button>' +
      "</div>" + rMeldungenKarte();
  }

  function rMeldungenKarte() {
    if (!r.meldungen.length) return '<div class="karte"><h2>Prüfhinweise</h2>' +
      '<div class="meldung erfolg"><span class="sym">✓</span><span>Keine Hinweise – alle Plausibilitätsprüfungen bestanden.</span></div></div>';
    var ordnung = { fehler: 0, warnung: 1, info: 2 };
    var sortiert = r.meldungen.slice().sort(function (a, b) { return ordnung[a.stufe] - ordnung[b.stufe]; });
    return '<div class="karte"><h2>Prüfhinweise</h2>' +
      sortiert.map(function (m) {
        return '<div class="meldung ' + m.stufe + '"><span class="sym">' +
          (m.stufe === "fehler" ? "!" : m.stufe === "warnung" ? "▲" : "i") + "</span><span>" + h(m.text) + "</span></div>";
      }).join("") + "</div>";
  }

  /* =========================================================================
     Register 7 – Düngungsplanung
     ========================================================================= */
  function rPlanung() {
    var p = state.planung;
    /* Zulässige Zufuhr über «übrige Dünger», damit die Bilanz gerade ausgeglichen bleibt */
    var spielraumN = r.C.n - r.A2verf - r.A3verf - r.E.nverf;
    var spielraumP = r.C.p - r.A2.p - r.A3.p - r.E.p + r.T;

    var summeN = 0, summeP = 0;
    var zeilen = p.duenger.map(function (d, i) {
      var n = E.num(d.menge) * E.num(d.nverf), pp = E.num(d.menge) * E.num(d.p);
      summeN += n; summeP += pp;
      return "<tr><td>" + text("planung.duenger." + i + ".name", d.name, { platzhalter: "Dünger" }) + "</td>" +
        "<td>" + wahl("planung.duenger." + i + ".einheit", d.einheit || "t", [["t", "Tonnen"], ["m³", "Kubikmeter"], ["kg", "Kilogramm"]]) + "</td>" +
        '<td class="num">' + zahl("planung.duenger." + i + ".menge", d.menge, { step: 0.1, klasse: "klein" }) + "</td>" +
        '<td class="num">' + zahl("planung.duenger." + i + ".nverf", d.nverf, { step: 0.01, klasse: "klein" }) + "</td>" +
        '<td class="num">' + zahl("planung.duenger." + i + ".p", d.p, { step: 0.01, klasse: "klein" }) + "</td>" +
        '<td class="num abgeleitet">' + fmt(n) + '</td><td class="num abgeleitet">' + fmt(pp) + "</td>" +
        '<td><button class="iknopf" onclick="sbLoesche(\'planung.duenger\',' + i + ')">✕</button></td></tr>';
    }).join("");

    var kulturZeilen = "", normTotal = 0, planTotal = 0;
    r.kultRows.forEach(function (kr) {
      if (kr.modus === "null" || kr.flaeche <= 0) return;
      var geplant = p.proKultur[kr.idx];
      var g = geplant === undefined || geplant === "" ? "" : E.num(geplant);
      var total = (g === "" ? 0 : g) * kr.flaeche;
      normTotal += kr.n; planTotal += total;
      var anteil = kr.nProHa > 0 && g !== "" ? 100 * g / kr.nProHa : null;
      kulturZeilen += "<tr><td>" + h(kr.label) + "</td>" +
        '<td class="num abgeleitet">' + fmt(kr.flaeche, 2) + "</td>" +
        '<td class="num abgeleitet">' + fmt(kr.nProHa) + "</td>" +
        '<td class="num abgeleitet">' + fmt(kr.n) + "</td>" +
        '<td class="num">' + zahl("planung.proKultur." + kr.idx, geplant, { step: 5, klasse: "klein" }) + "</td>" +
        '<td class="num abgeleitet">' + (g === "" ? "–" : fmt(total)) + "</td>" +
        '<td class="num">' + (anteil === null ? (g !== "" && g > 0 ? '<span class="etikett rot">Norm 0</span>' : "–")
          : '<span class="etikett ' + (anteil > 110 ? "rot" : anteil > 100 ? "gelb" : "gruen") + '">' + fmt(anteil) + " %</span>") + "</td></tr>";
    });

    var ausschoepfN = spielraumN > 0 ? 100 * summeN / spielraumN : (summeN > 0 ? 999 : 0);
    var ausschoepfP = spielraumP > 0 ? 100 * summeP / spielraumP : (summeP > 0 ? 999 : 0);
    var gesamtNverf = summeN + r.A2verf + r.A3verf + r.E.nverf;
    var g = p.grenzwerte;
    var prozentNorm = r.C.n > 0 ? 100 * gesamtNverf / r.C.n : 0;
    var nProHa = r.df > 0 ? gesamtNverf / r.df : 0;

    return '<div class="karte"><h2>Spielraum aus der Bilanz</h2>' +
      '<p class="hinweis">Wie viel Stickstoff und Phosphor über zugekaufte Dünger noch zugeführt werden darf, ohne dass die Bilanz kippt. ' +
      "Die Werte stammen direkt aus den Registern 1 bis 5 – es gibt keine getrennte Datenhaltung.</p>" +
      '<div class="kennzahlen">' +
      kennzahl(fmt(spielraumN) + " kg", "Zulässige Zufuhr über übrige Dünger (Nverf)", spielraumN < 0 ? "fehler" : "") +
      kennzahl(fmt(spielraumP) + " kg", "Zulässige Zufuhr über übrige Dünger (P₂O₅)", spielraumP < 0 ? "fehler" : "") +
      kennzahl(fmt(ausschoepfN) + " %", "Ausschöpfung des Stickstoff-Spielraums durch die Planung", ausschoepfN > 100 ? "fehler" : ausschoepfN > 90 ? "warn" : "") +
      kennzahl(fmt(ausschoepfP) + " %", "Ausschöpfung des Phosphor-Spielraums durch die Planung", ausschoepfP > 100 ? "fehler" : ausschoepfP > 90 ? "warn" : "") +
      "</div></div>" +

      '<div class="karte"><h2>Geplanter Düngereinsatz</h2>' +
      '<p class="hinweis">Mengen und Gehalte der Dünger, die eingekauft bzw. eingesetzt werden sollen. Gehalte je Einheit gemäss Lieferschein oder Gehaltsattest.</p>' +
      '<div class="tabellenrahmen"><table><thead><tr><th>Dünger</th><th>Einheit</th><th class="num">Menge</th>' +
      '<th class="num">Nverf je Einheit</th><th class="num">P₂O₅ je Einheit</th><th class="num">Nverf total</th>' +
      '<th class="num">P₂O₅ total</th><th></th></tr></thead><tbody>' + zeilen +
      '<tr class="summe"><td colspan="5">Total geplante Dünger</td><td class="num">' + fmt(summeN) +
      '</td><td class="num">' + fmt(summeP) + "</td><td></td></tr></tbody></table></div>" +
      '<button class="plus" onclick="sbPlanDuengHinzu()">+ Dünger</button></div>' +

      '<div class="karte"><h2>Düngung je Kultur</h2>' +
      '<p class="hinweis">Die Norm entspricht dem Netto-Nährstoffbedarf gemäss Wegleitung. Leguminosen und Biodiversitätsförderflächen haben eine Norm von null, ' +
      "binden aber Stickstoff – das in der Fruchtfolge mitdenken.</p>" +
      '<div class="tabellenrahmen"><table><thead><tr><th>Kultur</th><th class="num">Fläche ha</th><th class="num">Norm kg N/ha</th>' +
      '<th class="num">Norm total kg</th><th class="num">Geplant kg N/ha</th><th class="num">Geplant total kg</th>' +
      '<th class="num">Anteil Norm</th></tr></thead><tbody>' + kulturZeilen +
      '<tr class="summe"><td>Total</td><td></td><td></td><td class="num">' + fmt(normTotal) +
      '</td><td></td><td class="num">' + fmt(planTotal) + '</td><td class="num">' +
      (normTotal > 0 ? fmt(100 * planTotal / normTotal) + " %" : "–") + "</td></tr></tbody></table></div>" +
      '<p class="hinweis">Geplante Kulturdüngung ' + fmt(planTotal) + " kg N gegenüber verfügbaren " + fmt(summeN) +
      " kg Nverf aus den geplanten Düngern – Differenz " + fmtS(summeN - planTotal) + " kg.</p></div>" +

      '<div class="karte"><h2>Betriebliche Leitplanken</h2>' +
      '<p class="hinweis">Frei wählbare Grenzwerte für die interne Kontrolle, zum Beispiel aus den Richtlinien des biologischen Landbaus. ' +
      "Diese Werte sind nicht Teil der Suisse-Bilanz und mit den geltenden Richtlinien abzugleichen.</p>" +
      '<div class="feldgruppe">' +
      '<div class="feld"><label>Prüfung aktiv</label>' + wahl("planung.grenzwerte.aktiv", g.aktiv ? "ja" : "nein", [["ja", "Ja"], ["nein", "Nein"]]) + "</div>" +
      '<div class="feld"><label>Höchstanteil an der N-Norm <span class="einheit">%</span></label>' + zahl("planung.grenzwerte.maxProzentNorm", g.maxProzentNorm, { step: 1, klasse: "klein" }) + "</div>" +
      '<div class="feld"><label>Höchstwert Nverf je ha DF <span class="einheit">kg/ha</span></label>' + zahl("planung.grenzwerte.maxNproHa", g.maxNproHa, { step: 0.5, klasse: "klein" }) + "</div>" +
      "</div>" +
      (String(g.aktiv) === "ja" || g.aktiv === true ? '<div class="kennzahlen">' +
        kennzahl(fmt(prozentNorm) + " %", "Gesamter verfügbarer Stickstoff in Prozent der Norm (Grenzwert " + fmt(g.maxProzentNorm) + " %)",
          prozentNorm > E.num(g.maxProzentNorm) ? "warn" : "") +
        kennzahl(fmt(nProHa, 1) + " kg/ha", "Nverf je ha düngbare Fläche (Grenzwert " + fmt(g.maxNproHa, 1) + " kg/ha)",
          nProHa > E.num(g.maxNproHa) ? "warn" : "") +
        "</div>" : "") +
      "</div>";
  }
  window.sbPlanDuengHinzu = function () { state.planung.duenger.push({ name: "", einheit: "t", menge: 0, nverf: 0, p: 0 }); aktualisieren(); };

  /* =========================================================================
     Register – Prüfung
     ========================================================================= */
  var testCache = null;
  function rPruefung() {
    if (!testCache) testCache = T.suite();
    var gruppen = [];
    testCache.tests.forEach(function (t) { if (gruppen.indexOf(t.gruppe) < 0) gruppen.push(t.gruppe); });
    var html = gruppen.map(function (gr) {
      var liste = testCache.tests.filter(function (t) { return t.gruppe === gr; });
      var ok = liste.filter(function (t) { return t.ok; }).length;
      var alleOk = ok === liste.length;
      return '<div class="testgruppe"><div class="kopf"><span>' + (alleOk ? "✓ " : "✗ ") + h(gr) + "</span>" +
        '<span class="etikett ' + (alleOk ? "gruen" : "rot") + '">' + ok + " / " + liste.length + "</span></div>" +
        (alleOk ? "" : '<div class="testliste">' + liste.filter(function (t) { return !t.ok; }).map(function (t) {
          return '<div class="testzeile rot"><span class="st schlecht">✗</span><span class="nm">' + h(t.name) +
            '</span><span class="vl">ist ' + (typeof t.ist === "number" ? fmt(t.ist, 3) : h(t.ist)) +
            " · soll " + (typeof t.soll === "number" ? fmt(t.soll, 3) : h(t.soll)) + "</span></div>";
        }).join("") + "</div>") + "</div>";
    }).join("");

    return '<div class="karte"><h2>Selbstprüfung des Rechenwerks</h2>' +
      '<p class="hinweis">Der Rechenkern wird bei jedem Aufruf gegen die Rechenbeispiele der Wegleitung, gegen eine vollständig ' +
      "gerechnete Bilanz dieses Betriebs sowie gegen Prüfsummen sämtlicher Referenzwerte getestet. Schlägt ein Test fehl, " +
      "ist den Ergebnissen nicht zu trauen.</p>" +
      '<div class="meldung ' + (testCache.alleOk ? "erfolg" : "fehler") + '"><span class="sym">' +
      (testCache.alleOk ? "✓" : "!") + "</span><span><b>" + testCache.bestanden + " von " + testCache.total +
      " Prüfungen bestanden.</b> " + (testCache.alleOk
        ? "Das Rechenwerk arbeitet wie in der Wegleitung Suisse-Bilanz beschrieben."
        : "Es bestehen Abweichungen – bitte die betroffenen Punkte prüfen.") + "</span></div>" +
      html + "</div>" +

      '<div class="karte"><h2>Prüfhinweise zur aktuellen Bilanz</h2>' +
      (r.meldungen.length ? "" : '<p class="hinweis">Keine offenen Punkte.</p>') + "</div>" +
      rMeldungenKarte() +

      '<div class="karte"><h2>Grundlagen</h2>' +
      '<p class="hinweis">Referenzmethode: Wegleitung Suisse-Bilanz, Version ' + h(state.version) +
      ". Referenzwerte aus den Tabellen 1 bis 6 der Wegleitung: " + D.TIERE.length + " Tierkategorien und " +
      D.KULTUREN.length + " Kulturen. Umgesetzt sind die elf Berechnungsschritte einschliesslich der Korrekturen für " +
      "Milchkühe, Rindviehmast und Kleinwiederkäuer, der ertragsabhängigen N-Korrektur, der Laufhof- und Weideabzüge, " +
      "des Vollmistanteils, des betriebsspezifischen N-Ausnutzungsgrads und des innerbetrieblichen Nährstofftransfers.</p>" +
      '<p class="hinweis">Dieses Werkzeug ist ein betriebseigenes Hilfsmittel und ersetzt weder die Referenzmethode noch eine amtliche Prüfung. ' +
      "Massgebend sind die Wegleitung und die geltende Gesetzgebung.</p></div>";
  }

  /* =========================================================================
     Kopfleiste, Navigation, Gerüst
     ========================================================================= */
  var REGISTER = [
    ["betrieb", "1", "Betrieb"], ["tiere", "2", "Tiere"], ["grundfutter", "3", "Grundfutter"],
    ["kulturen", "4", "Kulturen"], ["duenger", "5", "Dünger"], ["bilanz", "6", "Bilanz & PDF"],
    ["planung", "7", "Planung"], ["pruefung", "", "Prüfung"]
  ];

  function rBilanzleiste() {
    var okN = r.ausgeglichenN, okP = r.ausgeglichenP;
    var anzF = r.fehler.length, anzW = r.warnungen.length;
    return '<div class="zelle"><div class="lab">Stickstoffbilanz Nverf</div><div class="wert ' + (okN ? "gut" : "schlecht") + '">' +
      fmtS(r.bilN) + ' <small>kg</small></div></div>' +
      '<div class="zelle"><div class="lab">Phosphorbilanz P₂O₅</div><div class="wert ' + (okP ? "gut" : "schlecht") + '">' +
      fmtS(r.bilP) + ' <small>kg</small></div></div>' +
      '<div class="zelle"><div class="lab">N-Ausnutzungsgrad</div><div class="wert neutral">' + fmt(r.ausnutzProz, 1) + ' <small>%</small></div></div>' +
      '<div class="zelle"><div class="lab">Bedarf Kulturen</div><div class="wert neutral">' + fmt(r.C.n) + ' <small>kg N</small></div></div>' +
      '<div class="zelle klick" onclick="sbZeige(\'pruefung\')"><div class="lab">Prüfhinweise</div><div class="wert ' +
      (anzF ? "schlecht" : anzW ? "" : "gut") + '" ' + (anzW && !anzF ? 'style="color:var(--gelb-tinte)"' : "") + ">" +
      (anzF ? anzF + (anzF === 1 ? " Fehler" : " Fehler")
        : anzW ? anzW + (anzW === 1 ? " Hinweis" : " Hinweise") : "in Ordnung") + "</div></div>";
  }

  function aktualisieren() {
    var y = window.scrollY;
    try {
      r = E.berechne(state);
    } catch (e) {
      document.getElementById("inhalt").innerHTML =
        '<div class="karte"><div class="meldung fehler"><span class="sym">!</span><span><b>Die Berechnung ist fehlgeschlagen.</b><br>' +
        h(e && e.message) + "</span></div></div>";
      return;
    }
    document.getElementById("bilanzleiste").innerHTML = rBilanzleiste();
    document.getElementById("nav").innerHTML = REGISTER.map(function (t) {
      var punkt = t[0] === "pruefung" && r.fehler.length ? '<span class="punkt"></span>' : "";
      return '<button class="' + (t[0] === aktiv ? "aktiv" : "") + '" onclick="sbZeige(\'' + t[0] + '\')">' +
        (t[1] ? '<span class="nr">' + t[1] + "</span>" : "") + t[2] + punkt + "</button>";
    }).join("");
    var inhalt = aktiv === "betrieb" ? rBetrieb() : aktiv === "tiere" ? rTiere() : aktiv === "grundfutter" ? rGrundfutter()
      : aktiv === "kulturen" ? rKulturen() : aktiv === "duenger" ? rDuenger() : aktiv === "bilanz" ? rBilanz()
        : aktiv === "planung" ? rPlanung() : rPruefung();
    document.getElementById("inhalt").innerHTML = inhalt +
      '<div class="fussnote">Betriebseigenes Hilfsmittel zur Berechnung der Nährstoffbilanz nach der Referenzmethode Suisse-Bilanz, Version ' +
      h(state.version) + ".<br>Keine amtliche Berechnung – massgebend sind die Wegleitung und die geltende Gesetzgebung.</div>";
    document.getElementById("kopfinfo").textContent =
      (state.betrieb.name || "Ohne Betriebsnamen") + " · " + state.betrieb.variante + " " + state.betrieb.jahr;
    window.scrollTo(0, y);
    sichereLokal();
  }
  window.sbZeige = function (id) { aktiv = id; aktualisieren(); window.scrollTo(0, 0); };

  /* Der Haken für den Saldo-Modus schreibt in ein anderes Feld */
  var origSetJa = window.sbSetJa;
  window.sbSetJa = function (pfad, ja) {
    if (/\.ertragModusSaldo$/.test(pfad)) {
      var basis = pfad.replace(/\.ertragModusSaldo$/, "");
      setze(basis + ".ertragModus", ja ? "saldo" : "manuell");
      aktualisieren();
      return;
    }
    origSetJa(pfad, ja);
  };

  /* =========================================================================
     Speichern, Laden, Zurücksetzen
     ========================================================================= */
  function sichereLokal() {
    try { localStorage.setItem(SPEICHER, JSON.stringify(state)); } catch (e) { /* Speicher nicht verfügbar */ }
  }
  window.sbSpeichern = function () {
    var name = "Naehrstoffbilanz_" + (state.betrieb.name || "Betrieb").replace(/[^\wäöüÄÖÜ-]+/g, "_") +
      "_" + state.betrieb.jahr + "_v" + state.version + ".json";
    var blob = new Blob([JSON.stringify(state, null, 1)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };
  window.sbLaden = function (ev) {
    var f = ev.target.files && ev.target.files[0];
    if (!f) return;
    var leser = new FileReader();
    leser.onload = function () {
      try {
        var geladen = JSON.parse(leser.result);
        if (typeof geladen !== "object" || geladen === null) throw new Error("Die Datei enthält keine Bilanzdaten.");
        state = uebernehmen(geladen);
        testCache = null;
        aktualisieren();
        if (state.version === "1.19") {
          alert("Diese Datei wurde mit Version 1.19 gerechnet. Für eine gültige Bilanz 2026/2027 im Register «Betrieb» auf Version 1.20 wechseln.");
        }
      } catch (e) {
        alert("Die Datei konnte nicht gelesen werden:\n" + (e && e.message));
      }
    };
    leser.readAsText(f);
    ev.target.value = "";
  };
  function uebernehmen(geladen) {
    var basis = Vorlage.leer();
    var neu = Object.assign(basis, geladen);
    neu.betrieb = Object.assign(basis.betrieb, geladen.betrieb || {});
    neu.planung = Object.assign(basis.planung, geladen.planung || {});
    neu.planung.grenzwerte = Object.assign(Vorlage.leer().planung.grenzwerte, (geladen.planung || {}).grenzwerte || {});
    ["tiere", "grundfutter", "kulturen", "hofduenger", "duenger", "vergaerung"].forEach(function (kk) {
      neu[kk] = Array.isArray(geladen[kk]) ? geladen[kk] : [];
    });
    if (!Array.isArray(neu.planung.duenger)) neu.planung.duenger = [];
    if (typeof neu.planung.proKultur !== "object" || neu.planung.proKultur === null) neu.planung.proKultur = {};
    if (neu.version !== "1.19" && neu.version !== "1.20") neu.version = "1.20";
    return neu;
  }
  window.sbNeu = function () {
    if (!confirm("Alle Eingaben verwerfen und mit einer leeren Bilanz beginnen?")) return;
    state = Vorlage.leer(); testCache = null; aktualisieren();
  };
  window.sbVorlage = function () {
    if (!confirm("Alle Eingaben verwerfen und die Betriebsvorlage laden?")) return;
    state = Vorlage.betrieb(); testCache = null; aktualisieren();
  };

  /* =========================================================================
     Druckansicht – Formulare A bis F
     ========================================================================= */
  function druckTabelle(kopf, zeilen, summe) {
    return "<table><thead><tr>" + kopf.map(function (kk) {
      return '<th' + (kk[1] ? ' class="num"' : "") + ">" + kk[0] + "</th>";
    }).join("") + "</tr></thead><tbody>" + zeilen + (summe || "") + "</tbody></table>";
  }
  window.sbDrucken = function () {
    var heute = new Date().toLocaleDateString("de-CH");
    var b = state.betrieb;
    var hl = D.hoehenlage(b.hoehenlage), zone = (D.ZONEN.filter(function (z) { return z.id === b.zone; })[0] || {}).label || "";

    var tiere = "", letzte = "";
    r.tierRows.forEach(function (t) {
      if (t.gruppe !== letzte) { letzte = t.gruppe; tiere += '<tr class="gruppe"><td colspan="9">' + h(t.gruppe) + "</td></tr>"; }
      tiere += "<tr><td>" + h(t.label) + '</td><td class="num">' + fmt(t.anzahl, 2) +
        '</td><td class="num">' + fmt(t.gfProEinheit, 1) + '</td><td class="num">' + fmt(t.gf) +
        '</td><td class="num">' + fmt(t.ngesProEinheit, 2) + '</td><td class="num">' + fmt(t.nges) +
        '</td><td class="num">' + fmt(t.p) + '</td><td class="num">' + fmt(t.k) + '</td><td class="num">' + fmt(t.mg) + "</td></tr>";
    });
    var tiereSumme = '<tr class="summe"><td>Zwischenwert A1</td><td class="num"></td><td class="num"></td><td class="num">' +
      fmt(r.A1.gf) + '</td><td class="num"></td><td class="num">' + fmt(r.A1.nges) + '</td><td class="num">' + fmt(r.A1.p) +
      '</td><td class="num">' + fmt(r.A1.k) + '</td><td class="num">' + fmt(r.A1.mg) + "</td></tr>";

    var gf = r.gfRows.map(function (g) {
      return "<tr><td>" + h(g.name || "–") + "</td><td>" +
        (g.art === "zufuhr" ? "Zufuhr" : g.art === "wegfuhr" ? "Wegfuhr" : "ausserhalb Futterfläche") +
        (g.arm ? " · nährstoffarm" : "") + '</td><td class="num">' + fmt(g.menge, 1) +
        '</td><td class="num">' + fmt(g.tsProzent, 1) + '</td><td class="num">' + fmt(g.ts, 1) + "</td></tr>";
    }).join("");

    var kult = "", letzteK = "";
    r.kultRows.forEach(function (kk) {
      if (kk.gruppe !== letzteK) { letzteK = kk.gruppe; kult += '<tr class="gruppe"><td colspan="8">' + h(kk.gruppe) + "</td></tr>"; }
      kult += "<tr><td>" + h(kk.label) + '</td><td class="num">' + fmt(kk.flaeche, 2) +
        '</td><td class="num">' + (kk.modus === "flach" || kk.modus === "null" ? "–" : fmt(kk.ertrag, 1)) +
        '</td><td class="num">' + (kk.dtTS ? fmt(kk.dtTS) : "–") +
        '</td><td class="num">' + fmt(kk.n) + '</td><td class="num">' + fmt(kk.p) +
        '</td><td class="num">' + fmt(kk.k) + '</td><td class="num">' + fmt(kk.mg) + "</td></tr>";
    });
    var kultSumme = '<tr class="summe"><td>Total C</td><td class="num">' + fmt(r.flaecheTotal, 2) +
      '</td><td class="num"></td><td class="num">' + fmt(r.gfKulturenTS) + '</td><td class="num">' + fmt(r.C.n) +
      '</td><td class="num">' + fmt(r.C.p) + '</td><td class="num">' + fmt(r.C.k) + '</td><td class="num">' + fmt(r.C.mg) + "</td></tr>";

    var hofd = r.hofdRows.map(function (x) {
      return "<tr><td>" + h(x.name || "–") + "</td><td>" + (x.richtung === "wegfuhr" ? "Wegfuhr" : "Zufuhr") +
        '</td><td class="num">' + fmtS(x.nges) + '</td><td class="num">' + fmtS(x.p) +
        "</td><td>" + (x.vollmist ? "Vollmist" : "–") + "</td></tr>";
    }).join("");
    var dueng = r.duengRows.map(function (x) {
      return "<tr><td>" + h(x.name || "–") + "</td><td>" + h(x.typ || "–") +
        '</td><td class="num">' + fmt(x.nverf, 1) + '</td><td class="num">' + fmt(x.p, 1) + "</td></tr>";
    }).join("") + (r.schleppN ? "<tr><td>Emissionsmindernde Ausbringung (" + fmt(r.schleppHa, 2) +
      ' ha)</td><td>Zuschlag</td><td class="num">' + fmt(r.schleppN, 1) + '</td><td class="num">–</td></tr>' : "");
    var verg = r.vergRows.map(function (x) {
      return "<tr><td>" + h(x.name || "–") + "</td><td>" + h(x.typ) + "</td><td>" +
        (x.richtung === "wegfuhr" ? "Wegfuhr" : "Zufuhr") + '</td><td class="num">' + fmt(x.nges, 1) +
        '</td><td class="num">' + fmt(x.nverf, 1) + '</td><td class="num">' + fmt(x.p, 1) + "</td></tr>";
    }).join("");

    var html =
      "<h1>Nährstoffbilanz nach der Referenzmethode Suisse-Bilanz</h1>" +
      '<div class="kopfzeile"><span><b>' + h(b.name || "Betrieb") + "</b></span><span>" +
      h(b.variante) + " " + h(b.jahr) + " · Wegleitung Version " + h(state.version) + " · erstellt am " + heute + "</span></div>" +
      '<div class="kopfzeile"><span>LN ' + fmt(r.ln, 2) + " ha · Bauzone " + fmt(r.bauzone, 2) + " ha · düngbare Fläche " +
      fmt(r.df, 2) + " ha · offene Ackerfläche " + fmt(r.oa, 2) + " ha (" + fmt(r.oaProz, 1) + " %)</span>" +
      "<span>" + h(zone) + " · " + h(hl.label) + "</span></div>" +

      "<h2>A1 – Tierbestand und Nährstoffanfall</h2>" +
      druckTabelle([["Tierkategorie"], ["Anzahl", 1], ["GF dt TS je Einheit", 1], ["GF dt TS", 1],
      ["Nges je Einheit", 1], ["Nges kg", 1], ["P₂O₅ kg", 1], ["K₂O kg", 1], ["Mg kg", 1]], tiere, tiereSumme) +
      '<div class="erlaeuterung">Abzug nährstoffarmes Grundfutter: ' + fmt(r.gfArm) + " dt TS → −" + fmt(r.abzArmN) +
      " kg N und −" + fmt(r.abzArmP) + " kg P₂O₅ · Laufhof: 50 % von " + fmt(r.laufhofN) + " kg → −" + fmt(r.abzLaufhof) +
      " kg N · Weide: 70 % von " + fmt(r.weideN) + " kg → −" + fmt(r.abzWeide) + " kg N<br>" +
      "<b>A2 – Nährstoffe aus der Tierhaltung: " + fmt(r.A2.nges) + " kg Nges · " + fmt(r.A2.p) + " kg P₂O₅</b> · " +
      "Vollmist V1 " + fmt(r.V1) + " kg, V2 " + fmt(r.V2) + " kg → Anteil " + fmt(r.vollmistProz, 1) + " %</div>" +

      "<h2>B – Grundfutterbilanz</h2>" +
      druckTabelle([["Futtermittel"], ["Art"], ["dt FS", 1], ["% TS", 1], ["dt TS", 1]],
        gf || '<tr><td colspan="5">Keine Zu- oder Wegfuhr erfasst.</td></tr>') +
      '<div class="erlaeuterung">Grundfutterverzehr ' + fmt(r.A1.gf) + " + Wegfuhr " + fmt(r.gfWeg) + " − Zufuhr " + fmt(r.gfZu) +
      " − Produktion ausserhalb Futterfläche " + fmt(r.gfAusser) + " = Netto-Bedarf " + fmt(r.nettoGF) + " dt TS · zuzüglich " +
      fmt(r.gfVerlust, 1) + " % Lagerverluste und " + fmt(r.gfFehler, 1) + " % Fehlerbereich → " +
      "<b>auf der Futterfläche zu produzieren: " + fmt(r.gfProd) + " dt TS</b></div>" +

      '<div class="seitenumbruch"></div><h2>C – Kulturen und Nährstoffbedarf</h2>' +
      druckTabelle([["Kultur"], ["Fläche ha", 1], ["Ertrag", 1], ["dt TS", 1], ["N kg", 1], ["P₂O₅ kg", 1], ["K₂O kg", 1], ["Mg kg", 1]], kult, kultSumme) +
      '<div class="erlaeuterung">C1 Grundfutter ' + fmt(r.C1.n) + " kg N / " + fmt(r.C1.p) + " kg P₂O₅ · C2 Ackerkulturen " +
      fmt(r.C2.n) + " / " + fmt(r.C2.p) + " · C3 Spezialkulturen " + fmt(r.C3.n) + " / " + fmt(r.C3.p) + "</div>" +

      "<h2>A3 – Zu- und Wegfuhr unvergärter Hofdünger</h2>" +
      druckTabelle([["Hofdünger"], ["Richtung"], ["Nges kg", 1], ["P₂O₅ kg", 1], ["Art"]],
        hofd || '<tr><td colspan="5">Keine Lieferungen erfasst.</td></tr>',
        hofd ? '<tr class="summe"><td>Total A3</td><td></td><td class="num">' + fmt(r.A3.nges) +
        '</td><td class="num">' + fmt(r.A3.p) + "</td><td></td></tr>" : "") +

      "<h2>D – Übrige Dünger</h2>" +
      druckTabelle([["Dünger"], ["Art"], ["Nverf kg", 1], ["P₂O₅ kg", 1]],
        dueng || '<tr><td colspan="4">Keine übrigen Dünger erfasst.</td></tr>',
        '<tr class="summe"><td>Total D</td><td></td><td class="num">' + fmt(r.D.nverf) + '</td><td class="num">' + fmt(r.D.p) + "</td></tr>") +

      (r.vergRows.length ? "<h2>E – Vergärungsprodukte und Ernterückstände Gemüse</h2>" +
        druckTabelle([["Position"], ["Art"], ["Richtung"], ["Nges kg", 1], ["Nverf kg", 1], ["P₂O₅ kg", 1]], verg,
          '<tr class="summe"><td colspan="4">Total E</td><td class="num">' + fmt(r.E.nverf) + '</td><td class="num">' + fmt(r.E.p) + "</td></tr>") : "") +

      "<h2>F – Gesamtbilanz</h2>" +
      '<div class="erlaeuterung">Betriebsspezifischer N-Ausnutzungsgrad: 60 % − ' + fmt(r.abzugOA, 1) +
      " % (offene Ackerfläche " + fmt(r.oaProz, 1) + " %) − " + fmt(r.abzugVM, 1) + " % (Vollmist " + fmt(r.vollmistProz, 1) +
      " %) = <b>" + fmt(r.ausnutzProz, 1) + " %</b> · Innerbetrieblicher Transfer: " + fmt(r.transferBasis) +
      " dt TS × 0.4 = " + fmt(r.T) + " kg P₂O₅</div>" +
      druckTabelle([[""], ["Nverf kg", 1], ["P₂O₅ kg", 1]],
        "<tr><td>Nährstoffe aus der Tierhaltung (A2)</td><td class=\"num\">" + fmt(r.A2verf) + '</td><td class="num">' + fmt(r.A2.p) + "</td></tr>" +
        '<tr><td>− Nährstoffbedarf der Kulturen (C)</td><td class="num">−' + fmt(r.C.n) + '</td><td class="num">−' + fmt(r.C.p) + "</td></tr>" +
        '<tr><td>Zwischenbilanz (Eigenversorgungsgrad ' + fmt(r.eigenN) + " % N / " + fmt(r.eigenP) + ' % P)</td><td class="num">' +
        fmt(r.A2verf - r.C.n) + '</td><td class="num">' + fmt(r.A2.p - r.C.p) + "</td></tr>" +
        '<tr><td>+ Zu- und Wegfuhr unvergärter Hofdünger (A3)</td><td class="num">' + fmt(r.A3verf) + '</td><td class="num">' + fmt(r.A3.p) + "</td></tr>" +
        '<tr><td>+ Zufuhr übriger Dünger (D)</td><td class="num">' + fmt(r.D.nverf) + '</td><td class="num">' + fmt(r.D.p) + "</td></tr>" +
        '<tr><td>+ Vergärungsprodukte und Ernterückstände (E)</td><td class="num">' + fmt(r.E.nverf) + '</td><td class="num">' + fmt(r.E.p) + "</td></tr>" +
        '<tr><td>− Innerbetrieblicher Nährstofftransfer (T)</td><td class="num">–</td><td class="num">−' + fmt(r.T) + "</td></tr>",
        '<tr class="summe"><td>Gesamtbilanz</td><td class="num">' + fmtS(r.bilN) + '</td><td class="num">' + fmtS(r.bilP) + "</td></tr>") +
      '<div class="schluss"><b>Beurteilung:</b> Stickstoffbilanz ' +
      (r.ausgeglichenN ? "ausgeglichen – Reserve " + fmt(-r.bilN) + " kg Nverf" : "NICHT ausgeglichen – Überschuss " + fmt(r.bilN) + " kg Nverf") +
      " · Phosphorbilanz " +
      (r.ausgeglichenP ? "ausgeglichen – Reserve " + fmt(-r.bilP) + " kg P₂O₅" : "NICHT ausgeglichen – Überschuss " + fmt(r.bilP) + " kg P₂O₅") + "</div>" +
      (b.bemerkung ? '<div class="erlaeuterung"><b>Bemerkungen:</b> ' + h(b.bemerkung) + "</div>" : "") +
      (r.warnungen.length ? '<div class="erlaeuterung"><b>Prüfhinweise:</b> ' +
        r.warnungen.map(function (m) { return h(m.text); }).join(" · ") + "</div>" : "") +
      '<div class="unterschrift"><div>Ort, Datum und Unterschrift der Betriebsleitung</div><div>Datum und Unterschrift der Kontrollstelle</div></div>' +
      '<div class="fuss">Berechnet mit einem betriebseigenen Hilfsmittel nach der Referenzmethode Suisse-Bilanz, Wegleitung Version ' +
      h(state.version) + ". Dies ist keine amtliche Berechnung; massgebend sind die Wegleitung und die geltende Gesetzgebung. " +
      "Die Selbstprüfung des Rechenwerks war zum Zeitpunkt des Ausdrucks " +
      ((testCache || (testCache = T.suite())).alleOk ? "vollständig bestanden (" + testCache.total + " Prüfungen)." : "NICHT vollständig bestanden.") + "</div>";

    document.getElementById("druck").innerHTML = html;
    window.print();
  };

  /* =========================================================================
     Start
     ========================================================================= */
  function start() {
    var gespeichert = null;
    try { gespeichert = localStorage.getItem(SPEICHER); } catch (e) { /* nicht verfügbar */ }
    if (gespeichert) {
      try { state = uebernehmen(JSON.parse(gespeichert)); } catch (e) { state = null; }
    }
    if (!state) state = Vorlage.betrieb();
    aktualisieren();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
