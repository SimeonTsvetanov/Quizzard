/**
 * Quiz Card Component
 *
 * Displays individual quiz information in a card format with metadata,
 * actions, and hover effects. Extracted from the monolithic Quizzes.tsx
 * to improve maintainability and follow Single Responsibility Principle.
 *
 * Features:
 * - Quiz metadata display (title, description, category, difficulty)
 * - Action buttons (Preview, Export)
 * - Menu actions (Edit, Export, Delete)
 * - Hover animations and responsive design
 * - Quiz statistics and duration
 *
 * @fileoverview Individual quiz card component
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  Zoom,
  Stack,
} from "@mui/material";
import {
  Quiz as QuizIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Category as CategoryIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { ExportFormatDialog } from "../../../exporting/components";
import type { Quiz } from "../../types";

/**
 * Props for the QuizCard component
 */
export interface QuizCardProps {
  /** Quiz data to display */
  quiz: Quiz;
  /** Callback when quiz menu is opened */
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, quiz: Quiz) => void;
  /** Callback when quiz export is requested */
  onExport: (quiz: Quiz, format: "powerpoint" | "slides" | "json") => void;
  /** Callback when quiz preview is requested */
  onPreview?: (quiz: Quiz) => void;
  /** Callback when quiz edit is requested */
  onEdit: (quiz: Quiz) => void;
}

/**
 * QuizCard Component
 *
 * Renders an individual quiz as a card with all relevant information
 * and action buttons. Includes hover effects and responsive design.
 *
 * @param props - Component props
 * @returns JSX element representing a quiz card
 */
export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onMenuOpen,
  onExport,
  onPreview,
  onEdit,
}) => {
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);

  /**
   * Handles preview action with optional callback
   */
  const handlePreview = React.useCallback(() => {
    if (onPreview) {
      onPreview(quiz);
    } else {
      console.log("Preview quiz:", quiz.id);
    }
  }, [quiz, onPreview]);

  /**
   * Handles export button click
   */
  const handleExportClick = React.useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  /**
   * Handles export format selection
   */
  const handleExportFormat = React.useCallback(
    (format: "powerpoint" | "slides" | "json") => {
      onExport(quiz, format);
    },
    [quiz, onExport]
  );

  /**
   * Handles edit action
   */
  const handleEdit = React.useCallback(() => {
    onEdit(quiz);
  }, [quiz, onEdit]);

  /**
   * Handles menu opening
   */
  const handleMenuOpen = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      onMenuOpen(event, quiz);
    },
    [quiz, onMenuOpen]
  );

  const totalQuestions = React.useMemo(() => {
    return quiz.rounds?.flatMap((r) => r?.questions || []).length || 0;
  }, [quiz.rounds]);

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={quiz.id}>
      <Zoom in timeout={300}>
        <Card
          elevation={2}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.3s ease",
            "&:hover": {
              elevation: 4,
              transform: "translateY(-2px)",
            },
          }}
        >
          <Box>
            <CardContent sx={{ pb: 1 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography
                  variant="h5"
                  component="h3"
                  fontWeight="bold"
                  noWrap
                >
                  {quiz.title || "Untitled Quiz"}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  aria-label="More options"
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  height: "40px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {quiz.description || "No description provided."}
              </Typography>

              <Box
                display="flex"
                alignItems="center"
                gap={2}
                color="text.secondary"
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ScheduleIcon fontSize="small" />
                  <Typography variant="caption">
                    {quiz.estimatedDuration || "10"} min
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CategoryIcon fontSize="small" />
                  <Typography variant="caption">
                    {quiz.rounds?.length || 0} Rounds
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <QuizIcon fontSize="small" />
                  <Typography variant="caption">
                    {totalQuestions} Questions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Box>

          <CardActions sx={{ p: 2, pt: 1 }}>
            <Stack direction="row" spacing={1} width="100%">
              <Button
                variant="contained"
                size="medium"
                startIcon={<PlayIcon />}
                onClick={handlePreview}
                sx={{ flex: 1 }}
              >
                Play
              </Button>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ flex: 1 }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                size="medium"
                startIcon={<DownloadIcon />}
                onClick={handleExportClick}
                sx={{ flex: 1 }}
              >
                Export
              </Button>
            </Stack>
          </CardActions>
        </Card>
      </Zoom>

      {/* Export Format Dialog */}
      <ExportFormatDialog
        open={exportDialogOpen}
        quiz={quiz}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExportFormat}
      />
    </Grid>
  );
};

export default QuizCard;
