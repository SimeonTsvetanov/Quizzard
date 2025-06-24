/**
 * Round Navigation Component
 *
 * Handles navigation between rounds and provides round management actions.
 * This component was extracted from the monolithic QuestionsStep component
 * to improve maintainability and follow Single Responsibility Principle.
 *
 * Features:
 * - Integrated design: < [Round X/Y] [Add] > navigation with beautiful styling
 * - Round button remains central between navigation arrows
 * - Add Round button integrated between Round counter and forward arrow
 * - Responsive design: "Add Round" text on web, "+" icon on mobile
 * - Beautiful Material-UI styling with gradients and animations
 *
 * @fileoverview Round navigation component for quiz wizard
 * @version 8.0.0 (Integrated Add Round button)
 * @since December 2024
 */

import React from "react";
import { Box, Typography, Button, IconButton, Fab } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Edit as EditIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";
import type { Round } from "../../../types";
import { RoundInfoModal } from "../../components/RoundInfo/RoundInfoModal";
import { roundInfoContent } from "../../components/RoundInfo/roundInfoContent";

interface RoundNavigationProps {
  /** Array of all rounds */
  rounds: Round[];
  /** Current round index */
  currentRoundIdx: number;
  /** Current round object */
  currentRound: Round | null;
  /** Go to previous round */
  onPreviousRound: () => void;
  /** Go to next round */
  onNextRound: () => void;
  /** Add new round */
  onAddRound: () => void;
  /** Edit current round */
  onEditRound: () => void;
  /** Delete current round */
  onDeleteRound: () => void;
}

/**
 * Round Navigation Component
 *
 * Provides navigation controls and round management actions for the quiz wizard.
 * Features integrated Add Round button inside the navigation bar.
 *
 * @param props - Component props including rounds data and navigation callbacks
 * @returns JSX element representing the round navigation interface
 */
export const RoundNavigation: React.FC<RoundNavigationProps> = ({
  rounds,
  currentRoundIdx,
  currentRound,
  onPreviousRound,
  onNextRound,
  onAddRound,
  onEditRound,
  onDeleteRound,
}) => {
  const hasRounds = rounds.length > 0;
  const canGoBack = hasRounds && currentRoundIdx > 0;
  const canGoForward = hasRounds && currentRoundIdx < rounds.length - 1;

  // Add state for info modal
  const [infoModalOpen, setInfoModalOpen] = React.useState(false);

  return (
    <Box sx={{ mb: 3 }}>
      {/* Integrated Navigation Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 0.5, sm: 1.5 },
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          },
        }}
      >
        {/* Left Navigation Arrow - At Beginning */}
        <Fab
          onClick={onPreviousRound}
          disabled={!canGoBack}
          size="medium"
          sx={{
            width: { xs: 36, sm: 44 },
            height: { xs: 36, sm: 44 },
            minWidth: { xs: 36, sm: 44 },
            bgcolor: canGoBack ? "primary.main" : "grey.200",
            color: canGoBack ? "white" : "grey.400",
            boxShadow: canGoBack ? 2 : 1,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: canGoBack ? "scale(1)" : "scale(0.9)",
            "&:hover": {
              bgcolor: canGoBack ? "primary.dark" : "grey.200",
              transform: canGoBack ? "scale(1.05)" : "scale(0.9)",
              boxShadow: canGoBack ? 3 : 1,
            },
            "&:active": {
              transform: canGoBack ? "scale(0.95)" : "scale(0.9)",
            },
            "&:disabled": {
              bgcolor: "grey.200",
              color: "grey.400",
              cursor: "not-allowed",
            },
          }}
          aria-label="Previous round"
        >
          <ChevronLeftIcon sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }} />
        </Fab>

        {/* Spacer for center positioning */}
        <Box sx={{ flex: 1 }} />

        {/* Center Round Button (Only show if rounds exist) */}
        {hasRounds ? (
          <>
            <Button
              onClick={onEditRound}
              endIcon={
                <EditIcon sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }} />
              }
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.2 },
                background: "linear-gradient(45deg, #1976d2, #42a5f5)",
                color: "white",
                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                minWidth: { xs: 90, sm: 120 },
                "&:hover": {
                  background: "linear-gradient(45deg, #1565c0, #1976d2)",
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.4)",
                  transform: "translateY(-1px)",
                },
                "&:active": {
                  transform: "translateY(0px)",
                },
              }}
            >
              <Typography
                variant="inherit"
                sx={{
                  fontWeight: 600,
                  fontSize: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                Round {currentRoundIdx + 1}/{rounds.length}
              </Typography>
            </Button>
          </>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              px: { xs: 2, sm: 3 },
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
            }}
          >
            No rounds yet
          </Typography>
        )}

        {/* Add Round Button - Next to Round Button */}
        <Button
          onClick={onAddRound}
          sx={{
            borderRadius: { xs: "50%", sm: 3 }, // Circular on mobile, rounded on web
            textTransform: "none",
            fontWeight: { xs: 600, sm: 500 },
            fontSize: { xs: "1.4rem", sm: "0.8rem" },
            px: { xs: 0, sm: 3 }, // No horizontal padding on mobile for circular shape
            py: { xs: 0, sm: 1.2 }, // No vertical padding on mobile for circular shape
            minWidth: { xs: 40, sm: 120 }, // Match Round button width exactly
            minHeight: { xs: 40, sm: 44 }, // Match Round button height exactly
            width: { xs: 40, sm: 120 }, // Fixed dimensions to match Round button
            height: { xs: 40, sm: 44 }, // Fixed dimensions to match Round button
            ml: { xs: 0.5, sm: 1 },
            background: "linear-gradient(45deg, #4caf50, #66bb6a)",
            color: "white",
            boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": {
              background: "linear-gradient(45deg, #388e3c, #4caf50)",
              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.4)",
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0px)",
            },
          }}
          aria-label="Add round"
        >
          {/* Mobile: Show only + icon, perfectly centered */}
          <Box
            sx={{
              display: { xs: "flex", sm: "none" },
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <AddIcon sx={{ fontSize: "1.6rem" }} />
          </Box>

          {/* Web: Show text only */}
          <Typography
            variant="inherit"
            sx={{
              fontWeight: 600,
              fontSize: "inherit",
              display: { xs: "none", sm: "block" },
              whiteSpace: "nowrap",
            }}
          >
            Add Round
          </Typography>
        </Button>

        {/* Spacer for end positioning */}
        <Box sx={{ flex: 1 }} />

        {/* Right Navigation Arrow - At End */}
        <Fab
          onClick={onNextRound}
          disabled={!canGoForward}
          size="medium"
          sx={{
            width: { xs: 36, sm: 44 },
            height: { xs: 36, sm: 44 },
            minWidth: { xs: 36, sm: 44 },
            bgcolor: canGoForward ? "primary.main" : "grey.200",
            color: canGoForward ? "white" : "grey.400",
            boxShadow: canGoForward ? 2 : 1,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: canGoForward ? "scale(1)" : "scale(0.9)",
            "&:hover": {
              bgcolor: canGoForward ? "primary.dark" : "grey.200",
              transform: canGoForward ? "scale(1.05)" : "scale(0.9)",
              boxShadow: canGoForward ? 3 : 1,
            },
            "&:active": {
              transform: canGoForward ? "scale(0.95)" : "scale(0.9)",
            },
            "&:disabled": {
              bgcolor: "grey.200",
              color: "grey.400",
              cursor: "not-allowed",
            },
          }}
          aria-label="Next round"
        >
          <ChevronRightIcon sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }} />
        </Fab>
      </Box>
    </Box>
  );
};
