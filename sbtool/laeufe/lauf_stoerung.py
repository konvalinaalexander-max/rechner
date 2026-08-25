import sys, pickle; sys.path.insert(0,'/home/user/rechner/sbtool')
import pycel_fix, openpyxl
from stoerung import testreihe
wf = openpyxl.load_workbook('v5.xlsm', data_only=False)
wv = openpyxl.load_workbook('v5.xlsm', data_only=True)
alle_f, alle_e, ein = pickle.load(open('kegel.pkl','rb'))
kand, gesehen = [], set()
def dazu(b, co):
    if (b,co) in gesehen or b not in wf.sheetnames: return
    c = wf[b][co]
    if isinstance(c.value,str) and c.value.startswith('='): return
    if type(c.value).__name__=='ArrayFormula': return
    v = wv[b][co].value
    if v in (None,'',0): return                    # nur befüllte Zellen
    gesehen.add((b,co)); kand.append((b,co,v))
for a,v,l in ein:
    b,co = a.split('!')
    if b=='Texte' or l: continue
    dazu(b,co)
for r in list(range(55,63))+list(range(77,90))+[96,11]:
    for sp in 'EGIKMNOP': dazu('SB1', f'{sp}{r}')
for r in range(74,100):
    for sp in 'JKNO': dazu('SB2', f'{sp}{r}')
dazu('SB2','I103')
for co in ['N34','N35','D53','F53','H53','I53','J53']: dazu('D_Fläche',co)
for r in range(9,81):
    for sp in 'DGJKNOPQR': dazu('Tierb', f'{sp}{r}')
# Korrekturfaktoren, die von 1 abweichen, sind besonders interessant
for b,sp in [('Gem1','N'),('Gem1','O'),('Gem1','P'),('Gem2','N'),('OB','M'),('RH','M')]:
    for r in range(11,57): dazu(b, f'{sp}{r}')
print('Kandidaten (befüllt):', len(kand), flush=True)
basis_n, basis_p, erg = testreihe('v5.xlsm', kand, 'v5.xlsm', delta=1.0, laut=True)
pickle.dump((basis_n,basis_p,erg), open('stoerung.pkl','wb'))
print('FERTIG')
