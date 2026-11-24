// The faces of the kinds that carry a file. Each is usable because it has both halves: its slide
// part (the player's render/kinds — the picture, the clip) and its editor part, the file picker.
// The picker is one for all three: which files it takes comes from the core kind's `mediaType`.
import { audioKindSlide, pictureKindSlide, videoKindSlide } from "@simeonts/quizzard-quiz-player/render";
import { type KindUi, kindUi } from "../ui-registry.ts";
import { mediaPicker } from "./media-picker.ts";

/** Question kind `picture`: text on top, one picture below. */
export const pictureKindUi: KindUi = kindUi(pictureKindSlide, { label: "kind.picture", icon: "picture" }, mediaPicker);

/** Question kind `audio`: text and one audio clip. */
export const audioKindUi: KindUi = kindUi(audioKindSlide, { label: "kind.audio", icon: "audio" }, mediaPicker);

/** Question kind `video`: text and one video clip. */
export const videoKindUi: KindUi = kindUi(videoKindSlide, { label: "kind.video", icon: "video" }, mediaPicker);
