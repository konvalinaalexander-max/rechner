"""
Chirurgischer Zelleneditor für .xlsm-Mappen.

Schreibt Werte direkt in das Blatt-XML innerhalb des Zip-Containers und lässt
alles andere unangetastet: VBA-Projekt, Knöpfe und Zeichnungsobjekte,
Blattschutz, Formate, Datenprüfungen. openpyxl würde Zeichnungsobjekte
verlieren - deshalb dieser Weg.

  p = Mappe("nachweis.xlsm")
  p.zahl("SB2", "M40", 160)
  p.text("SB2", "D40", "Gruppe c")
  p.leeren("Fläche", "E32")
  p.speichern("nachweis_neu.xlsm")
"""
import re, shutil, zipfile
import xml.etree.ElementTree as ET

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NSR = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
ET.register_namespace("", NS)
ET.register_namespace("r", NSR)


def _spalte_nr(ref):
    """'AB12' -> 28"""
    s = re.match(r"([A-Z]+)", ref).group(1)
    n = 0
    for ch in s:
        n = n * 26 + (ord(ch) - 64)
    return n


def _zeile_nr(ref):
    return int(re.search(r"(\d+)$", ref).group(1))


class Mappe:
    def __init__(self, pfad):
        self.pfad = pfad
        self.zip = zipfile.ZipFile(pfad, "r")
        self.eintraege = {i.filename: self.zip.read(i.filename) for i in self.zip.infolist()}
        self.infos = {i.filename: i for i in self.zip.infolist()}
        self._blattpfade = self._blaetter_lesen()
        self._baeume = {}          # pfad -> ElementTree
        self.protokoll = []

    # ---------- Aufbau ----------
    def _blaetter_lesen(self):
        wb = ET.fromstring(self.eintraege["xl/workbook.xml"])
        rels = ET.fromstring(self.eintraege["xl/_rels/workbook.xml.rels"])
        ziel = {}
        for rel in rels:
            ziel[rel.get("Id")] = rel.get("Target")
        out = {}
        for sh in wb.find(f"{{{NS}}}sheets"):
            rid = sh.get(f"{{{NSR}}}id")
            if not rid or rid not in ziel:
                continue          # VBA-Module stehen hier ohne Beziehung
            t = ziel[rid]
            if not t.startswith("/"):
                t = "xl/" + t.lstrip("./")
            out[sh.get("name")] = t
        return out

    def _baum(self, blatt):
        pfad = self._blattpfade[blatt]
        if pfad not in self._baeume:
            self._baeume[pfad] = ET.fromstring(self.eintraege[pfad])
        return self._baeume[pfad]

    def _zelle(self, blatt, ref, anlegen=True):
        wurzel = self._baum(blatt)
        daten = wurzel.find(f"{{{NS}}}sheetData")
        znr = _zeile_nr(ref)
        zeile = None
        for r in daten.findall(f"{{{NS}}}row"):
            if int(r.get("r")) == znr:
                zeile = r
                break
        if zeile is None:
            if not anlegen:
                return None
            zeile = ET.SubElement(daten, f"{{{NS}}}row")
            zeile.set("r", str(znr))
            kinder = list(daten)
            kinder.sort(key=lambda e: int(e.get("r")))
            daten[:] = kinder
        for c in zeile.findall(f"{{{NS}}}c"):
            if c.get("r") == ref:
                return c
        if not anlegen:
            return None
        c = ET.SubElement(zeile, f"{{{NS}}}c")
        c.set("r", ref)
        kinder = list(zeile)
        kinder.sort(key=lambda e: _spalte_nr(e.get("r")))
        zeile[:] = kinder
        return c

    @staticmethod
    def _inhalt_weg(c):
        for tag in ("v", "f", "is"):
            for e in c.findall(f"{{{NS}}}{tag}"):
                c.remove(e)
        if "t" in c.attrib:
            del c.attrib["t"]

    # ---------- Schreiben ----------
    def zahl(self, blatt, ref, wert):
        c = self._zelle(blatt, ref)
        alt = self.lesen(blatt, ref)
        self._inhalt_weg(c)
        v = ET.SubElement(c, f"{{{NS}}}v")
        v.text = repr(float(wert)) if wert != int(wert) else str(int(wert))
        self.protokoll.append((blatt, ref, alt, wert))
        return self

    def text(self, blatt, ref, wert):
        c = self._zelle(blatt, ref)
        alt = self.lesen(blatt, ref)
        self._inhalt_weg(c)
        c.set("t", "inlineStr")
        is_ = ET.SubElement(c, f"{{{NS}}}is")
        t = ET.SubElement(is_, f"{{{NS}}}t")
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        t.text = str(wert)
        self.protokoll.append((blatt, ref, alt, wert))
        return self

    def leeren(self, blatt, ref):
        c = self._zelle(blatt, ref, anlegen=False)
        alt = self.lesen(blatt, ref)
        if c is not None:
            self._inhalt_weg(c)
        self.protokoll.append((blatt, ref, alt, None))
        return self

    def lesen(self, blatt, ref):
        c = self._zelle(blatt, ref, anlegen=False)
        if c is None:
            return None
        f = c.find(f"{{{NS}}}f")
        if f is not None:
            return "=" + (f.text or "")
        if c.get("t") == "inlineStr":
            t = c.find(f"{{{NS}}}is/{{{NS}}}t")
            return t.text if t is not None else None
        v = c.find(f"{{{NS}}}v")
        if v is None:
            return None
        if c.get("t") == "s":
            return f"<sst:{v.text}>"
        try:
            return float(v.text)
        except (TypeError, ValueError):
            return v.text

    def formelwerte_verwerfen(self, blaetter):
        """Zwischengespeicherte Ergebnisse aus Formelzellen entfernen.

        Nötig, damit ein Rechner die Formeln wirklich auswertet, statt den
        Stand der letzten Excel-Berechnung zu übernehmen.
        """
        n = 0
        for blatt in blaetter:
            wurzel = self._baum(blatt)
            for c in wurzel.iter(f"{{{NS}}}c"):
                if c.find(f"{{{NS}}}f") is not None:
                    for v in c.findall(f"{{{NS}}}v"):
                        c.remove(v)
                        n += 1
        return n

    # ---------- Sichern ----------
    def speichern(self, ziel):
        wb = ET.fromstring(self.eintraege["xl/workbook.xml"])
        calc = wb.find(f"{{{NS}}}calcPr")
        if calc is None:
            calc = ET.SubElement(wb, f"{{{NS}}}calcPr")
        calc.set("fullCalcOnLoad", "1")
        calc.set("calcId", "0")
        self.eintraege["xl/workbook.xml"] = ET.tostring(wb, xml_declaration=True, encoding="UTF-8")
        for pfad, baum in self._baeume.items():
            self.eintraege[pfad] = ET.tostring(baum, xml_declaration=True, encoding="UTF-8")
        with zipfile.ZipFile(ziel, "w", zipfile.ZIP_DEFLATED) as z:
            for name, roh in self.eintraege.items():
                if name == "xl/calcChain.xml":
                    continue            # Excel baut die Kette neu auf
                z.writestr(self.infos[name], roh)
        return ziel
