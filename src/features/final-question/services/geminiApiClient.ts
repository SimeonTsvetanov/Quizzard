/**
 * Gemini API Client Service
 *
 * Focused service for handling direct communication with Google Gemini API.
 * Provides secure, reliable API calls with comprehensive error handling,
 * automatic retries, and proper response validation.
 *
 * Features:
 * - Secure API key management and validation
 * - HTTP request/response handling with proper headers
 * - Automatic retry logic for transient failures
 * - Response validation and error parsing
 * - Network connectivity checks
 * - Development-safe API key logging
 *
 * @fileoverview API client for Google Gemini AI
 * @version 1.0.0
 * @since December 2025
 */

import type { FinalQuestion } from "../types";

/**
 * Gemini API response structure
 * Represents the JSON format returned by Google Gemini API
 */
interface GeminiApiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * API request configuration for Gemini calls
 * Optimized settings for question generation with high variability
 */
interface GeminiRequestConfig {
  /** The prompt text to send to the AI */
  prompt: string;
  /** Temperature for response variability (0.0-1.0) */
  temperature?: number;
  /** Top-K token selection parameter */
  topK?: number;
  /** Top-P probability mass parameter */
  topP?: number;
  /** Maximum output tokens allowed */
  maxOutputTokens?: number;
}

/**
 * Default configuration for Gemini API requests
 * Optimized for maximum question variability and quality
 */
const DEFAULT_CONFIG: Required<Omit<GeminiRequestConfig, "prompt">> = {
  temperature: 0.9, // High temperature for creative variability
  topK: 40, // Balanced token selection
  topP: 0.95, // High probability mass for diversity
  maxOutputTokens: 1024, // Sufficient for comprehensive questions
} as const;

/**
 * Check if the Gemini API is available and ready to use
 *
 * Validates both API key availability and network connectivity.
 * Provides safe logging that doesn't expose API keys in production.
 *
 * @returns True if API key exists and device is online
 */
export const isGeminiAvailable = (): boolean => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isOnline = navigator.onLine;

  // Only log once per session in development to avoid console spam
  if (import.meta.env.DEV && !(window as any).__GEMINI_LOGGED) {
    console.log("🔍 Gemini API Check:", {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      isOnline,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : "NOT_SET",
    });
    (window as any).__GEMINI_LOGGED = true;
  }

  return !!(apiKey && isOnline);
};

/**
 * Get the API key with proper validation
 *
 * Securely retrieves and validates the API key from environment variables.
 * Throws descriptive errors for missing or invalid keys.
 *
 * @returns Valid API key string
 * @throws Error if API key is missing or invalid
 */
function getValidatedApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "AI service is temporarily unavailable. Please try again later."
    );
  }

  if (typeof apiKey !== "string" || apiKey.length < 20) {
    throw new Error("Invalid API configuration. Please contact support.");
  }

  return apiKey;
}

/**
 * Create the request body for Gemini API calls
 *
 * Builds the properly formatted request body with optimal configuration
 * for question generation tasks.
 *
 * @param config - Request configuration including prompt and parameters
 * @returns Complete request body object for API call
 */
function createRequestBody(config: GeminiRequestConfig): object {
  const {
    prompt,
    temperature = DEFAULT_CONFIG.temperature,
    topK = DEFAULT_CONFIG.topK,
    topP = DEFAULT_CONFIG.topP,
    maxOutputTokens = DEFAULT_CONFIG.maxOutputTokens,
  } = config;

  return {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      topK,
      topP,
      maxOutputTokens,
    },
  };
}

/**
 * Make a request to the Gemini API with error handling and retries
 *
 * Handles the complete API communication lifecycle including authentication,
 * request formatting, error handling, and response validation.
 *
 * @param config - Request configuration with prompt and optional parameters
 * @param onStatusUpdate - Optional callback for status updates during retries
 * @returns Promise resolving to the raw API response
 * @throws Error for API failures, network issues, or invalid responses
 */
export const callGeminiApi = async (
  config: GeminiRequestConfig,
  onStatusUpdate?: (message: string, isWaiting: boolean) => void
): Promise<string> => {
  // Validate prerequisites
  if (!navigator.onLine) {
    throw new Error("Internet connection required");
  }

  const apiKey = getValidatedApiKey();

  // Create properly formatted request
  const requestBody = createRequestBody(config);

  try {
    if (onStatusUpdate) {
      onStatusUpdate("Contacting AI service...", false);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    // Handle HTTP errors
    if (!response.ok) {
      await handleApiError(response, config, onStatusUpdate);
    }

    // Parse and validate response
    const data: GeminiApiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from AI service");
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    if (!generatedText || typeof generatedText !== "string") {
      throw new Error("Invalid response format from AI service");
    }

    return generatedText;
  } catch (error) {
    console.error("Gemini API error:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to generate question. Please try again.");
  }
};

/**
 * Handle API errors with appropriate retry logic
 *
 * Processes different types of API errors and implements retry strategies
 * for transient failures like rate limiting.
 *
 * @param response - Failed HTTP response
 * @param config - Original request configuration for retries
 * @param onStatusUpdate - Optional callback for status updates
 * @throws Error for non-retryable failures or after exhausting retries
 */
async function handleApiError(
  response: Response,
  config: GeminiRequestConfig,
  onStatusUpdate?: (message: string, isWaiting: boolean) => void
): Promise<never> {
  let errorData: any = {};

  try {
    errorData = await response.json();
  } catch {
    // Ignore JSON parsing errors for error responses
  }

  // Handle rate limiting from Google's side
  if (response.status === 429) {
    const waitTime = 4; // Conservative wait time

    if (onStatusUpdate) {
      onStatusUpdate(
        `API rate limit reached. Waiting ${waitTime} seconds before retrying...`,
        true
      );

      // Wait with feedback
      for (let i = waitTime; i > 0; i--) {
        onStatusUpdate(
          `API rate limit reached. Retrying in ${i} second${
            i !== 1 ? "s" : ""
          }...`,
          true
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      onStatusUpdate("Retrying your request...", false);
    } else {
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }

    // Retry the request once
    return callGeminiApi(config, onStatusUpdate);
  }

  // Handle other API errors
  const errorMessage = errorData.error?.message || "Unknown API error";

  switch (response.status) {
    case 400:
      throw new Error(`Invalid request: ${errorMessage}`);
    case 401:
      throw new Error("API key is invalid or expired");
    case 403:
      throw new Error("API access forbidden - check your API key permissions");
    case 404:
      throw new Error("AI service endpoint not found");
    case 500:
    case 502:
    case 503:
    case 504:
      throw new Error(
        "AI service is temporarily unavailable. Please try again."
      );
    default:
      throw new Error(`API error (${response.status}): ${errorMessage}`);
  }
}
