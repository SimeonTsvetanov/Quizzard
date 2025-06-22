/**
 * Quiz CRUD Operations Hook
 *
 * Extracted from useQuizManagement for better separation of concerns.
 * Handles all Create, Read, Update, Delete operations for quizzes with
 * localStorage persistence and proper error handling.
 *
 * @fileoverview Quiz CRUD operations hook following Single Responsibility Principle
 * @version 1.0.0
 * @since December 2025
 */

import { useState, useEffect, useCallback } from "react";
import type { Quiz } from "../types";
import { useLocalStoragePersistence } from "../../../../shared/hooks/useLocalStoragePersistence";
import { useQuizValidation } from "./useQuizValidation";

/**
 * Storage keys for quiz-related data
 * Using centralized key management following established patterns
 */
const STORAGE_KEYS = {
  QUIZZES: "quizzard-quizzes",
  CURRENT_QUIZ: "quizzard-current-quiz",
} as const;

/**
 * Quiz CRUD Operations Hook
 *
 * Provides comprehensive quiz CRUD functionality including:
 * - Create new quizzes with unique IDs and timestamps
 * - Read and load existing quizzes from storage
 * - Update existing quizzes with validation
 * - Delete quizzes with proper cleanup
 * - localStorage persistence with auto-save
 *
 * @returns Object containing CRUD operations and state
 */
export const useQuizCRUD = () => {
  // Core state management with localStorage persistence
  const { value: quizzes, setValue: setQuizzes } = useLocalStoragePersistence<
    Quiz[]
  >(STORAGE_KEYS.QUIZZES, [], { debounceMs: 500, iosCompatMode: true });

  const { value: currentQuiz, setValue: setCurrentQuiz } =
    useLocalStoragePersistence<Quiz | null>(STORAGE_KEYS.CURRENT_QUIZ, null, {
      debounceMs: 500,
      iosCompatMode: true,
    });

  // UI state management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use validation hook
  const { validateQuiz } = useQuizValidation();

  /**
   * Creates a new quiz and saves it to storage
   * Generates unique ID and timestamps automatically
   *
   * @param quizData - Quiz data without ID and timestamps
   * @returns Promise resolving to the created quiz
   */
  const createQuiz = useCallback(
    async (
      quizData: Omit<Quiz, "id" | "createdAt" | "updatedAt">
    ): Promise<Quiz> => {
      setIsLoading(true);
      setError(null);

      try {
        // Generate unique ID using timestamp and random component
        const id = `quiz_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const now = new Date();

        const newQuiz: Quiz = {
          ...quizData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        // Validate quiz before saving
        const validation = validateQuiz(newQuiz);
        if (!validation.isValid) {
          throw new Error(
            `Quiz validation failed: ${validation.errors.join(", ")}`
          );
        }

        // Update quizzes list
        const updatedQuizzes = [...quizzes, newQuiz];
        setQuizzes(updatedQuizzes);
        setCurrentQuiz(newQuiz);

        return newQuiz;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create quiz";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [quizzes, setQuizzes, setCurrentQuiz, validateQuiz]
  );

  /**
   * Updates an existing quiz with new data
   * Automatically updates the updatedAt timestamp
   *
   * @param id - Quiz ID to update
   * @param updates - Partial quiz data to update
   * @returns Promise resolving to the updated quiz
   */
  const updateQuiz = useCallback(
    async (id: string, updates: Partial<Quiz>): Promise<Quiz> => {
      setIsLoading(true);
      setError(null);

      try {
        const quizIndex = quizzes.findIndex((quiz) => quiz.id === id);
        if (quizIndex === -1) {
          throw new Error("Quiz not found");
        }

        const existingQuiz = quizzes[quizIndex];
        const updatedQuiz: Quiz = {
          ...existingQuiz,
          ...updates,
          id, // Ensure ID doesn't change
          createdAt: existingQuiz.createdAt, // Preserve creation date
          updatedAt: new Date(),
        };

        // Validate updated quiz
        const validation = validateQuiz(updatedQuiz);
        if (!validation.isValid) {
          throw new Error(
            `Quiz validation failed: ${validation.errors.join(", ")}`
          );
        }

        // Update quizzes list
        const updatedQuizzes = [...quizzes];
        updatedQuizzes[quizIndex] = updatedQuiz;
        setQuizzes(updatedQuizzes);

        // Update current quiz if it's the one being updated
        if (currentQuiz?.id === id) {
          setCurrentQuiz(updatedQuiz);
        }

        return updatedQuiz;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update quiz";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [quizzes, currentQuiz, setQuizzes, setCurrentQuiz, validateQuiz]
  );

  /**
   * Deletes a quiz from storage
   * Also clears current quiz if it's the one being deleted
   *
   * @param id - Quiz ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  const deleteQuiz = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedQuizzes = quizzes.filter((quiz) => quiz.id !== id);
        setQuizzes(updatedQuizzes);

        // Clear current quiz if it's the one being deleted
        if (currentQuiz?.id === id) {
          setCurrentQuiz(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete quiz";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [quizzes, currentQuiz, setQuizzes, setCurrentQuiz]
  );

  /**
   * Loads a specific quiz by ID and sets it as current
   *
   * @param id - Quiz ID to load
   * @returns Promise resolving to the loaded quiz or null if not found
   */
  const loadQuiz = useCallback(
    async (id: string): Promise<Quiz | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const quiz = quizzes.find((q) => q.id === id) || null;
        setCurrentQuiz(quiz);
        return quiz;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load quiz";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [quizzes, setCurrentQuiz]
  );

  /**
   * Clears the currently selected quiz
   */
  const clearCurrentQuiz = useCallback(() => {
    setCurrentQuiz(null);
    setError(null);
  }, [setCurrentQuiz]);

  /**
   * Gets a quiz by ID without setting it as current
   *
   * @param id - Quiz ID to retrieve
   * @returns Quiz object or null if not found
   */
  const getQuizById = useCallback(
    (id: string): Quiz | null => {
      return quizzes.find((quiz) => quiz.id === id) || null;
    },
    [quizzes]
  );

  /**
   * Checks if a quiz with the given ID exists
   *
   * @param id - Quiz ID to check
   * @returns Boolean indicating existence
   */
  const quizExists = useCallback(
    (id: string): boolean => {
      return quizzes.some((quiz) => quiz.id === id);
    },
    [quizzes]
  );

  /**
   * Gets all quizzes with optional filtering
   *
   * @param filter - Optional filter function
   * @returns Array of quizzes matching the filter
   */
  const getQuizzes = useCallback(
    (filter?: (quiz: Quiz) => boolean): Quiz[] => {
      return filter ? quizzes.filter(filter) : quizzes;
    },
    [quizzes]
  );

  // Initialize with any existing data on mount
  useEffect(() => {
    if (quizzes.length > 0) {
      setError(null);
    }
  }, [quizzes.length]);

  return {
    // State
    quizzes,
    currentQuiz,
    isLoading,
    error,

    // CRUD Operations
    createQuiz,
    updateQuiz,
    deleteQuiz,
    loadQuiz,
    clearCurrentQuiz,

    // Utility functions
    getQuizById,
    quizExists,
    getQuizzes,

    // Direct state setters (for advanced use cases)
    setQuizzes,
    setCurrentQuiz,
  };
};
