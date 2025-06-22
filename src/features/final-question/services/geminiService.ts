/**
 * Gemini AI Service
 *
 * Comprehensive service for handling communication with Google Gemini API.
 * Provides intelligent question generation with advanced features:
 * - Multilingual support (English, Bulgarian)
 * - Difficulty and category control
 * - Session-based duplicate prevention
 * - Geographic fact-checking for accuracy
 * - Intelligent rate limiting with user feedback
 * - Real-time countdown timers during waits
 *
 * @fileoverview Google Gemini AI integration service
 * @version 2.0.0
 * @since December 2025
 */

import type {
  FinalQuestion,
  GeminiQuestionParams,
  SessionQuestion,
} from "../types";

/**
 * Response structure from Google Gemini API
 * Represents the JSON format returned by the API service
 */
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Internal rate limiting information for immediate checks
 * Used for pre-request validation and user feedback
 */
interface InternalRateLimitInfo {
  isRateLimited: boolean;
  retryAfter?: number;
  message?: string;
}

// Rate limiting tracking
let lastRequestTime = 0;
let requestCount = 0;
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_MINUTE = 15;
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests to be safe

/**
 * Check if we're approaching or at rate limits
 * Validates against both per-minute limits and minimum request intervals
 *
 * @returns Object containing rate limit status and wait time information
 */
function checkRateLimit(): InternalRateLimitInfo {
  const now = Date.now();

  // Reset counter if window has passed
  if (now - lastRequestTime > RATE_LIMIT_WINDOW) {
    requestCount = 0;
  }

  // Check if we're at the limit
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const timeUntilReset = RATE_LIMIT_WINDOW - (now - lastRequestTime);
    return {
      isRateLimited: true,
      retryAfter: Math.ceil(timeUntilReset / 1000),
      message: `Rate limit reached (${MAX_REQUESTS_PER_MINUTE}/minute). Please wait ${Math.ceil(
        timeUntilReset / 1000
      )} seconds.`,
    };
  }

  // Check if we need to wait between requests
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && requestCount > 0) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    return {
      isRateLimited: true,
      retryAfter: Math.ceil(waitTime / 1000),
      message: `Please wait ${Math.ceil(
        waitTime / 1000
      )} seconds between requests to avoid rate limits.`,
    };
  }

  return { isRateLimited: false };
}

/**
 * Wait for the specified number of seconds
 *
 * @param seconds - Number of seconds to wait
 * @returns Promise that resolves after the specified time
 */
