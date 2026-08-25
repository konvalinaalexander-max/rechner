"""
Zwei Reparaturen an pycel, ohne die dieser Rechner die Mappe nicht trifft.

1. Benannte Bereiche
   pycel liest sie über die alte openpyxl-Schnittstelle
   (workbook.defined_names.definedName) und kennt blattlokale Namen gar
   nicht. Diese Mappe lebt davon: allein das Blatt Q hat 152 lokale Namen,
   dazu Namen wie SB2!TS_Ertrag, Fläche!Bauzone, Allg!Erntejahr,
   Tierb!MiKuh, D_Klick!StartCon. Ohne sie ergeben rund 1'300 Formelzellen
   #NAME? statt eines Werts.

2. Fehlende Funktionen
   PRODUCT und CHAR kommen in der Mappe vor, pycel kennt sie nicht.
"""
from pycel.excelwrapper import ExcelOpxWrapper


def _defined_names(self):
    if self.workbook is not None and self._defined_names is None:
        self._defined_names = {}
        self.namens_kollisionen = []

        def eintragen(name, d_name):
            try:
                ziele = [(alias, blatt) for blatt, alias in d_name.destinations
                         if blatt in self.workbook]
            except Exception:
                return
            if not ziele:
                return
            if name in self._defined_names and self._defined_names[name] != ziele:
                self.namens_kollisionen.append(name)
            self._defined_names[str(name)] = ziele

        for name, d_name in self.workbook.defined_names.items():
            eintragen(name, d_name)
        for ws in self.workbook.worksheets:                 # blattlokale Namen
            for name, d_name in getattr(ws, "defined_names", {}).items():
                eintragen(name, d_name)
    return self._defined_names


ExcelOpxWrapper.defined_names = property(_defined_names)


# ---- fehlende Excel-Funktionen ----
from pycel.lib.function_helpers import excel_helper   # noqa: E402
from pycel.excelutil import flatten                   # noqa: E402
from pycel.excelformula import ExcelFormula           # noqa: E402


@excel_helper(cse_params=None)
def product(*args):
    p, gesehen = 1.0, False
    for v in flatten(args):
        if isinstance(v, bool) or v is None or isinstance(v, str):
            continue
        p *= v
        gesehen = True
    return p if gesehen else 0


@excel_helper(cse_params=0, number_params=0)
def char(nummer):
    n = int(nummer)
    if not 1 <= n <= 255:
        from pycel.excelutil import VALUE_ERROR
        return VALUE_ERROR
    return chr(n)


if __name__ != "__main__":
    if "sbtool.pycel_fix" not in ExcelFormula.default_modules and \
            "pycel_fix" not in ExcelFormula.default_modules:
        ExcelFormula.default_modules = ExcelFormula.default_modules + ("pycel_fix",)
