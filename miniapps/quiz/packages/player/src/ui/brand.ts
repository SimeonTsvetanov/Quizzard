// Quizzard's logo and name on the stage (Moni 2026-11-24): a quiz shared as a file says where it was
// made, and its logo leads there. Large on the title and the final screen, small and quiet in a corner
// on the others (views and styles/brand.css). The logo is a copy of the app's own file (app/public/logo.svg; test/brand.test.ts keeps them equal),
// carried inside the page as a `data:` picture — the exported page fetches nothing.
// In the exported page and its audience window it is a link to the site, in a new tab, so a running game
// stays where it is. Inside Quizzard (Play in the app) it is the mark alone: the host is already in
// Quizzard, and a stray tap on the stage must not leave a running game (DECISIONS 2026-11-24).
import logo from "../assets/logo.svg?raw";
import { h } from "../render/h.ts";
import type { PlayEnv } from "../views/context.ts";

/** Quizzard's address — the same as `app.config.ts` `url` (test/brand.test.ts holds the two together). */
export const QUIZZARD_URL = "https://simeontsvetanov.github.io/Quizzard/";

let address: string | null = null;

/** The logo as a picture address, made once. */
function logoUrl(): string {
  address ??= `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logo)}`;
  return address;
}

/**
 * The logo and the name.
 * @param env - the words, and the address it leads to (left out inside the app)
 * @param size - `hero` on the title and the final screen, `corner` on the others
 */
export function brand(env: PlayEnv, size: "hero" | "corner"): HTMLElement {
  const parts = [
    h("img", { class: "qp-brand-mark", src: logoUrl(), alt: "", width: "96", height: "96", draggable: "false" }),
    h("span", { class: "qp-brand-words" }, h("span", { class: "qp-brand-name" }, "Quizzard"), ...(size === "hero" ? [h("span", { class: "qp-brand-line" }, env.t("brand.line"))] : [])),
  ];
  const props = { class: "qp-brand", "data-brand": size };
  if (env.homeUrl === undefined) return h("span", { ...props, "aria-hidden": "true" }, ...parts);
  const name = env.t("brand.link");
  return h("a", { ...props, href: env.homeUrl, target: "_blank", rel: "noopener", "aria-label": name, title: name, "data-brand-link": "" }, ...parts);
}
