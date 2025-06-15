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
  Container,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQuestionGeneration } from "../hooks";
import { FinalQuestionModal } from "../components";
import { useSnackbar } from "../../../shared/hooks/useSnackbar";

/**
 * Final Question Page Component
 * Displays the final question interface with settings and question generation functionality
 */
const FinalQuestionPage = () => {
  const {
    question,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    generateNewQuestion,
    refreshQuestion,
    settings,
    updateSettings,
    clearSettings,
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

  const handleClearAll = () => {
    clearSettings();
    showSnackbar("Settings cleared", "info");
  };

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Final Question
        </Typography>

        {/* Single Card with Settings and Generate Button */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 2,
            maxWidth: 600,
            mx: "auto",
          }}
        >
          {/* Settings Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            <Typography variant="h6" component="h2">
              Settings
            </Typography>
            <Tooltip title="Clear all settings">
              <IconButton
                onClick={handleClearAll}
                color="error"
                size="small"
                aria-label="Clear all settings"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Stack spacing={3}>
            {/* Difficulty Selection */}
            <FormControl fullWidth>
              <InputLabel id="difficulty-label">Difficulty</InputLabel>
              <Select
                labelId="difficulty-label"
                value={settings.difficulty || ""}
                label="Difficulty"
                onChange={(e) => updateSettings({ difficulty: e.target.value })}
              >
                <MenuItem value="">Random</MenuItem>
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>

            {/* Language Selection */}
            <FormControl fullWidth>
              <InputLabel id="language-label">Language</InputLabel>
              <Select
                labelId="language-label"
                value={settings.language || ""}
                label="Language"
                onChange={(e) => updateSettings({ language: e.target.value })}
              >
                <MenuItem value="">Default</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>

            {/* Category Input */}
            <TextField
              fullWidth
              label="Category (optional)"
              placeholder="e.g., Science, History, Sports..."
              value={settings.category || ""}
              onChange={(e) =>
                updateSettings({ category: e.target.value as any })
              }
              helperText="Leave empty for random category"
            />

            {/* Generate Button */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateQuestion}
              disabled={isLoading}
              fullWidth
              size="large"
              sx={{
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                mt: 2,
              }}
            >
              {isLoading ? "Generating..." : "Generate Final Question"}
            </Button>
          </Stack>
        </Paper>

        {/* Modal */}
        <FinalQuestionModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          question={question}
          isRefreshing={isLoading}
          isGenerating={isLoading}
          onRefresh={handleRefreshQuestion}
          onCopy={() => {
            if (question) {
              navigator.clipboard.writeText(
                `Q: ${question.question}\nA: ${question.answer}`
              );
              showSnackbar("Question copied to clipboard!", "success");
            }
          }}
        />
      </Box>
    </Container>
  );
};

export default FinalQuestionPage;
