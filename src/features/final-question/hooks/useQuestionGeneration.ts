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

import { useState } from "react";
import type { FinalQuestion } from "../types";
import { QuestionGenerator } from "../utils/questionGenerator";

interface Question {
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  points: number;
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
  question: FinalQuestion | null;
  generationState: GenerationState;
  modalOpen: boolean;
  setQuestion: (question: FinalQuestion | null) => void;
  generateQuestion: (
    difficulty?: "easy" | "medium" | "hard",
    category?: string
  ) => Promise<void>;
  refreshQuestion: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
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
  const [question, setQuestion] = useState<FinalQuestion | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    isRefreshing: false,
    error: null,
  });
  const [modalOpen, setModalOpen] = useState(false);

  /**
   * Generate a new question
   *
   * @param difficulty - Optional difficulty level
   * @param category - Optional category
   */
  const generateQuestion = async (
    difficulty?: "easy" | "medium" | "hard",
    category?: string
  ) => {
    try {
      setGenerationState((prev) => ({
        ...prev,
        isGenerating: true,
        error: null,
      }));

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newQuestion = QuestionGenerator.generateQuestion(
        difficulty || props?.initialDifficulty,
        category || props?.initialCategory
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
  };

  /**
   * Refresh the current question
   */
  const refreshQuestion = async () => {
    if (!question) return;

    try {
      setGenerationState((prev) => ({
        ...prev,
        isRefreshing: true,
        error: null,
      }));

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newQuestion = QuestionGenerator.generateQuestion(
        question.difficulty,
        question.category
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
  };

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

  return {
    question,
    generationState,
    modalOpen,
    setQuestion,
    generateQuestion,
    refreshQuestion,
    openModal,
    closeModal,
  };
};
