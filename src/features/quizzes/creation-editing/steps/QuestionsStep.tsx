/**
 * Questions Step Component (REFACTORED)
 *
 * Second step of the quiz creation wizard for adding and managing quiz questions.
 * Refactored from 1,612-line monolithic component into smaller, maintainable pieces.
 *
 * REFACTORING CHANGES:
 * - Extracted state management to useQuestionsStepState hook
 * - Split UI into smaller, focused components (RoundNavigation, QuestionsList, etc.)
 * - Maintained 100% functionality and styling compatibility
 * - Improved maintainability and follows Single Responsibility Principle
 *
 * Features:
 * - Manual question creation and editing
 * - AI-powered question generation with category/difficulty selection
 * - Multiple choice options (2-6 answers)
 * - Question reordering and deletion
 * - Real-time validation
 * - Responsive design
 *
 * @fileoverview Refactored questions step for quiz creation wizard
 * @version 2.0.0 (Refactored)
 * @since December 2025
 */

import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  DialogContentText,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Close as CloseIcon,
  Psychology as BrainIcon,
  ShortText as ShortTextIcon,
  FormatListBulleted as FormatListBulletedIcon,
} from "@mui/icons-material";
import { useQuestionsStepState } from "./hooks/useQuestionsStepState";
import {
  RoundNavigation,
  QuestionActionsBar,
  QuestionsList,
  QuestionEditor,
} from "./components";
import {
  isAIQuestionGenerationAvailable,
  getAIQuestionRateLimit,
  generateAIQuizQuestion,
} from "../../services/aiQuestionService";
import { ROUND_TYPE_CONFIG } from "../../types";

interface RoundsQuestionsStepProps {
  draftQuiz: Partial<Quiz>;
  updateDraft: (updates: Partial<Quiz>) => void;
  showValidation: boolean;
}

