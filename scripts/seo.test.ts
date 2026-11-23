import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import { lastUpdatedDate, latestReleaseDate, llmsFullTxt, llmsTxt, perAppRobotsTxt, privacySummary, siteVerificationTag, sitemapXml, structuredData } from "./seo.ts";

const app: AppConfig = config;

describe("latestReleaseDate", () => {
  it("skips Unreleased and returns the newest dated release", () => {
    const changelog = "# Changelog\n\n## [Unreleased]\n- x\n\n## [1.2.0] - 2026-10-01\n- y\n\n## [1.1.0] - 2026-09-01\n- z\n";
    expect(latestReleaseDate(changelog)).toBe("2026-10-01");
  });

  it("returns undefined before the first release", () => {
    expect(latestReleaseDate("## [Unreleased]\n- First version.\n")).toBeUndefined();
  });
});

describe("lastUpdatedDate", () => {
  it("reads a real date and ignores the {date} placeholder", () => {
    expect(lastUpdatedDate("**Privacy** — Last updated: 2026-11-01\n")).toBe("2026-11-01");
    expect(lastUpdatedDate("**Privacy** — Last updated: {date}\n")).toBeUndefined();
  });

  it("reads the house date style, bold dates, and ignores dates in comments", () => {
    expect(lastUpdatedDate("**Terms** — Last updated: 6 November 2026\n")).toBe("2026-11-06");
    expect(lastUpdatedDate("Last updated: **2026-10-05**\n")).toBe("2026-10-05");
    expect(lastUpdatedDate("<!-- Last updated: 2026-01-01 -->\nNo date here.\n")).toBeUndefined();
    expect(lastUpdatedDate("Last updated: 6 Brumaire 2026\n")).toBeUndefined();
  });
});

describe("sitemapXml", () => {
  it("writes lastmod only where a real date is known", () => {
    const xml = sitemapXml("https://example.org/a/", [{ path: "", lastmod: "2026-10-01" }, { path: "terms/" }]);
    expect(xml).toContain("<url><loc>https://example.org/a/</loc><lastmod>2026-10-01</lastmod></url>");
    expect(xml).toContain("<url><loc>https://example.org/a/terms/</loc></url>");
    expect(xml).not.toMatch(/priority|changefreq|\?lang=/);
  });
});

