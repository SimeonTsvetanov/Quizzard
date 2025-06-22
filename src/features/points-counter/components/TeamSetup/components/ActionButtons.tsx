/**
 * Action Buttons Component
 *
 * Handles the start/continue game button and clear all data button.
 * Provides proper loading states and visual feedback.
 *
 * @fileoverview Action buttons component for TeamSetup
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import { Box, Button, IconButton, CircularProgress } from "@mui/material";
import {
  PlayArrow as StartIcon,
  DeleteForever as ClearIcon,
} from "@mui/icons-material";

/**
 * Props for ActionButtons component
 */
interface ActionButtonsProps {
  onStartGame: () => void;
  onClearClick: () => void;
  isLoading: boolean;
  isEditMode: boolean;
}

/**
 * Action Buttons Component
 *
 * Handles the main action buttons with proper loading states
 * and visual feedback. Uses RTG-style layout patterns.
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onStartGame,
  onClearClick,
  isLoading,
  isEditMode,
}) => {
  const getButtonText = (): string => {
    if (isLoading) return "Processing...";
    return isEditMode ? "Continue Game" : "Start Quiz Game";
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        p: { xs: 1, sm: 2 }, // RTG padding pattern
        pt: "clamp(0.25rem, 1vw, 0.75rem)", // RTG top padding
      }}
    >
      {/* Action Buttons Row - RTG Pattern */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative", // For absolute positioning of clear button
        }}
      >
        {/* Start Game Button - Center (RTG style) */}
        <Button
          variant="contained"
          startIcon={
            isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <StartIcon />
            )
          }
          onClick={onStartGame}
          disabled={isLoading}
          sx={{
            px: { xs: 4, sm: 6 },
            py: { xs: 1.5, sm: 1.25 },
            fontSize: "clamp(0.8rem, 1.2vw, 0.875rem)", // RTG button text sizing
            borderRadius: 2,
            boxShadow: (theme) => theme.shadows[2],
            "&:hover": {
              boxShadow: (theme) => theme.shadows[4],
              transform: "translateY(-1px)",
              transition: "all 0.2s ease-in-out",
            },
            "&:active": {
              transform: "translateY(0px)",
            },
            "&.Mui-disabled": {
              boxShadow: (theme) => theme.shadows[1],
              transform: "none",
            },
          }}
          aria-label={isLoading ? "Processing, please wait" : getButtonText()}
          title={isLoading ? "Processing..." : getButtonText()}
        >
          {getButtonText()}
        </Button>

        {/* Clear All Button - Right (RTG style) */}
        <IconButton
          onClick={onClearClick}
          sx={{
            position: "absolute",
            right: 0,
            bgcolor: "error.main",
            color: "error.contrastText",
            "&:hover": {
              bgcolor: "error.dark",
              transform: "scale(1.1)",
              transition: "all 0.2s ease-in-out",
            },
            "&:active": {
              transform: "scale(1)",
            },
          }}
          aria-label="Clear all data"
          title="Clear all Points Counter data"
        >
          <ClearIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
