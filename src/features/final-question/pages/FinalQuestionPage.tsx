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

import { Box, Container, Typography, Button, Stack } from "@mui/material";
import { useQuestionGeneration } from "../hooks";
import { FinalQuestionCard, FinalQuestionModal } from "../components";
import type { Question } from "../types";
import { useSnackbar } from "../../../shared/hooks/useSnackbar";
import { useCallback } from "react";

/**
 * Final Question page component
 * Displays the final question generation interface
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
      showSnackbar("Question refreshed successfully!", "success");
    } catch (error) {
      showSnackbar("Error refreshing question. Please try again.", "error");
    }
  }, [refreshQuestion, showSnackbar]);

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

        {snackbar}
      </Box>
    </Container>
  );
};

export default FinalQuestionPage;
