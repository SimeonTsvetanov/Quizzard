// The only file that lists the question kinds' UI entries (as core's registries.ts lists the pure ones).
import type { KindUi } from "../ui-registry.ts";
import { audioKindUi, pictureKindUi, videoKindUi } from "./media.ts";
import { textKindUi } from "./text.ts";

/** Every question kind the UI has a face for. */
export const kindUis: readonly KindUi[] = [textKindUi, pictureKindUi, audioKindUi, videoKindUi];
