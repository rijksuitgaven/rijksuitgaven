# Brand Identity - Rijksuitgaven.nl

**Source:** `brand book.png`
**Last Updated:** 2026-02-13

---

## Logo

**Text:** Rijksuitgaven
**Tagline:** Snel inzicht voor krachtige analyses
**Icon:** Magnifying glass with "1 EURO" coin

---

## Typography

### Public Pages & Module Hub — IBM Plex Sans

| Weight | Font |
|--------|------|
| Regular (400) | IBM Plex Sans Regular |
| Medium (500) | IBM Plex Sans Medium |
| SemiBold (600) | IBM Plex Sans SemiBold |
| Bold (700) | IBM Plex Sans Bold |

**Usage:** Homepage, login, privacybeleid, verlopen, module hub (authenticated homepage). Regular width for marketing and navigation contexts.

### Data Pages (Logged-in) — IBM Plex Sans Condensed

| Weight | Font |
|--------|------|
| Regular (400) | IBM Plex Sans Condensed Regular |
| Medium (500) | IBM Plex Sans Condensed Medium |
| SemiBold (600) | IBM Plex Sans Condensed SemiBold |
| Bold (700) | IBM Plex Sans Condensed Bold |

**Usage:** Module data tables, team admin pages, profiel, detail panel. Condensed width optimized for data-dense tables with 9 year-columns at 95px.

**Note:** Both are Google Fonts (free). Same typeface family (IBM Plex), two widths — seamless visual transition between contexts. Changed from Libre Franklin on 2026-02-13 — Libre Franklin was too wide for data tables.

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Navy Dark | `#0E3261` | 14, 50, 97 | Headers, footer, primary text |
| Navy Medium | `#436FA3` | 67, 111, 163 | Links, secondary elements |
| Blue Light | `#8DBADC` | 141, 186, 220 | Hover states, backgrounds |
| **Pink (Primary)** | `#E62D75` | 230, 45, 117 | CTAs, toggles, active states |
| Gray Light | `#E1EAF2` | 225, 234, 242 | Backgrounds, disabled states |

### Status Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Green | `#85C97D` | 133, 201, 125 | Success, positive trends |
| Yellow | `#FFC857` | 255, 200, 87 | Warning, attention |
| Red | `#E30101` | 227, 1, 1 | Error, negative trends |

### Table & Chart Colors (Supplementary)

#### Blues
| Hex | Usage |
|-----|-------|
| `#4E8098` | Chart blue 1 |
| `#8D99AE` | Chart blue 2 |
| `#D0DEEA` | Chart blue 3 |
| `#E1EAF2` | Chart blue 4 (same as Gray Light) |
| `#175997` | Chart blue 5 |
| `#F3A3C1` | Chart pink 1 |
| `#F4C5D9` | Chart pink 2 |

#### Yellows/Golds
| Hex | Usage |
|-----|-------|
| `#B5891D` | Chart gold 1 |
| `#FFC857` | Chart gold 2 (same as Warning) |
| `#FAE49B` | Chart gold 3 |

#### Greens
| Hex | Usage |
|-----|-------|
| `#2C7A3D` | Chart green 1 |
| `#1F5231` | Chart green 2 |
| `#85C97D` | Chart green 3 (same as Success) |

---

## Design Tokens (for Development)

```css
:root {
  /* Primary */
  --color-navy-dark: #0E3261;
  --color-navy-medium: #436FA3;
  --color-blue-light: #8DBADC;
  --color-pink: #E62D75;
  --color-gray-light: #E1EAF2;

  /* Status */
  --color-success: #85C97D;
  --color-warning: #FFC857;
  --color-error: #E30101;

  /* Typography */
  --font-body: 'IBM Plex Sans', sans-serif;            /* weights 400-700, global default */
  --font-heading: var(--font-body);                    /* same as body */
  --font-condensed: 'IBM Plex Sans Condensed', sans-serif; /* weights 400-700, data pages */
}
```

---

## Usage Guidelines

### Buttons

| Type | Background | Text |
|------|------------|------|
| Primary CTA | `#E62D75` (Pink) | White |
| Secondary | `#0E3261` (Navy) | White |
| Tertiary | Transparent | `#436FA3` (Navy Medium) |

### Interactive States

| State | Color |
|-------|-------|
| Default | `#0E3261` |
| Hover | `#436FA3` |
| Active/Selected | `#E62D75` |
| Disabled | `#E1EAF2` |

### Data Visualization

- Use supplementary chart colors for multi-series data
- Status colors for trend indicators (green = up, red = down)
- Maintain sufficient contrast for accessibility

---

## Accessibility Notes

- Navy (`#0E3261`) on white: WCAG AAA compliant
- Pink (`#E62D75`) on white: WCAG AA compliant (large text only)
- Always pair pink with sufficient contrast backgrounds
- Status colors meet WCAG AA for icons/indicators

---

**Reference:** See `brand book.png` for visual reference.
