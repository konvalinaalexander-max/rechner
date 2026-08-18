#!/usr/bin/env node
/* Belastungstest: Extremwerte, Fehleingaben und Druckbild.  node test/robust.js */
"use strict";
var { chromium } = require("playwright");
var path = require("path");

var pass = 0, fail = 0, liste = [];
function ok(name, b, d) {
  if (b) { pass++; console.log("  \x1b[32mok  \x1b[0m" + name); }
  else { fail++; liste.push(name); console.log("  \x1b[31mFAIL\x1b[0m" + name + (d ? "\n        " + d : "")); }
}

(async function () {
  var browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"]
  });
  var seite = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  var fehler = [];
  seite.on("pageerror", function (e) { fehler.push(e.message); });
  seite.on("console", function (m) { if (m.type() === "error") fehler.push("console: " + m.text()); });
  seite.on("dialog", function (d) { d.accept(); });
  await seite.goto("file://" + path.join(__dirname, "..", "naehrstoffbilanz.html"));
  await seite.waitForTimeout(400);

  console.log("\n\x1b[1mExtremwerte im Rechenkern\x1b[0m");
  var faelle = [
    ["Sehr grosse Zahlen", { ln: 1e9, oa: 1e9, anzahl: 1e9, flaeche: 1e9, nverf: 1e12 }],
    ["Sehr kleine Zahlen", { ln: 1e-9, oa: 1e-9, anzahl: 1e-9, flaeche: 1e-9, nverf: 1e-9 }],
    ["Negative Zahlen", { ln: -100, oa: -50, anzahl: -20, flaeche: -10, nverf: -5000 }],
    ["Null überall", { ln: 0, oa: 0, anzahl: 0, flaeche: 0, nverf: 0 }],
    ["Unendlich und NaN", { ln: Infinity, oa: NaN, anzahl: Infinity, flaeche: NaN, nverf: -Infinity }],
    ["Zeichenketten", { ln: "abc", oa: "1,5,7", anzahl: "viele", flaeche: "10 ha", nverf: "5'000" }],
    ["null und undefined", { ln: null, oa: undefined, anzahl: null, flaeche: undefined, nverf: null }]
  ];
  for (var i = 0; i < faelle.length; i++) {
    var name = faelle[i][0], w = faelle[i][1];
    var res = await seite.evaluate(function (w) {
      var s = window.SBVorlage.betrieb();
      s.betrieb.ln = w.ln; s.betrieb.oa = w.oa;
      s.tiere[0].anzahl = w.anzahl;
      s.kulturen[0].flaeche = w.flaeche;
      s.duenger[0].nverf = w.nverf;
      try {
        var r = window.SBEngine.berechne(s);
        var zahlen = [r.bilN, r.bilP, r.C.n, r.C.p, r.A1.nges, r.A2.nges, r.gfProd, r.T,
        r.ausnutz, r.ausnutzProz, r.vollmistProz, r.oaProz, r.A2verf, r.A3verf, r.E.nverf];
        return {
          fehler: null,
          endlich: zahlen.every(function (v) { return typeof v === "number" && isFinite(v); }),
          ausnutzOk: r.ausnutzProz >= 0 && r.ausnutzProz <= 60,
          vollmistOk: r.vollmistProz >= 0 && r.vollmistProz <= 100,
          a2Ok: r.A2.nges >= 0 && r.A2.p >= 0,
          tOk: r.T >= 0
        };
      } catch (e) { return { fehler: e.message }; }
    }, w);
    ok(name + ": keine Ausnahme", !res.fehler, res.fehler);
    if (!res.fehler) {
      ok(name + ": alle Kennzahlen endlich", res.endlich);
      ok(name + ": Ausnutzungsgrad im Bereich 0–60 %", res.ausnutzOk);
      ok(name + ": Vollmistanteil im Bereich 0–100 %", res.vollmistOk);
      ok(name + ": A2 nicht negativ", res.a2Ok);
      ok(name + ": Transfer nicht negativ", res.tOk);
    }
  }

  console.log("\n\x1b[1mViele Zeilen (Leistungsverhalten)\x1b[0m");
  var dauer = await seite.evaluate(function () {
    var s = window.SBVorlage.betrieb();
    var alle = window.SBDaten.KULTUREN;
    for (var i = 0; i < alle.length; i++) s.kulturen.push({ kultur: alle[i].id, flaeche: 1 });
    var t = window.SBDaten.TIERE;
    for (var j = 0; j < t.length; j++) s.tiere.push({ tier: t[j].id, anzahl: 5, vollmist: 50, laufhofTage: 30, weideTage: 60, weideStd: 6 });
    var start = performance.now();
    var r = null;
    for (var k = 0; k < 20; k++) r = window.SBEngine.berechne(s);
    return { ms: (performance.now() - start) / 20, endlich: isFinite(r.bilN) && isFinite(r.bilP), zeilen: s.kulturen.length + s.tiere.length };
  });
  ok("Vollbestückte Bilanz (" + dauer.zeilen + " Zeilen) rechnet fehlerfrei", dauer.endlich);
  ok("Berechnung unter 50 ms (" + dauer.ms.toFixed(1) + " ms)", dauer.ms < 50);

  console.log("\n\x1b[1mAlle Kulturen und Tiere in der Oberfläche\x1b[0m");
  await seite.evaluate(function () {
    var s = window.SBVorlage.betrieb();
    window.SBDaten.KULTUREN.forEach(function (k) { s.kulturen.push({ kultur: k.id, flaeche: 0.5 }); });
    window.SBDaten.TIERE.forEach(function (t) { s.tiere.push({ tier: t.id, anzahl: 2, vollmist: 100, laufhofTage: 50, weideTage: 80, weideStd: 8 }); });
    localStorage.setItem("naehrstoffbilanz.stand", JSON.stringify(s));
    location.reload();
  });
  await seite.waitForTimeout(1200);
  for (var t2 = 0; t2 < 8; t2++) {
    await seite.locator("nav button").nth(t2).click();
    await seite.waitForTimeout(200);
  }
  ok("Alle Register mit sämtlichen Kategorien fehlerfrei", fehler.length === 0, fehler.slice(0, 3).join(" | "));
  await seite.locator("nav button", { hasText: "Kulturen" }).click();
  await seite.waitForTimeout(400);
  var zeilen = await seite.locator("#inhalt tbody tr").count();
  ok("Kulturtabelle zeigt alle Zeilen (" + zeilen + ")", zeilen > 200);
  await seite.locator("nav button", { hasText: "Tiere" }).click();
  await seite.waitForTimeout(400);
  var tierZeilen = await seite.locator("#inhalt tbody tr").count();
  ok("Tiertabelle zeigt alle Kategorien (" + tierZeilen + ")", tierZeilen > 60);

  console.log("\n\x1b[1mDruckbild\x1b[0m");
  await seite.evaluate(function () { window.print = function () { }; window.sbDrucken(); });
  await seite.waitForTimeout(600);
  await seite.emulateMedia({ media: "print" });
  await seite.waitForTimeout(300);
  var druckSichtbar = await seite.evaluate(function () {
    var d = document.getElementById("druck");
    var m = document.querySelector("main");
    return {
      druck: getComputedStyle(d).display !== "none",
      main: getComputedStyle(m).display === "none",
      hoehe: d.getBoundingClientRect().height
    };
  });
  ok("Im Druckmodus ist die Formularansicht sichtbar", druckSichtbar.druck);
  ok("Im Druckmodus ist die Bildschirmansicht ausgeblendet", druckSichtbar.main);
  ok("Druckansicht hat Inhalt (" + Math.round(druckSichtbar.hoehe) + " px)", druckSichtbar.hoehe > 1000);
  await seite.screenshot({ path: path.join(__dirname, "..", "screenshot-druck.png"), fullPage: true });
  await seite.emulateMedia({ media: "screen" });

  console.log("\n\x1b[1mZustand nach Neuladen\x1b[0m");
  await seite.evaluate(function () { window.sbVorlage(); });
  await seite.waitForTimeout(300);
  var vor = await seite.locator(".bilanzleiste .zelle").nth(0).locator(".wert").innerText();
  await seite.reload();
  await seite.waitForTimeout(700);
  var nach = await seite.locator(".bilanzleiste .zelle").nth(0).locator(".wert").innerText();
  ok("Eingaben überleben das Neuladen der Seite", vor === nach, vor + " ≠ " + nach);
  ok("Insgesamt keine Skriptfehler", fehler.length === 0, fehler.slice(0, 3).join(" | "));

  console.log("\n" + "─".repeat(60));
  if (fail === 0) console.log("\x1b[32m\x1b[1m✓ Alle " + pass + " Belastungstests bestanden.\x1b[0m");
  else { console.log("\x1b[31m\x1b[1m✗ " + fail + " von " + (pass + fail) + " fehlgeschlagen:\x1b[0m"); liste.forEach(function (f) { console.log("   · " + f); }); }
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
})();
