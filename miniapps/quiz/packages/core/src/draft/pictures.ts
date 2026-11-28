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

/** A Commons page that names a file: `/wiki/File:…`, `/wiki/Special:FilePath/…`, `/wiki/Special:Redirect/file/…` — also a Wikipedia's own file page, which shows the Commons file of that name. */
const FILE_PAGE = /^https?:\/\/(?:commons|[a-z-]+)\.(?:m\.)?(?:wikimedia|wikipedia)\.org\/wiki\/(?:(?:File|Image|Файл):|Special:FilePath\/|Special:Redirect\/file\/)([^?#]+)/i;
/** `/w/index.php?title=File:…`. */
const INDEX_PAGE = /^https?:\/\/(?:commons|[a-z-]+)\.(?:m\.)?(?:wikimedia|wikipedia)\.org\/w\/index\.php\?(?:.*&)?title=(?:File|Image):([^&#]+)/i;
/** A file's own address on Commons' file hosts, full size or a thumbnail. */
const COMMONS_FILE = /^https?:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/i;
/** A host name at the start of an address written without its scheme ("commons.wikimedia.org/…"). */
const BARE_HOST = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\//i;

/**
 * A title as Commons writes it: `File:` first, spaces for underscores, the first letter in capitals. A file
 * name never has "/", "\\" or ":" in it (MediaWiki refuses them), and always ends in a file ending.
 */
function asTitle(name: string): string | undefined {
  const plain = name.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const bare = plain.replace(/^(?:file|image|файл):\s*/i, "");
  if (bare === "" || /[#<>[\]|{}/\\:]/.test(bare) || !/\.[a-z0-9]{2,5}$/i.test(bare)) return undefined;
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
 * a page that shows the file (Commons or a Wikipedia), or its file's address on upload.wikimedia.org;
 * `undefined` for anything else — another website, a made-up address, a name without a file ending.
 * Whether the file exists is for Commons to say (the creator asks it before it takes the quiz).
 * @param value - what the draft holds
 */
export function commonsTitle(value: string): string | undefined {
  const written = value.trim();
  const text = BARE_HOST.test(written) ? `https://${written}` : written;
  for (const pattern of [FILE_PAGE, INDEX_PAGE, COMMONS_FILE]) {
    const part = pattern.exec(text)?.[1];
    if (part !== undefined) return asTitle(decoded(part.replace(/\+/g, " ")));
  }
  return /^[a-z]+:\/\//i.test(text) ? undefined : asTitle(text);
}
