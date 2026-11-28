// The pictures an assistant named (core draft/pictures.ts), fetched from Wikimedia Commons by the
// creator itself before the quiz is taken: one question to Commons for up to 50 files (their address at a
// size that fits the slide, their author and licence), then each file, prepared like a picture the
// person picked (media/import.ts). A name Commons does not have comes back as an issue for the assistant —
// that is what stops a made-up picture. Nothing but the file names leaves the device.
import type { MediaEntry } from "@simeonts/quizzard-quiz-core";
import type { DraftCode, DraftIssue, PendingPicture } from "@simeonts/quizzard-quiz-core/draft";
import { hasRoomFor } from "../../storage/space.ts";

/** What fetching the pictures gave: every file and its description, or why none could be fetched. */
export type PictureOutcome =
  | { readonly ok: true; readonly entries: readonly MediaEntry[]; readonly files: ReadonlyMap<string, Blob>; readonly issues: readonly DraftIssue[] }
  | { readonly ok: false; readonly reason: "offline" | "busy" | "space" };

/** What Commons says of one file. */
type Found = { readonly url: string; readonly credit: string } | "missing" | "not-image";

const API = "https://commons.wikimedia.org/w/api.php";
/** Long side of the copy that is fetched: the slide's own size; the import scales it again to fit. */
const EDGE = 1600;
/** Most files in one question to Commons (its limit). */
const BATCH = 50;
/** Longest credit line, in characters. */
const CREDIT_MAX = 140;

/** Thrown when Commons cannot be reached or asks to wait. */
class CommonsUnreachable extends Error {
  constructor(readonly reason: "offline" | "busy") {
    super(reason);
  }
}

/** A fetch that says "offline" when there is no connection and "busy" when Commons asks to wait. */
async function get(url: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
  } catch {
    throw new CommonsUnreachable("offline");
  }
  if (response.status === 429 || response.status >= 500) throw new CommonsUnreachable("busy");
  return response;
}

/** The text of an author field, which Commons gives as a bit of HTML; never put in the page as HTML. */
function plain(html: unknown): string {
  if (typeof html !== "string") return "";
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent;
  return text.replace(/\s+/g, " ").trim();
}

/** "Author · Licence · Wikimedia Commons", cut to a line. */
function creditOf(info: Record<string, unknown>): string {
  const meta = (info["extmetadata"] ?? {}) as Record<string, { value?: unknown } | undefined>;
  const parts = [plain(meta["Artist"]?.value), plain(meta["LicenseShortName"]?.value), "Wikimedia Commons"].filter((part) => part !== "");
  const line = parts.join(" · ");
  return line.length > CREDIT_MAX ? `${line.slice(0, CREDIT_MAX - 1)}…` : line;
}

/** What Commons answered for each asked title, following its renames and redirects. */
function answers(data: Record<string, unknown>, titles: readonly string[]): Map<string, Found> {
  const query = (data["query"] ?? {}) as Record<string, unknown>;
  const steps = new Map<string, string>();
  const moves = [query["normalized"], query["redirects"]].flatMap((list) => (Array.isArray(list) ? (list as { from?: unknown; to?: unknown }[]) : []));
  for (const step of moves) if (typeof step.from === "string" && typeof step.to === "string") steps.set(step.from, step.to);
  const pages = new Map<string, Record<string, unknown>>();
  if (Array.isArray(query["pages"])) for (const page of query["pages"] as Record<string, unknown>[]) if (typeof page["title"] === "string") pages.set(page["title"], page);
  const found = new Map<string, Found>();
  for (const title of titles) {
    let name = title;
    for (let hop = 0; hop < 3 && steps.has(name); hop += 1) name = steps.get(name) ?? name;
    const page = pages.get(name);
    const info = Array.isArray(page?.["imageinfo"]) ? (page["imageinfo"] as Record<string, unknown>[])[0] : undefined;
    const url = info?.["thumburl"] ?? info?.["url"];
    if (!page || page["missing"] !== undefined || page["invalid"] !== undefined || !info || typeof url !== "string") found.set(title, "missing");
    else if (typeof info["mime"] !== "string" || !info["mime"].startsWith("image/")) found.set(title, "not-image");
    else found.set(title, { url, credit: creditOf(info) });
  }
  return found;
}

/** Asks Commons about the files, 50 at a time. */
async function lookUp(titles: readonly string[]): Promise<Map<string, Found>> {
  const found = new Map<string, Found>();
  for (let start = 0; start < titles.length; start += BATCH) {
    const part = titles.slice(start, start + BATCH);
    const params = new URLSearchParams({ action: "query", format: "json", formatversion: "2", origin: "*", redirects: "1", prop: "imageinfo", iiprop: "url|mime|extmetadata", iiextmetadatafilter: "Artist|LicenseShortName", iiurlwidth: String(EDGE), iiurlheight: String(EDGE), titles: part.join("|") });
    const response = await get(`${API}?${params.toString()}`);
    if (!response.ok) throw new CommonsUnreachable("busy");
    const data = (await response.json()) as Record<string, unknown>;
    for (const [title, one] of answers(data, part)) found.set(title, one);
  }
  return found;
}

/** An issue for the assistant at the place the picture was named. */
function issueAt(picture: PendingPicture, code: DraftCode): DraftIssue {
  return { level: "error", path: picture.path, code, values: { ...picture.place, title: picture.title } };
}

/** Fetches one file and prepares it like a picked picture; an issue when it is not one, `"space"` when the device is full. */
async function fetchOne(picture: PendingPicture, found: { readonly url: string; readonly credit: string }, usedBytes: number): Promise<MediaEntry & { readonly blob: Blob } | DraftIssue | "space"> {
  const response = await get(found.url);
  if (!response.ok) return issueAt(picture, "picture-not-found");
  const blob = await response.blob();
  const file = new File([blob], picture.title.replace(/^File:/, ""), { type: blob.type });
  const { importMedia } = await import("../../media/import.ts");
  const result = await importMedia(file, { type: "image", usedBytes, id: picture.id, hasRoomFor });
  if (!result.ok) return result.reason === "no-space" ? "space" : issueAt(picture, "picture-not-image");
  return { ...result.entry, credit: found.credit, blob: result.blob };
}

/**
 * Fetches the pictures a draft named.
 * @param pictures - the pictures, one per file
 * @param usedBytes - media the quiz already has
 * @param progress - told after each file: how many are done of how many
 */
export async function fetchPictures(pictures: readonly PendingPicture[], usedBytes: number, progress: (done: number, count: number) => void): Promise<PictureOutcome> {
  try {
    const found = await lookUp([...new Set(pictures.map((picture) => picture.title))]);
    const issues: DraftIssue[] = [];
    const entries: MediaEntry[] = [];
    const files = new Map<string, Blob>();
    let used = usedBytes;
    for (const [index, picture] of pictures.entries()) {
      progress(index, pictures.length);
      const one = found.get(picture.title) ?? "missing";
      if (one === "missing" || one === "not-image") {
        issues.push(issueAt(picture, one === "missing" ? "picture-not-found" : "picture-not-image"));
        continue;
      }
      const made = await fetchOne(picture, one, used);
      if (made === "space") return { ok: false, reason: "space" };
      if ("code" in made) {
        issues.push(made);
        continue;
      }
      const { blob, ...entry } = made;
      entries.push(entry);
      files.set(entry.id, blob);
      used += entry.bytes;
    }
    progress(pictures.length, pictures.length);
    return { ok: true, entries, files, issues };
  } catch (error) {
    if (error instanceof CommonsUnreachable) return { ok: false, reason: error.reason };
    throw error;
  }
}
