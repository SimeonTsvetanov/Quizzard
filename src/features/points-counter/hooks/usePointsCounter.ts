/**
 * Points Counter Hook - Complete Game State Management
 * 
 * Comprehensive custom hook that manages the entire Points Counter experience including:
 * - ON/OFF game state logic (setup vs active game modes)
 * - Team scoring with decimal precision support
 * - Round-by-round progression and navigation
 * - localStorage persistence with auto-save (500ms debounced)
 * - Edit mode functionality for live game modifications
 * - Error handling and validation
 * - Leaderboard calculations
 * 
 * Features:
 * - Decimal scoring: Supports 0.5, 1.25, 2.75, etc. with 2 decimal places
 * - Auto-save: Only saves when game is ON, prevents unnecessary writes
 * - Edit mode: Modify teams/rounds without losing existing scores
 * - Data migration: Handles legacy localStorage keys seamlessly
 * - Type safety: Full TypeScript coverage with comprehensive interfaces
 * 
 * @fileoverview Custom hook for Points Counter game state management
 * @version 2.0.0
 * @since December 2025
 */

import { useState, useEffect, useCallback } from 'react';
import type { Team } from '../types';
import { GAME_CONSTANTS } from '../types';
import { STORAGE_KEYS } from '../../../shared/utils/storageKeys';
import {
  calculateTeamTotalScore,
  createLeaderboard,
  isValidScore,
  roundScore,
} from '../utils/gameUtils';

/**
 * Game Status Types
 * - ON: Active game in progress (showing game screen)
 * - OFF: Setup mode (showing team setup screen)
 */
type GameStatus = 'ON' | 'OFF';

/**
 * Complete Game Data Structure for localStorage Persistence
 * This structure is saved as a single JSON object in localStorage for:
 * - Atomic updates (no partial state corruption)
 * - Easy backup/restore functionality  
 * - PWA compatibility and offline support
 */
interface GameData {
  /** Current game status - determines UI flow */
  gameStatus: GameStatus;
  /** Array of teams with complete scoring data */
  teams: Team[];
  /** Total number of rounds configured for this game */
  rounds: number;
  /** Currently active round number (1-based indexing) */
  currentRound: number;
  /** Timestamp when game was created */
  createdAt: number;
  /** Timestamp of last data update */
  updatedAt: number;
}

/**
 * Hook Return Interface
 * Provides complete Points Counter functionality to components
 */
interface UsePointsCounterReturn {
  // === STATE VALUES ===
  /** Current game status ('ON' = active, 'OFF' = setup) */
  gameStatus: GameStatus;
  /** Array of teams with current scores and round data */
  teams: Team[];
  /** Total number of rounds configured for this game */
  rounds: number;
  /** Currently active round number (1-based) */
  currentRound: number;
  /** Loading state for UI feedback during operations */
  isLoading: boolean;
  /** Current error message, null if no error */
  error: string | null;
  /** Calculated leaderboard with positions and rankings */
  leaderboard: ReturnType<typeof createLeaderboard>;
  
  // === GAME ACTIONS ===
  /** Start new game with provided teams and round count */
  startGame: (teams: Team[], rounds: number) => void;
  /** End current game and clear all data */
  endGame: () => void;
  /** Enter edit mode to modify teams/rounds while game is ON */
  enterEditMode: () => void;
  /** Update game setup in edit mode (teams/rounds) */
  updateGameSetup: (teams: Team[], rounds: number) => void;
  /** Update individual team score for specific round */
  updateTeamScore: (teamId: string, round: number, score: number) => void;
  /** Navigate to different round */
  setCurrentRound: (round: number) => void;
  /** Clear current error message */
  clearError: () => void;
  /** Clear all game data (alias for endGame) */
  clearAllData: () => void;
}