export const RoundsQuestionsStep: React.FC<RoundsQuestionsStepProps> = ({
  draftQuiz,
  updateDraft,
  showValidation,
}) => {
  // Use refactored state management hook
  const { state, actions, derived } = useQuestionsStepState(draftQuiz);
  const { rounds, currentRound, isRoundFormValid } = derived;

  // Updated round types for new system
  const ROUND_TYPES: { value: RoundType; label: string }[] = [
    { value: "mixed", label: "Mixed Types" },
    { value: "single-answer-only", label: "Single Answer Only" },
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "picture", label: "Picture Round" },
    { value: "audio", label: "Audio Round" },
    { value: "video", label: "Video Round" },
    { value: "golden-pyramid", label: "Golden Pyramid" },
  ];
  const REVEAL_MODES: { value: AnswerRevealMode; label: string }[] = [
    { value: "after-each", label: "After Each Question" },
    { value: "after-all", label: "After All Questions" },
  ];

  const handleRoundSave = () => {
    if (!isRoundFormValid) return;
    const roundIndex =
      state.roundModalMode === "add" ? rounds.length : state.currentRoundIdx;
    const round = {
      id:
        state.editingRound?.id ||
        `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Round ${roundIndex + 1}`,
      description: state.roundForm.description,
      type: state.roundForm.type as RoundType,
      answerRevealMode: state.roundForm.answerRevealMode as AnswerRevealMode,
      defaultTimePerQuestion: Number(state.roundForm.defaultTimePerQuestion),
      breakingTime: Number(state.roundForm.breakingTime),
      level: (draftQuiz.difficulty as QuizDifficulty) || "medium", // Inherit from quiz level
      questions: state.editingRound?.questions || [],
      createdAt: state.editingRound?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Golden Pyramid special logic: Auto-populate 4 questions
    if (
      state.roundForm.type === "golden-pyramid" &&
      round.questions.length === 0
    ) {
      const goldenPyramidQuestions = Array.from({ length: 4 }, (_, index) => ({
        id: `question_${Date.now()}_${index}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        type: "multiple-choice" as QuestionType,
        question: `Golden Pyramid Question ${index + 1}`,
        possibleAnswers: Array.from({ length: index + 1 }, () => ""), // 1,2,3,4 answer fields (empty)
        correctAnswers: Array.from({ length: index + 1 }, (_, i) => i), // All answers are correct for Golden Pyramid
        correctAnswerText: "",
        explanation: "",
        mediaFile: undefined,
        difficulty: (draftQuiz.difficulty as QuizDifficulty) || "medium", // Inherit from quiz level
        points: 1,
        timeLimit: Number(state.roundForm.defaultTimePerQuestion),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      round.questions = goldenPyramidQuestions;
    }

    handleSaveRound(round);
  };

  /**
   * Render AI generation dialog
   */
  const renderAIDialog = React.useCallback(
    () => (
      <Dialog
        open={state.aiDialogOpen}
        onClose={actions.closeAIDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <BrainIcon color="primary" />
            Generate AI Question
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* AI Status */}
            {(state.aiGenerating || state.aiStatus) && (
              <Alert
                severity="info"
                icon={
                  state.aiGenerating ? (
                    <CircularProgress size={20} />
                  ) : undefined
                }
              >
                {state.aiStatus || "Generating question..."}
              </Alert>
            )}

            {/* Error */}
            {state.aiError && !state.aiErrorDismissed && (
              <Alert
                severity="error"
                action={
                  <IconButton
                    size="small"
                    onClick={() => actions.setAiErrorDismissed(true)}
                    aria-label="Dismiss error"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
              >
                {state.aiError}
              </Alert>
            )}

            {/* Question Type - Only show for Mixed rounds */}
            {currentRound?.type === "mixed" && (
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={state.aiSettings.questionType || "text-answer"}
                  onChange={(e) =>
                    actions.setAiSettings({
                      ...state.aiSettings,
                      questionType: e.target.value as "text-answer" | "text",
                    })
                  }
                  label="Question Type"
                >
                  <MenuItem value="text-answer">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ShortTextIcon fontSize="small" />
                      Single Answer
                    </Box>
                  </MenuItem>
                  <MenuItem value="text">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FormatListBulletedIcon fontSize="small" />
                      Multiple Choice
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Language Selection */}
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={state.aiSettings.language || "English"}
                onChange={(e) =>
                  actions.setAiSettings({
                    ...state.aiSettings,
                    language: e.target.value,
                  })
                }
                label="Language"
              >
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Bulgarian">Bulgarian</MenuItem>
              </Select>
            </FormControl>

            {/* Topic Input */}
            <TextField
              fullWidth
              label="Topic (optional)"
              placeholder="e.g., Ancient Rome, Quantum Physics, Football..."
              value={state.aiSettings.topicHint || ""}
              onChange={(e) =>
                actions.setAiSettings({
                  ...state.aiSettings,
                  topicHint: e.target.value,
                })
              }
              helperText="Leave empty for random topic"
            />

            {/* Category */}
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={state.aiSettings.category || "general"}
                onChange={(e) =>
                  actions.setAiSettings({
                    ...state.aiSettings,
                    category: e.target.value as QuizCategory,
                  })
                }
                label="Category"
              >
                <MenuItem value="general">General Knowledge</MenuItem>
                <MenuItem value="science">Science</MenuItem>
                <MenuItem value="history">History</MenuItem>
                <MenuItem value="geography">Geography</MenuItem>
                <MenuItem value="sports">Sports</MenuItem>
                <MenuItem value="entertainment">Entertainment</MenuItem>
                <MenuItem value="literature">Literature</MenuItem>
                <MenuItem value="art">Art</MenuItem>
                <MenuItem value="music">Music</MenuItem>
                <MenuItem value="technology">Technology</MenuItem>
              </Select>
            </FormControl>

            {/* Difficulty */}
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={state.aiSettings.difficulty || "medium"}
                onChange={(e) =>
                  actions.setAiSettings({
                    ...state.aiSettings,
                    difficulty: e.target.value as QuizDifficulty,
                  })
                }
                label="Difficulty"
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>

            {/* Options Count - Only show for multiple choice */}
            {(state.aiSettings.questionType === "text" ||
              (currentRound?.type === "multiple-choice" &&
                currentRound.type !== "mixed")) && (
              <FormControl fullWidth>
                <InputLabel>Number of Options</InputLabel>
                <Select
                  value={state.aiSettings.optionsCount || 4}
                  onChange={(e) =>
                    actions.setAiSettings({
                      ...state.aiSettings,
                      optionsCount: Number(e.target.value),
                    })
                  }
                  label="Number of Options"
                >
                  <MenuItem value={2}>2 Options</MenuItem>
                  <MenuItem value={3}>3 Options</MenuItem>
                  <MenuItem value={4}>4 Options</MenuItem>
                  <MenuItem value={5}>5 Options</MenuItem>
                  <MenuItem value={6}>6 Options</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Rate limit info */}
            {isAIQuestionGenerationAvailable() && (
              <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  AI questions remaining:{" "}
                  {getAIQuestionRateLimit().requestsRemaining}/15 per minute
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={actions.closeAIDialog}>Cancel</Button>
          <Button
            onClick={async () => {
              actions.setAiGenerating(true);
              actions.setAiError(null);
              actions.setAiErrorDismissed(false);

              try {
                // Determine question type based on round type
                let questionType = state.aiSettings.questionType;
                if (currentRound?.type === "single-answer-only") {
                  questionType = "text-answer";
                } else if (currentRound?.type === "multiple-choice") {
                  questionType = "text";
                }

                const result = await generateAIQuizQuestion({
                  questionType: questionType || "text-answer",
                  language: state.aiSettings.language || "English",
                  topicHint: state.aiSettings.topicHint,
                  category: state.aiSettings.category || "general",
                  difficulty: state.aiSettings.difficulty || "medium",
                  optionsCount: state.aiSettings.optionsCount || 4,
                });

                if (result.success && result.question) {
                  // Add the AI-generated question to the current round
                  const newQuestion: QuizQuestion = {
                    ...result.question,
                    id: `q_${Date.now()}_${Math.random()
                      .toString(36)
                      .substr(2, 9)}`,
                    difficulty: state.aiSettings.difficulty || "medium",
                    points: 1,
                    timeLimit: currentRound?.defaultTimePerQuestion || 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };

                  const updatedRound: Round = {
                    ...currentRound!,
                    questions: [
                      ...(currentRound?.questions || []),
                      newQuestion,
                    ],
                    updatedAt: new Date(),
                  };

                  updateDraft({
                    rounds: rounds.map((r, idx) =>
                      idx === state.currentRoundIdx ? updatedRound : r
                    ),
                  });

                  actions.setAiStatus("Question generated successfully!");
                  setTimeout(() => {
                    actions.closeAIDialog();
                    actions.setAiStatus(null);
                  }, 1500);
                } else {
                  actions.setAiError(
                    result.error || "Failed to generate question"
                  );
                }
              } catch (error) {
                actions.setAiError(
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred"
                );
              } finally {
                actions.setAiGenerating(false);
              }
            }}
            variant="contained"
            disabled={state.aiGenerating || !isAIQuestionGenerationAvailable()}
          >
            {state.aiGenerating ? "Generating..." : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>
    ),
    [
      state.aiDialogOpen,
      state.aiGenerating,
      state.aiStatus,
      state.aiError,
      state.aiErrorDismissed,
      state.aiSettings,
      currentRound,
      rounds,
      state.currentRoundIdx,
      actions,
      updateDraft,
    ]
  );

  // Handler to open manual question modal
  const openManualDialog = () => {
    if (!currentRound) return;

    // Get round type configuration
    const roundConfig = ROUND_TYPE_CONFIG[currentRound.type];

    // Determine default question type based on round type
    let defaultQuestionType: QuestionType;
    if (currentRound.type === "picture") {
      defaultQuestionType = "picture"; // Picture rounds use picture question type
    } else if (currentRound.type === "audio") {
      defaultQuestionType = "audio"; // Audio rounds use audio question type
    } else if (currentRound.type === "video") {
      defaultQuestionType = "video"; // Video rounds use video question type
    } else if (roundConfig.canSelectQuestionType) {
      defaultQuestionType = "single-answer"; // Mixed rounds default to single-answer
    } else {
      defaultQuestionType = roundConfig.allowedQuestionTypes[0]; // Auto-set for specific rounds
    }

    // Create question with appropriate defaults based on question type
    let questionDefaults;
    if (defaultQuestionType === "single-answer") {
      questionDefaults = {
        possibleAnswers: [],
        correctAnswers: [],
        correctAnswerText: "",
      };
    } else if (defaultQuestionType === "multiple-choice") {
      // Multiple Choice round: default 4 answers
      questionDefaults = {
        possibleAnswers: ["", "", "", ""],
        correctAnswers: [0],
        correctAnswerText: undefined,
      };
    } else if (["picture", "audio", "video"].includes(defaultQuestionType)) {
      // Media types: default to single-answer behavior but keep media type
      questionDefaults = {
        possibleAnswers: [],
        correctAnswers: [],
        correctAnswerText: "",
      };
    } else {
      // Fallback for other types
      questionDefaults = {
        possibleAnswers: [""],
        correctAnswers: [0],
        correctAnswerText: undefined,
      };
    }

    actions.setManualQuestion({
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: defaultQuestionType,
      question: "",
      ...questionDefaults,
      explanation: "",
      mediaFile: undefined,
      difficulty: (draftQuiz.difficulty as QuizDifficulty) || "medium",
      points: 1,
      timeLimit: currentRound.defaultTimePerQuestion || 1, // Use round's time setting in minutes
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    actions.openManualDialog();
  };

  // Required fields check for Save button
  const manualQuestionValid =
    state.manualQuestion &&
    state.manualQuestion.question.trim() &&
    (() => {
      if (
        state.manualQuestion.type === "single-answer" ||
        ["picture", "audio", "video"].includes(state.manualQuestion.type)
      ) {
        // Single answer and media types use correctAnswerText
        return (
          state.manualQuestion.correctAnswerText &&
          state.manualQuestion.correctAnswerText.trim()
        );
      } else if (currentRound?.type === "golden-pyramid") {
        // For Golden Pyramid, allow saving incomplete questions
        // Users can work on questions gradually and complete them over time
        return (
          state.manualQuestion.possibleAnswers.length > 0 &&
          state.manualQuestion.possibleAnswers.some((answer) => answer.trim())
        );
      } else {
        // Regular multiple choice validation
        return (
          state.manualQuestion.possibleAnswers.length >= 2 &&
          state.manualQuestion.possibleAnswers.every((opt) => opt.trim()) &&
          state.manualQuestion.correctAnswers.length > 0
        );
      }
    })();

  // Handler: Add new round
  const handleAddRound = () => {
    actions.openRoundModal("add");
  };

  // Handler: Edit current round
  const handleEditRound = () => {
    actions.openRoundModal("edit", currentRound || undefined);
  };

  // Handler: Save round (add or edit)
  const handleSaveRound = (round: Round) => {
    if (state.roundModalMode === "add") {
      updateDraft({ rounds: [...rounds, round] });
      actions.setCurrentRoundIdx(rounds.length); // Go to new round
    } else if (state.roundModalMode === "edit" && currentRound) {
      updateDraft({
        rounds: rounds.map((r, idx) =>
          idx === state.currentRoundIdx ? round : r
        ),
      });
    }
    actions.closeRoundModal();
  };

  // Get available round types for editing
  const getAvailableRoundTypes = () => {
    if (state.roundModalMode === "edit" && state.editingRound) {
      // Golden Pyramid can never change type
      if (state.editingRound.type === "golden-pyramid") {
        return [{ value: "golden-pyramid", label: "Golden Pyramid" }];
      }

      // If round has questions, can only change to Mixed
      if (state.editingRound.questions.length > 0) {
        return [
          {
            value: state.editingRound.type,
            label: ROUND_TYPE_CONFIG[state.editingRound.type].label,
          },
          { value: "mixed", label: "Mixed Types" },
        ].filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.value === item.value)
        ); // Remove duplicates
      }
    }

    // For new rounds or rounds without questions, show all types except golden pyramid in edit mode
    return ROUND_TYPES.filter(
      (type) =>
        state.roundModalMode === "add" || type.value !== "golden-pyramid"
    );
  };

  // Handler: Delete current round (with confirmation)
  const requestDeleteRound = () => {
    actions.openDeleteRoundConfirm();
  };
  const handleConfirmDeleteRound = () => {
    if (!currentRound) return;
    const newRounds = rounds.filter((_, idx) => idx !== state.currentRoundIdx);
    updateDraft({ rounds: newRounds });
    actions.setCurrentRoundIdx(Math.max(0, state.currentRoundIdx - 1));
    actions.closeDeleteRoundConfirm();
  };
  const handleCancelDeleteRound = () => actions.closeDeleteRoundConfirm();

  // Handler: Delete question in current round (with confirmation)
  const requestDeleteQuestion = (questionId: string) => {
    actions.openDeleteQuestionConfirm(questionId);
  };
  const handleConfirmDeleteQuestion = () => {
    if (!currentRound || !state.pendingDeleteQuestionId) return;
    const updatedQuestions = currentRound.questions.filter(
      (q) => q.id !== state.pendingDeleteQuestionId
    );
    const updatedRound: Round = {
      ...currentRound,
      questions: updatedQuestions,
      updatedAt: new Date(),
    };
    updateDraft({
      rounds: rounds.map((r, idx) =>
        idx === state.currentRoundIdx ? updatedRound : r
      ),
    });
    if (state.editingQuestionId === state.pendingDeleteQuestionId)
      actions.setEditingQuestionId(null);

    // Close the manual dialog if we're deleting the question being edited
    if (state.manualQuestion?.id === state.pendingDeleteQuestionId) {
      actions.closeManualDialog();
    }

    actions.closeDeleteQuestionConfirm();
  };
  const handleCancelDeleteQuestion = () => {
    actions.closeDeleteQuestionConfirm();
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      {/* Refactored Round Navigation Component */}
      <RoundNavigation
        rounds={rounds}
        currentRoundIdx={state.currentRoundIdx}
        currentRound={currentRound}
        onPreviousRound={actions.goToPrevRound}
        onNextRound={actions.goToNextRound}
        onAddRound={handleAddRound}
        onEditRound={handleEditRound}
        onDeleteRound={requestDeleteRound}
      />

      {/* Round Type Information */}
      {currentRound &&
        !ROUND_TYPE_CONFIG[currentRound.type].canSelectQuestionType && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>{ROUND_TYPE_CONFIG[currentRound.type].label}:</strong>{" "}
              {ROUND_TYPE_CONFIG[currentRound.type].description}
              {currentRound.type === "golden-pyramid" && (
                <span>
                  {" "}
                  - This round auto-generates 4 pre-configured questions with 1,
                  2, 3, and 4 correct answers respectively.
                </span>
              )}
            </Typography>
          </Alert>
        )}

      {/* Refactored Question Actions Bar */}
      <QuestionActionsBar
        showActions={!!currentRound}
        roundType={currentRound?.type}
        onOpenAIDialog={actions.openAIDialog}
        onOpenManualDialog={openManualDialog}
      />

      {/* Refactored Questions List */}
      <QuestionsList
        currentRound={currentRound}
        onEditQuestion={(question) => {
          actions.setManualQuestion(question);
          actions.openManualDialog();
        }}
        onDeleteQuestion={requestDeleteQuestion}
        onAddRound={handleAddRound}
        onAddQuestion={openManualDialog}
      />

      {/* AI Dialog */}
      {renderAIDialog()}

      {/* Manual Question Dialog */}
      <Dialog
        open={state.manualDialogOpen}
        onClose={actions.closeManualDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {state.manualQuestion &&
          currentRound?.questions.some((q) => q.id === state.manualQuestion?.id)
            ? `Edit ${
                currentRound
                  ? (() => {
                      const label = ROUND_TYPE_CONFIG[currentRound.type].label;
                      return label.includes("Question")
                        ? label
                        : `${label} Question`;
                    })()
                  : "Question"
              }`
            : `Add ${
                currentRound
                  ? (() => {
                      const label = ROUND_TYPE_CONFIG[currentRound.type].label;
                      return label.includes("Question")
                        ? label
                        : `${label} Question`;
                    })()
                  : "Question"
              }`}
        </DialogTitle>
        <DialogContent>
          {state.manualQuestion && (
            <QuestionEditor
              question={state.manualQuestion}
              roundType={currentRound?.type}
              onUpdate={(updates) =>
                actions.setManualQuestion(
                  state.manualQuestion
                    ? {
                        ...state.manualQuestion,
                        ...updates,
                        updatedAt: new Date(),
                      }
                    : null
                )
              }
            />
          )}
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 2,
          }}
        >
          {/* Delete Button - Left Side (Only show when editing existing question) */}
          {state.manualQuestion &&
            currentRound?.questions.some(
              (q) => q.id === state.manualQuestion?.id
            ) && (
              <IconButton
                onClick={() => {
                  if (state.manualQuestion?.id) {
                    requestDeleteQuestion(state.manualQuestion.id);
                  }
                }}
                color="error"
                sx={{
                  bgcolor: "error.50",
                  "&:hover": {
                    bgcolor: "error.100",
                  },
                }}
                aria-label="Delete question"
              >
                <DeleteIcon />
              </IconButton>
            )}

          {/* Spacer for Add mode */}
          {!(
            state.manualQuestion &&
            currentRound?.questions.some(
              (q) => q.id === state.manualQuestion?.id
            )
          ) && <Box />}

          {/* Cancel and Save Buttons - Right Side */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={actions.closeManualDialog}>Cancel</Button>
            <Button
              onClick={() => {
                if (!state.manualQuestion) return;
                // If editing, update the question in the round
                if (
                  currentRound?.questions.some(
                    (q) => q.id === state.manualQuestion?.id
                  )
                ) {
                  const updatedQuestions = currentRound.questions.map((q) =>
                    q.id === state.manualQuestion?.id ? state.manualQuestion : q
                  );
                  const updatedRound: Round = {
                    ...currentRound!,
                    questions: updatedQuestions,
                    updatedAt: new Date(),
                  };
                  updateDraft({
                    rounds: rounds.map((r, idx) =>
                      idx === state.currentRoundIdx ? updatedRound : r
                    ),
                  });
                } else {
                  // If adding, add the question to the round
                  const updatedRound: Round = {
                    ...currentRound!,
                    questions: [
                      ...(currentRound?.questions || []),
                      state.manualQuestion,
                    ],
                    updatedAt: new Date(),
                  };
                  updateDraft({
                    rounds: rounds.map((r, idx) =>
                      idx === state.currentRoundIdx ? updatedRound : r
                    ),
                  });
                }
                actions.closeManualDialog();
              }}
              variant="contained"
              disabled={!manualQuestionValid}
            >
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Round Modal for Add/Edit */}
      <Dialog
        open={state.roundModalOpen}
        onClose={actions.closeRoundModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {state.roundModalMode === "add" ? "Add Round" : "Edit Round"}
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
          >
            <FormControl fullWidth required>
              <InputLabel>Round Type</InputLabel>
              <Select
                value={state.roundForm.type}
                label="Round Type"
                onChange={(e) =>
                  actions.updateRoundForm("type", e.target.value)
                }
                aria-label="Round type"
              >
                {getAvailableRoundTypes().map((rt) => (
                  <MenuItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Answer Reveal Mode</InputLabel>
              <Select
                value={state.roundForm.answerRevealMode}
                label="Answer Reveal Mode"
                onChange={(e) =>
                  actions.updateRoundForm("answerRevealMode", e.target.value)
                }
                aria-label="Answer reveal mode"
              >
                {REVEAL_MODES.map((rm) => (
                  <MenuItem key={rm.value} value={rm.value}>
                    {rm.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography gutterBottom>
                Default Time Per Question (minutes)
              </Typography>
              <TextField
                type="number"
                fullWidth
                label="Minutes"
                inputProps={{
                  min: 0.1,
                  max: 10,
                  step: 0.1,
                }}
                value={state.roundForm.defaultTimePerQuestion}
                onChange={(e) => {
                  let val = Number(e.target.value);
                  if (val < 0.1) val = 0.1;
                  if (val > 10) val = 10;
                  actions.updateRoundForm("defaultTimePerQuestion", val);
                }}
                helperText="Time limit per question (0.5 = 30 seconds, 1 = 60 seconds)"
                aria-label="Default time per question in minutes"
              />
            </Box>
            <Box>
              <Typography gutterBottom>Breaking Time (minutes)</Typography>
              <TextField
                type="number"
                fullWidth
                label="Minutes"
                placeholder="5"
                inputProps={{
                  min: 0.1,
                  max: 10,
                  step: 0.1,
                }}
                value={state.roundForm.breakingTime || ""}
                onChange={(e) => {
                  let val = Number(e.target.value) || 5; // Default to 5 if empty
                  if (val < 0.1) val = 0.1;
                  if (val > 10) val = 10;
                  actions.updateRoundForm("breakingTime", val);
                }}
                helperText="Break time between rounds (default 5 minutes)"
                aria-label="Breaking time between rounds in minutes"
              />
            </Box>
            <TextField
              label="Round Description (Optional)"
              value={state.roundForm.description}
              onChange={(e) =>
                actions.updateRoundForm("description", e.target.value)
              }
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              inputProps={{ maxLength: 120 }}
              aria-label="Round description"
              helperText="Optional description for this round"
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 2,
          }}
        >
          {/* Delete Button - Left Side (Only show when editing) */}
          {state.roundModalMode === "edit" && rounds.length > 0 && (
            <IconButton
              onClick={requestDeleteRound}
              color="error"
              sx={{
                bgcolor: "error.50",
                "&:hover": {
                  bgcolor: "error.100",
                },
              }}
              aria-label="Delete round"
            >
              <DeleteIcon />
            </IconButton>
          )}

          {/* Spacer for Add mode */}
          {state.roundModalMode === "add" && <Box />}

          {/* Cancel and Save Buttons - Right Side */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={actions.closeRoundModal}>Cancel</Button>
            <Button
              onClick={handleRoundSave}
              variant="contained"
              disabled={!isRoundFormValid}
            >
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Validation for Next button: ensure at least one round and each round has at least one question */}
      {showValidation && rounds.some((r) => r.questions.length === 0) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Each round must have at least one question to proceed.
        </Alert>
      )}

      {/* Confirmation dialogs */}
      <Dialog
        open={state.deleteRoundConfirmOpen}
        onClose={handleCancelDeleteRound}
        aria-labelledby="delete-round-dialog-title"
        aria-describedby="delete-round-dialog-description"
      >
        <DialogTitle id="delete-round-dialog-title">
          Confirm Delete Round
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-round-dialog-description">
            Are you sure you want to delete this round? All questions in this
            round will be lost. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteRound} color="primary" autoFocus>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteRound}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={state.deleteQuestionConfirmOpen}
        onClose={handleCancelDeleteQuestion}
        aria-labelledby="delete-question-dialog-title"
        aria-describedby="delete-question-dialog-description"
      >
        <DialogTitle id="delete-question-dialog-title">
          Confirm Delete Question
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-question-dialog-description">
            Are you sure you want to delete this question? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDeleteQuestion}
            color="primary"
            autoFocus
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteQuestion}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoundsQuestionsStep;
