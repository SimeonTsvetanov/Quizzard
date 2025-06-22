/**
 * Wizard UI State Management Hook
 *
 * Manages UI-specific state for the QuizWizardModal including submission status,
 * validation display, alert dismissal, and user interactions. Extracted from
 * the main modal component to improve maintainability and separation of concerns.
 *
 * Features:
 * - Submission state tracking
 * - Validation display control
 * - Alert dismissal management
 * - Step change side effects
 * - Snackbar notifications
 *
 * @fileoverview UI state management hook for QuizWizardModal
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import { useSnackbar } from "../../../../../shared/hooks/useSnackbar";

/**
 * Alert dismissal state interface
 */
interface DismissedAlerts {
  errors: boolean;
  warnings: boolean;
}

/**
 * Wizard UI state interface
 */
export interface WizardUIState {
  isSubmitting: boolean;
  dismissedAlerts: DismissedAlerts;
  showValidation: boolean;
}

/**
 * Wizard UI actions interface
 */
export interface WizardUIActions {
  setIsSubmitting: (isSubmitting: boolean) => void;
  setDismissedAlerts: React.Dispatch<React.SetStateAction<DismissedAlerts>>;
  setShowValidation: (show: boolean) => void;
  showSnackbar: (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => void;
  resetUIState: () => void;
}

/**
 * Hook return type
 */
export interface UseWizardUIStateReturn {
  uiState: WizardUIState;
  uiActions: WizardUIActions;
}

/**
 * Wizard UI State Management Hook
 *
 * Manages all UI-specific state for the wizard modal including validation
 * display, alert dismissals, and submission status.
 *
 * @param currentStep - Current wizard step for resetting UI state on step changes
 * @returns UI state and actions for wizard interaction
 */
export const useWizardUIState = (
  currentStep: number
): UseWizardUIStateReturn => {
  const { showSnackbar } = useSnackbar();

  // === UI STATE ===
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [dismissedAlerts, setDismissedAlerts] = React.useState<DismissedAlerts>(
    {
      errors: false,
      warnings: false,
    }
  );
  const [showValidation, setShowValidation] = React.useState(false);

  /**
   * Reset UI state when step changes
   */
  React.useEffect(() => {
    setDismissedAlerts({ errors: false, warnings: false });
    setShowValidation(false);
  }, [currentStep]);

  /**
   * Reset all UI state to initial values
   */
  const resetUIState = React.useCallback(() => {
    setIsSubmitting(false);
    setDismissedAlerts({ errors: false, warnings: false });
    setShowValidation(false);
  }, []);

  return {
    uiState: {
      isSubmitting,
      dismissedAlerts,
      showValidation,
    },
    uiActions: {
      setIsSubmitting,
      setDismissedAlerts,
      setShowValidation,
      showSnackbar,
      resetUIState,
    },
  };
};
