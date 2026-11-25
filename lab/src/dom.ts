// A tiny element builder for the lab page.

/** Creates an element with attributes and children. */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attributes: Readonly<Record<string, string>> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.append(...children);
  return element;
}

/** A button with a label and what it does. */
export function button(label: string, run: () => void, attributes: Readonly<Record<string, string>> = {}): HTMLButtonElement {
  const element = el("button", { type: "button", ...attributes }, label);
  element.addEventListener("click", run);
  return element;
}

/** A labelled select; returns the field and the select. */
export function choice(label: string, options: readonly (readonly [string, string])[], selected: string): { readonly field: HTMLElement; readonly select: HTMLSelectElement } {
  const select = el("select", {}, ...options.map(([value, text]) => el("option", { value }, text)));
  select.value = selected;
  return { field: el("label", { class: "lab-field" }, el("span", {}, label), select), select };
}
