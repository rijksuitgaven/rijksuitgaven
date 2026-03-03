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
HASHTAG = "#Rijksuitgaven"

# Module distribution targets (approximate, flexible)
MODULE_TARGETS = {
    "instrumenten": 100,
    "apparaat": 50,
    "inkoop": 80,
    "provincie": 60,
    "gemeente": 80,
    "publiek": 60,
    "coa": 70,
}


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
def clean_descriptor(d, max_len=80):
    """Clean up and truncate long descriptors."""
    if not d:
        return ""
    d = re.sub(r'\s+', ' ', d.strip())
    # Strip hierarchical budget code prefixes like "1 Ruimtelijke Ontwikkeling - 2.11 ..."
    # Keep only the last meaningful segment
    parts = d.split(" - ")
    if len(parts) >= 2 and re.match(r'^\d', parts[0].strip()):
        # Take the last segment that isn't just a number or "Boekjaar YYYY"
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
    # Uses unambiguously English function words as markers
    eng_markers = {'the', 'for', 'with', 'of', 'based', 'towards', 'from'}
    words_lower = set(d.lower().split())
    if len(words_lower & eng_markers) >= 2:
        return ""
    if len(d) > max_len:
        d = d[:max_len - 3].rsplit(' ', 1)[0] + "..."
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
# Universal templates that work for all modules with bedrag
STANDARD_TEMPLATES = [
    "Dankzij '{descriptor}' kreeg {ontvanger} in {jaar} {bedrag}.",
    "In {jaar} ontving {ontvanger} {bedrag} via '{descriptor}'.",
    "{bedrag} werd in {jaar} toegekend aan {ontvanger} onder '{descriptor}'.",
    "Met '{descriptor}' werd in {jaar} {bedrag} verstrekt aan {ontvanger}.",
    "Via '{descriptor}' ging in {jaar} {bedrag} naar {ontvanger}.",
    "In {jaar} kwam {bedrag} terecht bij {ontvanger} dankzij '{descriptor}'.",
    "Voor {ontvanger} betekende {jaar}: {bedrag} via '{descriptor}'.",
    "Resultaat van '{descriptor}': {ontvanger} ontving in {jaar} {bedrag}.",
    "Wist u dat {ontvanger} in {jaar} {bedrag} ontving via '{descriptor}'?",
    "Kort: {ontvanger} kreeg in {jaar} {bedrag} onder '{descriptor}'.",
    "{bedrag} in {jaar}: dat is wat {ontvanger} ontving via '{descriptor}'.",
    "Met behulp van '{descriptor}' ontving {ontvanger} in {jaar} {bedrag}.",
    "Voor '{descriptor}' werd in {jaar} {bedrag} toegekend aan {ontvanger}.",
    "Samengevat: {ontvanger} kreeg in {jaar} {bedrag} via '{descriptor}'.",
]

# Instrumenten-specific (adds TYPE and instrument-framing)
INSTRUMENTEN_EXTRA = [
    "Onder '{descriptor}' kreeg {ontvanger} in {jaar} een {type} van {bedrag}.",
    "Een {type} van {bedrag} werd in {jaar} uitgekeerd aan {ontvanger} via '{descriptor}'.",
    "In {jaar} keerde '{descriptor}' {bedrag} uit aan {ontvanger}.",
    "Het instrument '{descriptor}' leverde in {jaar} {bedrag} op voor {ontvanger}.",
    "In {jaar} werd {ontvanger} ondersteund met {bedrag} vanuit '{descriptor}'.",
    "In {jaar} ontving {ontvanger} {bedrag}; bron: '{descriptor}'.",
]

# Provincie-specific (adds province context)
PROVINCIE_EXTRA = [
    "De provincie {provincie} keerde in {jaar} {bedrag} uit aan {ontvanger} voor '{descriptor}'.",
    "In {jaar} ontving {ontvanger} {bedrag} van de provincie {provincie} via '{descriptor}'.",
    "De provincie {provincie} betaalde in {jaar} {bedrag} aan {ontvanger} onder '{descriptor}'.",
    "Vanuit de provincie {provincie} ging in {jaar} {bedrag} naar {ontvanger} voor '{descriptor}'.",
]

# Gemeente-specific (adds municipality context)
GEMEENTE_EXTRA = [
    "De gemeente {gemeente} keerde in {jaar} {bedrag} uit aan {ontvanger} voor '{descriptor}'.",
    "In {jaar} ontving {ontvanger} {bedrag} van de gemeente {gemeente} via '{descriptor}'.",
    "De gemeente {gemeente} betaalde in {jaar} {bedrag} aan {ontvanger} onder '{descriptor}'.",
    "Vanuit de gemeente {gemeente} ging in {jaar} {bedrag} naar {ontvanger} voor '{descriptor}'.",
]

