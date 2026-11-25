// What the trim bar shows behind its handles: frames of the video, or the loudness of the sound,
// drawn bit by bit as they are read (Mediabunny). A file it cannot read leaves the plain track.
import { ALL_FORMATS, AudioSampleSink, BlobSource, CanvasSink, Input } from "mediabunny";

/** Evenly spread moments of a clip: the middle of each of `count` parts. */
function moments(duration: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => ((index + 0.5) / count) * duration);
}

async function drawFrames(input: Input, canvas: HTMLCanvasElement, duration: number, signal: AbortSignal): Promise<void> {
  const track = await input.getPrimaryVideoTrack();
  const context = canvas.getContext("2d");
  if (track === null || context === null) return;
  const ratio = (await track.getDisplayWidth()) / Math.max(1, await track.getDisplayHeight());
  const tile = Math.max(24, Math.round(canvas.height * ratio));
  const count = Math.max(1, Math.ceil(canvas.width / tile));
  const sink = new CanvasSink(track, { width: tile, height: canvas.height, fit: "cover" });
  let index = 0;
  for await (const frame of sink.canvasesAtTimestamps(moments(duration, count))) {
    if (signal.aborted) return;
    if (frame) context.drawImage(frame.canvas, index * tile, 0);
    index += 1;
  }
}

/** The loudest sample of one decoded piece of sound, 0–1. */
function peak(data: Float32Array): number {
  let top = 0;
  for (const value of data) top = Math.max(top, Math.abs(value));
  return Math.min(1, top);
}

async function drawSound(input: Input, canvas: HTMLCanvasElement, duration: number, signal: AbortSignal): Promise<void> {
  const track = await input.getPrimaryAudioTrack();
  const context = canvas.getContext("2d");
  if (track === null || context === null) return;
  const step = 4;
  const sink = new AudioSampleSink(track);
  context.fillStyle = "oklch(87.9% 0.143 92)";
  let index = 0;
  for (const moment of moments(duration, Math.floor(canvas.width / step))) {
    if (signal.aborted) return;
    const sample = await sink.getSample(moment);
    if (sample) {
      const data = new Float32Array(sample.numberOfFrames);
      sample.copyTo(data, { planeIndex: 0, format: "f32-planar" });
      sample.close();
      const height = Math.max(2, peak(data) * canvas.height * 0.9);
      context.fillRect(index * step, (canvas.height - height) / 2, step - 1, height);
    }
    index += 1;
  }
}

/**
 * Draws the clip along a canvas: frames for a video, loudness for a sound.
 * @param file - the clip
 * @param canvas - sized in device pixels by the caller
 * @param isVideo - frames (true) or loudness (false)
 * @param signal - stops the drawing (another file was chosen)
 */
export async function drawStrip(file: Blob, canvas: HTMLCanvasElement, isVideo: boolean, signal: AbortSignal): Promise<void> {
  try {
    const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
    const duration = await input.computeDuration();
    await (isVideo ? drawFrames(input, canvas, duration, signal) : drawSound(input, canvas, duration, signal));
  } catch {
    // The plain track stays: the handles work without a picture behind them.
  }
}