describe("perAppRobotsTxt", () => {
  it("says it is ignored, drops the template's notes and fills <app-id> with the Pages path", () => {
    const template = "# HOST ROOT ONLY. Crawlers ignore robots.txt inside /<app-id>/. Replace <app-id>.\n# Re-checked by /check-stack.\nUser-agent: *\nAllow: /\n\n# Search crawlers\nUser-agent: Bingbot\nAllow: /\n# Replace <app-id> below.\nSitemap: https://h/<app-id>/sitemap.xml\n";
    const robots = perAppRobotsTxt(template, app);
    expect(robots.split("\n")[0]).toMatch(/^# .*crawlers ignore robots\.txt below the host root/);
    expect(robots).not.toMatch(/HOST ROOT ONLY|check-stack|Replace|<app-id>/);
    expect(robots).toContain("# Search crawlers");
    // The Pages path ("/Quizzard/") differs from the id ("quizzard"): the sitemap URL must use the path.
    expect(robots).toContain("Sitemap: https://h/Quizzard/sitemap.xml");
  });
});

describe("agent docs", () => {
  const withModes = (modes: Partial<AppConfig["modes"]>, limits: AppConfig["limits"] = {}): AppConfig => ({ ...app, limits, modes: { ...app.modes, ...modes } });

  it("lists URL params with a literal-default example and has no file wording or file limit for apps without files", () => {
    const a = withModes({ urlParams: [{ name: "q", values: "text", default: "none", meaning: "Q." }] });
    const full = llmsFullTxt(a);
    expect(full).toContain("- `q` = text (default none): Q.");
    expect(full).toContain(`- Example: ${app.url}?q=none`);
    expect(full + llmsTxt(a)).not.toMatch(/files never leave|Max file size/);
    expect(llmsFullTxt(withModes({}, { maxFileMB: 50 }))).toContain("Max file size: 50 MB");
    expect(privacySummary(withModes({}, { maxFileMB: 50 }))).toContain("files never leave the device");
  });

  it("documents no embed, HTTP API or MCP — Quizzard has none (SPEC §4)", () => {
    expect(llmsFullTxt(app) + llmsTxt(app)).not.toMatch(/embed|iframe|MCP|HTTP API|npx/i);
  });

  it("never points the FAQ at llms.txt inside llms.txt (no circular reference)", () => {
    for (const f of app.faq) expect(f.a).not.toMatch(/llms(-full)?\.txt/);
  });
});

describe("structuredData", () => {
  // because structuredData returns plain objects; the test reads their JSON shape
  const [webApplication, faqPage] = structuredData(app) as [Record<string, unknown>, { mainEntity: { name: string }[] }];

  it("describes the app as free English entity data with no ratings", () => {
    expect(webApplication).toMatchObject({ "@type": "WebApplication", isAccessibleForFree: true, inLanguage: "en", image: `${app.url}og-image.png` });
    expect(webApplication).not.toHaveProperty("aggregateRating");
    expect(webApplication).not.toHaveProperty("review");
    expect(webApplication["author"]).toMatchObject({ sameAs: [app.author.github, app.author.linkedin] });
  });

  it("FAQPage questions equal the visible FAQ", () => {
    expect(faqPage.mainEntity.map((q) => q.name)).toEqual(app.faq.map((f) => f.q));
  });
});

describe("siteVerificationTag", () => {
  it("is empty without a token and escaped with one", () => {
    expect(siteVerificationTag({ ...app, seo: {} })).toBe("");
    expect(siteVerificationTag({ ...app, seo: { googleVerification: "  " } })).toBe("");
    expect(siteVerificationTag({ ...app, seo: { googleVerification: 'a"b' } })).toBe('<meta name="google-site-verification" content="a&quot;b" />');
  });
});

describe("search texts (T-20)", () => {
  const tools = app.help.features;

  it("keeps the meta description within the 155-character style budget, in both languages", () => {
    expect(app.description.length).toBeLessThanOrEqual(155);
    expect((app.l10n?.bg?.description ?? "").length).toBeLessThanOrEqual(155);
  });

  it("names all four tools, in the same order and number in English and Bulgarian", () => {
    expect(tools.map((f) => f.name)).toEqual(["Teams", "Scores", "Answer sheet", "Quiz creator"]);
    expect(app.l10n?.bg?.help.features).toHaveLength(tools.length);
    for (const f of tools) expect(f.route).toMatch(/^#\/[a-z]+$/);
  });

  it("says in the description and FAQ what the tools are for, not what is still to come", () => {
    expect(app.description).toMatch(/team generator/i);
    expect(app.description).toMatch(/score keeper/i);
    expect(app.description).toMatch(/answer sheet/i);
    expect(app.description).not.toMatch(/then a quiz creator|first/i);
    expect(app.faq.map((f) => f.a).join(" ")).toMatch(/Answer sheet/);
  });

  it("carries the 2025 site's Google verification token (never invented; PLAN T-20)", () => {
    expect(siteVerificationTag(app)).toBe('<meta name="google-site-verification" content="iV0XiTpnAw_U3AGR_IPF40DAbr0Et18Bjg3kLA0HTW8" />');
  });

  it("lists every tool as a feature of the WebApplication entity", () => {
    const [webApplication] = structuredData(app) as [{ featureList?: string[] }];
    expect(webApplication.featureList).toEqual(tools.map((f) => f.name));
  });

  it("gives llms.txt a deep link and a sentence per tool, and llms-full.txt the same", () => {
    const text = llmsTxt(app);
    const full = llmsFullTxt(app);
    for (const f of tools) {
      expect(text).toContain(`- [${f.name}](${app.url}${f.route ?? ""}): opens the ${f.name} tool directly`);
      expect(text).toContain(`${f.name} — ${f.text}`);
      expect(full).toContain(`- ${f.name} (${app.url}${f.route ?? ""}): ${f.text}`);
    }
  });
});

describe("llmsTxt", () => {
  const text = llmsTxt(app);
  const sections = text.split(/^## /m);

  it("follows the llmstxt.org order: H1, summary, paragraphs, then link sections", () => {
    expect(text.startsWith(`# ${app.name}\n\n> ${app.description}\n`)).toBe(true);
    expect(sections.slice(1).map((s) => s.split("\n")[0])).toEqual(["Use it", "Optional"]);
    for (const faq of app.faq) expect(sections[0]).toContain(`${faq.q} ${faq.a}`);
  });

  it("has only `- [name](url): note` lines under H2 sections", () => {
    for (const section of sections.slice(1)) {
      const lines = section.split("\n").slice(1).filter((l) => l.trim());
      for (const line of lines) expect(line).toMatch(/^- \[[^\]]+\]\([^)]+\)(: .+)?$/);
    }
  });
});
