# Brand Identity - Rijksuitgaven.nl

**Source:** `brand book.png`
**Last Updated:** 2026-01-23

---

## Logo

**Text:** Rijksuitgaven
**Tagline:** Snel inzicht voor krachtige analyses
**Icon:** Magnifying glass with "1 EURO" coin

---

## Typography

### Headings & Logo

| Weight | Font |
|--------|------|
| Regular | Brawler Regular |
| Bold | Brawler Bold |

### Body Text & UI

| Weight | Font |
|--------|------|
| Regular | IBM Plex Sans Condensed Regular |
| Medium | IBM Plex Sans Condensed Medium |
| Bold | IBM Plex Sans Condensed Bold |

**Note:** IBM Plex Sans Condensed is a Google Font (free). Brawler may require licensing.

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
  --font-heading: 'Brawler', serif;
  --font-body: 'IBM Plex Sans Condensed', sans-serif;
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
