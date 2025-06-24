/**
 * Quizzes Main Page Component (REFACTORED + INDEXED DB)
 *
 * Primary interface for the Quizzes feature providing quiz creation, management,
 * and export functionality. Enhanced with IndexedDB storage, auto-save, and
 * storage monitoring capabilities.
 *
 * REFACTORING CHANGES:
 * - Extracted QuizCard component for individual quiz display
 * - Extracted QuizGrid component for layout and state management
 * - Extracted QuizActions component for interactions and modals
 * - Extracted useQuizzesPageState hook for state management
 * - Maintained 100% functionality and styling compatibility
 * - Improved maintainability and testability
 *
 * STORAGE ENHANCEMENTS:
 * - IndexedDB storage with localStorage fallback
 * - Auto-save functionality for drafts
 * - Storage usage monitoring and warnings
 * - 500MB storage capacity with media file support
 * - Draft management with cleanup
 *
 * Features:
 * - Quiz creation wizard integration
 * - Quiz library management and search
 * - PowerPoint export functionality
 * - Mobile-first responsive design
 * - Beautiful dashboard interface
 * - Quiz statistics and analytics
 * - Storage status monitoring
 *
 * @fileoverview Enhanced main page component with IndexedDB storage
 * @version 3.0.0 (IndexedDB Enhanced)
 * @since December 2025
 */

import React from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import { QuizGrid, QuizActions } from "../management/components";
import { StorageModal } from "../management/components/StorageStatus";
import { useQuizzesPageStateWithStorage } from "../management/hooks";
import type { QuizzesPageProps } from "../types";
import type { Quiz, QuizCategory, QuizDifficulty, Round } from "../types";
import { ErrorBoundary } from "../../../shared/components";
import { useGoogleAuth } from "../../../shared/hooks/useGoogleAuth";

/**
 * Main Quizzes Page Component (ENHANCED WITH STORAGE)
 *
 * Provides comprehensive quiz management interface using extracted components
 * and hooks with IndexedDB storage capabilities. Now includes storage monitoring
 * and auto-save functionality.
 *
 * @returns JSX element representing the quizzes page
 */
