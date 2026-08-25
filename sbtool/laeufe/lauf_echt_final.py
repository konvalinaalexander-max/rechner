import sys, pickle; sys.path.insert(0,'/home/user/rechner/sbtool')
import pycel_fix, openpyxl
from xlsmpatch import Mappe
from pruef import BILANZBLAETTER
from sbrechner import Nachweis, Tiere, TIER_WEIDE, TIER_STALL, UEBERTRAG, VOLLMIST_FAKTOR, KENNWERTE

def bauen(quelle, aend, ziel, frisch):
    m = Mappe(quelle)
    for b,c,v in aend:
        if v is None: m.leeren(b,c)
        elif isinstance(v,str): m.text(b,c,v)
        else: m.zahl(b,c,v)
    if frisch: m.formelwerte_verwerfen(BILANZBLAETTER)
    m.speichern(ziel)

BDB = eval(open('lauf_echt.py').read().split('BDB = ')[1].split('\nVM_ECHT')[0])
VM = {17:'Typ 100',18:'Typ 100',19:'Typ 100',20:'Typ 0',21:'Typ 0',22:'Typ 0',
      23:'Typ 0',24:'Typ 0',25:'Typ 0',26:'Typ 0',27:'Typ 0'}

# Rechenfassung (Zwischenwerte verworfen) nur zum Ermitteln der Makro-Ausgabe
bauen('v5.xlsm', BDB, '_f1.xlsm', True)
n = Nachweis('_f1.xlsm', etiketten='v5.xlsm')
t = Tiere(n)
tier_aend = []
for zz, soll, herkunft in t.zeilen():
    spalten = TIER_WEIDE if herkunft=='Weidevieh' else TIER_STALL
    for zs,_ in spalten:
        w = soll[zs] if soll else None
        if isinstance(w,str) and w.startswith('<'):
            w = n.wbv['SB1'][f'{zs}{zz}'].value       # Kreisbezug: aus der Mappe
        tier_aend.append(('SB1', f'{zs}{zz}', w))
    typ = VM.get(zz) if soll else None
    tier_aend += [('SB1',f'X{zz}',typ), ('SB1',f'Z{zz}',VOLLMIST_FAKTOR.get(typ))]
bauen('_f1.xlsm', tier_aend, '_f2.xlsm', True)
n2 = Nachweis('_f2.xlsm', etiketten='v5.xlsm')
c2 = n2.c2_zeilen(); frei = n2.zielzeilen[1:-1]
c2_aend = []
for i,zz in enumerate(frei):
    for zs,_ in UEBERTRAG:
        c2_aend.append(('SB2', f'{zs}{zz}', c2[i][zs] if i<len(c2) else None))

# Auslieferungsfassung: alle Änderungen auf die Originalmappe, Zwischenwerte behalten
bauen('v5.xlsm', BDB + tier_aend + c2_aend, 'Planbilanz_2026_BDB.xlsm', False)
print('Mappe gebaut.')

# Endkontrolle: dieselbe Mappe frisch durchrechnen
bauen('Planbilanz_2026_BDB.xlsm', [], '_f3.xlsm', True)
n3 = Nachweis('_f3.xlsm', etiketten='v5.xlsm')
erg = {}
for name,blatt,text,sp,soll in KENNWERTE:
    r = n3.zeile_suchen(blatt,text); erg[name] = n3.wert(f'{blatt}!{sp}{r}')
pickle.dump(erg, open('echt_kennwerte.pkl','wb'))
print('%-28s %14s' % ('Kennwert','Planbilanz 2026'))
for k,v in erg.items():
    print('   %-28s %12s' % (k, ('%.2f'%v) if isinstance(v,(int,float)) else v))
