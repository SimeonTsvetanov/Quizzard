/**
 * Game Settings Component
 *
 * Handles game configuration settings including rounds count
 * with simplified error handling that doesn't disrupt layout.
 *
 * @fileoverview Game settings configuration component
 * @version 2.0.0 - Simplified Design
 * @since December 2025
 */

import React from "react";
import { Box, Typography, TextField } from "@mui/material";
import type { TeamSetupFormState, TeamSetupFormActions } from "../hooks";

/**
 * Props for GameSettings component
 */
interface GameSettingsProps {
  state: TeamSetupFormState;
  actions: TeamSetupFormActions;
  roundCount: number;
  filledTeams: any[];
  error?: string | null;
  inputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * Game Settings Component
 *
 * Handles rounds count input with clean, non-disruptive design.
 * No dynamic status messages to maintain consistent layout.
 */
export const GameSettings: React.FC<GameSettingsProps> = ({
  state,
  actions,
  roundCount,
  filledTeams,
  error,
  inputRef,
}) => {
  const { roundCountInput, validationError } = state;
  const { handleRoundCountChange } = actions;

  // Only show rounds-specific error
  const showRoundsError = validationError && roundCount < 1;

  return (
    <Box
      sx={{
        flexShrink: 0,
      }}
    >
      {/* Round Count Input */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end", // Align to right side of header
        }}
      >
        <TextField
          inputRef={inputRef}
          type="number"
          value={roundCountInput}
          onChange={handleRoundCountChange}
          placeholder="0"
          variant="outlined"
          size="small"
          inputProps={{
            min: 1,
            max: 99,
            "aria-label": "Number of rounds",
          }}
          sx={{
            width: 80,
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                border: "none",
              },
              "&:hover fieldset": {
                border: "none",
              },
              "&.Mui-focused fieldset": {
                border: "none",
              },
              bgcolor: "background.default",
              borderRadius: 1,
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
            },
          }}
        />

        {/* Simple error message under rounds input only */}
        {showRoundsError && (
          <Typography
            variant="caption"
            sx={{
              color: "error.main",
              fontSize: "0.75rem",
              mt: 0.5,
              whiteSpace: "nowrap",
              textAlign: "right",
            }}
          >
            Add rounds
          </Typography>
        )}
      </Box>
    </Box>
  );
};
