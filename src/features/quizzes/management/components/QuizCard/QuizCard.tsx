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
  Chip,
  Avatar,
  IconButton,
  Box,
  Zoom,
} from "@mui/material";
import {
  Quiz as QuizIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Category as CategoryIcon,
  TrendingUp as DifficultyIcon,
} from "@mui/icons-material";
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
  onExport: (quiz: Quiz) => void;
  /** Callback when quiz preview is requested */
  onPreview?: (quiz: Quiz) => void;
}

/**
 * Gets the appropriate color for difficulty chips
 *
 * @param difficulty - Quiz difficulty level
 * @returns Material-UI color string for the chip
 */
const getDifficultyColor = (
  difficulty: string
): "success" | "warning" | "error" => {
  switch (difficulty) {
    case "easy":
      return "success";
    case "hard":
      return "error";
    default:
      return "warning";
  }
};

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
}) => {
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
   * Handles export action
   */
  const handleExport = React.useCallback(() => {
    onExport(quiz);
  }, [quiz, onExport]);

  /**
   * Handles menu opening
   */
  const handleMenuOpen = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      onMenuOpen(event, quiz);
    },
    [quiz, onMenuOpen]
  );

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={quiz.id}>
      <Zoom in timeout={300}>
        <Card
          elevation={2}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.3s ease",
            "&:hover": {
              elevation: 4,
              transform: "translateY(-2px)",
            },
          }}
        >
          <CardContent sx={{ flex: 1 }}>
            {/* Quiz header */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={2}
            >
              <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                <QuizIcon />
              </Avatar>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                aria-label="Quiz options"
              >
                <MoreVertIcon />
              </IconButton>
            </Box>

            {/* Quiz title and description */}
            <Typography variant="h6" component="h3" gutterBottom noWrap>
              {(() => {
                const title = quiz.title;
                if (typeof title === "string") {
                  return title;
                }
                return "Untitled Quiz";
              })()}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {(() => {
                const desc = quiz.description;
                if (typeof desc === "string") {
                  return desc || "No description provided";
                }
                return "No description provided";
              })()}
            </Typography>

            {/* Quiz metadata chips */}
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              <Chip
                size="small"
                label={(() => {
                  const diff = quiz.difficulty;
                  if (
                    typeof diff === "string" &&
                    ["easy", "medium", "hard"].includes(diff)
                  ) {
                    return diff;
                  }
                  return "medium";
                })()}
                color={getDifficultyColor(
                  (() => {
                    const diff = quiz.difficulty;
                    if (
                      typeof diff === "string" &&
                      ["easy", "medium", "hard"].includes(diff)
                    ) {
                      return diff;
                    }
                    return "medium";
                  })()
                )}
                variant="outlined"
                icon={<DifficultyIcon fontSize="small" />}
              />
              <Chip
                size="small"
                label={(() => {
                  const cat = quiz.category;
                  if (typeof cat === "string") {
                    return cat;
                  }
                  return "general";
                })()}
                variant="outlined"
                icon={<CategoryIcon fontSize="small" />}
              />
              <Chip
                size="small"
                label={`${(() => {
                  const rounds = quiz.rounds;
                  if (Array.isArray(rounds)) {
                    return (
                      rounds.flatMap((r) => r?.questions || []).length || 0
                    );
                  }
                  return 0;
                })()} Q`}
                variant="outlined"
                icon={<QuizIcon fontSize="small" />}
              />
            </Box>

            {/* Quiz stats */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  ~
                  {(() => {
                    const duration = quiz.estimatedDuration;
                    if (typeof duration === "number" && !isNaN(duration)) {
                      return Math.max(1, Math.min(1000, duration));
                    }
                    if (duration && typeof duration.valueOf === "function") {
                      const value = duration.valueOf();
                      if (typeof value === "number" && !isNaN(value)) {
                        return Math.max(1, Math.min(1000, value));
                      }
                    }
                    return 10; // Default fallback
                  })()}
                  m
                </Typography>
              </Box>
            </Box>
          </CardContent>

          <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
            <Button
              size="small"
              startIcon={<PlayIcon />}
              onClick={handlePreview}
            >
              Preview
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
          </CardActions>
        </Card>
      </Zoom>
    </Grid>
  );
};

export default QuizCard;
