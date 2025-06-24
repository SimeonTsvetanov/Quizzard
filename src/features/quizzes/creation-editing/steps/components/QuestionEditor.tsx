/**
 * Question Editor Component (UPDATED FOR NEW SYSTEM)
 *
 * Dedicated component for editing individual quiz questions with support for
 * single answer, multiple choice, and media (image, audio, video) questions.
 * Updated to work with the new round-based question type system.
 *
 * Features:
 * - Round-based question type restrictions
 * - Single answer questions with text input
 * - Multiple choice questions (1-20 answers)
 * - Media upload for picture/audio/video questions
 * - Time limits in minutes with decimal support
 * - Points with decimal support
 * - Improved file type validation
 * - Mobile responsive media display
 *
 * @fileoverview Question editing interface component
 * @version 2.1.0 (Fixed file upload and mobile display)
 * @since December 2025
 */

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  Chip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";

// Types
import type {
  QuizQuestion,
  QuestionType,
  MediaFile,
  RoundType,
} from "../../../types";

// Constants
import { ROUND_TYPE_CONFIG } from "../../../types";

/**
 * Props for the QuestionEditor component
 */
interface QuestionEditorProps {
  /** The question being edited */
  question: QuizQuestion;
  /** Callback when question is updated */
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  /** Round type to determine allowed question types */
  roundType?: RoundType;
}

/**
 * Question Editor Component
 */
