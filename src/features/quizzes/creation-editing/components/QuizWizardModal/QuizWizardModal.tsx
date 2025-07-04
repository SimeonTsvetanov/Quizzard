/**
 * Quiz Creation Wizard Modal Component - Simplified Version
 *
 * Simplified full-screen modal for quiz creation with floating action buttons.
 * No complex stepping system - just basic info and questions in one flow.
 *
 * New Layout:
 * - Main app header at the top (always visible)
 * - Scrollable content with basic info and questions
 * - Two floating action buttons: Edit Quiz and Save Quiz
 * - Save confirmation dialog with quiz summary
 *
 * @fileoverview Simplified quiz creation wizard modal component
 * @version 5.0.0
 * @since December 2025
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Fade,
  Typography,
  Box,
  Fab,
  Card,
  CardContent,
  Chip,
  Button,
  DialogTitle,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  QuestionAnswer as QuestionIcon,
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import type { QuizWizardProps } from "../../types";
import { useQuizWizardWithStorage } from "../../hooks";
import { ErrorBoundary } from "react-error-boundary";
import Header from "../../../../../shared/components/Header";
import { useTheme } from "../../../../../shared/hooks/useTheme";

// Import step components
import { BasicInfoStep } from "../../steps/BasicInfoStep";
import { RoundsQuestionsStep } from "../../steps/QuestionsStep";

/**
 * Quiz Creation Wizard Modal - Simplified Version
 *
 * Simplified interface for creating quizzes with floating action buttons.
 * Combines basic info and questions in a single scrollable view.
 *
 * @param props - Component props including callbacks and optional edit quiz
 * @returns JSX element representing the simplified wizard modal
 */
export const QuizWizardModal: React.FC<
  QuizWizardProps & { onQuizDeleted?: (id: string) => void }
