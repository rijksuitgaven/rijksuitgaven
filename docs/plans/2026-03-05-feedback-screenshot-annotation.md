# Design: Feedback Screenshot + Annotation

**Date:** 2026-03-05
**Status:** Approved
**Replaces:** "Markeer op de pagina" element picker in feedback widget

## Summary

Replace the element picker ("Markeer op de pagina") in the feedback widget with a viewport screenshot + annotation tool. Users can capture their current screen, draw on it (freehand pen, rectangles, arrows), and attach the annotated screenshot to their feedback.

## User Flow

1. User opens feedback modal, picks category, types message
2. Clicks **"Screenshot maken"** (replaces "Markeer op de pagina")
3. Modal hides → brief delay for repaint → html2canvas captures visible viewport
4. Full-screen annotation canvas appears with the screenshot
5. Top toolbar: **Pen** (default) | **Rechthoek** | **Pijl** | **Ongedaan maken** | **Annuleren** | **Klaar**
6. User draws annotations in brand pink (`#E62D75`)
7. Clicks "Klaar" → canvas flattens to PNG → returns to form with thumbnail preview
8. User submits as normal

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Capture method | Viewport (not region-select) | Industry standard (Marker.io, Usersnap, BugHerd). Drawing tools serve as region highlighting. |
| Annotation library | Vanilla Canvas API | Only 3 tools needed. Zero bundle impact. ~200 lines. |
| Annotation color | `#E62D75` (brand pink) | Single color, no picker. Consistent with brand. |
| Default tool | Pen (freehand) | Most intuitive starting point |
| Hide modal during capture | Yes | Screenshot shows what user was looking at, not the feedback form |
| Empty annotation | Allowed | User may just want a plain screenshot without drawing |

## Annotation Tools

| Tool | Interaction | Visual |
|------|------------|--------|
| Pen | Mousedown → drag → mouseup | Smooth path, 3px stroke, pink |
| Rechthoek | Mousedown → drag → mouseup | Outlined rectangle, 2px stroke, pink, no fill |
| Pijl | Mousedown → drag → mouseup | Line with arrowhead at endpoint, 2px, pink |

## Technical Details

### Screenshot Capture

```typescript
// 1. Hide modal
setState('screenshotting')
// 2. Double rAF for DOM repaint
await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
// 3. Capture via html2canvas
const canvas = await html2canvas(document.body, {
  width: window.innerWidth,
  height: window.innerHeight,
  x: window.scrollX,
  y: window.scrollY,
})
// 4. Show annotation canvas
setState('annotating')
```

### Stroke Model

```typescript
type Stroke =
  | { tool: 'pen'; points: { x: number; y: number }[] }
  | { tool: 'rect'; start: { x: number; y: number }; end: { x: number; y: number } }
  | { tool: 'arrow'; start: { x: number; y: number }; end: { x: number; y: number } }
```

### Canvas Architecture

- Two stacked canvases: bottom = screenshot (read-only), top = drawing layer
- Undo: pop last stroke, clear drawing canvas, replay remaining strokes
- "Klaar": merge both canvases via `drawImage`, export as PNG dataURL

### Arrow Rendering

Line + triangular head (12px, 30-degree angle) via standard `lineTo` geometry.

## File Changes

### Modified
- **`feedback-button.tsx`** — Remove element picker (marking mode, mousemove, highlight rect, `getSelector()`, `getElementLabel()`). Add screenshotting/annotating states. Wire up AnnotationCanvas component.

### New
- **`annotation-canvas.tsx`** — Full-screen annotation overlay (~200 lines). Receives screenshot canvas, returns annotated PNG via callback.

### Unchanged
- All API routes (`/api/v1/feedback`, `/api/v1/team/feedback`, `/api/v1/team/feedback/[id]`)
- Database schema (element metadata fields stay but won't be populated)
- Admin feedback page (`/team/feedback`)
- Supabase storage bucket (`feedback-screenshots`)

## State Flow

**New:**
```
idle → form → screenshotting → annotating → form (with screenshot) → sending → success
```

**Old (removed):**
```
idle → form → marking → capturing → form (with marked element) → sending → success
```

## Edge Cases

| Case | Handling |
|------|---------|
| html2canvas fails | Toast: "Screenshot kon niet worden gemaakt", return to form (text-only feedback still works) |
| User draws nothing, clicks "Klaar" | Valid — plain screenshot attached |
| Open dropdowns/popovers | html2canvas captures them (they're in the DOM) |
| Escape key during annotation | Same as "Annuleren" — back to form without screenshot |
| Very wide/tall screens | Viewport-bounded, predictable size, within 10MB upload limit |

## Toolbar UI

Centered floating bar, dark background (`var(--navy-dark)`), white text/icons:

```
┌──────────────────────────────────────────────────────────┐
│  ✏️ Pen  │  ▭ Rechthoek  │  ↗ Pijl  │  ↩ Ongedaan  │  ✕  │  ✓ Klaar  │
└──────────────────────────────────────────────────────────┘
```

- Active tool: pink highlight ring
- Undo: grayed out when no strokes
- Touch support via Pointer Events API
