import { textKindSlide } from "@simeonts/quizzard-quiz-player/render";
import { type KindUi, kindUi } from "../ui-registry.ts";

/** Question kind `text`: the question is its text alone — no fields of its own, nothing extra on the slide. */
export const textKindUi: KindUi = kindUi(textKindSlide, { label: "kind.text", icon: "text" }, () => null);
