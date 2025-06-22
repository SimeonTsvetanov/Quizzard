/**
 * Wizard Navigation Hook
 *
 * Focused hook for managing step-by-step navigation through the quiz creation wizard.
 * Handles step progression, validation-based transitions, and step accessibility logic.
 *
 * Extracted from useQuizWizard.ts to follow Single Responsibility Principle.
 * Manages only navigation concerns, leaving validation and data to other hooks.
 *
 * Features:
 * - Current step state management
 * - Step progression with validation checks
 * - Direct step navigation with accessibility controls
 * - Step completion and enablement logic
 * - Integration with validation system
 *
 * @fileoverview Navigation hook for quiz creation wizard
 * @version 1.0.0
 * @since December 2025
 */

import { useState, useCallback, useMemo } from "react";
import type { WizardStep, QuizValidation } from "../types";

/**
 * Wizard step configuration defining the complete creation flow
 */
const WIZARD_STEPS: Omit<WizardStep, "completed" | "active" | "enabled">[] = [
  {
    id: "basic-info",
    title: "Quiz Information",
    description:
      "Set up basic quiz details like title, description, and category",
  },
  {
    id: "questions",
    title: "Add Questions",
    description: "Create and manage your quiz questions with answers",
  },
  {
    id: "review-create",
    title: "Review & Create",
    description: "Review your quiz and finalize creation.",
  },
];

/**
 * Navigation state interface
 */
export interface NavigationState {
  /** Current step index (0-based) */
  currentStep: number;
  /** Array of wizard steps with completion states */
  steps: WizardStep[];
  /** Whether user can proceed to next step */
  canProceed: boolean;
}

/**
 * Navigation actions interface
 */
export interface NavigationActions {
  /** Move to next step (if valid) */
  nextStep: () => void;
  /** Move to previous step */
  previousStep: () => void;
  /** Jump to specific step (if enabled) */
  goToStep: (stepIndex: number) => void;
  /** Reset to first step */
  resetNavigation: () => void;
}

/**
 * Hook return interface
 */
export interface UseWizardNavigationReturn {
  /** Navigation state */
  navigation: NavigationState;
  /** Navigation actions */
  actions: NavigationActions;
}

/**
 * Wizard Navigation Hook
 *
 * Manages the step-by-step navigation through the quiz creation wizard.
 * Provides validation-aware navigation that prevents users from advancing
 * without completing required fields in each step.
 *
 * @param validateCurrentStep - Function to validate the current step
 * @returns Navigation state and control functions
 */
export const useWizardNavigation = (
  validateCurrentStep: () => QuizValidation
): UseWizardNavigationReturn => {
  // Current wizard step (0-based index)
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Creates wizard steps with current completion and active states
   * Determines which steps are accessible based on previous completions
   */
  const steps = useMemo((): WizardStep[] => {
    return WIZARD_STEPS.map((step, index) => {
      // Check if this step is completed by validating it
      const isCompleted = index < currentStep;
      const isCurrentAndValid =
        index === currentStep && validateCurrentStep().isValid;

      return {
        ...step,
        completed: isCompleted || isCurrentAndValid,
        active: index === currentStep,
        enabled: index <= currentStep || isCompleted,
      };
    });
  }, [currentStep, validateCurrentStep]);

  /**
   * Determines if wizard can proceed to next step
   * Based on current step validation
   */
  const canProceed = useMemo(() => {
    const validation = validateCurrentStep();
    return validation.isValid && currentStep < WIZARD_STEPS.length - 1;
  }, [validateCurrentStep, currentStep]);

  /**
   * Moves to the next step in the wizard
   * Only allowed if current step is valid
   */
  const nextStep = useCallback(() => {
    const validation = validateCurrentStep();
    if (validation.isValid && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, validateCurrentStep]);

  /**
   * Moves to the previous step in the wizard
   * Always allowed unless on first step
   */
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Jumps directly to a specific step
   * Only allowed if step is enabled (completed or accessible)
   *
   * @param stepIndex - Target step index (0-based)
   */
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < WIZARD_STEPS.length) {
        const targetStep = steps[stepIndex];
        if (targetStep.enabled) {
          setCurrentStep(stepIndex);
        }
      }
    },
    [steps]
  );

  /**
   * Resets navigation to the first step
   * Used when starting a new wizard session
   */
  const resetNavigation = useCallback(() => {
    setCurrentStep(0);
  }, []);

  // Build navigation state
  const navigation: NavigationState = {
    currentStep,
    steps,
    canProceed,
  };

  // Build navigation actions
  const actions: NavigationActions = {
    nextStep,
    previousStep,
    goToStep,
    resetNavigation,
  };

  return {
    navigation,
    actions,
  };
};

/**
 * Navigation constants for external use
 */
export const NAVIGATION_CONSTANTS = {
  TOTAL_STEPS: WIZARD_STEPS.length,
  STEP_IDS: WIZARD_STEPS.map((step) => step.id),
  FIRST_STEP: 0,
  LAST_STEP: WIZARD_STEPS.length - 1,
} as const;
