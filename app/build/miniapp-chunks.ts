// Names the JavaScript chunks of mini-app packages `assets/miniapp-<id>-<name>-<hash>.js` (PLAN T-10),
// so scripts/size-check.ts can hold each mini-app's lazy code to its own budget and a reader of
// app/dist sees whose code a chunk is. The chunk of the module the registry's `load()` imports (the
// package's `"."` export) is `miniapp-<id>-main-<hash>.js`: size-check measures what the first open
// loads from it (PLAN T-12). Added by mergeMiniAppPresets; other chunks keep Vite's names.
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import type { Plugin } from "vite";
import { miniAppChunkPrefix } from "../../scripts/size-check.ts";

/** Vite's default chunk name pattern (build.assetsDir "assets"). */
const DEFAULT_CHUNK_FILE_NAMES = "assets/[name]-[hash].js";

/** A package folder by mini-app id, as the chunk namer needs it. */
export interface ChunkOwner {
  readonly id: string;
  /** Absolute folder of the package. */
  readonly root: string;
  /** Absolute path of the package's main module (its `"."` export); its chunk is named `main`. */
  readonly main?: string | null;
}

/** The name of a mini-app's main chunk (the module `MiniAppEntry.load` imports). */
export const MAIN_CHUNK_NAME = "main";

/**
 * Returns the absolute path of a package's main module: the `"."` export of its package.json (a string
 * or its `default` condition).
 * @param root - the package folder
 * @returns null when the folder has no package.json or no `"."` export
 */
export function packageMainModule(root: string): string | null {
  const file = join(root, "package.json");
  if (!existsSync(file)) return null;
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
  const exportsField: unknown = typeof parsed === "object" && parsed !== null ? Reflect.get(parsed, "exports") : undefined;
  const dot: unknown = typeof exportsField === "object" && exportsField !== null ? Reflect.get(exportsField, ".") : undefined;
  const target: unknown = typeof dot === "object" && dot !== null ? Reflect.get(dot, "default") : dot;
  return typeof target === "string" ? join(root, target) : null;
}

/** What the namer reads of a chunk (rolldown's `PreRenderedChunk`). */
export interface ChunkFacts {
  readonly facadeModuleId: string | null;
  readonly moduleIds: readonly string[];
}

/**
 * Returns the mini-app a chunk belongs to: the package of its facade module (the body, a lazy part
 * or the Help module); without a facade, the one package of its own modules, where installed
 * dependencies (`node_modules`) count for nobody — a chunk with a mini-app's module and the
 * libraries only it uses (React for Scores) is that mini-app's code.
 * @returns the id, or null for shell chunks, chunks of dependencies only and chunks mixing owners
 */
export function chunkOwner(chunk: ChunkFacts, owners: readonly ChunkOwner[]): string | null {
  const ownerOf = (moduleId: string): string | null => owners.find(({ root }) => isInside(moduleId, root))?.id ?? null;
  if (chunk.facadeModuleId !== null) return ownerOf(chunk.facadeModuleId);
  const ids = new Set(chunk.moduleIds.filter((moduleId) => !isDependency(moduleId)).map(ownerOf));
  const [only] = ids;
  return ids.size === 1 && only !== undefined ? only : null;
}

/** An installed package's module (rolldown's helpers start with `\0` and are nobody's too). */
function isDependency(moduleId: string): boolean {
  return moduleId.startsWith("\0") || /[\\/]node_modules[\\/]/.test(moduleId);
}

/**
 * The Vite plugin that renames mini-app chunks; it sets only `chunkFileNames` (entry and asset names
 * stay Vite's, the service worker precaches the files whatever their names).
 */
export function miniAppChunksPlugin(owners: readonly ChunkOwner[]): Plugin {
  return {
    name: "quizzard-miniapp-chunks",
    apply: "build",
    config() {
      if (owners.length === 0) return null;
      const chunkFileNames = (chunk: ChunkFacts): string => {
        const id = chunkOwner(chunk, owners);
        if (id === null) return DEFAULT_CHUNK_FILE_NAMES;
        const isMain = owners.some(({ main }) => main != null && main === chunk.facadeModuleId);
        return `assets/${miniAppChunkPrefix(id)}${isMain ? MAIN_CHUNK_NAME : "[name]"}-[hash].js`;
      };
      return { build: { rolldownOptions: { output: { chunkFileNames } } } };
    },
  };
}

function isInside(path: string, folder: string): boolean {
  const fromFolder = relative(folder, path.split("?")[0] ?? path);
  return fromFolder !== "" && !fromFolder.startsWith("..") && !isAbsolute(fromFolder);
}
