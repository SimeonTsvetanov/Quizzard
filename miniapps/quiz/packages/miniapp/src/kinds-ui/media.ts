// The faces of the kinds that carry a file. They are known to the core and listed in the picker, but
// have no UI parts yet (pictures: slice 3, audio and video: slice 4), so the picker shows them as
// "coming soon". Giving one its `parts` is all it takes to switch it on.
import type { KindUi } from "../ui-registry.ts";

/** Question kind `picture`: text on top, one picture below. */
export const pictureKindUi: KindUi = { id: "picture", label: "kind.picture", icon: "picture", tone: "picture" };

/** Question kind `audio`: text and one audio clip. */
export const audioKindUi: KindUi = { id: "audio", label: "kind.audio", icon: "audio", tone: "audio" };

/** Question kind `video`: text and one video clip. */
export const videoKindUi: KindUi = { id: "video", label: "kind.video", icon: "video", tone: "video" };
