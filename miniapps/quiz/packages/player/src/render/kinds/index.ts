// The only file that lists the question kinds the slide knows. A kind without `parts` is known by
// name only and drawn as "not supported in this version" — giving it its `parts.slide` (which reads
// the file through `view.mediaUrl`) is all it takes to switch it on in the creator's thumbnails, the
// preview, the in-app player and every page exported from then on.
import type { SlideKind } from "../registry.ts";
import { audioKindSlide, videoKindSlide } from "./clip.ts";
import { pictureKindSlide } from "./picture.ts";

export { audioKindSlide, videoKindSlide } from "./clip.ts";
export { pictureKindSlide } from "./picture.ts";

/** Kind `text`: the question is its text alone — nothing between the text and the answer. */
export const textKindSlide: SlideKind = { id: "text", tone: "text", parts: { slide: () => null } };

/** Every question kind the slide has an entry for. */
export const kindSlides: readonly SlideKind[] = [textKindSlide, pictureKindSlide, audioKindSlide, videoKindSlide];
