#!/usr/bin/env python3
"""
Parse original CSV exports from old MySQL database and compute year-by-year totals.
Used for data migration validation.
"""

import csv
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple

# CSV directory
CSV_DIR = Path("/Users/michielmaandag/Downloads/RoijksuitgavenSQL/")
OUTPUT_FILE = Path("/Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven/scripts/data/validation/old-system-totals.md")

# Year range for comparable totals
YEAR_RANGE = range(2016, 2025)  # 2016-2024 inclusive

# Module configurations
MODULES = {
    'instrumenten': {
        'file': 'instrumenten.csv',
        'year_col': 'Begrotingsjaar',
        'amount_col': 'Bedrag',
        'multiplier': 1000,  # ×1000 to euros
        'unit': '×1000',
        'sub_entity_col': None
    },
    'apparaat': {
        'file': 'apparaat.csv',
        'year_col': 'Begrotingsjaar',
        'amount_col': 'Bedrag',
        'multiplier': 1000,  # ×1000 to euros
        'unit': '×1000',
        'sub_entity_col': None
    },
    'inkoop': {
        'file': 'inkoop.csv',
        'year_col': 'Jaar',
        'amount_col': 'Totaal_Avg',
        'multiplier': 1,  # already in euros
        'unit': 'euros',
        'sub_entity_col': None
    },
    'provincie': {
        'file': 'provincie.csv',
        'year_col': 'Jaar',
        'amount_col': 'Bedrag',
        'multiplier': 1,  # already in euros
        'unit': 'euros',
        'sub_entity_col': 'Provincie'
    },
    'gemeente': {
        'file': 'gemeente.csv',
        'year_col': 'Jaar',
        'amount_col': 'Bedrag',
        'multiplier': 1,  # already in euros
        'unit': 'euros',
        'sub_entity_col': 'Stad'
    },
    'publiek': {
        'file': 'publiek.csv',
        'year_col': 'Jaar',
        'amount_col': 'Bedrag',
        'multiplier': 1,  # already in euros
        'unit': 'euros',
        'sub_entity_col': 'Source'
    }
}


def parse_amount(value: str) -> float:
    """Parse amount string to float, handling decimals and empty values."""
    if not value or value.strip() == '':
        return None
    try:
        return float(value.replace(',', '.'))
    except ValueError:
        return None


def parse_year(value: str) -> int:
    """Parse year string to int."""
    if not value or value.strip() == '':
        return None
    try:
        return int(value)
    except ValueError:
        return None


def process_module(module_name: str, config: dict) -> dict:
    """Process a single module CSV and return statistics."""
    csv_path = CSV_DIR / config['file']

    if not csv_path.exists():
        return {'error': f'File not found: {csv_path}'}

    # Statistics
    total_rows = 0
    rows_in_range = 0
    rows_outside_range = 0
    null_amounts = 0

    # Year-by-year totals
    year_totals = defaultdict(lambda: {'sum_original': 0, 'sum_euros': 0, 'count': 0})

    # Sub-entity totals (if applicable)
    sub_entity_totals = defaultdict(lambda: defaultdict(lambda: {'sum_euros': 0, 'count': 0}))
    sub_entity_grand_totals = defaultdict(lambda: {'sum_euros': 0, 'count': 0})

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            total_rows += 1

            # Parse year
            year = parse_year(row.get(config['year_col'], ''))

            # Parse amount
            amount_str = row.get(config['amount_col'], '')
            amount = parse_amount(amount_str)

            if amount is None:
                null_amounts += 1
                continue

            # Track rows in/out of range
            if year and year in YEAR_RANGE:
                rows_in_range += 1
            elif year:
                rows_outside_range += 1

            # Compute totals for 2016-2024 range only
            if year and year in YEAR_RANGE:
                year_totals[year]['sum_original'] += amount
                year_totals[year]['sum_euros'] += amount * config['multiplier']
                year_totals[year]['count'] += 1

                # Sub-entity tracking
                if config['sub_entity_col']:
                    sub_entity = row.get(config['sub_entity_col'], '').strip()
                    if sub_entity:
                        amount_euros = amount * config['multiplier']
                        sub_entity_totals[sub_entity][year]['sum_euros'] += amount_euros
                        sub_entity_totals[sub_entity][year]['count'] += 1
                        sub_entity_grand_totals[sub_entity]['sum_euros'] += amount_euros
                        sub_entity_grand_totals[sub_entity]['count'] += 1

    return {
        'total_rows': total_rows,
        'rows_in_range': rows_in_range,
        'rows_outside_range': rows_outside_range,
        'null_amounts': null_amounts,
        'year_totals': dict(year_totals),
        'sub_entity_totals': dict(sub_entity_totals) if config['sub_entity_col'] else None,
        'sub_entity_grand_totals': dict(sub_entity_grand_totals) if config['sub_entity_col'] else None
    }


def format_number(num: float) -> str:
    """Format number as integer with thousand separators."""
    return f"{int(round(num)):,}"


