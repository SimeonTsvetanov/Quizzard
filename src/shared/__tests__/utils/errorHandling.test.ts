/**
 * Error Handling Utility Tests - Phase 5 (Minimal - 5 Tests)
 * Following DEVELOPMENT-STANDARDS.md: Keep test suite under 30 seconds
 */

import { AuthErrorHandler } from "../../utils/errorHandling";

describe("AuthErrorHandler (Phase 5 - Minimal)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.error mock to prevent test pollution
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should categorize network errors correctly", () => {
    const networkError = new Error("Network connection failed");
    const authError = AuthErrorHandler.categorizeError(networkError);

    expect(authError.type).toBe("network_error");
    expect(authError.retryable).toBe(true);
    expect(authError.message).toContain("authentication servers");
  });

  it("should categorize token expiration errors", () => {
    const tokenError = new Error("Token expired");
    const authError = AuthErrorHandler.categorizeError(tokenError);

    expect(authError.type).toBe("token_expired");
    expect(authError.retryable).toBe(false);
    expect(authError.message).toContain("session has expired");
  });

  it("should provide user-friendly error messages", () => {
    const error = new Error("Storage quota exceeded");
    const message = AuthErrorHandler.getErrorMessage(error);

    expect(typeof message).toBe("string");
    expect(message.length).toBeGreaterThan(0);
    expect(message).toContain("storage");
  });

  it("should determine if errors are retryable", () => {
    const networkError = new Error("Network failed");
    const configError = new Error("OAuth not configured");

    expect(AuthErrorHandler.isRetryable(networkError)).toBe(true);
    expect(AuthErrorHandler.isRetryable(configError)).toBe(false);
  });

  it("should log and categorize errors with context", () => {
    const error = new Error("Unknown authentication failure");
    const consoleSpy = jest.spyOn(console, "error");

    const authError = AuthErrorHandler.logAndCategorize(error, "Login");

    expect(consoleSpy).toHaveBeenCalledWith("Login Error:", error);
    expect(authError.type).toBe("unknown_error");
    expect(authError.message).toContain("unexpected error");
  });
});
