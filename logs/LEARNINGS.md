# Session Learnings

Accumulated learnings from development sessions. These are hard-won insights — patterns that prevent mistakes and accelerate future work.

**Last Updated:** 2026-02-13

---

## Design & UX

### Brand Font Consistency
**Learning:** Homepage used Libre Franklin weight 800 for all headings while the post-login experience used Brawler (serif). This made the homepage feel like a generic SaaS template instead of the branded product. **Always apply brand fonts consistently across all pages — homepage, login, app.**

**Brawler specifics:** Only weights 400 and 700 are available (not 800). When applying Brawler, convert `font-[800]` to `font-bold` (weight 700). Syntax: `style={{ fontFamily: 'var(--font-heading), serif' }}`.

### Section Ordering Psychology
**Learning:** Information architecture matters for conversion. B2G (enterprise) content should NOT be the second thing visitors see — it's a specialist pitch for a subset audience. The optimal order for a SaaS homepage selling to government:

1. **Hero** — Hook with the core question
2. **Trust bar** — Establish credibility with data metrics
3. **Audience** — Show who it's for (different personas)
4. **Features** — What it does
5. **Pricing** — How much
6. **Enterprise/B2G** — Specialist pitch
7. **Contact** — Capture leads

### Dead-End Moments = Wasted Conversion
**Learning:** Promotional boxes like "Er valt nog veel meer te ontdekken!" with no CTA are dead ends at the moment of peak visitor interest. Replace with data metrics + action button. Every section should either build trust or capture intent.

### Outcome-First Copy
**Learning:** Feature descriptions should lead with the user benefit, not the product capability. Bad: "6 databronnen doorzoekbaar." Good: "In seconden overzicht in zes databronnen." The user's outcome comes first.

### Formal Dutch (u/uw) Consistency
**Learning:** Mixing informal (je/jouw) and formal (u/uw) Dutch breaks trust, especially for government audiences. Apply u/uw everywhere — search the entire codebase for "je " and "jouw " after any Dutch text change.

---

## Technical — Parallel Edits

### Non-Unique String Matching in Batch Edits
**Learning:** When doing parallel edits to a large file, if any single edit's `old_string` matches multiple locations in the file, that edit fails — AND all sibling parallel edits in the same batch also fail with "Sibling tool call errored." This cascading failure means all 14 edits fail even though only 1 had an issue.

**Prevention:** For large batch edits:
1. Include enough surrounding context (e.g., the `icon=` prop line above a description) to ensure unique matching
2. If strings appear in multiple sections (e.g., same text in hero AND B2G), use unique neighboring context
3. After a cascade failure, re-read the file before retrying — the first edit in the batch may have succeeded

---

## Technical — CSS & Animations

### Scroll Reveal Variants
**Learning:** Two scroll-reveal animation types serve different purposes:
- `.scroll-reveal` — translateY(24px) + opacity for standard content sections
- `.scroll-reveal-scale` — scale(0.96) + opacity for compact elements (trust bar, badges)

Both use IntersectionObserver with `threshold: 0.15` and fire once. The cubic-bezier `0.2, 1, 0.2, 1` creates a spring-like easing.

### Stagger Children Pattern
**Learning:** For sequential reveal of sibling elements, use `.stagger-children > .scroll-reveal:nth-child(N)` with 100ms delay increments. Supports up to 6 children. No JavaScript needed — pure CSS transition-delay.

---

## Process

### Marketing Team Analysis Model
**Learning:** For homepage/landing page work, assembling a virtual expert team (Creative Strategist, Performance Marketer, Brand Designer, Copywriter, UX Specialist, Web Designer, Information Architect) and having them discuss in character produces significantly better results than a single-perspective analysis. Each expert catches blind spots the others miss. Key roles:
- **Information Architect** catches section ordering issues
- **Copywriter** fixes passive/feature-first language
- **Brand Designer** catches font/color inconsistencies
- **Performance Marketer** identifies dead-end moments without CTAs

### Brief Structure
**Learning:** Splitting homepage work into two briefs works well:
- **Brief 1:** "Bring current to next level" (evolutionary, implements immediately)
- **Brief 2:** "Fully out of the box" (revolutionary, discusses separately)

This prevents scope creep while still capturing ambitious ideas for the backlog.

---

## Architecture

### Public vs Authenticated Pages
**Learning:** The homepage needs to work without authentication. The `page.tsx` root page conditionally renders `PublicHomepage` (unauthed) or `ModuleHub` (authed) based on session state. The middleware must allow public page routes through without redirect.

### Contact Form CRM Integration
**Learning:** Public forms (no auth) should always:
1. Store in database first (primary — never lose data)
2. Send email notification second (secondary — non-blocking, `catch` on error)
3. Validate server-side: email regex, field length limits, body size limit
4. Upsert on email: existing contacts get updated notes, not duplicated
5. Use `request.text()` for body size check, never trust Content-Length header

---