def generate_markdown(results: dict) -> str:
    """Generate markdown report from results."""
    lines = [
        "# Old System Totals (MySQL CSV Exports)",
        "",
        "Computed from original CSV files for data migration validation.",
        "",
        f"**Source:** `/Users/michielmaandag/Downloads/RoijksuitgavenSQL/`",
        f"**Year range:** 2016-2024 (inclusive)",
        f"**Generated:** {Path(__file__).name}",
        "",
        "---",
        ""
    ]

    for module_name in ['instrumenten', 'apparaat', 'inkoop', 'provincie', 'gemeente', 'publiek']:
        config = MODULES[module_name]
        stats = results[module_name]

        if 'error' in stats:
            lines.extend([
                f"## MODULE: {module_name.upper()}",
                f"**Error:** {stats['error']}",
                ""
            ])
            continue

        lines.extend([
            f"## MODULE: {module_name.upper()}",
            f"**Unit:** {config['unit']}",
            f"**Total rows:** {format_number(stats['total_rows'])} (2016-2024: {format_number(stats['rows_in_range'])}, outside range: {format_number(stats['rows_outside_range'])})",
            f"**NULL amounts:** {format_number(stats['null_amounts'])} rows",
            ""
        ])

        # Year-by-year table
        lines.append("| Year | SUM (original unit) | SUM (euros) | Row Count |")
        lines.append("|------|---------------------|-------------|-----------|")

        grand_total_original = 0
        grand_total_euros = 0
        grand_total_count = 0

        for year in YEAR_RANGE:
            if year in stats['year_totals']:
                year_data = stats['year_totals'][year]
                sum_orig = year_data['sum_original']
                sum_eur = year_data['sum_euros']
                count = year_data['count']

                grand_total_original += sum_orig
                grand_total_euros += sum_eur
                grand_total_count += count

                lines.append(f"| {year} | {format_number(sum_orig)} | {format_number(sum_eur)} | {format_number(count)} |")
            else:
                lines.append(f"| {year} | 0 | 0 | 0 |")

        lines.append(f"| **TOTAL (2016-2024)** | **{format_number(grand_total_original)}** | **{format_number(grand_total_euros)}** | **{format_number(grand_total_count)}** |")
        lines.append("")

        # Sub-entity tables (if applicable)
        if stats['sub_entity_totals']:
            lines.extend([
                f"### Sub-Entity Breakdown: {config['sub_entity_col']}",
                ""
            ])

            # Sort by grand total descending
            sorted_entities = sorted(
                stats['sub_entity_grand_totals'].items(),
                key=lambda x: x[1]['sum_euros'],
                reverse=True
            )

            # Year columns
            year_cols = " | ".join([str(y) for y in YEAR_RANGE])
            year_sep = "|".join(["---"] * (len(YEAR_RANGE) + 3))

            lines.append(f"| {config['sub_entity_col']} | {year_cols} | **TOTAL** | Row Count |")
            lines.append(f"|---|{year_sep}|")

            for entity, grand_data in sorted_entities:
                entity_totals = stats['sub_entity_totals'][entity]
                year_values = []

                for year in YEAR_RANGE:
                    if year in entity_totals:
                        year_values.append(format_number(entity_totals[year]['sum_euros']))
                    else:
                        year_values.append("0")

                year_cols_str = " | ".join(year_values)
                total_str = format_number(grand_data['sum_euros'])
                count_str = format_number(grand_data['count'])

                lines.append(f"| {entity} | {year_cols_str} | **{total_str}** | {count_str} |")

            lines.append("")

        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def main():
    """Main execution."""
    print("Parsing CSV files...")
    print(f"CSV directory: {CSV_DIR}")
    print(f"Output file: {OUTPUT_FILE}")
    print()

    results = {}

    for module_name, config in MODULES.items():
        print(f"Processing {module_name}...")
        results[module_name] = process_module(module_name, config)

        if 'error' not in results[module_name]:
            stats = results[module_name]
            print(f"  Total rows: {stats['total_rows']:,}")
            print(f"  Rows in 2016-2024: {stats['rows_in_range']:,}")
            print(f"  NULL amounts: {stats['null_amounts']:,}")

            # Show grand total
            grand_total = sum(
                year_data['sum_euros']
                for year_data in stats['year_totals'].values()
            )
            print(f"  Grand total (2016-2024): €{grand_total:,.0f}")
        else:
            print(f"  ERROR: {results[module_name]['error']}")
        print()

    # Generate markdown
    print("Generating markdown report...")
    markdown = generate_markdown(results)

    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Write output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(markdown)

    print(f"✅ Report written to: {OUTPUT_FILE}")
    print()
    print("Key Results Summary:")
    print("=" * 60)

    for module_name in MODULES.keys():
        if module_name in results and 'error' not in results[module_name]:
            stats = results[module_name]
            grand_total = sum(
                year_data['sum_euros']
                for year_data in stats['year_totals'].values()
            )
            print(f"{module_name.upper():12} | €{grand_total:>15,.0f} | {stats['rows_in_range']:>8,} rows")

    print("=" * 60)


if __name__ == '__main__':
    main()
