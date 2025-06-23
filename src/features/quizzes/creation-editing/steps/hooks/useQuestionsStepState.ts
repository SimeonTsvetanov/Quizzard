/**
 * Questions Step State Management Hook
 *
 * Custom hook that manages all the complex state for the QuestionsStep component.
 * Extracted from the monolithic component to reduce useState complexity and
 * improve maintainability following React best practices.
 *
 * Features:
 * - Round navigation state
 * - Modal visibility state
 * - AI generation state
 * - Question editing state
 * - Form validation state
 *
 * @fileoverview State management hook for QuestionsStep
 * @version 1.0.0
 * @since December 2025
 */

import { useState, useCallback, useEffect } from "react";
import type {
  Quiz,
  Round,
  QuizQuestion,
  RoundType,
  AnswerRevealMode,
  QuizDifficulty,
} from "../../../types";
import type { AIQuestionParams } from "../../../services/aiQuestionService";

// Types for the hook
export interface RoundFormState {
  description: string;
  type: RoundType;
  answerRevealMode: AnswerRevealMode;
  defaultTimePerQuestion: number;
  breakingTime: number; // Breaking time in minutes (default 5)
}

export interface QuestionsStepState {
  // Round navigation
  currentRoundIdx: number;

  // Round modal state
  roundModalOpen: boolean;
  roundModalMode: "add" | "edit";
  editingRound: Round | null;
  roundForm: RoundFormState;

  // Question modals
  manualDialogOpen: boolean;
  manualQuestion: QuizQuestion | null;
  editingQuestionId: string | null;

  // AI generation state
  aiDialogOpen: boolean;
  aiGenerating: boolean;
  aiStatus: string;
  aiError: string;
  aiErrorDismissed: boolean;
  aiSettings: AIQuestionParams;

  // Delete confirmations
  deleteRoundConfirmOpen: boolean;
  deleteQuestionConfirmOpen: boolean;
  pendingDeleteQuestionId: string | null;
}

export interface QuestionsStepActions {
  // Round navigation
  setCurrentRoundIdx: (idx: number) => void;
  goToPrevRound: () => void;
  goToNextRound: () => void;

  // Round modal actions
  openRoundModal: (mode: "add" | "edit", round?: Round) => void;
  closeRoundModal: () => void;
  updateRoundForm: (field: keyof RoundFormState, value: any) => void;

  // Question modal actions
  openManualDialog: () => void;
  closeManualDialog: () => void;
  setManualQuestion: (question: QuizQuestion | null) => void;
  setEditingQuestionId: (id: string | null) => void;

  // AI generation actions
  openAIDialog: () => void;
  closeAIDialog: () => void;
  setAiGenerating: (generating: boolean) => void;
  setAiStatus: (status: string) => void;
  setAiError: (error: string) => void;
  setAiErrorDismissed: (dismissed: boolean) => void;
  setAiSettings: (settings: AIQuestionParams) => void;

  // Delete confirmation actions
  openDeleteRoundConfirm: () => void;
  closeDeleteRoundConfirm: () => void;
  openDeleteQuestionConfirm: (questionId: string) => void;
  closeDeleteQuestionConfirm: () => void;
}

export interface UseQuestionsStepStateReturn {
  state: QuestionsStepState;
  actions: QuestionsStepActions;
  derived: {
    rounds: Round[];
    currentRound: Round | null;
    isRoundFormValid: boolean;
  };
}

/**
 * Questions Step State Hook
 */
