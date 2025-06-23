/**
 * Quizzes Page State Management Hook with IndexedDB Storage
 *
 * Enhanced version of useQuizzesPageState that integrates IndexedDB storage
 * with auto-save functionality and storage usage monitoring.
 *
 * Features:
 * - IndexedDB storage with localStorage fallback
 * - Auto-save for draft quizzes
 * - Storage usage monitoring and warnings
 * - Enhanced error handling
 * - All original UI state management
 *
 * @fileoverview Enhanced state management hook with IndexedDB storage
 * @version 3.0.0
 * @since December 2025
 */

import React from "react";
import { useQuizStorage } from "./useQuizStorage";
import { useSnackbar } from "../../../../shared/hooks/useSnackbar";
import { indexedDBService } from "../services/indexedDBService";
import type { Quiz } from "../types";
import type { AutoSaveStatus } from "./useQuizStorage";

/**
 * Enhanced state interface for Quizzes page with storage
 */
export interface QuizzesPageStateWithStorage {
  // Error handling
  errorDismissed: boolean;

  // Wizard state
  isWizardOpen: boolean;
  editingQuiz: Quiz | null;

  // Menu state
  menuAnchorEl: HTMLElement | null;
  selectedQuiz: Quiz | null;

  // Delete confirmation state
  deleteConfirmOpen: boolean;
  pendingDeleteQuiz: Quiz | null;

  // Storage state
  autoSaveStatus: AutoSaveStatus;
  storageWarningDismissed: boolean;
}

/**
 * Enhanced action handlers interface for Quizzes page with storage
 */
export interface QuizzesPageActionsWithStorage {
  // Error handling
  dismissError: () => void;
  dismissStorageWarning: () => void;

  // Quiz creation and editing
  handleCreateQuiz: () => void;
  handleEditQuiz: (quiz: Quiz) => void;
  handleQuizCreated: (quiz: Quiz) => void;
  handleWizardCancel: () => void;

  // Quiz actions
  handleExportQuiz: (quiz: Quiz, format: "slides" | "json") => void;

  // Menu actions
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, quiz: Quiz) => void;
  handleMenuClose: () => void;

  // Delete actions
  handleRequestDeleteQuiz: (quiz: Quiz) => void;
  handleConfirmDeleteQuiz: () => void;
  handleCancelDeleteQuiz: () => void;

  // Storage actions
  handleCleanupDrafts: () => void;
  handleRefreshStorage: () => void;
}

/**
 * Return type for the useQuizzesPageStateWithStorage hook
 */
export interface UseQuizzesPageStateWithStorageReturn {
  // Quiz management state and actions from storage
  quizzes: Quiz[];
  drafts: Partial<Quiz>[];
  isLoading: boolean;
  error: string | null;
  storageUsage: any; // StorageUsage type from storage hook
  isInitialized: boolean;

  // UI state
  state: QuizzesPageStateWithStorage;

  // Action handlers
  actions: QuizzesPageActionsWithStorage;
}

/**
 * Enhanced Quizzes Page State Hook with IndexedDB Storage
 *
 * Manages all state and event handlers for the Quizzes page with
 * enhanced storage capabilities using IndexedDB and auto-save.
 *
 * @returns Object containing enhanced state, actions, and storage functionality
 */
