// The quiz creator mini-app (contract `MiniAppModule`): the chunk Quizzard loads for `#/quiz`.
// Its CSS comes with it (shared mode, vite-preset.ts).
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/library.css";
import "./styles/quiz.css";
import "./styles/round.css";
import "./styles/editor.css";
import "./styles/slide.css";
import "./styles/preview.css";
import { mountQuiz } from "./app/mount.ts";
import type { MiniAppModule } from "./contract.ts";

const quiz: MiniAppModule = { mount: mountQuiz };

// eslint-disable-next-line no-restricted-syntax -- because the contract's `MiniAppEntry.load` reads the chunk's default export
export default quiz;
