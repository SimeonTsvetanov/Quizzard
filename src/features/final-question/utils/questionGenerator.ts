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

import type { Question } from "../types";

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

/**
 * Utility class for generating questions
 * Currently uses mock data, but structured for future API integration
 */
export class QuestionGenerator {
  private static readonly categories = [
    "General Knowledge",
    "Science",
    "History",
    "Geography",
    "Literature",
    "Sports",
    "Entertainment",
    "Technology",
  ] as const;

  private static readonly difficulties = ["easy", "medium", "hard"] as const;

  private static readonly mockQuestions: Record<string, Question[]> = {
    "General Knowledge": [
      {
        question: "What is the capital of France?",
        answer: "Paris",
        category: "General Knowledge",
        difficulty: "easy",
      },
      {
        question: "Who painted the Mona Lisa?",
        answer: "Leonardo da Vinci",
        category: "General Knowledge",
        difficulty: "medium",
      },
    ],
    Science: [
      {
        question: "What is the chemical symbol for water?",
        answer: "H2O",
        category: "Science",
        difficulty: "easy",
      },
      {
        question: "What is the speed of light?",
        answer: "299,792,458 meters per second",
        category: "Science",
        difficulty: "hard",
      },
    ],
  };

  /**
   * Get a random question based on category and difficulty
   */
  public static getRandomQuestion(
    category?: (typeof QuestionGenerator.categories)[number],
    difficulty?: (typeof QuestionGenerator.difficulties)[number]
  ): Question {
    const availableCategories = category
      ? [category]
      : QuestionGenerator.categories;

    const selectedCategory =
      availableCategories[
        Math.floor(Math.random() * availableCategories.length)
      ];

    const questions = QuestionGenerator.mockQuestions[selectedCategory] || [];

    const availableDifficulties = difficulty
      ? [difficulty]
      : QuestionGenerator.difficulties;

    const selectedDifficulty =
      availableDifficulties[
        Math.floor(Math.random() * availableDifficulties.length)
      ];

    const filteredQuestions = questions.filter(
      (q) => q.difficulty === selectedDifficulty
    );

    if (filteredQuestions.length === 0) {
      return {
        question: "Sample question",
        answer: "Sample answer",
        category: selectedCategory,
        difficulty: selectedDifficulty,
      };
    }

    return filteredQuestions[
      Math.floor(Math.random() * filteredQuestions.length)
    ];
  }

  /**
   * Get a random category
   */
  public static getRandomCategory(): (typeof QuestionGenerator.categories)[number] {
    return QuestionGenerator.categories[
      Math.floor(Math.random() * QuestionGenerator.categories.length)
    ];
  }

  /**
   * Get a random difficulty
   */
  public static getRandomDifficulty(): (typeof QuestionGenerator.difficulties)[number] {
    return QuestionGenerator.difficulties[
      Math.floor(Math.random() * QuestionGenerator.difficulties.length)
    ];
  }
}
