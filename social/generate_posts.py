#!/usr/bin/env python3
"""Generate 500 social media posts from per-year facts.

Three template sets:
  1. Standard (exact bedrag) — instrumenten, provincie, gemeente, publiek
  2. Apparaat (internal costs) — different framing
  3. Staffel (brackets) — inkoop, COA

Pipeline: facts/*.csv -> generate_posts.py -> posts/buffer-ready.csv

Usage:
    python3 social/generate_posts.py
"""
import csv
import glob
import os
import random
import re
from collections import Counter, defaultdict

random.seed(42)

SOCIAL_DIR = os.path.dirname(os.path.abspath(__file__))
FACTS_DIR = os.path.join(SOCIAL_DIR, "facts")
POSTS_DIR = os.path.join(SOCIAL_DIR, "posts")
os.makedirs(POSTS_DIR, exist_ok=True)

TARGET_POSTS = 500
MAX_PER_RECIPIENT = 3


# ============================================================
# BLOCKLIST
# ============================================================
ENTITY_BLOCKLIST = {
    "", "Niet toegewezen", "GEMEENTEN", "AVG restrictie",
    "Diverse", "Overige", "Overig", "Diverse ontvangers",
    "Niet nader te specificeren", "(leeg)", "leeg", "Leeg",
    "Onbekend", "onbekend", "N.B.", "n.b.",
    "Niet nader gespecificeerd", "Overige ontvangers",
    "Diverse gemeenten", "Diverse provincies",
    "Niet gespecificeerd", "Anoniem",
    "Particulier", "particulier", "Particulieren",
    "Diverse instellingen", "Overige instellingen",
}


def is_blocked(entity):
    if not entity or entity.strip() in ENTITY_BLOCKLIST:
        return True
    e = entity.strip()
    if e.upper() == e and len(e) < 15:
        return True
    if e.startswith("(") and e.endswith(")"):
        return True
    if "anoniem" in e.lower() or "geanonimiseerd" in e.lower():
        return True
    # "1542 natuurlijke personen" — aggregated anonymous group
    if re.match(r'^\d+\s+natuurlijke\s+personen', e, re.IGNORECASE):
        return True
    # Truncated entity names (cut mid-word by source data)
    if e.endswith('-') or e.endswith('…'):
        return True
    # Too long for a clean post
    if len(e) > 50:
        return True
    return False


def fix_entity(entity):
    """Fix common data quality issues in entity names."""
    e = entity.strip()
    e = re.sub(r'\s+', ' ', e)
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
    """Format as €13.100.000 — full Dutch notation with dots."""
    amount = int(round(float(amount)))
    if amount < 0:
        return f"-\u20ac{abs(amount):,.0f}".replace(",", ".")
    return f"\u20ac{amount:,.0f}".replace(",", ".")


# ============================================================
# STAFFEL BRACKET DESCRIPTIONS
# ============================================================
STAFFEL_DESC = {
    0: "negatief tot \u20ac0", 1: "tussen \u20ac1 en \u20ac10.000",
    2: "tussen \u20ac10.000 en \u20ac50.000", 3: "tussen \u20ac50.000 en \u20ac100.000",
    4: "tussen \u20ac100.000 en \u20ac250.000", 5: "tussen \u20ac250.000 en \u20ac500.000",
    6: "tussen \u20ac500.000 en \u20ac1 miljoen", 7: "tussen \u20ac1 en \u20ac5 miljoen",
    8: "tussen \u20ac5 en \u20ac10 miljoen", 9: "tussen \u20ac10 en \u20ac25 miljoen",
    10: "tussen \u20ac25 en \u20ac50 miljoen", 11: "tussen \u20ac50 en \u20ac100 miljoen",
    12: "tussen \u20ac100 en \u20ac150 miljoen", 13: "boven \u20ac150 miljoen",
}

STAFFEL_SHORT = {
    7: "boven \u20ac1 miljoen", 8: "boven \u20ac5 miljoen",
    9: "boven \u20ac10 miljoen", 10: "boven \u20ac25 miljoen",
    11: "boven \u20ac50 miljoen", 12: "boven \u20ac100 miljoen",
    13: "boven \u20ac150 miljoen",
}


