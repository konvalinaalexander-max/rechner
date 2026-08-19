def rechne(fl, gem, kart_n, nichtaufg_n, nichtaufg_p, gem2_a, koernermais):
    # Wiesen/Futterfläche
    m_ext = fl['ext']*25; m_wen = fl['wen']*50; m_wext = fl['wext']*20
    m_silo = fl['silo']*185; m_gsl = fl['gsl']*106
    gfarm = m_ext+m_wen+m_wext
    # Tiere (7 Kategorien, fix)
    T=[(5,28.0,30.10,21.0,90,100,4,100),(4,10.4,10.99,8.2,90,100,4,100),
       (219,8.9,12.66,6.28,0,0,0,100),(45,6.5,8.11,3.8,0,0,0,0),
       (106,4.9,8.36,3.5,0,0,0,0),(129,1.4,2.85,1.5,0,0,0,0),(3,6.2,7.87,3.6,0,0,0,0)]
    gfv=a1n=a1p=lh=wd=v1=0
    for anz,gf,ng,p,lt,wt,wh,vm in T:
        gfv+=anz*gf; a1n+=anz*ng; a1p+=anz*p
        l=anz*lt*ng*0.1/365; w=anz*wh*wt*ng/(24*365); lh+=l; wd+=w
        v1+=(anz*ng-l-w)*vm/100
    a2n=a1n-0.6*gfarm-(0.5*lh+0.7*wd); a2p=a1p-0.1*gfarm
    gfprod=(gfv+341.25-192.0)*1.10
    m_int=gfprod-(m_silo+m_gsl+m_ext+m_wen+m_wext)
    c1n=fl['silo']*110+fl['gsl']*80+m_wen*0.5+m_wext*0.5+m_int*1.20
    c1p=m_silo*0.58+m_gsl*0.57+m_wen*0.57+m_wext*0.50+m_int*0.82
    c2n=fl['ww']*140+fl['dinkel']*100+fl['kartp']*100+fl['karts']*kart_n+nichtaufg_n+koernermais*110
    c2p=fl['ww']*60*0.83+fl['dinkel']*45*0.80+fl['kartp']*250*0.19+fl['karts']*450*0.16+nichtaufg_p+koernermais*100*0.76
    c3n=fl['beeren']*100+gem['n']+gem2_a*2.5
    c3p=fl['beeren']*34 +gem['p']+gem2_a*1.0
    cn,cp=c1n+c2n+c3n, c1p+c2p+c3p
    A3N,A3P=2310,1698
    vmp=(v1+0)/(a1n+A3N)*100
    ln=(fl['ww']+fl['dinkel']+fl['gsl']+fl['kartp']+fl['karts']+fl['nichtaufg']+fl['saum']
        +fl['hecke']+fl['silo']+fl['ext']+fl['wen']+fl['wext']+fl['int']+fl['gemuese']
        +fl['beeren']+fl['kraeuter']+fl['geschuetzt']+koernermais)
    oaha=(fl['ww']+fl['dinkel']+fl['gsl']+fl['kartp']+fl['karts']+fl['nichtaufg']+fl['saum']
          +fl['silo']+fl['gemuese']+fl['beeren']+koernermais)
    oa=oaha/ln*100
    ausn=60-0.15*oa-0.12*vmp
    t_p=min(m_ext,gfprod/4)*0.4
    bn=a2n*ausn/100-cn+A3N*ausn/100+5323.5
    bp=a2p-cp+A3P+120-t_p
    return dict(LN=ln,OA=oa,A2=a2n,GFprod=gfprod,Eint=m_int/fl['int'],C_N=cn,C_P=cp,Ausn=ausn,BilN=bn,BilP=bp)

JETZT=dict(ww=4.88,dinkel=6.9566,gsl=1.6211,kartp=6.1825,karts=8.0,nichtaufg=0.766,saum=0.1658,
  hecke=0.502+2.4764+3.0,silo=2.0,ext=14.0544+0.1232,wen=19.4547+0.12,wext=2.2204,int=19.0,
  gemuese=44.0,beeren=0.2255,kraeuter=0.509,geschuetzt=1.15)
SOLL=dict(ww=4.88,dinkel=6.96,gsl=1.62,kartp=6.18,karts=8.0,nichtaufg=0.75,saum=0.16,
  hecke=0.50+2.47+3.01,silo=2.02,ext=13.98,wen=19.44+0.12,wext=2.22,int=18.87,
  gemuese=44.0,beeren=0.22,kraeuter=0.50,geschuetzt=1.15)
GEM_JETZT=dict(n=2240+990+880+910+1560, p=420+220+320+420+240)
GEM_SOLL =dict(n=2240+990+1560+910+35,  p=420+220+240+420+15)

faelle=[
 ('IST (deine Datei)',            JETZT, GEM_JETZT, 120, 0,  0,  121.86, 0.7336),
 ('+ Koernermais raus',           JETZT, GEM_JETZT, 120, 0,  0,  121.86, 0),
 ('+ Kartoffeln Gruppe c',        JETZT, GEM_JETZT, 160, 0,  0,  121.86, 0),
 ('+ Gem1: Karotten raus/Kraeuter',JETZT, GEM_SOLL, 160, 0,  0,  121.86, 0),
 ('+ nicht aufgef. Ackerk. 80/60',JETZT, GEM_SOLL,  160, 60, 45, 121.86, 0),
 ('+ Uferwiese raus',             dict(JETZT,ext=14.0544), GEM_SOLL, 160, 60, 45, 121.86, 0),
 ('+ Gem2 121 a',                 dict(JETZT,ext=14.0544), GEM_SOLL, 160, 60, 45, 121.0, 0),
 ('+ alle Nachkommastellen',      SOLL,  GEM_SOLL,  160, 60, 45, 121.0, 0),
]
prev=None
for n,fl,g,kn,nan,nap,g2,km in faelle:
    r=rechne(fl,g,kn,nan,nap,g2,km)
    d='' if prev is None else f'  (dN {r["BilN"]-prev["BilN"]:+7.0f})'
    print(f'{n:32} LN {r["LN"]:7.3f} OA {r["OA"]:5.2f}%  C_N {r["C_N"]:8.0f}  Ausn {r["Ausn"]:5.2f}%  BilN {r["BilN"]:8.0f}  BilP {r["BilP"]:7.0f}{d}')
    prev=r
print()
print('Strickhof                        LN 137.050 OA 54.57%  C_N    12304  Ausn 46.69%  BilN    -4137  BilP   -1341')
