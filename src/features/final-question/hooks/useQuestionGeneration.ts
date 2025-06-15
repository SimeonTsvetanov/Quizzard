/**
 * useQuestionGeneration Hook
 *
 * Custom hook for managing final question generation state and logic.
 * Handles question generation, refresh, and validation.
 *
 * Responsibilities:
 * - Manage question state
 * - Handle generation and refresh logic
 * - Provide validation and error handling
 * - Manage loading states
 */

import { useState, useCallback } from "react";
import type { Question, QuestionCategory } from "../types";
import { QuestionGenerator } from "../utils/questionGenerator";

interface QuestionSettings {
  difficulty?: "easy" | "medium" | "hard";
  category?: QuestionCategory;
  language?: string;
}

interface GenerationState {
  isGenerating: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface UseQuestionGenerationProps {
  initialDifficulty?: "easy" | "medium" | "hard";
  initialCategory?: string;
}

interface QuestionGenerationHook {
  question: Question | null;
  generationState: GenerationState;
  modalOpen: boolean;
  setQuestion: (question: Question | null) => void;
  generateQuestion: (
    difficulty?: "easy" | "medium" | "hard",
    category?: string
  ) => Promise<void>;
  refreshQuestion: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  settings: QuestionSettings;
  updateSettings: (newSettings: Partial<QuestionSettings>) => void;
  clearSettings: () => void;
}

/**
 * useQuestionGeneration Hook
 *
 * Manages the state and logic for generating and refreshing final questions.
 *
 * @returns Object containing question state and control functions
 */
export const useQuestionGeneration = (
  props?: UseQuestionGenerationProps
): QuestionGenerationHook => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    isRefreshing: false,
    error: null,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [settings, setSettings] = useState<QuestionSettings>({});

  /**
   * Generate a new question
   *
   * @param difficulty - Optional difficulty level
   * @param category - Optional category
   */
  const generateQuestion = useCallback(
    async (difficulty?: "easy" | "medium" | "hard", category?: string) => {
      try {
        setGenerationState((prev) => ({
          ...prev,
          isGenerating: true,
          error: null,
        }));

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newQuestion = QuestionGenerator.getRandomQuestion(
          category || props?.initialCategory,
          difficulty || props?.initialDifficulty
        );

        setQuestion(newQuestion);
        setModalOpen(true);
      } catch (error) {
        setGenerationState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate question",
        }));
      } finally {
        setGenerationState((prev) => ({ ...prev, isGenerating: false }));
      }
    },
    [props]
  );

  /**
   * Refresh the current question
   */
  const refreshQuestion = useCallback(async () => {
    if (!question) return;

    try {
      setGenerationState((prev) => ({
        ...prev,
        isRefreshing: true,
        error: null,
      }));

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newQuestion = QuestionGenerator.getRandomQuestion(
        question.category,
        question.difficulty
      );

      setQuestion(newQuestion);
    } catch (error) {
      setGenerationState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to refresh question",
      }));
    } finally {
      setGenerationState((prev) => ({ ...prev, isRefreshing: false }));
    }
  }, [question]);

  /**
   * Open the question modal
   */
  const openModal = () => {
    setModalOpen(true);
  };

  /**
   * Close the question modal
   */
  const closeModal = () => {
    setModalOpen(false);
  };

  /**
   * Update question settings
   */
  const updateSettings = useCallback(
    (newSettings: Partial<QuestionSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    []
  );

  /**
   * Clear all settings
   */
  const clearSettings = useCallback(() => {
    setSettings({});
  }, []);

  return {
    question,
    generationState,
    modalOpen,
    setQuestion,
    generateQuestion,
    refreshQuestion,
    openModal,
    closeModal,
    settings,
    updateSettings,
    clearSettings,
  };
};
