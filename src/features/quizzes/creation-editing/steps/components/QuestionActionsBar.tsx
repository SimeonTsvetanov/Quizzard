/**
 * Question Actions Bar Component
 *
 * Provides action buttons for adding questions (AI generation and manual creation).
 * Extracted from the monolithic QuestionsStep component to improve modularity.
 *
 * Features:
 * - AI question generation button (only for supported round types)
 * - Manual question creation button
 * - Conditional display based on round type restrictions
 *
 * @fileoverview Question actions bar component for quiz wizard
 * @version 2.0.0 (Updated for round restrictions)
 * @since December 2025
 */

import React from "react";
import { Box, Button } from "@mui/material";
import { Add as AddIcon, Psychology as AIIcon } from "@mui/icons-material";
import type { RoundType } from "../../../types";

interface QuestionActionsBarProps {
  /** Whether to show the actions bar (when round exists) */
  showActions: boolean;
  /** Current round type to determine which buttons to show */
  roundType?: RoundType;
  /** Callback to open AI generation dialog */
  onOpenAIDialog: () => void;
  /** Callback to open manual question dialog */
  onOpenManualDialog: () => void;
}

/**
 * Question Actions Bar Component
 *
 * Renders action buttons for creating questions when a round is selected.
 * Provides both AI generation and manual creation options based on round type.
 *
 * @param props - Component props including visibility, round type, and action callbacks
 * @returns JSX element representing the question actions bar
 */
export const QuestionActionsBar: React.FC<QuestionActionsBarProps> = ({
  showActions,
  roundType,
  onOpenAIDialog,
  onOpenManualDialog,
}) => {
  // Don't render if no round is selected
  if (!showActions || !roundType) {
    return null;
  }

  // Golden Pyramid rounds shouldn't have any add buttons (4 questions are pre-populated)
  if (roundType === "golden-pyramid") {
    return null;
  }

  // AI Generate button should only appear in Mixed, Single Answer Only, and Multiple Choice rounds
  const showAIButton = [
    "mixed",
    "single-answer-only",
    "multiple-choice",
  ].includes(roundType);

  return (
    <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
      {showAIButton && (
        <Button
          variant="outlined"
          startIcon={<AIIcon />}
          onClick={onOpenAIDialog}
          aria-label="Generate question with AI"
        >
          AI Generate
        </Button>
      )}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onOpenManualDialog}
        aria-label="Add question manually"
      >
        Add Question
      </Button>
    </Box>
  );
};