# ============================================================
# TAUTOLOGY FILTER
# ============================================================
def is_tautological(entity, context):
    """Check if entity and context share significant substrings.

    Catches: Gelderland -> Stichting Erfgoed Gelderland,
    Amsterdam -> Stichting Amsterdams Fonds, etc.
    """
    if not context:
        return False
    e = entity.lower()
    c = context.lower()
    # Direct containment
    if c in e or e in c:
        return True
    # Partial word match (e.g., "Amsterdam" in "Amsterdams")
    for word in c.split():
        if len(word) >= 5 and word in e:
            return True
    for word in e.split():
        if len(word) >= 5 and word in c:
            return True
    return False


# ============================================================
# DESCRIPTOR CLEANUP
# ============================================================
def clean_descriptor(d, max_len=50):
    """Clean up descriptors. Return "" if too long or low quality — skip the candidate."""
    if not d:
        return ""
    d = re.sub(r'\s+', ' ', d.strip())
    # Strip hierarchical budget code prefixes like "1 Ruimtelijke Ontwikkeling - 2.11 ..."
    # Keep only the last meaningful segment
    parts = d.split(" - ")
    if len(parts) >= 2 and re.match(r'^\d', parts[0].strip()):
        for part in reversed(parts):
            p = part.strip()
            if p and not re.match(r'^(\d+\.?\d*|Boekjaar \d{4})$', p):
                d = p
                break
    # Skip if it looks like an address (e.g., "A.J. Ernststraat 195")
    if re.search(r'\d+\s*(bis|a|b|c)?$', d) and len(d) < 40:
        return ""
    # Skip "Boekjaar YYYY" standalone
    if re.match(r'^Boekjaar \d{4}$', d):
        return ""
    # Skip English-language descriptors (common in ZonMW/NWO research titles)
    eng_markers = {'the', 'for', 'with', 'of', 'based', 'towards', 'from',
                   'and', 'in', 'on', 'by', 'using', 'between', 'through',
                   'during', 'after', 'before', 'into', 'within'}
    words_lower = set(d.lower().split())
    if len(words_lower & eng_markers) >= 2:
        return ""
    # Too long? Skip entirely — no truncation
    if len(d) > max_len:
        return ""
    return d


# ============================================================
# CSV LOADER
# ============================================================
def load_csv(filename):
    path = os.path.join(FACTS_DIR, filename)
    if not os.path.exists(path):
        print(f"  Warning: {filename} not found")
        return []
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ============================================================
# TEMPLATE SETS
# ============================================================

# Set 1: Standard templates — exact bedrag + descriptor (C7-style)
STANDARD_TEMPLATES = [
    "Dankzij '{descriptor}' kreeg {ontvanger} in {jaar} {bedrag}.",
    "In {jaar} ontving {ontvanger} {bedrag} via '{descriptor}'.",
    "{bedrag} werd in {jaar} toegekend aan {ontvanger} onder '{descriptor}'.",
    "Met '{descriptor}' werd in {jaar} {bedrag} verstrekt aan {ontvanger}.",
    "In {jaar} kwam {bedrag} terecht bij {ontvanger} dankzij '{descriptor}'.",
    "Met behulp van '{descriptor}' ontving {ontvanger} in {jaar} {bedrag}.",
]

# Instrumenten-specific (adds TYPE)
INSTRUMENTEN_EXTRA = [
    "Onder '{descriptor}' kreeg {ontvanger} in {jaar} een {type} van {bedrag}.",
    "In {jaar} werd {ontvanger} ondersteund met {bedrag} vanuit '{descriptor}'.",
]

# Provincie-specific (adds province context)
PROVINCIE_EXTRA = [
    "De provincie {provincie} keerde in {jaar} {bedrag} uit aan {ontvanger} voor '{descriptor}'.",
    "In {jaar} ontving {ontvanger} {bedrag} van de provincie {provincie} via '{descriptor}'.",
    "De provincie {provincie} betaalde in {jaar} {bedrag} aan {ontvanger} onder '{descriptor}'.",
]

# Gemeente-specific (adds municipality context)
GEMEENTE_EXTRA = [
    "De gemeente {gemeente} keerde in {jaar} {bedrag} uit aan {ontvanger} voor '{descriptor}'.",
    "In {jaar} ontving {ontvanger} {bedrag} van de gemeente {gemeente} via '{descriptor}'.",
    "Vanuit de gemeente {gemeente} ging in {jaar} {bedrag} naar {ontvanger} voor '{descriptor}'.",
]

