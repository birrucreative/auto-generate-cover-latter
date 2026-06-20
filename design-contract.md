# Design Contract — Upwork Job Scraper

AESTHETIC: Editorial / minimal-luxury, anchored on Stripe, Mintlify, and editorial
publications. Light-first, airy, premium. Calm surfaces, confident typography,
restrained use of color. Data is dense but never cramped.

TYPE: **Instrument Serif** (display / headlines) · **Geist Sans** (body / UI) ·
**JetBrains Mono** (numbers, budgets, timestamps, ids). Max 4 sizes per screen,
body line-height ≥ 1.5.

COLOR (OKLCH): Warm off-white canvas `oklch(0.99 0.004 95)`, ink-slate text
`oklch(0.24 0.02 255)`, single refined **emerald** accent `oklch(0.60 0.12 165)`
(deliberately more teal/muted than Upwork's brand green — used for < 10% of UI:
primary actions, the verified check, active states). Neutrals are warm-slate, never
muddy. No gradients except an optional whisper-soft canvas vignette.

MOTION: Soft / organic. ease-out on enter, gentle fades and 4–8px rises. Durations
160–280ms for UI, ≤ 420ms for layout. Respect `prefers-reduced-motion`.

DENSITY & RHYTHM: Generous editorial spacing on the page frame; tighter, scannable
rhythm inside job cards. Base spacing unit 4px. Border-radius soft (10–14px).

FORBIDDEN:
- Upwork brand green `#14a800`, Upwork logo, or any Upwork wordmark styling (ToS).
- Inter as primary font.
- Generic purple / indigo→pink SaaS gradients.
- Muddy neutrals, pure black, more than one accent hue.
- Storing scraped job data beyond what's needed (mirror Upwork's 24h caching ToS in
  copy where the user persists data).
