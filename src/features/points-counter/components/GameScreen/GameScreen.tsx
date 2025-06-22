/**
 * Game Screen Component - Active Quiz Game Interface
 *
 * Main interface for the active quiz game experience providing:
 * - Round navigation at the top for switching between quiz rounds
 * - Responsive team cards grid for score input and display
 * - Action buttons for game management (Leaderboard, Copy, Edit, End Game)
 * - Modal dialogs for leaderboard display and confirmation actions
 * - Error handling and user feedback
 *
 * Layout Structure:
 * - Fixed height container using calc(100vh - 100px) for browser compatibility
 * - Single card container following TeamSetup styling pattern
 * - Three-section layout: Navigation top, Team grid center, Actions bottom
 * - Mobile-responsive design with single-column on small screens
 *
 * Features:
 * - Decimal scoring support through team cards
 * - Real-time leaderboard calculations
 * - Copy-to-clipboard functionality for leaderboard sharing
 * - Edit mode for live game modifications
 * - Confirmation dialogs for destructive actions
 * - No borders/dividers anywhere for clean modern design
 *
 * @fileoverview Main game interface component for Points Counter
 * @version 2.0.0
 * @since December 2025
 */

import React, { useState } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { RoundNavigation } from "../RoundNavigation/RoundNavigation";
import { TeamCard } from "../TeamCard/TeamCard";
import { GameActionButtons } from "./GameActionButtons";
import { LeaderboardModal } from "./LeaderboardModal";
import { EndGameConfirmDialog } from "./EndGameConfirmDialog";

/**
 * Props Interface for GameScreen Component
 */
interface GameScreenProps {
  /** Current game state ('ON' for active game) */
  gameState: "ON" | "OFF";
  /** Array of teams with scores and round data */
  teams: any[];
  /** Total number of rounds configured for this game */
  rounds: number;
  /** Currently active round number (1-based) */
  currentRound: number;
  /** Current error message if any */
  error: string | null;
  /** Calculated leaderboard with positions and rankings */
  leaderboard: any[];
  /** Callback for updating team scores with decimal support */
  onScoreUpdate: (teamId: string, round: number, score: number) => void;
  /** Callback for navigating between rounds */
  onRoundChange: (round: number) => void;
  /** Callback for entering edit mode */
  onEditTeams: () => void;
  /** Callback for ending the game */
  onEndGame: () => void;
  /** Callback for clearing error messages */
  onClearError: () => void;
}

/**
 * Game Screen Component
 *
 * Renders the main game interface with responsive layout and modern design.
 * Handles all game interactions including scoring, navigation, and game management.
 *
 * Usage Example:
 * ```tsx
 * <GameScreen
 *   gameState="ON"
 *   teams={teams}
 *   rounds={5}
 *   currentRound={2}
 *   leaderboard={leaderboard}
 *   onScoreUpdate={(teamId, round, score) => updateScore(teamId, round, score)}
 *   onRoundChange={setCurrentRound}
 *   onEditTeams={enterEditMode}
 *   onEndGame={endGame}
 *   error={null}
 *   onClearError={clearError}
 * />
 * ```
 */
