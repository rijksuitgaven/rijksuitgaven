#!/usr/bin/env python3
"""Generate social media posts from verified facts.

Reads facts/*.csv, applies templates per format, validates ≤280 chars,
outputs batch CSVs + registry. Every number traces to a fact_id.

Usage:
    python3 social/generate_posts.py
"""
import csv
import os
import random
from collections import Counter

random.seed(42)

SOCIAL_DIR = os.path.dirname(os.path.abspath(__file__))
FACTS_DIR = os.path.join(SOCIAL_DIR, "facts")
POSTS_DIR = os.path.join(SOCIAL_DIR, "posts")
os.makedirs(POSTS_DIR, exist_ok=True)

YEARS = list(range(2016, 2025))

# ============================================================
# BLOCKLIST — entities that are noise, not real recipients
# ============================================================
ENTITY_BLOCKLIST = {
    "", "Niet toegewezen", "GEMEENTEN", "AVG restrictie",
    "Diverse", "Overige", "Overig", "Diverse ontvangers",
    "Niet nader te specificeren", "(leeg)", "leeg", "Leeg",
    "Onbekend", "onbekend", "N.B.", "n.b.",
}

def is_blocked(entity):
    if not entity or entity.strip() in ENTITY_BLOCKLIST:
        return True
    e = entity.strip()
    if e.upper() == e and len(e) < 15:
        return True  # All-caps short names are often codes
    if e.startswith("(") and e.endswith(")"):
        return True  # Parenthetical placeholders like "(leeg)"
    if e.startswith("Anoniem") or e.startswith("anoniem"):
        return True  # Anonymized entities
    return False

def fix_entity(entity):
    """Fix common data quality issues in entity names."""
    import re
    e = entity.strip()
    # Collapse multiple spaces
    e = re.sub(r'\s+', ' ', e)
    # Capitalize "gemeente X" → "Gemeente X"
    if e.startswith("gemeente "):
        e = "Gemeente " + e[9:]
    if e.startswith("provincie "):
        e = "Provincie " + e[10:]
    if e.startswith("stichting "):
        e = "Stichting " + e[10:]
    return e


# ============================================================
# NUMBER FORMATTING — Dutch notation
# ============================================================
def fmt_eur(amount):
    """€13.100.000.000 — full Dutch notation with dots."""
    amount = int(round(float(amount)))
    if amount < 0:
        return f"-€{abs(amount):,.0f}".replace(",", ".")
    return f"€{amount:,.0f}".replace(",", ".")

def fmt_eur_short(amount):
    """€13,1 miljard or €207 miljoen — for framing context."""
    amount = int(round(float(amount)))
    a = abs(amount)
    if a >= 1_000_000_000:
        val = a / 1_000_000_000
        if val == int(val):
            s = f"€{int(val)} miljard"
        else:
            s = f"€{val:,.1f} miljard".replace(",", "X").replace(".", ",").replace("X", ".")
        return f"-{s}" if amount < 0 else s
    elif a >= 1_000_000:
        val = a / 1_000_000
        if val == int(val):
            s = f"€{int(val)} miljoen"
        else:
            s = f"€{val:,.1f} miljoen".replace(",", "X").replace(".", ",").replace("X", ".")
        return f"-{s}" if amount < 0 else s
    return fmt_eur(amount)

def _dy(n):
    """Dutch number words for years. Returns None for 0."""
    if n <= 0:
        return None
    w = {1:"één jaar",2:"twee jaar",3:"drie jaar",4:"vier jaar",5:"vijf jaar",
         6:"zes jaar",7:"zeven jaar",8:"acht jaar",9:"negen jaar",10:"tien jaar",
         11:"elf jaar",12:"twaalf jaar"}
    return w.get(n, f"{n} jaar")

def _dn(n):
    """Dutch number words for counts."""
    w = {1:"één",2:"twee",3:"drie",4:"vier",5:"vijf",6:"zes",7:"zeven",
         8:"acht",9:"negen",10:"tien",11:"elf",12:"twaalf",13:"dertien",
         14:"veertien",15:"vijftien",20:"twintig",25:"vijfentwintig"}
    return w.get(n, str(n))

