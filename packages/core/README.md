# Quizzard core

The pure logic behind [Quizzard](https://simeontsvetanov.github.io/Quizzard/): TypeScript with no
DOM, used only by the web app (private package, not published — PLAN §1.4).

It holds the mini-app contract (`contract.ts`), registry validation (`validateRegistry`) and the
hash route parser (`parseRoute`, `routeHref`). Input problems come back as typed results with
stable `{ code, message }` errors instead of throws (`validateRegistry` lists every error at once).

[Source and issues](https://github.com/SimeonTsvetanov/Quizzard) · MIT licence.
