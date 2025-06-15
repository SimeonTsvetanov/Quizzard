/**
 * FinalQuestionModal Component
 *
 * Container component for displaying a final question in a modal dialog.
 * Handles the modal layout, question display, and action buttons.
 *
 * Responsibilities:
 * - Display question in a responsive layout
 * - Handle modal open/close state
 * - Coordinate question actions (refresh, copy)
 * - Provide proper modal accessibility
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import { FinalQuestionCard } from "../FinalQuestionCard/FinalQuestionCard";
import type { FinalQuestionModalProps } from "../../types";

/**
 * FinalQuestionModal Component
 *
 * Renders a modal dialog containing the final question card
 * and action buttons for refreshing and copying.
 *
 * @param props - Component props
 * @returns JSX element for the final question modal
 */
export const FinalQuestionModal = ({
  open,
  question,
  isRefreshing,
  isGenerating,
  onClose,
  onRefresh,
  onCopy,
}: FinalQuestionModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="final-question-modal-title"
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "90vh",
        },
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        id="final-question-modal-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div">
          Final Question
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Refresh Button */}
          <Tooltip title="Generate new question">
            <span>
              <IconButton
                onClick={onRefresh}
                disabled={isGenerating || isRefreshing}
                size="small"
                aria-label="Generate new question"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* Copy Button */}
          <Tooltip title="Copy question">
            <span>
              <IconButton
                onClick={onCopy}
                disabled={!question}
                size="small"
                aria-label="Copy question"
              >
                <ContentCopyIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* Close Button */}
          <Tooltip title="Close">
            <IconButton onClick={onClose} size="small" aria-label="Close modal">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* Modal Content */}
      <DialogContent id="final-question-modal-content" sx={{ pt: 1 }}>
        {question ? (
          <Box
            sx={{
              opacity: isRefreshing ? 0.5 : 1,
              transform: isRefreshing ? "scale(0.98)" : "scale(1)",
              transition: "all 0.3s ease-in-out",
            }}
          >
            <FinalQuestionCard
              question={question}
              isRefreshing={isRefreshing}
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
              textAlign: "center",
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No question generated yet.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
