/**
 * The policy pages' text (app-shell → legal-pages §1): content/legal/<slug>.md with the one-word
 * fills below taken from app.config.ts, rendered to HTML for the standalone pages that
 * scripts/generate.ts writes. A page may never ship a `{…}` placeholder or template instruction
 * ("Last updated: {date}" once went live), so rendering fails while one is left.
 */
import { marked } from "marked";
import type { AppConfig } from "../app.config.ts";
import type { POLICY_PAGES } from "./seo.ts";

/** Page title of each policy page (`<title>`, description). */
export const POLICY_TITLES: Readonly<Record<(typeof POLICY_PAGES)[number], string>> = {
  terms: "Terms & Conditions", privacy: "Privacy", "ai-notice": "AI notice", "legal-notice": "Legal notice", support: "Support",
};

/** A placeholder: braces around text on one line, e.g. `{date}`, `{N}`, `{If API:}`. */
const PLACEHOLDER = /\{[^{}\n]+\}/g;
const COMMENT = /<!--[\s\S]*?-->/g;

/**
 * Returns the fills of the policy texts: placeholder → value from `app`.
 * @remarks The email becomes data attributes that the page's year.js joins, never plain text in
 * the HTML (anti-scraping; shell.spec.ts checks the support page).
 */
export function legalFills(app: AppConfig): Readonly<Record<string, string>> {
  const [user = "", domain = ""] = app.contact.email.split("@");
  return {
    "{App}": app.name, "{app url}": app.url, "{repo}": app.repo, "{base}": app.basePath, "{country}": app.author.country,
    "{linkedin}": app.author.linkedin ?? "https://www.linkedin.com/",
    "{email}": `<a data-email-user="${user}" data-email-domain="${domain}">email (needs JavaScript)</a>`,
  };
}

/** Returns `markdown` without its template comments and with every known fill applied. */
export function fillLegal(markdown: string, fills: Readonly<Record<string, string>>): string {
  let text = markdown.replace(COMMENT, "");
  for (const [placeholder, value] of Object.entries(fills)) text = text.replaceAll(placeholder, value);
  return text;
}

/** Returns every `{…}` placeholder left in `text`, in order (template comments are not text). */
export function placeholdersIn(text: string): string[] {
  return text.replace(COMMENT, "").match(PLACEHOLDER) ?? [];
}

/**
 * Returns the HTML body of one policy page.
 * @param name - the source's name, for the error message
 * @throws {@link Error} `LEGAL_PLACEHOLDER` when a placeholder is still in the filled text
 */
export function policyBodyHtml(name: string, markdown: string, fills: Readonly<Record<string, string>>): string {
  const filled = fillLegal(markdown, fills);
  const left = placeholdersIn(filled);
  if (left.length > 0) throw new Error(`LEGAL_PLACEHOLDER: ${name} still has ${left.join(" ")} — fill it in content/legal or add the fill to scripts/legal.ts.`);
  // because marked.parse returns a Promise only with `async: true`, which is not set here
  return marked.parse(filled, { async: false });
}
