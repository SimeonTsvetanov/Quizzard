/**
 * Clear Data Dialog Component
 *
 * Handles the confirmation dialog for clearing all Points Counter data.
 * Provides clear warning and confirmation actions.
 *
 * @fileoverview Clear data confirmation dialog for TeamSetup
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
import { DeleteForever as ClearIcon } from "@mui/icons-material";

/**
 * Props for ClearDataDialog component
 */
interface ClearDataDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Clear Data Dialog Component
 *
 * Provides a confirmation dialog for destructive clear all action.
 * Clearly warns about data loss and provides cancel option.
 */
export const ClearDataDialog: React.FC<ClearDataDialogProps> = ({
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
        Clear All Data?
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
          This will permanently delete all Points Counter data including saved
          teams, game states, and settings. This action cannot be undone.
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "center",
          gap: 2,
          p: 2,
        }}
      >
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          startIcon={<ClearIcon />}
        >
          Clear All Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};
