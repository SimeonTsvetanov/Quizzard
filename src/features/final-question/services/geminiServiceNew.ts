/**
 * Gemini AI Service - Refactored Composition Service
 *
 * REFACTORED: This service now composes smaller, focused modules following
 * the Single Responsibility Principle. The original monolithic 528-line
 * service has been split into:
 * - geminiRateLimit: Rate limiting and request throttling
 * - geminiPrompts: Prompt generation and enhancement
 * - geminiApiClient: API communication and error handling
 * - geminiParser: Response parsing and validation
 *
 * This service maintains backward compatibility while providing a cleaner,
 * more maintainable architecture.
 *
 * Original Features Preserved:
 * - Multilingual support (English, Bulgarian)
 * - Difficulty and category control
 * - Session-based duplicate prevention
 * - Geographic fact-checking for accuracy
 * - Intelligent rate limiting with user feedback
 * - Real-time countdown timers during waits
 * - Comprehensive error handling and retries
 *
 * @fileoverview Refactored composition service for Gemini AI
 * @version 3.0.0 (Refactored)
 * @since December 2025
 */

import type { FinalQuestion, GeminiQuestionParams } from "../types";
import { 
  checkRateLimit, 
  recordRequest, 
  handleRateLimit, 
  getRateLimitStatus 
} from "./geminiRateLimit";
import { createEnhancedGeminiPrompt } from "./geminiPrompts";
import { callGeminiApi, isGeminiAvailable } from "./geminiApiClient";
import { parseGeminiResponse } from "./geminiParser";

/**
 * Generate a question using Google Gemini AI with comprehensive features
 *
 * Main function for generating AI-powered questions with all advanced features:
 * - Rate limiting with real-time countdown feedback
 * - Session-based duplicate prevention
 * - Enhanced prompts with fact-checking
 * - Geographic accuracy corrections
 * - Multilingual support
 * - Robust error handling and retries
 *
 * This function composes the focused services to provide a unified interface
 * for question generation while maintaining backward compatibility.
 *
 * @param params - Question generation parameters including difficulty, language, category, and session history
 * @param onStatusUpdate - Optional callback for real-time status updates during generation
 * @returns Promise resolving to a complete FinalQuestion object
 * @throws Error if API key missing, network unavailable, or generation fails
 */
export const generateQuestionWithGemini = async (
  params: GeminiQuestionParams = {} as GeminiQuestionParams,
  onStatusUpdate?: (message: string, isWaiting: boolean) => void
): Promise<FinalQuestion> => {
  try {
    // Handle rate limiting with user feedback
    await handleRateLimit(onStatusUpdate);

    // Generate comprehensive prompt using focused prompt service
    const prompt = createEnhancedGeminiPrompt({
      difficulty: params.difficulty || "medium",
      language: params.language || "English",
      category: params.category || "random",
      previousQuestions: params.previousQuestions || [],
    });

    // Make API call using focused API client
    const responseText = await callGeminiApi(
      { prompt },
      onStatusUpdate
    );

    // Record successful request for rate limiting
    recordRequest();

    // Parse response using focused parser service
    const question = parseGeminiResponse(responseText);

    return question;
  } catch (error) {
    console.error("Question generation error:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to generate question. Please try again.");
  }
};

/**
 * Check if the Gemini AI service is available and ready to use
 *
 * Validates both API key availability and network connectivity.
 * Uses the focused API client for consistent availability checking.
 *
 * @returns True if API key exists and device is online
 */
export { isGeminiAvailable };

/**
 * Get current rate limit status for UI display
 *
 * Provides real-time information about API usage for user interface.
 * Uses the focused rate limiting service for consistent status reporting.
 *
 * @returns Object with current rate limiting status and timing information
 */
export { getRateLimitStatus };

/**
 * Legacy compatibility exports
 * Maintains backward compatibility with existing code
 */
export {
  checkRateLimit,
  recordRequest,
  handleRateLimit,
} from "./geminiRateLimit";

export {
  createEnhancedGeminiPrompt,
} from "./geminiPrompts";

export {
  callGeminiApi,
} from "./geminiApiClient";

export {
  parseGeminiResponse,
} from "./geminiParser"; 