export const GameScreen: React.FC<GameScreenProps> = ({
  teams,
  rounds,
  currentRound,
  error,
  leaderboard,
  onScoreUpdate,
  onRoundChange,
  onEditTeams,
  onEndGame,
  onClearError,
}) => {
  // === MODAL STATE ===
  /** Controls leaderboard modal visibility */
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  /** Controls end game confirmation dialog visibility */
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);

  /**
   * Copy Leaderboard to Clipboard
   *
   * Formats current leaderboard as plain text and copies to clipboard.
   * Provides user feedback through console logging.
   * Falls back gracefully if clipboard API is not available.
   */
  const handleCopyLeaderboard = async () => {
    try {
      // Format leaderboard as plain text
      const leaderboardText = leaderboard
        .map(
          (entry, index) =>
            `${index + 1}. ${entry.team.name} - ${entry.team.totalScore} points`
        )
        .join("\n");

      // Attempt to copy to clipboard
      await navigator.clipboard.writeText(leaderboardText);
      console.log("Leaderboard copied to clipboard");
    } catch (error) {
      console.warn("Failed to copy leaderboard to clipboard:", error);
    }
  };

  /**
   * Handle End Game Action
   *
   * Closes confirmation dialog and triggers game end callback.
   * Provides clean separation between UI state and business logic.
   */
  const handleEndGame = () => {
    setShowEndGameDialog(false);
    onEndGame();
  };

  return (
    <Box
      sx={{
        // === PAGE LAYOUT ===
        // Account for browser chrome - Same height pattern as TeamSetup
        height: "calc(100vh - 100px)",
        minHeight: "480px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        bgcolor: "background.default",
        px: { xs: 1, sm: 2 },
        py: { xs: 1, sm: 2 },
      }}
    >
      {/* === MAIN CARD CONTAINER === */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "clamp(280px, 90vw, 1200px)", // Same maxWidth pattern as TeamSetup
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 3,
            overflow: "hidden",
          }}
        >
          {/* === ERROR ALERT SECTION === */}
          {error && (
            <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: 0.5 }}>
              <Alert
                severity="error"
                onClose={onClearError}
                sx={{
                  fontSize: "clamp(0.8rem, 1.5vw, 0.875rem)",
                  borderRadius: 2,
                  "& .MuiAlert-message": {
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              >
                {error}
              </Alert>
            </Box>
          )}

          {/* === ROUND NAVIGATION SECTION === */}
          {/* Direct in main card - no wrapper Box for clean design */}
          <Box
            sx={{
              flexShrink: 0,
              p: { xs: 1, sm: 2 }, // TeamSetup padding pattern
              pb: "clamp(0.25rem, 1vw, 0.75rem)", // TeamSetup bottom padding
            }}
          >
            <RoundNavigation
              currentRound={currentRound}
              totalRounds={rounds}
              onRoundChange={onRoundChange}
            />
          </Box>

          {/* === TEAMS GRID SECTION === */}
          <Box
            sx={{
              flex: 1,
              px: { xs: 1, sm: 2 },
              pb: { xs: 1, sm: 2 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              overflow: "auto",
            }}
          >
            {teams.length > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: { xs: 2, sm: 3 },
                  width: "100%",
                  // === RESPONSIVE GRID LAYOUT ===
                  // Mobile: Single column, centered cards
                  // Desktop: Multi-column grid layout
                  "@media (min-width: 600px)": {
                    display: "grid",
                    gridTemplateColumns: {
                      sm: "repeat(2, 1fr)", // 2 columns on small screens
                      md: "repeat(3, 1fr)", // 3 columns on medium screens
                      lg: "repeat(4, 1fr)", // 4 columns on large screens
                    },
                    justifyItems: "center",
                    alignItems: "stretch",
                  },
                }}
              >
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    currentRound={currentRound}
                    onScoreUpdate={onScoreUpdate}
                  />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  No teams configured
                </Typography>
              </Box>
            )}
          </Box>

          {/* === ACTION BUTTONS SECTION === */}
          <GameActionButtons
            onShowLeaderboard={() => setShowLeaderboard(true)}
            onCopyLeaderboard={handleCopyLeaderboard}
            onEditTeams={onEditTeams}
            onShowEndGameDialog={() => setShowEndGameDialog(true)}
          />
        </Box>
      </Box>

      {/* === MODALS === */}
      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        teams={teams}
        currentRound={currentRound}
        totalRounds={rounds}
        onCopyLeaderboard={handleCopyLeaderboard}
      />

      <EndGameConfirmDialog
        open={showEndGameDialog}
        onClose={() => setShowEndGameDialog(false)}
        onConfirm={handleEndGame}
      />
    </Box>
  );
};
