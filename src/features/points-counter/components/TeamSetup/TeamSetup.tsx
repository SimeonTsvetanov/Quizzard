/**
 * Team Setup Component for Points Counter
 *
 * Provides interface for setting up teams before starting the quiz game.
 * Features RTG-style dynamic team management with funny name placeholders.
 * Supports both initial setup (game OFF) and edit mode (game ON).
 *
 * Refactored from 768-line monolithic component into modular architecture:
 * - State management extracted to useTeamSetupForm hook
 * - UI components split into focused sub-components
 * - Clean separation of concerns maintained
 *
 * @fileoverview Team setup and configuration component
 * @version 3.0.0 - Refactored Architecture
 * @since December 2025
 */

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowRight as ArrowRightIcon,
} from "@mui/icons-material";
import type { Team } from "../../types";
import { useTeamSetupForm } from "./hooks";
import {
  TeamInputs,
  GameSettings,
  ActionButtons,
  ClearDataDialog,
} from "./components";

/**
 * Props interface for TeamSetup component
 */
interface TeamSetupProps {
  /** Current game status - 'ON' means active game with edit mode, 'OFF' means fresh setup */
  gameStatus: "ON" | "OFF";
  /** Callback when game should start or continue */
  onStartGame: (teams: Team[], rounds: number) => void;
  /** Callback when setup should be updated (edit mode) */
  onUpdateSetup?: (teams: Team[], rounds: number) => void;
  /** Callback when all data should be cleared */
  onClearAllData: () => void;
  /** Whether the setup is currently loading */
  isLoading?: boolean;
  /** Current error message */
  error?: string | null;
  /** Existing teams data for edit mode */
  existingTeams?: Team[];
  /** Existing rounds count for edit mode */
  existingRounds?: number;
}

/**
 * Team Setup Component
 *
 * Main orchestrator component that coordinates the team setup flow.
 * Uses refactored sub-components for clean separation of concerns.
 */
export const TeamSetup: React.FC<TeamSetupProps> = ({
  gameStatus,
  onStartGame,
  onUpdateSetup,
  onClearAllData,
  isLoading = false,
  error,
  existingTeams,
  existingRounds,
}) => {
  // Use the extracted state management hook
  const { state, actions, derivedValues } = useTeamSetupForm({
    gameStatus,
    existingTeams,
    existingRounds,
  });

  const { clearDialogOpen, validationError } = state;
  const { validateSetup, setClearDialogOpen } = actions;
  const { roundCount, isEditMode, filledTeams } = derivedValues;

  // Ref for rounds input to enable focus management
  const roundsInputRef = React.useRef<HTMLInputElement>(null);

  /**
   * Handles starting/continuing the game with configured teams
   */
  const handleStartGame = React.useCallback(() => {
    // Validate setup first
    if (!validateSetup()) {
      // If validation fails and rounds are empty, focus the rounds input
      if (roundCount < 1) {
        setTimeout(() => {
          roundsInputRef.current?.focus();
        }, 100);
      }
      return; // Validation error is already set by validateSetup
    }

    const gameTeams: Team[] = filledTeams.map((team, index) => ({
      id: `team-${Date.now()}-${index}`,
      name: team.value.trim(),
      totalScore: 0,
      roundScores: {},
    }));

    if (isEditMode && onUpdateSetup) {
      onUpdateSetup(gameTeams, roundCount);
    } else {
      onStartGame(gameTeams, roundCount);
    }
  }, [
    validateSetup,
    filledTeams,
    roundCount,
    isEditMode,
    onUpdateSetup,
    onStartGame,
  ]);

  /**
   * Handles clearing all data
   */
  const handleClearAll = React.useCallback(() => {
    setClearDialogOpen(false);
    onClearAllData();
  }, [setClearDialogOpen, onClearAllData]);

  /**
   * Gets header text based on game status
   */
  const getHeaderText = (): string => {
    return isEditMode ? "Edit Teams" : "Teams Setup";
  };

  return (
    <Box
      sx={{
        // Account for browser chrome (address bar, tabs, etc.) - Same as RTG
        height: "calc(100vh - 100px)", // Subtract space for browser UI elements
        minHeight: "480px", // Safety minimum for very small screens
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden", // Prevent page-level scrolling
      }}
    >
      {/* Main Content Area - RTG Pattern */}
      <Box
        sx={{
          flex: 1, // Fill available space
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 1, sm: 2 }, // Padding for the card
          overflow: "hidden", // Ensure no overflow
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%", // Take full available height
            maxWidth: {
              xs: "calc(100vw - 16px)",
              sm: "clamp(280px, 50vw, 600px)", // Same as RTG max width constraint
            },
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Single Card Container - Everything Inside */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              borderRadius: 3,
              boxShadow: 4,
              overflow: "hidden",
            }}
          >
            {/* Header Section - Title and Game Settings */}
            <Box
              sx={{
                flexShrink: 0,
                px: { xs: 2, sm: 3 },
                py: { xs: 2, sm: 2.5 },
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              {/* Game Setup Title - Left side */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: "text.primary",
                    fontSize: "clamp(0.9rem, 2vw, 1rem)",
                  }}
                >
                  {getHeaderText()}
                </Typography>
                {/* Small downward arrow pointing to team inputs */}
                <ArrowDownIcon
                  sx={{
                    fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
                    color: "text.secondary",
                    opacity: 0.6,
                    ml: 0.5,
                  }}
                />
              </Box>

              {/* Game Settings - Right side */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: "text.primary",
                      fontSize: "clamp(0.9rem, 2vw, 1rem)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Rounds
                  </Typography>
                  {/* Small rightward arrow pointing to rounds input */}
                  <ArrowRightIcon
                    sx={{
                      fontSize: "clamp(0.9rem, 2vw, 1rem)",
                      color: "text.secondary",
                      opacity: 0.6,
                      ml: 0.25,
                    }}
                  />
                </Box>
                <GameSettings
                  state={state}
                  actions={actions}
                  roundCount={roundCount}
                  filledTeams={filledTeams}
                  error={error}
                  inputRef={roundsInputRef}
                />
              </Box>
            </Box>

            {/* Team Names Input Area - Expandable/Scrollable */}
            <TeamInputs state={state} actions={actions} />

            {/* Bottom Row - Action Buttons */}
            <ActionButtons
              isLoading={isLoading}
              onStartGame={handleStartGame}
              onClearClick={() => setClearDialogOpen(true)}
              isEditMode={isEditMode}
            />
          </Box>
        </Box>
      </Box>

      {/* Clear Confirmation Dialog */}
      <ClearDataDialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearAll}
      />
    </Box>
  );
};
