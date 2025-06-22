/**
 * Wizard Persistence Hook
 *
 * Focused hook for managing quiz draft persistence and localStorage integration.
 * Handles automatic saving, data loading, and draft lifecycle management
 * during the quiz creation process.
 *
 * Extracted from useQuizWizard.ts to follow Single Responsibility Principle.
 * Manages only data persistence concerns, leaving validation and navigation to other hooks.
 *
 * Features:
 * - Automatic draft persistence with debouncing
 * - Deep merge support for nested quiz data
 * - Draft initialization from existing quiz data
 * - Draft cleanup and reset functionality
 * - iOS-compatible localStorage operations
 *
 * @fileoverview Persistence hook for quiz creation wizard
 * @version 1.0.0
 * @since December 2025
 */

import { useCallback, useEffect, useState } from "react";
import type { Quiz, QuizSettings } from "../types";
import { useLocalStoragePersistence } from "../../../../shared/hooks/useLocalStoragePersistence";

/**
 * Storage key for wizard draft data
 */
const WIZARD_DRAFT_KEY = "quizzard-quiz-wizard-draft";

/**
 * Default quiz settings for new quizzes
 */
const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  defaultTimeLimit: 30,
};

/**
 * Default draft quiz data structure
 */
const DEFAULT_DRAFT_QUIZ: Partial<Quiz> = {
  title: "",
  description: "",
  category: "general",
  difficulty: "medium",
  rounds: [],
  estimatedDuration: 10,
  settings: DEFAULT_QUIZ_SETTINGS,
};

/**
 * Persistence state interface
 */
export interface PersistenceState {
  /** Current draft quiz data */
  draftQuiz: Partial<Quiz>;
  /** Whether persistence has been initialized */
  isInitialized: boolean;
}

/**
 * Persistence actions interface
 */
export interface PersistenceActions {
  /** Update draft with new data (deep merge) */
  updateDraft: (updates: Partial<Quiz>) => void;
  /** Explicitly save current draft */
  saveDraft: () => Promise<void>;
  /** Clear all draft data */
  clearDraft: () => void;
  /** Reset draft to defaults */
  resetDraft: () => void;
  /** Initialize draft from existing quiz */
  initializeFromQuiz: (quiz: Partial<Quiz>) => void;
}

/**
 * Hook return interface
 */
export interface UseWizardPersistenceReturn {
  /** Persistence state */
  persistence: PersistenceState;
  /** Persistence actions */
  actions: PersistenceActions;
}

/**
 * Wizard Persistence Hook
 *
 * Manages the persistence of quiz draft data throughout the creation process.
 * Provides automatic saving with debouncing to prevent excessive localStorage
 * operations while ensuring data is never lost.
 *
 * @param initialQuiz - Optional initial quiz data to populate draft
 * @returns Persistence state and control functions
 */
export const useWizardPersistence = (
  initialQuiz?: Partial<Quiz>
): UseWizardPersistenceReturn => {
  // Track if we've initialized from initialQuiz
  const [initialized, setInitialized] = useState(false);

  // Draft quiz data with localStorage persistence
  const {
    value: draftQuiz,
    setValue: setDraftQuiz,
    clearValue: clearDraftValue,
  } = useLocalStoragePersistence<Partial<Quiz>>(
    WIZARD_DRAFT_KEY,
    DEFAULT_DRAFT_QUIZ,
    {
      debounceMs: 1000, // 1 second debounce for draft saving
      iosCompatMode: true,
    }
  );

  /**
   * Initialize draft from provided quiz data
   * Only runs once on mount to avoid overwriting user changes
   */
  useEffect(() => {
    if (!initialized) {
      if (initialQuiz) {
        // Initialize from provided quiz data
        setDraftQuiz({ ...initialQuiz });
      } else {
        // Start with fresh draft
        clearDraftValue();
      }
      setInitialized(true);
    }
    // Only run on mount or when initialization changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, initialQuiz]);

  /**
   * Updates draft quiz data with new information
   * Automatically persists to localStorage with debouncing
   * Deeply merges updates to avoid overwriting nested fields
   *
   * @param updates - Partial quiz data to merge
   */
  const updateDraft = useCallback(
    (updates: Partial<Quiz>) => {
      setDraftQuiz((prev) => {
        // Deep merge for nested objects (e.g., settings)
        const merged = {
          ...prev,
          ...updates,
          settings: {
            ...(prev.settings || DEFAULT_QUIZ_SETTINGS),
            ...(updates.settings || {}),
          },
          // Handle rounds array merging carefully
          rounds: updates.rounds !== undefined ? updates.rounds : prev.rounds,
        };

        // Debug log for development troubleshooting
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[WizardPersistence] updateDraft:", {
            updates,
            previous: prev,
            merged,
          });
        }

        return merged;
      });
    },
    [setDraftQuiz]
  );

  /**
   * Saves current draft to localStorage
   * Useful for explicit save operations or manual triggers
   * Auto-save is handled by useLocalStoragePersistence
   */
  const saveDraft = useCallback(async (): Promise<void> => {
    // Auto-save is handled by useLocalStoragePersistence hook
    // This method exists for explicit save triggers if needed in the future
    return Promise.resolve();
  }, []);

  /**
   * Clears all draft data from localStorage
   * Used when canceling wizard or after successful completion
   */
  const clearDraft = useCallback(() => {
    clearDraftValue();
  }, [clearDraftValue]);

  /**
   * Resets draft to default values
   * Useful for starting a new quiz from scratch
   */
  const resetDraft = useCallback(() => {
    setDraftQuiz(DEFAULT_DRAFT_QUIZ);
  }, [setDraftQuiz]);

  /**
   * Initializes draft from existing quiz data
   * Useful for editing existing quizzes or duplicating
   *
   * @param quiz - Quiz data to initialize from
   */
  const initializeFromQuiz = useCallback(
    (quiz: Partial<Quiz>) => {
      const initData = {
        ...DEFAULT_DRAFT_QUIZ,
        ...quiz,
        settings: {
          ...DEFAULT_QUIZ_SETTINGS,
          ...(quiz.settings || {}),
        },
      };

      setDraftQuiz(initData);

      // Debug log for development
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[WizardPersistence] initializeFromQuiz:", {
          input: quiz,
          initialized: initData,
        });
      }
    },
    [setDraftQuiz]
  );

  // Build persistence state
  const persistence: PersistenceState = {
    draftQuiz,
    isInitialized: initialized,
  };

  // Build persistence actions
  const actions: PersistenceActions = {
    updateDraft,
    saveDraft,
    clearDraft,
    resetDraft,
    initializeFromQuiz,
  };

  return {
    persistence,
    actions,
  };
};

/**
 * Persistence constants for external use
 */
export const PERSISTENCE_CONSTANTS = {
  DRAFT_KEY: WIZARD_DRAFT_KEY,
  DEFAULT_SETTINGS: DEFAULT_QUIZ_SETTINGS,
  DEBOUNCE_MS: 1000,
} as const;
