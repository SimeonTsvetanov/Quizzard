/**
 * Points Counter Main Page
 * 
 * Main page component that orchestrates the complete Points Counter experience.
 * Manages game flow between team setup and active game screens with ON/OFF state logic.
 * 
 * @fileoverview Main Points Counter page component
 * @version 2.0.0
 * @since December 2025
 */

// React imported via JSX transformation
import { Box, CircularProgress, Alert } from '@mui/material';
import { usePointsCounter } from '../hooks/usePointsCounter';
import { TeamSetup } from '../components/TeamSetup/TeamSetup';
import { GameScreen } from '../components/GameScreen/GameScreen';
import type { Team } from '../types';
import { useCallback, useState } from 'react';

/**
 * Points Counter Main Page Component
 * Orchestrates the complete quiz scoring experience with ON/OFF state management
 */
export default function PointsCounter() {
  const {
    gameStatus,
    isLoading,
    error,
    updateTeamScore,
    setCurrentRound,
    clearError,
    startGame,
    endGame,
    enterEditMode,
    updateGameSetup,
    clearAllData,
    teams,
    rounds,
    currentRound,
    leaderboard,
  } = usePointsCounter();

  const [showSetup, setShowSetup] = useState(false);

  /**
   * Handles starting a new game with configured teams
   */
  const handleStartGame = useCallback((teams: Team[], rounds: number) => {
    startGame(teams, rounds);
    setShowSetup(false); // Hide setup after starting
  }, [startGame]);

  /**
   * Handles updating game setup in edit mode
   */
  const handleUpdateGameSetup = useCallback((teams: Team[], rounds: number) => {
    updateGameSetup(teams, rounds);
    setShowSetup(false); // Return to game screen after update
  }, [updateGameSetup]);

  /**
   * Handles entering edit mode
   */
  const handleEditTeams = useCallback(() => {
    enterEditMode();
    setShowSetup(true); // Show setup screen for editing
  }, [enterEditMode]);

  /**
   * Handles ending the game and clearing all data
   */
  const handleEndGame = useCallback(() => {
    endGame();
    setShowSetup(false); // Return to fresh setup
  }, [endGame]);

  /**
   * Handles clearing all data
   */
  const handleClearAllData = useCallback(() => {
    clearAllData();
    setShowSetup(false); // Return to fresh setup
  }, [clearAllData]);

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          // Account for browser chrome - Same as RTG
          height: 'calc(100vh - 100px)',
          minHeight: '480px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={40} />
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Loading Points Counter...
        </Box>
      </Box>
    );
  }

  // Error state - only show if no specific screen is handling the error
  if (error && !showSetup && gameStatus === 'OFF') {
    return (
      <Box
        sx={{
          // Account for browser chrome - Same as RTG
          height: 'calc(100vh - 100px)',
          minHeight: '480px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
          bgcolor: 'background.default',
        }}
      >
        <Alert
          severity="error"
          onClose={clearError}
          sx={{
            maxWidth: 400,
            '& .MuiAlert-message': {
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            },
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Determine what to show based on game status and user navigation
  const shouldShowSetup = gameStatus === 'OFF' || showSetup;

  // Show setup screen for new games (OFF) or when editing (ON + showSetup)
  if (shouldShowSetup) {
    return (
      <TeamSetup
        gameStatus={gameStatus}
        onStartGame={handleStartGame}
        onUpdateSetup={gameStatus === 'ON' ? handleUpdateGameSetup : undefined}
        onClearAllData={handleClearAllData}
        isLoading={isLoading}
        error={error}
        existingTeams={gameStatus === 'ON' ? teams : undefined}
        existingRounds={gameStatus === 'ON' ? rounds : undefined}
      />
    );
  }

  // Show active game screen when game is ON and not in edit mode
  if (gameStatus === 'ON') {
    return (
      <GameScreen
        gameState={gameStatus} // Pass gameStatus as gameState for compatibility
        teams={teams}
        rounds={rounds}
        currentRound={currentRound}
        error={error}
        leaderboard={leaderboard}
        onScoreUpdate={updateTeamScore}
        onRoundChange={setCurrentRound}
        onEditTeams={handleEditTeams}
        onEndGame={handleEndGame}
        onClearError={clearError}
      />
    );
  }

  // Fallback - should not reach here, but show setup as safe default
  return (
    <TeamSetup
      gameStatus="OFF"
      onStartGame={handleStartGame}
      onClearAllData={handleClearAllData}
      isLoading={isLoading}
      error={error}
    />
  );
}
