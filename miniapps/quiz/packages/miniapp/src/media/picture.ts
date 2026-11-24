// A picked picture on its way into a quiz (SPEC §5; lazy, with import.ts). The rules:
// - never enlarged; a picture longer than 1920 px on its long side is scaled down to 1920;
// - a GIF is kept as it is (it may be animated); a PNG or WebP that already fits is kept as it is;
// - what is scaled is saved again: as JPEG — unless it has see-through parts, then in its own format;
// - a JPEG is always saved again, so the camera's notes (EXIF: place, device) do not travel with the
//   quiz and the way the photo was held is baked into the pixels;
// - a small still (480 px) is kept with the entry for thumbnails.
// Decoding honours the photo's EXIF orientation (`imageOrientation: "from-image"`).
import { PICTURE_MAX_EDGE_PX, POSTER_MAX_CHARS, POSTER_MAX_EDGE_PX, fitWithin } from "@simeonts/quizzard-quiz-core";

/** What a file becomes: the bytes to store and what is known of them. */
export interface Prepared {
  readonly blob: Blob;
  readonly width?: number;
  readonly height?: number;
  readonly seconds?: number;
  readonly poster?: string;
}

const JPEG = "image/jpeg";
/** Quality of a picture that was scaled down. */
const SCALED_QUALITY = 0.86;
/** Quality of a JPEG saved again at its own size. */
const SAME_SIZE_QUALITY = 0.92;
const POSTER_QUALITY = 0.72;

/** Something a canvas can draw, with its size as people see it (orientation applied). */
interface Decoded {
  readonly source: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  close(): void;
}

/** The picture's size from its header, through an `<img>` — nothing is decoded into memory for it. */
function measure(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => { resolve(image.naturalWidth > 0 && image.naturalHeight > 0 ? image : null); });
    image.addEventListener("error", () => { resolve(null); });
    image.src = url;
  });
}

/**
 * Decodes a picture at the size it will be stored at — a 50-megapixel photo never sits in memory at
 * full size. Falls back to drawing the `<img>` where `createImageBitmap` cannot take the options.
 */
async function decode(file: Blob, url: string): Promise<{ readonly full: { readonly width: number; readonly height: number }; readonly picture: Decoded } | null> {
  const image = await measure(url);
  if (image === null) return null;
  const full = { width: image.naturalWidth, height: image.naturalHeight };
  const size = fitWithin(full.width, full.height, PICTURE_MAX_EDGE_PX);
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image", resizeWidth: size.width, resizeHeight: size.height, resizeQuality: "high" });
    // A browser that resized before turning the photo would give the sides the other way round: then the `<img>` is drawn instead.
    if (bitmap.width === size.width && bitmap.height === size.height) return { full, picture: { source: bitmap, width: size.width, height: size.height, close: () => { bitmap.close(); } } };
    bitmap.close();
  } catch {
    // An older browser: the `<img>` below is already oriented by the browser.
  }
  return { full, picture: { source: image, width: size.width, height: size.height, close: () => undefined } };
}

/** Draws a picture on a new canvas of the given size. */
function paint(picture: Decoded, width: number, height: number): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context === null) return null;
  context.imageSmoothingQuality = "high";
  context.drawImage(picture.source, 0, 0, width, height);
  return canvas;
}

/** Whether any pixel of a canvas lets the background through. */
function isSeeThrough(canvas: HTMLCanvasElement): boolean {
  const data = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data;
  if (!data) return false;
  for (let index = 3; index < data.length; index += 4) if ((data[index] ?? 255) < 250) return true;
  return false;
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => { canvas.toBlob(resolve, type, quality); });
}

/**
 * A small still of anything a canvas can draw, as a `data:` address; `undefined` when it cannot be
 * made or would be too large to keep inside the quiz.
 * @param source - the picture or video frame
 * @param width - its width
 * @param height - its height
 * @param isOpaque - `false` keeps see-through parts (WebP, or PNG where the browser has no WebP encoder)
 */
export function stillFrom(source: CanvasImageSource, width: number, height: number, isOpaque = true): string | undefined {
  const size = fitWithin(width, height, POSTER_MAX_EDGE_PX);
  const canvas = paint({ source, width, height, close: () => undefined }, size.width, size.height);
  if (canvas === null) return undefined;
  try {
    const still = isOpaque ? canvas.toDataURL(JPEG, POSTER_QUALITY) : canvas.toDataURL("image/webp", POSTER_QUALITY);
    return still.length <= POSTER_MAX_CHARS && /^data:image\/(jpeg|png|webp);base64,/.test(still) ? still : undefined;
  } catch {
    return undefined;
  }
}

/** The file with its type written on it (some pickers report none). */
export function typed(file: Blob, mime: string): Blob {
  return file.type === mime ? file : file.slice(0, file.size, mime);
}

/**
 * Prepares a picked picture for storage.
 * @param file - the file as picked
 * @param mime - its type (JPEG, PNG, WebP or GIF — already checked)
 * @returns the bytes to store with their size and still, or `null` when the browser cannot read it as a picture
 */
export async function preparePicture(file: Blob, mime: string): Promise<Prepared | null> {
  const url = URL.createObjectURL(file);
  try {
    const decoded = await decode(file, url);
    if (decoded === null) return null;
    const { full, picture } = decoded;
    try {
      const isScaled = picture.width !== full.width || picture.height !== full.height;
      const canvas = paint(picture, picture.width, picture.height);
      if (canvas === null) return null;
      const isOpaque = mime === JPEG || !isSeeThrough(canvas);
      const poster = stillFrom(canvas, picture.width, picture.height, isOpaque);
      const still = poster === undefined ? {} : { poster };
      // Kept as it is: a GIF always (animated), a PNG or WebP that already fits.
      if (mime === "image/gif" || (!isScaled && mime !== JPEG)) return { blob: typed(file, mime), width: full.width, height: full.height, ...still };
      const blob = await encode(canvas, isOpaque ? JPEG : mime, isScaled ? SCALED_QUALITY : SAME_SIZE_QUALITY);
      return blob === null ? null : { blob, width: picture.width, height: picture.height, ...still };
    } finally {
      picture.close();
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
