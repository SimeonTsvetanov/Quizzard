/**
 * Leaderboard Modal Component
 *
 * Full-screen modal for displaying the game leaderboard with responsive design
 * and copy-to-clipboard functionality.
 *
 * Extracted from GameScreen.tsx to improve maintainability and follow
 * the Single Responsibility Principle from development standards.
 *
 * Features:
 * - Responsive modal with full-screen on mobile, centered on desktop
 * - Beautiful gradient header with trophy emoji
 * - Round display with "Final Round" logic
 * - Scrollable content area for large leaderboards
 * - Copy to clipboard functionality
 * - Clean modern design with proper spacing
 *
 * @fileoverview Leaderboard modal component
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  Chip,
} from "@mui/material";
import { ContentCopy as CopyIcon } from "@mui/icons-material";
import { Leaderboard } from "../Leaderboard/Leaderboard";

/**
 * Props for the LeaderboardModal component
 */
interface LeaderboardModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Array of teams with scores and round data */
  teams: any[];
  /** Currently active round number (1-based) */
  currentRound: number;
  /** Total number of rounds configured for this game */
  totalRounds: number;
  /** Callback to copy leaderboard to clipboard */
  onCopyLeaderboard: () => void;
}

/**
 * Leaderboard Modal Component
 *
 * Displays the game leaderboard in a responsive modal dialog with
 * beautiful styling and copy functionality.
 */
export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  open,
  onClose,
  teams,
  currentRound,
  totalRounds,
  onCopyLeaderboard,
}) => {
  /**
   * Determine round display text for consistency with game screen
   */
  const getRoundDisplayText = (): string => {
    if (currentRound === totalRounds) {
      return "Final Round";
    }
    return `Round ${currentRound}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false} // Remove maxWidth constraint
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 }, // Full screen on mobile, rounded on desktop
          maxHeight: { xs: "100vh", sm: "90vh" }, // Nearly full height
          width: { xs: "100vw", sm: "90vw" }, // Nearly full width
          maxWidth: { xs: "100vw", sm: "800px" }, // Cap maximum width on large screens
          m: { xs: 0, sm: 2 }, // No margin on mobile, some on desktop
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          color: "white",
          p: { xs: 2, sm: 3 },
          borderRadius: { xs: 0, sm: "12px 12px 0 0" },
          textAlign: "center",
          flexShrink: 0, // Don't shrink header
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            fontWeight: 700,
            mb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          🏆 Leaderboard
        </Typography>

        <Chip
          label={getRoundDisplayText()}
          sx={{
            bgcolor: "rgba(255,255,255,0.2)",
            color: "white",
            fontWeight: 600,
            fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        />
      </Box>

      {/* Content Section - Scrollable */}
      <DialogContent
        sx={{
          flex: 1, // Take remaining space
          p: 0,
          overflow: "auto", // Enable scrolling
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(0,0,0,0.1)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,0,0,0.3)",
            borderRadius: "4px",
          },
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Leaderboard
            teams={teams}
            currentRound={currentRound}
            totalRounds={totalRounds}
            showDetails={true}
          />
        </Box>
      </DialogContent>

      {/* Footer Actions */}
      <Box
        sx={{
          flexShrink: 0, // Don't shrink footer
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: { xs: 2, sm: 3 },
          borderRadius: { xs: 0, sm: "0 0 12px 12px" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={onCopyLeaderboard}
            sx={{
              minWidth: { xs: "120px", sm: "140px" },
              fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
            }}
          >
            Copy to Clipboard
          </Button>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              minWidth: { xs: "120px", sm: "140px" },
              fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
            }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
