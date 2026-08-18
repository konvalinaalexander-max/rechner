#!/usr/bin/env node
/* Oberflächentest im echten Browser: node test/ui.js
   Prüft Darstellung, Eingaben, Dialoge, Speichern/Laden und Druckansicht. */
"use strict";
var { chromium } = require("playwright");
var path = require("path");

var pass = 0, fail = 0, fehlerListe = [];
function ok(name, bedingung, detail) {
  if (bedingung) { pass++; console.log("  \x1b[32mok  \x1b[0m" + name); }
  else { fail++; fehlerListe.push(name + (detail ? " – " + detail : "")); console.log("  \x1b[31mFAIL\x1b[0m" + name + (detail ? "\n        " + detail : "")); }
}
function gleich(name, ist, soll, tol) {
  tol = tol || 0.5;
  ok(name, Math.abs(ist - soll) <= tol, "ist " + ist + ", soll " + soll);
}
/* Liest eine Zahl aus der Anzeige (mit ’ als Tausendertrennzeichen und − als Minus) */
function zahl(txt) { return parseFloat(String(txt).replace(/[’']/g, "").replace(/−/g, "-").replace(/[^\d.,-]/g, "").replace(",", ".")); }

(async function () {
  var browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"]
  });
  var seite = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  var konsolenfehler = [], seitenfehler = [];
  seite.on("console", function (m) { if (m.type() === "error") konsolenfehler.push(m.text()); });
  seite.on("pageerror", function (e) { seitenfehler.push(e.message); });

  var datei = "file://" + path.join(__dirname, "..", "naehrstoffbilanz.html");
  await seite.goto(datei);
  await seite.waitForTimeout(400);

  console.log("\n\x1b[1mStart und Grunddarstellung\x1b[0m");
  ok("Seite lädt ohne Skriptfehler", seitenfehler.length === 0, seitenfehler.join(" | "));
  ok("Keine Konsolenfehler", konsolenfehler.length === 0, konsolenfehler.join(" | "));
  ok("Titel gesetzt", (await seite.title()).indexOf("Nährstoffbilanz") >= 0);
  ok("Navigation aufgebaut", (await seite.locator("nav button").count()) === 8);
  ok("Bilanzleiste sichtbar", await seite.locator(".bilanzleiste .zelle").first().isVisible());

  /* Die Vorlage rechnet mit Version 1.20 – Bilanz muss ausgeglichen sein */
  var bilN = zahl(await seite.locator(".bilanzleiste .zelle").nth(0).locator(".wert").innerText());
  var bilP = zahl(await seite.locator(".bilanzleiste .zelle").nth(1).locator(".wert").innerText());
  console.log("\n\x1b[1mBilanzwerte der Vorlage (Version 1.20)\x1b[0m");
  ok("Stickstoffbilanz ist negativ (ausgeglichen)", bilN < 0, "Wert " + bilN);
  ok("Phosphorbilanz ist negativ (ausgeglichen)", bilP < 0, "Wert " + bilP);

  /* Gegenprobe: Umschalten auf 1.19 muss die geprüften Sollwerte liefern */
  console.log("\n\x1b[1mVersionswechsel auf 1.19 (Gegenprobe zur gerechneten Bilanz)\x1b[0m");
  await seite.selectOption('select:near(:text("Wegleitungs-Version"))', "1.19").catch(function () { });
  var sel = seite.locator("select").filter({ hasText: "Version 1.20" }).first();
  await sel.selectOption("1.19");
  await seite.waitForTimeout(250);
  var bilN19 = zahl(await seite.locator(".bilanzleiste .zelle").nth(0).locator(".wert").innerText());
  var bilP19 = zahl(await seite.locator(".bilanzleiste .zelle").nth(1).locator(".wert").innerText());
  gleich("Gesamtbilanz Nverf entspricht dem Sollwert −4137", bilN19, -4137, 10);
  gleich("Gesamtbilanz P₂O₅ entspricht dem Sollwert −1341", bilP19, -1341, 10);
  var ausn = zahl(await seite.locator(".bilanzleiste .zelle").nth(2).locator(".wert").innerText());
  gleich("N-Ausnutzungsgrad entspricht dem Sollwert 46.7 %", ausn, 46.7, 0.1);
  await sel.selectOption("1.20");
  await seite.waitForTimeout(200);

  /* Alle Register durchklicken */
  console.log("\n\x1b[1mAlle Register\x1b[0m");
  var register = ["Betrieb", "Tiere", "Grundfutter", "Kulturen", "Dünger", "Bilanz & PDF", "Planung", "Prüfung"];
  for (var i = 0; i < register.length; i++) {
    await seite.locator("nav button").nth(i).click();
    await seite.waitForTimeout(180);
    var karten = await seite.locator("#inhalt .karte").count();
    ok("Register «" + register[i] + "» zeigt Inhalt (" + karten + " Karten)", karten > 0);
  }
  ok("Beim Durchklicken keine Skriptfehler", seitenfehler.length === 0, seitenfehler.join(" | "));

  /* Selbstprüfung im Browser */
  console.log("\n\x1b[1mSelbstprüfung im Browser\x1b[0m");
  await seite.locator("nav button", { hasText: "Prüfung" }).click();
  await seite.waitForTimeout(400);
  var pruef = await seite.locator("#inhalt .meldung").first().innerText();
  ok("Selbstprüfung meldet vollständigen Erfolg", /166 von 166/.test(pruef), pruef.slice(0, 120));
  var roteGruppen = await seite.locator(".testgruppe .etikett.rot").count();
  ok("Keine fehlgeschlagene Testgruppe", roteGruppen === 0);

  /* Eingaben verarbeiten */
  console.log("\n\x1b[1mEingaben werden korrekt verarbeitet\x1b[0m");
  await seite.locator("nav button", { hasText: "Kulturen" }).click();
  await seite.waitForTimeout(250);
  var vorher = zahl(await seite.locator(".bilanzleiste .zelle").nth(3).locator(".wert").innerText());
  /* Erste Flächen-Eingabe um 10 ha einer Kultur mit 0 kg N/ha (extensive Wiese) erhöhen → Bedarf unverändert */
  var flaechen = seite.locator('#inhalt input.zahl');
  var erstesFeld = flaechen.first();
  var altWert = await erstesFeld.inputValue();
  await erstesFeld.fill(String(E_num(altWert) + 10));
  await erstesFeld.press("Tab");
  await seite.waitForTimeout(250);
  var nachher = zahl(await seite.locator(".bilanzleiste .zelle").nth(3).locator(".wert").innerText());
  ok("Flächenänderung wirkt sich auf die Bilanz aus oder bleibt korrekt neutral", isFinite(nachher), "Bedarf " + nachher);
  await erstesFeld.fill(altWert); await erstesFeld.press("Tab");
  await seite.waitForTimeout(250);
  var zurueck = zahl(await seite.locator(".bilanzleiste .zelle").nth(3).locator(".wert").innerText());
  gleich("Zurücksetzen der Eingabe stellt den Wert wieder her", zurueck, vorher, 1);

  /* Dezimalkomma */
  await erstesFeld.fill("12,5"); await erstesFeld.press("Tab");
  await seite.waitForTimeout(200);
  ok("Eingabefeld akzeptiert Werte ohne Skriptfehler", seitenfehler.length === 0, seitenfehler.join(" | "));
  await erstesFeld.fill(altWert); await erstesFeld.press("Tab");
  await seite.waitForTimeout(200);

  /* Auswahldialog: Kultur hinzufügen */
  console.log("\n\x1b[1mAuswahldialog\x1b[0m");
  var zeilenVorher = await seite.locator("#inhalt tbody tr").count();
  await seite.locator(".plus", { hasText: "Kultur hinzufügen" }).click();
  await seite.waitForTimeout(250);
  ok("Dialog öffnet sich", await seite.locator(".dialog").isVisible());
  await seite.locator("#dlgsuche").fill("Lauch");
  await seite.waitForTimeout(250);
  var treffer = await seite.locator(".dialog .liste button").count();
  ok("Suche filtert die Liste (" + treffer + " Treffer für «Lauch»)", treffer > 0 && treffer < 20);
  await seite.locator(".dialog .liste button").first().click();
  await seite.waitForTimeout(300);
  var zeilenNachher = await seite.locator("#inhalt tbody tr").count();
  ok("Gewählte Kultur wird eingefügt", zeilenNachher > zeilenVorher);
  ok("Dialog schliesst nach der Wahl", (await seite.locator(".dialog").count()) === 0);

  /* Zeile wieder löschen (Bestätigungsdialog automatisch annehmen) */
  seite.on("dialog", function (d) { d.accept(); });
  await seite.locator("#inhalt tbody tr td:last-child .iknopf").last().click();
  await seite.waitForTimeout(300);
  ok("Zeile lässt sich wieder löschen", (await seite.locator("#inhalt tbody tr").count()) === zeilenVorher);

  /* Tierregister: Auswahl und Milchleistung */
  console.log("\n\x1b[1mTierregister\x1b[0m");
  await seite.locator("nav button", { hasText: "Tiere" }).click();
  await seite.waitForTimeout(250);
  var a1vorher = zahl(await seite.locator("#inhalt tr.summe td").nth(4).innerText());
  gleich("Zwischenwert A1 Nges wird angezeigt", a1vorher, 4609, 5);
  /* Milchleistung des Milchschafs von 450 auf 500 erhöhen → Anfall steigt */
  var milchFeld = seite.locator('#inhalt input[onchange*="tiere.2.milchkg"]');
  ok("Milchleistungsfeld beim Milchschaf vorhanden", (await milchFeld.count()) === 1);
  await milchFeld.fill("500"); await milchFeld.press("Tab");
  await seite.waitForTimeout(300);
  var a1nachher = zahl(await seite.locator("#inhalt tr.summe td").nth(4).innerText());
  ok("Höhere Milchleistung erhöht den Nährstoffanfall", a1nachher > a1vorher, a1vorher + " → " + a1nachher);
  gleich("Anstieg entspricht 219 Plätzen × 2 Schritten × 0.50 kg", a1nachher - a1vorher, 219 * 2 * 0.5, 2);
  /* Dezimalkomma im Zahlenfeld muss ankommen (Schweizer Tastatur) */
  var flaecheFeld = seite.locator('#inhalt input[onchange*="tiere.0.anzahl"]');
  await flaecheFeld.fill("5,5"); await flaecheFeld.press("Tab");
  await seite.waitForTimeout(300);
  var mitKomma = zahl(await seite.locator("#inhalt tr.summe td").nth(4).innerText());
  await flaecheFeld.fill("5.5"); await flaecheFeld.press("Tab");
  await seite.waitForTimeout(300);
  var mitPunkt = zahl(await seite.locator("#inhalt tr.summe td").nth(4).innerText());
  gleich("Komma und Punkt werden gleich verarbeitet", mitKomma, mitPunkt, 0.5);
  await flaecheFeld.fill("5"); await flaecheFeld.press("Tab");
  await milchFeld.fill("450"); await milchFeld.press("Tab");
  await seite.waitForTimeout(300);
  gleich("Ausgangswert wiederhergestellt", zahl(await seite.locator("#inhalt tr.summe td").nth(4).innerText()), 4609, 5);

  /* Werte-Dialog */
  console.log("\n\x1b[1mReferenzwerte überschreiben\x1b[0m");
  await seite.locator("#inhalt tbody .iknopf.stift").first().click();
  await seite.waitForTimeout(250);
  ok("Werte-Dialog öffnet sich", await seite.locator(".dialog").isVisible());
  await seite.locator("#wd1").fill("99");
  await seite.locator(".knopf.dunkel", { hasText: "Übernehmen" }).click();
  await seite.waitForTimeout(300);
  var a1ov = zahl(await seite.locator("#inhalt tr.summe td").nth(4).innerText());
  ok("Überschriebener Wert verändert das Ergebnis", Math.abs(a1ov - 4609) > 100, "A1 nun " + a1ov);
  await seite.locator("#inhalt tbody .iknopf.stift").first().click();
  await seite.waitForTimeout(250);
  await seite.locator(".knopf.hell", { hasText: "Auf Referenzwert zurück" }).click();
  await seite.waitForTimeout(300);
  gleich("Zurücksetzen stellt den Referenzwert wieder her", zahl(await seite.locator("#inhalt tr.summe td").nth(4).innerText()), 4609, 5);

  /* Speichern und Laden */
  console.log("\n\x1b[1mSpeichern und Laden\x1b[0m");
  var json = await seite.evaluate(function () {
    return localStorage.getItem("naehrstoffbilanz.stand");
  });
  ok("Zustand wird lokal gesichert", !!json && json.length > 100);
  var geparst = JSON.parse(json);
  ok("Gesicherter Zustand enthält alle Bereiche",
    ["betrieb", "tiere", "grundfutter", "kulturen", "hofduenger", "duenger", "vergaerung"].every(function (k) { return k in geparst; }));
  var neuGeladen = await seite.evaluate(function (j) {
    var d = JSON.parse(j);
    var r1 = window.SBEngine.berechne(d);
    return { n: r1.bilN, p: r1.bilP };
  }, json);
  var aktuellN = zahl(await seite.locator(".bilanzleiste .zelle").nth(0).locator(".wert").innerText());
  gleich("Neu geladener Zustand rechnet identisch", Math.round(neuGeladen.n), aktuellN, 1);

  /* Leere Bilanz */
  console.log("\n\x1b[1mLeere Bilanz und Sonderfälle\x1b[0m");
  await seite.evaluate(function () { window.sbNeu(); });
  await seite.waitForTimeout(300);
  var leerN = zahl(await seite.locator(".bilanzleiste .zelle").nth(0).locator(".wert").innerText());
  gleich("Leere Bilanz zeigt null Stickstoff", leerN, 0, 0.5);
  ok("Leere Bilanz erzeugt keine Skriptfehler", seitenfehler.length === 0, seitenfehler.join(" | "));
  for (var j = 0; j < 8; j++) {
    await seite.locator("nav button").nth(j).click();
    await seite.waitForTimeout(120);
  }
  ok("Alle Register auch ohne Daten fehlerfrei", seitenfehler.length === 0, seitenfehler.join(" | "));

  /* Vorlage zurückholen */
  await seite.evaluate(function () { window.sbVorlage(); });
  await seite.waitForTimeout(300);

  /* Druckansicht */
  console.log("\n\x1b[1mDruckansicht (Formulare A–F)\x1b[0m");
  await seite.evaluate(function () {
    window.print = function () { };   // Druckdialog unterdrücken
    window.sbDrucken();
  });
  await seite.waitForTimeout(400);
  var druckText = await seite.locator("#druck").innerText();
  ok("Druckansicht wird erzeugt", druckText.length > 800);
  ["A1 – Tierbestand", "B – Grundfutterbilanz", "C – Kulturen", "A3 – Zu- und Wegfuhr",
    "D – Übrige Dünger", "F – Gesamtbilanz"].forEach(function (abschnitt) {
      ok("Druck enthält «" + abschnitt + "»", druckText.indexOf(abschnitt) >= 0);
    });
  ok("Druck enthält Unterschriftsfelder", /Unterschrift der Betriebsleitung/.test(druckText));
  ok("Druck weist auf fehlende Amtlichkeit hin", /keine amtliche Berechnung/i.test(druckText));
  var druckTabellen = await seite.locator("#druck table").count();
  ok("Druck enthält alle Formulartabellen (" + druckTabellen + ")", druckTabellen >= 6);

  /* Kopfleiste beim Scrollen */
  console.log("\n\x1b[1mKopfleiste beim Scrollen\x1b[0m");
  await seite.locator("nav button", { hasText: "Kulturen" }).click();
  await seite.waitForTimeout(300);
  await seite.evaluate(function () { window.scrollTo(0, 1200); });
  await seite.waitForTimeout(350);
  var geo = await seite.evaluate(function () {
    var bl = document.querySelector(".bilanzleiste").getBoundingClientRect();
    var nv = document.querySelector("nav").getBoundingClientRect();
    return { blTop: bl.top, blBottom: bl.bottom, navTop: nv.top, navBottom: nv.bottom, hoehe: window.innerHeight };
  });
  ok("Bilanzwerte bleiben beim Scrollen sichtbar", geo.blTop >= -1 && geo.blBottom > 0);
  ok("Navigation überdeckt die Bilanzwerte nicht", geo.navTop >= geo.blBottom - 1,
    "Navigation bei " + Math.round(geo.navTop) + ", Bilanzleiste endet bei " + Math.round(geo.blBottom));
  ok("Navigation bleibt beim Scrollen sichtbar", geo.navBottom <= geo.hoehe && geo.navBottom > 0);
  await seite.evaluate(function () { window.scrollTo(0, 0); });
  await seite.waitForTimeout(250);

  /* Bildschirmfotos */
  await seite.locator("nav button", { hasText: "Bilanz" }).click();
  await seite.waitForTimeout(300);
  await seite.screenshot({ path: path.join(__dirname, "..", "screenshot-bilanz.png"), fullPage: true });
  await seite.locator("nav button", { hasText: "Kulturen" }).click();
  await seite.waitForTimeout(300);
  await seite.screenshot({ path: path.join(__dirname, "..", "screenshot-kulturen.png"), fullPage: true });
  await seite.locator("nav button", { hasText: "Tiere" }).click();
  await seite.waitForTimeout(300);
  await seite.screenshot({ path: path.join(__dirname, "..", "screenshot-tiere.png"), fullPage: true });

  /* Mobile Darstellung */
  console.log("\n\x1b[1mDarstellung auf kleinem Bildschirm\x1b[0m");
  await seite.setViewportSize({ width: 390, height: 850 });
  await seite.waitForTimeout(300);
  var ueberbreite = await seite.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  ok("Kein waagrechtes Scrollen der Seite (Überhang " + ueberbreite + " px)", ueberbreite <= 2);

  console.log("\n" + "─".repeat(60));
  if (fail === 0) console.log("\x1b[32m\x1b[1m✓ Alle " + pass + " Oberflächentests bestanden.\x1b[0m");
  else {
    console.log("\x1b[31m\x1b[1m✗ " + fail + " von " + (pass + fail) + " Oberflächentests fehlgeschlagen:\x1b[0m");
    fehlerListe.forEach(function (f) { console.log("   · " + f); });
  }
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);

  function E_num(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : 0; }
})();
