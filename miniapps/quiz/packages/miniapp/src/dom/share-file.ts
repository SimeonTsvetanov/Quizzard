// Whether this device's share sheet takes a file. Browsers differ: iPhone and iPad share any file;
// Chrome on Android only shares a few known kinds and says no to others — then the file is saved
// instead. Asked with the file itself, or with an empty stand-in of the same name and type.

/**
 * Whether `navigator.share` would take this file.
 * @param file - the file, or a stand-in with its name and type
 */
export function canShareFile(file: File): boolean {
  try {
    return typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}