# Publiek-specific (adds source context: NWO, RVO, ZonMW)
PUBLIEK_EXTRA = [
    "Via {source} ontving {ontvanger} in {jaar} {bedrag} voor '{descriptor}'.",
    "{source} keerde in {jaar} {bedrag} uit aan {ontvanger} voor '{descriptor}'.",
    "In {jaar} ontving {ontvanger} {bedrag} van {source} via '{descriptor}'.",
    "Vanuit {source} ging in {jaar} {bedrag} naar {ontvanger} voor '{descriptor}'.",
]

# Set 2: Apparaat templates (internal government costs)
APPARAAT_TEMPLATES = [
    "In {jaar} gaf {begrotingsnaam} {bedrag} uit aan {kostensoort}.",
    "De post '{kostensoort}' bij {begrotingsnaam} bedroeg in {jaar} {bedrag}.",
    "{begrotingsnaam} gaf in {jaar} {bedrag} uit aan {kostensoort}.",
    "In {jaar} was de kostenpost '{kostensoort}' bij {begrotingsnaam}: {bedrag}.",
    "Aan {kostensoort} besteedde {begrotingsnaam} in {jaar} {bedrag}.",
    "{begrotingsnaam} besteedde in {jaar} {bedrag} aan de post '{kostensoort}'.",
]

# Set 3a: Inkoop staffel templates (bracket-based, no exact amounts)
INKOOP_TEMPLATES = [
    "{leverancier} heeft inkoopcontracten {bracket} bij de Rijksoverheid voor '{categorie}'.",
    "De inkoopcontracten van {leverancier} bij het Rijk vallen {bracket}.",
    "{leverancier} levert aan de Rijksoverheid met contracten {bracket} ({categorie}).",
]

# Set 3b: COA staffel templates (bracket-based, with regeling)
COA_TEMPLATES = [
    "Bij het COA heeft {ontvanger} contracten {bracket} voor de regeling '{regeling}'.",
    "{ontvanger} levert aan het COA met contracten {bracket}, regeling: {regeling}.",
    "Het COA koopt bij {ontvanger} in de prijsklasse {bracket} voor '{regeling}'.",
    "De contracten van {ontvanger} bij het COA vallen {bracket}. Regeling: {regeling}.",
    "{ontvanger} is leverancier van het COA met contracten {bracket}.",
]


# ============================================================
# CONTEXTUAL HASHTAGS
# ============================================================

# Suffixes to strip before making entity hashtag
ENTITY_STRIP = [
    " B.V.", " b.v.", " BV", " N.V.", " n.v.", " NV",
    " B.V", " N.V", " VOF", " V.O.F.",
]


def make_entity_tag(entity):
    """Create #EntityName hashtag if entity is short and recognizable.

    Rules: strip B.V./N.V., only if 1-2 words remain, no Stichting/Gemeente/Provincie prefix.
    """
    e = entity.strip()
    for suffix in ENTITY_STRIP:
        if e.endswith(suffix):
            e = e[:-len(suffix)].strip()
    # Skip long/institutional prefixes
    skip_prefixes = ("Stichting ", "Gemeente ", "Provincie ", "Ministerie ", "Koninklijke ")
    for prefix in skip_prefixes:
        if e.startswith(prefix):
            e = e[len(prefix):]
    words = e.split()
    if len(words) > 2 or len(words) == 0:
        return ""
    tag = "#" + "".join(w.capitalize() for w in words)
    # Strip characters invalid in hashtags
    tag = re.sub(r'[^#\w]', '', tag)
    if len(tag) > 25 or len(tag) <= 1:
        return ""
    return tag


def make_category_tag(categorie):
    """Create hashtag from inkoop categorie."""
    if not categorie:
        return ""
    # Map common categories to clean hashtags
    cat_map = {
        "automatisering": "#ICT",
        "ict": "#ICT",
        "advies": "#Advies",
        "personeel": "#Personeel",
        "huisvesting": "#Huisvesting",
        "reis en verblijf": "#Reiskosten",
        "vervoer": "#Vervoer",
        "inhuur": "#Inhuur",
        "beveiliging": "#Beveiliging",
        "communicatie": "#Communicatie",
        "facilitair": "#Facilitair",
        "juridisch": "#Juridisch",
    }
    cl = categorie.lower().strip()
    if cl in cat_map:
        return cat_map[cl]
    # Only use mapped categories — skip unknown ones
    return ""


