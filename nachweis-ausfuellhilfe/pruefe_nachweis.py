# Replikation der Rechenkette des Nachweis-Excels (SB1/SB2), Stand neu.xlsm
GFARM = 1371.583          # naehrstoffarmes GF (ext. Wiesen+Weiden, wenig int.)
WEG, ZU = 341.25, 192.0
GF_ANDERE = 239.0385+171.8366+354.44+44.408+972.735   # GF ausser intensiven Wiesen
FL_INT = 24.2123
C1_FIX_N = 142.131+129.688+22.204+486.3675
C1_FIX_P = 138.64233+97.266+22.204+554.45895
C2_N, C2_P = 2533.422, 1004.95307
HOCHSTAMM_N, HOCHSTAMM_P = 114.75, 38.25
A3_N, A3_P = 2190.0, 1680.0
D_N, D_P = 4989.0, 172.207
OA_HA, LN = 67.7329, 133.1228
T_BASIS = 354.44          # ext. Wiesen, ungeduengt

def bilanz(tiere, m96, gem1_n, gem1_p, gem2_n, gem2_p, c2_extra_n=0, c2_extra_p=0):
    gfv=a1n=a1p=lh=wd=v1=0
    for t in tiere:
        anz,gf,nges,p,lht,wt,wh,vm = t
        gfv += anz*gf; a1n += anz*nges; a1p += anz*p
        l = anz*lht*nges*0.1/365
        w = anz*wh*wt*nges/(24*365)
        lh += l; wd += w
        v1 += (anz*nges - l - w)*vm/100
    a2n = a1n - 0.6*GFARM - (0.5*lh + 0.7*wd)
    a2p = a1p - 0.1*GFARM
    netto = gfv + WEG - ZU
    gfprod = netto*(1+m96/100)
    menge_int = gfprod - GF_ANDERE
    c1n = C1_FIX_N + menge_int*1.2
    c1p = C1_FIX_P + menge_int*0.82
    c3n = gem1_n + gem2_n + HOCHSTAMM_N
    c3p = gem1_p + gem2_p + HOCHSTAMM_P
    cn = c1n + C2_N + c2_extra_n + c3n
    cp = c1p + C2_P + c2_extra_p + c3p
    vm_proz = (v1+1890.0)/(a1n+A3_N)*100
    oa_proz = OA_HA/LN*100
    ausn = 60 - 0.15*oa_proz - 0.12*vm_proz
    t_p = min(T_BASIS, gfprod/4)*0.4
    bn = a2n*ausn/100 - cn + A3_N*ausn/100 + D_N
    bp = a2p - cp + A3_P + D_P - t_p
    return dict(GFverz=gfv,A1=a1n,A2=a2n,GFprod=gfprod,ErtragInt=menge_int/FL_INT,
                C_N=cn,C_P=cp,Vollmist=vm_proz,Ausn=ausn,BilN=bn,BilP=bp)

MAULTIER=[(5,17,18.20,13,90,100,4,100)]
PFERDE  =[(5,28,30.10,21,90,100,4,100),(4,10.4,10.99,8.2,90,100,4,100)]
REST=[(219,8.9,12.66,6.28,0,0,0,100),(45,6.5,8.11,3.8,0,0,0,0),
      (106,4.9,8.36,3.5,0,0,0,0),(129,1.4,2.85,1.5,0,0,0,0),
      (3,6.2,7.87,3.6,0,0,0,0),(1.55,5.7,6.96,3.3,0,0,0,0),
      (2.79,3.5,6.55,3.3,0,0,0,0),(1.99,0.7,2.49,1.0,0,0,0,0),
      (2,0.5,35.2,21.0,0,0,0,0)]

G1_IST_N = 2240+990+880+910+2160        # mit Pastinake
G1_IST_P = 420+220+320+420+1080
G1_SOLL_N = 2240+990+880+910+1560       # mit Kuerbis
G1_SOLL_P = 420+220+320+420+240
G2_N, G2_P = 180.65*2.5, 180.65*1.0     # Tomaten 1800 kg

stufen=[
 ("IST (Datei)",            MAULTIER+REST, 5,  G1_IST_N, G1_IST_P, 0,0, 0,0),
 ("+ K1 Equiden korrekt",   PFERDE+REST,   5,  G1_IST_N, G1_IST_P, 0,0, 0,0),
 ("+ K2 M96 = 10 %",        PFERDE+REST,  10,  G1_IST_N, G1_IST_P, 0,0, 0,0),
 ("+ K3 Kuerbis st. Pastin",PFERDE+REST,  10, G1_SOLL_N,G1_SOLL_P, 0,0, 0,0),
 ("+ K4 Gem2 Tomaten",      PFERDE+REST,  10, G1_SOLL_N,G1_SOLL_P, G2_N,G2_P, 0,0),
 ("+ K5 0.766 ha Ackerk.",  PFERDE+REST,  10, G1_SOLL_N,G1_SOLL_P, G2_N,G2_P, 0.766*80,0.766*60),
]
prev=None
for name,ti,m,g1n,g1p,g2n,g2p,cxn,cxp in stufen:
    r=bilanz(ti,m,g1n,g1p,g2n,g2p,cxn,cxp)
    d = "" if prev is None else f"   (dN {r['BilN']-prev['BilN']:+8.0f} | dP {r['BilP']-prev['BilP']:+7.0f})"
    print(f"{name:26} A1 {r['A1']:7.0f}  A2 {r['A2']:7.0f}  GFprod {r['GFprod']:6.0f}  Ertr.int {r['ErtragInt']:5.1f}  "
          f"C_N {r['C_N']:7.0f}  Ausn {r['Ausn']:4.1f}%  BilN {r['BilN']:8.0f}  BilP {r['BilP']:7.0f}{d}")
    prev=r
