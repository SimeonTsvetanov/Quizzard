# Quizzard brand — draft (2026-11-22)

Vector redraw of the existing wizard (Moni: keep the character). Traced from
`Quizzard/src/shared/assets/quizzard-page-logo.png` with a fixed nine-colour palette, 31 paths (third star added on the hat — Moni 2026-11-22: "three for luck"), ~58 KB.
Kept here until the Quizzard repo is restarted (Moni's OK pending); then it moves to that repo.

| Role | Hex |
|---|---|
| outline | `#050D12` |
| hat | `#275373` |
| hat shade | `#183A4E` |
| star | `#F9D45C` |
| beard | `#E3D2AA` |
| beard shade | `#96917A` |
| skin | `#E8AB74` |
| skin shade | `#C0804A` |
| staff | `#73451C` |

Files: `quizzard-logo.svg` (tight), `quizzard-icon.svg` (square), `quizzard-icon-maskable-*.svg` (full-bleed
background, wizard inside the safe zone), `quizzard-logo-sheet.png` (preview).
Open: a simplified mark for 16–24 px (the full wizard is not readable there); accent, slogan, wordmark font.

## Decisions (Moni, 2026-11-22)
- **The logo is variant A, the wizard as he was** (with the third star). A friendlier-face variant B was drawn and
  rejected the same day ("definitely A"); do not soften the expression again unasked.
- **Idea, not scheduled:** a small animated wizard as an HTML element that appears with the menu (pulls it in,
  pushes it out, hides). Feasible as inline SVG + CSS/Web Animations (the way GG Counter animates; CSP-safe, no
  library): needs a separate simplified full-body figure drawn in parts (hat, head, arm, staff, robe) — the traced
  logo is flat shapes, not a rig. Rules if built: decoration only (`aria-hidden`), the menu never waits for it,
  ≤ 300 ms, off with reduced motion, a Settings switch. Lottie/Rive would add a runtime and are not needed.
