// Typed errors and warnings of the mini-app CSS transform (miniapp-css.ts); the Vite plugin
// (miniapp-presets.ts) turns an error into a failed build and a warning into a build warning.

/** Why a mini-app stylesheet cannot be scoped; the build stops. */
export type MiniAppCssErrorCode =
  | "DOCUMENT_AT_RULE"
  | "INVALID_ID"
  | "UNSUPPORTED_SELECTOR"
  | "UNSUPPORTED_AT_RULE"
  | "RESERVED_LAYER"
  | "GLOBAL_NAME_COLLISION";

/** A mini-app stylesheet the transform refuses; `message` names the file and what to change. */
export class MiniAppCssError extends Error {
  /** Stable code for tests and tooling. */
  readonly code: MiniAppCssErrorCode;

  /**
   * Creates the error.
   * @param code - the stable code
   * @param message - what is wrong, where, and what to do
   */
  constructor(code: MiniAppCssErrorCode, message: string) {
    super(message);
    this.name = "MiniAppCssError";
    this.code = code;
  }
}

/** Something the transform keeps but a person should fix (the token check fails on most of them). */
export type MiniAppCssWarningCode = "FONT_FACE" | "IMPORTANT";

/** One warning of the transform; unlike a {@link MiniAppCssError}, the CSS is still emitted. */
export interface MiniAppCssWarning {
  readonly code: MiniAppCssWarningCode;
  readonly message: string;
}
