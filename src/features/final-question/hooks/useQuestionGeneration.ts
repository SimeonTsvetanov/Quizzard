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
import type { FinalQuestion, QuestionCategory } from "../types";
import {
  generateQuestionWithGemini,
  isGeminiAvailable,
  getRateLimitStatus,
} from "../services/geminiService";

interface QuestionSettings {
  difficulty?: string;
  category?: QuestionCategory | string;
  language?: string;
}

interface QuestionGenerationHook {
  question: FinalQuestion | null;
  isLoading: boolean;
  isWaiting: boolean;
  statusMessage: string;
  error: string | null;
  isOnline: boolean;
  isModalOpen: boolean;
  rateLimitInfo: {
    requestsRemaining: number;
    timeUntilReset: number;
    isNearLimit: boolean;
  };
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
  const [settings, setSettings] = useState<QuestionSettings>({
    difficulty: "",
    language: "",
    category: "",
  });

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

  // Status update callback for the API service
  const handleStatusUpdate = (message: string, waiting: boolean) => {
    setStatusMessage(message);
    setIsWaiting(waiting);
    if (!waiting) {
      setIsLoading(true);
    }
  };

  const generateNewQuestion = async () => {
    console.log("🎯 Generate new question called");

    if (!isOnline) {
      console.log("❌ Not online");
      setError("Internet connection required to generate questions");
      return;
    }

    const geminiAvailable = isGeminiAvailable();
    console.log("🔍 Gemini available:", geminiAvailable);

    if (!geminiAvailable) {
      setError("AI service is not available. Please check your connection.");
      return;
    }

    setIsLoading(true);
    setIsWaiting(false);
    setError(null);
    setStatusMessage("Preparing to generate question...");

    try {
      // Prepare parameters for Gemini API
      const params = {
        difficulty: settings.difficulty || "medium",
        language: settings.language || "English",
        category: settings.category || "random",
      };

      const newQuestion = await generateQuestionWithGemini(
        params,
        handleStatusUpdate
      );
      console.log("✅ Generated question:", newQuestion);
      setQuestion(newQuestion);
      setStatusMessage("Question generated successfully!");

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
      // Use the same settings as the current question
      const params = {
        difficulty: settings.difficulty || question.difficulty || "medium",
        language: settings.language || "English",
        category: settings.category || question.category || "random",
      };

      const newQuestion = await generateQuestionWithGemini(
        params,
        handleStatusUpdate
      );
      setQuestion(newQuestion);
      setStatusMessage("Question refreshed successfully!");

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

  const updateSettings = (newSettings: Partial<QuestionSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    // Clear any previous errors when settings change
    setError(null);
  };

  const clearSettings = () => {
    setSettings({
      difficulty: "",
      language: "",
      category: "",
    });
    setError(null);
    setStatusMessage("");
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
    setIsModalOpen,
    generateNewQuestion,
    refreshQuestion,
    settings,
    updateSettings,
    clearSettings,
  };
};
