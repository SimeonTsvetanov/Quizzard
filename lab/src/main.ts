// The lab page: pick a file, then the editor of that file (editor.ts).
import { el } from "./dom.ts";
import { createEditor } from "./editor.ts";
import { words } from "./text.ts";

const root = document.querySelector<HTMLElement>("#lab");
if (root) {
  const host = el("div", {});
  const input = el("input", { type: "file", accept: "video/*,audio/*", "data-pick": "" });
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) host.replaceChildren(createEditor(file));
  });
  root.append(el("h1", {}, words.title), el("p", { class: "lab-note" }, words.intro), el("label", { class: "lab-pick" }, el("span", {}, words.pick), input), host);
}
