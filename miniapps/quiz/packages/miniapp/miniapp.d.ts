// Type boundary of the mini-app (PLAN §1.1 item 3): the shell's `tsc` reads only this file and the
// contract, never the body's sources; Vite bundles `src/index.ts`.
import type { MiniAppModule } from "./src/contract.ts";

declare const quiz: MiniAppModule;
export default quiz;
