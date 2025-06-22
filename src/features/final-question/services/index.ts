/**
 * Final Question Services Index
 *
 * Centralized exports for all Final Question AI services.
 * Provides clean, organized access to both the refactored modular
 * services and the legacy monolithic service for compatibility.
 *
 * @fileoverview Service exports for Final Question feature
 * @version 1.0.0
 * @since December 2025
 */

// Main service interface (backward compatible)
export {
  generateQuestionWithGemini,
  isGeminiAvailable,
  getRateLimitStatus,
} from "./geminiServiceNew";

// Focused service modules (for advanced usage)
export * from "./geminiRateLimit";
export * from "./geminiPrompts";
export * from "./geminiApiClient";
export * from "./geminiParser";

// Legacy service (for compatibility during transition)
export * as LegacyGeminiService from "./geminiService";
