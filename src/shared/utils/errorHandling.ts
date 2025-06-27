/**
 * Error Handling Utility - Phase 5
 * Following DEVELOPMENT-STANDARDS.md: Emphasis on error handling and robustness
 */

export type AuthErrorType =
  | "network_error"
  | "token_expired"
  | "refresh_failed"
  | "offline"
  | "google_api_unavailable"
  | "storage_error"
  | "configuration_error"
  | "unknown_error";

export interface AuthError {
  type: AuthErrorType;
  message: string;
  recoveryAction?: string;
  retryable: boolean;
}

/**
 * Categorize authentication errors and provide user-friendly messages
 * Following DEVELOPMENT-STANDARDS.md: Clear error messages, graceful degradation
 */
export class AuthErrorHandler {
  private static readonly ERROR_MESSAGES: Record<
    AuthErrorType,
    { message: string; recovery: string }
  > = {
    network_error: {
      message: "Unable to connect to authentication servers.",
      recovery: "Check your internet connection and try again.",
    },
    token_expired: {
      message: "Your session has expired.",
      recovery: "Please sign in again to continue.",
    },
    refresh_failed: {
      message: "Unable to refresh your session automatically.",
      recovery: "Please sign in again to continue.",
    },
    offline: {
      message: "You're currently offline.",
      recovery: "Check your internet connection to access Google features.",
    },
    google_api_unavailable: {
      message: "Google services are temporarily unavailable.",
      recovery: "Please try again in a few minutes.",
    },
    storage_error: {
      message: "Unable to save your authentication data.",
      recovery: "Please ensure your browser allows data storage.",
    },
    configuration_error: {
      message: "Authentication is not properly configured.",
      recovery: "Please contact support for assistance.",
    },
    unknown_error: {
      message: "An unexpected error occurred.",
      recovery: "Please try again or contact support if the problem persists.",
    },
  };

  /**
   * Categorize an error and return structured error information
   */
  static categorizeError(error: unknown): AuthError {
    const errorMessage =
      error instanceof Error
        ? error.message.toLowerCase()
        : String(error).toLowerCase();

    // Network-related errors
    if (
      errorMessage.includes("network") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("connection")
    ) {
      return this.createError("network_error", true);
    }

    // Token-related errors
    if (errorMessage.includes("token") && errorMessage.includes("expired")) {
      return this.createError("token_expired", false);
    }

    // Refresh-related errors
    if (
      errorMessage.includes("refresh") ||
      errorMessage.includes("unauthorized")
    ) {
      return this.createError("refresh_failed", true);
    }

    // Offline errors
    if (errorMessage.includes("offline") || errorMessage.includes("internet")) {
      return this.createError("offline", true);
    }

    // Google API errors
    if (
      errorMessage.includes("google") &&
      errorMessage.includes("unavailable")
    ) {
      return this.createError("google_api_unavailable", true);
    }

    // Storage errors
    if (errorMessage.includes("storage") || errorMessage.includes("quota")) {
      return this.createError("storage_error", true);
    }

    // Configuration errors
    if (
      errorMessage.includes("config") ||
      errorMessage.includes("not configured")
    ) {
      return this.createError("configuration_error", false);
    }

    // Default to unknown error
    return this.createError("unknown_error", true);
  }

  /**
   * Create a structured error object
   */
  private static createError(
    type: AuthErrorType,
    retryable: boolean
  ): AuthError {
    const { message, recovery } = this.ERROR_MESSAGES[type];

    return {
      type,
      message,
      recoveryAction: recovery,
      retryable,
    };
  }

  /**
   * Get user-friendly error message with recovery suggestions
   */
  static getErrorMessage(error: unknown): string {
    const authError = this.categorizeError(error);
    return `${authError.message} ${authError.recoveryAction}`;
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: unknown): boolean {
    return this.categorizeError(error).retryable;
  }

  /**
   * Log error for debugging while providing user-friendly message
   */
  static logAndCategorize(
    error: unknown,
    context: string = "Authentication"
  ): AuthError {
    console.error(`${context} Error:`, error);
    return this.categorizeError(error);
  }
}
