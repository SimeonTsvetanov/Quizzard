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
  Slider,
  InputAdornment,
} from "@mui/material";
import {
  Category as CategoryIcon,
  TrendingUp as DifficultyIcon,
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Slider
              min={10}
              max={300}
              step={10}
              value={draftQuiz.defaultTimeLimit ?? 60}
              onChange={(_, value) =>
                updateDraft({ defaultTimeLimit: value as number })
              }
              valueLabelDisplay="auto"
              valueLabelFormat={(v) =>
                `${Math.floor(v / 60)} min ${v % 60 ? (v % 60) + " sec" : ""}`
              }
              sx={{ flex: 1 }}
              aria-label="Default time per question slider"
            />
            <TextField
              type="number"
              size="small"
              label="Seconds"
              inputProps={{ min: 10, max: 300, step: 10 }}
              value={draftQuiz.defaultTimeLimit ?? 60}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val < 10) val = 10;
                if (val > 300) val = 300;
                updateDraft({ defaultTimeLimit: val });
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">sec</InputAdornment>
                ),
              }}
              sx={{ width: 120 }}
              aria-label="Default time per question input"
            />
          </Box>
          <FormHelperText>
            This will be the default time limit for each new question. You can
            override it per question.
          </FormHelperText>
        </Box>
      </Grid>
    </Box>
  );
};