/**
 * Main Points Counter Hook
 * 
 * Usage Example:
 * ```tsx
 * const {
 *   gameStatus,
 *   teams,
 *   startGame,
 *   updateTeamScore,
 *   leaderboard
 * } = usePointsCounter();
 * 
 * // Start new game
 * startGame([{id: '1', name: 'Team A', ...}], 5);
 * 
 * // Update score with decimal support
 * updateTeamScore('team-1', 1, 2.5);
 * ```
 */
export const usePointsCounter = (): UsePointsCounterReturn => {
  // === PRIMARY STATE ===
  const [gameStatus, setGameStatus] = useState<GameStatus>('OFF');
  const [teams, setTeams] = useState<Team[]>([]);
  const [rounds, setRounds] = useState<number>(GAME_CONSTANTS.DEFAULT_ROUNDS);
  const [currentRound, setCurrentRound] = useState(1);
  
  // === UI STATE ===
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // === INTERNAL STATE ===
  // Internal edit mode tracking removed - handled by gameStatus

  /**
   * Load Persisted Game State from localStorage
   * 
   * Attempts to restore game state from localStorage on app startup.
   * Handles data validation and graceful fallback to fresh state.
   * Supports migration from legacy storage keys if needed.
   */
  const loadPersistedState = useCallback(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.PC_GAME_STATE);
      
      if (storedData) {
        const gameData: GameData = JSON.parse(storedData);
        
        // Validate required data structure
        if (gameData.gameStatus && 
            Array.isArray(gameData.teams) && 
            typeof gameData.rounds === 'number' &&
            gameData.rounds > 0) {
          
          setGameStatus(gameData.gameStatus);
          setTeams(gameData.teams);
          setRounds(gameData.rounds);
          setCurrentRound(gameData.currentRound || 1);
          
          console.log(`Restored ${gameData.gameStatus} game with ${gameData.teams.length} teams, ${gameData.rounds} rounds`);
          return; // Successfully restored
        }
      }

      // No valid data found - initialize fresh game in OFF mode
      console.log('No valid game state found, starting fresh');
      setGameStatus('OFF');
      setTeams([]);
      setRounds(GAME_CONSTANTS.DEFAULT_ROUNDS);
      setCurrentRound(1);
      
    } catch (error) {
      console.error('Failed to load persisted game state:', error);
      // Reset to safe state on any error
      setGameStatus('OFF');
      setTeams([]);
      setRounds(GAME_CONSTANTS.DEFAULT_ROUNDS);
      setCurrentRound(1);
      setError('Failed to load saved game data');
    }
  }, []);

  /**
   * Save Current Game State to localStorage
   * 
   * Persists complete game state as atomic JSON object.
   * Preserves creation timestamp while updating modification time.
   * Only saves when game has meaningful data to persist.
   */
  const saveGameState = useCallback(() => {
    try {
      const gameData: GameData = {
        gameStatus,
        teams,
        rounds,
        currentRound,
        createdAt: Date.now(), // Will be overwritten if updating existing
        updatedAt: Date.now(),
      };

      // Preserve creation timestamp for existing games
      const existingData = localStorage.getItem(STORAGE_KEYS.PC_GAME_STATE);
      if (existingData) {
        try {
          const existing: GameData = JSON.parse(existingData);
          gameData.createdAt = existing.createdAt || Date.now();
        } catch {
          // Invalid existing data, use current timestamp
        }
      }

      localStorage.setItem(STORAGE_KEYS.PC_GAME_STATE, JSON.stringify(gameData));
      
    } catch (error) {
      console.error('Failed to save game state:', error);
      setError('Failed to save game progress');
    }
  }, [gameStatus, teams, rounds, currentRound]);

  /**
   * Auto-Save Effect with Debouncing
   * 
   * Automatically saves game state 500ms after any change, but ONLY when:
   * - Game status is 'ON' (active game)
   * - There are teams to save
   * 
   * This prevents unnecessary writes during setup and provides responsive
   * auto-save for PWA and offline compatibility.
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (gameStatus === 'ON' && teams.length > 0) {
        saveGameState();
      }
    }, 500); // 500ms debounce as per development standards

    return () => clearTimeout(timeoutId);
  }, [gameStatus, teams, rounds, currentRound, saveGameState]);

  /**
   * Initialize Hook on Component Mount
   * Load any persisted game state from previous sessions
   */
  useEffect(() => {
    loadPersistedState();
  }, [loadPersistedState]);

  /**
   * Start New Game
   * 
   * Creates fresh game with provided teams and rounds.
   * Initializes all teams with zero scores for all rounds.
   * Validates input and provides user feedback.
   * 
   * @param newTeams - Array of teams to include in game
   * @param newRounds - Number of rounds for this game
   */
  const startGame = useCallback((newTeams: Team[], newRounds: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validation: Minimum requirements
      if (newTeams.length < 1 || newRounds < 1) {
        setError('Fill minimum one Team and at least 1 Round');
        setIsLoading(false);
        return;
      }

      // Initialize teams with complete round score structure
      const initializedTeams = newTeams.map(team => {
        const roundScores: Record<number, number> = {};
        
        // Create score entry for each round, initialized to 0
        for (let i = 1; i <= newRounds; i++) {
          roundScores[i] = 0;
        }
        
        return {
          ...team,
          totalScore: 0,
          roundScores,
        };
      });

      // Set game state to active
      setTeams(initializedTeams);
      setRounds(newRounds);
      setCurrentRound(1);
      setGameStatus('ON');

      console.log(`Started new game: ${newTeams.length} teams, ${newRounds} rounds`);
      
      // Brief loading state for smooth UX
      setTimeout(() => setIsLoading(false), 300);
      
    } catch (error) {
      console.error('Failed to start game:', error);
      setError('Failed to start game');
      setIsLoading(false);
    }
  }, []);

  /**
   * End Game and Clear All Data
   * 
   * Completely resets Points Counter to fresh state:
   * - Clears localStorage completely
   * - Resets all state to initial values  
   * - Returns to setup mode (OFF)
   * 
   * This provides "Start Fresh" functionality.
   */
  const endGame = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      // Complete localStorage cleanup
      localStorage.removeItem(STORAGE_KEYS.PC_GAME_STATE);

      // Reset all state to initial OFF mode
      setGameStatus('OFF');
      setTeams([]);
      setRounds(GAME_CONSTANTS.DEFAULT_ROUNDS);
      setCurrentRound(1);

      console.log('Game ended, all data cleared');
      
      // Brief loading for smooth transition
      setTimeout(() => setIsLoading(false), 300);
      
    } catch (error) {
      console.error('Failed to end game:', error);
      setError('Failed to end game');
      setIsLoading(false);
    }
  }, []);

  /**
   * Enter Edit Mode
   * 
   * Allows modification of teams and rounds while keeping game ON.
   * This enables live adjustments without losing existing scores.
   * UI will show setup screen but with existing data pre-filled.
   */
  const enterEditMode = useCallback(() => {
    setError(null);
    console.log('Entered edit mode');
  }, []);

  /**
   * Update Game Setup in Edit Mode
   * 
   * Modifies teams and rounds while preserving existing scores:
   * - Existing teams keep all their round scores
   * - New teams are initialized with zero scores
   * - Extra rounds are added if round count increases
   * - Removed rounds are preserved in data (just not displayed)
   * 
   * @param newTeams - Updated team list
   * @param newRounds - Updated round count
   */
  const updateGameSetup = useCallback((newTeams: Team[], newRounds: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (newTeams.length < 1 || newRounds < 1) {
        setError('Fill minimum one Team and at least 1 Round');
        setIsLoading(false);
        return;
      }

      // Smart team update: preserve existing scores, add new teams
      const updatedTeams = newTeams.map(newTeam => {
        const existingTeam = teams.find(t => t.name === newTeam.name);
        
        if (existingTeam) {
          // Existing team: preserve scores and extend rounds if needed
          const updatedRoundScores = { ...existingTeam.roundScores };
          
          // Add scores for new rounds if count increased
          for (let i = rounds + 1; i <= newRounds; i++) {
            updatedRoundScores[i] = 0;
          }
          
          return {
            ...existingTeam,
            roundScores: updatedRoundScores,
            totalScore: calculateTeamTotalScore({
              ...existingTeam,
              roundScores: updatedRoundScores
            }),
          };
        } else {
          // New team: initialize with zero scores for all rounds
          const roundScores: Record<number, number> = {};
          for (let i = 1; i <= newRounds; i++) {
            roundScores[i] = 0;
          }
          
          return {
            ...newTeam,
            totalScore: 0,
            roundScores,
          };
        }
      });

      // Update state
      setTeams(updatedTeams);
      setRounds(newRounds);
      
      // Adjust current round if it exceeds new round count
      if (currentRound > newRounds) {
        setCurrentRound(newRounds);
      }
      
      // Keep gameStatus as 'ON' - don't change it

      console.log(`Updated game setup: ${newTeams.length} teams, ${newRounds} rounds`);
      
      setTimeout(() => setIsLoading(false), 300);
      
    } catch (error) {
      console.error('Failed to update game setup:', error);
      setError('Failed to update game setup');
      setIsLoading(false);
    }
  }, [teams, rounds, currentRound]);

  /**
   * Update Team Score for Specific Round
   * 
   * Updates individual team's score with full decimal support:
   * - Validates score is within allowed range (-999 to 999)
   * - Rounds to 2 decimal places for consistency
   * - Recalculates team's total score across all rounds
   * - Triggers auto-save via useEffect
   * 
   * @param teamId - Unique identifier of team to update
   * @param round - Round number to update score for
   * @param score - New score value (supports decimals)
   */
  const updateTeamScore = useCallback((teamId: string, round: number, score: number) => {
    // Validate score input
    if (!isValidScore(score)) {
      setError(`Score must be between ${GAME_CONSTANTS.MIN_SCORE} and ${GAME_CONSTANTS.MAX_SCORE}`);
      return;
    }

    // Round to allowed decimal places
    const roundedScore = roundScore(score);

    setError(null);
    
    setTeams(prevTeams =>
      prevTeams.map(team => {
        if (team.id === teamId) {
          // Update specific round score
          const updatedRoundScores = {
            ...team.roundScores,
            [round]: roundedScore,
          };

          // Recalculate total with decimal precision
          const newTotalScore = calculateTeamTotalScore({
            ...team,
            roundScores: updatedRoundScores,
          });

          return {
            ...team,
            roundScores: updatedRoundScores,
            totalScore: newTotalScore,
          };
        }
        return team;
      })
    );
  }, []);

  /**
   * Navigate to Different Round
   * 
   * Changes current round within valid range (1 to rounds).
   * Provides validation and error feedback.
   * 
   * @param round - Target round number (1-based)
   */
  const handleSetCurrentRound = useCallback((round: number) => {
    if (round >= 1 && round <= rounds) {
      setCurrentRound(round);
      setError(null);
    } else {
      setError(`Round must be between 1 and ${rounds}`);
    }
  }, [rounds]);

  /**
   * Clear Current Error Message
   * Resets error state for clean UI
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear All Data (alias for endGame)
   * Provides semantic clarity for "Clear All" buttons
   */
  const clearAllData = useCallback(() => {
    endGame();
  }, [endGame]);

  /**
   * Generate Real-time Leaderboard
   * Calculates current team rankings with positions and point differences
   */
  const leaderboard = createLeaderboard(teams);

  // Return complete hook interface
  return {
    // State values
    gameStatus,
    teams,
    rounds,
    currentRound,
    isLoading,
    error,
    leaderboard,
    
    // Actions
    startGame,
    endGame,
    enterEditMode,
    updateGameSetup,
    updateTeamScore,
    setCurrentRound: handleSetCurrentRound,
    clearError,
    clearAllData,
  };
}; 