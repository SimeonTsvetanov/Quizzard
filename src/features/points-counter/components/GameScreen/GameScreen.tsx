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

import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
} from '@mui/material';
import {
  Leaderboard as LeaderboardIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Stop as EndIcon,
} from '@mui/icons-material';
import { RoundNavigation } from '../RoundNavigation/RoundNavigation';
import { TeamCard } from '../TeamCard/TeamCard';
import { Leaderboard } from '../Leaderboard/Leaderboard';

/**
 * Props Interface for GameScreen Component
 */
interface GameScreenProps {
  /** Current game state ('ON' for active game) */
  gameState: 'ON' | 'OFF';
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
        .map((entry, index) => 
          `${index + 1}. ${entry.team.name} - ${entry.team.totalScore} points`
        )
        .join('\n');

      // Attempt to copy to clipboard
      await navigator.clipboard.writeText(leaderboardText);
      console.log('Leaderboard copied to clipboard');
    } catch (error) {
      console.warn('Failed to copy leaderboard to clipboard:', error);
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
        height: 'calc(100vh - 100px)',
        minHeight: '480px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        bgcolor: 'background.default',
        px: { xs: 1, sm: 2 },
        py: { xs: 1, sm: 2 },
      }}
    >
      {/* === MAIN CARD CONTAINER === */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 'clamp(280px, 90vw, 1200px)', // Same maxWidth pattern as TeamSetup
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 3,
            overflow: 'hidden',
          }}
        >
          {/* === ERROR ALERT SECTION === */}
          {error && (
            <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: 0.5 }}>
              <Alert 
                severity="error" 
                onClose={onClearError}
                sx={{ 
                  fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    display: 'flex',
                    alignItems: 'center',
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
              pb: 'clamp(0.25rem, 1vw, 0.75rem)', // TeamSetup bottom padding
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
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflow: 'auto',
            }}
          >
            {teams.length > 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: { xs: 2, sm: 3 },
                  width: '100%',
                  // === RESPONSIVE GRID LAYOUT ===
                  // Mobile: Single column, centered cards
                  // Desktop: Multi-column grid layout
                  '@media (min-width: 600px)': {
                    display: 'grid',
                    gridTemplateColumns: {
                      sm: 'repeat(2, 1fr)',  // 2 columns on small screens
                      md: 'repeat(3, 1fr)',  // 3 columns on medium screens
                      lg: 'repeat(4, 1fr)',  // 4 columns on large screens
                    },
                    justifyItems: 'center',
                    alignItems: 'stretch',
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
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic' }}
                >
                  No teams configured
                </Typography>
              </Box>
            )}
          </Box>

          {/* === ACTION BUTTONS SECTION === */}
          <Box
            sx={{
              flexShrink: 0,
              p: { xs: 1, sm: 2 }, // TeamSetup padding pattern
              pt: 'clamp(0.25rem, 1vw, 0.75rem)', // TeamSetup top padding
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                flexWrap: 'wrap', // Allow wrapping on very small screens
              }}
            >
              {/* === LEADERBOARD BUTTON === */}
              <Button
                variant="contained"
                size="small"
                startIcon={<LeaderboardIcon />}
                onClick={() => setShowLeaderboard(true)}
                sx={{
                  fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: 2,
                  boxShadow: 'none',
                  bgcolor: 'primary.main',
                  border: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                    bgcolor: 'primary.dark',
                    border: 'none',
                  },
                  '& .MuiButton-startIcon': {
                    display: { xs: 'none', sm: 'flex' }, // Hide icon on mobile when text shown
                  },
                  minWidth: { xs: 'auto', sm: 'auto' },
                }}
              >
                {/* Responsive button content */}
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Leaderboard</Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  <LeaderboardIcon fontSize="small" />
                </Box>
              </Button>
              
              {/* === COPY BUTTON === */}
              <Button
                variant="contained"
                size="small"
                startIcon={<CopyIcon />}
                onClick={handleCopyLeaderboard}
                sx={{
                  fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: 2,
                  boxShadow: 'none',
                  bgcolor: 'secondary.main',
                  color: 'secondary.contrastText',
                  border: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                    bgcolor: 'secondary.dark',
                    border: 'none',
                  },
                  '& .MuiButton-startIcon': {
                    display: { xs: 'none', sm: 'flex' }, // Hide icon on mobile when text shown
                  },
                  minWidth: { xs: 'auto', sm: 'auto' },
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Copy</Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  <CopyIcon fontSize="small" />
                </Box>
              </Button>
              
              {/* === EDIT BUTTON === */}
              <Button
                variant="contained"
                size="small"
                startIcon={<EditIcon />}
                onClick={onEditTeams}
                sx={{
                  fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: 2,
                  boxShadow: 'none',
                  bgcolor: 'info.main',
                  color: 'info.contrastText',
                  border: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                    bgcolor: 'info.dark',
                    border: 'none',
                  },
                  '& .MuiButton-startIcon': {
                    display: { xs: 'none', sm: 'flex' }, // Hide icon on mobile when text shown
                  },
                  minWidth: { xs: 'auto', sm: 'auto' },
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Edit</Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  <EditIcon fontSize="small" />
                </Box>
              </Button>
              
              {/* === END GAME BUTTON === */}
              <Button
                variant="contained"
                size="small"
                startIcon={<EndIcon />}
                onClick={() => setShowEndGameDialog(true)}
                sx={{
                  fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: 2,
                  boxShadow: 'none',
                  bgcolor: 'error.main',
                  color: 'error.contrastText',
                  border: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                    bgcolor: 'error.dark',
                    border: 'none',
                  },
                  '& .MuiButton-startIcon': {
                    display: { xs: 'none', sm: 'flex' }, // Hide icon on mobile when text shown
                  },
                  minWidth: { xs: 'auto', sm: 'auto' },
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>End Game</Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  <EndIcon fontSize="small" />
                </Box>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* === LEADERBOARD MODAL === */}
      <Dialog
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
          }}
        >
          Leaderboard
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Leaderboard
            teams={teams}
            currentRound={currentRound}
            showDetails={true}
          />
        </DialogContent>
        
        <DialogActions
          sx={{
            justifyContent: 'center',
            gap: 2,
            p: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyLeaderboard}
            sx={{ border: 'none' }}
          >
            Copy to Clipboard
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowLeaderboard(false)}
            sx={{ border: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* === END GAME CONFIRMATION DIALOG === */}
      <Dialog
        open={showEndGameDialog}
        onClose={() => setShowEndGameDialog(false)}
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontWeight: 600,
            color: 'error.main',
          }}
        >
          End Game?
        </DialogTitle>
        
        <DialogContent>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              lineHeight: 1.6,
            }}
          >
            Are you sure you want to end the current game? All progress will be lost.
          </Typography>
        </DialogContent>
        
        <DialogActions
          sx={{
            justifyContent: 'center',
            gap: 2,
            p: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setShowEndGameDialog(false)}
            sx={{ border: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleEndGame}
            sx={{ border: 'none' }}
          >
            End Game
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 