export const Quizzes: React.FC<QuizzesPageProps> = () => {
  const { isAuthenticated } = useGoogleAuth();

  /**
   * Robust reload mechanism for quiz deletion
   *
   * When a quiz is deleted (from any source), increment reloadKey to force the
   * useQuizzesPageStateWithStorage hook to re-fetch quizzes and drafts from storage.
   * This ensures the UI always reflects the latest state and prevents ghost quizzes.
   */
  const [reloadKey, setReloadKey] = React.useState(0);
  const reloadQuizzes = React.useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  // Use storage-enhanced state management hook, pass reloadQuizzes as onQuizDeleted
  const { quizzes, drafts, isLoading, error, state, actions, storageUsage } =
    useQuizzesPageStateWithStorage(reloadQuizzes, reloadKey);

  // Storage modal state
  const [storageModalOpen, setStorageModalOpen] = React.useState(false);

  // Helper to get the full quiz object by ID (from quizzes or drafts)
  const getFullQuizObject = React.useCallback(
    (quizId: string) => {
      const allOriginalQuizzes: (Quiz | Partial<Quiz>)[] = [
        ...quizzes,
        ...drafts,
      ];
      return allOriginalQuizzes.find(
        (q) => q && String(q.id) === String(quizId)
      );
    },
    [quizzes, drafts]
  );

  const handleExportWrapper = React.useCallback(
    (quiz: Quiz) => {
      const fullQuiz = getFullQuizObject(quiz.id);
      if (fullQuiz) {
        actions.handleExportQuiz(fullQuiz as Quiz);
      } else {
        console.error(
          `Could not find full quiz object with id: ${quiz.id} for export.`
        );
      }
    },
    [actions, getFullQuizObject]
  );

  const handleEditWrapper = React.useCallback(
    (quiz: Quiz) => {
      const fullQuiz = getFullQuizObject(quiz.id);
      if (fullQuiz) {
        actions.handleEditQuiz(fullQuiz as Quiz);
      } else {
        console.error(
          `Could not find full quiz object with id: ${quiz.id} for edit.`
        );
      }
    },
    [actions, getFullQuizObject]
  );

  const handleMenuOpenWrapper = React.useCallback(
    (event: React.MouseEvent<HTMLElement>, quiz: Quiz) => {
      const fullQuiz = getFullQuizObject(quiz.id);
      if (fullQuiz) {
        actions.handleMenuOpen(event, fullQuiz as Quiz);
      } else {
        console.error(
          `Could not find full quiz object with id: ${quiz.id} for menu.`
        );
      }
    },
    [actions, getFullQuizObject]
  );

  // Combine quizzes and drafts for display
  const allQuizzes = React.useMemo(() => {
    // Helper to validate category
    const validCategories: QuizCategory[] = [
      "general",
      "sports",
      "history",
      "science",
      "geography",
      "entertainment",
      "literature",
      "art",
      "music",
      "technology",
      "custom",
    ];
    const sanitizeCategory = (cat: unknown): QuizCategory => {
      if (
        typeof cat === "string" &&
        validCategories.includes(cat as QuizCategory)
      ) {
        return cat as QuizCategory;
      }
      return "general";
    };

    // Helper to sanitize difficulty
    const sanitizeDifficulty = (diff: unknown): QuizDifficulty => {
      if (
        typeof diff === "string" &&
        ["easy", "medium", "hard"].includes(diff)
      ) {
        return diff as QuizDifficulty;
      }
      return "medium";
    };

    // Helper to sanitize estimated duration
    const sanitizeDuration = (duration: unknown): number => {
      if (typeof duration === "number" && !isNaN(duration)) {
        return Math.max(1, Math.min(1000, duration)); // Clamp between 1-1000 minutes
      }
      if (
        duration &&
        typeof duration === "object" &&
        "valueOf" in duration &&
        typeof duration.valueOf === "function"
      ) {
        const value = duration.valueOf();
        if (typeof value === "number" && !isNaN(value)) {
          return Math.max(1, Math.min(1000, value));
        }
      }
      return 10; // Default 10 minutes
    };

    // Helper to sanitize dates
    const sanitizeDate = (date: unknown): Date => {
      if (date instanceof Date) {
        return date;
      }
      if (typeof date === "string" || typeof date === "number") {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      return new Date();
    };

    // Helper to sanitize settings
    const sanitizeSettings = (settings: unknown) => {
      const defaultSettings = {
        defaultTimeLimit: 1,
        defaultPoints: 1,
        defaultBreakingTime: 5,
      };

      if (settings && typeof settings === "object") {
        const settingsObj = settings as Record<string, unknown>;
        return {
          defaultTimeLimit:
            typeof settingsObj.defaultTimeLimit === "number"
              ? settingsObj.defaultTimeLimit
              : defaultSettings.defaultTimeLimit,
          defaultPoints:
            typeof settingsObj.defaultPoints === "number"
              ? settingsObj.defaultPoints
              : defaultSettings.defaultPoints,
          defaultBreakingTime:
            typeof settingsObj.defaultBreakingTime === "number"
              ? settingsObj.defaultBreakingTime
              : defaultSettings.defaultBreakingTime,
        };
      }
      return defaultSettings;
    };

    // Helper to sanitize rounds
    const sanitizeRounds = (rounds: unknown): Round[] => {
      if (Array.isArray(rounds)) {
        return rounds.filter(
          (round) => round && typeof round === "object"
        ) as Round[];
      }
      return [];
    };

    // Helper to sanitize tags
    const sanitizeTags = (tags: unknown): string[] => {
      if (Array.isArray(tags)) {
        return tags.filter((tag) => typeof tag === "string").slice(0, 10); // Limit to 10 tags
      }
      return [];
    };

    const defaultSettings = {
      defaultTimeLimit: 1,
      defaultPoints: 1,
      defaultBreakingTime: 5,
    };

    // Convert drafts to Quiz format with isDraft flag
    const draftQuizzes = drafts
      .filter((draft) => draft && draft.id && draft.title)
      .map((draft) => ({
        ...draft,
        id: String(draft.id || ""),
        title: String(draft.title || "Untitled Draft"),
        description: String(draft.description || "Draft quiz in progress..."),
        rounds: sanitizeRounds(draft.rounds),
        category: sanitizeCategory(draft.category),
        difficulty: sanitizeDifficulty(draft.difficulty),
        tags: sanitizeTags((draft as unknown as Record<string, unknown>).tags),
        status: "draft" as const,
        createdAt: sanitizeDate(draft.createdAt),
        updatedAt: sanitizeDate(draft.updatedAt),
        isDraft: true,
        estimatedDuration: sanitizeDuration(draft.estimatedDuration),
        settings: sanitizeSettings(draft.settings),
      }));

    // Filter out any draft whose ID matches a quiz (prevents ghost/duplicate quizzes)
    const quizIds = new Set(quizzes.map((q) => String(q.id)));
    const filteredDraftQuizzes = draftQuizzes.filter(
      (draft) => !quizIds.has(draft.id)
    );

    // Combine and sort by most recently updated
    return [...quizzes, ...filteredDraftQuizzes]
      .map((q) => ({
        ...q,
        id: String(q.id || ""),
        title: String(q.title || "Untitled Quiz"),
        description: String(q.description || ""),
        rounds: sanitizeRounds(q.rounds),
        estimatedDuration: sanitizeDuration(q.estimatedDuration),
        createdAt: sanitizeDate(q.createdAt),
        updatedAt: sanitizeDate(q.updatedAt),
        category: sanitizeCategory(q.category),
        difficulty: sanitizeDifficulty(q.difficulty),
        tags: sanitizeTags((q as unknown as Record<string, unknown>).tags),
        settings: sanitizeSettings(q.settings),
      }))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [quizzes, drafts]);

  const totalQuizCount = allQuizzes.length;

  // Only show info if currentRound is defined and type is golden-pyramid
  const currentRound = state.selectedQuiz?.rounds.find(
    (round) => round.type === "golden-pyramid"
  );

  return (
    <ErrorBoundary
      fallback={
        <Alert severity="error">
          Something went wrong in the quiz list. Please refresh the page.
        </Alert>
      }
    >
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header section */}
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Quizzes ({totalQuizCount})
          </Typography>

          {/* Login warning message */}
          {!isAuthenticated && (
            <Alert
              severity="info"
              sx={{
                mt: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(2, 136, 209, 0.1)"
                    : "rgba(2, 136, 209, 0.05)",
                "& .MuiAlert-icon": {
                  color: (theme) => theme.palette.info.main,
                },
              }}
            >
              Sign in to save your quizzes and access them across devices. Open
              the menu to log in.
            </Alert>
          )}
        </Box>

        {/* Error display */}
        {error && !state.errorDismissed && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <IconButton
                size="small"
                onClick={actions.dismissError}
                aria-label="Dismiss error"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* Storage warning */}
        {storageUsage?.isNearLimit && !state.storageWarningDismissed && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
            action={
              <IconButton
                size="small"
                onClick={actions.dismissStorageWarning}
                aria-label="Dismiss storage warning"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            Storage is nearly full (
            {(() => {
              const usage = storageUsage?.usagePercentage;
              if (typeof usage === "number" && !isNaN(usage)) {
                return Math.round(Math.max(0, Math.min(100, usage)));
              }
              return 0;
            })()}
            % used). Consider cleaning up old drafts or exporting quizzes to
            free up space.
          </Alert>
        )}

        {/* Action Buttons - only show when we have quizzes */}
        {totalQuizCount > 0 && (
          <Box
            sx={{
              mb: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={actions.handleCreateQuiz}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              <Box
                component="span"
                sx={{
                  display: { xs: "none", sm: "inline" },
                }}
              >
                Create New Quiz
              </Box>
              <Box
                component="span"
                sx={{
                  display: { xs: "inline", sm: "none" },
                }}
              >
                Create
              </Box>
            </Button>
            <Button
              variant="outlined"
              startIcon={<StorageIcon />}
              onClick={() => setStorageModalOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Storage
            </Button>
          </Box>
        )}

        {/* Quizzes grid - now using extracted component */}
        <ErrorBoundary>
          <QuizGrid
            quizzes={allQuizzes}
            isLoading={isLoading}
            onCreateQuiz={actions.handleCreateQuiz}
            onMenuOpen={handleMenuOpenWrapper}
            onExport={handleExportWrapper}
            onEdit={handleEditWrapper}
          />
        </ErrorBoundary>

        {/* Quiz actions - now using extracted component */}
        <QuizActions
          selectedQuiz={state.selectedQuiz}
          menuAnchorEl={state.menuAnchorEl}
          editingQuiz={state.editingQuiz}
          isWizardOpen={state.isWizardOpen}
          deleteConfirmOpen={state.deleteConfirmOpen}
          pendingDeleteQuiz={state.pendingDeleteQuiz}
          onMenuClose={actions.handleMenuClose}
          onEditQuiz={actions.handleEditQuiz}
          onExportQuiz={actions.handleExportQuiz}
          onRequestDeleteQuiz={actions.handleRequestDeleteQuiz}
          onConfirmDeleteQuiz={actions.handleConfirmDeleteQuiz}
          onCancelDeleteQuiz={actions.handleCancelDeleteQuiz}
          onCreateQuiz={actions.handleCreateQuiz}
          onWizardCancel={actions.handleWizardCancel}
          onQuizCreated={actions.handleQuizCreated}
        />

        {/* Storage Modal */}
        <StorageModal
          open={storageModalOpen}
          onClose={() => setStorageModalOpen(false)}
          storageUsage={storageUsage}
          quizzes={allQuizzes}
          draftsCount={drafts.length}
          onCleanupStorage={actions.handleCleanupDrafts}
          onRefreshStorage={actions.handleRefreshStorage}
        />
      </Container>
    </ErrorBoundary>
  );
};

// Add default export for React.lazy()
export default Quizzes;
