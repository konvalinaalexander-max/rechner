import sys, pickle; sys.path.insert(0,'/home/user/rechner/sbtool')
import pycel_fix                      # Namen + PRODUCT/CHAR
from pruef import *
e = formeltreue('v5.xlsm','v5_frisch.xlsm', BILANZBLAETTER, laut=False)
pickle.dump(e, open('treue2.pkl','wb'))
print('Formelzellen     :', e['gesamt'])
print('identisch        :', e['treffer'])
print('beide leer       :', e['leer'])
print('ABWEICHEND       :', e['abweichung'])
print('nicht auswertbar :', e['unrechenbar'])
print('Dauer            : %.0f s' % e['dauer'])
import collections
print('Abweichungen je Blatt:', collections.Counter(x[0] for x in e['abweichungen']).most_common())
