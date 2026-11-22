/**
 * Generates everything user-facing from app.config.ts (APP-STANDARD §0). Run: `pnpm generate`
 * (also runs before dev/build). Writes into app/public/: robots.txt, sitemap.xml, llms.txt,
 * 404.html + error-page assets, tokens.css, standalone policy pages from content/legal/*.md,
 * third-party-licenses.txt (full licence texts of everything shipped), and LICENSE (current
 * year) at the repo root. Never hand-edit the outputs.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { app as config, type AppConfig } from "../app.config.ts";
import { accentCss, resolveAccent } from "./accent.ts";
import { POLICY_TITLES, legalFills, policyBodyHtml } from "./legal.ts";
import { readUpstreamLicenseTexts, shippedPackages, thirdPartyLicensesTxt, withFallbackLicenseTexts } from "./licenses.ts";
import { POLICY_PAGES, lastUpdatedDate, latestReleaseDate, llmsFullTxt, llmsTxt, perAppRobotsTxt, sitemapXml } from "./seo.ts";

// Widen the `as const` literal types so optional modes (null today) type-check when enabled.
const app: AppConfig = config;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "app", "public");
const assets = join(root, "scripts", "page-assets");
// GitHub Pages path (app.config.basePath, "/Quizzard/"): differs from the id, so never derived from it.
const base = app.basePath;
if (!app.url.endsWith(base)) throw new Error(`app.config.url (${app.url}) must end with basePath (${base}).`);
const repoName = app.repo.slice(app.repo.lastIndexOf("/") + 1);
const year = String(new Date().getFullYear());
// One version: root package.json = app.config.version (the build injects it into HTML + JSON-LD).
const pkgVersion = (JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string }).version;
if (pkgVersion !== app.version) throw new Error(`app.config.version (${app.version}) must equal package.json version (${String(pkgVersion)}).`);
const write = (rel: string, text: string): void => {
  const path = join(pub, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
const fill = (text: string): string =>
  text
    .replace(/<!--[\s\S]*?-->\s*/g, "") // internal template notes never ship
    .replaceAll("APP_MORE_TOOLS", app.moreTools.replaceAll("&", "&amp;"))
    .replaceAll("/APP_BASE/", base)
    .replaceAll("APP_NAME", app.name)
    .replaceAll("APP_REPO", repoName)
    .replaceAll("APP_LANG", app.languages[0] ?? "en")
    .replaceAll("APP_URL", app.url)
    .replaceAll("APP_ID", app.id)
    .replaceAll("BUILD_YEAR", year);

// robots.txt — the hub's host-root policy, kept per app as documentation only (seo-geo §6).
write("robots.txt", perAppRobotsTxt(readFileSync(join(assets, "robots.txt"), "utf8"), app));

// sitemap.xml — app + policy pages; lastmod = each page's real last change, never the build date
// (seo-geo §6): app = latest CHANGELOG release, policy = its "Last updated" date, else omitted.
const changelogText = readFileSync(join(root, "CHANGELOG.md"), "utf8");
const releaseDate = latestReleaseDate(changelogText);
const policyDate = (slug: string): string | undefined =>
  lastUpdatedDate(readFileSync(join(root, "content", "legal", `${slug}.md`), "utf8")); // no date → no lastmod (never borrow the app's)
write(
  "sitemap.xml",
  sitemapXml(app.url, [
    { path: "", ...(releaseDate ? { lastmod: releaseDate } : {}) },
    ...POLICY_PAGES.map((slug) => {
      const lastmod = policyDate(slug);
      return { path: `${slug}/`, ...(lastmod ? { lastmod } : {}) };
    }),
  ]),
);

// llms.txt — llmstxt.org format for agents (seo-geo §8); details go to llms-full.txt below.
write("llms.txt", llmsTxt(app));
// Error page + shared page assets (app-shell error-pages / pages).
write("404.html", fill(readFileSync(join(assets, "404.html"), "utf8")));
for (const f of ["error-page.css", "error-page.js", "page.css", "year.js"]) {
  copyFileSync(join(assets, f), join(pub, f));
}
copyFileSync(join(root, "design", "tokens.css"), join(pub, "tokens.css"));

// Standalone policy pages from content/legal/*.md (same text as the in-app dialogs); a placeholder
// left in a text fails the run (scripts/legal.ts).
const shell = readFileSync(join(assets, "page.html"), "utf8");
const legalFillValues = legalFills(app);
for (const slug of POLICY_PAGES) {
  const title = POLICY_TITLES[slug]; // optional pages live in content/legal/optional until enabled
  const body = policyBodyHtml(`content/legal/${slug}.md`, readFileSync(join(root, "content", "legal", `${slug}.md`), "utf8"), legalFillValues);
  const html = shell
    .replace('<article class="page-body">PAGE_BODY</article>', `<article class="page-body">${body}</article>`)
    .replaceAll("PAGE_TITLE", title)
    .replaceAll("PAGE_DESCRIPTION", `${title} for ${app.name}.`)
    .replaceAll("PAGE_SLUG", slug);
  write(join(slug, "index.html"), fill(html));
}

