// Names the JavaScript chunks of mini-app packages `assets/miniapp-<id>-<name>-<hash>.js` (PLAN T-10),
// so scripts/size-check.ts can hold each mini-app's lazy code to its own budget and a reader of
// app/dist sees whose code a chunk is. Added by mergeMiniAppPresets; other chunks keep Vite's names.
import { isAbsolute, relative } from "node:path";
import type { Plugin } from "vite";
import { miniAppChunkPrefix } from "../../scripts/size-check.ts";

/** Vite's default chunk name pattern (build.assetsDir "assets"). */
const DEFAULT_CHUNK_FILE_NAMES = "assets/[name]-[hash].js";

/** A package folder by mini-app id, as the chunk namer needs it. */
export interface ChunkOwner {
  readonly id: string;
  /** Absolute folder of the package. */
  readonly root: string;
}

/** What the namer reads of a chunk (rolldown's `PreRenderedChunk`). */
export interface ChunkFacts {
  readonly facadeModuleId: string | null;
  readonly moduleIds: readonly string[];
}

/**
 * Returns the mini-app a chunk belongs to: the package of its facade module (the body, a lazy part
 * or the Help module), or of every module when it has no facade.
 * @returns the id, or null for shell chunks and chunks mixing several owners
 */
export function chunkOwner(chunk: ChunkFacts, owners: readonly ChunkOwner[]): string | null {
  const ownerOf = (moduleId: string): string | null => owners.find(({ root }) => isInside(moduleId, root))?.id ?? null;
  if (chunk.facadeModuleId !== null) return ownerOf(chunk.facadeModuleId);
  const ids = new Set(chunk.moduleIds.map(ownerOf));
  const [only] = ids;
  return ids.size === 1 && only !== undefined ? only : null;
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
        return id === null ? DEFAULT_CHUNK_FILE_NAMES : `assets/${miniAppChunkPrefix(id)}[name]-[hash].js`;
      };
      return { build: { rolldownOptions: { output: { chunkFileNames } } } };
    },
  };
}

function isInside(path: string, folder: string): boolean {
  const fromFolder = relative(folder, path.split("?")[0] ?? path);
  return fromFolder !== "" && !fromFolder.startsWith("..") && !isAbsolute(fromFolder);
}