def _contracts(n):
    """'één contract' (singular) vs 'twee contracten' (plural)."""
    if n == 1:
        return "één contract"
    return f"{_dn(n)} contracten"

def _inkoopcontracten(n):
    """'één inkoopcontract' vs 'N inkoopcontracten'."""
    if n == 1:
        return "één inkoopcontract"
    return f"{_dn(n)} inkoopcontracten"

def _in_period(ywd):
    """'In drie jaar.' or '' if years_with_data is 0/None."""
    dur = _dy(ywd)
    if not dur:
        return ""
    return f"In {dur}."


# ============================================================
# STAFFEL BRACKET DESCRIPTIONS
# ============================================================
STAFFEL_DESC = {
    0: "negatief tot €0",
    1: "tussen €1 en €10.000",
    2: "tussen €10.000 en €50.000",
    3: "tussen €50.000 en €100.000",
    4: "tussen €100.000 en €250.000",
    5: "tussen €250.000 en €500.000",
    6: "tussen €500.000 en €1 miljoen",
    7: "tussen €1 en €5 miljoen",
    8: "tussen €5 en €10 miljoen",
    9: "tussen €10 en €25 miljoen",
    10: "tussen €25 en €50 miljoen",
    11: "tussen €50 en €100 miljoen",
    12: "tussen €100 en €150 miljoen",
    13: "boven €150 miljoen",
}

STAFFEL_SHORT = {
    7: "boven €1 miljoen", 8: "boven €5 miljoen", 9: "boven €10 miljoen",
    10: "boven €25 miljoen", 11: "boven €50 miljoen", 12: "boven €100 miljoen",
    13: "boven €150 miljoen",
}


# ============================================================
# HASHTAG HELPERS
# ============================================================
MODULE_TAGS = {
    "instrumenten": ["#Overheidsuitgaven", "#Rijksbegroting"],
    "apparaat": ["#Overheidsuitgaven", "#Rijksbegroting"],
    "gemeente": ["#Gemeentefonds", "#Gemeenten"],
    "provincie": ["#Provincies", "#Overheidsuitgaven"],
    "inkoop": ["#Overheidsinkoop", "#Rijksinkoop"],
    "publiek": ["#Overheidsuitgaven"],
    "integraal": ["#Overheidsuitgaven", "#Rijksbegroting"],
}

ENTITY_TAG_MAP = {
    "Politie": "#Politie", "TenneT": "#TenneT", "ProRail": "#ProRail",
    "Defensie": "#Defensie", "COA": "#COA", "Amsterdam": "#Amsterdam",
    "Rotterdam": "#Rotterdam", "Den Haag": "#DenHaag", "Utrecht": "#Utrecht",
    "Groningen": "#Groningen", "Eindhoven": "#Eindhoven", "Tilburg": "#Tilburg",
    "Breda": "#Breda", "Arnhem": "#Arnhem", "Haarlem": "#Haarlem",
    "Noord-Brabant": "#NoordBrabant", "Gelderland": "#Gelderland",
    "Zuid-Holland": "#ZuidHolland", "Noord-Holland": "#NoordHolland",
    "Limburg": "#Limburg", "Overijssel": "#Overijssel",
    "Friesland": "#Friesland", "Zeeland": "#Zeeland",
    "Drenthe": "#Drenthe", "Flevoland": "#Flevoland",
    "Onderwijs": "#Onderwijs", "ICT": "#ICT", "Zorg": "#Zorg",
    "Energie": "#Energie", "Cultuur": "#Cultuur", "OV": "#OV",
    "Bibliotheek": "#Bibliotheken", "Museum": "#Cultuur",
    "Theater": "#Cultuur", "Sport": "#Sport",
    "Universiteit": "#Universiteit", "Hogeschool": "#HBO",
    "GGZ": "#GGZ", "Welzijn": "#Welzijn",
}

