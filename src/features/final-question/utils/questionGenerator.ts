/**
 * QuestionGenerator Utility
 *
 * Utility class for generating final questions with various categories,
 * difficulties, and languages.
 *
 * Responsibilities:
 * - Generate random questions
 * - Provide question categories
 * - Handle difficulty levels
 * - Support multiple languages
 */

import type { FinalQuestion } from "../types";

/**
 * Question categories with their respective emojis
 */
export const QUESTION_CATEGORIES = [
  "General Knowledge",
  "Science",
  "History",
  "Geography",
  "Literature",
  "Sports",
  "Entertainment",
  "Technology",
] as const;

/**
 * Question difficulties with their respective point values
 */
export const DIFFICULTY_POINTS = {
  easy: 100,
  medium: 200,
  hard: 300,
} as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
export type Difficulty = keyof typeof DIFFICULTY_POINTS;

interface Question {
  question: string;
  answer: string;
  difficulty: Difficulty;
  category: QuestionCategory;
  points: number;
}

/**
 * QuestionGenerator class for creating final questions
 */
export class QuestionGenerator {
  /**
   * Generate a random final question
   *
   * @param difficulty - Optional difficulty level
   * @param category - Optional question category
   * @returns A randomly generated final question
   */
  static generateQuestion(
    difficulty?: Difficulty,
    category?: QuestionCategory
  ): Question {
    const selectedDifficulty = difficulty || this.getRandomDifficulty();
    const selectedCategory = category || this.getRandomCategory();
    const points = DIFFICULTY_POINTS[selectedDifficulty];

    // TODO: Replace with actual API call
    // For now, return a mock question
    return {
      question: `What is the capital of France?`,
      answer: "Paris",
      difficulty: selectedDifficulty,
      category: selectedCategory,
      points,
    };
  }

  /**
   * Get a random category from the available categories
   */
  static getRandomCategory(): QuestionCategory {
    const randomIndex = Math.floor(Math.random() * QUESTION_CATEGORIES.length);
    return QUESTION_CATEGORIES[randomIndex];
  }

  /**
   * Get a random difficulty level
   */
  static getRandomDifficulty(): Difficulty {
    const difficulties = Object.keys(DIFFICULTY_POINTS) as Difficulty[];
    const randomIndex = Math.floor(Math.random() * difficulties.length);
    return difficulties[randomIndex];
  }
}
