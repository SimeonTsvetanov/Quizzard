// Build preset of the Answer sheet mini-app for the shell's Vite config (PLAN §1.3).
// Data only: "shared" = Level 1 body that uses the shell's forge components and adds its `sheet-*` CSS.

/** What the shell's build needs to know about this mini-app. */
export interface MiniAppVitePreset {
  /** = `meta.id`; scopes the CSS under `[data-miniapp="sheet"]`. */
  readonly id: "sheet";
  /** "shared": no reset layer; the shell's `.button` rules apply inside the body on purpose. */
  readonly css: "shared" | "isolated";
  /** Module aliases the body needs; none. */
  readonly alias: Readonly<Record<string, string>>;
  /** Extra Vite plugins the body needs; none. */
  readonly plugins: readonly never[];
}

/** The Answer sheet preset: shared CSS, no aliases, no plugins. */
export const vitePreset: MiniAppVitePreset = { id: "sheet", css: "shared", alias: {}, plugins: [] };
