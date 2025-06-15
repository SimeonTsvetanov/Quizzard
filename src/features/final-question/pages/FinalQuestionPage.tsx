/**
 * FinalQuestionPage Component
 *
 * Main page component for the Final Question feature.
 * Orchestrates all components and hooks to provide the complete functionality.
 *
 * Responsibilities:
 * - Coordinate between all feature components
 * - Manage overall page layout and structure
 * - Handle integration between hooks and components
 * - Provide snackbar feedback for user actions
 */

import {
  Box,
  Button,
  Snackbar,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSnackbar } from "../../../shared/hooks/useSnackbar";
import { useQuestionGeneration } from "../hooks/useQuestionGeneration";
import { FinalQuestionModal } from "../components";
import { useState, useCallback } from "react";

/**
 * FinalQuestionPage Component
 *
 * The main page component that brings together all the feature pieces.
 * Uses custom hooks for state management and coordinates between components.
 *
 * @returns JSX element for the complete Final Question page
 */
export default function FinalQuestionPage() {
  // Settings state
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [language, setLanguage] = useState("en");
  const [category, setCategory] = useState("");

  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const {
    question,
    generationState,
    modalOpen,
    generateQuestion,
    refreshQuestion,
    closeModal,
  } = useQuestionGeneration();

  /**
   * Handle question generation with feedback
   */
  const handleGenerateQuestion = useCallback(async () => {
    try {
      await generateQuestion(difficulty, category);
      showSnackbar("Question generated successfully!", "success");
    } catch (error) {
      showSnackbar("Error generating question. Please try again.", "error");
    }
  }, [difficulty, category, generateQuestion, showSnackbar]);

  /**
   * Handle question refresh with feedback
   */
  const handleRefreshQuestion = useCallback(async () => {
    try {
      await refreshQuestion();
      showSnackbar("Question refreshed!", "success");
    } catch (error) {
      showSnackbar("Error refreshing question. Please try again.", "error");
    }
  }, [refreshQuestion, showSnackbar]);

  /**
   * Copy question to clipboard
   */
  const handleCopyQuestion = useCallback(async () => {
    if (!question) return;

    try {
      const text = `Question: ${question.question}\nAnswer: ${question.answer}`;
      await navigator.clipboard.writeText(text);
      showSnackbar("Question copied to clipboard! 📋", "success");
    } catch (error) {
      showSnackbar("Failed to copy question", "error");
    }
  }, [question, showSnackbar]);

  /**
   * Clear all settings
   */
  const handleClearAll = useCallback(() => {
    setDifficulty("medium");
    setLanguage("en");
    setCategory("");
    showSnackbar("Settings cleared", "info");
  }, [showSnackbar]);

  return (
    <>
      {/* Full Viewport Container - App-like Layout */}
      <Box
        sx={{
          height: "calc(100vh - 100px)",
          minHeight: "480px",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          overflow: "hidden",
        }}
      >
        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: { xs: 1, sm: 2 },
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: {
                xs: "calc(100vw - 16px)",
                sm: "clamp(280px, 50vw, 600px)",
              },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            {/* Settings Section */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: 2,
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: (theme) => theme.shadows[1],
              }}
            >
              {/* Difficulty Selection */}
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={difficulty}
                  label="Difficulty"
                  onChange={(e) =>
                    setDifficulty(e.target.value as "easy" | "medium" | "hard")
                  }
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>

              {/* Language Selection */}
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  label="Language"
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="bg">Bulgarian</MenuItem>
                </Select>
              </FormControl>

              {/* Category Input */}
              <TextField
                fullWidth
                label="Category (optional)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Leave empty for random category"
              />

              {/* Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  mt: 1,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<HelpOutlineIcon />}
                  onClick={handleGenerateQuestion}
                  disabled={generationState.isGenerating}
                  sx={{
                    px: { xs: 4, sm: 6 },
                    py: { xs: 1.5, sm: 1.25 },
                    fontSize: "clamp(0.8rem, 1.2vw, 0.875rem)",
                    borderRadius: 2,
                    boxShadow: (theme) => theme.shadows[2],
                    "&:hover": {
                      boxShadow: (theme) => theme.shadows[4],
                      transform: "translateY(-1px)",
                      transition: "all 0.2s ease-in-out",
                    },
                    "&:active": {
                      transform: "translateY(0px)",
                    },
                    "&.Mui-disabled": {
                      boxShadow: (theme) => theme.shadows[1],
                      transform: "none",
                    },
                  }}
                  aria-label={
                    generationState.isGenerating
                      ? "Generating question, please wait"
                      : "Generate question"
                  }
                  title={
                    generationState.isGenerating
                      ? "Generating question..."
                      : "Generate a new final question"
                  }
                >
                  {generationState.isGenerating
                    ? "Generating..."
                    : "Generate Question"}
                </Button>

                <Tooltip title="Clear all settings">
                  <IconButton
                    onClick={handleClearAll}
                    color="error"
                    aria-label="Clear all settings"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Question Modal */}
      <FinalQuestionModal
        open={modalOpen}
        question={question}
        isRefreshing={generationState.isRefreshing}
        isGenerating={generationState.isGenerating}
        onClose={closeModal}
        onRefresh={handleRefreshQuestion}
        onCopy={handleCopyQuestion}
      />

      {/* Snackbar for User Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
