/**
 * Points Counter - Game Action Buttons Component
 *
 * Responsive action buttons for game management including leaderboard viewing,
 * copying results, editing teams, and ending games. Provides different layouts
 * for mobile and desktop with proper touch targets and accessibility.
 *
 * @fileoverview Game action buttons with responsive design patterns
 * @version 2.0.0
 * @since December 2025
 */

import React from "react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  LeaderboardRounded as LeaderboardIcon,
  ContentCopyRounded as CopyIcon,
  EditRounded as EditIcon,
  StopCircleRounded as EndGameIcon,
} from "@mui/icons-material";

/**
 * Props interface for GameActionButtons component
 */
interface GameActionButtonsProps {
  /** Callback to show leaderboard modal */
  onShowLeaderboard: () => void;
  /** Callback to copy leaderboard to clipboard */
  onCopyLeaderboard: () => void;
  /** Callback to enter edit mode */
  onEditTeams: () => void;
  /** Callback to show end game confirmation */
  onShowEndGameDialog: () => void;
}

/**
 * Game Action Buttons Component
 *
 * Provides responsive action buttons for game management with mobile-first design.
 * Uses different layouts and button types based on screen size for optimal UX.
 *
 * Mobile: Icon-only buttons with tooltips for space efficiency
 * Desktop: Full buttons with icons and text for clarity
 *
 * @param props - Component props with action callbacks
 * @returns Responsive action buttons layout
 */
export const GameActionButtons: React.FC<GameActionButtonsProps> = ({
  onShowLeaderboard,
  onCopyLeaderboard,
  onEditTeams,
  onShowEndGameDialog,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Mobile layout with icon buttons
  if (isMobile) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          width: "100%",
        }}
      >
        {/* Leaderboard Button - Primary Action */}
        <Tooltip title="View Leaderboard" arrow>
          <IconButton
            onClick={onShowLeaderboard}
            color="primary"
            sx={{
              width: 48,
              height: 48,
              fontSize: 28,
              p: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="View leaderboard"
          >
            <LeaderboardIcon
              fontSize="inherit"
              sx={{ lineHeight: 1, verticalAlign: "middle" }}
            />
          </IconButton>
        </Tooltip>

        {/* Copy Button - Secondary Action */}
        <Tooltip title="Copy Results" arrow>
          <IconButton
            onClick={onCopyLeaderboard}
            color="info"
            sx={{
              width: 48,
              height: 48,
              fontSize: 28,
              p: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Copy leaderboard to clipboard"
          >
            <CopyIcon
              fontSize="inherit"
              sx={{ lineHeight: 1, verticalAlign: "middle" }}
            />
          </IconButton>
        </Tooltip>

        {/* Edit Button - Secondary Action */}
        <Tooltip title="Edit Teams" arrow>
          <IconButton
            onClick={onEditTeams}
            color="info"
            sx={{
              width: 48,
              height: 48,
              fontSize: 28,
              p: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Edit teams and rounds"
          >
            <EditIcon
              fontSize="inherit"
              sx={{ lineHeight: 1, verticalAlign: "middle" }}
            />
          </IconButton>
        </Tooltip>

        {/* End Game Button - Destructive Action */}
        <Tooltip title="End Game" arrow>
          <IconButton
            onClick={onShowEndGameDialog}
            color="error"
            sx={{
              width: 48,
              height: 48,
              fontSize: 28,
              p: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="End current game"
          >
            <EndGameIcon
              fontSize="inherit"
              sx={{ lineHeight: 1, verticalAlign: "middle" }}
            />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  // Desktop layout with full buttons
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: { sm: 1.5, md: 2 },
        flexWrap: "wrap",
        width: "100%",
      }}
    >
      {/* Leaderboard Button - Primary Action */}
      <Button
        variant="contained"
        startIcon={<LeaderboardIcon />}
        onClick={onShowLeaderboard}
        sx={{
          fontSize: "clamp(0.8rem, 1.5vw, 0.875rem)",
          px: { sm: 2, md: 3 },
          py: 1,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
        }}
      >
        Leaderboard
      </Button>

      {/* Copy Button - Secondary Action */}
      <Button
        variant="outlined"
        startIcon={<CopyIcon />}
        onClick={onCopyLeaderboard}
        color="info"
        sx={{
          fontSize: "clamp(0.8rem, 1.5vw, 0.875rem)",
          px: { sm: 2, md: 3 },
          py: 1,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 500,
        }}
      >
        Copy
      </Button>

      {/* Edit Button - Secondary Action */}
      <Button
        variant="outlined"
        startIcon={<EditIcon />}
        onClick={onEditTeams}
        color="info"
        sx={{
          fontSize: "clamp(0.8rem, 1.5vw, 0.875rem)",
          px: { sm: 2, md: 3 },
          py: 1,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 500,
        }}
      >
        Edit
      </Button>

      {/* End Game Button - Destructive Action */}
      <Button
        variant="outlined"
        startIcon={<EndGameIcon />}
        onClick={onShowEndGameDialog}
        color="error"
        sx={{
          fontSize: "clamp(0.8rem, 1.5vw, 0.875rem)",
          px: { sm: 2, md: 3 },
          py: 1,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 500,
        }}
      >
        End Game
      </Button>
    </Box>
  );
};
