/**
 * Round Navigation Component for Points Counter
 * 
 * Provides navigation between quiz rounds with intuitive tab-like interface.
 * Shows current round and allows switching between available rounds.
 * 
 * @fileoverview Round navigation component for quiz game
 * @version 1.0.0
 * @since December 2025
 */

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from '@mui/icons-material';

/**
 * Props interface for RoundNavigation component
 */
interface RoundNavigationProps {
  /** Current active round (1-based) */
  currentRound: number;
  /** Total number of rounds */
  totalRounds: number;
  /** Callback when round changes */
  onRoundChange: (round: number) => void;
}

/**
 * Round Navigation Component
 * Provides intuitive navigation between quiz rounds
 */
export const RoundNavigation: React.FC<RoundNavigationProps> = ({
  currentRound,
  totalRounds,
  onRoundChange,
}) => {
  /**
   * Handles previous round navigation
   */
  const handlePrevious = () => {
    if (currentRound > 1) {
      onRoundChange(currentRound - 1);
    }
  };

  /**
   * Handles next round navigation
   */
  const handleNext = () => {
    if (currentRound < totalRounds) {
      onRoundChange(currentRound + 1);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 1, sm: 2 },
        py: { xs: 0.75, sm: 1 },
        px: { xs: 1, sm: 2 },
        // Removed: backgroundColor, borderRadius, boxShadow, border - no visual container
      }}
    >
      {/* Previous Round Button */}
      <IconButton
        onClick={handlePrevious}
        disabled={currentRound <= 1}
        size="small"
        sx={{
          color: currentRound <= 1 ? 'text.disabled' : 'primary.main',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <PrevIcon />
      </IconButton>

      {/* Round Display */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: { xs: 2, sm: 3 },
          py: { xs: 0.5, sm: 1 },
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 1,
          minWidth: { xs: 120, sm: 140 },
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            textAlign: 'center',
          }}
        >
          Round {currentRound} of {totalRounds}
        </Typography>
      </Box>

      {/* Next Round Button */}
      <IconButton
        onClick={handleNext}
        disabled={currentRound >= totalRounds}
        size="small"
        sx={{
          color: currentRound >= totalRounds ? 'text.disabled' : 'primary.main',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <NextIcon />
      </IconButton>
    </Box>
  );
}; 