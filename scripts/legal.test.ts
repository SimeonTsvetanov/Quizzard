import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { app } from "../app.config.ts";
import { legalFills, placeholdersIn, policyBodyHtml } from "./legal.ts";
import { POLICY_PAGES, lastUpdatedDate } from "./seo.ts";

const legalDir = join(dirname(fileURLToPath(import.meta.url)), "..", "content", "legal");
const source = (slug: string): string => readFileSync(join(legalDir, `${slug}.md`), "utf8");
const fills = legalFills(app);

describe("policy texts (content/legal) — no template placeholder ever ships", () => {
  it("every Markdown file in content/legal is a policy page (optional pages wait in content/legal/optional)", () => {
    const files = readdirSync(legalDir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)).sort();
    expect(files).toEqual([...POLICY_PAGES].sort());
  });

  it.each(POLICY_PAGES)("%s uses only the generator's fills", (slug) => {
    const unknown = placeholdersIn(source(slug)).filter((p) => !(p in fills));
    expect(unknown).toEqual([]);
  });

  it.each(POLICY_PAGES)("%s renders to a page body without braces", (slug) => {
    const html = policyBodyHtml(slug, source(slug), fills);
    expect(html).not.toMatch(/[{}]/);
  });

  it.each(POLICY_PAGES)("%s has a real \"Last updated\" date", (slug) => {
    expect(lastUpdatedDate(source(slug))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("the legal notice names the author and country of app.config", () => {
    expect(source("legal-notice")).toContain(`**Provider:** ${app.author.name}, ${app.author.country}.`);
  });
});

describe("policyBodyHtml", () => {
  it("drops template comments, applies the fills and renders Markdown", () => {
    const html = policyBodyHtml("demo", "<!-- note {date} -->\n**{App}** — {base}", { "{App}": "Demo", "{base}": "/demo/" });
    expect(html).toBe("<p><strong>Demo</strong> — /demo/</p>\n");
  });

  it("fails with LEGAL_PLACEHOLDER while a placeholder or template instruction is left", () => {
    expect(() => policyBodyHtml("privacy.md", "Last updated: {date}\n{If API:} logs for {N} days", {})).toThrow(
      "LEGAL_PLACEHOLDER: privacy.md still has {date} {If API:} {N}",
    );
  });

  it("keeps the contact email out of the page text (data attributes for year.js)", () => {
    const html = policyBodyHtml("demo", "Write to {email}.", fills);
    expect(html).not.toContain(app.contact.email);
    expect(html).toContain(`data-email-domain="${app.contact.email.split("@")[1] ?? ""}"`);
  });
});
