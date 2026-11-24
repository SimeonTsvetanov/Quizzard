// Files as base64 text for the exported page, piece by piece: a file is read and encoded a slice at
// a time, so a 50 MB video is never one array and one string in memory, and between slices the page
// gets its turn — the button's progress moves and nothing freezes. Slices are a multiple of three
// bytes, so their base64 pieces join without padding in between.

/** Bytes read and encoded in one go: 768 KiB (a multiple of 3) — about one megabyte of text. */
export const CHUNK_BYTES = 3 * 256 * 1024;
/** `String.fromCharCode` takes this many bytes at once (an argument list has a limit). */
const CODE_BLOCK = 0x8000;
/** The page gets its turn when the work has held it this long. */
const YIELD_AFTER_MS = 24;

/** `Uint8Array.prototype.toBase64`, where the browser has it (2025 browsers). */
type WithBase64 = Uint8Array & { toBase64?: () => string };

/**
 * Bytes as base64 text.
 * @param bytes - the bytes
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const withNative = bytes as WithBase64;
  if (typeof withNative.toBase64 === "function") return withNative.toBase64();
  let binary = "";
  for (let start = 0; start < bytes.length; start += CODE_BLOCK) binary += String.fromCharCode(...bytes.subarray(start, start + CODE_BLOCK));
  return btoa(binary);
}

/**
 * A file as base64 text, one piece per slice; the pieces joined are the base64 of the whole file.
 * @param blob - the file
 * @param chunkBytes - bytes per slice; a multiple of 3
 */
export async function* base64Pieces(blob: Blob, chunkBytes: number = CHUNK_BYTES): AsyncGenerator<string, void, void> {
  let last = performance.now();
  for (let start = 0; start < blob.size; start += chunkBytes) {
    const piece = bytesToBase64(new Uint8Array(await blob.slice(start, start + chunkBytes).arrayBuffer()));
    if (performance.now() - last >= YIELD_AFTER_MS) {
      await new Promise<void>((resolve) => { setTimeout(resolve); });
      last = performance.now();
    }
    yield piece;
  }
}
