/**
 * Gemini AI Service
 *
 * Handles communication with Google Gemini API for question generation.
 * Supports multilingual question generation with difficulty and category control.
 * Includes intelligent rate limiting and retry logic.
 */

import type { FinalQuestion, QuestionCategory } from "../types";

interface QuestionGenerationParams {
  difficulty?: string;
  language?: string;
  category?: QuestionCategory | string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface RateLimitInfo {
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
 */
function checkRateLimit(): RateLimitInfo {
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
 */
function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Generate a question using Google Gemini API with intelligent rate limiting
 */
export const generateQuestionWithGemini = async (
  params: QuestionGenerationParams = {},
  onStatusUpdate?: (message: string, isWaiting: boolean) => void
): Promise<FinalQuestion> => {
  console.log("🚀 Starting question generation with params:", params);

  // Check if online
  if (!navigator.onLine) {
    console.error("❌ Not online");
    throw new Error("Internet connection required to generate questions");
  }

  // Check API key
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ No API key found");
    throw new Error("API key not configured");
  }

  console.log("✅ API key found, length:", apiKey.length);

  // Check rate limits
  const rateLimitCheck = checkRateLimit();
  if (rateLimitCheck.isRateLimited && rateLimitCheck.retryAfter) {
    if (onStatusUpdate) {
      onStatusUpdate(
        rateLimitCheck.message || "Rate limited, waiting...",
        true
      );
    }

    // Wait for the required time
    await wait(rateLimitCheck.retryAfter);

    if (onStatusUpdate) {
      onStatusUpdate("Generating your question...", false);
    }
  }

  const {
    difficulty = "medium",
    language = "English",
    category = "random",
  } = params;

  // Construct the prompt for Gemini
  const prompt = createGeminiPrompt(difficulty, language, category);

  try {
    // Update request tracking
    lastRequestTime = Date.now();
    requestCount++;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific rate limit errors from API
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter ? parseInt(retryAfter) : 60;

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
 * Create a structured prompt for Gemini API
 */
function createGeminiPrompt(
  difficulty: string,
  language: string,
  category: string
): string {
  const languageInstruction =
    language.toLowerCase() === "bulgarian"
      ? "Generate the question and answer in Bulgarian language."
      : "Generate the question and answer in English language.";

  const categoryInstruction =
    category.toLowerCase() === "random" || !category
      ? "Choose a random general knowledge topic."
      : `Generate a question about the category: ${category}`;

  const difficultyInstruction = getDifficultyInstruction(difficulty);

  return `You are a quiz master assistant. Generate a single quiz question and its answer.

${languageInstruction}
${categoryInstruction}
${difficultyInstruction}

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
 * Get difficulty-specific instructions
 */
function getDifficultyInstruction(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "Make this an EASY question that most people would know. Use basic, well-known facts.";
    case "hard":
      return "Make this a HARD question that requires specialized knowledge or complex reasoning. Use obscure facts or multi-step thinking.";
    case "medium":
    default:
      return "Make this a MEDIUM difficulty question that requires some knowledge but is not too obscure.";
  }
}

/**
 * Parse Gemini response and extract question data
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
 */
export const isGeminiAvailable = (): boolean => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isOnline = navigator.onLine;

  console.log("🔍 Gemini API Check:", {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    isOnline,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : "NOT_SET",
  });

  return !!(apiKey && isOnline);
};

/**
 * Get current rate limit status for UI display
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
