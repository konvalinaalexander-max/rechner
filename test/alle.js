#!/usr/bin/env node
/* Führt alle Testläufe nacheinander aus: node test/alle.js */
"use strict";
var { execFileSync } = require("child_process");
var laeufe = [
  ["Rechenkern", "test/run.js"],
  ["Oberfläche", "test/ui.js"],
  ["Belastung", "test/robust.js"]
];
var fehlgeschlagen = [];
laeufe.forEach(function (l) {
  process.stdout.write("\n\x1b[1m\x1b[44m  " + l[0] + "  \x1b[0m\n");
  try { execFileSync(process.execPath, [l[1]], { stdio: "inherit", cwd: __dirname + "/.." }); }
  catch (e) { fehlgeschlagen.push(l[0]); }
});
console.log("\n" + "═".repeat(60));
if (!fehlgeschlagen.length) console.log("\x1b[32m\x1b[1m✓ Alle Testläufe bestanden.\x1b[0m");
else { console.log("\x1b[31m\x1b[1m✗ Fehlgeschlagen: " + fehlgeschlagen.join(", ") + "\x1b[0m"); process.exit(1); }
