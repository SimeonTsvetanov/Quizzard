# Licence texts of packages that ship none

Some packages the Scores mini-app ships have no licence file inside their npm package, but MIT and
Apache-2.0 require the text with every copy (app-shell → legal-pages §5). `scripts/generate.ts` uses,
in order: the package's own file → a file here named after the package → the licence file of another
shipped package from the same repository (all `@radix-ui/*` packages: `radix-ui/primitives`, MIT,
WorkOS). A package still without a text fails `pnpm generate`.

| File | Package (version shipped) | Source |
|---|---|---|
| `class-variance-authority.txt` | class-variance-authority 0.7.0 (Apache-2.0) | https://raw.githubusercontent.com/joe-bell/cva/v0.7.0/LICENSE (tag of the shipped version; copied from GG Counter, fetched there 2026-11-19) |
| `react-remove-scroll-bar.txt` | react-remove-scroll-bar 2.3.8 (MIT) | https://raw.githubusercontent.com/theKashey/react-remove-scroll-bar/master/LICENSE (the repo has no 2.3.8 tag; copied from GG Counter, fetched there 2026-11-19) |

Re-check this table when either package is updated (a GG Counter pin bump can change them).