// llms-full.txt — complete reference for agents (APP-STANDARD §10), from app.config only.
write("llms-full.txt", llmsFullTxt(app));

// What's new + Credits data for the app (generated, never hand-edited).
const gen = join(root, "app", "src", "generated");
mkdirSync(gen, { recursive: true });
const changelog = changelogText
  .split(/^## /m).slice(1)
  .map((block) => {
    const [head = "", ...lines] = block.split("\n");
    const version = /\[([^\]]+)\]/.exec(head)?.[1] ?? head.trim();
    const date = /(\d{4}-\d{2}-\d{2})/.exec(head)?.[1] ?? "";
    return { version, date, items: lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim()) };
  })
  .filter((v) => v.items.length)
  .slice(0, 3);
writeFileSync(join(gen, "changelog.json"), `${JSON.stringify(changelog, null, 2)}\n`);
const depNames = new Set<string>();
// The shell's packages and the vendored mini-apps' (their libraries ship in this app too). The
// packages themselves are Moni's own code, not credits.
const creditDirs = ["app", "packages/core", ...["teamsync", "gg-counter"].flatMap((v) => ["core", "miniapp"].map((part) => `vendor/${v}/packages/${part}`))]
  .filter((dir) => existsSync(join(root, dir, "package.json")));
const creditPackages = creditDirs.map((dir) => JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8")) as { name?: string; dependencies?: Record<string, string> });
const ownNames = new Set(creditPackages.map((pj) => pj.name));
for (const pj of creditPackages) {
  for (const d of Object.keys(pj.dependencies ?? {})) if (!d.startsWith("@simeonts/") && !ownNames.has(d)) depNames.add(d);
}
// Credits in words people understand (About → "Made with"): a known name + what it does (i18n key
// shell.credit.<kind>); unknown packages fall back to their own description.
const KNOWN: Record<string, { title: string; kind: string }> = {
  "@fontsource-variable/inter": { title: "Inter", kind: "font" },
  lucide: { title: "Lucide", kind: "icons" },
  i18next: { title: "i18next", kind: "translations" },
  zod: { title: "Zod", kind: "validation" },
  // Scores (GG Counter) is built with these.
  react: { title: "React", kind: "ui" },
  "react-dom": { title: "React DOM", kind: "ui" },
  "@radix-ui/react-alert-dialog": { title: "Radix Alert Dialog", kind: "ui" },
  "@radix-ui/react-dialog": { title: "Radix Dialog", kind: "ui" },
  "@radix-ui/react-slot": { title: "Radix Slot", kind: "ui" },
  "class-variance-authority": { title: "Class Variance Authority", kind: "ui" },
  clsx: { title: "clsx", kind: "ui" },
  "tailwind-merge": { title: "tailwind-merge", kind: "ui" },
  "lucide-react": { title: "Lucide for React", kind: "icons" },
};
const credits = [...depNames].sort().map((name) => {
  for (const pkg of [...creditDirs, "."]) {
    const f = join(root, pkg, "node_modules", name, "package.json");
    if (existsSync(f)) {
      const license = (JSON.parse(readFileSync(f, "utf8")) as { license?: string }).license ?? "see package";
      // Apache-2.0 §4(d): a NOTICE file shipped by the dependency must be reproduced (About → Credits).
      const noticeFile = ["NOTICE", "NOTICE.md", "NOTICE.txt"].map((n) => join(dirname(f), n)).find((n) => existsSync(n));
      const pkg = JSON.parse(readFileSync(f, "utf8")) as { description?: string; homepage?: string };
      const known = KNOWN[name];
      const base = { name, title: known?.title ?? name, kind: known?.kind ?? "", what: pkg.description ?? "", url: pkg.homepage ?? `https://www.npmjs.com/package/${name}`, license };
      return noticeFile ? { ...base, notice: readFileSync(noticeFile, "utf8").trim().slice(0, 2000) } : base;
    }
  }
  return { name, title: KNOWN[name]?.title ?? name, kind: KNOWN[name]?.kind ?? "", what: "", url: `https://www.npmjs.com/package/${name}`, license: "see package" };
});
writeFileSync(join(gen, "credits.json"), `${JSON.stringify(credits, null, 2)}\n`);

// third-party-licenses.txt — full licence (+ NOTICE) of every package and font the web app ships
// (legal-pages §5: MIT/Apache-2.0/OFL need the text, not just the name); linked from About → Credits.
{
  const shipped = shippedPackages(join(root, "app"));
  const packages = withFallbackLicenseTexts(shipped.packages, readUpstreamLicenseTexts(join(assets, "licenses")));
  const problems = [
    ...shipped.missing.map((name) => `${name}: not installed — run pnpm i`),
    ...packages.filter((p) => p.licenseText === undefined).map((p) => `${p.name}: no licence file — add the upstream text to scripts/page-assets/licenses/`),
  ];
  if (problems.length) throw new Error(`third-party-licenses.txt:\n- ${problems.join("\n- ")}`);
  write("third-party-licenses.txt", thirdPartyLicensesTxt(app.name, packages));
}

// og-image.png 1200×630 (logo + name + tagline on the light background).
const esc = (t: string): string => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const logoSvg = readFileSync(join(pub, "logo.svg"), "utf8");
const logo = logoSvg.replace(/<svg[^>]*>/, "").replace("</svg>", "");
// The logo box is 160 px whatever the viewBox (template placeholder 64, Quizzard's wizard 512 — PLAN T-03).
const logoScale = 160 / Number(/viewBox="0 0 ([\d.]+)/.exec(logoSvg)?.[1] ?? "64");
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#F5F5F7"/>
<g transform="translate(96 150) scale(${String(logoScale)})">${logo}</g>
<text x="96" y="420" font-family="Inter, Helvetica, Arial, sans-serif" font-size="76" font-weight="700" fill="#1D1D1F">${esc(app.name)}</text>
<text x="96" y="500" font-family="Inter, Helvetica, Arial, sans-serif" font-size="40" fill="#6E6E73">${esc(app.tagline)}</text>
</svg>`;
await sharp(Buffer.from(ogSvg)).png().toFile(join(pub, "og-image.png"));

// README: generated usage section between markers (no drift).
const readmePath = join(root, "README.md");
const readme = readFileSync(readmePath, "utf8");
const usage = [
  "<!-- forge:usage:start -->",
  `- **Browser:** ${app.url}`,
  `- **For AI agents:** [llms.txt](${app.url}llms.txt) · [llms-full.txt](${app.url}llms-full.txt)`,
  "<!-- forge:usage:end -->",
].join("\n");
if (readme.includes("<!-- forge:usage:start -->")) {
  writeFileSync(readmePath, readme.replace(/<!-- forge:usage:start -->[\s\S]*?<!-- forge:usage:end -->/, usage));
}

// Accent (design → design-system §3, accessibility §2): derive the full accent set from
// app.config.accent (one hex or a light/dark pair); resolveAccent() throws (fails the build) when
// text < 4.5:1 or focus < 3:1.
// Empty file = default Apple-style blue.
{
  let css = "/* GENERATED by scripts/generate.ts from app.config.accent — do not edit. */\n";
  if (app.accent) css += accentCss(resolveAccent(app.accent));
  writeFileSync(join(gen, "accent.css"), css);
  // Static pages (404, offline, policies) use public/tokens.css — give them the same accent.
  const pubTokens = join(pub, "tokens.css");
  if (existsSync(pubTokens) && app.accent) writeFileSync(pubTokens, `${readFileSync(pubTokens, "utf8")}\n${css}`);
}

// UI languages (app-shell → i18n): bundle only the languages in app.config, English first.
{
  const langs = app.languages;
  if (langs[0] !== "en") throw new Error(`app.config.languages must start with "en" (default language), got ${langs.join(", ")}`);
  for (const lang of langs) {
    if (!existsSync(join(root, "app", "src", "i18n", `${lang}.ts`))) throw new Error(`Missing app/src/i18n/${lang}.ts for language "${lang}".`);
    if (lang === "en") continue;
    const t = app.l10n?.[lang];
    if (!t) throw new Error(`app.config.l10n.${lang} is missing (tagline, description, help, faq) for language "${lang}".`);
    const same = (a: readonly unknown[], b: readonly unknown[], what: string): void => {
      if (a.length !== b.length) throw new Error(`app.config.l10n.${lang}.${what} has ${String(b.length)} items, English has ${String(a.length)}.`);
    };
    same(app.help.steps, t.help.steps, "help.steps");
    same(app.help.features, t.help.features, "help.features");
    same(app.faq, t.faq, "faq");
  }
  writeFileSync(
    join(gen, "locales.ts"),
    `// GENERATED by scripts/generate.ts from app.config.languages — do not edit.\n${langs
      .map((l) => `import { ${l} } from "../i18n/${l}.ts";`)
      .join("\n")}\n\nexport const resources = { ${langs.join(", ")} } as const;\n`,
  );
}

// LICENSE with the current year (never hard-coded).
writeFileSync(
  join(root, "LICENSE"),
  readFileSync(join(assets, "LICENSE.mit"), "utf8").replace("{year}", year),
);

if (!existsSync(join(pub, "logo.svg"))) console.warn("generate: app/public/logo.svg missing — run /icons.");
console.log(`generate: done for ${app.id}`);
