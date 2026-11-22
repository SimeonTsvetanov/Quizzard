// Build presets of mini-app packages (PLAN §1.3): each package exports `vite-preset.ts`
// (`{ id, css, alias, plugins }`); app/vite.config.ts lists the packages with their folder and merges
// them here. The merged plugins include `quizzard-miniapp-css`, which scopes every stylesheet inside a
// package's folder (miniapp-css.ts) in dev and build, and fails the build on a token-check finding.
// With no package listed it changes nothing.
import { readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import postcss from "postcss";
import type { Plugin, PluginOption } from "vite";
import { checkMiniAppCss, formatFinding, listCssFiles, readCssFiles, shellTokens } from "../../scripts/check-miniapp-tokens.ts";
import { transformMiniAppCss, type MiniAppCssMode } from "./miniapp-css.ts";
import { MiniAppCssError } from "./miniapp-css-errors.ts";
import { collectGlobalNames, type GlobalNameOwner } from "./miniapp-css-names.ts";

/** What a mini-app package's `vite-preset.ts` exports. */
export interface MiniAppVitePreset {
  /** = `meta.id`: layer `miniapp.<id>`, scope `[data-miniapp="<id>"]`. */
  readonly id: string;
  readonly css: MiniAppCssMode;
  /** Module aliases the package needs (e.g. a CSP-safe stand-in); merged into the app's. */
  readonly alias: Readonly<Record<string, string>>;
  /** Extra Vite plugins the package needs (e.g. Tailwind). */
  readonly plugins: readonly PluginOption[];
}

/** One mini-app package of the build: its preset and its folder. */
export interface MiniAppPackage {
  readonly preset: MiniAppVitePreset;
  /** Absolute folder of the package; every `.css` below it is mini-app CSS. */
  readonly root: string;
}

/** The shell's CSS, read for global names (every file) and tokens (`tokenFiles`). */
export interface ShellStyles {
  /** Absolute folders and files of the shell's stylesheets. */
  readonly paths: readonly string[];
  /** Absolute files that define the tokens a mini-app may use (tokens.css + generated accent). */
  readonly tokenFiles: readonly string[];
  /** Folder that relative paths in messages start from. */
  readonly projectRoot: string;
}

/** Output of {@link mergeMiniAppPresets}, spread into the Vite config. */
export interface MergedMiniAppPresets {
  readonly alias: Record<string, string>;
  readonly plugins: PluginOption[];
}

/**
 * Merges the presets of the listed packages.
 * @throws {@link Error} on a duplicate id, nested package folders or one alias with two targets
 */
export function mergeMiniAppPresets(packages: readonly MiniAppPackage[], shell: ShellStyles): MergedMiniAppPresets {
  const alias: Record<string, string> = {};
  const ids = new Set<string>();
  for (const { preset, root } of packages) {
    if (ids.has(preset.id)) throw new Error(`Mini-app preset "${preset.id}" is listed twice`);
    ids.add(preset.id);
    const nested = packages.find((other) => other.root !== root && isInside(root, other.root));
    if (nested !== undefined) throw new Error(`Mini-app folder ${root} is inside ${nested.root}; each package needs its own folder`);
    for (const [name, target] of Object.entries(preset.alias)) {
      if (name in alias && alias[name] !== target) throw new Error(`Alias "${name}" points to ${String(alias[name])} and ${target} (mini-app "${preset.id}")`);
      alias[name] = target;
    }
  }
  return { alias, plugins: [...packages.flatMap(({ preset }) => preset.plugins), miniAppCssPlugin(packages, shell)] };
}

/**
 * The Vite plugin that scopes mini-app CSS. Runs after Vite's CSS plugin (imports inlined, Tailwind
 * compiled) and before Vite turns the CSS into a module, so dev and build get the same output.
 */
export function miniAppCssPlugin(packages: readonly MiniAppPackage[], shell: ShellStyles): Plugin {
  const names = new Map<string, GlobalNameOwner>();
  const label = (file: string): string => relative(shell.projectRoot, file);
  return {
    name: "quizzard-miniapp-css",
    buildStart() {
      names.clear();
      if (packages.length === 0) return;
      for (const file of listCssFiles(shell.paths)) {
        const root = postcss.parse(readFileSync(file, "utf8"), { from: file });
        for (const [key, owner] of collectGlobalNames(root, "the shell", label(file))) names.set(key, owner);
      }
      const tokens = shellTokens(shell.tokenFiles.map((file) => readFileSync(file, "utf8")));
      const findings = packages.flatMap(({ root }) => checkMiniAppCss(readCssFiles([root]).map((file) => ({ ...file, path: label(file.path) })), tokens));
      if (findings.length > 0) this.error(`Mini-app CSS token check (scripts/check-miniapp-tokens.ts):\n${findings.map(formatFinding).join("\n")}`);
    },
    transform(code, id) {
      const owner = packageOf(packages, id);
      if (owner === null) return null;
      try {
        const result = transformMiniAppCss(code, { id: owner.preset.id, mode: owner.preset.css, reserved: names, file: label(cleanId(id)) });
        for (const warning of result.warnings) this.warn(warning.message);
        for (const [key, definition] of result.names) names.set(key, definition);
        return { code: result.css, map: null };
      } catch (error: unknown) {
        if (error instanceof MiniAppCssError) this.error(error.message);
        throw error;
      }
    },
  };
}

/** The package a module id belongs to, when it is a stylesheet Vite processes as CSS. */
function packageOf(packages: readonly MiniAppPackage[], id: string): MiniAppPackage | null {
  if (id.startsWith("\0")) return null;
  const query = id.includes("?") ? id.slice(id.indexOf("?") + 1) : "";
  // `?raw`/`?url` imports are a string or a URL, not CSS for the cascade.
  if (/(^|&)(raw|url)(&|=|$)/.test(query)) return null;
  const path = cleanId(id);
  if (!path.endsWith(".css")) return null;
  return packages.find(({ root }) => isInside(path, root)) ?? null;
}

function cleanId(id: string): string {
  return id.split("?")[0] ?? id;
}

function isInside(path: string, folder: string): boolean {
  const base = resolve(folder);
  return resolve(path).startsWith(base.endsWith(sep) ? base : `${base}${sep}`);
}
