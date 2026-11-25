// Cuts a clip to [start, end] and re-encodes it smaller, in the browser, with Mediabunny (WebCodecs).
// MP4 first (plays everywhere); where the browser cannot encode what MP4 needs, WebM. A trial for the
// quiz creator: nothing here is used by the app yet.
import {
  ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output, Quality, WebMOutputFormat,
  canEncode, type ConversionOptions,
} from "mediabunny";

/** How hard the clip is squeezed. */
export type Level = "high" | "medium" | "low";

/** What to cut and how small to make it. */
export interface CutOptions {
  readonly file: Blob;
  readonly isVideo: boolean;
  readonly start: number;
  readonly end: number;
  /** The tallest picture allowed, in px; `null` = as it is. */
  readonly maxHeight: number | null;
  readonly level: Level;
  readonly onProgress: (fraction: number) => void;
  readonly signal: AbortSignal;
}

/** A finished cut. */
export interface CutResult {
  readonly blob: Blob;
  /** "MP4" or "WebM". */
  readonly container: string;
  /** What is inside the new file: "avc 1280×720 + aac". */
  readonly codecs: string;
  readonly ms: number;
  /** What did not make it into the file, in the library's words. */
  readonly dropped: readonly string[];
}

interface Container {
  readonly name: string;
  readonly mime: (isVideo: boolean) => string;
  readonly format: () => Mp4OutputFormat | WebMOutputFormat;
}

const CONTAINERS: readonly Container[] = [
  { name: "MP4", mime: (isVideo) => (isVideo ? "video/mp4" : "audio/mp4"), format: () => new Mp4OutputFormat() },
  { name: "WebM", mime: (isVideo) => (isVideo ? "video/webm" : "audio/webm"), format: () => new WebMOutputFormat() },
];

/** The height the picture is scaled to: never up. */
async function targetHeight(input: Input, maxHeight: number | null): Promise<number | null> {
  if (maxHeight === null) return null;
  const track = await input.getPrimaryVideoTrack();
  if (track === null || (await track.getDisplayHeight()) <= maxHeight) return null;
  return maxHeight;
}

interface Attempt {
  readonly conversion: Conversion;
  readonly output: Output<Mp4OutputFormat | WebMOutputFormat, BufferTarget>;
  readonly container: Container;
  readonly dropped: readonly string[];
}

/** Prepares the cut in one container and says which tracks it would lose. */
async function prepare(options: CutOptions, container: Container): Promise<Attempt> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(options.file) });
  const output = new Output({ format: container.format(), target: new BufferTarget() });
  const height = options.isVideo ? await targetHeight(input, options.maxHeight) : null;
  const quality = new Quality(options.level);
  const settings: ConversionOptions = {
    input,
    output,
    trim: { start: options.start, end: options.end },
    video: options.isVideo ? { quality, ...(height === null ? {} : { height }) } : { discard: true },
    audio: { quality },
  };
  const conversion = await Conversion.init(settings);
  const dropped = conversion.discardedTracks.filter((one) => one.reason !== "discarded_by_user").map((one) => `${one.track.type}: ${one.reason}`);
  return { conversion, output, container, dropped };
}

/** What a finished file holds, read back from the file itself. */
async function describe(blob: Blob): Promise<string> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(blob) });
  const video = await input.getPrimaryVideoTrack();
  const audio = await input.getPrimaryAudioTrack();
  const parts: string[] = [];
  if (video) parts.push(`${(await video.getCodec()) ?? "?"} ${String(await video.getDisplayWidth())}×${String(await video.getDisplayHeight())}`);
  if (audio) parts.push((await audio.getCodec()) ?? "?");
  return parts.join(" + ");
}

/**
 * Cuts and shrinks a clip.
 * @param options - the file, the part to keep and how small to make it
 * @throws when no container can hold the clip in this browser, or the cut was cancelled
 */
export async function cutClip(options: CutOptions): Promise<CutResult> {
  const started = performance.now();
  const attempts: Attempt[] = [];
  for (const container of CONTAINERS) {
    const attempt = await prepare(options, container);
    if (attempt.conversion.isValid) attempts.push(attempt);
    if (attempt.conversion.isValid && attempt.dropped.length === 0) break;
  }
  // The first container that keeps every track; else the first that works at all.
  const chosen = attempts.find((attempt) => attempt.dropped.length === 0) ?? attempts[0];
  if (chosen === undefined) throw new Error("This browser cannot re-encode this clip (no container kept its tracks).");
  chosen.conversion.onProgress = options.onProgress;
  options.signal.addEventListener("abort", () => { void chosen.conversion.cancel(); }, { once: true });
  await chosen.conversion.execute();
  const buffer = chosen.output.target.buffer;
  if (buffer === null) throw new Error("The cut produced no file.");
  const blob = new Blob([buffer], { type: chosen.container.mime(options.isVideo) });
  const ms = performance.now() - started;
  return { blob, container: chosen.container.name, codecs: await describe(blob).catch(() => "?"), ms, dropped: chosen.dropped };
}

/** What this browser can encode, for the report: "avc ✓ · vp9 ✓ · aac ✗ …". */
export async function encoders(): Promise<string> {
  const codecs = ["avc", "hevc", "vp9", "av1", "vp8", "aac", "opus", "mp3"] as const;
  const marks = await Promise.all(codecs.map(async (codec) => `${codec} ${(await canEncode(codec).catch(() => false)) ? "✓" : "✗"}`));
  return marks.join(" · ");
}
