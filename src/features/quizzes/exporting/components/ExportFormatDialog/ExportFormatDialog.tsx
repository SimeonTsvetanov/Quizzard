/**
 * Export Format Dialog Component
 *
 * Provides a modal dialog for selecting the quiz export format.
 * Currently supports PowerPoint export with placeholder options for
 * Google Slides and JSON exports (to be implemented).
 *
 * Features:
 * - Format selection with icons
 * - Disabled state for unimplemented formats
 * - System native file save dialog integration
 * - Responsive design
 *
 * @fileoverview Quiz export format selection dialog
 * @version 1.0.0
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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  PowerSettingsNew as PowerPointIcon,
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
  onExport: (format: "powerpoint" | "slides" | "json") => void;
}

/**
 * Export format options configuration
 */
const EXPORT_OPTIONS = [
  {
    id: "powerpoint",
    label: "Export to PowerPoint",
    icon: PowerPointIcon,
    disabled: false,
    description: "Export quiz as a PowerPoint presentation",
  },
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
  const handleExport = (format: "powerpoint" | "slides" | "json") => {
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose an export format below. Currently, only PowerPoint export is
          available.
        </Typography>
        <List>
          {EXPORT_OPTIONS.map((option) => (
            <ListItemButton
              key={option.id}
              onClick={() => handleExport(option.id)}
              disabled={option.disabled}
            >
              <ListItemIcon>
                <option.icon />
              </ListItemIcon>
              <ListItemText
                primary={option.label}
                secondary={
                  option.disabled ? "(Coming Soon)" : option.description
                }
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportFormatDialog;
