/**
 * Quiz Validation Hook
 *
 * Extracted from useQuizManagement for better separation of concerns.
 * Handles all quiz validation logic including required fields, questions,
 * answer options, and media file size validation.
 *
 * @fileoverview Quiz validation hook following Single Responsibility Principle
 * @version 1.0.0
 * @since December 2025
 */

import { useCallback } from "react";
import type { Quiz, QuizValidation } from "../types";
import { QUIZ_CONSTANTS } from "../types";

/**
 * Quiz Validation Hook
 *
 * Provides comprehensive quiz validation functionality for:
 * - Required field validation (title, category, difficulty)
 * - Question structure validation
 * - Answer option validation
 * - Media file size validation
 * - Text-answer vs multiple-choice validation
 *
 * @returns Object containing validation functions
 */
export const useQuizValidation = () => {
  /**
   * Validates a quiz for completeness and correctness
   * Ensures quiz meets minimum requirements for export/save
   *
   * @param quiz - Quiz to validate (questions are now always nested under rounds)
   * @returns Validation result with errors and warnings
   */
  const validateQuiz = useCallback((quiz: Partial<Quiz>): QuizValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!quiz.title?.trim()) {
      errors.push("Quiz title is required");
    } else if (quiz.title.length > QUIZ_CONSTANTS.MAX_TITLE_LENGTH) {
      errors.push(
        `Quiz title must be ${QUIZ_CONSTANTS.MAX_TITLE_LENGTH} characters or less`
      );
    }

    if (!quiz.category) {
      errors.push("Quiz category must be selected");
    }

    if (!quiz.difficulty) {
      errors.push("Quiz difficulty must be selected");
    }

    // Questions validation
    if (
      !quiz.rounds ||
      quiz.rounds.length < QUIZ_CONSTANTS.MIN_ROUNDS ||
      quiz.rounds.flatMap((r) => r.questions).length <
        QUIZ_CONSTANTS.MIN_QUESTIONS
    ) {
      errors.push(
        `Quiz must have at least ${QUIZ_CONSTANTS.MIN_QUESTIONS} question`
      );
    } else if (
      quiz.rounds.flatMap((r) => r.questions).length >
      QUIZ_CONSTANTS.MAX_QUESTIONS
    ) {
      errors.push(
        `Quiz cannot have more than ${QUIZ_CONSTANTS.MAX_QUESTIONS} questions`
      );
    }

    // Individual question validation
    quiz.rounds?.forEach((round) => {
      round.questions?.forEach((question, questionIndex) => {
        const questionNum = questionIndex + 1;

        if (!question.question?.trim()) {
          errors.push(`Question ${questionNum}: Question text is required`);
        }

        if (question.type === "text-answer") {
          // Text-answer question validation
          if (!question.textAnswer?.trim()) {
            errors.push(`Question ${questionNum}: Answer text is required`);
          }
          // Do NOT require options or correctAnswer for text-answer
        } else {
          // Multiple choice question validation
          if (question.options.length < QUIZ_CONSTANTS.MIN_OPTIONS) {
            errors.push(
              `Question ${questionNum}: Must have at least ${QUIZ_CONSTANTS.MIN_OPTIONS} answer options`
            );
          }

          if (question.options.length > QUIZ_CONSTANTS.MAX_OPTIONS) {
            errors.push(
              `Question ${questionNum}: Cannot have more than ${QUIZ_CONSTANTS.MAX_OPTIONS} answer options`
            );
          }

          if (
            question.correctAnswer < 0 ||
            question.correctAnswer >= question.options.length
          ) {
            errors.push(
              `Question ${questionNum}: Invalid correct answer selection`
            );
          }

          // Check for empty options
          const emptyOptions = question.options.filter((opt) => !opt?.trim());
          if (emptyOptions.length > 0) {
            errors.push(
              `Question ${questionNum}: All answer options must have text`
            );
          }
        }

        // Warning for questions without explanations
        if (!question.explanation?.trim()) {
          warnings.push(
            `Question ${questionNum}: Consider adding an explanation for better learning`
          );
        }
      });
    });

    // Calculate total file size for media validation
    const totalMediaSize =
      quiz.rounds
        ?.flatMap((r) => r.questions)
        .reduce((total, question) => {
          return total + (question.mediaFile?.size || 0);
        }, 0) || 0;

    if (totalMediaSize > QUIZ_CONSTANTS.FILE_SIZE_LIMITS.total) {
      errors.push(
        `Total media file size exceeds ${Math.round(
          QUIZ_CONSTANTS.FILE_SIZE_LIMITS.total / 1024 / 1024
        )}MB limit`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date(),
    };
  }, []);

  /**
   * Validates a single question for completeness
   *
   * @param question - Question to validate
   * @param questionIndex - Index of question for error messages
   * @returns Array of error messages (empty if valid)
   */
  const validateQuestion = useCallback(
    (question: any, questionIndex: number): string[] => {
      const errors: string[] = [];
      const questionNum = questionIndex + 1;

      if (!question.question?.trim()) {
        errors.push(`Question ${questionNum}: Question text is required`);
      }

      if (question.type === "text-answer") {
        if (!question.textAnswer?.trim()) {
          errors.push(`Question ${questionNum}: Answer text is required`);
        }
      } else {
        // Multiple choice validation
        if (question.options.length < QUIZ_CONSTANTS.MIN_OPTIONS) {
          errors.push(
            `Question ${questionNum}: Must have at least ${QUIZ_CONSTANTS.MIN_OPTIONS} answer options`
          );
        }

        if (
          question.correctAnswer < 0 ||
          question.correctAnswer >= question.options.length
        ) {
          errors.push(
            `Question ${questionNum}: Invalid correct answer selection`
          );
        }

        const emptyOptions = question.options.filter(
          (opt: string) => !opt?.trim()
        );
        if (emptyOptions.length > 0) {
          errors.push(
            `Question ${questionNum}: All answer options must have text`
          );
        }
      }

      return errors;
    },
    []
  );

  /**
   * Validates media file size and type
   *
   * @param file - Media file to validate
   * @returns Validation result with error message if invalid
   */
  const validateMediaFile = useCallback(
    (file: {
      size: number;
      type: string;
    }): { isValid: boolean; error?: string } => {
      if (
        file.type === "image" &&
        file.size > QUIZ_CONSTANTS.FILE_SIZE_LIMITS.image
      ) {
        return {
          isValid: false,
          error: `Image file size exceeds ${Math.round(
            QUIZ_CONSTANTS.FILE_SIZE_LIMITS.image / 1024 / 1024
          )}MB limit`,
        };
      }

      if (
        file.type === "audio" &&
        file.size > QUIZ_CONSTANTS.FILE_SIZE_LIMITS.audio
      ) {
        return {
          isValid: false,
          error: `Audio file size exceeds ${Math.round(
            QUIZ_CONSTANTS.FILE_SIZE_LIMITS.audio / 1024 / 1024
          )}MB limit`,
        };
      }

      if (
        file.type === "video" &&
        file.size > QUIZ_CONSTANTS.FILE_SIZE_LIMITS.video
      ) {
        return {
          isValid: false,
          error: `Video file size exceeds ${Math.round(
            QUIZ_CONSTANTS.FILE_SIZE_LIMITS.video / 1024 / 1024
          )}MB limit`,
        };
      }

      return { isValid: true };
    },
    []
  );

  return {
    validateQuiz,
    validateQuestion,
    validateMediaFile,
  };
};
