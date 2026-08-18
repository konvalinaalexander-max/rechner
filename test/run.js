#!/usr/bin/env node
/* Testlauf auf der Kommandozeile: node test/run.js */
"use strict";
require("../src/daten.js");
require("../src/engine.js");
require("../src/vorlage.js");
var T = require("../src/tests.js");

var r = T.suite();
var gruppen = [];
r.tests.forEach(function (t) { if (gruppen.indexOf(t.gruppe) < 0) gruppen.push(t.gruppe); });

function fmt(v) {
  if (typeof v === "string") return v;
  return Math.abs(v) >= 1000 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(3);
}

gruppen.forEach(function (g) {
  var list = r.tests.filter(function (t) { return t.gruppe === g; });
  var ok = list.filter(function (t) { return t.ok; }).length;
  console.log("\n\x1b[1m" + g + "\x1b[0m  (" + ok + "/" + list.length + ")");
  list.forEach(function (t) {
    var mark = t.ok ? "\x1b[32m  ok  \x1b[0m" : "\x1b[31m FAIL \x1b[0m";
    var werte = t.boolean ? "" : "   ist " + fmt(t.ist) + " · soll " + fmt(t.soll) + " (±" + t.tol + ")";
    console.log(mark + t.name + (t.ok ? "" : werte));
    if (!t.ok && t.boolean) console.log("        erwartet: " + t.soll + ", erhalten: " + t.ist);
  });
});

console.log("\n" + "─".repeat(60));
if (r.alleOk) {
  console.log("\x1b[32m\x1b[1m✓ Alle " + r.total + " Tests bestanden.\x1b[0m");
} else {
  console.log("\x1b[31m\x1b[1m✗ " + (r.total - r.bestanden) + " von " + r.total + " Tests fehlgeschlagen.\x1b[0m");
}
process.exit(r.alleOk ? 0 : 1);
