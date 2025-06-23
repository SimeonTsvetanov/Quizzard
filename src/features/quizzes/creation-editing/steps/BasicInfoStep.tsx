/**
 * Basic Info Step Component
 *
 * First step of the quiz creation wizard for collecting basic quiz information
 * including title, description, category, difficulty, and author details.
 *
 * Features:
 * - Mobile-first responsive form layout
 * - Real-time validation feedback
 * - Auto-save draft functionality
 * - Category and difficulty selection
 * - Character count indicators
 *
 * @fileoverview Basic information step for quiz creation wizard
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Chip,
  FormHelperText,
  InputAdornment,
  Button,
} from "@mui/material";
import {
  Category as CategoryIcon,
  TrendingUp as DifficultyIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import type {
  Quiz,
  QuizValidation,
  QuizCategory,
  QuizDifficulty,
} from "../../types";
import { QUIZ_CONSTANTS } from "../../types";

/**
 * Props for the BasicInfoStep component
 */
interface BasicInfoStepProps {
  /** Current draft quiz data */
  draftQuiz: Partial<Quiz>;
  /** Function to update draft quiz data */
  updateDraft: (updates: Partial<Quiz>) => void;
  /** Current validation state */
  validation: QuizValidation;
  /** Function to handle quiz deletion (only shown when editing) */
  onDeleteQuiz?: () => void;
  /** Whether this is edit mode (to show delete button) */
  isEditMode?: boolean;
  /** Function to handle continuing to questions section */
  onContinue?: () => void;
}

/**
 * Available quiz categories with display labels
 */
const QUIZ_CATEGORIES: Array<{
  value: QuizCategory;
  label: string;
  description: string;
}> = [
  {
    value: "general",
    label: "General Knowledge",
    description: "Mixed topics and trivia",
  },
  {
    value: "sports",
    label: "Sports",
    description: "Sports, teams, and athletics",
  },
  {
    value: "history",
    label: "History",
    description: "Historical events and figures",
  },
  {
    value: "science",
    label: "Science",
    description: "Science, technology, and nature",
  },
  {
    value: "geography",
    label: "Geography",
    description: "Countries, capitals, and locations",
  },
  {
    value: "entertainment",
    label: "Entertainment",
    description: "Movies, TV, and celebrities",
  },
  {
    value: "literature",
    label: "Literature",
    description: "Books, authors, and poetry",
  },
  {
    value: "art",
    label: "Art",
    description: "Visual arts, paintings, and artists",
  },
  {
    value: "music",
    label: "Music",
    description: "Songs, artists, and musical theory",
  },
  {
    value: "technology",
    label: "Technology",
    description: "Computers, software, and gadgets",
  },
  { value: "custom", label: "Custom", description: "Your own custom category" },
];

/**
 * Available difficulty levels with descriptions
 */
const DIFFICULTY_LEVELS: Array<{
  value: QuizDifficulty;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: "easy",
    label: "Easy",
    description: "Simple questions for beginners",
    color: "success",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Moderate difficulty questions",
    color: "warning",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Challenging questions for experts",
    color: "error",
  },
];

/**
 * Basic Info Step Component
 *
 * Collects fundamental quiz information in a user-friendly form.
 * Provides real-time validation and helpful hints for quiz creation.
 *
 * @param props - Component props
 * @returns JSX element representing the basic info step
 */
