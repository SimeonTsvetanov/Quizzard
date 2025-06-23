/**
 * Export Format Dialog Component
 *
 * Provides a modal dialog for selecting the quiz export format.
 * Currently shows available and coming soon export options including
 * Google Slides and JSON exports.
 *
 * Features:
 * - Format selection with icons
 * - Disabled state for unimplemented formats
 * - Clean presentation interface
 * - Responsive design
 *
 * @fileoverview Quiz export format selection dialog
 * @version 2.0.0
 * @since December 2025
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";
import {
  Slideshow as GoogleSlidesIcon,
  Code as JSONIcon,
} from "@mui/icons-material";
import type { Quiz } from "../../../types";

/**
 * Props for the ExportFormatDialog component
 */
export interface ExportFormatDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Quiz to be exported */
  quiz: Quiz;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when export format is selected */
  onExport: (format: "slides" | "json") => void;
}

/**
 * Export format options configuration
 */
const EXPORT_OPTIONS = [
  {
    id: "slides",
    label: "Export to Google Slides",
    icon: GoogleSlidesIcon,
    disabled: true,
    description: "Export quiz as a Google Slides presentation (Coming Soon)",
  },
  {
    id: "json",
    label: "Export as JSON",
    icon: JSONIcon,
    disabled: true,
    description: "Export quiz data in JSON format (Coming Soon)",
  },
] as const;

/**
 * ExportFormatDialog Component
 *
 * Renders a dialog for selecting the quiz export format with
 * visual feedback and disabled states for unavailable options.
 *
 * @param props - Component props
 * @returns JSX element representing the export format dialog
 */
export const ExportFormatDialog: React.FC<ExportFormatDialogProps> = ({
  open,
  quiz,
  onClose,
  onExport,
}) => {
  const handleExport = (format: "slides" | "json") => {
    onExport(format);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="export-format-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="export-format-dialog-title">
        Export Quiz: {quiz.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Typography variant="body1" gutterBottom>
            Choose an export format:
          </Typography>

          <List>
            {EXPORT_OPTIONS.map((option) => (
              <ListItem key={option.id} disablePadding>
                <ListItemButton
                  onClick={() => handleExport(option.id)}
                  disabled={option.disabled}
                >
                  <ListItemIcon>
                    <option.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={option.label}
                    secondary={option.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, fontStyle: "italic" }}
          >
            Export functionality coming soon! These features are planned for
            future releases.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportFormatDialog;
