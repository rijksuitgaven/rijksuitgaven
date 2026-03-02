#!/usr/bin/env python3
"""Generate social media posts for Rijksuitgaven.nl — batches 3-8.
Reads existing registry to avoid duplicates. Writes batch CSVs + updates registry.
"""
import csv, os, random
from collections import Counter

random.seed(42)
SOCIAL_DIR = os.path.dirname(os.path.abspath(__file__))

# ============================================================
# HELPERS
# ============================================================
def fmt_eur(amount):
    return f"€{amount:,.0f}".replace(",", ".")

def _dy(n):
    w = {1:"één jaar",2:"twee jaar",3:"drie jaar",4:"vier jaar",5:"vijf jaar",
         6:"zes jaar",7:"zeven jaar",8:"acht jaar",9:"negen jaar",10:"tien jaar",
         11:"elf jaar",12:"twaalf jaar"}
    return w.get(n, f"{n} jaar")

STAFFEL = {
    1:"€1 en €10.000", 2:"€10.000 en €25.000", 3:"€25.000 en €50.000",
    4:"€50.000 en €100.000", 5:"€100.000 en €250.000", 6:"€250.000 en €500.000",
    7:"€500.000 en €1 miljoen", 8:"€1 en €2,5 miljoen", 9:"€2,5 en €5 miljoen",
    10:"€5 en €10 miljoen", 11:"€10 en €25 miljoen", 12:"€25 en €50 miljoen",
    13:"€50 en €100 miljoen", 14:"boven €100 miljoen"
}

def add(posts, text, fmt, mod, ent, year, staffel="no"):
    if len(text) <= 280:
        posts.append((text, fmt, mod, ent, year, staffel))

# ============================================================
# LOAD EXISTING REGISTRY (batches 1-2)
# ============================================================
existing = set()
reg_path = os.path.join(SOCIAL_DIR, "registry.csv")
with open(reg_path) as f:
    for row in csv.DictReader(f):
        existing.add((row["module"], row["entity"]))

# ============================================================
# ALL POSTS
# ============================================================
P = []

# ==== INSTRUMENTEN — scale_shock (×1000 in DB) ====
for name, val, yr, ctx, tags in [
    ("Gemeente Groningen", 1108680, "2024", "via financiële instrumenten", "#Groningen #Gemeenten #Rijksbegroting"),
    ("Gemeente Eindhoven", 881622, "2024", "via financiële instrumenten", "#Eindhoven #Gemeenten #Rijksbegroting"),
    ("Gemeente Tilburg", 853880, "2024", "via financiële instrumenten", "#Tilburg #Gemeenten #Rijksbegroting"),
    ("Vattenfall Sales Nederland", 958565, "2024", "via financiële instrumenten. Energiecompensatie", "#Vattenfall #Energie #Overheidsuitgaven"),
    ("Essent Retail Energie", 669783, "2023", "via financiële instrumenten", "#Essent #Energie #Overheidsuitgaven"),
    ("Eneco Consumenten", 719624, "2022", "via financiële instrumenten", "#Eneco #Energie #Overheidsuitgaven"),
    ("De IND", 805163, "2024", "via financiële instrumenten", "#IND #Migratie #Overheidsuitgaven"),
    ("Raad voor de Rechtspraak", 1326180, "2023", "via financiële instrumenten", "#Rechtspraak #Justitie #Overheidsuitgaven"),
    ("Commissariaat voor de Media", 1247806, "2024", "via financiële instrumenten", "#Media #Omroep #Overheidsuitgaven"),
    ("Ons Middelbaar Onderwijs", 658946, "2024", "via financiële instrumenten", "#OMO #Onderwijs #MBO"),
    ("Stichting Fontys", 429689, "2024", "via financiële instrumenten", "#Fontys #HBO #Onderwijs"),
    ("Stichting Lucas Onderwijs", 437335, "2024", "via financiële instrumenten", "#LucasOnderwijs #DenHaag #Onderwijs"),
    ("Stichting Carmelcollege", 368635, "2024", "via financiële instrumenten", "#Carmel #VO #Onderwijs"),
    ("Stichting BOOR", 377353, "2024", "via financiële instrumenten. Grootste onderwijsstichting in Rotterdam", "#BOOR #Rotterdam #Onderwijs"),
    ("Stichting Saxion", 254840, "2024", "via financiële instrumenten", "#Saxion #HBO #Onderwijs"),
    ("DUO", 468329, "2024", "via financiële instrumenten", "#DUO #Studiefinanciering #Onderwijs"),
    ("Kamer van Koophandel", 208426, "2024", "via financiële instrumenten", "#KvK #Ondernemers #Overheidsuitgaven"),
    ("Reclassering Nederland", 180885, "2023", "via financiële instrumenten", "#Reclassering #Justitie #Overheidsuitgaven"),
    ("Nationaal Restauratiefonds", 212273, "2024", "via financiële instrumenten", "#Restauratie #Monumenten #Erfgoed"),
    ("Zuyd Hogeschool", 165381, "2024", "via financiële instrumenten", "#Zuyd #HBO #Limburg"),
    ("CBS", 200474, "2024", "via financiële instrumenten", "#CBS #Statistiek #Overheidsuitgaven"),
    ("UNDP", 213484, "2024", "van Nederland", "#UNDP #VN #Ontwikkelingshulp"),
    ("UNOCHA", 251991, "2024", "van Nederland", "#UNOCHA #VN #Noodhulp"),
    ("Stichting Avans", 312972, "2024", "via financiële instrumenten", "#Avans #HBO #Breda"),
    ("Deltion College", 177049, "2024", "via financiële instrumenten", "#Deltion #MBO #Zwolle"),
    ("Gemeente Leeuwarden", 584145, "2024", "via financiële instrumenten", "#Leeuwarden #Gemeenten #Rijksbegroting"),
    ("Gemeente Dordrecht", 513714, "2024", "via financiële instrumenten", "#Dordrecht #Gemeenten #Rijksbegroting"),
    ("Gemeente Heerlen", 431733, "2024", "via financiële instrumenten", "#Heerlen #Limburg #Rijksbegroting"),
    ("Provincie Noord-Brabant", 715871, "2022", "via financiële instrumenten", "#NoordBrabant #Provincies #Rijksbegroting"),
    ("Provincie Gelderland", 489413, "2024", "via financiële instrumenten", "#Gelderland #Provincies #Rijksbegroting"),
    ("TNO", 382610, "2024", "via financiële instrumenten", "#TNO #Innovatie #Wetenschap"),
    ("Maastricht University", 437020, "2022", "via financiële instrumenten", "#Maastricht #Universiteit #Onderwijs"),
    ("Rijkswaterstaat", 2487067, "2024", "via financiële instrumenten", "#Rijkswaterstaat #Infra #Overheidsuitgaven"),
    ("COA", 3926875, "2024", "via financiële instrumenten", "#COA #Asielopvang #Overheidsuitgaven"),
    ("NHL Stenden Hogeschool", 217668, "2024", "via financiële instrumenten", "#NHLStenden #HBO #Friesland"),
    # NEW from DB mining
    ("Gemeente Zaanstad", 361453, "2024", "via financiële instrumenten. In acht jaar: €1.892.464.000", "#Zaanstad #Gemeenten #Rijksbegroting"),
    ("Gemeente Zoetermeer", 279916, "2024", "via financiële instrumenten. In acht jaar: €1.277.513.000", "#Zoetermeer #Gemeenten #Rijksbegroting"),
    ("Gemeente Hilversum", 191355, "2024", "via financiële instrumenten. In acht jaar: €1.064.043.000", "#Hilversum #Gemeenten #Rijksbegroting"),
    ("Gemeente Leiden", 290451, "2024", "via financiële instrumenten. In acht jaar: €1.680.308.000", "#Leiden #Gemeenten #Rijksbegroting"),
    ("Gemeente Deventer", 235880, "2024", "via financiële instrumenten", "#Deventer #Gemeenten #Rijksbegroting"),
    ("Gemeente Vlissingen", 125772, "2024", "via financiële instrumenten. In acht jaar: €858.663.000", "#Vlissingen #Zeeland #Rijksbegroting"),
    ("Gemeente Terneuzen", 124217, "2024", "via financiële instrumenten. In acht jaar: €622.819.000", "#Terneuzen #Zeeland #Rijksbegroting"),
    ("Gemeente Kerkrade", 120762, "2024", "via financiële instrumenten. In acht jaar: €675.027.000", "#Kerkrade #Limburg #Rijksbegroting"),
    ("Gemeente Stadskanaal", 83545, "2024", "via financiële instrumenten. In acht jaar: €490.350.000", "#Stadskanaal #Groningen #Rijksbegroting"),
    ("NVWA", 177446, "2019", "via financiële instrumenten. In zes jaar: €941.108.000", "#NVWA #Voedselveiligheid #Overheidsuitgaven"),
    ("WFP", 75000, "2024", "van Nederland. In acht jaar: €527.226.000", "#WFP #VN #Voedselhulp #Overheidsuitgaven"),
    ("Stichting VU", 585857, "2024", "via financiële instrumenten", "#VU #Amsterdam #Universiteit #Onderwijs"),
    ("COVA", 115900, "2020", "via financiële instrumenten. In zeven jaar: €680.218.000", "#COVA #Olievoorraden #Energie"),
    ("Centraal Justitieel Incassobureau", 192591, "2024", "via financiële instrumenten", "#CJIB #Justitie #Overheidsuitgaven"),
    ("Stichting Conexus", 68327, "2024", "via financiële instrumenten. In negen jaar: €467.658.000", "#Conexus #Onderwijs #Nijmegen"),
    ("Gemeente Den Helder", 135896, "2024", "via financiële instrumenten. In acht jaar: €731.389.000", "#DenHelder #Marine #Rijksbegroting"),
    ("Gemeente Nieuwegein", 132855, "2024", "via financiële instrumenten. In acht jaar: €603.386.000", "#Nieuwegein #Utrecht #Rijksbegroting"),
    ("Gemeente Weert", 110119, "2024", "via financiële instrumenten. In acht jaar: €525.288.000", "#Weert #Limburg #Rijksbegroting"),
    ("Politieacademie", 109458, "2024", "via financiële instrumenten", "#Politieacademie #Politie #Overheidsuitgaven"),
    ("CITO", 34300, "2016", "via financiële instrumenten. In zeven jaar: €234.698.000", "#CITO #Toetsen #Onderwijs"),
    ("Defensie Materieel Organisatie", 193481, "2016", "via financiële instrumenten", "#DMO #Defensie #Materieel #Rijksbegroting"),
    ("IBRD/Wereldbank", 50000, "2022", "van Nederland. In vijf jaar: €223.354.000", "#Wereldbank #Ontwikkelingshulp #VN"),
    ("Stichting Lezen", 29839, "2024", "via financiële instrumenten. In negen jaar: €100.960.000", "#Lezen #Cultuur #Onderwijs"),
    ("Invest International", 260000, "2024", "via financiële instrumenten", "#InvestInternational #Ontwikkelingshulp"),
    ("Gemeente Berkelland", 87176, "2024", "via financiële instrumenten. In acht jaar: €396.451.000", "#Berkelland #Achterhoek #Rijksbegroting"),
    ("Life Sciences & Health", 86402, "2024", "via financiële instrumenten. In zes jaar: €374.010.000", "#LifeSciences #Innovatie #Zorg"),
    ("Oxxio Nederland", 115634, "2022", "via financiële instrumenten. Energiecompensatie", "#Oxxio #Energie #Overheidsuitgaven"),
    ("Stichting Groenfonds", 28000, "2016", "via financiële instrumenten. In acht jaar: €268.241.000", "#Groenfonds #Natuur #Overheidsuitgaven"),
]:
    amt = fmt_eur(val * 1000)
    text = f"{name} ontving {amt} in {yr} {ctx}. {tags}"
    add(P, text, "scale_shock", "instrumenten", name, yr)

