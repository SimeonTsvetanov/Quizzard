/**
 * Enhanced Quiz Creation Wizard Hook with IndexedDB Auto-Save
 */

import type { Quiz } from "../types";
import { useWizardNavigation } from "./useWizardNavigation";
import { useWizardValidation } from "./useWizardValidation";
import { useWizardPersistenceWithStorage } from "./useWizardPersistenceWithStorage";
import { useWizardCompletion } from "./useWizardCompletion";

export interface UseQuizWizardWithStorageReturn {
  currentStep: number;
  steps: string[];
  canProceed: boolean;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  draftQuiz: Partial<Quiz>;
  updateDraft: (updates: Partial<Quiz>) => void;
  saveDraft: () => Promise<void>;
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  storageError: string | null;
  lastSaved: Date | null;
  validateStep: () => { isValid: boolean; errors: string[] };
  completeWizard: () => Promise<Quiz>;
  resetWizard: () => void;
  recoverDraft: () => Promise<boolean>;
}

export const useQuizWizardWithStorage = (
  initialQuiz?: Partial<Quiz>
): UseQuizWizardWithStorageReturn => {
  const {
    persistence: { draftQuiz, autoSaveStatus, storageError, lastSaved },
    actions: persistenceActions,
  } = useWizardPersistenceWithStorage(initialQuiz);

  const validationHook = useWizardValidation({
    currentStep: 0,
    draftQuiz,
  });

  const {
    navigation: { currentStep, steps, canProceed },
    actions: navigationActions,
  } = useWizardNavigation(validationHook.validateStep);

  const updatedValidation = useWizardValidation({
    currentStep,
    draftQuiz,
  });

  const completionHook = useWizardCompletion({
    draftQuiz,
    validateAllSteps: updatedValidation.validateAllSteps,
    clearDraft: persistenceActions.clearDraft,
    resetDraft: persistenceActions.resetDraft,
  });

  const resetWizard = (): void => {
    navigationActions.resetNavigation();
    persistenceActions.clearDraft();
  };

  return {
    currentStep,
    steps,
    canProceed,
    nextStep: navigationActions.nextStep,
    previousStep: navigationActions.previousStep,
    goToStep: navigationActions.goToStep,
    draftQuiz,
    updateDraft: persistenceActions.updateDraft,
    saveDraft: persistenceActions.saveDraft,
    autoSaveStatus,
    storageError,
    lastSaved,
    validateStep: updatedValidation.validateStep,
    completeWizard: completionHook.completeWizard,
    resetWizard,
    recoverDraft: persistenceActions.recoverDraft,
  };
};
