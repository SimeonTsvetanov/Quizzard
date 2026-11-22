// Unit tests for the mini-app context (PLAN T-06): language and theme signals, subscription
// cleanup at release, the busy gate, the header slot and the namespaced prefs. Shell UI modules are
// mocked (their DOM is covered by tests/e2e/miniapp-context.spec.ts); state.ts, storage and the
// signals are real, over a stubbed document, matchMedia and localStorage.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Lang, MiniAppEntry } from "@simeonts/quizzard-core";
import type { Navigation } from "../router/router.ts";

const shell = vi.hoisted((): { language: Lang; theme: "light" | "dark" } => ({ language: "en", theme: "light" }));
vi.mock("../i18n/index.ts", () => ({ getLanguage: () => shell.language, t: (key: string) => key }));
vi.mock("../ui/theme.ts", () => ({
  DARK_SCHEME_QUERY: "(prefers-color-scheme: dark)",
  THEME_CHANGE_EVENT: "theme:change",
  resolvedTheme: () => shell.theme,
}));
vi.mock("../ui/toast.ts", () => ({ showToast: vi.fn() }));
vi.mock("../ui/confirm.ts", () => ({ confirmAction: vi.fn(() => Promise.resolve(true)) }));
vi.mock("../ui/share.ts", () => ({ shareText: vi.fn(() => Promise.resolve("cancelled")) }));
vi.mock("../storage/persist.ts", () => ({ noteDataSaved: vi.fn() }));
vi.mock("../ui/dom.ts", () => ({
  h: (tag: string, props: Record<string, string>) => {
    const children: unknown[] = [];
    return { tag, props, children, isRemoved: false, replaceChildren() { children.length = 0; }, remove() { this.isRemoved = true; } };
  },
}));

const { createMiniAppContext } = await import("./context.ts");
const { IDLE_EVENT, isBusy, setBusy } = await import("../state.ts");
const { showToast } = await import("../ui/toast.ts");
const { confirmAction } = await import("../ui/confirm.ts");
const { shareText } = await import("../ui/share.ts");
const { noteDataSaved } = await import("../storage/persist.ts");

const PREFIX = "probe-area:v1:";

function entry(languages: readonly Lang[] = ["en", "bg"]): MiniAppEntry {
  return {
    meta: {
      contract: 1, id: "probe", name: { en: "Probe" }, tagline: { en: "Probe" }, icon: "logo.svg",
      languages, status: "ready", storage: { prefix: PREFIX },
    },
    load: () => Promise.reject(new Error("not loaded in unit tests")),
  };
}

/** A localStorage stand-in; `isFull` makes every write throw like a full quota. */
function memoryStorage(): Storage & { isFull: boolean; items: Map<string, string> } {
  const items = new Map<string, string>();
  const storage = {
    items,
    isFull: false,
    get length() { return items.size; },
    clear: () => { items.clear(); },
    key: (index: number) => [...items.keys()][index] ?? null,
    getItem: (key: string) => items.get(key) ?? null,
    setItem(key: string, value: string) {
      if (storage.isFull) throw new DOMException("full", "QuotaExceededError");
      items.set(key, value);
    },
    removeItem: (key: string) => { items.delete(key); },
  };
  return storage;
}

let doc: EventTarget;
let scheme: EventTarget;
let storage: ReturnType<typeof memoryStorage>;
const headerActions = { prepend: vi.fn() };
const navigation: Navigation = { home: vi.fn(), open: vi.fn() };

function mount(languages?: readonly Lang[]) {
  // because the context only calls prepend() on the header group
  return createMiniAppContext({ entry: entry(languages), query: new URLSearchParams("n=1"), navigation, setTitle: vi.fn(), headerActions: headerActions as unknown as HTMLElement });
}

