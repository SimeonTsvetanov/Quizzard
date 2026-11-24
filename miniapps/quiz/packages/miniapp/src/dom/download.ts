// Saves a file the app made to the device: a link with `download` to a Blob address, clicked once.

/** How long the Blob's address is kept after the click (the browser has started the download by then). */
const RELEASE_AFTER_MS = 60_000;

/**
 * Offers a file for download.
 * @param blob - the file's content
 * @param name - the file's name
 */
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => { URL.revokeObjectURL(url); }, RELEASE_AFTER_MS);
}
