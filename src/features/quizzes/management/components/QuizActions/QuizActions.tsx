/**
 * Quiz Actions Component
 *
 * Handles all quiz-related actions including menu interactions, modals,
 * and confirmation dialogs. Extracted from the monolithic Quizzes.tsx
 * to improve maintainability and follow Single Responsibility Principle.
 *
 * Features:
 * - Context menu for quiz actions (Edit, Export, Delete)
 * - Delete confirmation dialog
 * - Quiz wizard modal integration
 * - Floating action button
 *
 * @fileoverview Quiz actions and interactions management
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Fab,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  PowerSettingsNew as PowerPointIcon,
  Slideshow as GoogleSlidesIcon,
  Code as JSONIcon,
} from "@mui/icons-material";
import { QuizWizardModal } from "../../../creation-editing/components";
import type { Quiz } from "../../types";

/**
 * Props for the QuizActions component
 */
export interface QuizActionsProps {
  /** Currently selected quiz for menu actions */
  selectedQuiz: Quiz | null;
  /** Menu anchor element */
  menuAnchorEl: HTMLElement | null;
  /** Quiz being edited in wizard */
  editingQuiz: Quiz | null;
  /** Whether wizard modal is open */
  isWizardOpen: boolean;
  /** Whether delete confirmation dialog is open */
  deleteConfirmOpen: boolean;
  /** Quiz pending deletion */
  pendingDeleteQuiz: Quiz | null;
  /** Callback when menu should close */
  onMenuClose: () => void;
  /** Callback when quiz edit is requested */
  onEditQuiz: (quiz: Quiz) => void;
  /** Callback when quiz export is requested */
  onExportQuiz: (quiz: Quiz, format: "powerpoint" | "slides" | "json") => void;
  /** Callback when quiz deletion is requested */
  onRequestDeleteQuiz: (quiz: Quiz) => void;
  /** Callback when quiz deletion is confirmed */
  onConfirmDeleteQuiz: () => void;
  /** Callback when quiz deletion is cancelled */
  onCancelDeleteQuiz: () => void;
  /** Callback when quiz creation is requested */
  onCreateQuiz: () => void;
  /** Callback when quiz wizard is cancelled */
  onWizardCancel: () => void;
  /** Callback when quiz is created/updated */
  onQuizCreated: (quiz: Quiz) => void;
}

/**
 * QuizActions Component
 *
 * Manages all quiz-related actions and interactions including menus,
 * modals, and dialogs. Provides a centralized location for action handling.
 *
 * @param props - Component props
 * @returns JSX element representing quiz actions and interactions
 */
export const QuizActions: React.FC<QuizActionsProps> = ({
  selectedQuiz,
  menuAnchorEl,
  editingQuiz,
  isWizardOpen,
  deleteConfirmOpen,
  pendingDeleteQuiz,
  onMenuClose,
  onEditQuiz,
  onExportQuiz,
  onRequestDeleteQuiz,
  onConfirmDeleteQuiz,
  onCancelDeleteQuiz,
  onCreateQuiz,
  onWizardCancel,
  onQuizCreated,
}) => {
  /**
   * Handles edit menu item click
   */
  const handleEditClick = React.useCallback(() => {
    if (selectedQuiz) {
      onEditQuiz(selectedQuiz);
      onMenuClose();
    }
  }, [selectedQuiz, onEditQuiz, onMenuClose]);

  /**
   * Handles PowerPoint export menu item click
   */
  const handlePowerPointExport = React.useCallback(() => {
    if (selectedQuiz) {
      onExportQuiz(selectedQuiz, "powerpoint");
      onMenuClose();
    }
  }, [selectedQuiz, onExportQuiz, onMenuClose]);

  /**
   * Handles Google Slides export menu item click (disabled)
   */
  const handleSlidesExport = React.useCallback(() => {
    if (selectedQuiz) {
      onExportQuiz(selectedQuiz, "slides");
      onMenuClose();
    }
  }, [selectedQuiz, onExportQuiz, onMenuClose]);

  /**
   * Handles JSON export menu item click (disabled)
   */
  const handleJSONExport = React.useCallback(() => {
    if (selectedQuiz) {
      onExportQuiz(selectedQuiz, "json");
      onMenuClose();
    }
  }, [selectedQuiz, onExportQuiz, onMenuClose]);

  /**
   * Handles delete menu item click
   */
  const handleDeleteClick = React.useCallback(() => {
    if (selectedQuiz) {
      onRequestDeleteQuiz(selectedQuiz);
      onMenuClose();
    }
  }, [selectedQuiz, onRequestDeleteQuiz, onMenuClose]);

  return (
    <>
      {/* Quiz options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={onMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Quiz</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePowerPointExport}>
          <ListItemIcon>
            <PowerPointIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to PowerPoint</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSlidesExport} disabled>
          <ListItemIcon>
            <GoogleSlidesIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to Google Slides</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleJSONExport} disabled>
          <ListItemIcon>
            <JSONIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as JSON</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Quiz</ListItemText>
        </MenuItem>
      </Menu>

      {/* Floating Action Button for quiz creation */}
      <Fab
        color="primary"
        aria-label="Create new quiz"
        onClick={onCreateQuiz}
        sx={{
          position: "fixed",
          bottom: 80,
          right: 24,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Quiz Creation/Edit Wizard Modal */}
      {isWizardOpen && (
        <QuizWizardModal
          onQuizCreated={onQuizCreated}
          onCancel={onWizardCancel}
          editQuiz={editingQuiz || undefined}
          onQuizDeleted={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={onCancelDeleteQuiz}
        aria-labelledby="delete-quiz-dialog-title"
        aria-describedby="delete-quiz-dialog-description"
      >
        <DialogTitle id="delete-quiz-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-quiz-dialog-description">
            Are you sure you want to delete this quiz? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelDeleteQuiz} color="primary" autoFocus>
            Cancel
          </Button>
          <Button
            onClick={onConfirmDeleteQuiz}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuizActions;