# ==== INSTRUMENTEN — YoY dramatic changes ====
for name, y1, v1, y2, v2, tags in [
    ("Gemeente Breda", 2022, 31515, 2023, 364916, "#Breda #Gemeenten #Rijksbegroting"),
    ("Gemeente Zwolle", 2023, 53082, 2024, 305157, "#Zwolle #Gemeenten #Rijksbegroting"),
    ("Gemeente Almere", 2021, 42032, 2022, 417612, "#Almere #Gemeenten #Rijksbegroting"),
    ("Gemeente Nijmegen", 2022, 35703, 2023, 406788, "#Nijmegen #Gemeenten #Rijksbegroting"),
    ("Gemeente Rotterdam", 2023, 112815, 2024, 2053954, "#Rotterdam #Gemeenten #Rijksbegroting"),
    ("DJI", 2016, 39552, 2017, 372649, "#DJI #Justitie #Overheidsuitgaven"),
    ("Belastingdienst", 2020, 25939, 2021, 244485, "#Belastingdienst #Financien #Overheidsuitgaven"),
    ("Gemeente Alkmaar", 2023, 11906, 2024, 246994, "#Alkmaar #Gemeenten #Rijksbegroting"),
    ("Gemeente Stichtse Vecht", 2023, 11594, 2024, 111423, "#StichtseVecht #Utrecht #Rijksbegroting"),
    ("Gemeente Land van Cuijk", 2023, 15359, 2024, 174901, "#LandVanCuijk #Gemeenten #Rijksbegroting"),
    ("Gemeente Dronten", 2023, 11165, 2024, 84667, "#Dronten #Flevoland #Rijksbegroting"),
    ("NWO", 2018, 29026, 2019, 528487, "#NWO #Wetenschap #Overheidsuitgaven"),
    ("Provincie Limburg", 2023, 11712, 2024, 266681, "#Limburg #Provincies #Rijksbegroting"),
    ("Stichting Lucas Onderwijs", 2021, 16413, 2022, 112907, "#LucasOnderwijs #DenHaag #Onderwijs"),
    ("SVB", 2021, 29500, 2022, 167764, "#SVB #SocialeZekerheid #Overheidsuitgaven"),
    ("Gemeente Capelle a/d IJssel", 2021, 10239, 2022, 136621, "#Capelle #Gemeenten #Rijksbegroting"),
    ("RVO", 2019, 34833, 2020, 179153, "#RVO #Subsidies #Overheidsuitgaven"),
    ("Belastingdienst/Toeslagen", 2022, 4104209, 2023, 14749, "#Toeslagen #Overheidsuitgaven #Rijksbegroting"),
    ("Universiteit van Amsterdam", 2022, 709422, 2023, 23855, "#UvA #Amsterdam #Onderwijs"),
    ("Gemeente Amsterdam", 2023, 654435, 2024, 10213, "#Amsterdam #Gemeenten #Rijksbegroting"),
    ("SVB", 2022, 2420700, 2023, 28100, "#SVB #SocialeZekerheid #Rijksbegroting"),
]:
    a1, a2 = fmt_eur(v1*1000), fmt_eur(v2*1000)
    text = f"{name}: {a1} in {y1}, {a2} in {y2}. Via financiële instrumenten. {tags}"
    add(P, text, "scale_shock", "instrumenten", f"{name} YoY {y1}", f"{y1}-{y2}")

# ==== INSTRUMENTEN — comparison ====
for n1, v1, n2, v2, per, tags in [
    ("Gemeente Eindhoven", 3184803, "Gemeente Enschede", 2462027, "acht jaar", "#Eindhoven #Enschede #Gemeenten"),
    ("Gemeente Arnhem", 2688802, "Gemeente Nijmegen", 2674621, "acht jaar", "#Arnhem #Nijmegen #Gemeenten"),
    ("Gemeente Leeuwarden", 2028603, "Gemeente Zwolle", 1911674, "acht jaar", "#Leeuwarden #Zwolle #Gemeenten"),
    ("Gemeente Heerlen", 1612428, "Gemeente Venlo", 1526519, "acht jaar", "#Heerlen #Venlo #Limburg"),
    ("Fontys", 2866918, "Avans", 2028629, "negen jaar", "#Fontys #Avans #HBO"),
    ("Saxion", 1639549, "Zuyd Hogeschool", 1127417, "negen jaar", "#Saxion #Zuyd #HBO"),
    ("Prov. Noord-Brabant", 1896105, "Prov. Gelderland", 1529669, "negen jaar", "#NoordBrabant #Gelderland #Provincies"),
    ("Prov. Groningen", 1411125, "Prov. Limburg", 1356604, "negen jaar", "#Groningen #Limburg #Provincies"),
    ("UNICEF", 1121603, "UNDP", 1219590, "acht jaar", "#UNICEF #UNDP #Ontwikkelingshulp"),
    ("Gemeente Zaanstad", 1892464, "Gemeente Leiden", 1680308, "acht jaar", "#Zaanstad #Leiden #Gemeenten"),
    ("Gemeente Hilversum", 1064043, "Gemeente Vlissingen", 858663, "acht jaar", "#Hilversum #Vlissingen #Gemeenten"),
    ("Gemeente Deventer", 1275044, "Gemeente Weert", 525288, "acht jaar", "#Deventer #Weert #Gemeenten"),
    ("NVWA", 941108, "RIVM", 957987, "negen jaar", "#NVWA #RIVM #Overheidsuitgaven"),
    ("Gemeente Stadskanaal", 490350, "Gemeente Meppel", 425153, "acht jaar", "#Stadskanaal #Meppel #Groningen"),
    ("Gemeente Kerkrade", 675027, "Gemeente Venray", 471793, "acht jaar", "#Kerkrade #Venray #Limburg"),
]:
    a1, a2 = fmt_eur(v1*1000), fmt_eur(v2*1000)
    text = f"{n1}: {a1}. {n2}: {a2}. In {per} financiële instrumenten. {tags}"
    add(P, text, "comparison", "instrumenten", f"{n1} vs {n2}", "2016-2024")