export const useQuestionsStepState = (
  draftQuiz: Partial<Quiz>
): UseQuestionsStepStateReturn => {
  // Round navigation state
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);

  // Round modal state
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [roundModalMode, setRoundModalMode] = useState<"add" | "edit">("add");
  const [editingRound, setEditingRound] = useState<Round | null>(null);

  // Round form state
  const [roundForm, setRoundForm] = useState<RoundFormState>({
    description: "",
    type: "mixed",
    answerRevealMode: "after-all",
    defaultTimePerQuestion: (draftQuiz.defaultTimeLimit || 60) / 60, // Convert seconds to minutes
    breakingTime: 5, // Changed default to 5 minutes breaking time
  });

  // Question modal state
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualQuestion, setManualQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );

  // AI generation state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiErrorDismissed, setAiErrorDismissed] = useState(false);
  const [aiSettings, setAiSettings] = useState<AIQuestionParams>({
    questionType: "text-answer",
    language: "English",
    topicHint: "",
    category: "general",
    difficulty: "medium",
    optionsCount: 4,
  });

  // Delete confirmation state
  const [deleteRoundConfirmOpen, setDeleteRoundConfirmOpen] = useState(false);
  const [deleteQuestionConfirmOpen, setDeleteQuestionConfirmOpen] =
    useState(false);
  const [pendingDeleteQuestionId, setPendingDeleteQuestionId] = useState<
    string | null
  >(null);

  // Derived state
  const rounds = draftQuiz.rounds || [];
  const currentRound = rounds[currentRoundIdx] || null;

  // Round form validation - description is now optional
  const isRoundFormValid =
    roundForm.type &&
    roundForm.answerRevealMode &&
    roundForm.defaultTimePerQuestion >= 0.1 && // Minimum 0.1 minutes (6 seconds)
    roundForm.breakingTime >= 0.1; // Minimum 0.1 minutes (6 seconds) for breaking time

  // When opening modal for edit, populate form
  useEffect(() => {
    if (roundModalOpen && roundModalMode === "edit" && editingRound) {
      setRoundForm({
        description: editingRound.description || "",
        type: editingRound.type,
        answerRevealMode: editingRound.answerRevealMode,
        defaultTimePerQuestion: editingRound.defaultTimePerQuestion,
        breakingTime: editingRound.breakingTime || 1, // Default to 1 minute if not set
      });
    } else if (roundModalOpen && roundModalMode === "add") {
      // Reset form for add mode
      setRoundForm({
        description: "",
        type: "mixed",
        answerRevealMode: "after-all", // Changed default to "after-all"
        defaultTimePerQuestion: (draftQuiz.defaultTimeLimit || 60) / 60, // Convert seconds to minutes
        breakingTime: 5, // Changed default to 5 minutes breaking time
      });
    }
  }, [roundModalOpen, roundModalMode, editingRound, draftQuiz]);

  // Actions
  const actions: QuestionsStepActions = {
    // Round navigation
    setCurrentRoundIdx,
    goToPrevRound: useCallback(() => {
      setCurrentRoundIdx((prev) => Math.max(0, prev - 1));
    }, []),
    goToNextRound: useCallback(() => {
      setCurrentRoundIdx((prev) => Math.min(rounds.length - 1, prev + 1));
    }, [rounds.length]),

    // Round modal actions
    openRoundModal: useCallback((mode: "add" | "edit", round?: Round) => {
      setRoundModalMode(mode);
      setEditingRound(round || null);
      setRoundModalOpen(true);
    }, []),
    closeRoundModal: useCallback(() => {
      setRoundModalOpen(false);
      setEditingRound(null);
    }, []),
    updateRoundForm: useCallback((field: keyof RoundFormState, value: any) => {
      setRoundForm((prev) => ({ ...prev, [field]: value }));
    }, []),

    // Question modal actions
    openManualDialog: useCallback(() => {
      setManualDialogOpen(true);
    }, []),
    closeManualDialog: useCallback(() => {
      setManualDialogOpen(false);
      setManualQuestion(null);
    }, []),
    setManualQuestion,
    setEditingQuestionId,

    // AI generation actions
    openAIDialog: useCallback(() => {
      setAiDialogOpen(true);
      setAiError("");
      setAiErrorDismissed(false);
    }, []),
    closeAIDialog: useCallback(() => {
      setAiDialogOpen(false);
    }, []),
    setAiGenerating,
    setAiStatus,
    setAiError,
    setAiErrorDismissed,
    setAiSettings,

    // Delete confirmation actions
    openDeleteRoundConfirm: useCallback(() => {
      setDeleteRoundConfirmOpen(true);
    }, []),
    closeDeleteRoundConfirm: useCallback(() => {
      setDeleteRoundConfirmOpen(false);
    }, []),
    openDeleteQuestionConfirm: useCallback((questionId: string) => {
      setPendingDeleteQuestionId(questionId);
      setDeleteQuestionConfirmOpen(true);
    }, []),
    closeDeleteQuestionConfirm: useCallback(() => {
      setDeleteQuestionConfirmOpen(false);
      setPendingDeleteQuestionId(null);
    }, []),
  };

  const state: QuestionsStepState = {
    currentRoundIdx,
    roundModalOpen,
    roundModalMode,
    editingRound,
    roundForm,
    manualDialogOpen,
    manualQuestion,
    editingQuestionId,
    aiDialogOpen,
    aiGenerating,
    aiStatus,
    aiError,
    aiErrorDismissed,
    aiSettings,
    deleteRoundConfirmOpen,
    deleteQuestionConfirmOpen,
    pendingDeleteQuestionId,
  };

  return {
    state,
    actions,
    derived: {
      rounds,
      currentRound,
      isRoundFormValid,
    },
  };
};
