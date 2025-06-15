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
import { FinalQuestion, QuestionCategory } from "../types";
import { generateQuestion } from "../utils/questionGenerator";

interface QuestionSettings {
  difficulty?: string;
  category?: QuestionCategory;
  language?: string;
}

interface QuestionGenerationHook {
  question: FinalQuestion | null;
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  generateNewQuestion: () => Promise<void>;
  refreshQuestion: () => Promise<void>;
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
export const useQuestionGeneration = (): QuestionGenerationHook => {
  const [question, setQuestion] = useState<FinalQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState<QuestionSettings>({});

  const generateNewQuestion = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newQuestion = await generateQuestion(settings);
      setQuestion(newQuestion);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate question"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshQuestion = async () => {
    if (!question) return;
    setIsLoading(true);
    setError(null);
    try {
      const newQuestion = await generateQuestion(settings);
      setQuestion(newQuestion);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh question"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (newSettings: Partial<QuestionSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const clearSettings = () => {
    setSettings({});
  };

  return {
    question,
    isLoading,
    error,
    isModalOpen,
    setIsModalOpen,
    generateNewQuestion,
    refreshQuestion,
    settings,
    updateSettings,
    clearSettings,
  };
};
