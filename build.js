#!/usr/bin/env node
/* Baut aus den Quellen unter src/ die einzelne, offline lauffähige HTML-Datei. */
"use strict";
var fs = require("fs"), path = require("path");
var wurzel = __dirname;
function lies(p) { return fs.readFileSync(path.join(wurzel, p), "utf8"); }

var js = ["src/daten.js", "src/engine.js", "src/vorlage.js", "src/tests.js", "src/ui.js"]
  .map(function (f) { return "/* ===== " + f + " ===== */\n" + lies(f); })
  .join("\n\n");

var html = lies("src/shell.html")
  .replace("/*[[CSS]]*/", function () { return lies("src/style.css"); })
  .replace("/*[[JS]]*/", function () { return js; });

/* Syntaxprüfung des gebündelten Skripts: bricht den Build ab, statt eine
   kaputte Datei auszuliefern. */
try {
  new Function(js);
} catch (e) {
  console.error("\x1b[31mBuild abgebrochen – Syntaxfehler im gebündelten Skript:\x1b[0m\n  " + e.message);
  process.exit(1);
}

var ziel = path.join(wurzel, "naehrstoffbilanz.html");
fs.writeFileSync(ziel, html, "utf8");
console.log("naehrstoffbilanz.html erstellt – " + (Buffer.byteLength(html, "utf8") / 1024).toFixed(0) + " KB");
