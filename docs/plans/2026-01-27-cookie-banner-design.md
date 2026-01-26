# Cookie Disclosure Banner - Design

**Date:** 2026-01-27
**Status:** Approved
**Scope:** V1.0

---

## Overview

Simple disclosure banner informing users that only essential cookies are used. No consent mechanism needed since essential cookies are exempt under GDPR/ePrivacy.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Banner type | Bottom bar | Non-blocking, less intrusive |
| Consent mechanism | None | Essential cookies only, no consent required |
| Persistence | localStorage | Simple, no server-side tracking needed |
| Re-display | Never | Disclosure only, not consent |
| Fonts | Self-hosted via next/font | Eliminates Google Fonts data transfer |

---

## Requirements

### What V1.0 Uses (Essential Only)

| Cookie/Storage | Purpose | Essential? |
|----------------|---------|------------|
| Supabase auth session | Login state | Yes |
| localStorage preferences | Column settings, UI state | Yes |
| cookie-banner-dismissed | Remember banner dismissal | Yes |

### What V1.0 Does NOT Use

- Google Analytics (deferred to backlog)
- Marketing/advertising cookies
- Third-party tracking
- External font loading (self-hosted)

---

## Visual Design

### Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🍪 Deze website gebruikt alleen noodzakelijke cookies voor het functioneren  │
│    van de site. Meer informatie in ons [Privacybeleid].              [OK]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Styling

| Element | Value |
|---------|-------|
| Background | Navy Dark (#0E3261) |
| Text color | White (#FFFFFF) |
| Link style | White, underlined |
| Button background | Primary Pink (#E62D75) |
| Button text | White |
| Position | Fixed, bottom: 0, width: 100% |
| Padding | 12px 24px |
| Z-index | 50 |
| Shadow | `0 -2px 10px rgba(0,0,0,0.1)` |

### Mobile Behavior

- Same layout, text wraps naturally
- Button inline if space allows, stacks below on narrow screens (<400px)
- Minimum touch target: 44x44px for OK button

---

## Behavior

### Display Logic

1. On page load: Check `localStorage.getItem('cookie-banner-dismissed')`
2. If key does not exist: Show banner with fade-in animation (150ms)
3. If key exists: Do not render banner

### User Interactions

| Action | Result |
|--------|--------|
| Click "OK" | Set localStorage key, fade out banner (150ms) |
| Click "Privacybeleid" | Navigate to `/privacybeleid`, banner remains |
| Scroll/interact with page | Banner stays visible until dismissed |

### Persistence

- **Storage:** `localStorage.setItem('cookie-banner-dismissed', 'true')`
- **Expiry:** None (persists until browser data cleared)
- **Re-display:** Never automatically

---

## Implementation

### File Structure

```
app/
├── components/
│   └── cookie-banner.tsx    # Banner component
├── layout.tsx               # Import banner (global)
└── privacybeleid/
    └── page.tsx             # Privacy policy page
```

### Component Code

```typescript
// app/components/cookie-banner.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie-banner-dismissed'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check on client side only (localStorage not available during SSR)
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0E3261] text-white px-6 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] animate-fade-in"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">
          🍪 Deze website gebruikt alleen noodzakelijke cookies voor het functioneren van de site.{' '}
          Meer informatie in ons{' '}
          <Link href="/privacybeleid" className="underline hover:no-underline">
            Privacybeleid
          </Link>.
        </p>
        <button
          onClick={handleDismiss}
          className="bg-[#E62D75] hover:bg-[#c4245f] text-white px-4 py-2 rounded text-sm font-medium transition-colors min-w-[44px] min-h-[44px]"
        >
          OK
        </button>
      </div>
    </div>
  )
}
```

### Layout Integration

```typescript
// app/layout.tsx
import { CookieBanner } from '@/components/cookie-banner'

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
```

### Self-Hosting Fonts

```typescript
// app/layout.tsx
import { IBM_Plex_Sans_Condensed } from 'next/font/google'

const ibmPlexSansCondensed = IBM_Plex_Sans_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans-condensed',
})

// Note: Brawler may need local hosting if not available in next/font
// Check availability, otherwise download and use localFont()
```

Next.js `next/font` automatically downloads fonts at build time and serves them from your domain - no external requests to Google.

---

## Animation

Add to Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
}
```

---

## Testing Checklist

- [ ] Banner appears on first visit
- [ ] Banner does not appear after clicking OK
- [ ] Banner does not appear on page refresh after dismissal
- [ ] Privacybeleid link works (navigates without dismissing)
- [ ] OK button meets 44x44px touch target
- [ ] Responsive: banner looks good on mobile (320px) to desktop (1920px)
- [ ] Z-index: banner appears above page content
- [ ] Animation: smooth fade-in on appear

---

## Future: Adding Analytics (V1.1+)

When analytics is added, this simple disclosure banner should be replaced with a proper consent mechanism:

1. Replace `cookie-banner.tsx` with consent component
2. Add cookie categories (Essential, Statistics)
3. Add consent logging to Supabase
4. Block analytics scripts until consent given

The current component is isolated and easy to replace.

---

## Privacy Policy Page

The `/privacybeleid` page needs to exist. Content should include:

- What data is collected (minimal: IP address in server logs, auth data)
- What cookies are used (Supabase session)
- No third-party sharing
- Contact information
- Rights under GDPR (access, deletion, etc.)

**Note:** Actual privacy policy text is a legal document - recommend having it reviewed or using the existing WordPress policy text as a starting point.

---

## Document History

| Date | Change |
|------|--------|
| 2026-01-27 | Initial design approved |
