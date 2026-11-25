// The "More free tools" page (footer, 404): this app first, then the author's other tools from
// app.config.otherTools. Pure: scripts/generate.ts puts the body into the static page shell.
import type { AppConfig } from "../app.config.ts";
import { escapeHtml } from "./seo.ts";

/** The page's title. */
export const TOOLS_TITLE = "More free tools";

/** One tool: its name as a link and a sentence about it. */
function entry(tool: { readonly name: string; readonly url: string; readonly text: string }): string {
  return `<h2><a href="${escapeHtml(tool.url)}">${escapeHtml(tool.name)}</a></h2><p>${escapeHtml(tool.text)}</p>`;
}

/**
 * The page's body.
 * @param app - gives this app, the other tools and the author
 */
export function toolsBody(app: AppConfig): string {
  return [
    `<h1>${TOOLS_TITLE}</h1>`,
    `<p>Free tools by ${escapeHtml(app.author.name)}. They run in your browser, work offline and need no account.</p>`,
    entry({ name: `${app.name} — ${app.tagline}`, url: app.url, text: app.description }),
    ...app.otherTools.map(entry),
    ...(app.author.github ? [`<p><a href="${escapeHtml(app.author.github)}">The author on GitHub</a></p>`] : []),
  ].join("\n");
}

/**
 * The page's meta description: whose tools, what they have in common and their names.
 * @param app - gives the author and the tools
 */
export function toolsDescription(app: AppConfig): string {
  const names = [app.name, ...app.otherTools.map((tool) => tool.name)].join(", ");
  return `Free tools by ${app.author.name} that run in your browser, offline and without an account: ${names}.`;
}
