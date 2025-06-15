/**
 * FinalQuestionCard Component
 *
 * A focused component for displaying a single final question card.
 * Shows question text, answer, and optional metadata with hover effects.
 *
 * Responsibilities:
 * - Display question and answer
 * - Provide hover animations
 * - Handle responsive layout
 * - Show metadata (category, difficulty)
 */

import { Box, Typography, Chip } from "@mui/material";
import type { FinalQuestionCardProps } from "../../types";

/**
 * FinalQuestionCard Component
 *
 * Renders a single final question card with question text, answer,
 * and optional metadata. Provides hover effects and responsive design.
 *
 * @param props - Component props
 * @returns JSX element for the final question card
 */
export const FinalQuestionCard = ({
  question,
  isRefreshing = false,
}: FinalQuestionCardProps) => {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "background.default",
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[2],
        opacity: isRefreshing ? 0.5 : 1,
        transform: isRefreshing ? "scale(0.98)" : "scale(1)",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          boxShadow: (theme) => theme.shadows[4],
          transform: isRefreshing ? "scale(0.98)" : "translateY(-2px)",
        },
      }}
    >
      {/* Question Text */}
      <Typography
        variant="h6"
        fontWeight={600}
        color="primary.main"
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        ❓ {question.question}
      </Typography>

      {/* Answer */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          mb: 2,
        }}
      >
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Answer:
        </Typography>
        <Typography
          variant="body1"
          color="text.primary"
          sx={{
            fontSize: "1rem",
            lineHeight: 1.5,
          }}
        >
          {question.answer}
        </Typography>
      </Box>

      {/* Metadata Chips */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mt: 2,
        }}
      >
        {question.category && (
          <Chip
            label={question.category}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
        {question.difficulty && (
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
            variant="outlined"
          />
        )}
      </Box>
    </Box>
  );
};
