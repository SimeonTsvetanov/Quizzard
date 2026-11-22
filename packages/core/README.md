# Quizzard core

The pure logic behind [Quizzard](https://simeontsvetanov.github.io/Quizzard/): TypeScript with no
DOM, used only by the web app (private package, not published — PLAN §1.4).

Functions return a `Result` (`{ ok: true, value }` or `{ ok: false, error: { code, message } }`)
instead of throwing.

[Source and issues](https://github.com/SimeonTsvetanov/Quizzard) · MIT licence.
