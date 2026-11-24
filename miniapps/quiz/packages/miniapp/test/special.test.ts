// @vitest-environment jsdom
// The special rounds in the creator (SPEC §10): every core round kind has a face, and the editor parts
// of the accepted answers and of the Safe's digit report what is typed and picked.
import { type Answer, createRegistries, sequentialIds } from "@simeonts/quizzard-quiz-core";
import { describe, expect, it } from "vitest";
import { digitAnswerUi } from "../src/answers-ui/digit.ts";
import { listAnswerUi } from "../src/answers-ui/list.ts";
import { createTranslator } from "../src/i18n/translate.ts";
import { kindBadge, roundKindName, roundKindUis } from "../src/round-kinds-ui.ts";

const t = createTranslator("en");

function editor(ui: typeof listAnswerUi, answer: Answer, index: number): { element: HTMLElement; changes: Answer[] } {
  const changes: Answer[] = [];
  const registries = createRegistries();
  const round = { id: "r", kind: "pyramid", name: "P", defaults: { seconds: 60, points: { value: 1 }, questionKind: "text", answerType: "list" }, questions: [] };
  const element = ui.parts?.editor({ answer, t, ids: sequentialIds("a"), change: (next) => { changes.push(next); }, place: { round, index } });
  if (!element) throw new Error("no editor");
  expect(registries.answers.has(ui.id)).toBe(true);
  document.body.replaceChildren(element);
  return { element, changes };
}

describe("round kinds in the creator", () => {
  it("every round kind of the core has a face; a special one shows its badge", () => {
    expect(createRegistries().rounds.list().map((kind) => roundKindUis.get(kind.id)?.id)).toEqual(["standard", "pyramid", "safe"]);
    expect(roundKindName({ t }, "pyramid")).toBe("Golden pyramid");
    expect(roundKindName({ t }, "wheel")).toBe("wheel");
    const round = { id: "r", kind: "safe", name: "S", defaults: { seconds: 45, points: { value: 1 }, questionKind: "text", answerType: "digit" }, questions: [] };
    expect(kindBadge({ t }, round)?.textContent).toBe("Safe");
    expect(kindBadge({ t }, { ...round, kind: "standard" })).toBeNull();
  });
});

describe("accepted answers", () => {
  it("count against what the question asks for; Enter adds the next; a pasted list is split", () => {
    const { element, changes } = editor(listAnswerUi, { type: "list", items: ["Neon"] }, 2);
    expect(element.querySelector("[data-accepted-counter]")?.textContent).toBe("asks for 3 · 1 accepted");
    expect(element.querySelector("[data-accepted-short]")?.textContent).toBe("Add 2 more to reach 3");
    const first = element.querySelector<HTMLInputElement>('[data-accepted-item="0"]');
    first?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(element.querySelectorAll("[data-accepted-item]")).toHaveLength(2);
    expect(document.activeElement?.getAttribute("data-accepted-item")).toBe("1");
    const second = element.querySelector<HTMLInputElement>('[data-accepted-item="1"]');
    const paste = new Event("paste", { cancelable: true });
    Object.assign(paste, { clipboardData: { getData: () => "Argon\nKrypton\n\nXenon" } });
    second?.dispatchEvent(paste);
    expect(changes.at(-1)).toEqual({ type: "list", items: ["Neon", "Argon", "Krypton", "Xenon"] });
    expect(element.querySelector("[data-accepted-counter]")?.textContent).toBe("asks for 3 · 4 accepted");
    expect(element.querySelector<HTMLElement>("[data-accepted-short]")?.hidden).toBe(true);
    element.querySelector<HTMLButtonElement>('[data-accepted-remove="0"]')?.click();
    expect(changes.at(-1)).toEqual({ type: "list", items: ["Argon", "Krypton", "Xenon"] });
  });
});

describe("the Safe's digit", () => {
  it("ten keys, none chosen at first; a pick reports the digit", () => {
    const { element, changes } = editor(digitAnswerUi, { type: "digit" }, 1);
    const keys = element.querySelectorAll<HTMLInputElement>("[data-digit]");
    expect(keys).toHaveLength(10);
    expect([...keys].some((key) => key.checked)).toBe(false);
    expect(element.querySelector<HTMLElement>("[data-digit-missing]")?.hidden).toBe(false);
    keys[7]?.click();
    expect(changes).toEqual([{ type: "digit", digit: 7 }]);
    expect(element.querySelector("legend")?.textContent).toBe("The digit");
    expect(element.textContent).toContain("digit 2 of the safe's code");
  });
});