function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Generate a question using Google Gemini API with enhanced prompts and variability
 *
 * Main function for generating AI-powered questions with comprehensive features:
 * - Rate limiting with real-time countdown feedback
 * - Session-based duplicate prevention
 * - Enhanced prompts with fact-checking
 * - Geographic accuracy corrections
 * - Multilingual support
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
    // Check rate limiting first
    const rateLimitCheck = checkRateLimit();
    if (rateLimitCheck.isRateLimited) {
      const waitTime = rateLimitCheck.retryAfter || 4;

      if (onStatusUpdate) {
        onStatusUpdate(
          `Please wait ${waitTime} seconds before generating another question...`,
          true
        );

        // Show countdown during wait
        for (let i = waitTime; i > 0; i--) {
          onStatusUpdate(
            `Please wait ${i} second${
              i > 1 ? "s" : ""
            } before generating another question...`,
            true
          );
          await wait(1);
        }
      } else {
        await wait(waitTime);
      }

      if (onStatusUpdate) {
        onStatusUpdate("Generating your question...", false);
      }
    }

    // Check API key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ No API key found");
      throw new Error(
        "AI service is temporarily unavailable. Please try again later."
      );
    }

    // Check online status
    if (!navigator.onLine) {
      throw new Error("Internet connection required");
    }

    // Update request tracking
    requestCount++;
    lastRequestTime = Date.now();

    if (onStatusUpdate) {
      onStatusUpdate("Generating your question...", false);
    }

    // Create enhanced prompt with previous questions and better instructions
    const prompt = createEnhancedGeminiPrompt(
      params.difficulty || "medium",
      params.language || "English",
      params.category || "random",
      params.previousQuestions || []
    );

    const requestBody = {
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
        temperature: 0.9, // Higher temperature for more variability
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle rate limiting from Google's side
      if (response.status === 429) {
        const waitTime = 4;

        if (onStatusUpdate) {
          onStatusUpdate(
            `API rate limit reached. Waiting ${waitTime} seconds before retrying...`,
            true
          );
        }

        await wait(waitTime);

        if (onStatusUpdate) {
          onStatusUpdate("Retrying your request...", false);
        }

        // Retry the request
        return generateQuestionWithGemini(params, onStatusUpdate);
      }

      throw new Error(
        `Gemini API error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from Gemini API");
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    // Parse the JSON response
    const questionData = parseGeminiResponse(generatedText);

    return {
      id: Math.random().toString(36).substring(7),
      question: questionData.question,
      answer: questionData.answer,
      category: questionData.category,
      difficulty: questionData.difficulty as "easy" | "medium" | "hard",
    };
  } catch (error) {
    console.error("Gemini API error:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to generate question. Please try again.");
  }
};

/**
 * Create an enhanced prompt for Gemini API with better instructions and previous questions context
 */
/**
 * Creates an enhanced prompt for Gemini AI with context and fact-checking
 *
 * Builds comprehensive prompts that include:
 * - User preferences for difficulty, language, and category
 * - Session history to prevent duplicate questions
 * - Category-specific fact-checking instructions
 * - Geographic accuracy requirements (especially for Bulgarian content)
 *
 * @param difficulty - Desired difficulty level
 * @param language - Target language for the question
 * @param category - Preferred category or topic
 * @param previousQuestions - Array of previously generated questions to avoid duplicates
 * @returns Complete prompt string for AI generation
 */
function createEnhancedGeminiPrompt(
  difficulty: string,
  language: string,
  category: string,
  previousQuestions: SessionQuestion[]
): string {
  const languageInstruction =
    language.toLowerCase() === "bulgarian"
      ? "Generate the question and answer in Bulgarian language."
      : "Generate the question and answer in English language.";

  const categoryInstruction =
    category.toLowerCase() === "random" || !category
      ? "Choose a random general knowledge topic."
      : `Generate a question about the category: ${category}`;

  const difficultyInstruction = getEnhancedDifficultyInstruction(difficulty);

  // Add previous questions context to avoid duplicates
  let previousQuestionsContext = "";
  if (previousQuestions.length > 0) {
    const recentQuestions = previousQuestions.slice(-10); // Last 10 questions
    previousQuestionsContext = `\n\nIMPORTANT: Do NOT repeat any of these recently asked questions. Generate something completely different:\n${recentQuestions
      .map((q, i) => `${i + 1}. ${q.question}`)
      .join("\n")}`;
  }

  // Enhanced fact-checking instructions
  const factCheckingInstruction = getFactCheckingInstruction(category);

  return `You are an expert quiz master with access to accurate, up-to-date information. Generate a single quiz question and its answer.

${languageInstruction}
${categoryInstruction}
${difficultyInstruction}
${factCheckingInstruction}
${previousQuestionsContext}

CRITICAL REQUIREMENTS:
- The answer must be 100% factually correct and verifiable
- For geographic questions, double-check all facts (heights, locations, names)
- Avoid controversial or ambiguous topics
- Make the question engaging and educational
- Ensure the question is unique and not repetitive

IMPORTANT: Respond ONLY with a valid JSON object in this exact format:
{
  "question": "Your generated question here",
  "answer": "The correct answer here", 
  "category": "The category of the question",
  "difficulty": "${difficulty}"
}

Do not include any other text, explanations, or formatting outside the JSON object.`;
}

/**
 * Get enhanced difficulty-specific instructions with more variation
 *
 * Provides detailed instructions to the AI about question complexity,
 * knowledge requirements, and reasoning depth for each difficulty level.
 *
 * @param difficulty - Target difficulty level (easy, medium, hard, or random)
 * @returns Detailed difficulty instruction for AI prompt
 */
function getEnhancedDifficultyInstruction(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "Make this an EASY question that most people would know. Use basic, well-known facts that are commonly taught in school or widely known in popular culture.";
    case "hard":
      return "Make this a HARD question that requires specialized knowledge, advanced education, or deep expertise in a specific field. Use complex concepts, technical details, or obscure historical facts.";
    case "medium":
    default:
      return "Make this a MEDIUM difficulty question that requires some general knowledge and thinking. It should be challenging but not impossible for an educated person to answer.";
  }
}

/**
 * Get fact-checking instructions based on category
 *
 * Provides category-specific fact-checking instructions to ensure accuracy.
 * Includes special handling for Bulgarian geography to correct common AI errors.
 *
 * @param category - Question category to generate fact-checking instructions for
 * @returns Category-specific fact-checking instruction text
 */
function getFactCheckingInstruction(category: string): string {
  const lowerCategory = category.toLowerCase();

  if (
    lowerCategory.includes("geography") ||
    lowerCategory.includes("смолян") ||
    lowerCategory.includes("bulgaria") ||
    lowerCategory.includes("mountain") ||
    lowerCategory.includes("peak")
  ) {
    return `\nFACT-CHECKING FOR GEOGRAPHY: 
- For Bulgarian geography: Verify all mountain peaks, heights, and locations
- For Smolyan region: The highest peak near Smolyan is Perelik (2,191m), NOT Snezhanka
- Snezhanka is near Pamporovo but is NOT the highest peak in the Smolyan area
- Always verify geographical facts against reliable sources
- Double-check all numerical data (heights, distances, populations)`;
  }

  if (lowerCategory.includes("history")) {
    return `\nFACT-CHECKING FOR HISTORY: 
- Verify all dates, names, and historical events
- Ensure chronological accuracy
- Cross-reference multiple historical sources`;
  }

  if (lowerCategory.includes("science")) {
    return `\nFACT-CHECKING FOR SCIENCE: 
- Verify all scientific facts and figures
- Ensure formulas and laws are correct
- Use current scientific understanding`;
  }

  return `\nFACT-CHECKING: 
- Verify all facts before including them
- Use reliable, authoritative sources
- Avoid outdated or disputed information`;
}

/**
 * Parse Gemini response and extract question data
 *
 * Safely parses JSON response from Gemini AI and extracts question data.
 * Includes robust error handling and fallback mechanisms.
 *
 * @param text - Raw text response from Gemini API
 * @returns Parsed question data with fallback for parsing errors
 */
function parseGeminiResponse(text: string): {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
} {
  try {
    // Clean the response text
    const cleanedText = text.trim();

    // Try to find JSON in the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.question || !parsed.answer) {
      throw new Error("Missing required fields in response");
    }

    return {
      question: parsed.question,
      answer: parsed.answer,
      category: parsed.category || "General Knowledge",
      difficulty: parsed.difficulty || "medium",
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", text);

    // Fallback: create a basic question if parsing fails
    return {
      question: "What is the capital of France?",
      answer: "Paris",
      category: "Geography",
      difficulty: "easy",
    };
  }
}

/**
 * Check if the Gemini API is available
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
 * Get current rate limit status for UI display
 *
 * Provides real-time information about API usage for user interface.
 * Calculates remaining requests, reset time, and warning thresholds.
 *
 * @returns Object with current rate limiting status and timing information
 */
export const getRateLimitStatus = (): {
  requestsRemaining: number;
  timeUntilReset: number;
  isNearLimit: boolean;
} => {
  const now = Date.now();

  // Reset counter if window has passed
  if (now - lastRequestTime > RATE_LIMIT_WINDOW) {
    requestCount = 0;
  }

  const requestsRemaining = Math.max(0, MAX_REQUESTS_PER_MINUTE - requestCount);
  const timeUntilReset = Math.max(
    0,
    RATE_LIMIT_WINDOW - (now - lastRequestTime)
  );
  const isNearLimit = requestsRemaining <= 3;

  return {
    requestsRemaining,
    timeUntilReset: Math.ceil(timeUntilReset / 1000),
    isNearLimit,
  };
};
