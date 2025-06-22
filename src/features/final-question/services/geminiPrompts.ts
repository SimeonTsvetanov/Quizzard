/**
 * Gemini AI Prompt Generation Service
 *
 * Focused service for creating comprehensive, context-aware prompts for
 * Google Gemini AI. Handles multilingual support, difficulty variations,
 * category-specific fact-checking, and session-based duplicate prevention.
 *
 * Features:
 * - Multilingual prompt generation (English, Bulgarian)
 * - Difficulty-based instruction customization
 * - Category-specific fact-checking (geography, history, science)
 * - Session history integration for duplicate prevention
 * - Bulgarian geography accuracy corrections
 * - Enhanced variability instructions
 *
 * @fileoverview Prompt generation service for Gemini AI
 * @version 1.0.0
 * @since December 2025
 */

import type { SessionQuestion } from "../types";

/**
 * Parameters for prompt generation
 * Defines all configurable aspects of question generation
 */
export interface PromptGenerationParams {
  /** Desired difficulty level (easy, medium, hard, random) */
  difficulty: string;
  /** Target language for the question and answer */
  language: string;
  /** Preferred category or topic (random if empty) */
  category: string;
  /** Array of previously generated questions to avoid duplicates */
  previousQuestions: SessionQuestion[];
}

/**
 * Create a comprehensive prompt for Gemini AI with enhanced instructions
 *
 * Builds context-aware prompts that include user preferences, session history,
 * and category-specific fact-checking instructions to ensure high-quality,
 * accurate question generation.
 *
 * @param params - Complete prompt generation parameters
 * @returns Comprehensive prompt string optimized for Gemini AI
 */
export const createEnhancedGeminiPrompt = (
  params: PromptGenerationParams
): string => {
  const { difficulty, language, category, previousQuestions } = params;

  // Generate language-specific instructions
  const languageInstruction = getLanguageInstruction(language);

  // Generate category-specific instructions
  const categoryInstruction = getCategoryInstruction(category);

  // Generate difficulty-specific instructions
  const difficultyInstruction = getDifficultyInstruction(difficulty);

  // Generate session context to avoid duplicates
  const previousQuestionsContext = getPreviousQuestionsContext(previousQuestions);

  // Generate category-specific fact-checking instructions
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
};

/**
 * Generate language-specific instructions for the AI
 *
 * Provides clear language requirements for question and answer generation.
 * Supports English and Bulgarian with proper character encoding.
 *
 * @param language - Target language for generation
 * @returns Language instruction string for the prompt
 */
function getLanguageInstruction(language: string): string {
  switch (language.toLowerCase()) {
    case "bulgarian":
    case "bg":
      return "Generate the question and answer in Bulgarian language. Use proper Bulgarian Cyrillic characters and grammar.";
    case "english":
    case "en":
    default:
      return "Generate the question and answer in English language.";
  }
}

/**
 * Generate category-specific instructions for the AI
 *
 * Provides topic guidance while maintaining flexibility for random generation.
 * Handles both specific categories and random topic selection.
 *
 * @param category - Preferred category or topic
 * @returns Category instruction string for the prompt
 */
function getCategoryInstruction(category: string): string {
  if (!category || category.toLowerCase() === "random") {
    return "Choose a random general knowledge topic from areas like geography, history, science, literature, arts, sports, or current events.";
  }

  return `Generate a question about the category: ${category}. Stay focused on this topic while ensuring the question is interesting and educational.`;
}

/**
 * Generate difficulty-specific instructions with enhanced variability
 *
 * Provides detailed instructions about question complexity, knowledge
 * requirements, and reasoning depth for each difficulty level.
 *
 * @param difficulty - Target difficulty level
 * @returns Detailed difficulty instruction for AI prompt
 */