def make_ministry_tag(begrotingsnaam):
    """Create hashtag from ministry name."""
    if not begrotingsnaam:
        return ""
    # Map known ministries to short hashtags
    ministry_map = {
        "Defensie": "#Defensie",
        "Justitie en Veiligheid": "#JenV",
        "Binnenlandse Zaken en Koninkrijksrelaties": "#BZK",
        "Buitenlandse Zaken": "#BuZa",
        "Financiën": "#Financien",
        "Infrastructuur en Waterstaat": "#IenW",
        "Onderwijs, Cultuur en Wetenschap": "#OCW",
        "Sociale Zaken en Werkgelegenheid": "#SZW",
        "Volksgezondheid, Welzijn en Sport": "#VWS",
        "Economische Zaken en Klimaat": "#EZK",
        "Landbouw, Natuur en Voedselkwaliteit": "#LNV",
        "Algemene Zaken": "#AZ",
        "Koninkrijksrelaties en Digitalisering": "#KenD",
    }
    for key, tag in ministry_map.items():
        if key.lower() in begrotingsnaam.lower():
            return tag
    # Fallback: first word if short
    first = begrotingsnaam.split()[0] if begrotingsnaam else ""
    if first and len(first) <= 15:
        return f"#{first}"
    return ""


def make_kostensoort_tag(kostensoort):
    """Create hashtag from kostensoort."""
    if not kostensoort:
        return ""
    ks_map = {
        "personeel": "#Personeel",
        "materieel": "#Materieel",
        "inhuur externen": "#Inhuur",
        "ict": "#ICT",
        "huisvesting": "#Huisvesting",
    }
    cl = kostensoort.lower().strip()
    for key, tag in ks_map.items():
        if key in cl:
            return tag
    return ""


def build_hashtags(tags):
    """Combine 2-3 hashtags into a suffix string. Dedup and limit."""
    seen = set()
    result = []
    for t in tags:
        if t and t.lower() not in seen:
            seen.add(t.lower())
            result.append(t)
        if len(result) >= 3:
            break
    return " ".join(result)


# ============================================================
# POST GENERATION PER MODULE
# ============================================================

def gen_instrumenten():
    """Generate posts from instrumenten per-year facts."""
    candidates = []
    templates = STANDARD_TEMPLATES + INSTRUMENTEN_EXTRA
    for f in load_csv("instrumenten_rows.csv"):
        entity = fix_entity(f["ontvanger"])
        if is_blocked(entity):
            continue
        descriptor = clean_descriptor(f.get("descriptor", ""))
        if not descriptor:
            continue
        if is_tautological(entity, descriptor):
            continue
        bedrag = int(float(f["bedrag"]))
        jaar = f["jaar"]
        inst_type = f.get("type", "bijdrage").strip() or "bijdrage"

        text = random.choice(templates).format(
            ontvanger=entity, jaar=jaar, bedrag=fmt_eur(bedrag),
            descriptor=descriptor, type=inst_type,
        )
        tags = build_hashtags(["#Subsidies", make_entity_tag(entity)])
        text = f"{text} {tags}"
        if 50 <= len(text) <= 280:
            candidates.append((text, "instrumenten", entity, jaar))
    return candidates


def gen_apparaat():
    """Generate posts from apparaat per-year facts."""
    candidates = []
    for f in load_csv("apparaat_rows.csv"):
        begrotingsnaam = f["begrotingsnaam"].strip()
        kostensoort = f["kostensoort"].strip()
        if is_blocked(kostensoort) or not begrotingsnaam:
            continue
        if len(kostensoort) > 50 or len(begrotingsnaam) > 50:
            continue
        bedrag = int(float(f["bedrag"]))
        jaar = f["jaar"]

        text = random.choice(APPARAAT_TEMPLATES).format(
            begrotingsnaam=begrotingsnaam, kostensoort=kostensoort.lower(),
            jaar=jaar, bedrag=fmt_eur(bedrag),
        )
        tags = build_hashtags([
            "#Overheidsuitgaven",
            make_ministry_tag(begrotingsnaam),
            make_kostensoort_tag(kostensoort),
        ])
        text = f"{text} {tags}"
        if 50 <= len(text) <= 280:
            candidates.append((text, "apparaat", kostensoort, jaar))
    return candidates


