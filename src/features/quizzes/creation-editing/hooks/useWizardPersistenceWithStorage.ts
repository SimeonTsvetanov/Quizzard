/**
 * Enhanced Wizard Persistence Hook with IndexedDB Auto-Save
 *
 * Advanced hook for managing quiz draft persistence with IndexedDB integration.
 * Provides automatic saving, draft recovery, and robust storage management
 * during the quiz creation process.
 *
 * Enhanced Features:
 * - IndexedDB-based storage with auto-save every 30 seconds
 * - Automatic draft recovery on wizard reopen
 * - Storage status monitoring and error handling
 * - Fallback to localStorage if IndexedDB unavailable
 * - Real-time save status feedback
 * - Draft cleanup and lifecycle management
 *
 * @fileoverview Enhanced persistence hook with IndexedDB auto-save
 * @version 3.0.0 (IndexedDB Enhanced)
 * @since December 2025
 */

import { useCallback, useEffect, useState, useRef } from "react";
import type { Quiz, QuizSettings } from "../types";
import { useQuizStorage } from "../../management/hooks/useQuizStorage";

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
  status: "draft", // Always draft in wizard
};

/**
 * Enhanced persistence state interface
 */
export interface EnhancedPersistenceState {
  /** Current draft quiz data */
  draftQuiz: Partial<Quiz>;
  /** Whether persistence has been initialized */
  isInitialized: boolean;
  /** Auto-save status */
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  /** Storage error if any */
  storageError: string | null;
  /** Last saved timestamp */
  lastSaved: Date | null;
}

/**
 * Enhanced persistence actions interface
 */
export interface EnhancedPersistenceActions {
  /** Update draft with new data (triggers auto-save) */
  updateDraft: (updates: Partial<Quiz>) => void;
  /** Explicitly save current draft */
  saveDraft: () => Promise<void>;
  /** Clear all draft data */
  clearDraft: () => void;
  /** Reset draft to defaults */
  resetDraft: () => void;
  /** Initialize draft from existing quiz */
  initializeFromQuiz: (quiz: Partial<Quiz>) => void;
  /** Recover existing draft if available */
  recoverDraft: () => Promise<boolean>;
}

/**
 * Enhanced hook return interface
 */
export interface UseWizardPersistenceWithStorageReturn {
  /** Enhanced persistence state */
  persistence: EnhancedPersistenceState;
  /** Enhanced persistence actions */
  actions: EnhancedPersistenceActions;
}

/**
 * Enhanced Wizard Persistence Hook with IndexedDB
 *
 * Provides robust draft persistence with IndexedDB storage, auto-save functionality,
 * and comprehensive error handling. Automatically saves drafts every 30 seconds
 * and provides real-time status feedback.
 *
 * @param initialQuiz - Optional initial quiz data to populate draft
 * @returns Enhanced persistence state and control functions
 */
