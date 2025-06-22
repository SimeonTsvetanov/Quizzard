/**
 * Team Inputs Component
 *
 * Handles rendering and management of dynamic team name input fields.
 * Features auto-expansion, validation, and keyboard navigation.
 *
 * @fileoverview Team input fields component for TeamSetup
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import { Box, TextField, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import type { TeamSetupFormState, TeamSetupFormActions } from "../hooks";

/**
 * Team Number Component
 * Displays a circular badge with the team number
 */
const TeamNumber: React.FC<{ number: number; show: boolean }> = ({
  number,
  show,
}) => (
  <Box
    sx={{
      minWidth: 24,
      height: 24,
      borderRadius: "50%",
      bgcolor: show ? "primary.main" : "transparent",
      color: show ? "primary.contrastText" : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.75rem",
      fontWeight: 600,
      flexShrink: 0,
      transition: "all 0.2s ease",
      minHeight: 24,
    }}
  >
    {show ? number : ""}
  </Box>
);

/**
 * Props for TeamInputs component
 */
interface TeamInputsProps {
  state: TeamSetupFormState;
  actions: TeamSetupFormActions;
}

/**
 * Team Inputs Component
 *
 * Renders dynamic team input fields with auto-expansion, validation,
 * and keyboard navigation. Handles the visual and interactive aspects
 * of team name collection.
 */
export const TeamInputs: React.FC<TeamInputsProps> = ({ state, actions }) => {
  const { teams, inputRefs } = state;
  const { handleInputChange, handleKeyDown, removeTeam, getPlaceholderText } =
    actions;

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "clamp(0.25rem, 1vw, 0.5rem)", // RTG gap pattern
        p: { xs: 1, sm: 2 }, // RTG padding pattern
        pb: "clamp(0.25rem, 1vw, 0.75rem)", // RTG bottom padding
        overflow: "auto",
        minHeight: 0, // Allow flex shrinking
      }}
    >
      {teams.map((team, index) => {
        const hasContent = team.value.trim() !== "";
        const displayNumber = index + 1;
        const showNumber = hasContent || index === 0; // Always show first number as hint
        const canDelete = teams.length > 1 && hasContent;

        return (
          <Box
            key={team.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(0.5rem, 1.5vw, 1rem)", // RTG gap pattern
              py: "clamp(0.125rem, 0.5vw, 0.25rem)", // RTG vertical padding
            }}
          >
            {/* Team Number Badge */}
            <TeamNumber number={displayNumber} show={showNumber} />

            {/* Team Name Input */}
            <TextField
              inputRef={(input) => {
                if (input) {
                  inputRefs.current.set(team.id, input);
                } else {
                  inputRefs.current.delete(team.id);
                }
              }}
              value={team.value}
              onChange={(e) => handleInputChange(team.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(team.id, e)}
              placeholder={getPlaceholderText(index)}
              variant="outlined"
              size="small"
              sx={{
                flex: 1,
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
              aria-label={`Team ${displayNumber} name input`}
              autoComplete="off"
            />

            {/* Delete Button */}
            <IconButton
              size="small"
              onClick={() => removeTeam(team.id)}
              disabled={!canDelete}
              sx={{
                opacity: hasContent && canDelete ? 0.7 : 0,
                transition: "opacity 0.2s ease",
                color: "error.main",
                flexShrink: 0,
                "&:hover": {
                  opacity: hasContent && canDelete ? 1 : 0,
                  bgcolor: "error.main",
                  color: "error.contrastText",
                },
                "&.Mui-disabled": {
                  opacity: 0,
                },
              }}
              aria-label={`Remove team ${displayNumber}`}
              title={`Remove team ${displayNumber}`}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      })}
    </Box>
  );
};
