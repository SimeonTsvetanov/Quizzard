// The media files of an exported page (SPEC §6: "each media file embedded and turned back into a
// playable file when the page opens"): every file is a base64 block in the page; the first time a
// question needs one it becomes a Blob with an address an `<img>`, `<audio>` or `<video>` can load.
// Made on demand and kept, so a page with hundreds of megabytes of media opens at once.
import { EXPORT_MEDIA_ATTR } from "@simeonts/quizzard-quiz-core/play";

/** Base64 is decoded in pieces of this many characters (a multiple of 4), so no single string step is huge. */
const CHUNK = 1 << 20;

/**
 * Bytes of a base64 text.
 * @param base64 - the text of a media block
 */
export function decodeBase64(base64: string): Uint8Array<ArrayBuffer> {
  const clean = base64.trim();
  const padding = clean.endsWith("==") ? 2 : Number(clean.endsWith("="));
  const bytes = new Uint8Array(Math.max(0, (clean.length / 4) * 3 - padding));
  let offset = 0;
  for (let start = 0; start < clean.length; start += CHUNK) {
    const binary = atob(clean.slice(start, start + CHUNK));
    for (let index = 0; index < binary.length; index += 1) bytes[offset + index] = binary.charCodeAt(index);
    offset += binary.length;
  }
  return bytes;
}

/**
 * The media files embedded in a page, by id.
 * @param page - the exported page's document
 * @returns gives a file's address, or `null` when the page has no such file
 */
export function embeddedMedia(page: Document): (id: string) => string | null {
  const blocks = new Map<string, HTMLScriptElement>();
  for (const block of page.querySelectorAll<HTMLScriptElement>(`script[${EXPORT_MEDIA_ATTR}]`)) blocks.set(block.getAttribute(EXPORT_MEDIA_ATTR) ?? "", block);
  const urls = new Map<string, string | null>();
  return (id) => {
    const known = urls.get(id);
    if (known !== undefined) return known;
    const block = blocks.get(id);
    let url: string | null = null;
    try {
      if (block) url = URL.createObjectURL(new Blob([decodeBase64(block.textContent)], { type: block.getAttribute("data-mime") ?? "" }));
    } catch {
      url = null; // a block that is not base64: the question shows without its file
    }
    urls.set(id, url);
    return url;
  };
}
