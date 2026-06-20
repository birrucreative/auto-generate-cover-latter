# Ship Report — Jobseeker (Upwork Job Scraper UI)

## Phase 1 — Design Contract
**Editorial Emerald**, light-first. Anchored on Stripe / editorial publications.
- **Type:** Instrument Serif (display) · Geist Sans (body) · Geist Mono (numbers).
- **Color (OKLCH):** warm off-white canvas, ink-slate text, single refined emerald
  accent `oklch(0.60 0.12 165)` — deliberately more teal/muted than Upwork's brand
  green, used for < 10% of the UI.
- **Motion:** soft / organic, ease-out, 160–280ms.
- **Forbidden:** Upwork green `#14a800`, Upwork logo/wordmark (ToS), Inter, purple
  SaaS gradients, muddy neutrals. See `design-contract.md`.

## Phase 2 — Components
shadcn (new-york): button, card, input, label, badge, switch, select, dialog,
tabs, sonner, skeleton, tooltip, separator, slider, dropdown-menu, scroll-area,
textarea, sheet, toggle-group. Custom: `site-header`, `filters-bar`, `job-card`,
`job-details-dialog`, `bookmarks-view`, `auto-refresh`, `dashboard`, `theme-*`,
`motion-grid`. Dark mode via `next-themes`. Build passes, zero console errors.

## Phase 3 — Design Audit (self-scored ≈ 90/100)
- Typography ✓ one display + one body + mono for figures, ≤4 sizes/screen.
- Spacing ✓ 4px scale, consistent rhythm; cards dense, frame generous.
- Color ✓ AA contrast, accent < 10%, no muddy neutrals.
- Hierarchy ✓ one primary CTA (Search), serif headline anchors the F-pattern.
- States ✓ loading skeletons, empty states (results + saved), error + 429 toasts.
- P2 nits (deferred): no virtualization for very large result sets; category
  filter is client-side string-match (ontology-id lookup is a future enhancement).

## Phase 4 — Motion
`motion` (framer-motion) for results-grid fade+rise stagger and layout transitions
when new jobs prepend during polling. Hover lift on cards, animated filter-panel
expand, spinner on poll/refresh, ping on the demo badge. Honors
`prefers-reduced-motion` (CSS kill-switch + `useReducedMotion`).

## Phase 5 — Browser QA (Playwright, real Chromium)
Captured desktop light, filters-open, job-details dialog, saved tab, desktop dark,
and mobile (390px). Verified golden path: search → filter → open details → save →
Saved tab (persisted, status dropdown, note, export, toast). **0 console errors,
0 page errors.** Light + dark + mobile all render correctly.

## Verification
- `npx tsc --noEmit` → clean.
- `npx next build` → success, 11 routes.
- Backend smoke-tested live: demo search + filtering, polling fresh-job injection,
  bookmark add/list, CSV export (BOM + RFC-4180).
