import sys; sys.path.insert(0,'/home/user/rechner/sbtool')
import pycel_fix, openpyxl
from xlsmpatch import Mappe
from pruef import BILANZBLAETTER
from sbrechner import Nachweis, knopf_tiere, UEBERTRAG

def bauen(quelle, aend, ziel, frisch=True):
    m = Mappe(quelle)
    for b,c,v in aend:
        if v is None: m.leeren(b,c)
        elif isinstance(v,str): m.text(b,c,v)
        else: m.zahl(b,c,v)
    if frisch: m.formelwerte_verwerfen(BILANZBLAETTER)
    m.speichern(ziel); return m.protokoll

# ---- Betriebsdatenblätter 2026 ----
BDB = [
 ('Fläche','E10',8.1344), ('Fläche','E19',6.9566), ('Fläche','E24',1.6211),
 ('Fläche','E28',None),   ('Fläche','E30',6.1825), ('Fläche','E32',0.7336),
 ('Fläche','E37',0.766),  ('Fläche','E39',41.6553),('Fläche','E41',0.2255),
 ('Fläche','E54',0.1658), ('Fläche','E64',0.509),
 ('Fläche','N10',14.0544),('Fläche','N11',19.4547),('Fläche','N15',2.2204),
 ('Fläche','N16',None),   ('Fläche','N19',None),   ('Fläche','N20',5.3361),
 ('Fläche','N22',18.8762),('Fläche','N27',1.2921), ('Fläche','N32',0.5879),
 ('Fläche','N33',1.2186), ('Fläche','N34',0.502),  ('Fläche','N35',2.4764),
 ('Fläche','N36',0.031),  ('Fläche','N37',0.1232), ('Fläche','N54',255),
 ('D_Fläche','N35',None),                                   # keine Speisekartoffeln
 ('Tierb','G45',1.55), ('Tierb','G46',2.79), ('Tierb','G47',1.99), ('Tierb','G64',2),
 ('SB1','G57','Schweinegülle'), ('SB1','K57',60), ('SB1','M57',5), ('SB1','N57',2.5),
 ('SB1','O57',4.3), ('SB1','P57',1.2),
 ('SB1','X55','Typ 50/100'), ('SB1','Z55',1),
 ('SB2','J78',40), ('SB2','J79',10), ('SB2','J88',485.3),
 ('Gem1','D14',800),                                        # Karotten zurück
 ('Gem2','D13',58.79),                                      # zweite Tunnelfläche
 ('OB','D35',0.2255),
]
VM_ECHT = {17:'Typ 100',18:'Typ 100',19:'Typ 100',20:'Typ 0',21:'Typ 0',22:'Typ 0',
           23:'Typ 0',24:'Typ 0',25:'Typ 0',26:'Typ 0',27:'Typ 0'}

bauen('v5.xlsm', BDB, '_e1.xlsm')
zeilen, ueb = knopf_tiere('_e1.xlsm', '_e2.xlsm', etiketten='v5.xlsm', vollmist=VM_ECHT)
print('Tierliste nach dem Knopfdruck:')
for zz,s,h in zeilen:
    if s: print('   SB1 %-3d <- D_Tierb %-3d  %-44.44s Anz %-7s GF %-6s Nges %s' % (zz,s['_quelle'],str(s['B']),s['I'],s['J'],s['M']))
print('   (aus dem Cache übernommen wegen Kreisbezug:', len(ueb), 'Zellen)')

bauen('_e2.xlsm', [], '_e3.xlsm')          # Formelwerte erneut verwerfen
n = Nachweis('_e3.xlsm', etiketten='v5.xlsm')
c2 = n.c2_zeilen(); frei = n.zielzeilen[1:-1]
print()
print('Ackerkulturen nach dem Knopfdruck:', len(c2), 'von', len(frei), 'Zeilen')
for z in c2: print('   D_Fläche %-3d %-38.38s %-9.9s Fl %-8s N/ha %s' % (z['_quelle'],str(z['C']),str(z['D'] or ''),z['I'],z['M']))
aend=[]
for i,zz in enumerate(frei):
    for zs,_ in UEBERTRAG: aend.append(('SB2', f'{zs}{zz}', c2[i][zs] if i<len(c2) else None))
bauen('_e3.xlsm', aend, 'Planbilanz_2026_BDB.xlsm', frisch=False)
bauen('Planbilanz_2026_BDB.xlsm', [], '_e4.xlsm')
n2 = Nachweis('_e4.xlsm', etiketten='v5.xlsm')
print()
print('=== Planbilanz 2026 nach den Betriebsdatenblättern ===')
for name,blatt,text,sp,soll in __import__('sbrechner').KENNWERTE:
    r=n2.zeile_suchen(blatt,text); v=n2.wert(f'{blatt}!{sp}{r}')
    print('   %-27s %-11s %12s' % (name, f'{blatt}!{sp}{r}', ('%.2f'%v) if isinstance(v,(int,float)) else v))
