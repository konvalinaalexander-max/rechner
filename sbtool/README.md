# sbtool – Rechner für die AGRIDEA-Nachweis-Mappe

Werkzeug, um Änderungen an der Suisse-Bilanz-Mappe **durchzurechnen, bevor**
man sie in Excel eingibt.

## Warum

Eine Excel-Datei enthält nur die Ergebnisse der letzten Berechnung. Was nach
einer Änderung herauskommt, steht nirgends. Dazu kommt: die Tierliste auf
`SB1` und Formular C2 auf `SB2` enthalten überhaupt keine Formeln, sondern
das, was VBA beim Knopfdruck hineinschreibt. Beides zusammen macht jede
Vorhersage «von Auge» zur Vermutung.

## Aufbau

| Datei | Zweck |
|---|---|
| `xlsmpatch.py` | Schreibt Zellen direkt ins Blatt-XML im Zip. VBA-Projekt, Knöpfe, Blattschutz und Formate bleiben unangetastet – openpyxl würde die Zeichnungsobjekte verlieren. Kann zusätzlich alle zwischengespeicherten Formelergebnisse verwerfen. |
| `sbrechner.py` | Wertet die echten Formeln aus (pycel) und bildet `Sub D_Fläche_nach_Nb2` aus Modul `M_Uebertragen_NW` nach – die Übertragung der Ackerkulturen von `D_Fläche` nach `SB2`. Kennwerte werden über ihre Beschriftung gesucht, nicht über feste Zellen, weil das Makro Zeilen einfügt und entfernt. |
| `probe.py` | Ablauf: Änderungen schreiben → Zwischenwerte verwerfen → rechnen → Makro-Übertragung nachbilden und schreiben → erneut rechnen → Bericht. |

## Benutzung

```python
import sys; sys.path.insert(0, "sbtool")
from probe import probiere

probiere("nachweis.xlsm", [("D_Fläche", "N35", 8)])
```

Gibt aus, welche Ackerkulturen der Knopf überträgt, und vergleicht 25
Kennwerte mit den Sollwerten in `sbrechner.KENNWERTE`.

Mit `behalten="fertig.xlsm"` entsteht zusätzlich eine fertig eingestellte
Mappe.

## Probe auf die Richtigkeit

Der Rechner ist erst brauchbar, wenn er die unveränderte Mappe trifft:

```python
from xlsmpatch import Mappe
from probe import BLAETTER
from sbrechner import Nachweis

m = Mappe("nachweis.xlsm"); m.formelwerte_verwerfen(BLAETTER); m.speichern("frisch.xlsm")
Nachweis("frisch.xlsm", etiketten="nachweis.xlsm").drucke(
    Nachweis("frisch.xlsm", etiketten="nachweis.xlsm").bericht()[0])
```

Alle Werte müssen den gespeicherten Werten der Originalmappe entsprechen.
Für die Mappe dieses Betriebs: 25 von 25, aus den blanken Formeln gerechnet.

## Abhängigkeiten

```
pip install pycel openpyxl
```

`oletools` nur, wenn man den VBA-Quelltext lesen will:
`python3 -m oletools.olevba -c xl/vbaProject.bin`

## Grenze

Wenn eine Änderung die **Anzahl** der Ackerkulturen verändert, fügt das Makro
Zeilen ein oder löscht sie; die Mappe verschiebt sich. Das bildet `probe.py`
nicht nach – es bricht dann mit einer Meldung ab. Diese Übertragung muss in
Excel selbst ausgelöst werden.
