# Wireframe: Header & Navigation

**Date:** 2026-01-23
**Status:** Approved
**Related:** [Main Search Page](./01-main-search-page.md), [Current UI Overview](../../03-wordpress-baseline/current-ui-overview.md)

---

## Purpose

The header provides consistent navigation across all pages. Users can:
- Access main sections of the platform
- Switch between modules
- Access profile and settings
- Quickly focus search bar via keyboard shortcut

---

## Layout

### Desktop Header (1200px+)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  [Logo] Rijksuitgaven     Zoeken ▾   Inzichten   Support ⓘ   Over ons   Contact │
│         Snel inzicht...                BETA                                     │
│                                                                     Profiel ▾   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Desktop Module Tabs (below header)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Financiële    ] [Apparaats-  ] [Provinciale  ] [Gemeentelijke] [Inkoop-      ] │
│ [Instrumenten ●] [uitgaven    ] [subsidie...  ] [subsidie...  ] [uitgaven     ] │
│                                                                                 │
│ [Publiek       ] [Integraal   ]                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Tablet Header (768px - 1199px)

```
┌─────────────────────────────────────────────────┐
│ [Logo] Rijksuitgaven              [☰ Menu] [👤] │
└─────────────────────────────────────────────────┘

Module tabs (horizontal scroll if needed):
┌─────────────────────────────────────────────────┐
│ ← [Integraal] [Fin. Instr.] [Apparaat] [Prov..] → │
└─────────────────────────────────────────────────┘
```

**Note:** Tabs remain visible on tablet (scrollable). Only mobile uses dropdown.

### Mobile Header (< 768px)

```
┌─────────────────────────────┐
│ [Logo]            [☰] [👤]  │
└─────────────────────────────┘
```

---

## Components

### 1. Logo

**Current:** "Rijksuitgaven" with magnifying glass icon and tagline
**Tagline:** "Snel inzicht voor krachtige analyses"

| State | Behavior |
|-------|----------|
| Click | Navigate to home/search page |
| Hover | Subtle opacity change |

