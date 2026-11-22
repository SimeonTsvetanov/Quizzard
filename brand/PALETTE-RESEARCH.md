# Palette research — 2026 colour trends (read 2026-11-22)

Moni: "research the most modern colours for a palette in 2026 and build the whole palette that way".
Contrast and OKLCH numbers are computed (WCAG 2.x); pantone.com, wgsn.com and behr.com blocked direct reads, so
those facts come from search extracts of the primary pages and trade press. Mock-ups: `palette-options.png`.

## Signals
- Colour of the Year: Pantone 2026 Cloud Dancer (a soft white; 2027 not announced yet) · WGSN + Coloro 2026
  Transformative Teal, 2027 **Luminous Blue** (S/S 27 keys also Energy Orange, Pop Pink, Meadowland Green, Clay),
  2028 Radiant Earth · paint brands 2026–27: jade, khaki, celery and olive greens.
- UI reports: Figma and Adobe Express — "bright, saturated color palettes are making a comeback"; dark mode is
  standard; agency round-ups — off-white neutrals, one hyper-saturated accent used sparingly, true-black dark mode.
- Apple HIG Color (2025-12-16): colour sparingly, accent on the primary action only, light + dark variants, P3 on
  capable displays. Pinterest 2026: Persimmon `#FF5C34`, Wasabi, Frosty blue, Jade.
- Practice: tokens in OKLCH (`oklch()`, `color-mix()` widely available since 2025-11; `light-dark()` since
  2026-11-13); greys tinted very slightly toward the accent (Tailwind's tinted families, Apple's system greys).

## Candidates (logo: hat `#275373`, gold `#F9D45C`)
| | A · Luminous cobalt | B · Persimmon | C · Emerald |
|---|---|---|---|
| Accent (light) | `#1F5FFF` | `#FF6B2C` | `#00804F` |
| Text on the accent | white 5.07 | white 2.84 ✗ → near-black 6.89 | white 5.00 |
| Accent as text on `#F5F5F7` | 4.66 | 2.61 ✗ | 4.59 |
| Dark theme | fill `#1F5FFF`, text/icons `#5B9BFF` (7.58 on black) | `#FF6B2C` (7.39) | `#34D399` (10.92), dark text on it |
| Highlight | logo gold `#F9D45C` | hat navy `#275373` | logo gold `#F9D45C` |
| Trend support | WGSN Luminous Blue 2027, "Blue Hour", Apple blue | WGSN Energy Orange, Pinterest Persimmon | 2027 greens, Transformative Teal |
| Main risk | can read as "default blue"; keep hue ≤ 264 (away from violet) | fails AA as link text on light; crowds warning/danger; weak against the gold | reads as "correct answer" in a quiz; muted at AA lightness |

Semantic colours (light / dark): success `#15803D` / `#4ADE80` · warning `#B45309` / `#FFB020` · danger `#D32222` / `#FF6B60`.
Neutrals: the forge greys (already slightly cool), chroma ≤ 0.007; black stays black. Gold is a fill with dark text, never text on light.

Recommendation was A, then B, then C. **Decision: C · Emerald (Moni, 2026-11-22).**
