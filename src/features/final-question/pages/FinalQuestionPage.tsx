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
import { useSnackbar } from "../../../shared/hooks/useSnackbar";

/**
 * Final Question Page Component
 * Displays the final question interface with question generation and display functionality
 */
const FinalQuestionPage = () => {
  const {
    question,
    isLoading,
    error,
    isModalOpen,
    setIsModalOpen,
    generateNewQuestion,
    refreshQuestion,
  } = useQuestionGeneration();

  const { showSnackbar } = useSnackbar();

  const handleGenerateQuestion = async () => {
    try {
      await generateNewQuestion();
      setIsModalOpen(true);
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : "Failed to generate question",
        "error"
      );
    }
  };

  const handleRefreshQuestion = async () => {
    try {
      await refreshQuestion();
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : "Failed to refresh question",
        "error"
      );
    }
  };

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Final Question
        </Typography>

        <Stack spacing={3}>
          {question && (
            <FinalQuestionCard question={question} isRefreshing={isLoading} />
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateQuestion}
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? "Generating..." : "Generate New Question"}
          </Button>
        </Stack>

        <FinalQuestionModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          question={question}
          isRefreshing={isLoading}
          isGenerating={isLoading}
          onRefresh={handleRefreshQuestion}
          onCopy={() => {}}
        />
      </Box>
    </Container>
  );
};

export default FinalQuestionPage;