export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  draftQuiz,
  updateDraft,
  validation,
  onDeleteQuiz,
  isEditMode,
  onContinue,
}) => {
  /**
   * Gets error message for a specific field
   */
  const getFieldError = React.useCallback(
    (fieldName: string): string | undefined => {
      return validation.errors.find((error) =>
        error.toLowerCase().includes(fieldName.toLowerCase())
      );
    },
    [validation.errors]
  );

  const timeValue = draftQuiz.defaultTimeLimit;
  const displayTime = timeValue === undefined ? "" : Math.round(timeValue / 60);
  const timeForValidation = timeValue ?? 60; // 60 seconds = 1 minute
  const isTimeValid = timeForValidation > 0 && timeForValidation <= 3600; // 1 second to 60 minutes

  const getTimeError = () => {
    if (timeValue !== undefined && !isTimeValid) {
      if (timeValue <= 0) return "Time must be > 0 minutes.";
      if (timeValue > 3600) return "Time must be <= 60 minutes.";
    }
    return undefined;
  };

  const timeError = getTimeError();

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <Grid container spacing={4}>
        {/* Quiz Title */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            id="quiz-title"
            name="title"
            label="Quiz Title"
            placeholder="e.g., General Knowledge Quiz, Science Facts Challenge"
            value={draftQuiz.title || ""}
            onChange={(e) => updateDraft({ title: e.target.value })}
            error={!!getFieldError("title")}
            helperText={
              getFieldError("title") ||
              `${(draftQuiz.title || "").length}/${
                QUIZ_CONSTANTS.MAX_TITLE_LENGTH
              } characters`
            }
            inputProps={{
              maxLength: QUIZ_CONSTANTS.MAX_TITLE_LENGTH,
              "aria-label": "Quiz title",
            }}
            size="medium"
            sx={{ mb: 3 }}
          />
        </Grid>

        {/* Quiz Description */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            id="quiz-description"
            name="description"
            multiline
            rows={4}
            label="Description (Optional)"
            placeholder="Brief description of what this quiz covers..."
            value={draftQuiz.description || ""}
            onChange={(e) => updateDraft({ description: e.target.value })}
            helperText={`${draftQuiz.description?.length || 0}/500 characters`}
            inputProps={{
              maxLength: 500,
            }}
            size="medium"
            sx={{ mb: 3 }}
          />
        </Grid>

        {/* Author and Category row */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl
            fullWidth
            error={!!getFieldError("category")}
            size="medium"
          >
            <InputLabel>Quiz Category</InputLabel>
            <Select
              id="quiz-category"
              name="category"
              value={draftQuiz.category || "general"}
              onChange={(e) =>
                updateDraft({ category: e.target.value as QuizCategory })
              }
              label="Quiz Category"
              aria-label="Quiz category selection"
              startAdornment={
                <CategoryIcon sx={{ mr: 1, color: "text.secondary" }} />
              }
            >
              {QUIZ_CATEGORIES.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  <Box>
                    <Typography variant="body1">{category.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {getFieldError("category") ||
                "Choose the main topic of your quiz"}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Difficulty Level */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl
            fullWidth
            error={!!getFieldError("difficulty")}
            size="medium"
          >
            <InputLabel>Difficulty Level</InputLabel>
            <Select
              id="quiz-difficulty"
              name="difficulty"
              value={draftQuiz.difficulty || "medium"}
              onChange={(e) =>
                updateDraft({
                  difficulty: e.target.value as QuizDifficulty,
                })
              }
              label="Difficulty Level"
              aria-label="Difficulty level selection"
              startAdornment={
                <DifficultyIcon sx={{ mr: 1, color: "text.secondary" }} />
              }
            >
              {DIFFICULTY_LEVELS.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Chip
                      label={level.label}
                      size="small"
                      color={level.color as any}
                      variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {level.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {getFieldError("difficulty") ||
                "Set the challenge level for your quiz"}
            </FormHelperText>
          </FormControl>
        </Grid>

        <Box sx={{ mt: 3, width: "100%" }}>
          <Typography gutterBottom>Default Time Per Question</Typography>
          <TextField
            fullWidth
            type="number"
            label="1 Minute by Default"
            placeholder="1 Minute by Default"
            value={displayTime}
            onChange={(e) => {
              const val = e.target.value;
              updateDraft({
                defaultTimeLimit: val === "" ? undefined : Number(val) * 60,
              });
            }}
            error={!!timeError}
            helperText={
              timeError ||
              "This will be the default time limit for each new question. You can override it per question."
            }
            inputProps={{
              step: 0.5,
              min: 0.1,
              "aria-label": "Default time per question in minutes",
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">minutes</InputAdornment>
              ),
            }}
            size="medium"
            sx={{
              mb: 1,
              "& .MuiOutlinedInput-root": {
                "&.Mui-error fieldset": {
                  borderColor: "error.main",
                },
              },
            }}
          />
        </Box>
      </Grid>

      {/* Delete and Continue Buttons Row */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Delete Button - only show when editing */}
        {isEditMode && onDeleteQuiz && (
          <Button
            variant="outlined"
            color="error"
            onClick={onDeleteQuiz}
            startIcon={<DeleteIcon />}
            size="large"
            sx={{
              minWidth: { xs: "auto", sm: 150 },
              height: 48,
              borderColor: "error.main",
              color: "error.main",
              "&:hover": {
                borderColor: "error.dark",
                backgroundColor: "error.light",
                color: "error.dark",
              },
              // Mobile: Show only icon
              "& .MuiButton-startIcon": {
                margin: { xs: 0, sm: "0 8px 0 -4px" },
              },
              "& .MuiButton-startIcon + *": {
                display: { xs: "none", sm: "inline" },
              },
            }}
          >
            <Box
              component="span"
              sx={{
                display: { xs: "none", sm: "inline" },
              }}
            >
              Delete Quiz
            </Box>
          </Button>
        )}

        {/* Spacer to center the Continue button when no delete button */}
        {!isEditMode && <Box />}

        {/* Continue to Questions Button - always centered */}
        <Button
          variant="contained"
          onClick={onContinue}
          disabled={!draftQuiz.title?.trim() || !isTimeValid}
          size="large"
          sx={{
            minWidth: { xs: 120, sm: 200 },
            height: 48,
            boxShadow: 2,
            "&:hover": {
              boxShadow: 4,
            },
          }}
        >
          <Box
            component="span"
            sx={{
              display: { xs: "none", sm: "inline" },
            }}
          >
            Continue to Questions
          </Box>
          <Box
            component="span"
            sx={{
              display: { xs: "inline", sm: "none" },
            }}
          >
            Continue
          </Box>
        </Button>
      </Box>
    </Box>
  );
};
