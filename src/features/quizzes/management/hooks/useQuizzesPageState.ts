/**
 * Quizzes Page State Management Hook
 *
 * Manages all UI state for the Quizzes page including modals, menus,
 * and confirmation dialogs. Extracted from the monolithic Quizzes.tsx
 * to improve maintainability and follow Single Responsibility Principle.
 *
 * Features:
 * - Error state management
 * - Modal and wizard state
 * - Menu state and selected quiz
 * - Delete confirmation state
 * - Event handlers for all actions
 *
 * @fileoverview State management hook for Quizzes page
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import { useQuizManagement } from "./useQuizManagement";
import { useSnackbar } from "../../../../shared/hooks/useSnackbar";
import type { Quiz } from "../types";

/**
 * State interface for Quizzes page
 */
export interface QuizzesPageState {
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
}

/**
 * Action handlers interface for Quizzes page
 */
export interface QuizzesPageActions {
  // Error handling
  dismissError: () => void;

  // Quiz creation and editing
  handleCreateQuiz: () => void;
  handleEditQuiz: (quiz: Quiz) => void;
  handleQuizCreated: (quiz: Quiz) => void;
  handleWizardCancel: () => void;

  // Quiz actions
  handleExportQuiz: (quiz: Quiz) => void;

  // Menu actions
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, quiz: Quiz) => void;
  handleMenuClose: () => void;

  // Delete actions
  handleRequestDeleteQuiz: (quiz: Quiz) => void;
  handleConfirmDeleteQuiz: () => void;
  handleCancelDeleteQuiz: () => void;
}

/**
 * Return type for the useQuizzesPageState hook
 */
export interface UseQuizzesPageStateReturn {
  // Quiz management state and actions
  quizzes: Quiz[];
  isLoading: boolean;
  error: string | null;

  // UI state
  state: QuizzesPageState;

  // Action handlers
  actions: QuizzesPageActions;
}

/**
 * Quizzes Page State Hook
 *
 * Manages all state and event handlers for the Quizzes page,
 * providing a clean separation between UI logic and business logic.
 *
 * @returns Object containing state, actions, and quiz management functionality
 */
export const useQuizzesPageState = (): UseQuizzesPageStateReturn => {
  const {
    quizzes,
    isLoading,
    error,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    loadQuiz,
    exportToPowerPoint,
    setQuizzes,
  } = useQuizManagement();

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
  const [pendingDeleteQuiz, setPendingDeleteQuiz] = React.useState<Quiz | null>(
    null
  );

  // Reset dismissed state when error changes
  React.useEffect(() => {
    if (error) {
      setErrorDismissed(false);
    }
  }, [error]);

  /**
   * Handles dismissing error messages
   */
  const dismissError = React.useCallback(() => {
    setErrorDismissed(true);
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
   * Handles quiz creation completion
   */
  const handleQuizCreated = React.useCallback(
    async (quiz: Quiz) => {
      try {
        if (editingQuiz) {
          await updateQuiz(editingQuiz.id, quiz);
          showSnackbar("Quiz updated successfully!", "success");
        } else {
          await createQuiz(quiz);
          showSnackbar("Quiz created successfully!", "success");
        }
        setIsWizardOpen(false);
        setEditingQuiz(null);
        // Force a refresh of the quizzes list
        const updatedQuizzes = await loadQuiz(quiz.id);
        if (updatedQuizzes) {
          setQuizzes((prev: Quiz[]) => [...prev, updatedQuizzes]);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save quiz";
        showSnackbar(message, "error");
      }
    },
    [editingQuiz, updateQuiz, createQuiz, showSnackbar, loadQuiz, setQuizzes]
  );

  /**
   * Handles wizard cancellation
   */
  const handleWizardCancel = React.useCallback(() => {
    setIsWizardOpen(false);
    setEditingQuiz(null);
  }, []);

  /**
   * Handles PowerPoint export
   */
  const handleExportQuiz = React.useCallback(
    async (quiz: Quiz) => {
      try {
        const defaultExportSettings = {
          includePresenterNotes: true,
          slideTemplate: "standard" as const,
          questionFontSize: 20,
          optionFontSize: 16,
          includeMetadata: true,
          includeAnswerKey: true,
          compressImages: true,
          imageQuality: 80,
        };
        await exportToPowerPoint(quiz.id, defaultExportSettings);
        showSnackbar("Quiz exported to PowerPoint successfully!", "success");
        setMenuAnchorEl(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to export quiz";
        showSnackbar(message, "error");
      }
    },
    [exportToPowerPoint, showSnackbar]
  );

  /**
   * Handles quiz menu actions
   */
  const handleMenuOpen = React.useCallback(
    (event: React.MouseEvent<HTMLElement>, quiz: Quiz) => {
      setSelectedQuiz(quiz);
      setMenuAnchorEl(event.currentTarget);
    },
    []
  );

  const handleMenuClose = React.useCallback(() => {
    setMenuAnchorEl(null);
    setSelectedQuiz(null);
  }, []);

  /**
   * Handles quiz deletion request
   */
  const handleRequestDeleteQuiz = React.useCallback((quiz: Quiz) => {
    setPendingDeleteQuiz(quiz);
    setDeleteConfirmOpen(true);
    setMenuAnchorEl(null);
  }, []);

  /**
   * Handles quiz deletion confirmation
   */
  const handleConfirmDeleteQuiz = React.useCallback(async () => {
    if (pendingDeleteQuiz) {
      try {
        await deleteQuiz(pendingDeleteQuiz.id);
        showSnackbar("Quiz deleted successfully", "success");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete quiz";
        showSnackbar(message, "error");
      }
      setPendingDeleteQuiz(null);
      setDeleteConfirmOpen(false);
    }
  }, [pendingDeleteQuiz, deleteQuiz, showSnackbar]);

  /**
   * Handles quiz deletion cancellation
   */
  const handleCancelDeleteQuiz = React.useCallback(() => {
    setPendingDeleteQuiz(null);
    setDeleteConfirmOpen(false);
  }, []);

  // Compose state object
  const state: QuizzesPageState = {
    errorDismissed,
    isWizardOpen,
    editingQuiz,
    menuAnchorEl,
    selectedQuiz,
    deleteConfirmOpen,
    pendingDeleteQuiz,
  };

  // Compose actions object
  const actions: QuizzesPageActions = {
    dismissError,
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
  };

  return {
    quizzes,
    isLoading,
    error,
    state,
    actions,
  };
};