function getDifficultyInstruction(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return `Make this an EASY question that most people would know. Use basic, well-known facts that are:
- Commonly taught in elementary or high school
- Widely known in popular culture
- Basic geographical locations (capitals, famous landmarks)
- Simple historical events or dates
- Fundamental scientific concepts`;

    case "hard":
      return `Make this a HARD question that requires specialized knowledge or expertise. Include:
- Advanced technical or scientific concepts
- Obscure historical details or lesser-known events
- Specialized terminology or professional knowledge
- Complex relationships between concepts
- Details that require deep study or research to know`;

    case "medium":
    default:
      return `Make this a MEDIUM difficulty question that requires some general knowledge and thinking. It should be:
- Challenging but not impossible for an educated person
- More than basic facts but not requiring specialized expertise
- Encouraging critical thinking or making connections
- Accessible to someone with good general knowledge
- Engaging and educational without being frustrating`;
  }
}

/**
 * Generate session context to prevent duplicate questions
 *
 * Creates context from previously generated questions to ensure variety
 * and prevent repetition within the same session.
 *
 * @param previousQuestions - Array of previously generated questions
 * @returns Context string with previous questions or empty string
 */
function getPreviousQuestionsContext(previousQuestions: SessionQuestion[]): string {
  if (previousQuestions.length === 0) {
    return "";
  }

  // Use last 10 questions for context to avoid overly long prompts
  const recentQuestions = previousQuestions.slice(-10);

  return `\n\nIMPORTANT: Do NOT repeat any of these recently asked questions. Generate something completely different:\n${recentQuestions
    .map((q, i) => `${i + 1}. ${q.question}`)
    .join("\n")}`;
}

/**
 * Generate category-specific fact-checking instructions
 *
 * Provides specialized fact-checking instructions based on the question
 * category to ensure accuracy and correct common AI misconceptions.
 *
 * @param category - Question category to generate instructions for
 * @returns Category-specific fact-checking instruction text
 */
function getFactCheckingInstruction(category: string): string {
  const lowerCategory = category.toLowerCase();

  // Geographic fact-checking with Bulgarian geography corrections
  if (
    lowerCategory.includes("geography") ||
    lowerCategory.includes("смолян") ||
    lowerCategory.includes("bulgaria") ||
    lowerCategory.includes("mountain") ||
    lowerCategory.includes("peak") ||
    lowerCategory.includes("geographic")
  ) {
    return `\nFACT-CHECKING FOR GEOGRAPHY: 
- For Bulgarian geography: Verify all mountain peaks, heights, and locations
- For Smolyan region: The highest peak near Smolyan is Perelik (2,191m), NOT Snezhanka
- Snezhanka is near Pamporovo but is NOT the highest peak in the Smolyan area
- Always verify geographical facts against reliable sources
- Double-check all numerical data (heights, distances, populations)
- Confirm current political boundaries and country names`;
  }

  // Historical fact-checking
  if (lowerCategory.includes("history") || lowerCategory.includes("historical")) {
    return `\nFACT-CHECKING FOR HISTORY: 
- Verify all dates, names, and historical events
- Ensure chronological accuracy and cause-effect relationships
- Cross-reference multiple historical sources
- Avoid disputed historical interpretations
- Confirm spelling of historical figures and places`;
  }

  // Scientific fact-checking
  if (
    lowerCategory.includes("science") ||
    lowerCategory.includes("scientific") ||
    lowerCategory.includes("physics") ||
    lowerCategory.includes("chemistry") ||
    lowerCategory.includes("biology")
  ) {
    return `\nFACT-CHECKING FOR SCIENCE: 
- Verify all scientific facts, figures, and formulas
- Ensure laws and theories are correctly stated
- Use current scientific understanding and discoveries
- Double-check units of measurement and calculations
- Avoid outdated scientific information`;
  }

  // General fact-checking
  return `\nFACT-CHECKING: 
- Verify all facts before including them in the question
- Use reliable, authoritative sources for verification
- Avoid outdated, disputed, or controversial information
- Double-check numerical data and proper names
- Ensure information is current and accurate`;
} 