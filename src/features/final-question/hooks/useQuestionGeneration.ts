/**
 * useQuestionGeneration Hook
 *
 * Custom hook for managing final question generation using Google Gemini API.
 * Handles question generation, online/offline detection, error states, and rate limiting.
 *
 * Responsibilities:
 * - Manage question state
 * - Handle Gemini API integration with rate limiting
 * - Provide online/offline detection
 * - Manage loading states, waiting states, and error handling
 * - Show user-friendly status messages during rate limiting
 */

import { useState, useEffect } from "react";
import type {
  FinalQuestion,
  QuestionGenerationSettings,
  RateLimitInfo,
  SessionQuestion,
} from "../types";
import {
  generateQuestionWithGemini,
  isGeminiAvailable,
  getRateLimitStatus,
} from "../services/geminiServiceNew";

/**
 * Return type interface for the useQuestionGeneration hook
 *
 * Provides all state values and control functions needed by components
 * to manage question generation and display.
 */
interface QuestionGenerationHook {
  /** Currently generated question (null if none generated) */
  question: FinalQuestion | null;
  /** Whether a question is being generated */
  isLoading: boolean;
  /** Whether waiting due to rate limiting */
  isWaiting: boolean;
  /** Current status message for user feedback */
  statusMessage: string;
  /** Current error message (null if no error) */
  error: string | null;
  /** Whether the device is online and can reach AI service */
  isOnline: boolean;
  /** Whether the question modal is currently open */
  isModalOpen: boolean;
  /** Current rate limiting information from AI service */
  rateLimitInfo: RateLimitInfo;
  /** Number of questions generated in current session */
  sessionQuestionCount: number;
  /** Function to control modal visibility */
  setIsModalOpen: (isOpen: boolean) => void;
  /** Function to generate a new question */
  generateNewQuestion: () => Promise<void>;
  /** Function to refresh the current question */
  refreshQuestion: () => Promise<void>;
  /** Current question generation settings */
  settings: QuestionGenerationSettings;
  /** Function to update generation settings */
  updateSettings: (newSettings: Partial<QuestionGenerationSettings>) => void;
  /** Function to clear all settings */
  clearSettings: () => void;
}

/**
 * useQuestionGeneration Hook
 *
 * Manages the state and logic for generating final questions using Gemini AI.
 * Includes intelligent rate limiting and user feedback.
 *
 * @returns Object containing question state and control functions
 */
export const useQuestionGeneration = (): QuestionGenerationHook => {
  const [question, setQuestion] = useState<FinalQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState({
    requestsRemaining: 15,
    timeUntilReset: 0,
    isNearLimit: false,
  });
  // User settings for question generation
  const [settings, setSettings] = useState<QuestionGenerationSettings>({
    difficulty: "",
    language: "",
    category: "",
  });

  // Session-based question history to prevent duplicates (max 20 questions)
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>(
    []
  );

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update rate limit info periodically
  useEffect(() => {
    const updateRateLimitInfo = () => {
      setRateLimitInfo(getRateLimitStatus());
    };

    updateRateLimitInfo();
    const interval = setInterval(updateRateLimitInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  // Clear session history when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      // Clear session history when modal is closed to free memory
      setSessionQuestions([]);
    }
  }, [isModalOpen]);

  /**
   * Status update callback for the Gemini API service
   * Handles real-time feedback during question generation including countdown timers
   */
  const handleStatusUpdate = (message: string, waiting: boolean) => {
    setStatusMessage(message);
    setIsWaiting(waiting);
    if (!waiting) {
      setIsLoading(true);
    }
  };

  /**
   * Generates a new question using the Gemini AI service
   * Validates prerequisites and handles the complete generation flow
   */
  const generateNewQuestion = async () => {
    if (!isOnline) {
      setError("Internet connection required to generate questions");
      return;
    }

    const geminiAvailable = isGeminiAvailable();
    if (!geminiAvailable) {
      setError("AI service is not available. Please check your connection.");
      return;
    }

    setIsLoading(true);
    setIsWaiting(false);
    setError(null);
    setStatusMessage("Preparing to generate question...");

    try {
      // Prepare parameters for Gemini API with session history
      const params = {
        difficulty: settings.difficulty || "medium",
        language: settings.language || "English",
        category: settings.category || "random",
        previousQuestions: sessionQuestions, // Pass session history to avoid duplicates
      };

      const newQuestion = await generateQuestionWithGemini(
        params,
        handleStatusUpdate
      );
      setQuestion(newQuestion);
      setStatusMessage("Question generated successfully!");

      // Add to session history (keep max 20 questions)
      setSessionQuestions((prev) => {
        const updated = [
          ...prev,
          { question: newQuestion.question, answer: newQuestion.answer },
        ];
        return updated.slice(-20); // Keep only last 20 questions
      });

      // Clear status message after a short delay
      setTimeout(() => {
        setStatusMessage("");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate question";
      setError(errorMessage);
      setStatusMessage("");
      console.error("Question generation error:", err);
    } finally {
      setIsLoading(false);
      setIsWaiting(false);
    }
  };

  /**
   * Refreshes the current question with a new one
   * Uses existing question settings or generates a new one if none exists
   */
  const refreshQuestion = async () => {
    if (!question) {
      await generateNewQuestion();
      return;
    }

    if (!isOnline) {
      setError("Internet connection required to refresh questions");
      return;
    }

    setIsLoading(true);
    setIsWaiting(false);
    setError(null);
    setStatusMessage("Refreshing question...");

    try {
      // Use the same settings as the current question with session history
      const params = {
        difficulty: settings.difficulty || question.difficulty || "medium",
        language: settings.language || "English",
        category: settings.category || question.category || "random",
        previousQuestions: sessionQuestions, // Pass session history to avoid duplicates
      };

      const newQuestion = await generateQuestionWithGemini(
        params,
        handleStatusUpdate
      );
      setQuestion(newQuestion);
      setStatusMessage("Question refreshed successfully!");

      // Add to session history (keep max 20 questions)
      setSessionQuestions((prev) => {
        const updated = [
          ...prev,
          { question: newQuestion.question, answer: newQuestion.answer },
        ];
        return updated.slice(-20); // Keep only last 20 questions
      });

      // Clear status message after a short delay
      setTimeout(() => {
        setStatusMessage("");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh question";
      setError(errorMessage);
      setStatusMessage("");
      console.error("Question refresh error:", err);
    } finally {
      setIsLoading(false);
      setIsWaiting(false);
    }
  };

  /**
   * Updates question generation settings with new values
   * Merges new settings with existing ones and clears any previous errors
   */
  const updateSettings = (newSettings: Partial<QuestionGenerationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    // Clear any previous errors when settings change
    setError(null);
  };

  /**
   * Clears all question generation settings and resets state
   * Also clears session history, errors, and status messages
   */
  const clearSettings = () => {
    setSettings({
      difficulty: "",
      language: "",
      category: "",
    });
    setError(null);
    setStatusMessage("");
    // Clear session history when settings are cleared
    setSessionQuestions([]);
  };

  return {
    question,
    isLoading,
    isWaiting,
    statusMessage,
    error,
    isOnline,
    isModalOpen,
    rateLimitInfo,
    sessionQuestionCount: sessionQuestions.length,
    setIsModalOpen,
    generateNewQuestion,
    refreshQuestion,
    settings,
    updateSettings,
    clearSettings,
  };
};
