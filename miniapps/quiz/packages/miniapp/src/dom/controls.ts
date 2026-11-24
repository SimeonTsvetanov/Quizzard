// Small form controls shared by the screens and the editor parts: icon buttons, labelled fields and
// chip pickers (native radios, so arrows, disabled and names work without script). Plain DOM, text
// in as text; nothing here knows a screen.
import { h } from "./h.ts";
import { icon, type IconName } from "./icons.ts";

/**
 * A square icon button with an accessible name (also its tooltip).
 * @param name - the mark
 * @param label - what the button does, in words
 * @param props - more attributes, e.g. `data-*` hooks; `class` adds to `quiz-icon-button`
 */
export function iconButton(name: IconName, label: string, props: Readonly<Record<string, string>> = {}): HTMLButtonElement {
  const { class: extra = "", ...rest } = props;
  const button = h("button", { type: "button", class: `quiz-icon-button ${extra}`.trim(), "aria-label": label, title: label, ...rest });
  button.append(icon(name));
  return button;
}

/**
 * A button with a mark and words.
 * @param name - the mark, or `null` for words only
 * @param label - the visible words
 * @param props - attributes; `class` replaces the shell's default `button` look (`quiz-button` is always added)
 */
export function labelButton(name: IconName | null, label: string, props: Readonly<Record<string, string>> = {}): HTMLButtonElement {
  const { class: look = "button", ...rest } = props;
  const button = h("button", { type: "button", class: `${look} quiz-button`, ...rest });
  if (name !== null) button.append(icon(name));
  button.append(h("span", {}, label));
  return button;
}

/** Inputs of {@link textField}. */
export interface TextFieldOptions {
  readonly label: string;
  readonly value: string;
  /** Longest text, in characters. */
  readonly max: number;
  readonly placeholder?: string;
  /** A textarea of this many rows instead of a one-line field. */
  readonly rows?: number;
  /** Shown under the field. */
  readonly hint?: string;
  /** More attributes of the field itself, e.g. `data-*` hooks. */
  readonly props?: Readonly<Record<string, string>>;
  onInput(value: string): void;
}

/**
 * A labelled text field; the label wraps the field, so no ids are needed.
 * @param options - label, value, limit and the listener
 * @returns a box with the `<label>` (and the hint under it)
 */
export function textField(options: TextFieldOptions): HTMLElement {
  const shared = { class: "quiz-input", maxlength: String(options.max), autocomplete: "off", ...(options.placeholder === undefined ? {} : { placeholder: options.placeholder }), ...options.props };
  const field = options.rows === undefined ? h("input", { type: "text", enterkeyhint: "done", ...shared }) : h("textarea", { rows: String(options.rows), ...shared });
  field.value = options.value;
  field.addEventListener("input", () => { options.onInput(field.value); });
  const box = h("div", { class: "quiz-field" }, h("label", { class: "quiz-field" }, h("span", { class: "quiz-label" }, options.label), field));
  // Outside the label: the field's name stays its label alone.
  if (options.hint !== undefined) box.append(h("p", { class: "quiz-hint" }, options.hint));
  return box;
}

/** One chip of a {@link chipPicker}. */
export interface ChipOption {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  /** Colour chip of the option (`data-tone`). */
  readonly tone?: string;
  /** `false` = shown with the "Soon" tag and not selectable. */
  readonly isAvailable?: boolean;
}

/** Inputs of {@link chipPicker}. */
export interface ChipPickerOptions {
  readonly legend: string;
  /** The radio group's name; unique on the screen. */
  readonly name: string;
  readonly options: readonly ChipOption[];
  readonly value: string;
  /** The tag on an option that cannot be chosen yet ("Soon"). */
  readonly soon: string;
  /** Shown under the chips while one of them cannot be chosen yet: what the "Soon" ones are waiting for. */
  readonly hint?: string;
  onPick(id: string): void;
}

function chip(options: ChipPickerOptions, option: ChipOption): HTMLLabelElement {
  const isAvailable = option.isAvailable !== false;
  const radio = h("input", { type: "radio", name: options.name, value: option.id });
  radio.checked = option.id === options.value;
  radio.disabled = !isAvailable;
  radio.addEventListener("change", () => { if (radio.checked) options.onPick(option.id); });
  const face = h("span", { class: "quiz-chip-face" });
  if (option.icon !== undefined) face.append(icon(option.icon, 18));
  face.append(h("span", {}, option.label));
  if (!isAvailable) face.append(h("span", { class: "quiz-soon" }, options.soon));
  return h("label", { class: "quiz-chip", "data-tone": option.tone ?? "none", ...(isAvailable ? {} : { "data-soon": "" }) }, radio, face);
}

/**
 * A one-of-many picker drawn as chips.
 * @param options - legend, the chips, the chosen one and the listener
 */
export function chipPicker(options: ChipPickerOptions): HTMLFieldSetElement {
  const row = h("div", { class: "quiz-chips" }, ...options.options.map((option) => chip(options, option)));
  const group = h("fieldset", { class: "quiz-group" }, h("legend", { class: "quiz-label" }, options.legend), row);
  if (options.hint !== undefined && options.options.some((option) => option.isAvailable === false)) group.append(h("p", { class: "quiz-hint" }, options.hint));
  return group;
}