**Design:**
- Logo color: Pink (#E62D75)
- Tagline: Gray (#666666), smaller font

---

### 2. Main Navigation Items

| Item | Type | Behavior |
|------|------|----------|
| Zoeken | Dropdown | Shows module quick links |
| Inzichten BETA | Link | Navigate to insights page |
| Support | Link with icon | Navigate to help/support |
| Over ons | Link | Navigate to about page |
| Contact | Link | Navigate to contact page |

**Zoeken Dropdown:**
```
┌─────────────────────────────┐
│ MODULES                     │
│ ├ Financiële Instrumenten   │
│ ├ Apparaatsuitgaven         │
│ ├ Provinciale subsidie...   │
│ ├ Gemeentelijke subsidie... │
│ ├ Inkoopuitgaven            │
│ ├ Publiek                   │
│ └ Integraal                 │
├─────────────────────────────┤
│ Sneltoets: ⌘/ voor zoeken   │
└─────────────────────────────┘
```

---

### 3. Profile Dropdown

**Trigger:** Click "Profiel ▾" or user avatar

```
┌─────────────────────────────┐
│ Jan de Vries                │
│ jan@example.com             │
├─────────────────────────────┤
│ Mijn account                │
│ Instellingen                │
│ Opgeslagen zoekopdrachten   │
├─────────────────────────────┤
│ Uitloggen                   │
└─────────────────────────────┘
```

| Item | Behavior |
|------|----------|
| Mijn account | Navigate to account page |
| Instellingen | Navigate to settings (column preferences, etc.) |
| Opgeslagen zoekopdrachten | Navigate to saved searches |
| Uitloggen | Log out, redirect to login page |

---

### 4. Module Tabs

**Location:** Below main header, above search bar
**Purpose:** Quick switching between data modules

| State | Style |
|-------|-------|
| Active | Navy background (#0E3261), white text |
| Inactive | White background, dark text |
| Hover | Light gray background |
| With results | Badge showing count (when searching) |

**Tab with results badge:**
```
┌────────────────────────┐
│ Financiële Instrumenten│
│                   (890)│
└────────────────────────┘
```

**Behavior:**
- Click → Filter results to that module
- Badge appears during cross-module search
- Active tab indicated by background color

---

### 5. Mobile Menu (Hamburger)

**Trigger:** Click ☰ icon on tablet/mobile

```
┌─────────────────────────────────────────┐
│ MENU                           [Sluiten]│
├─────────────────────────────────────────┤
│                                         │
│ MODULES                                 │
│ ▸ Financiële Instrumenten               │
│ ▸ Apparaatsuitgaven                     │
│ ▸ Provinciale subsidieregisters         │
│ ▸ Gemeentelijke subsidieregisters       │
│ ▸ Inkoopuitgaven                        │
│ ▸ Publiek                               │
│ ▸ Integraal                             │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ Inzichten BETA                          │
│ Support                                 │
│ Over ons                                │
│ Contact                                 │
│                                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Slides in from right (or full-screen overlay)
- Click outside or "Sluiten" to close
- Tapping item navigates and closes menu

---

## Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Go home | Click logo | Navigate to search page |
| Switch module | Click tab | Filter to that module |
| Open menu | Click ☰ (mobile) | Show mobile menu |
| Open profile | Click Profiel ▾ | Show profile dropdown |
| Focus search | Press ⌘/ or Ctrl+/ | Focus search bar input |

---

## States

### Logged In
- Shows: Profile dropdown with user name
- Access: All navigation items

### Logged Out
- Shows: "Login" button instead of Profile
- Access: Limited (redirect to login for protected pages)

### Page-Specific
- Search page: Module tabs visible
- Other pages (Support, About): Module tabs hidden

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘/ (Mac) or Ctrl+/ (Win) | Focus search bar |
| Escape | Close any open dropdown |

**Display:** Show hint in Zoeken dropdown: "Sneltoets: ⌘/ voor zoeken"

---

## Responsive Breakpoints

| Breakpoint | Header Changes |
|------------|----------------|
| ≥1200px | Full navigation, horizontal tabs |
| 768-1199px | Hamburger menu, horizontal tabs (scrollable) |
| <768px | Compact header, hamburger menu, module dropdown |

**Decision (2026-01-23):** Tabs stay visible on desktop AND tablet. Dropdown only on mobile phones. Rationale: Single-click access is important for frequent module switching.

---

## Design Tokens

**Reference:** `02-requirements/brand-identity.md` (authoritative source)

### Colors (Brand Identity)
| Element | Color |
|---------|-------|
| Header background | White (#FFFFFF) |
| Logo accent | Pink (#E62D75) |
| Active tab | Navy Dark (#0E3261) |
| Text | Navy Dark (#0E3261) |
| Secondary text | Navy Medium (#436FA3) |
| Hover background | Gray Light (#E1EAF2) |

### Typography (Brand Identity)
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Logo text | Brawler | 24px | Bold |
| Tagline | IBM Plex Sans Condensed | 12px | Regular |
| Nav items | IBM Plex Sans Condensed | 14px | Medium |
| Tab labels | IBM Plex Sans Condensed | 14px | Medium |

### Spacing
| Element | Value |
|---------|-------|
| Header height | 64px |
| Tab bar height | 48px |
| Nav item padding | 16px horizontal |
| Logo margin-right | 32px |

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard navigation | Tab through nav items, Enter to select |
| ARIA labels | aria-label on icon-only buttons |
| Focus indicators | Visible outline on focused items |
| Skip link | "Skip to main content" for screen readers |
| Mobile menu | Focus trap when open |

---

## Open Questions

None - design follows current UI patterns.

---

## Next Steps

1. Review and approve
2. Proceed to Search Bar with Autocomplete wireframe

---

**Document Status:** Approved - Implemented with modifications

**Implementation Note (2026-02-11):** Profile dropdown pattern implemented as UX-026. Replaces the original "Profiel ▾" text dropdown design with an industry-standard user icon + chevron pattern (matches Stripe, Linear, Notion). See `02-requirements/search-requirements.md` UX-026 for full specification. Footer logout removed — now contained in profile dropdown only.
