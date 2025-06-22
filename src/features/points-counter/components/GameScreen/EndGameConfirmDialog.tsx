/**
 * End Game Confirmation Dialog Component
 *
 * Modal dialog for confirming game termination with clear warning and actions.
 *
 * Extracted from GameScreen.tsx to improve maintainability and follow
 * the Single Responsibility Principle from development standards.
 *
 * Features:
 * - Clean confirmation interface with warning styling
 * - Centered layout and clear action buttons
 * - Error color theme for destructive action
 * - Accessible dialog with proper labeling
 *
 * @fileoverview End game confirmation dialog component
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";

/**
 * Props for the EndGameConfirmDialog component
 */
interface EndGameConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Callback to confirm game termination */
  onConfirm: () => void;
}

/**
 * End Game Confirmation Dialog Component
 *
 * Displays a confirmation modal when user attempts to end the game,
 * providing clear warning about data loss and action buttons.
 */
export const EndGameConfirmDialog: React.FC<EndGameConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: 600,
          color: "error.main",
        }}
      >
        End Game?
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            color: "text.secondary",
            lineHeight: 1.6,
          }}
        >
          Are you sure you want to end the current game? All progress will be
          lost.
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "center",
          gap: 2,
          p: 2,
        }}
      >
        <Button variant="outlined" onClick={onClose} sx={{ border: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          sx={{ border: "none" }}
        >
          End Game
        </Button>
      </DialogActions>
    </Dialog>
  );
};
