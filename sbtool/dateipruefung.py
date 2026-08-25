"""
Prüft eine bearbeitete .xlsm gegen das Original: Aufbau, Vollständigkeit,
Unversehrtheit von VBA und Zeichnungsobjekten, Wohlgeformtheit der Blatt-XML.
"""
import re, zipfile, hashlib
import xml.etree.ElementTree as ET

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"


def _spalte(ref):
    s = re.match(r"([A-Z]+)", ref).group(1)
    n = 0
    for ch in s:
        n = n * 26 + (ord(ch) - 64)
    return n


def pruefen(original, bearbeitet):
    befund = []

    def sagen(ok, name, text=""):
        befund.append((ok, name, text))

    zo = zipfile.ZipFile(original)
    zb = zipfile.ZipFile(bearbeitet)
    sagen(zb.testzip() is None, "Zip-Verzeichnis unversehrt")

    no, nb = set(zo.namelist()), set(zb.namelist())
    fehlt = no - nb - {"xl/calcChain.xml"}
    sagen(not fehlt, "keine Datei verloren", ", ".join(sorted(fehlt)[:5]))
    sagen(not (nb - no), "keine Datei zusätzlich", ", ".join(sorted(nb - no)[:5]))

    for teil in ["xl/vbaProject.bin", "xl/sharedStrings.xml", "xl/styles.xml"]:
        if teil in no:
            gleich = hashlib.md5(zo.read(teil)).hexdigest() == hashlib.md5(zb.read(teil)).hexdigest()
            sagen(gleich, f"{teil} unverändert")

    zeich_o = sorted(n for n in no if n.startswith("xl/drawings/"))
    zeich_b = sorted(n for n in nb if n.startswith("xl/drawings/"))
    gleich = all(hashlib.md5(zo.read(n)).hexdigest() == hashlib.md5(zb.read(n)).hexdigest()
                 for n in zeich_o) and zeich_o == zeich_b
    sagen(gleich, f"Zeichnungsobjekte unverändert ({len(zeich_o)} Dateien)")

    unver = [n for n in sorted(no & nb)
             if not n.startswith("xl/worksheets/") and n != "xl/workbook.xml"]
    schlecht = [n for n in unver
                if hashlib.md5(zo.read(n)).hexdigest() != hashlib.md5(zb.read(n)).hexdigest()]
    sagen(not schlecht, "ausserhalb der Blätter nichts angefasst", ", ".join(schlecht[:4]))

    # Blatt-XML im Einzelnen
    probleme = []
    blattdateien = sorted(n for n in nb if n.startswith("xl/worksheets/sheet"))
    zellen_ges = 0
    for name in blattdateien:
        try:
            wurzel = ET.fromstring(zb.read(name))
        except ET.ParseError as e:
            probleme.append(f"{name}: XML kaputt ({e})")
            continue
        daten = wurzel.find(f"{{{NS}}}sheetData")
        if daten is None:
            continue
        zeilennr = []
        for row in daten.findall(f"{{{NS}}}row"):
            r = int(row.get("r"))
            zeilennr.append(r)
            refs, spalten = [], []
            for c in row.findall(f"{{{NS}}}c"):
                ref = c.get("r")
                refs.append(ref)
                spalten.append(_spalte(ref))
                zellen_ges += 1
                if int(re.search(r"\d+$", ref).group()) != r:
                    probleme.append(f"{name} {ref}: Zelle in falscher Zeile {r}")
                if c.get("t") == "inlineStr" and c.find(f"{{{NS}}}is") is None:
                    probleme.append(f"{name} {ref}: inlineStr ohne <is>")
                if c.find(f"{{{NS}}}f") is not None and c.get("t") == "inlineStr":
                    probleme.append(f"{name} {ref}: Formel und inlineStr zugleich")
            if len(set(refs)) != len(refs):
                probleme.append(f"{name} Zeile {r}: doppelte Zelle")
            if spalten != sorted(spalten):
                probleme.append(f"{name} Zeile {r}: Spalten nicht aufsteigend")
        if len(set(zeilennr)) != len(zeilennr):
            probleme.append(f"{name}: doppelte Zeilennummer")
        if zeilennr != sorted(zeilennr):
            probleme.append(f"{name}: Zeilen nicht aufsteigend")
    sagen(not probleme, f"Blatt-XML wohlgeformt ({len(blattdateien)} Blätter, {zellen_ges} Zellen)",
          "; ".join(probleme[:6]))

    # gemeinsam genutzte Formeln
    kaputt = []
    for name in blattdateien:
        roh = zb.read(name).decode("utf-8", "replace")
        gastgeber = set(re.findall(r'<f t="shared"[^>]*ref="[^"]*"[^>]*si="(\d+)"', roh))
        nutzer = set(re.findall(r'<f t="shared"[^>]*si="(\d+)"', roh))
        verwaist = nutzer - gastgeber
        if verwaist:
            kaputt.append(f"{name}: si ohne Gastgeber {sorted(verwaist)[:5]}")
    sagen(not kaputt, "gemeinsam genutzte Formeln vollständig", "; ".join(kaputt[:4]))

    roh = zb.read("xl/workbook.xml").decode("utf-8", "replace")
    sagen("fullCalcOnLoad=\"1\"" in roh, "Neuberechnung beim Öffnen gesetzt")
    return befund
