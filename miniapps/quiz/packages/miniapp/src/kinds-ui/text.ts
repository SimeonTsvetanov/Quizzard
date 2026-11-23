import type { KindUi } from "../ui-registry.ts";

/** Question kind `text`: the question is its text alone — no fields of its own, nothing extra on the slide. */
export const textKindUi: KindUi = {
  id: "text",
  label: "kind.text",
  icon: "text",
  tone: "text",
  parts: { editor: () => null, slide: () => null },
};
