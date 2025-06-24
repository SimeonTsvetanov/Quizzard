/**
 * Quiz Management Hook (Refactored)
 *
 * REFACTORED: This hook now composes smaller, focused hooks following
 * the Single Responsibility Principle. The original monolithic 648-line
 * hook has been split into:
 * - useQuizCRUD: CRUD operations and state management
 * - useQuizValidation: Quiz validation logic
 * - useQuizExport: Google Slides and JSON export functionality
 *
 * This hook maintains backward compatibility while providing a cleaner,
 * more maintainable architecture.
 *
 * @fileoverview Refactored quiz management hook using composition
 * @version 2.0.0 (Refactored)
 * @since December 2025
 */

import { useCallback } from "react";
import type { UseQuizManagementReturn, ExportSettings } from "../types";
import { useQuizCRUD } from "./useQuizCRUD";
import { useQuizValidation } from "./useQuizValidation";
import { useQuizExport } from "../../exporting/hooks/useQuizExport";

/**
 * Quiz Management Hook (Refactored)
 *
 * This hook composes the smaller, focused hooks to provide a unified
 * interface for quiz management. It maintains backward compatibility
 * with the original API while benefiting from improved maintainability.
 *
 * @returns Quiz management interface with all necessary operations
 */
export const useQuizManagement = (): UseQuizManagementReturn => {
  // Compose focused hooks following Single Responsibility Principle
  const quizCRUD = useQuizCRUD();
  const { validateQuiz } = useQuizValidation();
  const quizExport = useQuizExport();

  /**
   * Enhanced quiz export with better error handling
   * Validates quiz before export and uses dedicated export hook
   *
   * @param quizId - Quiz ID to export
   * @param format - Export format ("google-slides" | "json")
   * @param settings - Export settings and preferences
   * @returns Promise that resolves when export is complete
   */
  const exportQuiz = useCallback(
    async (
      quizId: string,
      format: "google-slides" | "json",
      settings: ExportSettings = quizExport.getDefaultSettings()
    ): Promise<void> => {
      const quiz = quizCRUD.getQuizById(quizId);
      if (!quiz) {
        throw new Error("Quiz not found for export");
      }

      // Validate quiz before export
      const validation = validateQuiz(quiz);
      if (!validation.isValid) {
        throw new Error(
          `Cannot export invalid quiz: ${validation.errors.join(", ")}`
        );
      }

      // Use dedicated export hook
      await quizExport.exportQuiz(quiz, format, settings);

      // Update quiz with export metadata
      await quizCRUD.updateQuiz(quiz.id, {
        exportData: {
          lastExported: new Date(),
          format: format,
          settings,
          fileSize: 0, // File size not available for client-side exports
          includePresenterNotes: settings.includePresenterNotes,
        },
      });
    },
    [quizCRUD, validateQuiz, quizExport]
  );

  // Return interface maintaining backward compatibility
  return {
    // State from CRUD hook
    quizzes: quizCRUD.quizzes,
    currentQuiz: quizCRUD.currentQuiz,
    isLoading: quizCRUD.isLoading || quizExport.isExporting,
    error: quizCRUD.error || quizExport.exportError,

    // CRUD operations
    createQuiz: quizCRUD.createQuiz,
    updateQuiz: quizCRUD.updateQuiz,
    deleteQuiz: quizCRUD.deleteQuiz,
    loadQuiz: quizCRUD.loadQuiz,
    clearCurrentQuiz: quizCRUD.clearCurrentQuiz,

    // Export functionality
    exportQuiz,

    // Legacy setters for backward compatibility
    setQuizzes: quizCRUD.setQuizzes,
  };
};
