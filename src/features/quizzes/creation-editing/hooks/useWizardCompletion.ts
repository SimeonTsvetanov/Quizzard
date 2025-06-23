/**
 * Wizard Completion Hook
 *
 * Focused hook for managing quiz creation completion and finalization.
 * Handles the final quiz object creation, validation, and data transformation
 * from draft to production-ready quiz.
 *
 * Extracted from useQuizWizard.ts to follow Single Responsibility Principle.
 * Manages only completion concerns, leaving navigation and persistence to other hooks.
 *
 * Features:
 * - Final quiz validation and creation
 * - Data transformation from draft to final format
 * - Automatic timestamp and ID generation
 * - Duration calculation based on question count
 * - Error handling for incomplete data
 *
 * @fileoverview Completion hook for quiz creation wizard
 * @version 1.0.0
 * @since December 2025
 */

import { useCallback } from "react";
import type { Quiz, QuizValidation } from "../types";

/**
 * Completion context interface
 */
export interface CompletionContext {
  /** Current draft quiz data */
  draftQuiz: Partial<Quiz>;
  /** Function to validate all wizard steps */
  validateAllSteps: () => QuizValidation;
  /** Function to clear draft after completion */
  clearDraft: () => void;
  /** Function to reset draft to defaults */
  resetDraft: () => void;
}

/**
 * Completion actions interface
 */
