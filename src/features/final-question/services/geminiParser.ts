/**
 * Gemini Response Parser Service
 *
 * Focused service for parsing and validating responses from Google Gemini AI.
 * Provides robust JSON parsing, data validation, and fallback mechanisms
 * to ensure reliable question generation even with malformed responses.
 *
 * Features:
 * - Safe JSON extraction from AI responses
 * - Comprehensive data validation
 * - Graceful fallback for parsing failures
 * - Type-safe question object creation
 * - Detailed error logging for debugging
 *
 * @fileoverview Response parsing service for Gemini AI
 * @version 1.0.0
 * @since December 2025
 */

import type { FinalQuestion } from "../types";

/**
 * Raw question data extracted from AI response
 * Represents the basic structure expected from Gemini AI
 */
interface ParsedQuestionData {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}

/**
 * Validation result for parsed question data
 * Provides detailed feedback about data quality and completeness
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Parse Gemini AI response and extract question data
 *
 * Safely parses JSON from AI response text and extracts structured question
 * data with comprehensive error handling and fallback mechanisms.
 *
 * @param responseText - Raw text response from Gemini API
 * @returns Complete FinalQuestion object with unique ID
 * @throws Error if parsing fails and fallback cannot be applied
 */
export const parseGeminiResponse = (responseText: string): FinalQuestion => {
  try {
    // Extract and validate the raw question data
    const parsedData = extractQuestionData(responseText);

    // Validate the extracted data
    const validation = validateQuestionData(parsedData);

    if (!validation.isValid) {
      console.warn("Question data validation failed:", validation.errors);
      // Use fallback for invalid data
      return createFallbackQuestion();
    }

    // Log any warnings for development
    if (validation.warnings.length > 0 && import.meta.env.DEV) {
      console.warn("Question data warnings:", validation.warnings);
    }

    // Create complete question object
    return createFinalQuestion(parsedData);
  } catch (error) {
    console.error("Failed to parse Gemini response:", {
      error: error instanceof Error ? error.message : "Unknown error",
      responseText: responseText.substring(0, 200) + "...", // Log first 200 chars
    });

    // Return fallback question for any parsing failure
    return createFallbackQuestion();
  }
};

/**
 * Extract JSON question data from AI response text
 *
 * Performs robust JSON extraction with multiple fallback strategies
 * to handle various response formats from the AI.
 *
 * @param responseText - Raw response text to parse
 * @returns Extracted question data object
 * @throws Error if no valid JSON can be extracted
 */
function extractQuestionData(responseText: string): ParsedQuestionData {
  // Clean the response text
  const cleanedText = responseText.trim();

  if (!cleanedText) {
    throw new Error("Empty response text");
  }

  // Strategy 1: Try to parse the entire response as JSON
  try {
    const parsed = JSON.parse(cleanedText);
    if (isQuestionDataObject(parsed)) {
      return parsed;
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Extract JSON from response text using regex
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (isQuestionDataObject(parsed)) {
        return parsed;
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 3: Look for JSON-like structure with more flexible regex
  const flexibleJsonMatch = cleanedText.match(/\{[^}]*"question"[^}]*\}/s);
  if (flexibleJsonMatch) {
    try {
      const parsed = JSON.parse(flexibleJsonMatch[0]);
      if (isQuestionDataObject(parsed)) {
        return parsed;
      }
    } catch {
      // Continue to error
    }
  }

  throw new Error("No valid JSON structure found in response");
}

/**
 * Type guard to check if an object has the expected question data structure
 *
 * @param obj - Object to validate
 * @returns True if object has required question properties
 */
function isQuestionDataObject(obj: any): obj is ParsedQuestionData {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.question === "string" &&
    typeof obj.answer === "string"
  );
}

/**
 * Validate extracted question data for completeness and quality
 *
 * Performs comprehensive validation of question data including content
 * quality checks and structural validation.
 *
 * @param data - Parsed question data to validate
 * @returns Detailed validation result with errors and warnings
 */
function validateQuestionData(data: ParsedQuestionData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!data.question || data.question.trim().length < 10) {
    errors.push("Question text is missing or too short");
  }

  if (!data.answer || data.answer.trim().length < 1) {
    errors.push("Answer text is missing");
  }

  // Content quality checks
  if (data.question && data.question.length > 500) {
    warnings.push("Question is unusually long");
  }

  if (data.answer && data.answer.length > 200) {
    warnings.push("Answer is unusually long");
  }

  // Category validation
  if (!data.category || data.category.trim().length === 0) {
    warnings.push("Category is missing, will use default");
  }

  // Difficulty validation
  const validDifficulties = ["easy", "medium", "hard"];
  if (
    !data.difficulty ||
    !validDifficulties.includes(data.difficulty.toLowerCase())
  ) {
    warnings.push("Invalid difficulty, will use default");
  }

  // Check for common formatting issues
  if (data.question && !data.question.trim().endsWith("?")) {
    warnings.push("Question does not end with a question mark");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create a complete FinalQuestion object from validated data
 *
 * Transforms parsed and validated data into the final question object
 * with proper defaults and unique identification.
 *
 * @param data - Validated question data
 * @returns Complete FinalQuestion object
 */
function createFinalQuestion(data: ParsedQuestionData): FinalQuestion {
  // Normalize and clean the data
  const question = data.question.trim();
  const answer = data.answer.trim();
  const category = data.category?.trim() || "General Knowledge";
  const difficulty = normalizeDifficulty(data.difficulty);

  return {
    id: generateQuestionId(),
    question,
    answer,
    category,
    difficulty,
  };
}

/**
 * Normalize difficulty value to ensure consistency
 *
 * @param difficulty - Raw difficulty value from AI
 * @returns Normalized difficulty level
 */
function normalizeDifficulty(difficulty: string): "easy" | "medium" | "hard" {
  const normalized = difficulty?.toLowerCase().trim();

  switch (normalized) {
    case "easy":
    case "simple":
    case "beginner":
      return "easy";
    case "hard":
    case "difficult":
    case "expert":
    case "advanced":
      return "hard";
    case "medium":
    case "moderate":
    case "intermediate":
    default:
      return "medium";
  }
}

/**
 * Generate a unique ID for a question
 *
 * Creates a random alphanumeric identifier for question tracking.
 *
 * @returns Unique question identifier
 */
function generateQuestionId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Create a fallback question for when parsing fails
 *
 * Provides a reliable fallback question to ensure the application
 * continues functioning even when AI responses are malformed.
 *
 * @returns Basic fallback question object
 */
function createFallbackQuestion(): FinalQuestion {
  const fallbackQuestions = [
    {
      question: "What is the capital of France?",
      answer: "Paris",
      category: "Geography",
      difficulty: "easy" as const,
    },
    {
      question: "Who wrote the play 'Romeo and Juliet'?",
      answer: "William Shakespeare",
      category: "Literature",
      difficulty: "easy" as const,
    },
    {
      question: "What is the largest planet in our solar system?",
      answer: "Jupiter",
      category: "Science",
      difficulty: "easy" as const,
    },
  ];

  // Select a random fallback question
  const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
  const selectedFallback = fallbackQuestions[randomIndex];

  return {
    id: generateQuestionId(),
    ...selectedFallback,
  };
}
