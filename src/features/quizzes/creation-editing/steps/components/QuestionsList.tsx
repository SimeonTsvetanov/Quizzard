/**
 * Questions List Component
 *
 * Displays the list of questions in the current round and provides
 * question management actions. Extracted from the monolithic QuestionsStep
 * component to improve maintainability.
 *
 * Features:
 * - Display questions as clickable cards
 * - Empty state when no questions exist
 * - Question difficulty indicators
 * - Question completion status indicators (NEW)
 * - Delete question functionality
 *
 * @fileoverview Questions list component for quiz wizard
 * @version 2.0.0
 * @since December 2025
 */

import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  QuestionAnswer as QuestionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import type { Round, QuizQuestion } from "../../../types";

/**
 * Props for the QuestionsList component
 */
interface QuestionsListProps {
  /** Current round */
  currentRound: Round | null;
  /** Callback when question is clicked for editing */
  onEditQuestion: (question: QuizQuestion) => void;
  /** Callback when question should be deleted */
  onDeleteQuestion: (questionId: string) => void;
  /** Callback when add round button is clicked (for empty state) */
  onAddRound?: () => void;
  /** Callback when add question button is clicked (for empty questions state) */
  onAddQuestion?: () => void;
}

/**
 * Helper function to determine if a question is complete
 *
 * @param question - The question to check
 * @param roundType - The type of round this question belongs to
 * @returns true if the question is complete, false otherwise
 */
const isQuestionComplete = (
  question: QuizQuestion,
  roundType?: string
): boolean => {
  // Check if question text is filled
  if (!question.question || !question.question.trim()) {
    return false;
  }

  // Check answers based on question type
  if (
    question.type === "single-answer" ||
    ["picture", "audio", "video"].includes(question.type)
  ) {
    // Single answer questions need correctAnswerText
    return !!(question.correctAnswerText && question.correctAnswerText.trim());
  } else if (roundType === "golden-pyramid") {
    // Golden Pyramid questions need all possibleAnswers filled
    return (
      question.possibleAnswers.length > 0 &&
      question.possibleAnswers.every((answer) => answer.trim())
    );
  } else {
    // Multiple choice questions need at least 2 options and correct answers selected
    return (
      question.possibleAnswers.length >= 2 &&
      question.possibleAnswers.every((opt) => opt.trim()) &&
      question.correctAnswers.length > 0
    );
  }
};

/**
 * Questions List Component
 *
 * Renders the list of questions for the current round with edit and delete actions.
 * Shows appropriate empty states when no questions exist.
 * Now includes completion status indicators for better user experience.
 * Added "Add Round" button in empty state when no rounds exist.
 *
 * @param props - Component props including round data and question callbacks
 * @returns JSX element representing the questions list
 */
export const QuestionsList: React.FC<QuestionsListProps> = ({
  currentRound,
  onEditQuestion,
  onDeleteQuestion,
  onAddRound,
  onAddQuestion,
}) => {
  // Show empty state if no round is selected
  if (!currentRound) {
    return (
      <Card
        elevation={0}
        sx={{
          textAlign: "center",
          py: 6,
          border: 2,
          borderStyle: "dashed",
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <CardContent>
          <QuestionIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Rounds Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add your first round to begin creating your quiz structure.
          </Typography>
          {/* Add Round button - similar to main quizzes page empty state */}
          {onAddRound && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={onAddRound}
              sx={{ mt: 2 }}
            >
              Add Round
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Round Info */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" color="text.secondary">
          {currentRound.level ? `Level: ${currentRound.level}` : ""} | Reveal:{" "}
          {currentRound.answerRevealMode} | Default Time:{" "}
          {currentRound.defaultTimePerQuestion}s
        </Typography>
      </Box>

      {/* Questions List */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {currentRound.questions.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              textAlign: "center",
              py: 4,
              border: 1,
              borderStyle: "dashed",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                No questions in this round yet. Add or generate questions to get
                started.
              </Typography>
              {/* Add Question button - only show if callback is provided */}
              {onAddQuestion && (
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<AddIcon />}
                  onClick={onAddQuestion}
                  sx={{ mt: 1 }}
                >
                  Add Question
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          currentRound.questions.map((question, index) => {
            const isComplete = isQuestionComplete(question, currentRound.type);

            return (
              <Card
                key={question.id}
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  cursor: "pointer",
                  bgcolor: "background.paper",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: 4 },
                }}
                onClick={() => onEditQuestion(question)}
                aria-label={`Edit question ${index + 1}`}
              >
                {/* Completion Status Icon */}
                <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                  {isComplete ? (
                    <CheckCircleIcon
                      sx={{
                        color: "success.main",
                        fontSize: { xs: 16, sm: 18 },
                      }}
                      titleAccess="Question complete"
                    />
                  ) : (
                    <WarningIcon
                      sx={{
                        color: "error.main",
                        fontSize: { xs: 16, sm: 18 },
                      }}
                      titleAccess="Question incomplete"
                    />
                  )}
                </Box>

                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  {index + 1}. {question.question || "Untitled Question"}
                </Typography>

                <Chip
                  label={question.difficulty}
                  size="small"
                  color={
                    question.difficulty === "easy"
                      ? "success"
                      : question.difficulty === "medium"
                      ? "warning"
                      : "error"
                  }
                  sx={{ mr: 1 }}
                />

                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuestion(question.id);
                  }}
                  aria-label={`Delete question ${index + 1}`}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Card>
            );
          })
        )}
      </Box>
    </>
  );
};