def make_tags(entity, module, extra=None):
    """Generate 3-5 relevant hashtags."""
    tags = list(MODULE_TAGS.get(module, ["#Overheidsuitgaven"]))
    # Match entity keywords
    for keyword, tag in ENTITY_TAG_MAP.items():
        if keyword.lower() in entity.lower() and tag not in tags:
            tags.append(tag)
            if len(tags) >= 5:
                break
    if extra:
        for t in extra:
            if t not in tags:
                tags.append(t)
                if len(tags) >= 5:
                    break
    # Ensure at least 3
    fallbacks = ["#Transparantie", "#OpenData", "#Overheidsuitgaven"]
    for fb in fallbacks:
        if len(tags) >= 3:
            break
        if fb not in tags:
            tags.append(fb)
    return " ".join(tags[:5])


# ============================================================
# FACT LOADERS
# ============================================================
def load_csv(filename):
    path = os.path.join(FACTS_DIR, filename)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ============================================================
# POST ACCUMULATOR
# ============================================================
posts = []  # (text, format, module, fact_ids, staffel)
used_facts = set()  # track fact_ids used to avoid double-use in same format


def add(text, fmt, module, fact_ids, staffel="no"):
    """Add post if ≤280 chars and not duplicate."""
    import re
    text = re.sub(r'\s+', ' ', text.strip())  # Collapse any double spaces
    text = text.replace(' .', '.').replace(' ,', ',')  # Fix orphan punctuation
    if len(text) > 280:
        return False
    if len(text) < 50:
        return False
    key = (tuple(sorted(fact_ids)), fmt)
    if key in used_facts:
        return False
    used_facts.add(key)
    posts.append((text, fmt, module, ";".join(fact_ids), staffel, len(text)))
    return True


# ============================================================
# FORMAT GENERATORS
# ============================================================

