/**
 * Quiz Creation Wizard Hook - Refactored Composition Service
 *
 * REFACTORED: This hook now composes smaller, focused modules following
 * the Single Responsibility Principle. The original monolithic 470-line
 * hook has been split into:
 * - useWizardNavigation: Step navigation and progression logic
 * - useWizardValidation: Multi-step validation system
 * - useWizardPersistence: Draft management and localStorage
 * - useWizardCompletion: Quiz creation and finalization
 *
 * This service maintains backward compatibility while providing a cleaner,
 * more maintainable architecture.
 *
 * Original Features Preserved:
 * - Step-by-step wizard navigation with validation
 * - Draft quiz persistence during creation process
 * - Progressive form validation and error handling
 * - Comprehensive quiz data validation
 * - Final quiz creation and data transformation
 * - Clean integration with quiz management system
 *
 * @fileoverview Composition hook for quiz creation wizard workflow
 * @version 2.0.0 (Refactored)
 * @since December 2025
 */

import type { Quiz, UseQuizWizardReturn } from "../types";
import { useWizardNavigation } from "./useWizardNavigation";
import { useWizardValidation } from "./useWizardValidation";
import { useWizardPersistence } from "./useWizardPersistence";
import { useWizardCompletion } from "./useWizardCompletion";

/**
 * Quiz Creation Wizard Hook - Refactored
 *
 * Provides comprehensive wizard functionality for creating quizzes by
 * composing four focused hooks that each handle specific responsibilities:
 *
 * 1. Navigation: Step progression and accessibility
 * 2. Validation: Step-specific validation with detailed feedback
 * 3. Persistence: Draft management with auto-save
 * 4. Completion: Final quiz creation and data transformation
 *
 * @param initialQuiz - Optional initial quiz data for editing
 * @returns Complete wizard interface with all functionality
 */
export const useQuizWizard = (
  initialQuiz?: Partial<Quiz>
): UseQuizWizardReturn => {
  // Initialize persistence hook (manages draft data and localStorage)
  const { persistDraft, loadDraft, clearDraft, resetDraft } =
    useWizardPersistence();

  // Initialize validation hook (handles step-specific validation)
  const validationHook = useWizardValidation({
    currentStep: 0, // Will be updated by navigation hook
    draftQuiz,
  });

  // Initialize navigation hook (manages step progression)
  const {
    navigation: { currentStep, steps, canProceed },
    actions: navigationActions,
  } = useWizardNavigation(validationHook.validateStep);

  // Update validation context with current step from navigation
  const updatedValidation = useWizardValidation({
    currentStep,
    draftQuiz,
  });

  // Initialize completion hook (handles final quiz creation)
  const completionHook = useWizardCompletion({
    draftQuiz,
    validateAllSteps: updatedValidation.validateAllSteps,
    clearDraft: clearDraft,
    resetDraft: resetDraft,
  });

  /**
   * Resets the entire wizard to initial state
   * Combines navigation reset with draft cleanup
   */
  const resetWizard = (): void => {
    navigationActions.resetNavigation();
    clearDraft();
  };

  // Return complete wizard interface maintaining backward compatibility
  return {
    // Navigation state and controls
    currentStep,
    steps,
    canProceed,
    nextStep: navigationActions.nextStep,
    previousStep: navigationActions.previousStep,
    goToStep: navigationActions.goToStep,

    // Draft data management
    draftQuiz,
    updateDraft: persistDraft,
    saveDraft: persistDraft,

    // Validation
    validateStep: updatedValidation.validateStep,

    // Completion
    completeWizard: completionHook.completeWizard,

    // Reset functionality
    resetWizard,
  };
};
