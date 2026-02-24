# In-App Release Banner Design

**Date:** 2026-02-24
**Status:** Approved
**UX Number:** TBD (assign at implementation)

---

## Problem

Users don't know about new enhancements unless they visit `/versiegeschiedenis`. When a user logs in after days or weeks away, they may have missed several improvements. There's no mechanism to surface these.

## Solution

A dismissible banner below the header that shows new enhancements since the user's last visit. The banner is non-blocking, uses a familiar pattern (like `SubscriptionBanner`), and links to `/versiegeschiedenis` for full details.

---

## Data Structure

```typescript
// lib/release-notes.ts
export interface ReleaseNote {
  date: string    // ISO date: '2026-02-24'
  version: string // 'V2.0.2'
  title: string   // Short, benefit-first (Dutch, formal u/uw)
  summary: string // One sentence explaining the improvement
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    date: '2026-02-24',
    version: 'V2.0.2',
    title: 'Sorteren van hoog naar laag',
    summary: 'Eerste klik sorteert nu van hoog naar laag.',
  },
  // Newest first. Add entries when deploying user-facing features.
]
```

**Separate from versiegeschiedenis:** The banner items are short one-liners. The `/versiegeschiedenis` page has detailed paragraphs with context. These are maintained separately. A CLAUDE.md rule ensures both are updated together.

## Seen Tracking

- **localStorage key:** `rn-last-seen`
- **Value:** ISO date string of the newest release the user has seen (e.g., `"2026-02-24"`)
- **On dismiss:** writes the newest release's date
- **On mount:** filters `RELEASE_NOTES` where `date > stored date`
- **No localStorage (first visit):** shows all releases; after dismiss, caught up
- **User clears browser data:** sees banner again — harmless

## Banner Display

### 1 enhancement

```
┌──────────────────────────────────────────────────────────────┐
│  Nieuw: Sorteren van hoog naar laag                    [✕]  │
└──────────────────────────────────────────────────────────────┘
```

Title only. Clicking text links to `/versiegeschiedenis`.

### 2-3 enhancements

```
┌──────────────────────────────────────────────────────────────┐
│  2 verbeteringen sinds uw laatste bezoek:                    │
│  Sorteren van hoog naar laag · Zoeken met exacte zinnen      │
│                                    Bekijk alles →      [✕]  │
└──────────────────────────────────────────────────────────────┘
```

Count + titles joined with `·`. "Bekijk alles" links to `/versiegeschiedenis`.

### 4+ enhancements

```
┌──────────────────────────────────────────────────────────────┐
│  5 verbeteringen sinds uw laatste bezoek                     │
│  Sorteren van hoog naar laag · Zoeken met exacte zinnen      │
│  en 3 meer                         Bekijk alles →      [✕]  │
└──────────────────────────────────────────────────────────────┘
```

Shows 2 newest titles + "en X meer". Always links to `/versiegeschiedenis`.

## Styling

- Background: `bg-blue-50 border-b border-blue-200` (light blue, distinct from amber subscription banner)
- Layout: same pattern as `SubscriptionBanner` — `max-w-7xl mx-auto px-4 sm:px-6 py-2.5`
- Dismiss button: right-aligned `[✕]`
- Text: `text-sm text-blue-800`
- Link: `font-medium underline hover:no-underline`

## Component Placement

```
AppShell (logged-in):
  <Header />
  <ReleaseBanner />         ← new
  <SubscriptionBanner />    ← existing
  {children}
  <FeedbackButton />
  <MobileBanner />
```

## Component Logic

```
ReleaseBanner mount:
  1. Read localStorage('rn-last-seen')
  2. Filter RELEASE_NOTES where date > lastSeen
  3. If 0 unseen → render null
  4. If 1+ unseen → render banner
  5. On dismiss → localStorage.set('rn-last-seen', newest date) → hide
```

## Files

| File | Action |
|------|--------|
| `lib/release-notes.ts` | Create — data array + types |
| `components/release-banner/release-banner.tsx` | Create — banner component |
| `components/app-shell/app-shell.tsx` | Modify — add `<ReleaseBanner />` after Header |
| `CLAUDE.md` | Modify — add versiegeschiedenis sync rule |

## Edge Cases

| Case | Behavior |
|------|----------|
| First-time user (no localStorage) | Shows all releases. Dismiss catches up. |
| User clears browser data | Sees banner again. Harmless. |
| No releases in array | Renders nothing. |
| SubscriptionBanner also showing | Both banners stack (release on top, subscription below). |

## CLAUDE.md Rule (to add)

> **Release banner sync:** When updating `/versiegeschiedenis`, also add a short banner entry to `lib/release-notes.ts` with `date`, `version`, `title`, and `summary`.

## Infrastructure

- Zero server calls
- Zero database changes
- Zero migrations
- Pure client-side component
