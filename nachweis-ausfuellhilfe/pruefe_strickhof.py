# Nachrechnung: reproduziert die Excel-Kette mit den Eingaben des Strickhofs
T=[ # anz, gf, nges, p, laufhofTg, weideTg, weideStd, vollmistTyp
 (5,   28.0, 30.10, 21.0, 90,100,4,100),
 (4,   10.4, 10.99,  8.2, 90,100,4,100),
 (219,  8.9, 12.66,  6.28, 0,0,0,100),
 (45,   6.5,  8.11,  3.8,  0,0,0,0),
 (106,  4.9,  8.36,  3.5,  0,0,0,0),
 (129,  1.4,  2.85,  1.5,  0,0,0,0),
 (3,    6.2,  7.87,  3.6,  0,0,0,0)]
gfv=a1n=a1p=lh=wd=v1=0
for anz,gf,ng,p,lt,wt,wh,vm in T:
    gfv+=anz*gf; a1n+=anz*ng; a1p+=anz*p
    l=anz*lt*ng*0.1/365; w=anz*wh*wt*ng/(24*365); lh+=l; wd+=w
    v1+=(anz*ng-l-w)*vm/100
# Wiesen  (Excel legt Naturwiese wenig + Weide wenig in EINE Zeile mit einem Ertrag)
fl_ext, e_ext   = 13.98, 25
fl_wen, e_wen   = 19.44+0.12, 50      # Excel-Zusammenlegung
fl_wext,e_wext  = 2.22, 20
fl_int          = 18.87
m_silo = 2.02*185; m_gsl = 1.62*106
m_ext=fl_ext*e_ext; m_wen=fl_wen*e_wen; m_wext=fl_wext*e_wext
gfarm = m_ext+m_wen+m_wext
a2n = a1n - 0.6*gfarm - (0.5*lh+0.7*wd)
a2p = a1p - 0.1*gfarm
netto = gfv + 341.25 - 192.0
gfprod = netto*1.10
m_int = gfprod - (m_silo+m_gsl+m_ext+m_wen+m_wext)
c1n = 2.02*110 + 1.62*80 + m_wen*0.5 + m_wext*0.5 + m_int*1.20
c1p = m_silo*0.58 + m_gsl*0.57 + m_wen*0.57 + m_wext*0.50 + m_int*0.82
c2n = 4.88*140 + 6.96*100 + 6.18*100 + 8.00*160 + 0.75*80
c2p = 4.88*60*0.83 + 6.96*45*0.80 + 6.18*250*0.19 + 8.00*450*0.16 + 0.75*60
gem_n = 1400*1.6 + 1200*1.3 + 1100*0.9 + 700*1.3 + 50*0.7      # Fenchel,Kürbis,Salate,Zwiebeln,Kräuter
gem_p = 1400*0.3 + 1200*0.2 + 1100*0.2 + 700*0.6 + 50*0.3
c3n = 0.22*100 + gem_n + 121*2.5
c3p = 0.22*34  + gem_p + 121*1.0
cn, cp = c1n+c2n+c3n, c1p+c2p+c3p
A3N,A3P = 1890+420, 1530+168
V2 = 0
vmp = (v1+V2)/(a1n+A3N)*100
oa = 74.79/137.05*100
ausn = 60 - 0.15*oa - 0.12*vmp
t_p = min(m_ext, gfprod/4)*0.4
DN, DP = 5040+283.5, 0+120
bn = a2n*ausn/100 - cn + A3N*ausn/100 + DN
bp = a2p - cp + A3P + DP - t_p
soll=dict(GFverz=3142,A1=4609,A2=3778,GFprod=3620,C1_N=2907,C1_P=2290,C2_N=3337,C2_P=1408,
          C3_N=6060,C3_P=1443,C_N=12304,C_P=5142,Vollmist=42.7,OA=54.6,Ausn=46.7,T=140,BilN=-4137,BilP=-1341)
ist=dict(GFverz=gfv,A1=a1n,A2=a2n,GFprod=gfprod,C1_N=c1n,C1_P=c1p,C2_N=c2n,C2_P=c2p,
         C3_N=c3n,C3_P=c3p,C_N=cn,C_P=cp,Vollmist=vmp,OA=oa,Ausn=ausn,T=t_p,BilN=bn,BilP=bp)
print(f'{"Kennwert":10} {"Strickhof":>10} {"nachgerechnet":>14} {"Diff":>8}')
for k in soll:
    print(f'{k:10} {soll[k]:10.1f} {ist[k]:14.2f} {ist[k]-soll[k]:8.2f}')
print()
print('Ertrag intensive Wiesen dt TS/ha:', round(m_int/fl_int,2), ' (Strickhof 90)')
print('LN:', round(58.27+32.91+45.87,2), ' C1-Fl:', round(2.02+1.62+13.98+19.56+2.22+18.87,2))