> = ({ onQuizCreated, onCancel, editQuiz, onQuizDeleted }) => {
  // === THEME INTEGRATION ===
  const { mode, handleThemeChange } = useTheme();

  // === LOCAL STATE ===
  const [showBasicInfo, setShowBasicInfo] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(true); // Local state to control modal open/close
  const [deleted, setDeleted] = useState(false);

  // === ENHANCED WIZARD STATE WITH INDEXEDDB ===
  const {
    draftQuiz,
    updateDraft,
    resetWizard,
    completeWizard,
    // Enhanced auto-save features
    autoSaveStatus,
    storageError,
    lastSaved,
  } = useQuizWizardWithStorage(editQuiz);

  // === COMPUTED VALUES ===
  const totalQuestions =
    draftQuiz.rounds?.flatMap((r) => r.questions).length || 0;
  const totalRounds = draftQuiz.rounds?.length || 0;

  // Enhanced validation - allow saving with minimal content to support iterative quiz building
  const canSave = !!(
    (
      draftQuiz.title?.trim() || // Has title, OR
      totalQuestions > 0 || // Has at least one question, OR
      draftQuiz.description?.trim() || // Has description, OR
      draftQuiz.category || // Has category selected, OR
      draftQuiz.difficulty
    ) // Has difficulty selected
  );

  // === EVENT HANDLERS ===
  /**
   * Handles closing the wizard modal
   * Auto-saves the draft and shows confirmation message
   */
  const handleClose = useCallback(() => {
    // Check if there are unsaved changes
    const hasChanges = draftQuiz.title || totalQuestions > 0;

    if (hasChanges) {
      // Auto-save happens in the background, just close
      setTimeout(() => {
        setIsOpen(false);
        onCancel();
      }, 100);
    } else {
      setIsOpen(false);
      onCancel();
    }
  }, [draftQuiz.title, totalQuestions, onCancel]);

  /**
   * Handles clicking the Edit Quiz button
   * Scrolls to basic info section
   */
  const handleEditQuiz = useCallback(() => {
    setShowBasicInfo(true);
    // Scroll to top
    const content = document.querySelector('[data-testid="wizard-content"]');
    if (content) {
      content.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  /**
   * Handles clicking the Save Quiz button
   * Shows the save confirmation dialog
   */
  const handleSaveQuiz = useCallback(() => {
    if (canSave) {
      setShowSaveDialog(true);
    }
  }, [canSave]);

  /**
   * Handles confirming the save action
   * Creates the quiz and closes the modal
   */
  const handleConfirmSave = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const completedQuiz = await completeWizard();
      onQuizCreated(completedQuiz);
      resetWizard(); // Clear draft for next time
      setShowSaveDialog(false);
      onCancel(); // Close the wizard modal after save
    } catch (error) {
      console.error("Error saving quiz:", error);
      // Keep dialog open on error
    } finally {
      setIsSubmitting(false);
    }
  }, [completeWizard, onQuizCreated, resetWizard, onCancel]);

  /**
   * Handles canceling the save action
   */
  const handleCancelSave = useCallback(() => {
    setShowSaveDialog(false);
  }, []);

  /**
   * Handles clicking the Delete Quiz button
   * Shows the delete confirmation dialog
   */
  const handleDeleteQuiz = useCallback(() => {
    if (editQuiz) {
      setShowDeleteDialog(true);
    }
  }, [editQuiz]);

  /**
   * Handles confirming the delete action
   * Deletes the quiz and closes the modal
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!editQuiz) return;

    setIsDeleting(true);

    try {
      // Import the delete functionality from the storage service
      const { indexedDBService } = await import(
        "../../../management/services/indexedDBService"
      );
      const result = await indexedDBService.deleteQuiz(editQuiz.id);

      if (result.success) {
        // Notify parent of deletion before closing
        if (onQuizDeleted) onQuizDeleted(editQuiz.id);
        onCancel();
      } else {
        throw new Error(result.error || "Failed to delete quiz");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      // Keep dialog open on error
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [editQuiz, onCancel, onQuizDeleted]);

  /**
   * Handles canceling the delete action
   */
  const handleCancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  useEffect(() => {
    // Listen for 'QUIZ_DELETED' events (cross-tab)
    const bc = new window.BroadcastChannel("quizzard-quiz-events");
    const handler = (event: MessageEvent) => {
      if (
        event.data?.type === "QUIZ_DELETED" &&
        event.data.id === draftQuiz?.id
      ) {
        setDeleted(true);
      }
    };
    bc.addEventListener("message", handler);
    return () => {
      bc.removeEventListener("message", handler);
      bc.close();
    };
  }, [draftQuiz?.id]);

  // If deleted, close the modal or show a message
  useEffect(() => {
    if (deleted) {
      // Option 1: Close the modal immediately
      if (typeof onCancel === "function") onCancel();
      // Option 2: Show a deleted message (uncomment if preferred)
      // setShowDeletedMessage(true);
    }
  }, [deleted, onCancel]);

  // === RENDER ===

  return (
    <ErrorBoundary
      fallback={
        <Dialog open fullScreen>
          <DialogContent
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "background.default",
            }}
          >
            <Typography variant="h6" color="error" textAlign="center">
              Something went wrong in the quiz wizard.
              <br />
              Please refresh the page and try again.
            </Typography>
          </DialogContent>
        </Dialog>
      }
    >
      <Dialog
        open={isOpen}
        onClose={handleClose}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "background.default",
            backgroundImage: "none",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          },
        }}
        TransitionComponent={Fade}
        transitionDuration={300}
      >
        {/* Main App Header - with proper theme integration and z-index */}
        <Box sx={{ zIndex: 1400, position: "relative" }}>
          <Header mode={mode} onThemeChange={handleThemeChange} />
        </Box>

        {/* Main content area - scrollable */}
        <DialogContent
          data-testid="wizard-content"
          sx={{
            flex: 1,
            p: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          <Box
            sx={{
              maxWidth: 1200,
              mx: "auto",
              width: "100%",
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 2, sm: 3 },
            }}
          >
            {/* Basic Info Section */}
            {showBasicInfo && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                  Quiz Details
                </Typography>
                <BasicInfoStep
                  draftQuiz={draftQuiz}
                  updateDraft={updateDraft}
                  validation={{
                    isValid: true,
                    errors: [],
                    warnings: [],
                    validatedAt: new Date(),
                  }}
                  onDeleteQuiz={editQuiz ? handleDeleteQuiz : undefined}
                  isEditMode={!!editQuiz}
                  onContinue={() => setShowBasicInfo(false)}
                />
              </Box>
            )}

            {/* Questions Section */}
            {!showBasicInfo && (
              <Box>
                <RoundsQuestionsStep
                  draftQuiz={draftQuiz}
                  updateDraft={updateDraft}
                  showValidation={false}
                />
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* Floating Action Buttons - only show when not in basic info mode */}
        {!showBasicInfo && (
          <>
            {/* Right side buttons */}
            <Box
              sx={{
                position: "fixed",
                bottom: { xs: 16, sm: 24 },
                right: { xs: 16, sm: 24 },
                display: "flex",
                flexDirection: "row",
                gap: 2,
                zIndex: 1300,
              }}
            >
              {/* Edit Quiz Button */}
              <Box
                sx={{
                  display: { xs: "block", sm: "none" },
                }}
              >
                <Fab
                  color="secondary"
                  onClick={handleEditQuiz}
                  sx={{
                    boxShadow: 3,
                    "&:hover": {
                      boxShadow: 6,
                    },
                  }}
                >
                  <EditIcon />
                </Fab>
              </Box>
              <Box
                sx={{
                  display: { xs: "none", sm: "block" },
                }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleEditQuiz}
                  startIcon={<EditIcon />}
                  sx={{
                    boxShadow: 3,
                    "&:hover": {
                      boxShadow: 6,
                    },
                    minWidth: 120,
                    height: 56,
                  }}
                >
                  Edit Quiz
                </Button>
              </Box>

              {/* Save Quiz Button */}
              <Box
                sx={{
                  display: { xs: "block", sm: "none" },
                }}
              >
                <Fab
                  color="primary"
                  onClick={handleSaveQuiz}
                  disabled={!canSave}
                  sx={{
                    boxShadow: 3,
                    "&:hover": {
                      boxShadow: 6,
                    },
                    "&.Mui-disabled": {
                      bgcolor: "action.disabled",
                    },
                  }}
                >
                  <SaveIcon />
                </Fab>
              </Box>
              <Box
                sx={{
                  display: { xs: "none", sm: "block" },
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveQuiz}
                  disabled={!canSave}
                  startIcon={<SaveIcon />}
                  sx={{
                    boxShadow: 3,
                    "&:hover": {
                      boxShadow: 6,
                    },
                    "&.Mui-disabled": {
                      bgcolor: "action.disabled",
                    },
                    minWidth: 120,
                    height: 56,
                  }}
                >
                  Save Quiz
                </Button>
              </Box>
            </Box>
          </>
        )}

        {/* Save Confirmation Dialog */}
        <Dialog
          open={showSaveDialog}
          onClose={handleCancelSave}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 24,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              pb: 2,
            }}
          >
            <CheckIcon color="success" />
            <Typography variant="h6" fontWeight={600}>
              Save Quiz
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ pb: 2 }}>
            <Card
              variant="outlined"
              sx={{
                mb: 3,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {draftQuiz.title}
                </Typography>

                {draftQuiz.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{ mb: 2 }}
                  >
                    {draftQuiz.description}
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  <Chip
                    icon={<CategoryIcon />}
                    label={draftQuiz.category || "General"}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<TimerIcon />}
                    label={`${totalRounds} Round${
                      totalRounds !== 1 ? "s" : ""
                    }`}
                    size="small"
                    variant="filled"
                    color="secondary"
                  />
                  <Chip
                    icon={<QuestionIcon />}
                    label={`${totalQuestions} Question${
                      totalQuestions !== 1 ? "s" : ""
                    }`}
                    size="small"
                    variant="filled"
                    color="primary"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  <strong>Difficulty:</strong>{" "}
                  {draftQuiz.difficulty || "Not set"}
                </Typography>
              </CardContent>
            </Card>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Are you ready to save this quiz? You can always edit it later.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={handleCancelSave}
              variant="outlined"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? null : <SaveIcon />}
            >
              {isSubmitting ? "Saving..." : "Save Quiz"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={handleCancelDelete}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 24,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              pb: 2,
            }}
          >
            <DeleteIcon color="error" />
            <Typography variant="h6" fontWeight={600}>
              Delete Quiz
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ pb: 2 }}>
            <Typography variant="body1" paragraph>
              Are you sure you want to delete this quiz?
            </Typography>

            <Card
              variant="outlined"
              sx={{
                mb: 3,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {editQuiz?.title}
                </Typography>

                {editQuiz?.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{ mb: 2 }}
                  >
                    {editQuiz.description}
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  <Chip
                    icon={<CategoryIcon />}
                    label={editQuiz?.category || "General"}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<TimerIcon />}
                    label={`${editQuiz?.rounds?.length || 0} Round${
                      (editQuiz?.rounds?.length || 0) !== 1 ? "s" : ""
                    }`}
                    size="small"
                    variant="filled"
                    color="secondary"
                  />
                  <Chip
                    icon={<QuestionIcon />}
                    label={`${
                      editQuiz?.rounds?.flatMap((r) => r.questions).length || 0
                    } Question${
                      (editQuiz?.rounds?.flatMap((r) => r.questions).length ||
                        0) !== 1
                        ? "s"
                        : ""
                    }`}
                    size="small"
                    variant="filled"
                    color="primary"
                  />
                </Box>
              </CardContent>
            </Card>

            <Typography
              variant="body2"
              color="error"
              textAlign="center"
              fontWeight={500}
            >
              This action cannot be undone. The quiz will be permanently
              deleted.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={handleCancelDelete}
              variant="outlined"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              disabled={isDeleting}
              startIcon={isDeleting ? null : <DeleteIcon />}
            >
              {isDeleting ? "Deleting..." : "Delete Quiz"}
            </Button>
          </DialogActions>
        </Dialog>
      </Dialog>
    </ErrorBoundary>
  );
};