beforeEach(() => {
  shell.language = "en";
  shell.theme = "light";
  doc = new EventTarget();
  scheme = new EventTarget();
  storage = memoryStorage();
  vi.stubGlobal("document", doc);
  vi.stubGlobal("matchMedia", () => scheme);
  vi.stubGlobal("localStorage", storage);
});

afterEach(() => { vi.clearAllMocks(); });

describe("language signal", () => {
  it("gets the UI language and fires once per real change", () => {
    const { context } = mount();
    const seen: Lang[] = [];
    context.language.subscribe((lang) => { seen.push(lang); });
    shell.language = "bg";
    doc.dispatchEvent(new Event("i18n:change"));
    doc.dispatchEvent(new Event("i18n:change")); // same language again: silent
    expect(context.language.get()).toBe("bg");
    expect(seen).toEqual(["bg"]);
  });

  it("falls back to English for a language the mini-app does not translate (SPEC F13)", () => {
    const { context } = mount(["en"]);
    const listener = vi.fn();
    context.language.subscribe(listener);
    shell.language = "bg";
    doc.dispatchEvent(new Event("i18n:change"));
    expect(context.language.get()).toBe("en");
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops after its own unsubscribe, which may be called twice", () => {
    const { context } = mount();
    const listener = vi.fn();
    const unsubscribe = context.language.subscribe(listener);
    unsubscribe();
    unsubscribe();
    shell.language = "bg";
    doc.dispatchEvent(new Event("i18n:change"));
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("theme signal", () => {
  it("fires on the shell's theme change and on an OS scheme change under \"system\"", () => {
    const { context } = mount();
    const seen: string[] = [];
    context.theme.subscribe((theme) => { seen.push(theme); });
    shell.theme = "dark";
    doc.dispatchEvent(new Event("theme:change"));
    shell.theme = "light"; // "system" and the OS went light
    scheme.dispatchEvent(new Event("change"));
    scheme.dispatchEvent(new Event("change"));
    expect(seen).toEqual(["dark", "light"]);
  });
});

describe("release", () => {
  it("stops every subscription the mini-app forgot, and later subscriptions never fire", () => {
    const mounted = mount();
    const language = vi.fn();
    const theme = vi.fn();
    mounted.context.language.subscribe(language);
    mounted.context.theme.subscribe(theme);
    mounted.release();
    const late = vi.fn();
    mounted.context.language.subscribe(late);
    shell.language = "bg";
    shell.theme = "dark";
    doc.dispatchEvent(new Event("i18n:change"));
    doc.dispatchEvent(new Event("theme:change"));
    scheme.dispatchEvent(new Event("change"));
    expect([language, theme, late].map((listener) => listener.mock.calls.length)).toEqual([0, 0, 0]);
  });

  it("empties and removes the header slot, which was put first in the header group", () => {
    const mounted = mount();
    const slot = mounted.context.slots.headerActions as unknown as { props: Record<string, string>; isRemoved: boolean; children: unknown[] };
    expect(headerActions.prepend).toHaveBeenCalledWith(slot);
    expect(slot.props["data-header-slot"]).toBe("probe");
    slot.children.push("button");
    mounted.release();
    expect(slot.children).toEqual([]);
    expect(slot.isRemoved).toBe(true);
  });
});

describe("busy gate", () => {
  it("setBusy(true) holds the app busy until setBusy(false), which fires one idle event", () => {
    const { context } = mount();
    const idle = vi.fn();
    doc.addEventListener(IDLE_EVENT, idle);
    context.shell.setBusy(true);
    context.shell.setBusy(true);
    expect(isBusy()).toBe(true);
    context.shell.setBusy(false);
    expect(isBusy()).toBe(false);
    expect(idle).toHaveBeenCalledOnce();
  });

  it("unmounting a busy mini-app clears its flag; a released context can no longer set it", () => {
    const mounted = mount();
    const idle = vi.fn();
    doc.addEventListener(IDLE_EVENT, idle);
    mounted.context.shell.setBusy(true);
    mounted.release();
    expect(isBusy()).toBe(false);
    expect(idle).toHaveBeenCalledOnce();
    mounted.context.shell.setBusy(true);
    expect(isBusy()).toBe(false);
  });

  it("stays busy while another owner (the shell's own task) still is", () => {
    const { context } = mount();
    const other = Symbol("other");
    setBusy(other, true);
    context.shell.setBusy(true);
    context.shell.setBusy(false);
    expect(isBusy()).toBe(true);
    setBusy(other, false);
    expect(isBusy()).toBe(false);
  });
});

describe("storage.prefs", () => {
  it("stores the short key under the area's prefix as JSON and reads it back", () => {
    const { context } = mount();
    expect(context.storage.area).toEqual({ prefix: PREFIX });
    expect(context.storage.prefs.set("theme", { dark: true })).toBe(true);
    expect([...storage.items]).toEqual([[`${PREFIX}theme`, '{"dark":true}']]);
    expect(context.storage.prefs.get("theme", null)).toEqual({ dark: true });
    context.storage.prefs.remove("theme");
    expect(storage.items.size).toBe(0);
    expect(context.storage.prefs.get("theme", "fallback")).toBe("fallback");
  });

  it.each(["", "../theme", "v2:theme", ":x", "a/b", "a b", "x\n", "quizzard:v1:lang"])("rejects the key %j for get, set and remove", (key) => {
    const { prefs } = mount().context.storage;
    expect(() => prefs.get(key, 1)).toThrow(/PREF_KEY_INVALID/);
    expect(() => prefs.set(key, 1)).toThrow(/PREF_KEY_INVALID/);
    expect(() => { prefs.remove(key); }).toThrow(/PREF_KEY_INVALID/);
    expect(storage.items.size).toBe(0);
  });

  it("set returns false instead of throwing when storage is full or blocked", () => {
    const { prefs } = mount().context.storage;
    storage.isFull = true;
    expect(prefs.set("theme", "dark")).toBe(false);
    vi.stubGlobal("localStorage", undefined); // blocked: every access throws
    expect(prefs.set("theme", "dark")).toBe(false);
    expect(prefs.get("theme", "light")).toBe("dark"); // kept in memory for this visit
  });

  it("notifySaved reaches the persist hook (PLAN T-15 asks the browser there)", () => {
    mount().context.storage.notifySaved();
    expect(noteDataSaved).toHaveBeenCalledOnce();
  });
});

describe("shell adapters", () => {
  it("toast passes the text, tone and a wrapped action to the shell's toast", () => {
    const run = vi.fn();
    mount().context.shell.toast("<b>Saved</b>", { tone: "error", action: { label: "Undo", run } });
    const options = vi.mocked(showToast).mock.calls[0]?.[0];
    expect(options).toMatchObject({ message: "<b>Saved</b>", tone: "error", action: { label: "Undo" } });
    options?.action?.run();
    expect(run).toHaveBeenCalledOnce();
  });

  it("confirm maps text → message and resolves with the shell's answer", async () => {
    await expect(mount().context.shell.confirm({ title: "Reset?", text: "Scores go.", confirm: "Reset", danger: false })).resolves.toBe(true);
    expect(confirmAction).toHaveBeenCalledWith({ title: "Reset?", message: "Scores go.", confirm: "Reset", danger: false });
  });

  it("share hands text, title and url to the shell's share and returns its result", async () => {
    await expect(mount().context.shell.share({ text: "Teams", title: "T", url: "https://x.test/" })).resolves.toBe("cancelled");
    expect(shareText).toHaveBeenCalledWith("Teams", { title: "T", url: "https://x.test/" });
  });

  it("host is quizzard and query is a copy", () => {
    const { context } = mount();
    expect(context.host).toBe("quizzard");
    context.query.set("n", "2");
    expect(mount().context.query.get("n")).toBe("1");
  });
});
