/**
 * AI Question Generation Service for Quizzes
 *
 * Service for generating quiz questions using Google Gemini AI.
 * Builds upon the Final Question AI service to create multiple-choice
 * questions specifically for quiz creation workflow.
 *
 * Features:
 * - Multiple choice question generation (2-6 options)
 * - Text-based questions only (no media)
 * - Category and difficulty support
 * - Session-based duplicate prevention
 * - Rate limiting and error handling
 *
 * @fileoverview AI question generation service for quiz creation
 * @version 1.0.0
 * @since December 2025
 */

import {
  generateQuestionWithGemini,
  isGeminiAvailable,
  getRateLimitStatus,
} from "../../final-question/services/geminiService";
import type { QuizQuestion, QuizCategory, QuizDifficulty } from "../types";
import type {
  GeminiQuestionParams,
  SessionQuestion,
} from "../../final-question/types";

/**
 * Parameters for AI quiz question generation
 */
export interface AIQuestionParams {
  /** Type of question to generate */
  questionType?: "text-answer" | "text";
  /** Preferred question category */
  category?: QuizCategory | string;
  /** Difficulty level for the question */
  difficulty?: QuizDifficulty;
  /** Language for the question (defaults to English) */
  language?: string;
  /** Number of multiple choice options (2-6, only for "text" type) */
  optionsCount?: number;
  /** Previously generated questions to avoid duplicates */
  previousQuestions?: QuizQuestion[];
  /** Additional context or topic specification */
  topicHint?: string;
}

/**
 * Result of AI question generation
 */
