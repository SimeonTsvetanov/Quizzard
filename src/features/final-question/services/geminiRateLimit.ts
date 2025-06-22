/**
 * Gemini API Rate Limiting Service
 *
 * Focused service for handling API rate limiting and request throttling.
 * Provides intelligent rate limiting with real-time feedback and countdown
 * timers to ensure compliance with Google Gemini API limits.
 *
 * Features:
 * - Per-minute request counting (15 requests/minute)
 * - Minimum interval enforcement (4 seconds between requests)
 * - Real-time countdown feedback during waits
 * - Automatic window reset tracking
 * - User-friendly status messages
 *
 * @fileoverview Rate limiting service for Gemini API
 * @version 1.0.0
 * @since December 2025
 */

/**
 * Rate limiting configuration constants
 * Following Google Gemini API free tier limits with safety margins
 */
export const RATE_LIMIT_CONFIG = {
  /** Maximum requests allowed per minute */
  MAX_REQUESTS_PER_MINUTE: 15,
  /** Time window for rate limit tracking (1 minute) */
  RATE_LIMIT_WINDOW: 60000,
  /** Minimum time between requests (4 seconds for safety) */
  MIN_REQUEST_INTERVAL: 4000,
} as const;

/**
 * Rate limiting information for external consumers
 * Provides comprehensive status about current API usage limits
 */
export interface RateLimitStatus {
  /** Whether the current request would be rate limited */
  isRateLimited: boolean;
  /** Time to wait before next request (in seconds) */
  retryAfter?: number;
  /** User-friendly message explaining the rate limit status */
  message?: string;
  /** Number of requests remaining in current window */
  requestsRemaining: number;
  /** Time until rate limit window resets (in seconds) */
  timeUntilReset: number;
  /** Whether approaching rate limit threshold (warning state) */
  isNearLimit: boolean;
}

/**
 * Internal tracking state for rate limiting
 * Maintains session state across multiple API calls
 */
class RateLimitTracker {
  private lastRequestTime = 0;
  private requestCount = 0;

  /**
   * Check if a new request would be rate limited
   * Validates against both per-minute limits and minimum intervals
   *
   * @returns Complete rate limit status information
   */
  checkRateLimit(): RateLimitStatus {
    const now = Date.now();

    // Reset counter if window has passed
    if (now - this.lastRequestTime > RATE_LIMIT_CONFIG.RATE_LIMIT_WINDOW) {
      this.requestCount = 0;
    }

    const requestsRemaining = Math.max(
      0,
      RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE - this.requestCount
    );

    const timeUntilReset = Math.max(
      0,
      RATE_LIMIT_CONFIG.RATE_LIMIT_WINDOW - (now - this.lastRequestTime)
    );

    // Check if we're at the per-minute limit
    if (this.requestCount >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      const waitSeconds = Math.ceil(timeUntilReset / 1000);
      return {
        isRateLimited: true,
        retryAfter: waitSeconds,
        message: `Rate limit reached (${RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE}/minute). Please wait ${waitSeconds} seconds.`,
        requestsRemaining: 0,
        timeUntilReset: waitSeconds,
        isNearLimit: true,
      };
    }

    // Check if we need to wait between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (
      timeSinceLastRequest < RATE_LIMIT_CONFIG.MIN_REQUEST_INTERVAL &&
      this.requestCount > 0
    ) {
      const waitTime =
        RATE_LIMIT_CONFIG.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      const waitSeconds = Math.ceil(waitTime / 1000);
      return {
        isRateLimited: true,
        retryAfter: waitSeconds,
        message: `Please wait ${waitSeconds} seconds between requests to avoid rate limits.`,
        requestsRemaining,
        timeUntilReset: Math.ceil(timeUntilReset / 1000),
        isNearLimit: requestsRemaining <= 3,
      };
    }

    return {
      isRateLimited: false,
      requestsRemaining,
      timeUntilReset: Math.ceil(timeUntilReset / 1000),
      isNearLimit: requestsRemaining <= 3,
    };
  }

  /**
   * Record a successful request for rate limiting tracking
   * Updates internal counters and timestamps
   */
  recordRequest(): void {
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  /**
   * Get current status for UI display without recording a request
   * Useful for status indicators and warnings
   *
   * @returns Current rate limit status without side effects
   */
  getStatus(): RateLimitStatus {
    return this.checkRateLimit();
  }
}

/**
 * Singleton rate limit tracker instance
 * Maintains state across the entire application session
 */
const rateLimitTracker = new RateLimitTracker();

/**
 * Wait for the specified number of seconds with optional progress callback
 *
 * @param seconds - Number of seconds to wait
 * @param onProgress - Optional callback called each second with countdown
 * @returns Promise that resolves after the specified time
 */
export const waitWithProgress = async (
  seconds: number,
  onProgress?: (secondsRemaining: number) => void
): Promise<void> => {
  for (let i = seconds; i > 0; i--) {
    if (onProgress) {
      onProgress(i);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

/**
 * Check if the next request would be rate limited
 * Primary interface for external consumers to check rate limit status
 *
 * @returns Complete rate limit status information
 */
export const checkRateLimit = (): RateLimitStatus => {
  return rateLimitTracker.checkRateLimit();
};

/**
 * Record a successful API request for rate limiting purposes
 * Must be called after each successful API call
 */
export const recordRequest = (): void => {
  rateLimitTracker.recordRequest();
};

/**
 * Get current rate limit status for UI display
 * Provides real-time information without recording a request
 *
 * @returns Current rate limiting status and timing information
 */
export const getRateLimitStatus = (): RateLimitStatus => {
  return rateLimitTracker.getStatus();
};

/**
 * Handle rate limiting with user feedback
 * Comprehensive rate limit handling with real-time countdown feedback
 *
 * @param onStatusUpdate - Callback for status updates during waits
 * @returns Promise that resolves when safe to make request
 */
export const handleRateLimit = async (
  onStatusUpdate?: (message: string, isWaiting: boolean) => void
): Promise<void> => {
  const status = checkRateLimit();

  if (status.isRateLimited && status.retryAfter) {
    if (onStatusUpdate) {
      // Show countdown during wait with real-time updates
      await waitWithProgress(status.retryAfter, (secondsRemaining) => {
        onStatusUpdate(
          `Please wait ${secondsRemaining} second${
            secondsRemaining !== 1 ? "s" : ""
          } before generating another question...`,
          true
        );
      });

      // Clear waiting status
      onStatusUpdate("Generating your question...", false);
    } else {
      // Silent wait if no callback provided
      await new Promise((resolve) =>
        setTimeout(resolve, status.retryAfter! * 1000)
      );
    }
  }
};
