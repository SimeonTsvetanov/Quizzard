// The faces of the kinds that carry a file. They are known to the core and listed in the picker, but
// have no slide part and no editor part yet (pictures: slice 3, audio and video: slice 4), so the
// picker shows them as "coming soon". Giving the slide entry its `parts` (the player's render/kinds)
// and passing the editor part here is all it takes to switch one on.
import { audioKindSlide, pictureKindSlide, videoKindSlide } from "@simeonts/quizzard-quiz-player/render";
import { type KindUi, kindUi } from "../ui-registry.ts";

/** Question kind `picture`: text on top, one picture below. */
export const pictureKindUi: KindUi = kindUi(pictureKindSlide, { label: "kind.picture", icon: "picture" });

/** Question kind `audio`: text and one audio clip. */
export const audioKindUi: KindUi = kindUi(audioKindSlide, { label: "kind.audio", icon: "audio" });

/** Question kind `video`: text and one video clip. */
export const videoKindUi: KindUi = kindUi(videoKindSlide, { label: "kind.video", icon: "video" });