def gen_inkoop():
    """Generate posts from inkoop staffel facts."""
    candidates = []
    for f in load_csv("inkoop_rows.csv"):
        entity = fix_entity(f["leverancier"])
        if is_blocked(entity):
            continue
        staffel = int(f["staffel"])
        bracket = STAFFEL_SHORT.get(staffel, STAFFEL_DESC.get(staffel, ""))
        if not bracket:
            continue
        categorie = f.get("categorie", "").strip()
        cat_short = categorie.split(" - ", 1)[1] if " - " in categorie else categorie
        if not cat_short:
            cat_short = "overheidsinkoop"
        if len(cat_short) > 50:
            continue

        text = random.choice(INKOOP_TEMPLATES).format(
            leverancier=entity, bracket=bracket, categorie=cat_short.lower(),
        )
        tags = build_hashtags([
            "#Overheidsinkoop",
            make_category_tag(cat_short),
            make_entity_tag(entity),
        ])
        text = f"{text} {tags}"
        if 50 <= len(text) <= 280:
            candidates.append((text, "inkoop", entity, ""))
    return candidates


def gen_provincie():
    """Generate posts from provincie per-year facts."""
    candidates = []
    templates = STANDARD_TEMPLATES + PROVINCIE_EXTRA
    for f in load_csv("provincie_rows.csv"):
        entity = fix_entity(f["ontvanger"])
        if is_blocked(entity):
            continue
        provincie = f["provincie"].strip()
        if is_tautological(entity, provincie):
            continue
        descriptor = clean_descriptor(f.get("descriptor", ""))
        if not descriptor:
            continue
        bedrag = int(float(f["bedrag"]))
        jaar = f["jaar"]

        text = random.choice(templates).format(
            ontvanger=entity, jaar=jaar, bedrag=fmt_eur(bedrag),
            descriptor=descriptor, provincie=provincie,
        )
        prov_tag = "#" + re.sub(r'[^\w]', '', provincie)
        tags = build_hashtags(["#Provincies", prov_tag, make_entity_tag(entity)])
        text = f"{text} {tags}"
        if 50 <= len(text) <= 280:
            candidates.append((text, "provincie", entity, jaar))
    return candidates


def gen_gemeente():
    """Generate posts from gemeente per-year facts."""
    candidates = []
    templates = STANDARD_TEMPLATES + GEMEENTE_EXTRA
    for f in load_csv("gemeente_rows.csv"):
        entity = fix_entity(f["ontvanger"])
        if is_blocked(entity):
            continue
        gemeente = f["gemeente"].strip()
        if is_tautological(entity, gemeente):
            continue
        descriptor = clean_descriptor(f.get("descriptor", ""))
        if not descriptor:
            continue
        bedrag = int(float(f["bedrag"]))
        jaar = f["jaar"]

        text = random.choice(templates).format(
            ontvanger=entity, jaar=jaar, bedrag=fmt_eur(bedrag),
            descriptor=descriptor, gemeente=gemeente,
        )
        gem_tag = "#" + re.sub(r'[^\w]', '', gemeente)
        tags = build_hashtags(["#Gemeenten", gem_tag, make_entity_tag(entity)])
        text = f"{text} {tags}"
        if 50 <= len(text) <= 280:
            candidates.append((text, "gemeente", entity, jaar))
    return candidates


def gen_publiek():
    """Generate posts from publiek (non-COA) per-year facts."""
    candidates = []
    templates = STANDARD_TEMPLATES + PUBLIEK_EXTRA
    for f in load_csv("publiek_rows.csv"):
        entity = fix_entity(f["ontvanger"])
        if is_blocked(entity):
            continue
        source = f.get("source", "").strip()
        descriptor = clean_descriptor(f.get("descriptor", ""))
        if not descriptor:
            continue
        bedrag = int(float(f["bedrag"]))
        jaar = f["jaar"]

        text = random.choice(templates).format(
            ontvanger=entity, jaar=jaar, bedrag=fmt_eur(bedrag),
            descriptor=descriptor, source=source,
        )
        source_tag = f"#{source}" if source else ""
        tags = build_hashtags(["#Subsidies", source_tag, make_entity_tag(entity)])
        text = f"{text} {tags}"
        if 50 <= len(text) <= 280:
            candidates.append((text, "publiek", entity, jaar))
    return candidates