export interface CompletionActions {
  /** Complete wizard and create final quiz */
  completeWizard: () => Promise<Quiz>;
  /** Check if wizard can be completed */
  canComplete: () => boolean;
  /** Get completion readiness status */
  getCompletionStatus: () => {
    ready: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Hook return interface
 */
export interface UseWizardCompletionReturn extends CompletionActions {
  /** Whether wizard is ready for completion */
  isReady: boolean;
}

/**
 * Wizard Completion Hook
 *
 * Manages the final step of quiz creation - transforming the draft quiz
 * into a complete, production-ready quiz object with all required metadata.
 *
 * @param context - Completion context with draft data and validation
 * @returns Completion functions and status
 */
export const useWizardCompletion = (
  context: CompletionContext
): UseWizardCompletionReturn => {
  const { draftQuiz, clearDraft } = context;

  /**
   * Calculates estimated quiz duration based on content
   * Uses question count and complexity to estimate time needed
   *
   * @param rounds - Quiz rounds to analyze
   * @returns Estimated duration in minutes
   */
  const calculateEstimatedDuration = useCallback(
    (rounds: Quiz["rounds"]): number => {
      const totalQuestions = rounds.reduce(
        (sum, round) => sum + (round.questions?.length || 0),
        0
      );

      // Base calculation: 1.5 minutes per question
      const baseDuration = Math.ceil(totalQuestions * 1.5);

      // Factor in question complexity (longer questions need more time)
      const complexityFactor = rounds.reduce((factor, round) => {
        const avgQuestionLength =
          round.questions.reduce(
            (sum, q) => sum + (q.question?.length || 0),
            0
          ) / round.questions.length;

        // Add time for longer questions
        return factor + (avgQuestionLength > 100 ? 0.5 : 0);
      }, 0);

      // Minimum 5 minutes, add complexity time
      return Math.max(5, baseDuration + Math.ceil(complexityFactor));
    },
    []
  );

  /**
   * Generates a unique quiz ID or preserves existing one for edits
   * Combines timestamp and random string for uniqueness for new quizzes
   * Preserves original ID for quiz edits to prevent duplicates
   *
   * @returns Quiz identifier (new for create, existing for edit)
   */
  const generateQuizId = useCallback((): string => {
    // If we have an existing quiz ID (from edit mode), preserve it
    if (draftQuiz.id && !draftQuiz.id.startsWith("draft_")) {
      return draftQuiz.id;
    }

    // For new quizzes, generate unique ID
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `quiz_${timestamp}_${randomPart}`;
  }, [draftQuiz.id]);

  /**
   * Transforms draft quiz into complete quiz object
   * Adds all required metadata and validates data integrity
   * Now much more lenient - only requires title
   * Preserves original quiz ID for edits to prevent duplicates
   *
   * @returns Complete quiz object ready for storage
   */
  const createCompleteQuiz = useCallback((): Quiz => {
    // Only require title - everything else gets defaults
    if (!draftQuiz.title?.trim()) {
      throw new Error("Quiz title is required");
    }

    const now = new Date();
    const isEditMode = draftQuiz.id && !draftQuiz.id.startsWith("draft_");

    // Provide defaults for missing fields
    const rounds = draftQuiz.rounds || [];
    const settings = draftQuiz.settings || {
      allowHints: false,
      showCorrectAnswers: true,
      timeLimit: null,
      randomizeQuestions: false,
      randomizeAnswers: false,
    };

    const estimatedDuration = Math.max(
      rounds.length > 0 ? calculateEstimatedDuration(rounds) : 5,
      draftQuiz.estimatedDuration || 5
    );

    // Create complete quiz object with all metadata
    const completedQuiz: Quiz = {
      id: generateQuizId(), // This now preserves original ID for edits
      title: draftQuiz.title.trim(),
      description: draftQuiz.description?.trim() || "",
      category: draftQuiz.category || "general",
      difficulty: draftQuiz.difficulty || "medium",
      estimatedDuration,
      // Preserve original creation date for edits, set new for creates
      createdAt: isEditMode ? draftQuiz.createdAt || now : now,
      updatedAt: now, // Always update the modification time
      settings,
      rounds: rounds.map((round) => ({
        ...round,
        // Ensure round metadata
        id:
          round.id ||
          `round_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: round.createdAt || now,
        updatedAt: round.updatedAt || now,
        // Process questions with metadata (allow empty questions)
        questions: (round.questions || []).map((question) => ({
          ...question,
          id:
            question.id ||
            `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: question.createdAt || now,
          updatedAt: question.updatedAt || now,
        })),
      })),
    };

    return completedQuiz;
  }, [draftQuiz, calculateEstimatedDuration, generateQuizId]);

  /**
   * Checks if wizard can be completed
   * Now much more lenient - only requires title
   *
   * @returns True if wizard can be completed
   */
  const canComplete = useCallback((): boolean => {
    // Only require title for completion
    return !!draftQuiz.title?.trim();
  }, [draftQuiz.title]);

  /**
   * Gets detailed completion readiness status
   * Provides errors and warnings for UI feedback
   *
   * @returns Completion status with detailed feedback
   */
  const getCompletionStatus = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Only check for title
    if (!draftQuiz.title?.trim()) {
      errors.push("Quiz title is required");
    }

    // Add warnings for missing optional fields
    if (!draftQuiz.category) {
      warnings.push("Consider adding a category");
    }
    if (!draftQuiz.difficulty) {
      warnings.push("Consider setting a difficulty level");
    }
    if (!draftQuiz.rounds || draftQuiz.rounds.length === 0) {
      warnings.push("Consider adding some questions");
    }

    return {
      ready: errors.length === 0,
      errors,
      warnings,
    };
  }, [draftQuiz]);

  /**
   * Completes the wizard and creates the final quiz
   * Now bypasses strict validation and only requires title
   * Clears draft data upon successful completion
   *
   * @returns Promise resolving to the completed quiz
   * @throws Error if title is missing
   */
  const completeWizard = useCallback(async (): Promise<Quiz> => {
    // Only check for title
    if (!draftQuiz.title?.trim()) {
      throw new Error("Quiz title is required");
    }

    try {
      // Create the complete quiz object
      const completedQuiz = createCompleteQuiz();

      // Debug log for development troubleshooting
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[WizardCompletion] Quiz created successfully:", {
          id: completedQuiz.id,
          title: completedQuiz.title,
          rounds: completedQuiz.rounds.length,
          totalQuestions: completedQuiz.rounds.reduce(
            (sum, r) => sum + r.questions.length,
            0
          ),
          estimatedDuration: completedQuiz.estimatedDuration,
        });
      }

      // Clear draft data after successful creation
      clearDraft();

      return completedQuiz;
    } catch (error) {
      // Log error for debugging
      console.error("[WizardCompletion] Failed to create quiz:", error);

      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Quiz creation failed: ${error.message}`);
      } else {
        throw new Error("Quiz creation failed due to unknown error");
      }
    }
  }, [draftQuiz.title, createCompleteQuiz, clearDraft]);

  // Compute derived state
  const isReady = canComplete();

  return {
    completeWizard,
    canComplete,
    getCompletionStatus,
    isReady,
  };
};
