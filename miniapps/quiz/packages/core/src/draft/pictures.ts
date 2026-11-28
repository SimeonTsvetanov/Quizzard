// Pictures of a draft (guide.ts, "Pictures"): an assistant names a file of Wikimedia Commons — the only
// source, so every picture is free to use and carries its author and licence — and Quizzard fetches it
// itself (the creator's ai/pictures.ts). Here: what counts as a Commons file name, and the list of
// pictures a converted draft still waits for.

/** A picture a converted draft points at and the creator must still fetch. */
export interface PendingPicture {
  /** The media id the question already points at. */
  readonly id: string;
  /** The file's title on Commons, `File:…` with spaces. */
  readonly title: string;
  /** Where in the draft it was named, for the issue when it cannot be fetched. */
  readonly path: string;
  /** `round` and `question` of the place (from 1), for the issue's words. */
  readonly place: Readonly<Record<string, number>>;
}

/** The hosts whose addresses name a Commons file. */
const COMMONS_PAGE = /^https?:\/\/(?:commons\.(?:m\.)?wikimedia\.org)\/wiki\/(.+)$/i;
const COMMONS_FILE = /^https?:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/i;

/** A title as Commons writes it: `File:` first, spaces for underscores, the first letter of the name in capitals. */
function asTitle(name: string): string | undefined {
  const plain = name.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const bare = plain.replace(/^(?:file|image|файл):\s*/i, "");
  if (bare === "" || /[#<>[\]|{}]/.test(bare) || !/\.[a-z0-9]{2,5}$/i.test(bare)) return undefined;
  return `File:${bare.charAt(0).toUpperCase()}${bare.slice(1)}`;
}

/** Decodes `%…` in an address part; the part itself when it is not valid. */
function decoded(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

/**
 * The Commons title a draft's picture names, from its file name ("File:Eiffel Tower.jpg", "Eiffel_Tower.jpg"),
 * its page ("https://commons.wikimedia.org/wiki/File:…") or its file's address on upload.wikimedia.org;
 * `undefined` for anything else — another website, a made-up address, a name without a file ending.
 * @param value - what the draft holds
 */
export function commonsTitle(value: string): string | undefined {
  const text = value.trim();
  const page = COMMONS_PAGE.exec(text)?.[1];
  if (page !== undefined) return /^(?:file|image):/i.test(decoded(page)) ? asTitle(decoded(page.split(/[?#]/)[0] ?? "")) : undefined;
  const file = COMMONS_FILE.exec(text)?.[1];
  if (file !== undefined) return asTitle(decoded(file));
  return /^[a-z]+:\/\//i.test(text) ? undefined : asTitle(text);
}
