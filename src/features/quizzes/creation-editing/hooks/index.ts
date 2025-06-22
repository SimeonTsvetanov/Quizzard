/**
 * Creation & Editing Hooks Index
 *
 * Exports all quiz creation and editing-related hooks including:
 * - useQuizWizard: Main wizard state management
 * - useWizardNavigation: Step navigation logic
 * - useWizardValidation: Validation logic
 * - useWizardPersistence: Draft persistence
 * - useWizardCompletion: Completion logic
 * - Storage-enhanced versions of all hooks
 *
 * @fileoverview Central export point for creation-editing hooks
 * @version 1.0.0
 */

// Main Wizard Hook
export { useQuizWizard } from "./useQuizWizard";

// Wizard Navigation
export { useWizardNavigation } from "./useWizardNavigation";

// Wizard Validation
export { useWizardValidation } from "./useWizardValidation";

// Wizard Persistence
export { useWizardPersistence } from "./useWizardPersistence";

// Wizard Completion
export { useWizardCompletion } from "./useWizardCompletion";

// Storage-Enhanced Hooks
export { useWizardPersistenceWithStorage } from "./useWizardPersistenceWithStorage";
export { useQuizWizardWithStorage } from "./useQuizWizardWithStorage";
