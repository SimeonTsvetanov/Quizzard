/**
 * @fileoverview Quiz Export Hook - Google Slides and JSON Export Only
 * @version 1.0.0
 * @description Provides quiz export functionality for Google Slides and JSON formats.
 * PowerPoint export has been removed as per project charter requirements.
 *
 * Supported Export Formats:
 * - Google Slides (planned)
 * - JSON (native browser APIs)
 *
 * @integration Part of Quizzard quiz management system
 * @dependencies React hooks, Quiz types, browser APIs
 */

import { useState, useCallback } from "react";
import type { Quiz } from "../../types";

/**
 * Export format options for quiz export
 */
export type ExportFormat = "google-slides" | "json";

/**
 * Export settings configuration for different formats
 */
export interface ExportSettings {
  /** Include quiz metadata (title, description, etc.) */
  includeMetadata: boolean;
  /** Include presenter notes and explanations */
  includePresenterNotes: boolean;
  /** Include answer key in export */
  includeAnswerKey: boolean;
  /** Font size for questions (Google Slides only) */
  questionFontSize: number;
  /** Font size for answer options (Google Slides only) */
  optionFontSize: number;
}

/**
 * Default export settings
 */
const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  includeMetadata: true,
  includePresenterNotes: true,
  includeAnswerKey: true,
  questionFontSize: 24,
  optionFontSize: 18,
};

/**
 * Validates quiz data before export to ensure all required fields are present
 *
 * @param quiz - Quiz object to validate
 * @returns Error message if validation fails, null if valid
 */
const validateQuizForExport = (quiz: Quiz | null): string | null => {
  if (!quiz) {
    return "No quiz selected for export";
  }

  if (!quiz.title || quiz.title.trim() === "") {
    return "Quiz must have a title before export";
  }

  if (!quiz.rounds || quiz.rounds.length === 0) {
    return "Quiz must have at least one round before export";
  }

  const hasQuestions = quiz.rounds.some(
    (round) => round.questions && round.questions.length > 0
  );
  if (!hasQuestions) {
    return "Quiz must have at least one question before export";
  }

  return null;
};

/**
 * Custom hook for quiz export functionality
 *
 * Provides methods to export quizzes in supported formats:
 * - JSON format (immediate download)
 * - Google Slides (planned - OAuth integration required)
 *
 * @returns Object containing export methods and state
 */
export const useQuizExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  /**
   * Exports quiz as JSON format
   *
   * @param quiz - Quiz to export
   * @param settings - Export settings configuration
   */
  const exportAsJSON = useCallback(
    async (
      quiz: Quiz,
      settings: ExportSettings = DEFAULT_EXPORT_SETTINGS
    ): Promise<void> => {
      try {
        setIsExporting(true);
        setExportProgress(0);
        setExportError(null);

        // Validate quiz data before proceeding
        const validationError = validateQuizForExport(quiz);
        if (validationError) {
          throw new Error(validationError);
        }

        setExportProgress(25);

        // Prepare export data based on settings
        const exportData = {
          format: "json",
          version: "1.0",
          exportedAt: new Date().toISOString(),
          quiz: {
            id: quiz.id,
            title: quiz.title,
            description: settings.includeMetadata
              ? quiz.description
              : undefined,
            category: settings.includeMetadata ? quiz.category : undefined,
            difficulty: settings.includeMetadata ? quiz.difficulty : undefined,
            estimatedDuration: settings.includeMetadata
              ? quiz.estimatedDuration
              : undefined,
            rounds: quiz.rounds.map((round) => ({
              name: round.name,
              description: round.description,
              questions: round.questions.map((question) => ({
                question: question.question,
                type: question.type,
                possibleAnswers: question.possibleAnswers,
                correctAnswers: question.correctAnswers,
                correctAnswerText: question.correctAnswerText,
                points: question.points,
                timeLimit: question.timeLimit,
                explanation: settings.includePresenterNotes
                  ? question.explanation
                  : undefined,
                mediaFile: question.mediaFile,
              })),
            })),
          },
          settings: settings.includeMetadata ? settings : undefined,
        };

        setExportProgress(75);

        // Create and download JSON file
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${quiz.title
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_quiz_export.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        setExportProgress(100);
      } catch (error) {
        console.error("JSON export failed:", error);
        setExportError(
          error instanceof Error ? error.message : "JSON export failed"
        );
      } finally {
        setIsExporting(false);
        // Reset progress after a short delay
        setTimeout(() => setExportProgress(0), 1000);
      }
    },
    []
  );

  /**
   * Exports quiz to Google Slides (planned functionality)
   *
   * @param quiz - Quiz to export
   * @param settings - Export settings configuration
   */
  const exportToGoogleSlides = useCallback(
    async (
      quiz: Quiz,
      settings: ExportSettings = DEFAULT_EXPORT_SETTINGS
    ): Promise<void> => {
      try {
        setIsExporting(true);
        setExportProgress(0);
        setExportError(null);

        // Validate quiz data before proceeding
        const validationError = validateQuizForExport(quiz);
        if (validationError) {
          throw new Error(validationError);
        }

        // Google Slides export is not yet implemented
        throw new Error(
          "Google Slides export is currently under development. Please use JSON export for now."
        );
      } catch (error) {
        console.error("Google Slides export failed:", error);
        setExportError(
          error instanceof Error ? error.message : "Google Slides export failed"
        );
      } finally {
        setIsExporting(false);
        setTimeout(() => setExportProgress(0), 1000);
      }
    },
    []
  );

  /**
   * Main export function that routes to appropriate export method based on format
   *
   * @param quiz - Quiz to export
   * @param format - Export format to use
   * @param settings - Export settings configuration
   */
  const exportQuiz = useCallback(
    async (
      quiz: Quiz,
      format: ExportFormat,
      settings: ExportSettings = DEFAULT_EXPORT_SETTINGS
    ): Promise<void> => {
      switch (format) {
        case "json":
          return exportAsJSON(quiz, settings);
        case "google-slides":
          return exportToGoogleSlides(quiz, settings);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    },
    [exportAsJSON, exportToGoogleSlides]
  );

  /**
   * Clears any existing export error
   */
  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  /**
   * Gets default export settings
   */
  const getDefaultSettings = useCallback((): ExportSettings => {
    return { ...DEFAULT_EXPORT_SETTINGS };
  }, []);

  return {
    // Export methods
    exportQuiz,
    exportAsJSON,
    exportToGoogleSlides,

    // State
    isExporting,
    exportProgress,
    exportError,

    // Utilities
    clearExportError,
    getDefaultSettings,
    validateQuizForExport,
  };
};
