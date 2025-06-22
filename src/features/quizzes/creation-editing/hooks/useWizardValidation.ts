/**
 * Wizard Validation Hook
 *
 * Focused hook for validating quiz data across all wizard steps.
 * Provides step-specific validation logic with comprehensive error checking
 * and user-friendly validation messages.
 *
 * Extracted from useQuizWizard.ts to follow Single Responsibility Principle.
 * Handles all validation concerns, from basic info to complex question validation.
 *
 * Features:
 * - Step-specific validation rules
 * - Comprehensive error and warning collection
 * - Progressive validation (from basic to complex)
 * - Type-safe validation with detailed error messages
 * - Real-time validation feedback
 *
 * @fileoverview Validation hook for quiz creation wizard
 * @version 1.0.0
 * @since December 2025
 */

import { useCallback } from "react";
import type { Quiz, QuizValidation } from "../types";
import { QUIZ_CONSTANTS } from "../types";

/**
 * Validation context interface
 */
export interface ValidationContext {
  /** Current step being validated (0-based) */
  currentStep: number;
  /** Quiz data to validate */
  draftQuiz: Partial<Quiz>;
}

/**
 * Validation actions interface
 */
export interface ValidationActions {
  /** Validates the current step */
  validateStep: () => QuizValidation;
  /** Validates a specific step by index */
  validateSpecificStep: (stepIndex: number) => QuizValidation;
  /** Validates all steps for final review */
  validateAllSteps: () => QuizValidation;
}

/**
 * Hook return interface
 */
export interface UseWizardValidationReturn extends ValidationActions {
  /** Check if current step is valid */
  isCurrentStepValid: boolean;
  /** Check if all steps are valid */
  isWizardComplete: boolean;
}

/**
 * Wizard Validation Hook
 *
 * Provides comprehensive validation for all steps of the quiz creation wizard.
 * Each step has specific validation requirements that must be met before
 * the user can proceed to the next step.
 *
 * @param context - Validation context with current step and quiz data
 * @returns Validation functions and state
 */