export const useWizardPersistenceWithStorage = (
  initialQuiz?: Partial<Quiz>
): UseWizardPersistenceWithStorageReturn => {
  // IndexedDB storage hook
  const {
    saveDraft: saveToStorage,
    loadDrafts,
    deleteDraft: deleteDraftFromStorage,
    autoSaveStatus,
    storageError,
    clearError,
  } = useQuizStorage();

  // Local state
  const [draftQuiz, setDraftQuiz] = useState<Partial<Quiz>>(DEFAULT_DRAFT_QUIZ);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draftIdRef = useRef<string | null>(null);

  /**
   * Initialize draft from provided quiz data or recover existing draft
   */
  useEffect(() => {
    if (!isInitialized) {
      const initializeDraft = async () => {
        try {
          if (initialQuiz?.id) {
            // Editing existing quiz - preserve original ID to prevent duplicates
            const editDraft = {
              ...initialQuiz,
              status: "draft" as const,
              // Preserve original ID for editing to avoid duplicates
              id: initialQuiz.id,
            };
            setDraftQuiz(editDraft);
            draftIdRef.current = editDraft.id;
          } else {
            // Creating new quiz - try to recover existing draft
            const drafts = await loadDrafts();
            const existingDraft = drafts.find(
              (d) => d.title === "" || !d.title
            ); // Find empty/new draft

            if (existingDraft) {
              setDraftQuiz(existingDraft);
              draftIdRef.current = existingDraft.id!;
            } else {
              // Create new draft
              const newDraft = {
                ...DEFAULT_DRAFT_QUIZ,
                id: `draft_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                createdAt: new Date(),
              };
              setDraftQuiz(newDraft);
              draftIdRef.current = newDraft.id;
            }
          }
        } catch (error) {
          console.warn(
            "[WizardPersistence] Failed to initialize draft:",
            error
          );
          // Fallback to default draft
          const fallbackDraft = {
            ...DEFAULT_DRAFT_QUIZ,
            id: `draft_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            createdAt: new Date(),
          };
          setDraftQuiz(fallbackDraft);
          draftIdRef.current = fallbackDraft.id;
        } finally {
          setIsInitialized(true);
        }
      };

      initializeDraft();
    }
  }, [isInitialized, initialQuiz, loadDrafts]);

  /**
   * Auto-save functionality - saves draft every 30 seconds after changes
   */
  const scheduleAutoSave = useCallback(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Schedule new save
    autoSaveTimerRef.current = setTimeout(async () => {
      if (draftQuiz.id && (draftQuiz.title || draftQuiz.rounds?.length)) {
        try {
          await saveToStorage(draftQuiz as Quiz);
          setLastSaved(new Date());
        } catch (error) {
          console.error("[WizardPersistence] Auto-save failed:", error);
        }
      }
    }, 30000); // 30 seconds
  }, [draftQuiz, saveToStorage]);

  /**
   * Updates draft quiz data with new information
   * Automatically schedules auto-save after changes
   */
  const updateDraft = useCallback(
    (updates: Partial<Quiz>) => {
      setDraftQuiz((prev) => {
        const merged = {
          ...prev,
          ...updates,
          settings: {
            ...(prev.settings || DEFAULT_QUIZ_SETTINGS),
            ...(updates.settings || {}),
          },
          rounds: updates.rounds !== undefined ? updates.rounds : prev.rounds,
          updatedAt: new Date(),
        };

        // Debug log for development
        if (process.env.NODE_ENV !== "production") {
          console.log("[WizardPersistence] updateDraft:", {
            updates,
            previous: prev,
            merged,
          });
        }

        return merged;
      });

      // Schedule auto-save after update
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  /**
   * Explicitly saves current draft to IndexedDB
   */
  const saveDraft = useCallback(async (): Promise<void> => {
    if (!draftQuiz.id) return;

    try {
      await saveToStorage(draftQuiz as Quiz);
      setLastSaved(new Date());
    } catch (error) {
      console.error("[WizardPersistence] Manual save failed:", error);
      throw error;
    }
  }, [draftQuiz, saveToStorage]);

  /**
   * Clears current draft from storage and resets to defaults
   */
  const clearDraft = useCallback(async () => {
    // Clear auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    // Delete from storage if it exists
    if (draftIdRef.current) {
      try {
        await deleteDraftFromStorage(draftIdRef.current);
      } catch (error) {
        console.warn("[WizardPersistence] Failed to delete draft:", error);
      }
    }

    // Reset local state
    setDraftQuiz(DEFAULT_DRAFT_QUIZ);
    setLastSaved(null);
    draftIdRef.current = null;
    clearError();
  }, [deleteDraftFromStorage, clearError]);

  /**
   * Resets draft to default values without deleting from storage
   */
  const resetDraft = useCallback(() => {
    const newDraft = {
      ...DEFAULT_DRAFT_QUIZ,
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    setDraftQuiz(newDraft);
    draftIdRef.current = newDraft.id;
    setLastSaved(null);
  }, []);

  /**
   * Initialize draft from existing quiz data
   */
  const initializeFromQuiz = useCallback((quiz: Partial<Quiz>) => {
    const editDraft = {
      ...quiz,
      status: "draft" as const,
      id: `draft_${quiz.id || Date.now()}_${Date.now()}`,
      updatedAt: new Date(),
    };
    setDraftQuiz(editDraft);
    draftIdRef.current = editDraft.id;
    setLastSaved(null);
  }, []);

  /**
   * Attempt to recover existing draft
   */
  const recoverDraft = useCallback(async (): Promise<boolean> => {
    try {
      const drafts = await loadDrafts();
      const latestDraft = drafts
        .filter((d) => d.status === "draft")
        .sort(
          (a, b) =>
            new Date(b.updatedAt || 0).getTime() -
            new Date(a.updatedAt || 0).getTime()
        )[0];

      if (latestDraft) {
        setDraftQuiz(latestDraft);
        draftIdRef.current = latestDraft.id!;
        setLastSaved(
          latestDraft.updatedAt ? new Date(latestDraft.updatedAt) : null
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("[WizardPersistence] Draft recovery failed:", error);
      return false;
    }
  }, [loadDrafts]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    persistence: {
      draftQuiz,
      isInitialized,
      autoSaveStatus,
      storageError,
      lastSaved,
    },
    actions: {
      updateDraft,
      saveDraft,
      clearDraft,
      resetDraft,
      initializeFromQuiz,
      recoverDraft,
    },
  };
};
