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
  Alert,
  Chip,
  LinearProgress,
  Collapse,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import WifiIcon from "@mui/icons-material/Wifi";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { useQuestionGeneration } from "../hooks";
import { FinalQuestionModal } from "../components";
import { useSnackbar } from "../../../shared/hooks/useSnackbar";

/**
 * Final Question Page Component
 * Displays the final question interface with settings and AI-powered question generation
 */
const FinalQuestionPage = () => {
  const {
    question,
    isLoading,
    isWaiting,
    statusMessage,
    error,
    isOnline,
    isModalOpen,
    rateLimitInfo,
    sessionQuestionCount,
    setIsModalOpen,
    generateNewQuestion,
    refreshQuestion,
    settings,
    updateSettings,
    clearSettings,
  } = useQuestionGeneration();

  const { showSnackbar } = useSnackbar();

  const handleGenerateQuestion = async () => {
    console.log("🎯 Handle generate question called");

    if (!isOnline) {
      showSnackbar(
        "Internet connection required to generate questions",
        "error"
      );
      return;
    }

    try {
      await generateNewQuestion();
      console.log("✅ Question generation completed");

      // Open modal immediately after successful generation
      // The question state will be updated by the hook
      setIsModalOpen(true);
      console.log("🎉 Modal opened");
    } catch (err) {
      console.error("❌ Error in handleGenerateQuestion:", err);
      showSnackbar(
        err instanceof Error ? err.message : "Failed to generate question",
        "error"
      );
    }
  };

  const handleRefreshQuestion = async () => {
    if (!isOnline) {
      showSnackbar(
        "Internet connection required to refresh questions",
        "error"
      );
      return;
    }

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

  // Get button text based on current state
  const getButtonText = () => {
    if (isWaiting) return "Please Wait...";
    if (isLoading) return "Generating with AI...";
    if (!isOnline) return "Internet Required";
    return "Generate Final Question";
  };

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Final Question
        </Typography>

        {/* Combined Connection Status and Rate Limit */}
        <Box
          display="flex"
          justifyContent="center"
          gap={1}
          mb={2}
          flexWrap="wrap"
        >
          <Chip
            icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
            label={
              isOnline
                ? `Online - AI Ready | ${rateLimitInfo.requestsRemaining}/15 RPM`
                : "Offline - Internet Required"
            }
            color={
              isOnline
                ? rateLimitInfo.isNearLimit
                  ? "warning"
                  : "success"
                : "error"
            }
            variant="outlined"
          />
          {sessionQuestionCount > 0 && (
            <Chip
              label={`Session: ${sessionQuestionCount} question${
                sessionQuestionCount !== 1 ? "s" : ""
              }`}
              color="info"
              variant="outlined"
              size="small"
            />
          )}
        </Box>

        {/* Status Message */}
        <Collapse in={!!statusMessage}>
          <Alert
            severity={isWaiting ? "info" : "success"}
            sx={{ mb: 2 }}
            icon={isWaiting ? <HourglassEmptyIcon /> : undefined}
          >
            {statusMessage}
          </Alert>
        </Collapse>

        {/* Loading Progress */}
        {(isLoading || isWaiting) && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant={isWaiting ? "indeterminate" : "query"}
              color={isWaiting ? "warning" : "primary"}
            />
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Offline Warning */}
        {!isOnline && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Internet connection is required to generate questions using AI.
            Please check your connection and try again.
          </Alert>
        )}

        {/* Rate Limit Warning */}
        {rateLimitInfo.isNearLimit && isOnline && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You're approaching the rate limit ({rateLimitInfo.requestsRemaining}{" "}
            requests remaining).
            {rateLimitInfo.timeUntilReset > 0 &&
              ` Limit resets in ${Math.floor(
                rateLimitInfo.timeUntilReset / 60
              )}:${(rateLimitInfo.timeUntilReset % 60)
                .toString()
                .padStart(2, "0")}.`}
          </Alert>
        )}

        {/* Single Card with Settings and Generate Button */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 2,
            maxWidth: 600,
            mx: "auto",
            opacity: isWaiting ? 0.8 : 1,
            transition: "opacity 0.3s ease",
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
              AI Question Settings
            </Typography>
            <Tooltip title="Clear all settings">
              <IconButton
                onClick={handleClearAll}
                color="error"
                size="small"
                aria-label="Clear all settings"
                disabled={isLoading || isWaiting}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Stack spacing={3}>
            {/* Difficulty Selection */}
            <FormControl fullWidth disabled={isLoading || isWaiting}>
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
            <FormControl fullWidth disabled={isLoading || isWaiting}>
              <InputLabel id="language-label">Language</InputLabel>
              <Select
                labelId="language-label"
                value={settings.language || ""}
                label="Language"
                onChange={(e) => updateSettings({ language: e.target.value })}
              >
                <MenuItem value="">English (Default)</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Bulgarian">Bulgarian</MenuItem>
              </Select>
            </FormControl>

            {/* Category Input */}
            <TextField
              fullWidth
              label="Category (optional)"
              placeholder="e.g., Science, History, Sports..."
              value={settings.category || ""}
              onChange={(e) => updateSettings({ category: e.target.value })}
              helperText="Leave empty for random category"
              disabled={isLoading || isWaiting}
            />

            {/* Generate Button */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateQuestion}
              disabled={isLoading || isWaiting || !isOnline}
              fullWidth
              size="large"
              sx={{
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                mt: 2,
              }}
            >
              {getButtonText()}
            </Button>

            {/* AI Info */}
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ mt: 1 }}
            >
              Powered by Google Gemini AI • Supports English & Bulgarian
              {isOnline && (
                <>
                  <br />
                  Rate limit: 15 requests/minute • Smart duplicate prevention
                </>
              )}
            </Typography>
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
