/**
 * Points Counter Hook - Refactored Composition Hook
 *
 * REFACTORED: This hook now composes smaller, focused hooks following
 * the Single Responsibility Principle. The original monolithic 549-line
 * hook has been split into:
 * - useGameState: Core state management and navigation
 * - useGamePersistence: localStorage operations and auto-save logic
 * - useGameActions: Game lifecycle actions and score management
 *
 * This hook maintains backward compatibility while providing a cleaner,
 * more maintainable architecture.
 *
 * Original Features Preserved:
 * - ON/OFF game state logic (setup vs active game modes)
 * - Team scoring with decimal precision support
 * - Round-by-round progression and navigation
 * - localStorage persistence with auto-save (500ms debounced)
 * - Edit mode functionality for live game modifications
 * - Error handling and validation
 * - Leaderboard calculations
 *
 * @fileoverview Refactored composition hook for Points Counter
 * @version 3.0.0 (Refactored)
 * @since December 2025
 */

import { useGameState } from "./useGameState";
import { useGamePersistence } from "./useGamePersistence";
import { useGameActions } from "./useGameActions";
import type { Team } from "../types";
import { createLeaderboard } from "../utils/gameUtils";

/**
 * Hook Return Interface
 * Provides complete Points Counter functionality to components
 * Maintains backward compatibility with original API
 */
interface UsePointsCounterReturn {
  // === STATE VALUES ===
  /** Current game status ('ON' = active, 'OFF' = setup) */
  gameStatus: "ON" | "OFF";
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
 * Main Points Counter Hook (Refactored)
 *
 * This hook composes the smaller, focused hooks to provide a unified
 * interface for Points Counter game management. It maintains backward
 * compatibility with the original API while benefiting from improved
 * maintainability through Single Responsibility Principle.
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
  // Compose focused hooks following Single Responsibility Principle
  const { state, actions: stateActions, derived } = useGameState();

  // Initialize persistence (auto-loads and auto-saves)
  useGamePersistence(state, stateActions);

  // Get game actions that work with the state
  const gameActions = useGameActions(state, stateActions);

  // Return complete hook interface maintaining backward compatibility
  return {
    // State values from useGameState
    gameStatus: state.gameStatus,
    teams: state.teams,
    rounds: state.rounds,
    currentRound: state.currentRound,
    isLoading: state.isLoading,
    error: state.error,
    leaderboard: derived.leaderboard,

    // Actions from useGameActions
    startGame: gameActions.startGame,
    endGame: gameActions.endGame,
    enterEditMode: gameActions.enterEditMode,
    updateGameSetup: gameActions.updateGameSetup,
    updateTeamScore: gameActions.updateTeamScore,
    setCurrentRound: gameActions.setCurrentRound,
    clearAllData: gameActions.clearAllData,

    // Additional actions from useGameState
    clearError: stateActions.clearError,
  };
};