export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onUpdate,
  roundType = "mixed",
}) => {
  const roundConfig = ROUND_TYPE_CONFIG[roundType];

  /**
   * Handles file upload for media questions
   */
  const handleMediaUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced file type validation with both MIME types and extensions
    const validTypes = {
      picture: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
        "image/tiff",
        "image/svg+xml",
      ],
      audio: [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "audio/wma",
        "audio/mp4",
        "audio/m4a",
      ],
      video: [
        "video/mp4",
        "video/webm",
        "video/mov",
        "video/quicktime",
        "video/x-msvideo",
        "video/avi",
        "video/wmv",
      ],
    };

    // Get file extension as backup validation
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const validExtensions = {
      picture: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "svg"],
      audio: ["mp3", "wav", "wma", "m4a"],
      video: ["mp4", "mov", "wmv", "avi", "webm"],
    };

    const questionTypeKey = question.type as keyof typeof validTypes;
    const isValidMimeType = validTypes[questionTypeKey]?.includes(file.type);
    const isValidExtension =
      validExtensions[questionTypeKey]?.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      alert(
        `Unsupported file format. Supported formats: ${validExtensions[
          questionTypeKey
        ]?.join(", ")}`
      );
      return;
    }

    // Check file size limits
    const sizeLimits = {
      picture: 10 * 1024 * 1024, // 10MB
      audio: 20 * 1024 * 1024, // 20MB
      video: 100 * 1024 * 1024, // 100MB
    };

    if (file.size > sizeLimits[questionTypeKey]) {
      const limitMB = sizeLimits[questionTypeKey] / (1024 * 1024);
      alert(
        `File too large. Maximum size for ${questionTypeKey} files is ${limitMB}MB`
      );
      return;
    }

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = (ev) => {
      const mediaFile: MediaFile = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        type:
          question.type === "picture"
            ? "image"
            : question.type === "audio"
            ? "audio"
            : "video",
        size: file.size,
        data: ev.target?.result as string,
        mimeType: file.type,
        createdAt: new Date(),
      };
      onUpdate({ mediaFile });
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handles multiple choice option updates
   */
  const updateOption = (index: number, value: string) => {
    const newOptions = [...question.possibleAnswers];
    newOptions[index] = value;
    onUpdate({ possibleAnswers: newOptions });
  };

  /**
   * Adds a new option (max 20)
   */
  const addOption = () => {
    if (question.possibleAnswers.length < 20) {
      onUpdate({ possibleAnswers: [...question.possibleAnswers, ""] });
    }
  };

  /**
   * Removes an option (min 1 for multiple choice, min 0 for single answer)
   */
  const removeOption = (index: number) => {
    const minOptions = question.type === "multiple-choice" ? 2 : 0;
    if (question.possibleAnswers.length > minOptions) {
      const newOptions = question.possibleAnswers.filter((_, i) => i !== index);
      // Update correct answers to remove any that reference the deleted option
      const newCorrectAnswers = question.correctAnswers
        .filter((answerIndex) => answerIndex !== index)
        .map((answerIndex) =>
          answerIndex > index ? answerIndex - 1 : answerIndex
        );
      onUpdate({
        possibleAnswers: newOptions,
        correctAnswers: newCorrectAnswers,
      });
    }
  };

  /**
   * Toggles correct answer selection for multiple choice
   */
  const toggleCorrectAnswer = (index: number) => {
    const currentCorrect = question.correctAnswers || [];
    const isCorrect = currentCorrect.includes(index);

    let newCorrectAnswers;
    if (isCorrect) {
      // Remove from correct answers
      newCorrectAnswers = currentCorrect.filter((i) => i !== index);
    } else {
      // Add to correct answers
      newCorrectAnswers = [...currentCorrect, index].sort();
    }

    onUpdate({ correctAnswers: newCorrectAnswers });
  };

  /**
   * Renders media upload interface with mobile responsive display
   */
  const renderMediaUpload = () => {
    // Show media upload for media question types OR media round types
    const isMediaQuestion = ["picture", "audio", "video"].includes(
      question.type
    );
    const isMediaRound = ["picture", "audio", "video"].includes(
      roundType || ""
    );

    if (!isMediaQuestion && !isMediaRound) {
      return null;
    }

    // Determine media type from question type or round type
    const mediaType = isMediaQuestion ? question.type : roundType;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Media File
        </Typography>
        <Button
          variant="outlined"
          component="label"
          sx={{ mb: 2 }}
          aria-label={`Upload ${mediaType} file`}
        >
          Upload{" "}
          {mediaType && mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
          <input
            type="file"
            accept={
              mediaType === "picture"
                ? ".jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff,.svg"
                : mediaType === "audio"
                ? ".mp3,.wav,.wma,.m4a"
                : ".mp4,.mov,.wmv,.avi,.webm"
            }
            hidden
            onChange={handleMediaUpload}
          />
        </Button>

        {/* Media preview with mobile responsive design */}
        {question.mediaFile && (
          <Box sx={{ mb: 2 }}>
            {mediaType === "picture" && (
              <Box
                component="img"
                src={question.mediaFile.data}
                alt="Question media"
                sx={{
                  maxWidth: "100%",
                  width: "100%",
                  maxHeight: { xs: 200, sm: 300, md: 400 },
                  height: "auto",
                  borderRadius: 2,
                  objectFit: "contain",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            )}
            {mediaType === "audio" && (
              <Box
                component="audio"
                controls
                src={question.mediaFile.data}
                sx={{
                  width: "100%",
                  maxWidth: 400,
                  height: 40,
                }}
              />
            )}
            {mediaType === "video" && (
              <Box
                component="video"
                controls
                src={question.mediaFile.data}
                sx={{
                  maxWidth: "100%",
                  width: "100%",
                  maxHeight: { xs: 200, sm: 300, md: 400 },
                  height: "auto",
                  borderRadius: 2,
                  objectFit: "contain",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            )}
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {question.mediaFile.filename} (
              {(question.mediaFile.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
            <Button
              size="small"
              color="error"
              onClick={() => onUpdate({ mediaFile: undefined })}
              sx={{ mt: 1 }}
            >
              Remove File
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Stack spacing={3} sx={{ mt: 1 }}>
      {/* Question Type Selection for Media Rounds */}
      {(roundType === "picture" ||
        roundType === "audio" ||
        roundType === "video") && (
        <FormControl fullWidth>
          <InputLabel>Question Type</InputLabel>
          <Select
            value={question.type}
            label="Question Type"
            onChange={(e) => {
              const newType = e.target.value as QuestionType;
              const updates: Partial<QuizQuestion> = { type: newType };

              // Reset type-specific fields when changing type
              if (newType === "single-answer") {
                updates.possibleAnswers = [];
                updates.correctAnswers = [];
                updates.correctAnswerText = "";
              } else if (newType === "multiple-choice") {
                updates.possibleAnswers = ["", "", "", ""];
                updates.correctAnswers = [0];
                updates.correctAnswerText = undefined;
              }

              onUpdate(updates);
            }}
          >
            <MenuItem value="single-answer">Single Answer</MenuItem>
            <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
          </Select>
        </FormControl>
      )}

      {/* Question Type Selection for Mixed Rounds */}
      {roundType === "mixed" && (
        <FormControl fullWidth>
          <InputLabel>Question Type</InputLabel>
          <Select
            value={question.type}
            label="Question Type"
            onChange={(e) => {
              const newType = e.target.value as QuestionType;
              const updates: Partial<QuizQuestion> = { type: newType };

              // Reset type-specific fields when changing type
              if (newType === "single-answer") {
                updates.possibleAnswers = [];
                updates.correctAnswers = [];
                updates.correctAnswerText = "";
                updates.mediaFile = undefined;
              } else if (newType === "multiple-choice") {
                updates.possibleAnswers = ["", "", "", ""];
                updates.correctAnswers = [0];
                updates.correctAnswerText = undefined;
                updates.mediaFile = undefined;
              } else {
                // Media types - default to single answer behavior
                updates.possibleAnswers = [];
                updates.correctAnswers = [];
                updates.correctAnswerText = "";
              }

              onUpdate(updates);
            }}
          >
            {roundConfig.allowedQuestionTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type === "single-answer" && "Single Answer"}
                {type === "multiple-choice" && "Multiple Choice"}
                {type === "picture" && "Picture Question"}
                {type === "audio" && "Audio Question"}
                {type === "video" && "Video Question"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Question Text */}
      <TextField
        fullWidth
        label="Question"
        value={question.question || ""}
        onChange={(e) => onUpdate({ question: e.target.value })}
        placeholder="Type your question here..."
      />

      {/* Media Upload */}
      {renderMediaUpload()}

      {/* Answer Configuration */}
      {question.type === "single-answer" ||
      (["picture", "audio", "video"].includes(question.type) &&
        question.possibleAnswers.length === 0) ||
      roundType === "golden-pyramid" ? (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2">
              {roundType === "golden-pyramid"
                ? "Possible Answers"
                : "Correct Answer"}
            </Typography>
            {/* For media questions, show option to switch to multiple choice */}
            {["picture", "audio", "video"].includes(question.type) &&
              roundType !== "golden-pyramid" && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    onUpdate({
                      possibleAnswers: ["", "", "", ""],
                      correctAnswers: [0],
                      correctAnswerText: undefined,
                    });
                  }}
                >
                  Switch to Multiple Choice
                </Button>
              )}
          </Box>
          <TextField
            fullWidth
            label={
              roundType === "golden-pyramid"
                ? "Type all possible answers (separated by commas, dots, etc.)"
                : "Type the correct answer"
            }
            value={question.correctAnswerText || ""}
            onChange={(e) => onUpdate({ correctAnswerText: e.target.value })}
            placeholder={
              roundType === "golden-pyramid"
                ? "e.g., Answer 1, Answer 2, Answer 3, Answer 4"
                : "e.g., Sofia, Paris, 1969..."
            }
            helperText={
              roundType === "golden-pyramid"
                ? "Enter all possible answers as a single text string. Users can separate with commas, dots, or any format they prefer."
                : "This is the exact answer participants need to type"
            }
          />
        </Box>
      ) : (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2">
              Answer Options (1-20 options)
            </Typography>
            {/* For media questions, show option to switch to single answer */}
            {["picture", "audio", "video"].includes(question.type) && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  onUpdate({
                    possibleAnswers: [],
                    correctAnswers: [],
                    correctAnswerText: "",
                  });
                }}
              >
                Switch to Single Answer
              </Button>
            )}
          </Box>
          <Stack spacing={2}>
            {question.possibleAnswers.map((option, index) => (
              <Box
                key={index}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={question.correctAnswers.includes(index)}
                      onChange={() => toggleCorrectAnswer(index)}
                    />
                  }
                  label=""
                />
                <TextField
                  fullWidth
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Enter option ${index + 1}...`}
                />
                {question.possibleAnswers.length > 1 && (
                  <IconButton
                    onClick={() => removeOption(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}

            {question.possibleAnswers.length < 20 && (
              <Button
                startIcon={<AddIcon />}
                onClick={addOption}
                variant="outlined"
                size="small"
              >
                Add Option
              </Button>
            )}
          </Stack>

          {question.correctAnswers.length === 0 && (
            <Typography variant="caption" color="error">
              Please select at least one correct answer
            </Typography>
          )}
        </Box>
      )}

      {/* Question Settings */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          width: "100%",
          flexWrap: "nowrap",
          alignItems: "flex-start",
        }}
      >
        <TextField
          fullWidth
          type="number"
          label="Points"
          placeholder="1"
          inputProps={{ min: 0.1, step: 0.1 }}
          value={question.points || ""}
          onChange={(e) => onUpdate({ points: Number(e.target.value) || 1 })}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <TextField
          fullWidth
          type="number"
          label="Time Limit (min)"
          placeholder="1"
          inputProps={{ min: 0.1, step: 0.1 }}
          value={question.timeLimit || ""}
          onChange={(e) => onUpdate({ timeLimit: Number(e.target.value) || 1 })}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <TextField
          fullWidth
          select
          label="Difficulty"
          value={question.difficulty}
          onChange={(e) => onUpdate({ difficulty: e.target.value as any })}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <MenuItem value="easy">Easy</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="hard">Hard</MenuItem>
        </TextField>
      </Box>

      {/* Explanation */}
      <TextField
        fullWidth
        label="Explanation (optional)"
        multiline
        minRows={2}
        maxRows={3}
        value={question.explanation || ""}
        onChange={(e) => onUpdate({ explanation: e.target.value })}
        placeholder="Optional explanation shown after the question..."
      />
    </Stack>
  );
};
