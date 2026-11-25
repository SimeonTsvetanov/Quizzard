// Cuts a clip to [start, end] and re-encodes it smaller, in the browser, with Mediabunny (WebCodecs;
// lazy: loaded with the cut window). The picked file is read in pieces from the disk, never whole
// (BlobSource), so its size is not a matter of memory; what is written is — it is collected here
// and the cut is stopped as soon as it has outgrown what a quiz takes (`maxBytes`), long before a
// phone runs out of memory. MP4 only: that is what a quiz file and an exported quiz carry.
import { ALL_FORMATS, BlobSource, Conversion, Input, Mp4OutputFormat, Output, Quality, StreamTarget, canEncode, type StreamTargetChunk } from "mediabunny";

/** How hard the clip is squeezed. */
export type CutLevel = "high" | "medium" | "low";

/** What to cut and how small to make it. */
export interface CutOptions {
  readonly file: Blob;
  readonly isVideo: boolean;
  readonly start: number;
  readonly end: number;
  /** The tallest picture allowed, in px; `null` = as it is. */
  readonly maxHeight: number | null;
  readonly level: CutLevel;
  /** The largest file wanted, in bytes: the cut stops when it is clearly past it. */
  readonly maxBytes: number;
  readonly onProgress: (fraction: number) => void;
  readonly signal: AbortSignal;
}

/** How a cut ended: the new file; too big for a quiz; or not possible in this browser. */
export type CutResult =
  | { readonly ok: true; readonly blob: Blob }
  | { readonly ok: false; readonly reason: "too-big" | "unsupported" | "cancelled" };

/** How far past the limit the written file may get before the cut is stopped (the last pieces are written late). */
const OVERSHOOT = 1.05;

/** Collects what the muxer writes, piece by piece with its place, and says how long the file is so far. */
function collector(): { readonly writable: WritableStream<StreamTargetChunk>; readonly size: () => number; readonly blob: (type: string) => Blob } {
  const pieces: StreamTargetChunk[] = [];
  let length = 0;
  const writable = new WritableStream<StreamTargetChunk>({
    write(chunk) {
      pieces.push(chunk);
      length = Math.max(length, chunk.position + chunk.data.byteLength);
    },
  });
  const blob = (type: string): Blob => {
    const bytes = new Uint8Array(length);
    for (const piece of pieces) bytes.set(piece.data, piece.position);
    pieces.length = 0; // the pieces are in the file now: not kept a second time
    return new Blob([bytes], { type });
  };
  return { writable, size: () => length, blob };
}

/** The height the picture is scaled to: never up. */
async function targetHeight(input: Input, maxHeight: number | null): Promise<number | null> {
  if (maxHeight === null) return null;
  const track = await input.getPrimaryVideoTrack();
  if (track === null || (await track.getDisplayHeight()) <= maxHeight) return null;
  return maxHeight;
}

/**
 * Whether the file is a clip this browser can read and decode: asked before the cut window opens, so
 * a file that only looks like a clip gets the usual refusal instead of an empty window.
 * @param file - the picked file
 * @param isVideo - whether a picture is wanted (else sound)
 */
export async function canRead(file: Blob, isVideo: boolean): Promise<boolean> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  try {
    const track = isVideo ? await input.getPrimaryVideoTrack() : await input.getPrimaryAudioTrack();
    return track !== null && (await track.canDecode());
  } catch {
    return false;
  } finally {
    input.dispose();
  }
}

/**
 * The sound codec the cut writes: AAC where the browser can encode it, else Opus (Firefox and Linux
 * have no AAC encoder; Opus in MP4 plays in every current browser). `null` when it can write neither.
 */
async function soundCodec(): Promise<"aac" | "opus" | null> {
  if (await canEncode("aac").catch(() => false)) return "aac";
  return (await canEncode("opus").catch(() => false)) ? "opus" : null;
}

/**
 * Whether this browser can write what a quiz carries: sound (AAC or Opus) and, for a video, an H.264
 * picture. Having the encoders is not enough, so the codecs themselves are asked.
 * @param isVideo - whether a picture is wanted too
 */
export async function canWriteMp4(isVideo: boolean): Promise<boolean> {
  return (await soundCodec()) !== null && (!isVideo || (await canEncode("avc").catch(() => false)));
}

/**
 * A clip's length in seconds as its file says; 0 when it cannot be read.
 * @param file - the clip
 */
export async function clipSeconds(file: Blob): Promise<number> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  try {
    return await input.computeDuration();
  } catch {
    return 0;
  } finally {
    input.dispose();
  }
}

/**
 * Cuts and shrinks a clip.
 * @param options - the file, the part to keep, how small to make it and the limit
 */
export async function cutClip(options: CutOptions): Promise<CutResult> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(options.file) });
  try {
    return await convert(options, input);
  } finally {
    input.dispose();
  }
}

/** Whether the cut was stopped — asked through a function, because the signal changes while the cut runs. */
function isStopped(signal: AbortSignal): boolean {
  return signal.aborted;
}

/** The cut itself, on an input the caller disposes of. */
async function convert(options: CutOptions, input: Input): Promise<CutResult> {
  const { isVideo, signal } = options;
  const written = collector();
  const output = new Output({ format: new Mp4OutputFormat(), target: new StreamTarget(written.writable) });
  const height = isVideo ? await targetHeight(input, options.maxHeight) : null;
  const quality = new Quality(options.level);
  // The codecs are named: a quiz carries H.264 with AAC (or Opus), whatever else MP4 allows and the browser offers.
  const sound = await soundCodec();
  if (sound === null) return { ok: false, reason: "unsupported" };
  const conversion = await Conversion.init({
    input,
    output,
    trim: { start: options.start, end: options.end },
    video: isVideo ? { codec: "avc", quality, ...(height === null ? {} : { height }) } : { discard: true },
    audio: { codec: sound, quality },
  });
  // The window was closed while the cut was being prepared: nothing is started.
  if (signal.aborted) return { ok: false, reason: "cancelled" };
  // Every track must make it: a video that would lose its sound, or its picture, is not the clip that was picked.
  const hasLost = conversion.discardedTracks.some((one) => one.reason !== "discarded_by_user");
  if (!conversion.isValid || hasLost) return { ok: false, reason: "unsupported" };
  const over = { isTooBig: false };
  conversion.onProgress = (fraction) => {
    options.onProgress(fraction);
    if (!over.isTooBig && written.size() > options.maxBytes * OVERSHOOT) {
      over.isTooBig = true;
      void conversion.cancel();
    }
  };
  signal.addEventListener("abort", () => { void conversion.cancel(); }, { once: true });
  try {
    await conversion.execute();
  } catch (error) {
    if (over.isTooBig) return { ok: false, reason: "too-big" };
    if (isStopped(signal)) return { ok: false, reason: "cancelled" };
    throw error;
  }
  if (written.size() > options.maxBytes) return { ok: false, reason: "too-big" };
  return { ok: true, blob: written.blob(isVideo ? "video/mp4" : "audio/mp4") };
}