# ==== INSTRUMENTEN — curiosity ====
for q, a, tags in [
    ("Hoeveel ontving de KvK van het Rijk?", "€1.234.610.000. In negen jaar.", "#KvK #Ondernemers #Overheidsuitgaven"),
    ("Hoeveel ontving de Reclassering van het Rijk?", "€1.245.556.000. In negen jaar.", "#Reclassering #Justitie #Overheidsuitgaven"),
    ("Hoeveel ontving UNDP van Nederland?", "€1.219.590.000. In acht jaar.", "#UNDP #VN #Ontwikkelingshulp"),
    ("Hoeveel ontving UNOCHA van Nederland?", "€1.090.996.000. In zeven jaar.", "#UNOCHA #VN #Noodhulp"),
    ("Hoeveel ging er naar het Commissariaat voor de Media?", "€8.612.622.000. In negen jaar.", "#Media #Omroep #Overheidsuitgaven"),
    ("Hoeveel ontving de Raad voor de Rechtspraak?", "€5.871.159.000. In zes jaar.", "#Rechtspraak #Justitie #Overheidsuitgaven"),
    ("Hoeveel ontving TNO van het Rijk?", "€1.650.437.000. In zes jaar.", "#TNO #Innovatie #Wetenschap"),
    ("Hoeveel ging er naar DUO?", "€1.742.974.000. In vijf jaar.", "#DUO #Studiefinanciering #Onderwijs"),
    ("Hoeveel ontving Rijkswaterstaat in 2024?", "€2.487.067.000 via financiële instrumenten.", "#Rijkswaterstaat #Infra #Overheidsuitgaven"),
    ("Hoeveel ontving het CBS van het Rijk?", "€1.011.608.000. In zes jaar.", "#CBS #Statistiek #Overheidsuitgaven"),
    ("Hoeveel gaf Nederland aan de EU via BTW-afdrachten?", "€5.724.531.000. In vijf jaar.", "#EU #BTW #Europa #Rijksbegroting"),
    ("Hoeveel ontving de Studentenkaart van het Rijk?", "€1.031.965.000. In vier jaar.", "#OV #Studenten #Studentenkaart"),
    ("Hoeveel ontving het Nationaal Restauratiefonds?", "€1.065.182.000. In zes jaar.", "#Monumenten #Erfgoed #Restauratie"),
    ("Hoeveel ontving Fontys in negen jaar?", "€2.866.918.000.", "#Fontys #HBO #Onderwijs #Rijksbegroting"),
    ("Hoeveel ontving het Deltafonds in twee jaar?", "€1.752.641.000. Voor waterveiligheid.", "#Deltafonds #Water #Overheidsuitgaven"),
    ("Hoeveel ontving de NVWA van het Rijk?", "€941.108.000. In zes jaar.", "#NVWA #Voedselveiligheid #Overheidsuitgaven"),
    ("Hoeveel ontving CITO van het Rijk?", "€234.698.000. In zeven jaar.", "#CITO #Toetsen #Onderwijs"),
    ("Hoeveel ontving de Politieacademie?", "€130.697.000. In negen jaar.", "#Politieacademie #Politie #Overheidsuitgaven"),
    ("Hoeveel ontving Invest International in 2024?", "€260.000.000.", "#InvestInternational #Ontwikkelingshulp"),
    ("Hoeveel ontving Stichting Lezen in negen jaar?", "€100.960.000.", "#Lezen #Cultuur #Onderwijs #Overheidsuitgaven"),
    ("Hoeveel ontving Gemeente Leiden in acht jaar?", "€1.680.308.000 via financiële instrumenten.", "#Leiden #Gemeenten #Rijksbegroting"),
    ("Hoeveel ontving het WFP van Nederland?", "€527.226.000. In acht jaar.", "#WFP #VN #Voedselhulp #Overheidsuitgaven"),
    ("Hoeveel ontving COVA van het Rijk?", "€680.218.000. In zeven jaar. Strategische olievoorraden.", "#COVA #Energie #Overheidsuitgaven"),
    ("Hoeveel ontving de IBRD/Wereldbank van NL?", "€223.354.000. In vijf jaar.", "#Wereldbank #Ontwikkelingshulp #VN"),
    ("Hoeveel ontving het Groenfonds in acht jaar?", "€268.241.000.", "#Groenfonds #Natuur #Overheidsuitgaven"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "instrumenten", q[:30], "2016-2024")

# ============================================================
# GEMEENTE — concentration (absolute euros)
# ============================================================
for name, city, total, yrs, tags in [
    ("Stichting WIJKZ", "Den Haag", 81056758, 4, "#DenHaag #Wijkteams #Sociaal"),
    ("Stichting Nieuwe Veste", "Breda", 96221293, 8, "#Breda #Cultuur #Gemeentefonds"),
    ("Stichting IMW Breda", "Breda", 37126970, 8, "#Breda #Welzijn #Sociaal"),
    ("Buurtteam Amsterdam Zuid", "Amsterdam", 24554962, 2, "#Amsterdam #Buurtteams #Sociaal"),
    ("Amsterdam Economic Board", "Amsterdam", 18258348, 10, "#Amsterdam #Economie #Innovatie"),
    ("Muziekschool Amsterdam Noord", "Amsterdam", 12466686, 11, "#Amsterdam #Muziek #Onderwijs"),
    ("GGZ Breburg groep", "Breda", 10754395, 8, "#Breda #GGZ #Zorg"),
    ("Weekend Academie", "Amsterdam", 9641593, 11, "#Amsterdam #Onderwijs #Jongeren"),
    ("Theaters Diligentia en PePijn", "Den Haag", 7743839, 8, "#DenHaag #Theater #Cultuur"),
    ("Holland Festival", "Amsterdam", 6871865, 9, "#Amsterdam #HollandFestival #Cultuur"),
    ("Sail Amsterdam", "Amsterdam", 5569000, 9, "#Amsterdam #Sail #Evenementen"),
    ("Joods Maatschappelijk Werk", "Amsterdam", 4866338, 10, "#Amsterdam #JMW #Maatschappelijk"),
    ("SRO Amersfoort", "Amersfoort", 6843328, 3, "#Amersfoort #Sport #Recreatie"),
    ("DOCK Utrecht", "Utrecht", 20702059, 3, "#Utrecht #Welzijn #Sociaal"),
    ("Arkin", "Amersfoort", 20441947, 7, "#Amersfoort #GGZ #Verslavingszorg"),
    ("Haarlem Effect", "Haarlem", 6478162, 5, "#Haarlem #Evenementen #Gemeentefonds"),
    ("Vrijwillig & Co", "Breda", 5123104, 8, "#Breda #Vrijwilligers #Sociaal"),
    # NEW from DB mining
    ("Nationale Opera & Ballet", "Amsterdam", 111306980, 10, "#Amsterdam #Opera #Ballet #Cultuur"),
    ("De Regenboog Groep", "Amsterdam", 116724720, 11, "#Amsterdam #Maatschappelijk #Zorg"),
    ("Stichting Doras", "Amsterdam", 72074305, 12, "#Amsterdam #Ouderenzorg #Sociaal"),
    ("Stichting Impuls", "Amsterdam", 74844141, 12, "#Amsterdam #Kinderopvang #Onderwijs"),
    ("Stichting Eigenwijks", "Amsterdam", 54588658, 12, "#Amsterdam #Wijkbewoners #Sociaal"),
    ("VluchtelingenWerk Nederland", "Amsterdam", 48052241, 10, "#Amsterdam #Vluchtelingen #Sociaal"),
    ("Combiwel Amsterdam", "Amsterdam", 45318663, 7, "#Amsterdam #Welzijn #Sociaal"),
    ("amsterdam&partners", "Amsterdam", 45906788, 9, "#Amsterdam #Marketing #Toerisme"),
    ("Stichting Lucas Onderwijs", "Den Haag", 66679388, 8, "#DenHaag #Onderwijs #Gemeentefonds"),
    ("Kessler Stichting", "Den Haag", 41683531, 6, "#DenHaag #Maatschappelijk #Zorg"),
    ("MOOI Den Haag", "Den Haag", 67746736, 5, "#DenHaag #Welzijn #Sociaal"),
    ("Hulp bij Prostitutie", "Den Haag", 22760913, 8, "#DenHaag #Hulpverlening #Sociaal"),
    ("Gemeentemuseum Den Haag", "Den Haag", 31019452, 3, "#DenHaag #Museum #Cultuur"),
    ("Nederlands Dans Theater", "Den Haag", 21467637, 8, "#DenHaag #Dans #Cultuur"),
    ("Residentie Orkest", "Den Haag", 17625946, 4, "#DenHaag #Orkest #Cultuur"),
    ("Aanpak Overlast Amsterdam", "Amsterdam", 71074784, 10, "#Amsterdam #Veiligheid #Overlast"),
    ("Groninger Forum", "Groningen", 64688927, 7, "#Groningen #Forum #Cultuur"),
    ("Groninger Museum", "Groningen", 32261466, 8, "#Groningen #Museum #Cultuur"),
    ("INLIA Groningen", "Groningen", 24057073, 6, "#Groningen #Vluchtelingen #Opvang"),
    ("ContourdeTwern", "Tilburg", 72982342, 3, "#Tilburg #Welzijn #Sociaal"),
    ("Stichting Mommerskwartier", "Tilburg", 26418923, 5, "#Tilburg #Wonen #Sociaal"),
    ("SMO Traverse", "Tilburg", 29717573, 3, "#Tilburg #Maatschappelijk #Zorg"),
    ("Sportbedrijf Arnhem", "Arnhem", 100902643, 5, "#Arnhem #Sport #Gemeentefonds"),
    ("Veilig Thuis Gelderland", "Arnhem", 14941153, 5, "#Arnhem #VeiligThuis #Zorg"),
    ("Chasse Theater", "Breda", 44782409, 8, "#Breda #Theater #Cultuur"),
    ("Stedelijk Museum Breda", "Breda", 31127731, 8, "#Breda #Museum #Cultuur"),
    ("Sociale Wijkteams Amersfoort", "Amersfoort", 114193751, 7, "#Amersfoort #Wijkteams #Sociaal"),
    ("Scholen In De Kunst", "Amersfoort", 31497537, 7, "#Amersfoort #Kunst #Onderwijs"),
    ("Amersfoort in C", "Amersfoort", 20980501, 7, "#Amersfoort #Cultuur #Gemeentefonds"),
    ("De Flint", "Amersfoort", 24005894, 7, "#Amersfoort #Theater #Cultuur"),
    ("Bibliotheken Eemland", "Amersfoort", 35025472, 7, "#Amersfoort #Bibliotheek #Cultuur"),
    ("Samen Veilig Midden-NL", "Almere", 21617006, 3, "#Almere #VeiligThuis #Zorg"),
    ("Openbare Bibliotheek Almere", "Almere", 47554050, 7, "#Almere #Bibliotheek #Cultuur"),
    ("Speeltuinen in Noord", "Amsterdam", 30894155, 11, "#Amsterdam #Speeltuinen #Kinderen"),
    ("Samenwerking Bijzondere Noden", "Amsterdam", 23863807, 10, "#Amsterdam #Armoede #Sociaal"),
    ("IJscomplex Jaap Eden", "Amsterdam", 12196357, 9, "#Amsterdam #Schaatsen #Sport"),
    ("De Toneelschuur", "Haarlem", 15003408, 6, "#Haarlem #Theater #Cultuur"),
    ("Patronaat", "Haarlem", 11001759, 6, "#Haarlem #Muziek #Cultuur"),
    ("Frans Hals Museum", "Haarlem", 21158995, 6, "#Haarlem #Museum #Cultuur"),
    ("Streetcornerwork", "Amsterdam", 15005188, 5, "#Amsterdam #Jongeren #Sociaal"),
]:
    amt = fmt_eur(total)
    yr_str = f"In {_dy(yrs)}." if yrs else ""
    text = f"{name} ontving {amt} van de gemeente {city}. {yr_str} {tags}"
    add(P, text, "concentration", "gemeente", name, "2018-2024")

# ==== GEMEENTE — comparison ====
for n1, v1, n2, v2, tags in [
    ("Tilburg", 830639947, "Breda", 776313434, "#Tilburg #Breda #Gemeentefonds"),
    ("Haarlem", 435306149, "Utrecht", 387825177, "#Haarlem #Utrecht #Gemeentefonds"),
    ("DOCK Amsterdam", 94240890, "DOCK Utrecht", 20702059, "#DOCK #Amsterdam #Utrecht"),
    ("Opera & Ballet Amsterdam", 111306980, "Groninger Forum", 64688927, "#Amsterdam #Groningen #Cultuur"),
    ("Sportbedrijf Arnhem", 100902643, "Sociale Wijkteams Amersfoort", 114193751, "#Arnhem #Amersfoort #Gemeentefonds"),
    ("Bibliotheek Almere", 47554050, "Bibliotheken Eemland", 35025472, "#Almere #Amersfoort #Bibliotheek"),
    ("Chasse Theater Breda", 44782409, "De Flint Amersfoort", 24005894, "#Breda #Amersfoort #Theater"),
    ("Groninger Museum", 32261466, "Stedelijk Museum Breda", 31127731, "#Groningen #Breda #Museum"),
    ("Stichting Doras", 72074305, "ContourdeTwern", 72982342, "#Amsterdam #Tilburg #Welzijn"),
]:
    a1, a2 = fmt_eur(v1), fmt_eur(v2)
    text = f"{n1}: {a1}. {n2}: {a2}. In zeven jaar gemeente-uitkeringen. {tags}"
    add(P, text, "comparison", "gemeente", f"{n1} vs {n2}", "2018-2024")

# ==== GEMEENTE — curiosity ====
for q, a, tags in [
    ("Hoeveel ontving Stichting WIJKZ van Den Haag?", "€81.056.758. In vier jaar.", "#DenHaag #Wijkteams #Sociaal"),
    ("Hoeveel ontving het Holland Festival van Amsterdam?", "€6.871.865. In negen jaar.", "#Amsterdam #HollandFestival #Cultuur"),
    ("Hoeveel ontving Sail Amsterdam van de gemeente?", "€5.569.000. In negen jaar.", "#Amsterdam #Sail #Evenementen"),
    ("Hoeveel ontving Stichting Nieuwe Veste van Breda?", "€96.221.293. In acht jaar.", "#Breda #NieuweVeste #Cultuur"),
    ("Hoeveel ontving GGZ Breburg van Breda?", "€10.754.395. In acht jaar.", "#Breda #GGZ #Zorg"),
    ("Hoeveel ontving de Nationale Opera & Ballet?", "€111.306.980 van Amsterdam. In tien jaar.", "#Amsterdam #Opera #Ballet #Cultuur"),
    ("Hoeveel ontving het Groninger Forum?", "€64.688.927 van Groningen. In zeven jaar.", "#Groningen #Forum #Cultuur"),
    ("Hoeveel ontving MOOI van Den Haag?", "€67.746.736. In vijf jaar.", "#DenHaag #Welzijn #Sociaal"),
    ("Hoeveel gaf Amsterdam aan overlastbestrijding?", "€71.074.784 aan Stichting Aanpak Overlast. In tien jaar.", "#Amsterdam #Veiligheid #Overlast"),
    ("Hoeveel ontving VluchtelingenWerk van Amsterdam?", "€48.052.241. In tien jaar.", "#Amsterdam #Vluchtelingen #Sociaal"),
    ("Hoeveel ontving Combiwel van Amsterdam?", "€45.318.663. In zeven jaar.", "#Amsterdam #Welzijn #Sociaal"),
    ("Hoeveel ontving amsterdam&partners?", "€45.906.788 van Amsterdam. In negen jaar.", "#Amsterdam #Marketing #Toerisme"),
    ("Hoeveel ontving het Chasse Theater van Breda?", "€44.782.409. In acht jaar.", "#Breda #Theater #Cultuur"),
    ("Hoeveel ontving de Kessler Stichting van Den Haag?", "€41.683.531. In zes jaar.", "#DenHaag #Maatschappelijk #Zorg"),
    ("Hoeveel ontving het Sportbedrijf Arnhem?", "€100.902.643. In vijf jaar.", "#Arnhem #Sport #Gemeentefonds"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "gemeente", q[:30], "2018-2024")

# ============================================================
# INKOOP — staffel brackets (pre-written)
# ============================================================
for text, fmt, ent in [
    ("Capgemini had zes jaar inkoopcontracten tussen €25 en €50 miljoen bij BZK. Categorie: ICT-beheer. #Capgemini #ICT #BZK #Inkoop", "category_reveal", "Capgemini BZK"),
    ("Capgemini had vijf jaar inkoopcontracten tussen €10 en €25 miljoen bij AZ. Categorie: uitbesteding. #Capgemini #ICT #AZ #Inkoop", "category_reveal", "Capgemini AZ"),
    ("Vattenfall had drie jaar inkoopcontracten tussen €25 en €50 miljoen bij Justitie. Categorie: energie. #Vattenfall #Energie #Justitie #Inkoop", "category_reveal", "Vattenfall JenV"),
    ("Deltares had drie jaar inkoopcontracten tussen €25 en €50 miljoen bij I&W. Categorie: uitbesteding. #Deltares #Onderzoek #Water #Inkoop", "category_reveal", "Deltares"),
    ("Philips had twee jaar inkoopcontracten tussen €25 en €50 miljoen bij VWS. #Philips #Zorg #Medisch #Inkoop", "category_reveal", "Philips VWS"),
    ("DC Sligro had twee jaar contracten tussen €25 en €50 miljoen bij Defensie. Categorie: voeding. #Sligro #Defensie #Voeding #Inkoop", "category_reveal", "DC Sligro"),
    ("Sandd had drie jaar inkoopcontracten tussen €10 en €25 miljoen bij Financiën. Categorie: post. #Sandd #Post #Financien #Inkoop", "category_reveal", "Sandd"),
    ("Gom Schoonhouden had twee jaar contracten tussen €10 en €25 miljoen bij Defensie. #Schoonmaak #Defensie #Inkoop #Overheidsuitgaven", "category_reveal", "Gom Defensie"),
    ("Compass Group had twee jaar contracten tussen €10 en €25 miljoen bij Justitie. Categorie: forensisch. #Compass #Catering #Justitie #Inkoop", "category_reveal", "Compass JenV"),
    ("Orange Business had vijf jaar contracten tussen €10 en €25 miljoen bij BuZa. Categorie: ICT. #Orange #ICT #BuZa #Inkoop", "category_reveal", "Orange BuZa"),
    ("SoftwareONE had twee jaar contracten tussen €25 en €50 miljoen bij Financiën. Categorie: software. #SoftwareONE #ICT #Financien #Inkoop", "category_reveal", "SoftwareONE"),
    ("Duo2 had acht jaar inkoopcontracten tussen €25 en €50 miljoen bij BZK. Categorie: vastgoed. #Facility #BZK #Vastgoed #Inkoop", "concentration", "Duo2"),
    ("Safire had acht jaar inkoopcontracten tussen €10 en €25 miljoen bij BZK. Categorie: vastgoed. #Safire #BZK #Vastgoed #Inkoop", "concentration", "Safire"),
    ("Virtu Secure had vijf jaar contracten tussen €10 en €25 miljoen bij BZK. Categorie: ICT-infra. #Cybersecurity #BZK #ICT #Inkoop", "concentration", "Virtu Secure"),
    ("Biosynex SWISS had een contract tussen €50 en €100 miljoen bij VWS. Categorie: uitbesteding. #Biosynex #Corona #Zorg #Inkoop", "scale_shock", "Biosynex"),
    ("Shuttel B.V. had contracten bij vier ministeries. Overal categorie reis en verblijf. #Shuttel #Dienstreizen #Overheid #Inkoop", "concentration", "Shuttel multi"),
    ("Het Rijk had 18.207 communicatie-contracten bij 9.909 leveranciers in acht jaar. #Communicatie #Inkoop #Overheid #Overheidsuitgaven", "scale_shock", "Communicatie cat"),
    # NEW from DB mining
    ("Fivoor had een inkoopcontract boven €100 miljoen bij Justitie. Categorie: forensisch. #Fivoor #GGZ #Justitie #Inkoop", "scale_shock", "Fivoor max"),
    ("Boskalis had een inkoopcontract tussen €25 en €50 miljoen bij I&W. #Boskalis #Waterbouw #Infra #Inkoop", "scale_shock", "Boskalis IenW"),
    ("PostNL had drie jaar contracten tussen €25 en €50 miljoen bij Financiën. Categorie: post. #PostNL #Post #Financien #Inkoop", "concentration", "PostNL FIN"),
    ("KPN had vier jaar contracten tussen €2,5 en €5 miljoen bij BZK. Categorie: ICT-dienstverlening. #KPN #Telecom #BZK #Inkoop", "concentration", "KPN BZK"),
    ("ENGIE had drie jaar contracten tussen €1 en €2,5 miljoen bij BZK. Categorie: gebouwen. #ENGIE #Energie #BZK #Inkoop", "category_reveal", "ENGIE BZK"),
    ("Paleis Het Loo had drie jaar contracten tussen €1 en €2,5 miljoen bij BZK. Gebouwonderhoud. #PaleisHetLoo #Monumenten #BZK #Inkoop", "category_reveal", "Paleis Het Loo"),
    ("ARCADIS had drie jaar contracten tussen €1 en €2,5 miljoen bij I&W. Categorie: uitbesteding. #ARCADIS #Advies #Infra #Inkoop", "category_reveal", "ARCADIS IenW"),
    ("Stichting Nuffic had contracten tussen €2,5 en €5 miljoen bij BuZa. Categorie: BZ-specifiek. #Nuffic #Onderwijs #BuZa #Inkoop", "category_reveal", "Nuffic BuZa"),
    ("Leaseplan had contracten tussen €5 en €10 miljoen bij I&W. Categorie: wagenpark. #Leaseplan #Wagenpark #Overheid #Inkoop", "category_reveal", "Leaseplan IenW"),
    ("Capgemini had twee jaar contracten tussen €1 en €2,5 miljoen bij Defensie. Categorie: ICT. #Capgemini #ICT #Defensie #Inkoop", "category_reveal", "Capgemini DEF"),
    ("DXC Technology had een contract tussen €2,5 en €5 miljoen bij Justitie. #DXC #ICT #Justitie #Inkoop", "category_reveal", "DXC JenV"),
    ("Protinus IT had twee jaar contracten tussen €5 en €10 miljoen bij Justitie. Categorie: software. #ProtinusIT #ICT #Justitie #Inkoop", "concentration", "Protinus JenV"),
    ("Centralpoint had contracten tussen €5 en €10 miljoen bij BZK. Categorie: hardware. #Centralpoint #ICT #Hardware #Inkoop", "category_reveal", "Centralpoint"),
    ("Insight had twee jaar contracten tussen €2,5 en €5 miljoen bij BZK. Categorie: software. #Insight #ICT #Software #Inkoop", "category_reveal", "Insight BZK"),
    ("Gispen had twee jaar contracten tussen €1 en €2,5 miljoen bij BZK. Categorie: inrichting. #Gispen #Meubilair #BZK #Inkoop", "category_reveal", "Gispen BZK"),
    ("VepaDrentea had twee jaar contracten tussen €2,5 en €5 miljoen bij Defensie. Inrichting gebouwen. #Meubilair #Defensie #Inkoop", "category_reveal", "Vepa DEF"),
    ("Breijer contractonderhoud had een contract tussen €2,5 en €5 miljoen bij BZK. Gebouwen. #Breijer #Onderhoud #BZK #Inkoop", "category_reveal", "Breijer"),
    # Curiosity
    ("Hoeveel leveranciers had Defensie in benodigdheden? 9.906. Met 20.124 contracten in acht jaar. #Defensie #Inkoop #Materieel", "curiosity", "DEF benodigdheden"),
    ("Hoeveel leveranciers leverden consumptieve diensten? 7.207. Met 12.115 contracten. #Catering #Inkoop #Overheid", "curiosity", "Consumptief"),
    ("Hoeveel bedrijven organiseerden evenementen voor het Rijk? 7.252. Met 11.035 contracten. #Evenementen #Inkoop #Overheid", "curiosity", "Evenementen"),
    ("Hoeveel leveranciers had het Rijk voor studie en opleiding? 31.866. Met 72.047 contracten. #Opleiding #Inkoop #Ambtenaren", "curiosity", "Studie cat"),
    ("Hoeveel representatie-contracten had het Rijk? 78.433. Bij 39.461 leveranciers. #Representatie #Inkoop #Overheid", "curiosity", "Representatie"),
    ("Hoeveel gebouwonderhoud-contracten had het Rijk? 34.024. Bij 17.494 leveranciers. #Gebouwen #Inkoop #Vastgoed", "curiosity", "Gebouwen"),
    ("Hoeveel reiscontracten had het Rijk? 27.565. Bij 19.306 leveranciers in acht jaar. #Reiskosten #Inkoop #Overheid", "curiosity", "Reis cat"),
    ("Hoeveel ICT-uitbestedingscontracten had het Rijk? 10.757. Bij 5.345 leveranciers. #ICT #Inkoop #DigitaleOverheid", "curiosity", "ICT uitbesteding"),
    ("Hoeveel wagenpark-contracten had het Rijk? 6.872. Bij 3.649 leveranciers in acht jaar. #Wagenpark #Inkoop #Overheid", "curiosity", "Wagenpark cat"),
    ("Hoeveel inrichtingscontracten had het Rijk? 9.262. Bij 5.382 leveranciers in acht jaar. #Inrichting #Inkoop #Overheid", "curiosity", "Inrichting cat"),
    # More concentration
    ("Computacenter had drie jaar contracten tussen €1 en €2,5 miljoen bij Financiën. Categorie: hardware. #Computacenter #ICT #Financien #Inkoop", "concentration", "Computacenter"),
    ("Veolia Gebouwenbeheer had twee jaar contracten tussen €1 en €2,5 miljoen bij BZK. #Veolia #Gebouwen #BZK #Inkoop", "concentration", "Veolia BZK"),
    ("VIOS Bouwgroep had twee jaar contracten tussen €1 en €2,5 miljoen bij BZK. Gebouwen. #VIOS #Bouw #BZK #Inkoop", "concentration", "VIOS BZK"),
    ("Unica Installatietechniek had twee jaar contracten tussen €2,5 en €5 miljoen bij BZK. #Unica #Installatie #BZK #Inkoop", "concentration", "Unica BZK"),
    ("Eviden had een contract tussen €2,5 en €5 miljoen bij Justitie. Categorie: ICT. #Eviden #ICT #Justitie #Inkoop", "category_reveal", "Eviden JenV"),
    ("Ordina had een contract tussen €1 en €2,5 miljoen bij EZK. Categorie: EZ-specifiek. #Ordina #ICT #EZK #Inkoop", "category_reveal", "Ordina EZK"),
    ("HeadFirst had een contract tussen €2,5 en €5 miljoen bij I&W. Inhuur. #HeadFirst #Inhuur #Infra #Inkoop", "category_reveal", "HeadFirst IenW"),
    ("SPIE had een contract tussen €5 en €10 miljoen bij BZK. Categorie: gebouwen en terreinen. #SPIE #Onderhoud #BZK #Inkoop", "scale_shock", "SPIE BZK"),
    ("BAM Infra had een contract tussen €5 en €10 miljoen bij I&W. #BAM #Infra #Bouw #Inkoop", "scale_shock", "BAM IenW"),
    ("Solvinity had contracten tussen €2,5 en €5 miljoen bij BZK. Categorie: ICT-infrastructuur. #Solvinity #Cloud #ICT #Inkoop", "category_reveal", "Solvinity"),
]:
    add(P, text, fmt, "inkoop", ent, "2018-2024", "yes")

# ============================================================
# APPARAAT (amounts already ×1000 converted in text)
# ============================================================
for text, fmt, ent in [
    ("Defensie besteedde €840.460.000 aan gebouwen en terreinen in drie jaar. #Defensie #Vastgoed #Apparaat #Rijksbegroting", "scale_shock", "Defensie gebouwen"),
    ("Defensie besteedde €587.165.000 aan hardware in vier jaar. #Defensie #Hardware #ICT #Rijksbegroting", "scale_shock", "Defensie hardware"),
    ("Financiën besteedde €947.812.000 aan uitzendkrachten in acht jaar. #Financien #Uitzendkrachten #Belastingdienst", "scale_shock", "Financien uitzend"),
    ("Defensie besteedde €449.044.000 aan reis en verblijf in vijf jaar. #Defensie #Reiskosten #Militairen #Apparaat", "scale_shock", "Defensie reis"),
    ("Justitie besteedde €643.102.000 aan ICT-advisering in acht jaar. #Justitie #ICT #DigitaleOverheid", "scale_shock", "JenV ICT"),
    ("BZK besteedde €391.330.000 aan de AIVD in twee jaar. #AIVD #Veiligheid #BZK #Rijksbegroting", "scale_shock", "AIVD"),
    ("BuZa besteedde €422.111.000 aan toelagen in zeven jaar. Diplomaten in het buitenland. #BuZa #Diplomatie #Toelagen", "category_reveal", "BuZa toelagen"),
    ("BuZa besteedde €160.629.000 aan uitzendkrachten in zes jaar. #BuZa #Diplomatie #Uitzendkrachten", "category_reveal", "BuZa uitzend"),
    ("Justitie besteedde €749.432.000 aan SSO-bijdragen in acht jaar. #Justitie #SSO #SharedServices", "category_reveal", "JenV SSO"),
    ("Financiën besteedde €245.378.000 aan studie en opleiding in acht jaar. #Financien #Opleiding #Ambtenaren", "category_reveal", "Financien opleiding"),
    ("I&W besteedde €310.851.000 aan toelagen in zeven jaar. #Rijkswaterstaat #Toelagen #Ambtenaren", "category_reveal", "IenW toelagen"),
    ("Financiën besteedde €156.631.000 aan telecom in acht jaar. #Financien #Telecom #ICT #Apparaat", "category_reveal", "Financien telecom"),
    ("Defensie besteedde €162.076.000 aan externe inhuur in zes jaar. #Defensie #Inhuur #Apparaat #Rijksbegroting", "category_reveal", "Defensie inhuur"),
    ("AZ besteedde €130.453.000 aan salarissen in acht jaar. Het kleinste ministerie. #AZ #MinisterPresident #Rijksbegroting", "scale_shock", "AZ salarissen"),
    # NEW from DB mining
    ("Defensie besteedde €17.205.513.000 aan salarissen in vijf jaar. #Defensie #Salarissen #Rijksbegroting #Apparaat", "scale_shock", "Defensie salaris"),
    ("Financiën besteedde €12.886.721.000 aan salarissen in zeven jaar. #Financien #Salarissen #Belastingdienst", "scale_shock", "Financien salaris"),
    ("I&W besteedde €5.501.142.000 aan salarissen in zes jaar. #Rijkswaterstaat #Salarissen #Infra", "scale_shock", "IenW salaris"),
    ("Defensie besteedde €5.205.610.000 aan pensioenen in vier jaar. #Defensie #Pensioenen #Rijksbegroting", "scale_shock", "Defensie pensioenen"),
    ("OCW besteedde €1.421.214.000 aan salarissen in tien jaar. #OCW #Onderwijs #Salarissen #Ambtenaren", "scale_shock", "OCW salaris"),
    ("BZK besteedde €1.341.057.000 aan salarissen in acht jaar. #BZK #Salarissen #Ambtenaren #Rijksbegroting", "scale_shock", "BZK salaris"),
    ("I&W besteedde €1.143.836.000 aan uitzendkrachten in zeven jaar. #Rijkswaterstaat #Uitzendkrachten #Infra", "scale_shock", "IenW uitzend"),
    ("Defensie besteedde €2.042.098.000 aan toelagen in zes jaar. #Defensie #Toelagen #Militairen #Apparaat", "scale_shock", "Defensie toelagen2"),
    ("BuZa besteedde €558.877.000 aan verwerven en afstoten in zeven jaar. #BuZa #Vastgoed #Diplomatie", "category_reveal", "BuZa vastgoed"),
    ("Financiën besteedde €572.183.000 aan accountancy in acht jaar. #Financien #Accountancy #Belastingdienst", "category_reveal", "Financien accountancy"),
    ("Defensie besteedde €507.336.000 aan benodigdheden in vijf jaar. #Defensie #Materieel #Apparaat #Rijksbegroting", "category_reveal", "Defensie benodigdheden"),
    ("Defensie besteedde €487.102.000 aan studie en opleiding in vijf jaar. #Defensie #Opleiding #Militairen", "category_reveal", "Defensie opleiding"),
    ("Financiën besteedde €483.754.000 aan juridisch advies in acht jaar. #Financien #Juridisch #Belastingdienst", "category_reveal", "Financien juridisch"),
    ("Defensie besteedde €732.631.000 aan woon-werkverkeer in vijf jaar. #Defensie #Reiskosten #Apparaat", "category_reveal", "Defensie woonwerk"),
    ("I&W besteedde €611.531.000 aan het wagenpark in zeven jaar. #Rijkswaterstaat #Wagenpark #Infra #Apparaat", "category_reveal", "IenW wagenpark"),
    ("Defensie besteedde €1.040.085.000 aan relatiegeschenken in zes jaar. #Defensie #Geschenken #Apparaat", "scale_shock", "Defensie geschenken"),
    ("VWS besteedde €563.650.000 aan salarissen in vier jaar. #VWS #Zorg #Salarissen #Ambtenaren", "scale_shock", "VWS salaris"),
    ("BuZa besteedde €1.880.313.000 aan salarissen in zes jaar. #BuZa #Diplomatie #Salarissen #Ambtenaren", "scale_shock", "BuZa salaris"),
    # Comparison
    ("Justitie: €642.524.000 aan pensioenpremies in acht jaar. BuZa: €118.246.000 aan loonbelasting. #Justitie #BuZa #Pensioenen", "comparison", "JenV vs BuZa"),
    ("EZK: €976.471.000 aan salarissen in vijf jaar. SZW: €339.322.000 in één jaar. #EZK #SZW #Salarissen", "comparison", "EZK vs SZW"),
    ("Defensie: €17,2 miljard salarissen. Financiën: €12,9 miljard. In vijf resp. zeven jaar. #Defensie #Financien #Salarissen", "comparison", "DEF vs FIN salaris"),
    ("I&W: €1,1 miljard uitzendkrachten. Financiën: €948 miljoen. In zeven resp. acht jaar. #Uitzendkrachten #Apparaat #Overheid", "comparison", "IenW vs FIN uitzend"),
    ("OCW: €1,4 miljard salarissen in tien jaar. BZK: €1,3 miljard in acht jaar. #OCW #BZK #Ambtenaren #Salarissen", "comparison", "OCW vs BZK"),
]:
    add(P, text, fmt, "apparaat", ent, "2016-2024")

for q, a, tags in [
    ("Hoeveel besteedde Defensie aan reis en verblijf?", "€449.044.000. In vijf jaar.", "#Defensie #Reiskosten #Apparaat"),
    ("Hoeveel besteedde Financiën aan opleiding?", "€245.378.000. In acht jaar.", "#Financien #Opleiding #Ambtenaren"),
    ("Hoeveel besteedde het Rijk aan de AIVD?", "€391.330.000. In twee jaar apparaat.", "#AIVD #Veiligheid #BZK"),
    ("Hoeveel besteedde Defensie aan salarissen?", "€17.205.513.000. In vijf jaar.", "#Defensie #Salarissen #Rijksbegroting"),
    ("Hoeveel besteedde I&W aan uitzendkrachten?", "€1.143.836.000. In zeven jaar.", "#Rijkswaterstaat #Uitzendkrachten"),
    ("Hoeveel besteedde Financiën aan accountancy?", "€572.183.000. In acht jaar.", "#Financien #Accountancy #Belastingdienst"),
    ("Hoeveel besteedde Defensie aan pensioenen?", "€5.205.610.000. In vier jaar.", "#Defensie #Pensioenen #Rijksbegroting"),
    ("Hoeveel besteedde BuZa aan toelagen?", "€422.111.000. In zeven jaar. Diplomaten.", "#BuZa #Diplomatie #Toelagen"),
    ("Hoeveel besteedde Defensie aan opleiding?", "€487.102.000. In vijf jaar.", "#Defensie #Opleiding #Militairen"),
    ("Hoeveel besteedde I&W aan het wagenpark?", "€611.531.000. In zeven jaar.", "#Rijkswaterstaat #Wagenpark #Infra"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "apparaat", q[:30], "2016-2024")

# ============================================================
# PROVINCIE (absolute euros)
# ============================================================
for text, fmt, ent in [
    ("Erfgoed Brabant ontving €19.753.845 van Noord-Brabant. In zes jaar. #NoordBrabant #Erfgoed #Cultuur #Provincies", "concentration", "Erfgoed Brabant"),
    ("Cultuur Oost ontving €28.812.856 van Gelderland. In negen jaar. #Gelderland #Cultuur #Provincies", "concentration", "Cultuur Oost"),
    ("Drents Museum ontving €35.827.811 van Drenthe. In tien jaar. #Drenthe #Museum #Cultuur #Provincies", "concentration", "Drents Museum"),
    ("Syntus ontving €33.461.149 van Utrecht. In één jaar. #Syntus #OV #Utrecht #OpenbaarVervoer", "concentration", "Syntus"),
    ("Marketingoost ontving €23.428.138 van Overijssel. In zes jaar. #Overijssel #Marketing #Toerisme #Provincies", "concentration", "Marketingoost"),
    ("Bonnefantenmuseum ontving €16.604.455 van Limburg. In drie jaar. #Bonnefanten #Maastricht #Kunst #Provincies", "concentration", "Bonnefanten"),
    ("Philharmonie Zuidnederland ontving €20.250.000 van Noord-Brabant. In vijf jaar. #Klassiek #NoordBrabant #Cultuur", "concentration", "Philharmonie Zuid"),
    ("Brabant Startup Fonds ontving €20.300.000 van Noord-Brabant. In drie jaar. #NoordBrabant #Startups #Innovatie", "concentration", "Brabant Startup"),
    ("Omroep Gelderland ontving €11.163.918 van Gelderland. In zes jaar. #Gelderland #Omroep #Media #Provincies", "concentration", "Omroep Gelderland"),
    ("Gemeente Zaanstad ontving €31.429.152 van Noord-Holland. In acht jaar. #Zaanstad #NoordHolland #Provincies", "concentration", "Zaanstad prov"),
    ("Gemeente Deventer ontving €20.903.763 van Overijssel. In zeven jaar. #Deventer #Overijssel #Provincies", "concentration", "Deventer prov"),
    ("Gemeente Dordrecht ontving €18.787.526 van Zuid-Holland. In zeven jaar. #Dordrecht #ZuidHolland #Provincies", "concentration", "Dordrecht prov"),
    ("Agrarische Natuur Drenthe ontving €34.064.676 van Drenthe. In zes jaar. #Drenthe #Landbouw #Natuur #Provincies", "concentration", "Agr Natuur Drenthe"),
    ("De Hoge Veluwe ontving €9.645.996 van Gelderland. In vijf jaar. #HogeVeluwe #Gelderland #Natuur #Provincies", "concentration", "Hoge Veluwe"),
    ("LIOF ontving €13.621.190 van Limburg. In vier jaar. #LIOF #Limburg #Economie #Provincies", "concentration", "LIOF"),
    ("Limburgs Museum ontving €8.339.549 van Limburg. In drie jaar. #Limburg #Museum #Cultuur #Provincies", "concentration", "Limburgs Museum"),
    ("Gemeente Emmen ontving €46.473.925 van Drenthe. In tien jaar. #Emmen #Drenthe #Provincies #Gemeenten", "concentration", "Emmen prov"),
    ("World Food Center ontving €17.000.000 van Gelderland. In één jaar. #Ede #Gelderland #Voeding #Provincies", "scale_shock", "World Food Center"),
    ("HZ University ontving €12.000.000 van Zeeland. In één jaar. #HZ #Zeeland #HBO #Provincies", "scale_shock", "HZ Zeeland"),
    ("UCR ontving €12.269.581 van Zeeland. In drie jaar. #UCR #Zeeland #Onderwijs #Provincies", "scale_shock", "UCR Zeeland"),
    ("Waterschapsbank ontving €75.000.000 van Noord-Brabant. In één jaar. #Waterschapsbank #NoordBrabant #Provincies", "scale_shock", "Waterschapsbank"),
    # NEW from DB mining
    ("Het Noordbrabants Landschap ontving €160.301.815 van Noord-Brabant. In negen jaar. #NoordBrabant #Natuur #Provincies", "scale_shock", "Noordbrabants Landschap"),
    ("Enexis ontving €159.490.380 van Noord-Brabant. In één jaar. #Enexis #Energie #NoordBrabant #Provincies", "scale_shock", "Enexis NB"),
    ("Qbuzz ontving €142.123.321 van Zuid-Holland. In twee jaar. #Qbuzz #OV #ZuidHolland #Provincies", "scale_shock", "Qbuzz ZH"),
    ("Arriva ontving €128.614.520 van Zuid-Holland. In drie jaar. #Arriva #OV #ZuidHolland #Provincies", "scale_shock", "Arriva ZH"),
    ("Staatsbosbeheer ontving €91.793.628 van Gelderland. In tien jaar. #Staatsbosbeheer #Natuur #Gelderland", "scale_shock", "SBB Gelderland"),
    ("Staatsbosbeheer ontving €52.452.585 van Friesland. In drie jaar. #Staatsbosbeheer #Natuur #Friesland", "scale_shock", "SBB Friesland"),
    ("N.V. Gasunie ontving €81.000.000 van Zuid-Holland. In één jaar. #Gasunie #Energie #ZuidHolland #Provincies", "scale_shock", "Gasunie ZH"),
    ("Boerennatuur Veluwe ontving €55.271.186 van Gelderland. In vier jaar. #Veluwe #Landbouw #Gelderland #Provincies", "scale_shock", "Boerennatuur Veluwe"),
    ("Rijnbrink ontving €55.097.853 van Gelderland. In acht jaar. #Gelderland #Bibliotheken #Cultuur #Provincies", "concentration", "Rijnbrink"),
    ("OOST NL ontving €48.351.762 van Gelderland. In tien jaar. #Gelderland #Economie #Innovatie #Provincies", "concentration", "OOST NL"),
    ("Het Zeeuwse Landschap ontving €45.676.825 van Zeeland. In negen jaar. #Zeeland #Natuur #Provincies", "concentration", "Zeeuwse Landschap"),
    ("Gemeente 's-Hertogenbosch ontving €50.867.178 van Noord-Brabant. In zes jaar. #DenBosch #NoordBrabant #Provincies", "concentration", "Den Bosch prov"),
    ("Natuurmonumenten ontving €50.941.266 van Limburg. In vijf jaar. #Natuurmonumenten #Limburg #Natuur #Provincies", "concentration", "Natmon Limburg"),
    ("Landschap Noord-Holland ontving €38.537.510 van Noord-Holland. In negen jaar. #NoordHolland #Natuur #Provincies", "concentration", "Landschap NH"),
    ("Het Zuid-Hollands Landschap ontving €33.915.956 van Zuid-Holland. In vijf jaar. #ZuidHolland #Natuur #Provincies", "concentration", "ZH Landschap"),
    ("Invest-NL ontving €30.000.000 van Noord-Brabant. In één jaar. #InvestNL #NoordBrabant #Innovatie #Provincies", "scale_shock", "InvestNL NB"),
    ("Brabant Sport ontving €15.252.924 van Noord-Brabant. In vijf jaar. #NoordBrabant #Sport #Provincies", "concentration", "Brabant Sport"),
    ("Economische Impuls Zeeland ontving €21.652.240 van Zeeland. In negen jaar. #Zeeland #Economie #Provincies", "concentration", "Impuls Zeeland"),
    ("Universiteit Twente ontving €13.552.307 van Overijssel. In zes jaar. #UTwente #Overijssel #Onderwijs #Provincies", "concentration", "UTwente prov"),
    ("Wageningen University ontving €11.708.632 van Gelderland. In vier jaar. #Wageningen #Gelderland #Onderwijs #Provincies", "concentration", "WUR prov"),
    ("OV-Bureau Groningen Drenthe ontving €21.534.870 van Drenthe. In één jaar. #OV #Drenthe #OpenbaarVervoer", "scale_shock", "OVbureau Drenthe"),
    ("Waterschap Rijn en IJssel ontving €25.300.640 van Gelderland. In zeven jaar. #Waterschap #Gelderland #Provincies", "concentration", "Waterschap RenIJ"),
    ("Spectrum ontving €20.743.707 van Gelderland. In drie jaar. #Spectrum #Gelderland #Sociaal #Provincies", "concentration", "Spectrum GLD"),
    # Comparison
    ("Staatsbosbeheer: €91,8 miljoen van Gelderland, €52,5 miljoen van Friesland. #Staatsbosbeheer #Natuur #Provincies", "comparison", "SBB GLD vs FRL"),
    ("Natuurmonumenten: €50,9 miljoen van Limburg, €10,7 miljoen van Zeeland. #Natuurmonumenten #Natuur #Provincies", "comparison", "Natmon LIM vs ZLD"),
    ("Qbuzz: €142 miljoen van Zuid-Holland. Arriva: €129 miljoen van Zuid-Holland. #OV #ZuidHolland #Provincies", "comparison", "Qbuzz vs Arriva"),
]:
    add(P, text, fmt, "provincie", ent, "2018-2024")

for q, a, tags in [
    ("Hoeveel ontving het Drents Museum van de provincie?", "€35.827.811. In tien jaar.", "#Drenthe #Museum #Cultuur"),
    ("Hoeveel ontving het Bonnefantenmuseum van Limburg?", "€16.604.455. In drie jaar.", "#Bonnefanten #Maastricht #Kunst"),
    ("Hoeveel ontving Staatsbosbeheer van Gelderland?", "€91.793.628. In tien jaar.", "#Staatsbosbeheer #Natuur #Gelderland"),
    ("Hoeveel ontving het Zeeuwse Landschap van Zeeland?", "€45.676.825. In negen jaar.", "#Zeeland #Natuur #Provincies"),
    ("Hoeveel ontving OOST NL van Gelderland?", "€48.351.762. In tien jaar.", "#Gelderland #Economie #Provincies"),
    ("Hoeveel ontving Gemeente Emmen van Drenthe?", "€46.473.925. In tien jaar.", "#Emmen #Drenthe #Provincies"),
    ("Hoeveel ontving Rijnbrink van Gelderland?", "€55.097.853. In acht jaar.", "#Gelderland #Bibliotheken #Cultuur"),
    ("Hoeveel ontving het Noordbrabants Landschap?", "€160.301.815. In negen jaar.", "#NoordBrabant #Natuur #Provincies"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "provincie", q[:30], "2018-2024")

# ============================================================
# PUBLIEK — staffel brackets (pre-written)
# ============================================================
for text, fmt, ent in [
    ("Wageningen Universiteit had 123 contracten bij publieke organisaties. In negen jaar. #Wageningen #Onderzoek #Overheidsuitgaven", "concentration", "Wageningen publiek"),
    ("TU Eindhoven had 156 contracten bij publieke organisaties. In tien jaar. #TUe #Eindhoven #Techniek", "concentration", "TUe publiek"),
    ("Radboud UMC had 45 contracten bij publieke organisaties. In acht jaar. #Radboud #Nijmegen #Zorg", "concentration", "Radboud publiek"),
    ("Mondial Movers had 20 contracten bij publieke organisaties. In zeven jaar. Verhuizingen. #Verhuizingen #COA #Overheidsuitgaven", "category_reveal", "Mondial Movers"),
    ("Deloitte had zeven jaar contracten bij publieke organisaties. Categorie: accountancy. #Deloitte #Accountancy #Overheid", "category_reveal", "Deloitte publiek"),
    ("Jumbo Noordman had 24 contracten bij publieke organisaties. In zes jaar. Levensmiddelen. #Jumbo #COA #Voeding", "category_reveal", "Jumbo publiek"),
    ("IVM had 26 contracten bij publieke organisaties. In zeven jaar. Ongediertebestrijding. #IVM #COA #Opvang", "category_reveal", "IVM publiek"),
    ("Munckhof Taxi had 31 contracten bij publieke organisaties. In zeven jaar. #Taxi #COA #Vervoer", "concentration", "Munckhof publiek"),
    # NEW from DB mining
    ("RMA Healthcare had 30 contracten bij publieke organisaties. Waarvan contracten boven €100 miljoen. #RMA #Zorg #COA", "scale_shock", "RMA Healthcare2"),
    ("Le Cocq Holding had 30 contracten bij publieke organisaties. In twee jaar. Waarvan boven €100 miljoen. #LeCocq #Vastgoed #COA", "scale_shock", "Le Cocq2"),
    ("Trigion Beveiliging had 25 contracten bij publieke organisaties. Waarvan boven €100 miljoen. #Trigion #Beveiliging #COA", "scale_shock", "Trigion2"),
    ("Start People had 49 contracten bij publieke organisaties. In zeven jaar. Het meest van alle uitzendbureaus. #StartPeople #Uitzenden #COA", "concentration", "Start People2"),
    ("Strukton WorkSphere had 43 contracten bij publieke organisaties. In zeven jaar. #Strukton #Onderhoud #Overheid", "concentration", "Strukton2"),
    ("Rijksvastgoedbedrijf had 38 contracten bij publieke organisaties. In zeven jaar. #Rijksvastgoed #Vastgoed #Overheid", "concentration", "RVB publiek2"),
    ("Jan Snel Livings had 76 contracten bij publieke organisaties. In zeven jaar. Het meest van alle bouwbedrijven. #JanSnel #Bouw #COA", "scale_shock", "Jan Snel2"),
    ("Bouwbedrijf Huurman had 52 contracten bij publieke organisaties. In zeven jaar. #Huurman #Bouw #COA #Overheidsuitgaven", "concentration", "Huurman publiek"),
    ("BAM Bouw en Techniek had 50 contracten bij publieke organisaties. In zeven jaar. #BAM #Bouw #COA", "concentration", "BAM publiek"),
    ("Hegeman VNO Bouw had 32 contracten bij publieke organisaties. In zeven jaar. #Hegeman #Bouw #COA", "concentration", "Hegeman publiek"),
    ("De Meeuw Verhuur had 25 contracten bij publieke organisaties. In vijf jaar. Tijdelijke huisvesting. #DeMeeuw #Huisvesting #COA", "category_reveal", "De Meeuw publiek"),
    ("Strijbosch had 71 contracten bij publieke organisaties. In zes jaar. #Strijbosch #Schoonmaak #COA #Overheidsuitgaven", "concentration", "Strijbosch publiek"),
    ("Facilicom had 40 contracten bij publieke organisaties. In zes jaar. #Facilicom #Schoonmaak #Overheid", "concentration", "Facilicom publiek"),
    ("Protinus IT had 38 contracten bij publieke organisaties. In zeven jaar. #ProtinusIT #ICT #Overheid", "concentration", "Protinus publiek"),
    ("Asito had 21 contracten bij publieke organisaties. In zes jaar. Schoonmaak. #Asito #Schoonmaak #COA", "category_reveal", "Asito publiek"),
    ("Duinrell had 22 contracten bij publieke organisaties. In zeven jaar. Opvanglocatie. #Duinrell #COA #Opvang", "category_reveal", "Duinrell publiek"),
    ("Slaapschepen had in totaal 107 contracten bij publieke organisaties. In drie jaar. #Slaapschepen #COA #Opvang", "scale_shock", "Slaapschepen2"),
    ("Umami Catering had 17 contracten bij publieke organisaties. In zeven jaar. #Umami #Catering #COA #Overheidsuitgaven", "category_reveal", "Umami2"),
    ("ENECO Zakelijk had 15 contracten bij publieke organisaties. In vijf jaar. Energie. #Eneco #Energie #COA", "category_reveal", "Eneco publiek"),
    ("Pels Rijcken had 14 contracten bij publieke organisaties. In zeven jaar. Landsadvocaat. #PelsRijcken #Juridisch #Overheid", "concentration", "Pels Rijcken pub"),
    ("CSU had 12 contracten bij publieke organisaties. In vier jaar. Schoonmaak. #CSU #Schoonmaak #COA", "category_reveal", "CSU publiek"),
    ("Gom Schoonhouden had 17 contracten bij publieke organisaties. In zes jaar. #Gom #Schoonmaak #COA", "category_reveal", "Gom publiek"),
    ("Yacht had 9 contracten bij publieke organisaties. In vijf jaar. Waarvan boven €250.000. #Yacht #Detachering #Overheid", "category_reveal", "Yacht publiek"),
    ("EY Advisory had 11 contracten bij publieke organisaties. In zes jaar. Advies. #EY #Advies #Overheid", "category_reveal", "EY publiek"),
    ("Meetingselect had 22 contracten bij publieke organisaties. In vier jaar. Vergaderlocaties. #Meetingselect #Vergaderen #Overheid", "category_reveal", "Meetingselect pub"),
    ("Inofec had 22 contracten bij publieke organisaties. In vijf jaar. Kantoormeubilair. #Inofec #Kantoor #COA", "category_reveal", "Inofec publiek"),
    ("Stichting Via Jeugd had 34 contracten bij publieke organisaties. In vier jaar. #ViaJeugd #Jeugdzorg #COA", "concentration", "Via Jeugd publiek"),
    ("Nederlandse Spoorwegen had 13 contracten bij publieke organisaties. In zeven jaar. #NS #Vervoer #Overheid", "concentration", "NS publiek"),
]:
    add(P, text, fmt, "publiek", ent, "2018-2024", "yes")

for q, a, tags in [
    ("Hoeveel contracten had TU Eindhoven bij publieke organisaties?", "156. In tien jaar.", "#TUe #Eindhoven #Onderzoek"),
    ("Hoeveel contracten had Wageningen bij publieke organisaties?", "123. In negen jaar.", "#Wageningen #Onderzoek #COA"),
    ("Hoeveel contracten had Jan Snel Livings?", "76 bij publieke organisaties. In zeven jaar.", "#JanSnel #Bouw #COA"),
    ("Hoeveel contracten had Strijbosch bij publieke organisaties?", "71. In zes jaar. Schoonmaak.", "#Strijbosch #Schoonmaak #COA"),
    ("Hoeveel contracten had Start People bij publieke organisaties?", "49. In zeven jaar. Uitzendwerk.", "#StartPeople #Uitzenden #COA"),
    ("Hoeveel contracten had BAM Bouw bij publieke organisaties?", "50. In zeven jaar.", "#BAM #Bouw #COA"),
    ("Hoeveel contracten had Slaapschepen bij publieke organisaties?", "107. In drie jaar.", "#Slaapschepen #COA #Opvang"),
    ("Hoeveel contracten had Duinrell bij publieke organisaties?", "22. In zeven jaar. Opvanglocatie.", "#Duinrell #COA #Opvang"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "publiek", q[:30], "2018-2024")

# ============================================================
# EXTRA POSTS — fill to 610+ total
# ============================================================

# More instrumenten scale_shock
for name, val, yr, ctx, tags in [
    ("Gemeente Papendrecht", 63068, "2024", "via financiële instrumenten", "#Papendrecht #Gemeenten #Rijksbegroting"),
    ("Gemeente Utrechtse Heuvelrug", 87755, "2024", "via financiële instrumenten", "#UtrechtseHeuvelrug #Gemeenten #Rijksbegroting"),
    ("Gemeente Berg en Dal", 68232, "2024", "via financiële instrumenten", "#BergenDal #Gemeenten #Rijksbegroting"),
    ("Gemeente Borger-Odoorn", 54524, "2024", "via financiële instrumenten", "#BorgerOdoorn #Drenthe #Rijksbegroting"),
    ("NVWA", 155657, "2024", "via financiële instrumenten", "#NVWA #Voedselveiligheid #Overheidsuitgaven"),
    ("Gemeente Houten", 82827, "2024", "via financiële instrumenten", "#Houten #Utrecht #Rijksbegroting"),
    ("Gemeente Meppel", 79462, "2024", "via financiële instrumenten", "#Meppel #Drenthe #Rijksbegroting"),
    ("Gemeente Wageningen", 78893, "2024", "via financiële instrumenten", "#Wageningen #Gelderland #Rijksbegroting"),
    ("Gemeente Castricum", 57040, "2024", "via financiële instrumenten", "#Castricum #NoordHolland #Rijksbegroting"),
    ("Gemeente Lochem", 62794, "2024", "via financiële instrumenten", "#Lochem #Achterhoek #Rijksbegroting"),
    ("Gemeente Zevenaar", 92001, "2024", "via financiële instrumenten", "#Zevenaar #Gelderland #Rijksbegroting"),
    ("Gemeente Venray", 93709, "2024", "via financiële instrumenten", "#Venray #Limburg #Rijksbegroting"),
    ("Gemeente Krimpen a/d IJssel", 58725, "2024", "via financiële instrumenten", "#Krimpen #ZuidHolland #Rijksbegroting"),
    ("Gemeente Gilze en Rijen", 49103, "2024", "via financiële instrumenten", "#GilzeEnRijen #NoordBrabant #Rijksbegroting"),
    ("Gemeente Zwartewaterland", 42393, "2024", "via financiële instrumenten", "#Zwartewaterland #Overijssel #Rijksbegroting"),
    ("Gavi Alliance", 52480, "2019", "van Nederland. In drie jaar: €172.053.000", "#Gavi #Vaccinatie #Ontwikkelingshulp"),
    ("IFAD", 67500, "2024", "van Nederland. In drie jaar: €136.750.000", "#IFAD #VN #Landbouw #Ontwikkelingshulp"),
    ("Stichting Consent", 54007, "2024", "via financiële instrumenten. In negen jaar: €386.105.000", "#Consent #Onderwijs #Enschede"),
    ("Stichting VierTaal", 50460, "2024", "via financiële instrumenten. In negen jaar: €327.713.000", "#VierTaal #Onderwijs #Speciaal"),
    ("Stichting Catent", 42474, "2024", "via financiële instrumenten. In negen jaar: €278.904.000", "#Catent #Onderwijs #Overijssel"),
    ("Lowys Porquinstichting", 47008, "2024", "via financiële instrumenten. In acht jaar: €301.587.000", "#Lowys #Onderwijs #Zeeland"),
]:
    amt = fmt_eur(val * 1000)
    text = f"{name} ontving {amt} in {yr} {ctx}. {tags}"
    add(P, text, "scale_shock", "instrumenten", name + " extra", yr)

# More instrumenten YoY
for name, y1, v1, y2, v2, tags in [
    ("Gemeente Kerkrade", 2023, 19140, 2024, 120762, "#Kerkrade #Limburg #Rijksbegroting"),
    ("Gemeente Leidschendam", 2022, 25126, 2023, 146923, "#Leidschendam #Gemeenten #Rijksbegroting"),
    ("De Vervoerregio Amsterdam", 2021, 168087, 2022, 27038, "#Vervoerregio #Amsterdam #OV"),
    ("Gemeente Apeldoorn", 2022, 49199, 2023, 349325, "#Apeldoorn #Gemeenten #Rijksbegroting"),
    ("RVO", 2021, 281255, 2022, 33664, "#RVO #Subsidies #Overheidsuitgaven"),
    ("Gemeente De Fryske Marren", 2022, 87728, 2023, 10445, "#FryskeMarren #Friesland #Rijksbegroting"),
    ("Wereldbank", 2019, 15900, 2020, 90000, "#Wereldbank #Ontwikkelingshulp #VN"),
    ("Gemeente Tilburg", 2021, 10196, 2022, 57921, "#Tilburg #Gemeenten #Rijksbegroting"),
]:
    a1, a2 = fmt_eur(v1*1000), fmt_eur(v2*1000)
    text = f"{name}: {a1} in {y1}, {a2} in {y2}. Via financiële instrumenten. {tags}"
    add(P, text, "scale_shock", "instrumenten", f"{name} YoY2 {y1}", f"{y1}-{y2}")

# More instrumenten comparison
for n1, v1, n2, v2, per, tags in [
    ("Gemeente Berkelland", 396451, "Gemeente Lochem", 296072, "acht jaar", "#Berkelland #Lochem #Achterhoek"),
    ("Gemeente Nieuwegein", 603386, "Gemeente Houten", 370042, "acht jaar", "#Nieuwegein #Houten #Utrecht"),
    ("Gemeente Den Helder", 731389, "Gemeente Vlissingen", 858663, "acht jaar", "#DenHelder #Vlissingen #Marine"),
    ("Gemeente Terneuzen", 622819, "Gemeente Weert", 525288, "acht jaar", "#Terneuzen #Weert #Gemeenten"),
    ("WFP", 527226, "IFAD", 136750, "acht jaar", "#WFP #IFAD #VN #Ontwikkelingshulp"),
    ("Lowys Porquin", 301587, "Stichting Catent", 278904, "negen jaar", "#Lowys #Catent #Onderwijs"),
]:
    a1, a2 = fmt_eur(v1*1000), fmt_eur(v2*1000)
    text = f"{n1}: {a1}. {n2}: {a2}. In {per} financiële instrumenten. {tags}"
    add(P, text, "comparison", "instrumenten", f"{n1} vs {n2} extra", "2016-2024")

# More instrumenten curiosity
for q, a, tags in [
    ("Hoeveel ontving Gemeente Zaanstad in acht jaar?", "€1.892.464.000 via financiële instrumenten.", "#Zaanstad #Gemeenten #Rijksbegroting"),
    ("Hoeveel ontving Gemeente Zoetermeer in acht jaar?", "€1.277.513.000 via financiële instrumenten.", "#Zoetermeer #Gemeenten #Rijksbegroting"),
    ("Hoeveel ontving Gavi Alliance van Nederland?", "€172.053.000. In drie jaar. Vaccinatieprogramma's.", "#Gavi #Vaccinatie #Ontwikkelingshulp"),
    ("Hoeveel ontving het CJIB in 2024?", "€192.591.000 via financiële instrumenten.", "#CJIB #Justitie #Overheidsuitgaven"),
    ("Hoeveel ontving Gemeente Heerlen in acht jaar?", "€1.612.428.000 via financiële instrumenten.", "#Heerlen #Limburg #Rijksbegroting"),
    ("Hoeveel ontving Gemeente Deventer in zeven jaar?", "€1.275.044.000 via financiële instrumenten.", "#Deventer #Overijssel #Rijksbegroting"),
    ("Hoeveel ontving Stichting VU in 2024?", "€585.857.000 via financiële instrumenten.", "#VU #Amsterdam #Universiteit"),
    ("Hoeveel ontving DMO van Defensie?", "€391.661.000. In twee jaar instrumenten.", "#DMO #Defensie #Materieel"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "instrumenten", q[:30] + " extra", "2016-2024")

# More gemeente concentration
for name, city, total, yrs, tags in [
    ("GGZ inGeest", "Amsterdam", 10853901, 11, "#Amsterdam #GGZ #Zorg"),
    ("Vrouwenopvang Safegroup", "Breda", 22191961, 6, "#Breda #Vrouwenopvang #Sociaal"),
    ("Jongerencultuurfonds", "Amsterdam", 8893402, 7, "#Amsterdam #Jongeren #Cultuur"),
    ("De Balie", "Amsterdam", 7322037, 8, "#Amsterdam #DeBalie #Cultuur"),
    ("Concertgebouw NV", "Amsterdam", 12078843, 8, "#Amsterdam #Concertgebouw #Cultuur"),
    ("Indigo BV", "Den Haag", 19717679, 8, "#DenHaag #GGZ #Zorg"),
    ("Haags Pop Centrum", "Den Haag", 5200079, 8, "#DenHaag #Muziek #Cultuur"),
    ("Chr. Onderwijs Haaglanden", "Den Haag", 30625893, 8, "#DenHaag #Onderwijs #Gemeentefonds"),
    ("Stichting U Centraal", "Utrecht", 14238442, 3, "#Utrecht #Welzijn #Sociaal"),
    ("Stichting HCO", "Den Haag", 15904434, 4, "#DenHaag #Welzijn #Sociaal"),
    ("GGD Hart voor Brabant", "Tilburg", 16329436, 3, "#Tilburg #GGD #Gezondheid"),
    ("Contour deTwern", "Tilburg", 18832291, 1, "#Tilburg #Welzijn #Sociaal"),
    ("Kompassie", "Den Haag", 5339129, 8, "#DenHaag #Welzijn #Sociaal"),
    ("Aslan Muziekcentrum", "Amsterdam", 11251117, 9, "#Amsterdam #Muziek #Cultuur"),
    ("DAK kindercentra", "Den Haag", 8672604, 8, "#DenHaag #Kinderopvang #Onderwijs"),
    ("Kinderopvang 2samen", "Den Haag", 5173297, 7, "#DenHaag #Kinderopvang #Onderwijs"),
    ("Woningstichting Eigen Haard", "Amsterdam", 9713185, 7, "#Amsterdam #Wonen #Sociaal"),
    ("Theater De Lieve Vrouw", "Amersfoort", 7252093, 7, "#Amersfoort #Theater #Cultuur"),
    ("Prot. Chr. Peuterspeelzalen", "Den Haag", 15739371, 7, "#DenHaag #Kinderopvang #Onderwijs"),
    ("Samen Veilig Midden-NL", "Utrecht", 26863354, 2, "#Utrecht #VeiligThuis #Zorg"),
    ("Breda Actief (MOOIWERK)", "Breda", 17403631, 8, "#Breda #Welzijn #Sociaal"),
    ("Kober BV", "Breda", 19998741, 8, "#Breda #Kinderopvang #Onderwijs"),
    ("Primair Onderwijs Zuidoost", "Amsterdam", 18974662, 11, "#Amsterdam #Onderwijs #Bijlmer"),
    ("Stichting The Mall Amsterdam", "Amsterdam", 12291745, 11, "#Amsterdam #Welzijn #Sociaal"),
    ("Mantelzorg Breda", "Breda", 10758127, 8, "#Breda #Mantelzorg #Sociaal"),
]:
    amt = fmt_eur(total)
    yr_str = f"In {_dy(yrs)}." if yrs else ""
    text = f"{name} ontving {amt} van de gemeente {city}. {yr_str} {tags}"
    add(P, text, "concentration", "gemeente", name + " extra", "2018-2024")

# More gemeente comparison
for n1, v1, n2, v2, tags in [
    ("Indigo Den Haag", 19717679, "GGZ inGeest Amsterdam", 10853901, "#DenHaag #Amsterdam #GGZ"),
    ("Kober Breda", 19998741, "DAK Den Haag", 8672604, "#Breda #DenHaag #Kinderopvang"),
    ("HCO Den Haag", 15904434, "U Centraal Utrecht", 14238442, "#DenHaag #Utrecht #Welzijn"),
    ("Samen Veilig Utrecht", 26863354, "Samen Veilig Almere", 21617006, "#Utrecht #Almere #VeiligThuis"),
    ("Vrouwenopvang Safegroup", 22191961, "Hulp Prostitutie DH", 22760913, "#Breda #DenHaag #Opvang"),
]:
    a1, a2 = fmt_eur(v1), fmt_eur(v2)
    text = f"{n1}: {a1}. {n2}: {a2}. Gemeente-uitkeringen. {tags}"
    add(P, text, "comparison", "gemeente", f"{n1} vs {n2} extra", "2018-2024")

# More gemeente curiosity
for q, a, tags in [
    ("Hoeveel ontving het Concertgebouw van Amsterdam?", "€12.078.843. In acht jaar.", "#Amsterdam #Concertgebouw #Cultuur"),
    ("Hoeveel ontving ContourdeTwern van Tilburg?", "€72.982.342. In drie jaar.", "#Tilburg #Welzijn #Sociaal"),
    ("Hoeveel ontving Stichting Doras van Amsterdam?", "€72.074.305. In twaalf jaar.", "#Amsterdam #Ouderenzorg #Sociaal"),
    ("Hoeveel ontving De Balie van Amsterdam?", "€7.322.037. In acht jaar.", "#Amsterdam #DeBalie #Cultuur"),
    ("Hoeveel ontving Chr. Onderwijs Haaglanden?", "€30.625.893 van Den Haag. In acht jaar.", "#DenHaag #Onderwijs #Gemeentefonds"),
    ("Hoeveel ontving De Toneelschuur van Haarlem?", "€15.003.408. In zes jaar.", "#Haarlem #Theater #Cultuur"),
    ("Hoeveel ontving het Patronaat van Haarlem?", "€11.001.759. In zes jaar.", "#Haarlem #Muziek #Cultuur"),
    ("Hoeveel ontving Primair Onderwijs Zuidoost?", "€18.974.662 van Amsterdam. In elf jaar.", "#Amsterdam #Onderwijs #Bijlmer"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "gemeente", q[:30] + " extra", "2018-2024")

# More inkoop
for text, fmt, ent in [
    ("Atos had een contract tussen €1 en €2,5 miljoen bij I&W. Categorie: software. #Atos #ICT #Infra #Inkoop", "category_reveal", "Atos IenW"),
    ("CRAYON had een contract tussen €1 en €2,5 miljoen bij Justitie. Software-onderhoud. #Crayon #ICT #Justitie #Inkoop", "category_reveal", "Crayon JenV"),
    ("Tele2 had een contract tussen €1 en €2,5 miljoen bij Justitie. Spraak en data. #Tele2 #Telecom #Justitie #Inkoop", "category_reveal", "Tele2 JenV"),
    ("CED Nederland had een contract tussen €1 en €2,5 miljoen bij EZK. Beleidsadvies. #CED #Advies #EZK #Inkoop", "category_reveal", "CED EZK"),
    ("DEME Infra had een contract tussen €1 en €2,5 miljoen bij I&W. #DEME #Waterbouw #Infra #Inkoop", "category_reveal", "DEME IenW"),
    ("Dustin had een contract tussen €1 en €2,5 miljoen bij BZK. Software. #Dustin #ICT #BZK #Inkoop", "category_reveal", "Dustin BZK"),
    ("SLTN IT had een contract tussen €1 en €2,5 miljoen bij Financiën. Hardware. #SLTN #ICT #Hardware #Inkoop", "category_reveal", "SLTN FIN"),
    ("Mobilis had een contract tussen €2,5 en €5 miljoen bij I&W. Infra. #Mobilis #Bouw #Infra #Inkoop", "category_reveal", "Mobilis IenW"),
    ("Fluor Infrastructure had een contract tussen €2,5 en €5 miljoen bij I&W. #Fluor #Bouw #Infra #Inkoop", "category_reveal", "Fluor IenW"),
    ("Altrecht had een contract tussen €2,5 en €5 miljoen bij Justitie. Forensisch. #Altrecht #GGZ #Justitie #Inkoop", "category_reveal", "Altrecht JenV"),
    ("Alliance Healthcare had een contract tussen €2,5 en €5 miljoen bij Justitie. #Alliance #Farmacie #Justitie #Inkoop", "category_reveal", "Alliance JenV"),
    ("Get There ICT had een contract tussen €2,5 en €5 miljoen bij OCW. Software. #GetThere #ICT #OCW #Inkoop", "category_reveal", "GetThere OCW"),
    ("SoftwareONE had een contract tussen €5 en €10 miljoen bij EZK. ICT. #SoftwareONE #ICT #EZK #Inkoop", "scale_shock", "SoftwareONE EZK"),
    ("OpenIJ had een contract tussen €5 en €10 miljoen bij I&W. Sluisbouw. #OpenIJ #Sluizen #Infra #Inkoop", "scale_shock", "OpenIJ IenW"),
    ("ARCADIS had een contract tussen €5 en €10 miljoen bij I&W. Advies. #ARCADIS #Advies #Infra #Inkoop", "scale_shock", "ARCADIS IenW2"),
    ("Boskalis had een contract tussen €25 en €50 miljoen bij I&W. Waterbouw. #Boskalis #Waterbouw #Infra #Inkoop", "scale_shock", "Boskalis IenW2"),
    ("Hoeveel leveranciers had het Rijk voor beleidsadvies? 12.263. Met 22.600 contracten. #Beleidsadvies #Inkoop #Overheid", "curiosity", "Beleidsadvies"),
    ("Hoeveel leveranciers had het Rijk voor benodigdheden? 10.937. Met 21.596 contracten. #Benodigdheden #Inkoop #Overheid", "curiosity", "Benodigdheden cat"),
    ("Hoeveel leveranciers had het Rijk voor arbeidsomstandigheden? 5.927. Met 9.341 contracten. #Arbo #Inkoop #Overheid", "curiosity", "Arbo cat"),
    ("Hoeveel leveranciers had het Rijk voor vakliteratuur? 3.745. Met 9.014 contracten in acht jaar. #Vakliteratuur #Inkoop #Overheid", "curiosity", "Vakliteratuur cat"),
    ("Hoeveel leveranciers had het Rijk voor documentmanagement? 4.730. Met 7.679 contracten. #Documentbeheer #Inkoop #Overheid", "curiosity", "Documentbeheer cat"),
    ("Hoeveel leveranciers had het Rijk voor risicobeheersing? 2.802. Met 5.566 contracten. #Risico #Inkoop #Overheid", "curiosity", "Risico cat"),
]:
    add(P, text, fmt, "inkoop", ent, "2018-2024", "yes")

# More apparaat
for text, fmt, ent in [
    ("Financiën besteedde €2.857.011.000 aan sociale lasten in vijf jaar. #Financien #SocialeLasten #Belastingdienst", "scale_shock", "Financien sociaal"),
    ("Financiën besteedde €2.016.529.000 aan SSO-bijdragen in acht jaar. #Financien #SSO #SharedServices", "scale_shock", "Financien SSO"),
    ("I&W besteedde €1.097.231.000 aan pensioenpremies in zeven jaar. #Rijkswaterstaat #Pensioenen #Infra", "scale_shock", "IenW pensioenen"),
    ("I&W besteedde €969.808.000 aan SSO-bijdragen in zeven jaar. #Rijkswaterstaat #SSO #SharedServices", "scale_shock", "IenW SSO"),
    ("BZK besteedde €1.181.267.000 aan SSO-bijdragen in vijf jaar. #BZK #SSO #SharedServices #Rijksbegroting", "scale_shock", "BZK SSO"),
    ("Justitie besteedde €479.620.000 aan verwerving in zeven jaar. #Justitie #Verwerving #Apparaat", "category_reveal", "JenV verwerving"),
    ("Financiën besteedde €538.505.000 aan toelagen in acht jaar. #Financien #Toelagen #Ambtenaren #Apparaat", "category_reveal", "Financien toelagen"),
    ("Defensie besteedde €1.694.987.000 aan schoonmaak en nuts. In één jaar. #Defensie #Schoonmaak #Apparaat", "scale_shock", "Defensie schoonmaak2"),
    ("Defensie: €5,2 miljard pensioenen. I&W: €1,1 miljard pensioenpremies. #Defensie #Rijkswaterstaat #Pensioenen", "comparison", "DEF vs IenW pens"),
    ("BZK: €1,2 miljard SSO. I&W: €970 miljoen SSO. In vijf resp. zeven jaar. #SSO #SharedServices #Apparaat", "comparison", "BZK vs IenW SSO"),
    ("Financiën: €2,9 miljard sociale lasten. Defensie: €5,2 miljard pensioenen. #Financien #Defensie #Apparaat", "comparison", "FIN vs DEF lasten"),
]:
    add(P, text, fmt, "apparaat", ent, "2016-2024")

for q, a, tags in [
    ("Hoeveel besteedde Financiën aan SSO?", "€2.016.529.000. In acht jaar.", "#Financien #SSO #SharedServices"),
    ("Hoeveel besteedde I&W aan pensioenpremies?", "€1.097.231.000. In zeven jaar.", "#Rijkswaterstaat #Pensioenen"),
    ("Hoeveel besteedde BZK aan SSO-bijdragen?", "€1.181.267.000. In vijf jaar.", "#BZK #SSO #SharedServices"),
    ("Hoeveel besteedde Financiën aan toelagen?", "€538.505.000. In acht jaar.", "#Financien #Toelagen #Ambtenaren"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "apparaat", q[:30] + " extra", "2016-2024")

# More provincie
for text, fmt, ent in [
    ("Gemeente Hengelo ontving €19.834.830 van Overijssel. In zeven jaar. #Hengelo #Overijssel #Provincies", "concentration", "Hengelo prov"),
    ("Gemeente Borne ontving €10.743.674 van Overijssel. In zeven jaar. #Borne #Overijssel #Provincies", "concentration", "Borne prov"),
    ("Museum De Fundatie ontving €5.990.742 van Overijssel. In twee jaar. #DeFundatie #Overijssel #Kunst", "concentration", "Fundatie prov"),
    ("Museumplein Limburg ontving €6.961.460 van Limburg. In vier jaar. #MuseumpleinLimburg #Cultuur #Provincies", "concentration", "Museumplein LIM"),
    ("Gemeente Doetinchem ontving €17.492.250 van Gelderland. In tien jaar. #Doetinchem #Gelderland #Provincies", "concentration", "Doetinchem prov"),
    ("Gemeente Loon op Zand ontving €12.843.836 van Noord-Brabant. In vijf jaar. #LoonOpZand #NoordBrabant #Provincies", "concentration", "Loon op Zand"),
    ("Gemeente Meierijstad ontving €13.210.983 van Noord-Brabant. In acht jaar. #Meierijstad #NoordBrabant #Provincies", "concentration", "Meierijstad prov"),
    ("Gemeente Alphen a/d Rijn ontving €11.061.969 van Zuid-Holland. In zeven jaar. #AlphenAdRijn #ZuidHolland #Provincies", "concentration", "Alphen prov"),
    ("Gemeente Nunspeet ontving €10.676.878 van Gelderland. In tien jaar. #Nunspeet #Gelderland #Provincies", "concentration", "Nunspeet prov"),
    ("Gemeente Hoogeveen ontving €17.235.809 van Drenthe. In tien jaar. #Hoogeveen #Drenthe #Provincies", "concentration", "Hoogeveen prov"),
    ("Gemeente Den Helder ontving €11.341.800 van Noord-Holland. In negen jaar. #DenHelder #NoordHolland #Provincies", "concentration", "DenHelder prov"),
    ("Gemeente Hardenberg ontving €9.624.706 van Overijssel. In zeven jaar. #Hardenberg #Overijssel #Provincies", "concentration", "Hardenberg prov"),
    ("Drentse Landschap ontving €8.298.732 van Drenthe. In zeven jaar. #Drenthe #Natuur #Provincies", "concentration", "Drentse Landschap"),
    ("Landschapsbeheer Gelderland ontving €7.956.169 van Gelderland. In acht jaar. #Gelderland #Natuur #Provincies", "concentration", "Landschapsbeh GLD"),
    ("Vrienden der Geldersche Kasteelen ontving €11.478.738 van Gelderland. In negen jaar. #Gelderland #Erfgoed #Provincies", "concentration", "Kastelen GLD"),
    ("Landschap Noord-Holland: €38,5 miljoen. Zeeuwse Landschap: €45,7 miljoen. #Natuur #Provincies #Landschap", "comparison", "NH vs ZLD landschap"),
    ("Gemeente Emmen: €46,5 miljoen van Drenthe. Gemeente Hoogeveen: €17,2 miljoen. #Drenthe #Provincies #Gemeenten", "comparison", "Emmen vs Hoogeveen"),
    ("Gemeente Zaanstad: €31,4 miljoen. Gemeente Den Helder: €11,3 miljoen van Noord-Holland. #NoordHolland #Provincies", "comparison", "Zaanstad vs DenHelder"),
]:
    add(P, text, fmt, "provincie", ent, "2018-2024")

for q, a, tags in [
    ("Hoeveel ontving Gemeente Doetinchem van Gelderland?", "€17.492.250. In tien jaar.", "#Doetinchem #Gelderland #Provincies"),
    ("Hoeveel ontving Gemeente Hoogeveen van Drenthe?", "€17.235.809. In tien jaar.", "#Hoogeveen #Drenthe #Provincies"),
    ("Hoeveel ontving het Drentse Landschap?", "€8.298.732 van Drenthe. In zeven jaar.", "#Drenthe #Natuur #Provincies"),
    ("Hoeveel ontving Gemeente Hengelo van Overijssel?", "€19.834.830. In zeven jaar.", "#Hengelo #Overijssel #Provincies"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "provincie", q[:30] + " extra", "2018-2024")

# More publiek
for text, fmt, ent in [
    ("Gemeente Westerwolde had 24 contracten bij publieke organisaties. In zeven jaar. #Westerwolde #Groningen #Overheid", "concentration", "Westerwolde pub"),
    ("Gemeente Amersfoort had 11 contracten bij publieke organisaties. In zeven jaar. #Amersfoort #Gemeenten #Overheid", "concentration", "Amersfoort pub"),
    ("Gemeente Hengelo had 23 contracten bij publieke organisaties. In zeven jaar. #Hengelo #Overijssel #Overheid", "concentration", "Hengelo pub"),
    ("Gemeente Leeuwarden had 12 contracten bij publieke organisaties. In vier jaar. #Leeuwarden #Friesland #Overheid", "concentration", "Leeuwarden pub"),
    ("Van der Valk Volendam had contracten met staffel boven €500.000 bij publieke organisaties. #VanDerValk #Hotels #COA", "category_reveal", "VanDerValk pub"),
    ("Hotel Ara had contracten met staffel boven €1 miljoen bij publieke organisaties. #HotelAra #Hotels #COA #Opvang", "scale_shock", "Hotel Ara pub"),
    ("Eurohal Exploitatie had 12 contracten bij publieke organisaties. In drie jaar. #Eurohal #Evenementen #COA", "concentration", "Eurohal pub"),
    ("BMWSR had 17 contracten bij publieke organisaties. In drie jaar. #BMWSR #Onderhoud #COA #Overheidsuitgaven", "concentration", "BMWSR pub"),
    ("IT-Staffing had 23 contracten bij publieke organisaties. In vijf jaar. ICT-personeel. #ICT #Inhuur #COA", "concentration", "ITStaffing pub"),
    ("SoftwareONE had 17 contracten bij publieke organisaties. In vier jaar. ICT. #SoftwareONE #ICT #Overheid", "concentration", "SoftwareONE pub"),
    ("LenferinkgroepZwolle had 19 contracten bij publieke organisaties. In drie jaar. Bouw. #Lenferink #Bouw #COA", "concentration", "Lenferink pub"),
    ("Losberger De Boer had 14 contracten bij publieke organisaties. In drie jaar. Tijdelijke gebouwen. #Losberger #Bouw #COA", "category_reveal", "Losberger pub"),
    ("Star Lodge Hotels had 14 contracten bij publieke organisaties. In drie jaar. Opvang. #StarLodge #Hotels #COA #Opvang", "category_reveal", "Star Lodge pub"),
    ("Gr8 Hotels had 15 contracten bij publieke organisaties. In drie jaar. Opvang. #Hotels #COA #Opvang #Overheidsuitgaven", "category_reveal", "Gr8 Hotels pub"),
    ("BosruiterVastgoed had 18 contracten bij publieke organisaties. In twee jaar. #Bosruiter #Vastgoed #COA", "concentration", "Bosruiter pub"),
    ("Spie Nederland had 18 contracten bij publieke organisaties. In zes jaar. Installatie. #Spie #Installatie #Overheid", "concentration", "Spie pub"),
    ("North Sea Port had 9 contracten bij publieke organisaties. In drie jaar. Haven. #NorthSeaPort #Haven #Overheid", "concentration", "NSP pub"),
    ("Veiligheidsregio Rotterdam had 8 contracten bij publieke organisaties. Waarvan boven €5 miljoen. #Veiligheidsregio #Rotterdam", "scale_shock", "VR Rotterdam pub"),
    ("Pensioenfonds Zorg & Welzijn had 12 contracten bij publieke organisaties. In zeven jaar. #PFZW #Pensioenen #Overheid", "concentration", "PFZW pub"),
]:
    add(P, text, fmt, "publiek", ent, "2018-2024", "yes")

for q, a, tags in [
    ("Hoeveel contracten had Bouwbedrijf Huurman?", "52 bij publieke organisaties. In zeven jaar.", "#Huurman #Bouw #COA"),
    ("Hoeveel contracten had Facilicom bij publieke organisaties?", "40. In zes jaar. Schoonmaak.", "#Facilicom #Schoonmaak #Overheid"),
    ("Hoeveel contracten had Hegeman VNO Bouw?", "32 bij publieke organisaties. In zeven jaar.", "#Hegeman #Bouw #COA"),
    ("Hoeveel contracten had Strukton WorkSphere?", "43 bij publieke organisaties. In zeven jaar.", "#Strukton #Onderhoud #Overheid"),
    ("Hoeveel contracten had Protinus IT bij publieke organisaties?", "38. In zeven jaar.", "#ProtinusIT #ICT #Overheid"),
]:
    text = f"{q} {a} {tags}"
    add(P, text, "curiosity", "publiek", q[:30] + " extra", "2018-2024")

# ============================================================
# STATS + OUTPUT
# ============================================================
random.shuffle(P)

# Remove any that collide with existing registry entries
P = [p for p in P if (p[2], p[3]) not in existing]

print(f"Total posts after dedup: {len(P)}")
over = sum(1 for t,*_ in P if len(t) > 280)
print(f"Over 280 chars: {over}")
for t,*_ in P:
    if len(t) > 280:
        print(f"  OVER ({len(t)}): {t[:80]}...")

mod_dist = Counter(p[2] for p in P)
fmt_dist = Counter(p[1] for p in P)
print(f"Module: {dict(sorted(mod_dist.items()))}")
print(f"Format: {dict(sorted(fmt_dist.items()))}")

# Split into batches of 100 (last batch gets remainder)
BATCH_SIZE = 100
batches = []
for i in range(0, len(P), BATCH_SIZE):
    batches.append(P[i:i+BATCH_SIZE])

# Write batch CSVs
posts_dir = os.path.join(SOCIAL_DIR, "posts")
os.makedirs(posts_dir, exist_ok=True)

registry_rows = []
for bi, batch in enumerate(batches):
    batch_num = bi + 3  # batches 3, 4, 5, ...
    batch_name = f"batch-{batch_num:03d}"
    csv_path = os.path.join(posts_dir, f"{batch_name}.csv")

    with open(csv_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["text", "format", "module", "entity", "year", "staffel", "chars"])
        for text, fmt, mod, ent, year, staffel in batch:
            w.writerow([text, fmt, mod, ent, year, staffel, len(text)])
            registry_rows.append(f"{mod},{ent},{year},{fmt},{batch_name}")

    print(f"Wrote {csv_path} ({len(batch)} posts)")

# Append to registry
with open(reg_path, "a") as f:
    for row in registry_rows:
        f.write(row + "\n")

print(f"\nUpdated registry with {len(registry_rows)} new entries")
print(f"Total batches written: {len(batches)} (batch-003 through batch-{len(batches)+2:03d})")
