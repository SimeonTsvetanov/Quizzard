// The Answer sheet mini-app (contract `MiniAppModule`): the chunk Quizzard loads for `#/sheet`.
// Its CSS comes with it (shared mode, vite-preset.ts).
import "./styles/sheet.css";
import type { MiniAppModule } from "./contract.ts";
import { mountSheet } from "./sheet/mount.ts";

const sheet: MiniAppModule = { mount: mountSheet };

// eslint-disable-next-line no-restricted-syntax -- because the contract's `MiniAppEntry.load` reads the chunk's default export
export default sheet;