def gen_scale_shock():
    """Generate scale_shock posts from various fact sources."""
    count = 0

    # --- Instrumenten: top by total ---
    for f in load_csv("instrumenten_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        total = int(f["value"])
        ywd = int(f["years_with_data"])
        if total < 500_000_000:
            continue  # Only big numbers

        # Single best year
        best_year, best_val = None, 0
        for y in YEARS:
            val = int(f.get(f"y{y}", 0) or 0)
            if val > best_val:
                best_val = val
                best_year = y

        if best_val >= 1_000_000_000:
            tags = make_tags(entity, "instrumenten")
            text = f"{entity} ontving {fmt_eur(best_val)} in {best_year} via financiële instrumenten. {tags}"
            if add(text, "scale_shock", "instrumenten", [f["fact_id"]]):
                count += 1

        # Multi-year total
        if ywd >= 3 and total >= 1_000_000_000:
            tags = make_tags(entity, "instrumenten")
            text = f"{entity} ontving {fmt_eur(total)} via financiële instrumenten. {_in_period(ywd)} {tags}"
            if add(text, "scale_shock", "instrumenten", [f["fact_id"]]):
                count += 1

    # --- Instrumenten: YoY increases (filtered) ---
    for f in load_csv("instrumenten_yoy_increases.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        period = f["jump_period"]  # e.g. "2022-2023"
        if not period or "-" not in period:
            continue
        y1, y2 = period.split("-")
        v1 = int(f.get(f"y{y1}", 0) or 0)
        v2 = int(f.get(f"y{y2}", 0) or 0)
        # Filter: both amounts must be meaningful (>€10M)
        if v1 < 10_000_000 or v2 < 10_000_000:
            continue
        if v2 <= v1:
            continue
        tags = make_tags(entity, "instrumenten")
        text = f"{entity}: {fmt_eur(v1)} in {y1}, {fmt_eur(v2)} in {y2}. Via financiële instrumenten. {tags}"
        if add(text, "scale_shock", "instrumenten", [f["fact_id"]]):
            count += 1

    # --- Instrumenten: YoY decreases (filtered) ---
    for f in load_csv("instrumenten_yoy_decreases.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        period = f["drop_period"]
        if not period or "-" not in period:
            continue
        y1, y2 = period.split("-")
        v1 = int(f.get(f"y{y1}", 0) or 0)
        v2 = int(f.get(f"y{y2}", 0) or 0)
        if v1 < 10_000_000 or v2 < 10_000_000:
            continue
        if v1 <= v2:
            continue
        tags = make_tags(entity, "instrumenten")
        text = f"{entity}: {fmt_eur(v1)} in {y1}, daarna {fmt_eur(v2)} in {y2}. {tags}"
        if add(text, "scale_shock", "instrumenten", [f["fact_id"]]):
            count += 1

    # --- Gemeente: top recipients ---
    for f in load_csv("gemeente_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        total = int(f["value"])
        gemeente = f["gemeente"]
        ywd = int(f["years_with_data"])
        if total < 20_000_000:
            continue
        tags = make_tags(entity, "gemeente", [f"#{gemeente.replace(' ', '')}"] if gemeente else None)
        text = f"{entity} ontving {fmt_eur(total)} van de gemeente {gemeente}. {_in_period(ywd)} {tags}"
        if add(text, "scale_shock", "gemeente", [f["fact_id"]]):
            count += 1

    # --- Provincie: top recipients ---
    for f in load_csv("provincie_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        total = int(f["value"])
        prov = f["provincie"]
        ywd = int(f["years_with_data"])
        if total < 20_000_000:
            continue
        tags = make_tags(entity, "provincie", [f"#{prov.replace(' ', '').replace('-', '')}"] if prov else None)
        text = f"{entity} ontving {fmt_eur(total)} van de provincie {prov}. {_in_period(ywd)} {tags}"
        if add(text, "scale_shock", "provincie", [f["fact_id"]]):
            count += 1

    # --- Apparaat: top kostensoort ---
    for f in load_csv("apparaat_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        total = int(f["value"])
        if total < 500_000_000:
            continue
        tags = make_tags(entity, "apparaat")
        text = f"Het Rijk gaf {fmt_eur(total)} uit aan {entity.lower()}. Via apparaatsuitgaven. {tags}"
        if add(text, "scale_shock", "apparaat", [f["fact_id"]]):
            count += 1

    # --- Apparaat: ministry totals ---
    for f in load_csv("apparaat_ministry.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        total = int(f["value"])
        if total < 2_000_000_000:
            continue
        tags = make_tags(entity, "apparaat")
        text = f"{entity}: {fmt_eur(total)} aan apparaatskosten. Salarissen, huisvesting, ICT en meer. {tags}"
        if add(text, "scale_shock", "apparaat", [f["fact_id"]]):
            count += 1

    # --- Inkoop: highest staffel ---
    for f in load_csv("inkoop_high_staffel.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        staffel = int(f["mode_staffel"])
        contracts = int(f["contract_count"])
        ywd = int(f["years_with_data"])
        bracket = STAFFEL_SHORT.get(staffel, STAFFEL_DESC.get(staffel, ""))
        if not bracket:
            continue
        tags = make_tags(entity, "inkoop")
        text = f"{entity} had {_inkoopcontracten(contracts)} {bracket} bij het Rijk. {_in_period(ywd)} {tags}"
        if add(text, "scale_shock", "inkoop", [f["fact_id"]], staffel="yes"):
            count += 1

    print(f"  scale_shock: {count} posts")
    return count


def gen_comparison():
    """Generate comparison posts from totals and pairs."""
    count = 0

    # --- Gemeente totals: pair adjacent cities ---
    totals = load_csv("gemeente_totals.csv")
    for i in range(len(totals) - 1):
        a, b = totals[i], totals[i + 1]
        ea, eb = a["entity"], b["entity"]
        if is_blocked(ea) or is_blocked(eb):
            continue
        va, vb = int(a["value"]), int(b["value"])
        if va < 50_000_000 or vb < 50_000_000:
            continue
        tags = make_tags(f"{ea} {eb}", "gemeente")
        text = f"Gemeente {ea}: {fmt_eur(va)} aan uitkeringen. Gemeente {eb}: {fmt_eur(vb)}. {tags}"
        if add(text, "comparison", "gemeente", [a["fact_id"], b["fact_id"]]):
            count += 1

    # --- Provincie totals: pair adjacent ---
    totals = load_csv("provincie_totals.csv")
    for i in range(len(totals) - 1):
        a, b = totals[i], totals[i + 1]
        ea, eb = a["entity"], b["entity"]
        va, vb = int(a["value"]), int(b["value"])
        if va < 10_000_000:
            continue
        tags = make_tags(f"{ea} {eb}", "provincie")
        text = f"Provincie {ea}: {fmt_eur(va)}. Provincie {eb}: {fmt_eur(vb)}. Provinciale subsidies. {tags}"
        if add(text, "comparison", "provincie", [a["fact_id"], b["fact_id"]]):
            count += 1

    # --- Instrumenten: compare similar-size entities ---
    instr = [f for f in load_csv("instrumenten_top.csv")
             if not is_blocked(f["entity"]) and int(f["value"]) >= 500_000_000]
    for i in range(0, len(instr) - 1, 2):
        a, b = instr[i], instr[i + 1]
        va, vb = int(a["value"]), int(b["value"])
        tags = make_tags(f"{a['entity']} {b['entity']}", "instrumenten")
        text = f"{a['entity']}: {fmt_eur(va)}. {b['entity']}: {fmt_eur(vb)}. Via financiële instrumenten. {tags}"
        if add(text, "comparison", "instrumenten", [a["fact_id"], b["fact_id"]]):
            count += 1

    # --- Apparaat ministry: compare pairs ---
    mins = [f for f in load_csv("apparaat_ministry.csv")
            if not is_blocked(f["entity"]) and int(f["value"]) >= 1_000_000_000]
    for i in range(0, len(mins) - 1, 2):
        a, b = mins[i], mins[i + 1]
        va, vb = int(a["value"]), int(b["value"])
        tags = make_tags(f"{a['entity']} {b['entity']}", "apparaat")
        text = f"{a['entity']}: {fmt_eur(va)}. {b['entity']}: {fmt_eur(vb)}. Apparaatskosten. {tags}"
        if add(text, "comparison", "apparaat", [a["fact_id"], b["fact_id"]]):
            count += 1

    # --- Gemeente top: compare top recipients from different cities ---
    gem_top = [f for f in load_csv("gemeente_top.csv")
               if not is_blocked(f["entity"]) and int(f["value"]) >= 30_000_000]
    # Group by gemeente, take top 1 per gemeente
    by_gem = {}
    for f in gem_top:
        g = f["gemeente"]
        if g not in by_gem:
            by_gem[g] = f
    gem_list = list(by_gem.values())
    for i in range(0, len(gem_list) - 1, 2):
        a, b = gem_list[i], gem_list[i + 1]
        va, vb = int(a["value"]), int(b["value"])
        tags = make_tags(f"{a['gemeente']} {b['gemeente']}", "gemeente")
        text = (f"{a['entity']} ({a['gemeente']}): {fmt_eur(va)}. "
                f"{b['entity']} ({b['gemeente']}): {fmt_eur(vb)}. {tags}")
        if add(text, "comparison", "gemeente", [a["fact_id"], b["fact_id"]]):
            count += 1

    # --- Provincie top: compare top per provincie ---
    prov_top = [f for f in load_csv("provincie_top.csv")
                if not is_blocked(f["entity"]) and int(f["value"]) >= 20_000_000]
    by_prov = {}
    for f in prov_top:
        p = f["provincie"]
        if p not in by_prov:
            by_prov[p] = f
    prov_list = list(by_prov.values())
    for i in range(0, len(prov_list) - 1, 2):
        a, b = prov_list[i], prov_list[i + 1]
        va, vb = int(a["value"]), int(b["value"])
        tags = make_tags(f"{a['provincie']} {b['provincie']}", "provincie")
        text = (f"{a['entity']} ({a['provincie']}): {fmt_eur(va)}. "
                f"{b['entity']} ({b['provincie']}): {fmt_eur(vb)}. {tags}")
        if add(text, "comparison", "provincie", [a["fact_id"], b["fact_id"]]):
            count += 1

    # --- Gemeente: same entity, different year ---
    for f in load_csv("gemeente_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        gemeente = f["gemeente"]
        # Find biggest and smallest non-zero year
        year_vals = []
        for y in range(2018, 2025):
            v = int(f.get(f"y{y}", 0) or 0)
            if v > 0:
                year_vals.append((y, v))
        if len(year_vals) < 2:
            continue
        year_vals.sort(key=lambda x: x[1])
        lo_y, lo_v = year_vals[0]
        hi_y, hi_v = year_vals[-1]
        if hi_v < 5_000_000 or lo_v < 1_000_000:
            continue
        if hi_v / lo_v < 2.0:
            continue  # Not dramatic enough
        tags = make_tags(entity, "gemeente", [f"#{gemeente.replace(' ', '')}"])
        text = (f"{entity} ({gemeente}): {fmt_eur(lo_v)} in {lo_y}, "
                f"{fmt_eur(hi_v)} in {hi_y}. {tags}")
        if add(text, "comparison", "gemeente", [f["fact_id"]]):
            count += 1

    print(f"  comparison: {count} posts")
    return count


def gen_concentration():
    """Generate concentration posts — one entity dominates."""
    count = 0

    # --- Gemeente dominant ---
    for f in load_csv("gemeente_dominant.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        gemeente = f["gemeente"]
        pct = float(f["pct_of_gemeente"])
        total = int(f["entity_total"])
        ywd = int(f["years_with_data"])
        if pct < 3.0 or total < 5_000_000:
            continue
        tags = make_tags(entity, "gemeente", [f"#{gemeente.replace(' ', '')}"])
        text = (f"{entity} ontving {fmt_eur(total)} van de gemeente {gemeente}. "
                f"Dat is {pct:.1f}% van alle uitkeringen. {tags}".replace(".", ",", 1).replace(",", ".", 1))
        # Fix: Dutch decimal comma
        text = text.replace(f"{pct:.1f}", f"{pct:.1f}".replace(".", ","))
        if add(text, "concentration", "gemeente", [f["fact_id"]]):
            count += 1

    # --- Inkoop: top by contract count ---
    for f in load_csv("inkoop_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        contracts = int(f["contract_count"])
        cat = f.get("categorie", "")
        ywd = int(f["years_with_data"])
        if contracts < 20:
            continue
        cat_short = cat.split(" - ", 1)[1] if " - " in cat else cat
        if cat_short:
            cat_short = cat_short.lower()
        tags = make_tags(entity, "inkoop")
        if cat_short:
            text = f"{entity} had {_inkoopcontracten(contracts)} bij het Rijk. Categorie: {cat_short}. {_in_period(ywd)} {tags}"
        else:
            text = f"{entity} had {_inkoopcontracten(contracts)} bij het Rijk. {_in_period(ywd)} {tags}"
        if add(text, "concentration", "inkoop", [f["fact_id"]], staffel="yes"):
            count += 1

    # --- Publiek: top by contract count ---
    for f in load_csv("publiek_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        source = f.get("source", "")
        contracts = int(f["contract_count"])
        ywd = int(f["years_with_data"])
        if contracts < 10:
            continue
        tags = make_tags(entity, "publiek")
        if source:
            text = f"{entity} had {_contracts(contracts)} bij {source}. {_in_period(ywd)} {tags}"
        else:
            text = f"{entity} had {_contracts(contracts)} bij publieke organisaties. {_in_period(ywd)} {tags}"
        if add(text, "concentration", "publiek", [f["fact_id"]], staffel="yes"):
            count += 1

    # --- Publiek per source: top entities ---
    for f in load_csv("publiek_per_source.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        source = f.get("source", "")
        contracts = int(f["contract_count"])
        ywd = int(f["years_with_data"])
        if contracts < 8:
            continue
        tags = make_tags(entity, "publiek")
        text = f"{entity} had {_contracts(contracts)} bij {source}. {_in_period(ywd)} {tags}"
        if add(text, "concentration", "publiek", [f["fact_id"]], staffel="yes"):
            count += 1

    # --- Provincie: top per provincie ---
    for f in load_csv("provincie_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        prov = f["provincie"]
        total = int(f["value"])
        ywd = int(f["years_with_data"])
        if total < 5_000_000:
            continue
        tags = make_tags(entity, "provincie", [f"#{prov.replace(' ', '').replace('-', '')}"])
        text = f"{entity} ontving {fmt_eur(total)} van {prov}. {_in_period(ywd)} {tags}"
        if add(text, "concentration", "provincie", [f["fact_id"]]):
            count += 1

    print(f"  concentration: {count} posts")
    return count


def gen_category_reveal():
    """Generate category_reveal posts — unexpected categories."""
    count = 0

    # --- Inkoop categories ---
    for f in load_csv("inkoop_categories.csv"):
        cat = f["entity"]  # Category name is the entity here
        if not cat or is_blocked(cat):
            continue
        n_lev = int(f["leverancier_count"])
        n_con = int(f["total_contracts"])
        if n_con < 50:
            continue
        cat_short = cat.split(" - ", 1)[1] if " - " in cat else cat
        tags = make_tags(cat_short, "inkoop")
        text = f"Categorie '{cat_short}': {_dn(n_lev)} leveranciers, {_dn(n_con)} contracten bij het Rijk. {tags}"
        if add(text, "category_reveal", "inkoop", [f["fact_id"]], staffel="yes"):
            count += 1

    # --- Apparaat: kostensoort per ministry ---
    for f in load_csv("apparaat_kostensoort_ministry.csv"):
        entity = fix_entity(f["entity"])  # "kostensoort (begrotingsnaam)"
        if is_blocked(entity):
            continue
        total = int(f["value"])
        ministry = f.get("begrotingsnaam", "")
        ks = f.get("kostensoort", "")
        yrs = int(f.get("year_count", 0))
        if total < 50_000_000:
            continue
        if not ministry or not ks:
            continue
        tags = make_tags(f"{ministry} {ks}", "apparaat")
        text = f"{ministry} gaf {fmt_eur(total)} uit aan {ks.lower()}. {_in_period(yrs)} {tags}"
        if add(text, "category_reveal", "apparaat", [f["fact_id"]]):
            count += 1

    # --- Inkoop top with interesting categories ---
    interesting_cats = {"benodigdheden", "studie", "reis", "verblijf", "representatie",
                        "schoonmaak", "catering", "vervoer", "communicatie", "diversen"}
    for f in load_csv("inkoop_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        cat = f.get("categorie", "").lower()
        contracts = int(f["contract_count"])
        ywd = int(f["years_with_data"])
        if contracts < 30:
            continue
        cat_match = any(ic in cat for ic in interesting_cats)
        if not cat_match:
            continue
        cat_short = f["categorie"].split(" - ", 1)[1] if " - " in f["categorie"] else f["categorie"]
        tags = make_tags(entity, "inkoop")
        text = f"{entity} had {_inkoopcontracten(contracts)} bij het Rijk. Categorie: {cat_short.lower()}. {tags}"
        if add(text, "category_reveal", "inkoop", [f["fact_id"]], staffel="yes"):
            count += 1

    print(f"  category_reveal: {count} posts")
    return count


def gen_curiosity():
    """Generate curiosity posts — question + answer format."""
    count = 0

    # --- Instrumenten: top entities as Q&A ---
    for f in load_csv("instrumenten_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        total = int(f["value"])
        ywd = int(f["years_with_data"])
        if total < 200_000_000 or ywd < 2:
            continue
        tags = make_tags(entity, "instrumenten")
        text = f"Hoeveel ontving {entity} van het Rijk? {fmt_eur(total)}. {_in_period(ywd)} {tags}"
        if add(text, "curiosity", "instrumenten", [f["fact_id"]]):
            count += 1

    # --- Gemeente: top entities as Q&A ---
    for f in load_csv("gemeente_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        total = int(f["value"])
        gemeente = f["gemeente"]
        ywd = int(f["years_with_data"])
        if total < 10_000_000:
            continue
        tags = make_tags(entity, "gemeente", [f"#{gemeente.replace(' ', '')}"])
        text = f"Hoeveel ontving {entity} van {gemeente}? {fmt_eur(total)}. {_in_period(ywd)} {tags}"
        if add(text, "curiosity", "gemeente", [f["fact_id"]]):
            count += 1

    # --- Provincie: top entities as Q&A ---
    for f in load_csv("provincie_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        total = int(f["value"])
        prov = f["provincie"]
        ywd = int(f["years_with_data"])
        if total < 5_000_000:
            continue
        tags = make_tags(entity, "provincie", [f"#{prov.replace(' ', '').replace('-', '')}"])
        text = f"Hoeveel ontving {entity} van {prov}? {fmt_eur(total)}. {_in_period(ywd)} {tags}"
        if add(text, "curiosity", "provincie", [f["fact_id"]]):
            count += 1

    # --- Universal: multi-source entities ---
    for f in load_csv("universal_multi_source.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        sources = f.get("sources", "")
        src_count = int(f.get("source_count", 0))
        total = int(f.get("totaal", 0))
        if src_count < 3 or total < 10_000_000:
            continue
        tags = make_tags(entity, "integraal")
        text = f"{entity} ontving geld van het Rijk via {_dn(src_count)} verschillende bronnen. Totaal: {fmt_eur(total)}. {tags}"
        if add(text, "curiosity", "integraal", [f["fact_id"]]):
            count += 1

    # --- Apparaat: ministry totals as Q&A ---
    for f in load_csv("apparaat_ministry.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        total = int(f["value"])
        if total < 1_000_000_000:
            continue
        tags = make_tags(entity, "apparaat")
        text = f"Hoeveel gaf {entity} uit aan apparaatskosten? {fmt_eur(total)}. {tags}"
        if add(text, "curiosity", "apparaat", [f["fact_id"]]):
            count += 1

    # --- Inkoop: top as Q&A ---
    for f in load_csv("inkoop_top.csv"):
        entity = fix_entity(f["entity"])
        if is_blocked(entity):
            continue
        contracts = int(f["contract_count"])
        ywd = int(f["years_with_data"])
        if contracts < 50:
            continue
        tags = make_tags(entity, "inkoop")
        text = f"Hoeveel inkoopcontracten had {entity} bij het Rijk? {_dn(contracts).capitalize()}. {_in_period(ywd)} {tags}"
        if add(text, "curiosity", "inkoop", [f["fact_id"]], staffel="yes"):
            count += 1

    print(f"  curiosity: {count} posts")
    return count


# ============================================================
# MAIN
# ============================================================
def main():
    print("Generating posts from verified facts...\n")

    gen_scale_shock()
    gen_comparison()
    gen_concentration()
    gen_category_reveal()
    gen_curiosity()

    print(f"\nTotal candidate posts: {len(posts)}")

    # Remove posts over 280 chars (double check)
    valid = [p for p in posts if p[5] <= 280]
    print(f"Valid (≤280 chars): {len(valid)}")

    # Shuffle for variety
    random.shuffle(valid)

    # Stats
    fmt_dist = Counter(p[1] for p in valid)
    mod_dist = Counter(p[2] for p in valid)
    print(f"\nBy format: {dict(sorted(fmt_dist.items()))}")
    print(f"By module: {dict(sorted(mod_dist.items()))}")

    # Split into batches of 100
    BATCH_SIZE = 100
    registry_rows = []

    for bi in range(0, len(valid), BATCH_SIZE):
        batch = valid[bi:bi + BATCH_SIZE]
        batch_num = (bi // BATCH_SIZE) + 1
        batch_name = f"batch-{batch_num:03d}"
        csv_path = os.path.join(POSTS_DIR, f"{batch_name}.csv")

        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["text", "format", "module", "fact_ids", "staffel", "chars"])
            for text, fmt, mod, fids, staffel, chars in batch:
                w.writerow([text, fmt, mod, fids, staffel, chars])
                registry_rows.append(f"{fids},{fmt},{mod},{batch_name}")

        print(f"Wrote {csv_path} ({len(batch)} posts)")

    # Write registry
    reg_path = os.path.join(SOCIAL_DIR, "registry.csv")
    with open(reg_path, "w", newline="", encoding="utf-8") as f:
        f.write("fact_ids,format,module,batch\n")
        for row in registry_rows:
            f.write(row + "\n")

    print(f"\nRegistry: {reg_path} ({len(registry_rows)} entries)")
    print(f"Batches: {(len(valid) + BATCH_SIZE - 1) // BATCH_SIZE}")

    if len(valid) < 810:
        print(f"\n⚠️  {len(valid)} posts generated — need 810. "
              f"Consider lowering thresholds or adding more formats.")
    else:
        print(f"\n✓ {len(valid)} posts generated (target: 810)")


if __name__ == "__main__":
    main()
