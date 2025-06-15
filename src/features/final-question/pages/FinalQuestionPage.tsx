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
  Container,
  Typography,
  Stack,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSnackbar } from "../../../shared/hooks/useSnackbar";
import { useQuestionGeneration } from "../hooks";
import { FinalQuestionCard, FinalQuestionModal } from "../components";
import type { Question } from "../types";
import { useState, useCallback } from "react";

/**
 * FinalQuestionPage Component
 *
 * The main page component that brings together all the feature pieces.
 * Uses custom hooks for state management and coordinates between components.
 *
 * @returns JSX element for the complete Final Question page
 */
const FinalQuestionPage = () => {
  const {
    question,
    isLoading,
    error,
    settings,
    isModalOpen,
    setIsModalOpen,
    generateQuestion,
    refreshQuestion,
    updateSettings,
    clearSettings,
  } = useQuestionGeneration();

  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  /**
   * Handle question generation with feedback
   */
  const handleGenerateQuestion = useCallback(async () => {
    try {
      await generateQuestion();
      showSnackbar("Question generated successfully!", "success");
    } catch (error) {
      showSnackbar("Error generating question. Please try again.", "error");
    }
  }, [generateQuestion, showSnackbar]);

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
    clearSettings();
    showSnackbar("Settings cleared", "info");
  }, [clearSettings, showSnackbar]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Final Question
        </Typography>

        <Stack spacing={2} width="100%" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateQuestion}
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? "Generating..." : "Generate Question"}
          </Button>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {question && (
            <FinalQuestionCard
              question={question}
              onRefresh={handleRefreshQuestion}
              isLoading={isLoading}
            />
          )}
        </Stack>

        <FinalQuestionModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          question={question}
          onRefresh={handleRefreshQuestion}
          isLoading={isLoading}
        />
      </Box>

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
    </Container>
  );
};

export default FinalQuestionPage;
