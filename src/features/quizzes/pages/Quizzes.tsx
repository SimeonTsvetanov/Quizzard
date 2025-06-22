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
import { ErrorBoundary } from "react-error-boundary";

/**
 * Main Quizzes Page Component (ENHANCED WITH STORAGE)
 *
 * Provides comprehensive quiz management interface using extracted components
 * and hooks with IndexedDB storage capabilities. Now includes storage monitoring
 * and auto-save functionality.
 *
 * @param props - Component props
 * @returns JSX element representing the quizzes page
 */
export const Quizzes: React.FC<QuizzesPageProps> = ({
  initialQuiz: _initialQuiz,
}) => {
  // Use storage-enhanced state management hook
  const {
    quizzes,
    drafts,
    isLoading,
    error,
    state,
    actions,
    storageUsage,
    isInitialized,
  } = useQuizzesPageStateWithStorage();

  // Storage modal state
  const [storageModalOpen, setStorageModalOpen] = React.useState(false);

  // Combine quizzes and drafts for display
  const allQuizzes = React.useMemo(() => {
    // Convert drafts to Quiz format with isDraft flag
    const draftQuizzes = drafts
      .filter((draft) => draft.id && draft.title)
      .map(
        (draft) =>
          ({
            ...draft,
            id: draft.id!,
            title: draft.title || "Untitled Draft",
            description: draft.description || "Draft quiz in progress...",
            rounds: draft.rounds || [],
            category: draft.category || "General",
            difficulty: draft.difficulty || "medium",
            tags: (draft as any).tags || [],
            status: "draft" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDraft: true,
          } as any)
      );

    // Combine and sort by most recently updated
    return [...quizzes, ...draftQuizzes].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [quizzes, drafts]);

  const totalQuizCount = allQuizzes.length;

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
            Storage is nearly full ({Math.round(storageUsage.usagePercentage)}%
            used). Consider cleaning up old drafts or exporting quizzes to free
            up space.
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
        <QuizGrid
          quizzes={allQuizzes}
          isLoading={isLoading}
          onCreateQuiz={actions.handleCreateQuiz}
          onMenuOpen={actions.handleMenuOpen}
          onExport={actions.handleExportQuiz}
        />

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