# Publiek-specific (adds source context: NWO, RVO, ZonMW)
PUBLIEK_EXTRA = [
    "Via {source} ontving {ontvanger} in {jaar} {bedrag} voor '{descriptor}'.",
    "{source} keerde in {jaar} {bedrag} uit aan {ontvanger} voor '{descriptor}'.",
    "In {jaar} ontving {ontvanger} {bedrag} van {source} via '{descriptor}'.",
    "Vanuit {source} ging in {jaar} {bedrag} naar {ontvanger} voor '{descriptor}'.",
]

# Set 2: Apparaat templates (internal government costs — no "ontvanger ontving")
APPARAAT_TEMPLATES = [
    "In {jaar} gaf {begrotingsnaam} {bedrag} uit aan {kostensoort}.",
    "{bedrag} in {jaar}: zoveel besteedde {begrotingsnaam} aan {kostensoort}.",
    "De post '{kostensoort}' bij {begrotingsnaam} bedroeg in {jaar} {bedrag}.",
    "{begrotingsnaam} gaf in {jaar} {bedrag} uit aan {kostensoort}.",
    "Wist u dat {begrotingsnaam} in {jaar} {bedrag} besteedde aan {kostensoort}?",
    "In {jaar} was de kostenpost '{kostensoort}' bij {begrotingsnaam}: {bedrag}.",
    "Aan {kostensoort} besteedde {begrotingsnaam} in {jaar} {bedrag}.",
    "{begrotingsnaam} besteedde in {jaar} {bedrag} aan de post '{kostensoort}'.",
]

# Set 3a: Inkoop staffel templates (bracket-based, no exact amounts)
INKOOP_TEMPLATES = [
    "{leverancier} heeft inkoopcontracten {bracket} bij de Rijksoverheid voor '{categorie}'.",
    "Het Rijk koopt bij {leverancier} in de prijsklasse {bracket} voor '{categorie}'.",
    "In welke prijsklasse koopt het Rijk in bij {leverancier}? Contracten {bracket}.",
    "Wist u dat {leverancier} contracten {bracket} heeft bij de Rijksoverheid? Categorie: {categorie}.",
    "De inkoopcontracten van {leverancier} bij het Rijk vallen {bracket}.",
    "{leverancier} levert aan de Rijksoverheid met contracten {bracket} ({categorie}).",
]

# Set 3b: COA staffel templates (bracket-based, with regeling)
COA_TEMPLATES = [
    "Bij het COA heeft {ontvanger} contracten {bracket} voor de regeling '{regeling}'.",
    "{ontvanger} levert aan het COA met contracten {bracket}, regeling: {regeling}.",
    "Het COA koopt bij {ontvanger} in de prijsklasse {bracket} voor '{regeling}'.",
    "Wist u dat {ontvanger} bij het COA contracten {bracket} heeft? Regeling: {regeling}.",
    "De contracten van {ontvanger} bij het COA vallen {bracket}. Regeling: {regeling}.",
    "{ontvanger} is leverancier van het COA met contracten {bracket}.",
]


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
        # Skip if descriptor is essentially the entity name (tautological)
        if is_tautological(entity, descriptor):
            continue
        bedrag = int(float(f["bedrag"]))
        jaar = f["jaar"]
        inst_type = f.get("type", "bijdrage").strip() or "bijdrage"

        text = random.choice(templates).format(
            ontvanger=entity, jaar=jaar, bedrag=fmt_eur(bedrag),
            descriptor=descriptor, type=inst_type,
        )
        text = f"{text} {HASHTAG}"
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
        bedrag = int(float(f["bedrag"]))
        jaar = f["jaar"]

        text = random.choice(APPARAAT_TEMPLATES).format(
            begrotingsnaam=begrotingsnaam, kostensoort=kostensoort.lower(),
            jaar=jaar, bedrag=fmt_eur(bedrag),
        )
        text = f"{text} {HASHTAG}"
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

        text = random.choice(INKOOP_TEMPLATES).format(
            leverancier=entity, bracket=bracket, categorie=cat_short.lower(),
        )
        text = f"{text} {HASHTAG}"
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
        text = f"{text} {HASHTAG}"
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
        text = f"{text} {HASHTAG}"
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
        text = f"{text} {HASHTAG}"
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

        # With regeling: use all templates. Without: only the last (no regeling field).
        if regeling:
            text = random.choice(COA_TEMPLATES).format(
                ontvanger=entity, bracket=bracket, regeling=regeling,
            )
        else:
            text = COA_TEMPLATES[-1].format(
                ontvanger=entity, bracket=bracket,
            )
        text = f"{text} {HASHTAG}"
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