export const useQuizzesPageStateWithStorage =
  (): UseQuizzesPageStateWithStorageReturn => {
    // Storage hook for IndexedDB operations
    const {
      quizzes,
      drafts,
      isLoading,
      storageUsage,
      autoSaveStatus,
      isInitialized,
      saveQuiz,
      deleteQuiz,
      enableAutoSave,
      disableAutoSave,
      cleanupOldDrafts,
      refreshStorageUsage,
      loadQuizzes,
      loadDrafts,
    } = useQuizStorage();

    // Export functionality removed - all exports coming soon

    const { showSnackbar } = useSnackbar();

    // UI state management
    const [errorDismissed, setErrorDismissed] = React.useState<boolean>(false);
    const [isWizardOpen, setIsWizardOpen] = React.useState<boolean>(false);
    const [editingQuiz, setEditingQuiz] = React.useState<Quiz | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = React.useState<HTMLElement | null>(
      null
    );
    const [selectedQuiz, setSelectedQuiz] = React.useState<Quiz | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [pendingDeleteQuiz, setPendingDeleteQuiz] =
      React.useState<Quiz | null>(null);

    const [storageWarningDismissed, setStorageWarningDismissed] =
      React.useState(false);

    // Error state (can come from storage operations)
    const [localError, setLocalError] = React.useState<string | null>(null);

    // Reset dismissed state when error changes
    React.useEffect(() => {
      if (localError) {
        setErrorDismissed(false);
      }
    }, [localError]);

    // Reset storage warning when storage usage changes
    React.useEffect(() => {
      if (storageUsage?.isNearLimit) {
        setStorageWarningDismissed(false);
      }
    }, [storageUsage?.isNearLimit]);

    /**
     * Handles dismissing error messages
     */
    const dismissError = React.useCallback(() => {
      setErrorDismissed(true);
      setLocalError(null);
    }, []);

    /**
     * Handles dismissing storage warning
     */
    const dismissStorageWarning = React.useCallback(() => {
      setStorageWarningDismissed(true);
    }, []);

    /**
     * Handles opening the quiz creation wizard
     */
    const handleCreateQuiz = React.useCallback(() => {
      setEditingQuiz(null);
      setIsWizardOpen(true);
    }, []);

    /**
     * Handles editing an existing quiz
     */
    const handleEditQuiz = React.useCallback((quiz: Quiz) => {
      setEditingQuiz(quiz);
      setIsWizardOpen(true);
      setMenuAnchorEl(null);
    }, []);

    /**
     * Handles quiz creation completion with IndexedDB storage
     */
    const handleQuizCreated = React.useCallback(
      async (quiz: Quiz) => {
        try {
          // Set status to completed before saving
          const completedQuiz: Quiz = {
            ...quiz,
            status: "completed",
            updatedAt: new Date(),
          };

          const success = await saveQuiz(completedQuiz);

          if (success) {
            if (editingQuiz) {
              showSnackbar("Quiz updated successfully!", "success");
            } else {
              showSnackbar("Quiz created successfully!", "success");
            }

            setIsWizardOpen(false);
            setEditingQuiz(null);

            // Disable auto-save since quiz is now completed
            disableAutoSave();

            // Refresh storage usage
            await refreshStorageUsage();
          } else {
            throw new Error("Failed to save quiz to storage");
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to save quiz";
          setLocalError(message);
          showSnackbar(message, "error");
        }
      },
      [
        editingQuiz,
        saveQuiz,
        showSnackbar,
        disableAutoSave,
        refreshStorageUsage,
      ]
    );

    /**
     * Handles wizard cancellation
     */
    const handleWizardCancel = React.useCallback(() => {
      setIsWizardOpen(false);
      setEditingQuiz(null);
      disableAutoSave();
    }, [disableAutoSave]);

    /**
     * Handles export requests (coming soon)
     */
    const handleExportQuiz = React.useCallback(
      async (quiz: Quiz, format: "slides" | "json") => {
        try {
          // All export formats are currently disabled - coming soon
          const formatNames = {
            slides: "Google Slides",
            json: "JSON",
          };

          showSnackbar(`${formatNames[format]} export coming soon!`, "info");
          setMenuAnchorEl(null);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Export failed";
          setLocalError(message);
          showSnackbar(message, "error");
        }
      },
      [showSnackbar]
    );

    /**
     * Handles opening context menu for quiz actions
     */
    const handleMenuOpen = React.useCallback(
      (event: React.MouseEvent<HTMLElement>, quiz: Quiz) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedQuiz(quiz);
      },
      []
    );

    /**
     * Handles closing context menu
     */
    const handleMenuClose = React.useCallback(() => {
      setMenuAnchorEl(null);
      setSelectedQuiz(null);
    }, []);

    /**
     * Handles requesting quiz deletion
     */
    const handleRequestDeleteQuiz = React.useCallback((quiz: Quiz) => {
      setPendingDeleteQuiz(quiz);
      setDeleteConfirmOpen(true);
      setMenuAnchorEl(null);
    }, []);

    /**
     * Handles confirming quiz deletion with enhanced sync
     */
    const handleConfirmDeleteQuiz = React.useCallback(async () => {
      if (!pendingDeleteQuiz) return;

      try {
        const success = await deleteQuiz(pendingDeleteQuiz.id);

        if (success) {
          // Force reload all data to ensure synchronization
          await Promise.all([
            loadQuizzes(),
            loadDrafts(),
            refreshStorageUsage(),
          ]);

          showSnackbar("Quiz deleted successfully!", "success");
        }
      } catch (error) {
        console.error("Error deleting quiz:", error);
        setLocalError("Failed to delete quiz");
      } finally {
        setDeleteConfirmOpen(false);
        setPendingDeleteQuiz(null);
      }
    }, [
      pendingDeleteQuiz,
      deleteQuiz,
      loadQuizzes,
      loadDrafts,
      refreshStorageUsage,
      showSnackbar,
    ]);

    /**
     * Handles cancelling quiz deletion
     */
    const handleCancelDeleteQuiz = React.useCallback(() => {
      setDeleteConfirmOpen(false);
      setPendingDeleteQuiz(null);
    }, []);

    /**
     * Handles cleanup of all storage (now directly executes - confirmation handled by StorageModal)
     */
    const handleCleanupDrafts = React.useCallback(async () => {
      try {
        // Use clearAllStorage to remove everything instead of just old drafts
        const result = await indexedDBService.clearAllStorage();

        if (result.success) {
          showSnackbar("All storage cleared successfully!", "success");

          // Refresh storage usage and reload quizzes
          await refreshStorageUsage();
          await loadQuizzes(); // This will reload the quiz list
          await loadDrafts(); // This will reload the drafts list
        } else {
          throw new Error(result.error || "Failed to clear storage");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to clear storage";
        setLocalError(message);
        showSnackbar(message, "error");
      }
    }, [showSnackbar, refreshStorageUsage, loadQuizzes, loadDrafts]);

    /**
     * Handles refreshing storage usage
     */
    const handleRefreshStorage = React.useCallback(async () => {
      try {
        await refreshStorageUsage();
        showSnackbar("Storage information refreshed", "info");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to refresh storage";
        setLocalError(message);
        showSnackbar(message, "error");
      }
    }, [refreshStorageUsage, showSnackbar]);

    // Auto-save draft when editing
    React.useEffect(() => {
      if (isWizardOpen && editingQuiz) {
        const draftQuiz = {
          ...editingQuiz,
          status: "draft" as const,
          lastSaved: new Date(),
        };
        enableAutoSave(draftQuiz);
      }

      return () => {
        if (!isWizardOpen) {
          disableAutoSave();
        }
      };
    }, [isWizardOpen, editingQuiz, enableAutoSave, disableAutoSave]);

    return {
      // Storage state
      quizzes,
      drafts,
      isLoading,
      error: localError,
      storageUsage,
      isInitialized,

      // UI state
      state: {
        errorDismissed,
        isWizardOpen,
        editingQuiz,
        menuAnchorEl,
        selectedQuiz,
        deleteConfirmOpen,
        pendingDeleteQuiz,
        autoSaveStatus,
        storageWarningDismissed,
      },

      // Action handlers
      actions: {
        dismissError,
        dismissStorageWarning,
        handleCreateQuiz,
        handleEditQuiz,
        handleQuizCreated,
        handleWizardCancel,
        handleExportQuiz,
        handleMenuOpen,
        handleMenuClose,
        handleRequestDeleteQuiz,
        handleConfirmDeleteQuiz,
        handleCancelDeleteQuiz,
        handleCleanupDrafts,
        handleRefreshStorage,
      },
    };
  };