export interface AIQuestionResult {
  /** Generated quiz question */
  question: QuizQuestion;
  /** Whether the generation was successful */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Status callback for real-time updates during generation
 */
export type AIGenerationStatusCallback = (
  message: string,
  isWaiting: boolean
) => void;

/**
 * Generate a quiz question using AI
 *
 * Creates either a text-answer or multiple-choice quiz question using the Gemini AI service.
 * For text-answer questions, returns the question with a single correct answer.
 * For multiple-choice questions, generates additional distractor options.
 *
 * @param params - Generation parameters including type, category, difficulty, and options
 * @param onStatusUpdate - Optional callback for real-time status updates
 * @returns Promise resolving to generated quiz question or error
 */
export const generateAIQuizQuestion = async (
  params: AIQuestionParams = {},
  onStatusUpdate?: AIGenerationStatusCallback
): Promise<AIQuestionResult> => {
  try {
    // Check if AI service is available
    if (!isGeminiAvailable()) {
      return {
        question: createEmptyQuestion(),
        success: false,
        error:
          "AI service is not available. Please check your connection and try again.",
      };
    }

    // Prepare parameters for Gemini service
    const geminiParams: GeminiQuestionParams = {
      difficulty: params.difficulty || "medium",
      language: params.language || "English",
      category:
        params.topicHint ||
        mapQuizCategoryToGemini(params.category || "general"),
      previousQuestions: convertQuizQuestionsToSession(
        params.previousQuestions || []
      ),
    };

    // Generate question using Final Question service
    const finalQuestion = await generateQuestionWithGemini(
      geminiParams,
      onStatusUpdate
    );

    // Determine question type (default to text-answer if not specified)
    const questionType = params.questionType || "text-answer";

    // Convert to appropriate quiz question format
    const quizQuestion = await convertToQuizQuestion(
      finalQuestion,
      questionType,
      params.optionsCount || 4,
      params.difficulty || "medium"
    );

    return {
      question: quizQuestion,
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate question";

    return {
      question: createEmptyQuestion(),
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Convert Final Question to Quiz Question format
 *
 * Takes a generated final question and creates either a text-answer question
 * or a multiple-choice question with distractor options, based on the specified type.
 *
 * @param finalQuestion - The generated final question
 * @param questionType - Type of question to create ("text-answer" or "text")
 * @param optionsCount - Number of multiple choice options to create (ignored for text-answer)
 * @param difficulty - Difficulty level for option generation
 * @returns Promise resolving to formatted quiz question
 */
async function convertToQuizQuestion(
  finalQuestion: any,
  questionType: "text-answer" | "text",
  optionsCount: number,
  difficulty: QuizDifficulty
): Promise<QuizQuestion> {
  const now = new Date();
  const baseQuestion = {
    id: generateQuestionId(),
    question: finalQuestion.question,
    difficulty: difficulty,
    points: calculatePointsForDifficulty(difficulty),
    timeLimit: 60, // Default to 60 seconds for all AI-generated questions
    createdAt: now,
    updatedAt: now,
  };

  if (questionType === "text-answer") {
    // Create text-answer question
    return {
      ...baseQuestion,
      type: "text-answer",
      options: [],
      correctAnswer: -1,
      textAnswer: finalQuestion.answer,
      explanation: `The correct answer is: ${finalQuestion.answer}`,
    };
  } else {
    // Create multiple-choice question
    // Generate distractor options using AI
    const distractors = await generateDistractorOptions(
      finalQuestion.question,
      finalQuestion.answer,
      optionsCount - 1,
      difficulty
    );

    // Create all options with correct answer
    const allOptions = [finalQuestion.answer, ...distractors];

    // Shuffle options and track correct answer position
    const shuffledOptions = shuffleArray([...allOptions]);
    const correctAnswerIndex = shuffledOptions.indexOf(finalQuestion.answer);

    // Create multiple-choice quiz question object
    return {
      ...baseQuestion,
      type: "text",
      options: shuffledOptions,
      correctAnswer: correctAnswerIndex,
      textAnswer: "",
      explanation: `The correct answer is: ${finalQuestion.answer}`,
    };
  }
}

/**
 * Generate distractor options for multiple choice
 *
 * Creates plausible but incorrect options for the multiple choice question.
 * Uses AI to generate contextually appropriate distractors.
 *
 * @param question - The main question text
 * @param correctAnswer - The correct answer
 * @param count - Number of distractors to generate
 * @param difficulty - Difficulty level for distractor complexity
 * @returns Promise resolving to array of distractor options
 */
async function generateDistractorOptions(
  question: string,
  correctAnswer: string,
  count: number,
  difficulty: QuizDifficulty
): Promise<string[]> {
  try {
    // Create prompt for generating distractors
    const prompt = createDistractorPrompt(
      question,
      correctAnswer,
      count,
      difficulty
    );

    // Use Gemini to generate distractors
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return generateFallbackDistractors(correctAnswer, count);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      return generateFallbackDistractors(correctAnswer, count);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse distractors from response
    const distractors = parseDistractorsFromResponse(text, count);

    // Ensure we have enough distractors
    if (distractors.length < count) {
      const fallbackDistractors = generateFallbackDistractors(
        correctAnswer,
        count - distractors.length
      );
      return [...distractors, ...fallbackDistractors];
    }

    return distractors.slice(0, count);
  } catch (error) {
    console.warn("Failed to generate AI distractors, using fallback:", error);
    return generateFallbackDistractors(correctAnswer, count);
  }
}

/**
 * Create prompt for distractor generation
 */
function createDistractorPrompt(
  question: string,
  correctAnswer: string,
  count: number,
  difficulty: QuizDifficulty
): string {
  const difficultyInstruction = {
    easy: "Make the wrong answers obviously incorrect but still plausible.",
    medium:
      "Make the wrong answers plausible but clearly distinguishable from the correct answer.",
    hard: "Make the wrong answers very plausible and similar to the correct answer.",
  }[difficulty];

  return `Generate ${count} incorrect but plausible answers for this multiple choice question.

Question: ${question}
Correct Answer: ${correctAnswer}

Requirements:
- ${difficultyInstruction}
- Each wrong answer should be on a separate line
- Make them the same format/length as the correct answer
- Don't number them or add extra text
- Make them factually wrong but believable
- Avoid obviously ridiculous answers

Wrong answers:`;
}

/**
 * Parse distractors from AI response
 */
function parseDistractorsFromResponse(
  response: string,
  expectedCount: number
): string[] {
  const lines = response
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.match(/^[0-9]+\.?\s/)); // Remove numbered items

  return lines.slice(0, expectedCount);
}

/**
 * Generate fallback distractors when AI fails
 */
function generateFallbackDistractors(
  correctAnswer: string,
  count: number
): string[] {
  const distractors: string[] = [];

  // Generate simple fallback distractors
  for (let i = 0; i < count; i++) {
    if (correctAnswer.match(/^\d+$/)) {
      // Numeric answer - generate nearby numbers
      const num = parseInt(correctAnswer);
      distractors.push(String(num + (i + 1) * 10));
    } else if (correctAnswer.match(/^[A-Z]/)) {
      // Starts with capital - might be a name or place
      distractors.push(`Alternative ${String.fromCharCode(65 + i)}`);
    } else {
      // Generic fallback
      distractors.push(`Option ${String.fromCharCode(65 + i)}`);
    }
  }

  return distractors;
}

/**
 * Utility functions
 */

function createEmptyQuestion(): QuizQuestion {
  const now = new Date();
  return {
    id: generateQuestionId(),
    type: "text",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    difficulty: "medium",
    points: 1, // Default to 1 point
    timeLimit: 60, // Default to 60 seconds
    createdAt: now,
    updatedAt: now,
  };
}

function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function mapQuizCategoryToGemini(category: QuizCategory | string): string {
  const mapping: Record<string, string> = {
    general: "General Knowledge",
    sports: "Sports",
    history: "History",
    science: "Science",
    geography: "Geography",
    entertainment: "Entertainment",
    literature: "Literature",
    art: "Art",
    music: "Music",
    technology: "Technology",
    custom: "General Knowledge",
  };

  return mapping[category] || "General Knowledge";
}

function convertQuizQuestionsToSession(
  questions: QuizQuestion[]
): SessionQuestion[] {
  return questions.map((q) => ({
    question: q.question,
    answer: q.options[q.correctAnswer] || "",
  }));
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function calculatePointsForDifficulty(_difficulty: QuizDifficulty): number {
  // Default to 1 point for all questions regardless of difficulty
  // User can change this value manually if needed
  return 1;
}

/**
 * Check if AI question generation is available
 */
export const isAIQuestionGenerationAvailable = (): boolean => {
  return isGeminiAvailable();
};

/**
 * Get current rate limit status for AI generation
 */
export const getAIQuestionRateLimit = () => {
  return getRateLimitStatus();
};