def gen_coa():
    """Generate posts from COA staffel facts."""
    candidates = []
    for f in load_csv("coa_rows.csv"):
        entity = fix_entity(f["ontvanger"])
        if is_blocked(entity):
            continue
        staffel = int(f["staffel"])
        bracket = STAFFEL_SHORT.get(staffel, STAFFEL_DESC.get(staffel, ""))
        if not bracket:
            continue
        regeling = f.get("regeling", "").strip()
        if len(regeling) > 50:
            continue

        # With regeling: use all templates. Without: only the last (no regeling field).
        if regeling:
            text = random.choice(COA_TEMPLATES).format(
                ontvanger=entity, bracket=bracket, regeling=regeling,
            )
        else:
            text = COA_TEMPLATES[-1].format(
                ontvanger=entity, bracket=bracket,
            )
        tags = build_hashtags(["#COA", "#Asielopvang", make_entity_tag(entity)])
        text = f"{text} {tags}"
        if 50 <= len(text) <= 280:
            candidates.append((text, "coa", entity, ""))
    return candidates


# ============================================================
# SELECTION — balanced, max per recipient, shuffled
# ============================================================

def select_posts(all_candidates, target=TARGET_POSTS, max_per=MAX_PER_RECIPIENT):
    """Select balanced set: max N per recipient, spread across modules."""
    entity_count = defaultdict(int)
    selected = []

    # Group by module
    by_module = defaultdict(list)
    for post in all_candidates:
        by_module[post[1]].append(post)

    # Shuffle within each module
    for mod in by_module:
        random.shuffle(by_module[mod])

    # Round-robin selection across modules
    modules = sorted(by_module.keys())
    idx = {mod: 0 for mod in modules}

    while len(selected) < target:
        added_any = False
        for mod in modules:
            if len(selected) >= target:
                break
            while idx[mod] < len(by_module[mod]):
                post = by_module[mod][idx[mod]]
                idx[mod] += 1
                entity_key = post[2].lower()
                if entity_count[entity_key] < max_per:
                    entity_count[entity_key] += 1
                    selected.append(post)
                    added_any = True
                    break
        if not added_any:
            break

    random.shuffle(selected)
    return selected


# ============================================================
# OUTPUT
# ============================================================

def cleanup_old_posts():
    """Remove old batch files and buffer copies."""
    for pattern in ["batch-*.csv", "buffer/batch-*.csv"]:
        for path in glob.glob(os.path.join(POSTS_DIR, pattern)):
            os.remove(path)


def write_output(posts):
    """Write buffer-ready CSV and stats."""
    cleanup_old_posts()

    csv_path = os.path.join(POSTS_DIR, "buffer-ready.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["text", "module", "entity", "jaar", "chars"])
        for text, module, entity, jaar in posts:
            w.writerow([text, module, entity, jaar, len(text)])

    print(f"\nWrote {csv_path} ({len(posts)} posts)")
    return csv_path


# ============================================================
# MAIN
# ============================================================
def main():
    print("Generating posts from per-year facts...\n")

    generators = [
        ("instrumenten", gen_instrumenten),
        ("apparaat", gen_apparaat),
        ("inkoop", gen_inkoop),
        ("provincie", gen_provincie),
        ("gemeente", gen_gemeente),
        ("publiek", gen_publiek),
        ("coa", gen_coa),
    ]

    all_candidates = []
    for name, gen_fn in generators:
        candidates = gen_fn()
        all_candidates.extend(candidates)
        print(f"  {name}: {len(candidates)} candidates")

    print(f"\nTotal candidates: {len(all_candidates)}")

    # Select balanced set
    selected = select_posts(all_candidates)
    print(f"Selected: {len(selected)} posts (target: {TARGET_POSTS})")

    # Distribution stats
    mod_dist = Counter(p[1] for p in selected)
    print(f"\nBy module: {dict(sorted(mod_dist.items()))}")

    # Character stats
    lengths = [len(p[0]) for p in selected]
    print(f"Chars: min={min(lengths)}, max={max(lengths)}, avg={sum(lengths)//len(lengths)}")

    # Write output
    write_output(selected)

    # Show samples
    print("\n--- SAMPLE POSTS ---")
    samples = random.sample(selected, min(10, len(selected)))
    for text, module, entity, jaar in samples:
        print(f"  [{module}] {text}")

    if len(selected) < TARGET_POSTS:
        print(f"\n  Warning: only {len(selected)} posts (target: {TARGET_POSTS}). "
              f"Consider lowering bedrag thresholds in extract_facts.py.")


if __name__ == "__main__":
    main()