export const useWizardValidation = (
  context: ValidationContext
): UseWizardValidationReturn => {
  const { currentStep, draftQuiz } = context;

  /**
   * Validates basic information step (step 0)
   * Checks required fields: title, category, difficulty
   * Provides warnings for optional but recommended fields
   */
  const validateBasicInfo = useCallback((): QuizValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Title validation
    if (!draftQuiz.title?.trim()) {
      errors.push("Quiz title is required");
    } else if (draftQuiz.title.length > QUIZ_CONSTANTS.MAX_TITLE_LENGTH) {
      errors.push(
        `Title must be ${QUIZ_CONSTANTS.MAX_TITLE_LENGTH} characters or less`
      );
    }

    // Category validation
    if (!draftQuiz.category) {
      errors.push("Quiz category must be selected");
    }

    // Difficulty validation
    if (!draftQuiz.difficulty) {
      errors.push("Quiz difficulty must be selected");
    }

    // Description warning (optional but recommended)
    if (!draftQuiz.description?.trim()) {
      warnings.push(
        "Consider adding a description to help users understand the quiz content"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date(),
    };
  }, [draftQuiz]);

  /**
   * Validates questions step (step 1)
   * Comprehensive validation of rounds and questions
   * Checks question text, answer options, and correct answers
   */
  const validateQuestions = useCallback((): QuizValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if any rounds exist
    if (!draftQuiz.rounds || draftQuiz.rounds.length < 1) {
      errors.push("Quiz must have at least one round");
      return {
        isValid: false,
        errors,
        warnings,
        validatedAt: new Date(),
      };
    }

    // Validate each round and its questions
    draftQuiz.rounds.forEach((round, rIdx) => {
      const roundNum = rIdx + 1;

      // Check if round has questions
      if (!round.questions || round.questions.length < 1) {
        errors.push(`Round ${roundNum} must have at least one question`);
        return;
      }

      // Validate each question in the round
      round.questions.forEach((question, qIdx) => {
        // Skip validation if question is undefined or incomplete
        if (!question || typeof question !== "object") {
          return;
        }

        const questionNum = qIdx + 1;
        const questionRef = `Round ${roundNum}, Question ${questionNum}`;

        // Question text validation
        if (!question.question?.trim()) {
          errors.push(`${questionRef}: Question text is required`);
        }

        // Type-specific validation
        if (question.type === "single-answer") {
          // Single answer validation
          if (!question.correctAnswerText?.trim()) {
            warnings.push(`${questionRef}: Consider adding an answer`);
          }
        } else if (
          ["multiple-choice", "picture", "audio", "video"].includes(
            question.type
          )
        ) {
          // Multiple choice and media type validation
          if (round.type === "golden-pyramid") {
            // Special handling for Golden Pyramid questions - allow partial completion
            // Users can work on questions gradually and save incomplete ones
            if (
              !question.possibleAnswers ||
              !Array.isArray(question.possibleAnswers) ||
              question.possibleAnswers.length === 0 ||
              question.possibleAnswers.every((answer) => !answer?.trim())
            ) {
              warnings.push(
                `${questionRef}: Consider adding at least one answer option`
              );
            }
          } else {
            // Regular multiple choice validation (including media types)
            // Allow users to save incomplete questions and work on them gradually

            // Check minimum options
            if (
              !question.possibleAnswers ||
              !Array.isArray(question.possibleAnswers) ||
              question.possibleAnswers.length < QUIZ_CONSTANTS.MIN_OPTIONS
            ) {
              warnings.push(
                `${questionRef}: Consider adding at least ${QUIZ_CONSTANTS.MIN_OPTIONS} answer options`
              );
            }

            // Check correct answer selection - add safety checks
            if (
              !question.correctAnswers ||
              !Array.isArray(question.correctAnswers) ||
              question.correctAnswers.length === 0
            ) {
              warnings.push(
                `${questionRef}: Consider selecting at least one correct answer`
              );
            } else if (
              question.possibleAnswers &&
              Array.isArray(question.possibleAnswers)
            ) {
              // Validate correct answer indices are within range
              const possibleAnswersLength =
                question.possibleAnswers?.length || 0;
              const invalidIndices = question.correctAnswers.filter(
                (index) =>
                  typeof index !== "number" ||
                  index < 0 ||
                  index >= possibleAnswersLength
              );
              if (invalidIndices.length > 0) {
                warnings.push(
                  `${questionRef}: Some correct answer selections may be invalid`
                );
              }
            }

            // Check for empty options - convert to warning for gradual completion
            if (
              question.possibleAnswers &&
              Array.isArray(question.possibleAnswers)
            ) {
              const emptyOptions = question.possibleAnswers.filter(
                (opt) => !opt?.trim()
              );
              if (emptyOptions.length > 0) {
                warnings.push(
                  `${questionRef}: Consider filling in all answer options`
                );
              }
            }

            // Warning for too many options (usability) - add safety checks
            if (
              question.possibleAnswers &&
              Array.isArray(question.possibleAnswers) &&
              question.possibleAnswers.length > QUIZ_CONSTANTS.MAX_OPTIONS
            ) {
              warnings.push(
                `${questionRef}: Consider limiting to ${QUIZ_CONSTANTS.MAX_OPTIONS} options for better usability`
              );
            }
          }
        }

        // Question length warnings
        if (question.question && question.question.length > 200) {
          warnings.push(`${questionRef}: Long questions may be harder to read`);
        }
      });

      // Round-level warnings
      if (round.questions.length > 10) {
        warnings.push(
          `Round ${roundNum}: Many questions in one round may overwhelm users`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date(),
    };
  }, [draftQuiz.rounds]);

  /**
   * Validates review step (step 2)
   * Final comprehensive validation before quiz creation
   * Ensures all previous steps are complete and valid
   */
  const validateReview = useCallback((): QuizValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate basic info completeness
    const basicInfoValid = !!draftQuiz.title?.trim();
    if (!basicInfoValid) {
      errors.push("Basic quiz information is incomplete");
    }

    // Validate rounds and questions completeness
    const roundsValid =
      draftQuiz.rounds &&
      draftQuiz.rounds.length > 0 &&
      draftQuiz.rounds.every((r) => r.questions && r.questions.length > 0);
    if (!roundsValid) {
      errors.push("Quiz must have at least one round with questions");
    }

    // Validate settings completeness
    const settingsValid = !!draftQuiz.settings;
    if (!settingsValid) {
      errors.push("Quiz settings are required");
    }

    // Calculate total questions for duration estimate
    const totalQuestions =
      draftQuiz.rounds?.reduce(
        (sum, round) => sum + (round.questions?.length || 0),
        0
      ) || 0;

    // Warnings for quiz structure
    if (totalQuestions < 5) {
      warnings.push("Quiz has fewer than 5 questions - consider adding more");
    }
    if (totalQuestions > 50) {
      warnings.push(
        "Quiz has many questions - consider splitting into multiple quizzes"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date(),
    };
  }, [draftQuiz]);

  /**
   * Validates the current step based on step index
   * Routes to appropriate step-specific validation function
   */
  const validateStep = useCallback((): QuizValidation => {
    switch (currentStep) {
      case 0: // Basic Info Step
        return validateBasicInfo();
      case 1: // Questions Step
        return validateQuestions();
      case 2: // Review Step
        return validateReview();
      default:
        return {
          isValid: false,
          errors: ["Invalid step"],
          warnings: [],
          validatedAt: new Date(),
        };
    }
  }, [currentStep, validateBasicInfo, validateQuestions, validateReview]);

  /**
   * Validates a specific step by index
   * Useful for checking completion of previous steps
   */
  const validateSpecificStep = useCallback(
    (stepIndex: number): QuizValidation => {
      switch (stepIndex) {
        case 0:
          return validateBasicInfo();
        case 1:
          return validateQuestions();
        case 2:
          return validateReview();
        default:
          return {
            isValid: false,
            errors: ["Invalid step index"],
            warnings: [],
            validatedAt: new Date(),
          };
      }
    },
    [validateBasicInfo, validateQuestions, validateReview]
  );

  /**
   * Validates all steps for final quiz creation
   * Ensures entire wizard is complete and valid
   */
  const validateAllSteps = useCallback((): QuizValidation => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate each step
    [0, 1, 2].forEach((stepIndex) => {
      const stepValidation = validateSpecificStep(stepIndex);
      allErrors.push(...stepValidation.errors);
      allWarnings.push(...stepValidation.warnings);
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      validatedAt: new Date(),
    };
  }, [validateSpecificStep]);

  // Compute derived state
  const currentStepValidation = validateStep();
  const isCurrentStepValid = currentStepValidation.isValid;
  const allStepsValidation = validateAllSteps();
  const isWizardComplete = allStepsValidation.isValid;

  return {
    validateStep,
    validateSpecificStep,
    validateAllSteps,
    isCurrentStepValid,
    isWizardComplete,
  };
};
