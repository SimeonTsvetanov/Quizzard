/**
 * Quiz Grid Component
 *
 * Handles the display of quizzes in a responsive grid layout with loading
 * and empty states. Extracted from the monolithic Quizzes.tsx to improve
 * maintainability and follow Single Responsibility Principle.
 *
 * Features:
 * - Responsive grid layout
 * - Loading skeleton animation
 * - Empty state with call-to-action
 * - Quiz card integration
 *
 * @fileoverview Quiz grid layout and state management
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
  Box,
} from "@mui/material";
import { Add as AddIcon, School as SchoolIcon } from "@mui/icons-material";
import { QuizCard } from "../QuizCard";
import type { Quiz } from "../../types";
import type { QuizCardProps } from "../QuizCard";

/**
 * Props for the QuizGrid component
 */
export interface QuizGridProps {
  /** Array of quizzes to display */
  quizzes: Quiz[];
  /** Loading state indicator */
  isLoading: boolean;
  /** Callback when create quiz is requested */
  onCreateQuiz: () => void;
  /** Callback when quiz menu is opened */
  onMenuOpen: QuizCardProps["onMenuOpen"];
  /** Callback when quiz export is requested */
  onExport: QuizCardProps["onExport"];
  /** Callback when quiz preview is requested */
  onPreview?: QuizCardProps["onPreview"];
}

/**
 * Renders loading skeleton for quiz cards
 *
 * @returns JSX elements representing loading skeleton cards
 */
const LoadingSkeleton: React.FC = () => (
  <>
    {[1, 2, 3].map((item) => (
      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item}>
        <Card elevation={1}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={2}
            >
              <Skeleton variant="circular" width={48} height={48} />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
            <Skeleton variant="text" sx={{ fontSize: "1.2rem", mb: 1 }} />
            <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
            <Box display="flex" gap={1} mb={2}>
              <Skeleton variant="rounded" width={60} height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={40} height={24} />
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={60} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </>
);

/**
 * Renders empty state when no quizzes exist
 *
 * @param onCreateQuiz - Callback when create quiz button is clicked
 * @returns JSX element representing empty state
 */
const EmptyState: React.FC<{ onCreateQuiz: () => void }> = ({
  onCreateQuiz,
}) => (
  <Grid size={{ xs: 12 }}>
    <Card
      elevation={0}
      sx={{
        textAlign: "center",
        py: 8,
        bgcolor: "background.default",
        border: "2px dashed",
        borderColor: "divider",
      }}
    >
      <CardContent>
        <SchoolIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Create Your First Quiz
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Get started by creating an interactive quiz with questions, answers,
          and media. Export to PowerPoint when you're ready to present!
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={onCreateQuiz}
          sx={{ mt: 2 }}
        >
          Create Quiz
        </Button>
      </CardContent>
    </Card>
  </Grid>
);

/**
 * QuizGrid Component
 *
 * Renders quizzes in a responsive grid layout with appropriate loading
 * and empty states. Manages the display logic for different states.
 *
 * @param props - Component props
 * @returns JSX element representing the quiz grid
 */
export const QuizGrid: React.FC<QuizGridProps> = ({
  quizzes,
  isLoading,
  onCreateQuiz,
  onMenuOpen,
  onExport,
  onPreview,
}) => {
  /**
   * Renders individual quiz cards
   */
  const renderQuizCards = React.useCallback(() => {
    return quizzes.map((quiz) => (
      <QuizCard
        key={quiz.id}
        quiz={quiz}
        onMenuOpen={onMenuOpen}
        onExport={onExport}
        onPreview={onPreview}
      />
    ));
  }, [quizzes, onMenuOpen, onExport, onPreview]);

  return (
    <Grid container spacing={3}>
      {isLoading ? (
        <LoadingSkeleton />
      ) : quizzes.length === 0 ? (
        <EmptyState onCreateQuiz={onCreateQuiz} />
      ) : (
        renderQuizCards()
      )}
    </Grid>
  );
};

export default QuizGrid;
