// Tiny DOM builder (the same as the creator's dom/h.ts; the player cannot import the creator). Text
// goes in through `append`, never parsed as HTML.

/**
 * Creates an element with string attributes and children.
 * @param tag - the element name
 * @param props - attributes; `class` sets `className`
 * @param children - nodes or text (text becomes a text node, never markup)
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Readonly<Record<string, string>> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) {
    if (name === "class") element.className = value;
    else element.setAttribute(name, value);
  }
  element.append(...children);
  return element;
}

/**
 * Makes a button give the focus back after a click with the mouse or a finger, so the player's keys
 * keep working (Space is "next", not "this button again"). A button reached with the keyboard keeps
 * the focus as usual.
 * @param button - the button
 */
export function releaseAfterPointer(button: HTMLButtonElement): void {
  // `detail` counts pointer clicks; it is 0 for a click made with Enter or Space.
  button.addEventListener("click", (event) => { if (event.detail > 0) button.blur(); }, { capture: true });
}
