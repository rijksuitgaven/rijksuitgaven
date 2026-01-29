# Visual Refresh Design

**Date:** 2026-01-29
**Status:** Approved
**Scope:** Header, page background, table styling

---

## Overview

Align V1.0 visual design with the current WordPress production site. Key changes:
1. Header redesign (compact, exact colors)
2. Page background color
3. Table header and Totaal column styling

---

## 1. Header Design

### Layout: Compact 2-Row

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [🔍] Rijksuitgaven                        Support  Over ons  Contact   Profiel │
│      Snel inzicht voor krachtige analyses                              Logout  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Integraal]    [Instrum.][Prov.][Gem.][Inkoop][Publiek]    [Apparaat]          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Total height:** ~100px (vs ~140px WordPress)

### Row 1: Main Header (56px)

| Element | Specification |
|---------|---------------|
| Background | White `#FFFFFF` |
| Logo icon | 32×32px |
| Logo text | Brawler Bold, 24px, `#0E3261` |
| Tagline | IBM Plex Sans Condensed, 12px, `#E62D75` |
| Nav links | IBM Plex Sans Condensed Medium, 14px, `#0E3261` |
| Nav hover | `#436FA3` |
| Padding | 16px horizontal |

**V1.0 Launch:** Show only Profiel / Logout
**V1.1+:** Add Support, Over ons, Contact (space reserved)

### Row 2: Module Tabs (44px)

| Element | Specification |
|---------|---------------|
| Background | `#E1EAF2` (Gray Light) |
| Tab background (inactive) | `#E1EAF2` |
| Tab background (active) | White `#FFFFFF` with subtle shadow |
| Tab text | IBM Plex Sans Condensed Medium, 14px, `#0E3261` |
| Tab text (active) | Bold |
| Tab padding | 12px horizontal, 8px vertical |
| Tab border-radius | 4px |
| Normal gap | 8px |
| Gap after Integraal | 32px |
| Gap before Apparaat | 32px |

### Tab Order

```
[Integraal]  32px  [Instrumenten][Provincie][Gemeente][Inkoop][Publiek]  32px  [Apparaat]
```

**Grouping rationale:**
- **Integraal**: Cross-module discovery (entry point)
- **5 modules**: Recipient-based data sources
- **Apparaat**: Different data type (costs by category, not recipients)

### Mobile Behavior

- Tabs remain as horizontal pills
- Horizontally scrollable
- Touch/swipe to navigate

---

## 2. Page Background

| Element | Current | Target |
|---------|---------|--------|
| Body/page background | White `#FFFFFF` | `#E1EAF2` (Gray Light) |
| Content cards/panels | - | White `#FFFFFF` (for contrast) |

---

## 3. Table Styling

### Header Row

| Property | Value |
|----------|-------|
| Background | `#0E3261` (Navy Dark) |
| Text color | White `#FFFFFF` |
| Font | IBM Plex Sans Condensed Medium, 14px |
| Height | 48px |
| Padding | 12px |

### Totaal Column

| Property | Value |
|----------|-------|
| Header | Same as other headers |
| Cell background | `#D0DEEA` (subtle blue tint) |
| Cell text | Bold, `#0E3261` |

### Data Rows

| Property | Value |
|----------|-------|
| Background (odd) | White `#FFFFFF` |
| Background (even) | `#F8FAFC` (very subtle stripe) |
| Text | `#0E3261`, 14px |
| Hover | `#E1EAF2` |

---

## 4. Color Reference (Brand Identity)

| Name | Hex | Usage |
|------|-----|-------|
| Navy Dark | `#0E3261` | Headers, text, table header |
| Navy Medium | `#436FA3` | Links, hover states |
| Blue Light | `#8DBADC` | Accents |
| Pink | `#E62D75` | CTAs, tagline, active states |
| Gray Light | `#E1EAF2` | Page background, tab bar |
| Totaal tint | `#D0DEEA` | Totaal column background |

---

## 5. Implementation Files

| File | Changes |
|------|---------|
| `app/src/app/globals.css` | Page background color |
| `app/src/components/header/header.tsx` | Full redesign |
| `app/src/components/data-table/data-table.tsx` | Header row, Totaal column styling |
| `tailwind.config.ts` | Add brand colors if not present |

---

## 6. Mockup Summary

**Before (current V1.0):**
- White page background
- Generic header
- Light gray table headers

**After (WordPress match):**
- Blue-gray page background (`#E1EAF2`)
- Compact branded header with grouped tabs
- Navy table headers, emphasized Totaal column

---

**Approved:** 2026-01-29
