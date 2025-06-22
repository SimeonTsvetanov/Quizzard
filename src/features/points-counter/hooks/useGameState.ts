/**
 * Game State Management Hook
 *
 * Focused hook that manages the core state of the Points Counter game.
 * Extracted from the monolithic usePointsCounter hook to improve maintainability
 * and follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Game status management (ON/OFF)
 * - Teams state management
 * - Rounds configuration
 * - UI state (loading, errors)
 * - Current round navigation
 *
 * @fileoverview Core state management for Points Counter
 * @version 1.0.0
 * @since December 2025
 */

import { useState, useCallback, useMemo } from "react";
import type { Team } from "../types";
import { GAME_CONSTANTS } from "../types";
import { createLeaderboard } from "../utils/gameUtils";

/**
 * Game Status Types
 */
type GameStatus = "ON" | "OFF";

/**
 * Game State Interface
 */
export interface GameState {
  gameStatus: GameStatus;
  teams: Team[];
  rounds: number;
  currentRound: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Game State Actions Interface
 */
export interface GameStateActions {
  setGameStatus: (status: GameStatus) => void;
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  setRounds: (rounds: number) => void;
  setCurrentRound: (round: number) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetToInitialState: () => void;
  initializeState: (
    gameStatus: GameStatus,
    teams: Team[],
    rounds: number,
    currentRound: number
  ) => void;
}

/**
 * Return interface for useGameState hook
 */
export interface UseGameStateReturn {
  state: GameState;
  actions: GameStateActions;
  derived: {
    leaderboard: ReturnType<typeof createLeaderboard>;
  };
}

/**
 * Game State Management Hook
 *
 * Manages the core state variables for the Points Counter game.
 * Provides actions for state updates and derived data calculations.
 *
 * @returns Object containing state, actions, and derived data
 */
export const useGameState = (): UseGameStateReturn => {
  // === PRIMARY STATE ===
  const [gameStatus, setGameStatus] = useState<GameStatus>("OFF");
  const [teams, setTeams] = useState<Team[]>([]);
  const [rounds, setRounds] = useState<number>(GAME_CONSTANTS.DEFAULT_ROUNDS);
  const [currentRound, setCurrentRound] = useState(1);

  // === UI STATE ===
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear current error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state to initial values
   */
  const resetToInitialState = useCallback(() => {
    setGameStatus("OFF");
    setTeams([]);
    setRounds(GAME_CONSTANTS.DEFAULT_ROUNDS);
    setCurrentRound(1);
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * Initialize state with provided values (for persistence restoration)
   */
  const initializeState = useCallback(
    (
      gameStatus: GameStatus,
      teams: Team[],
      rounds: number,
      currentRound: number
    ) => {
      setGameStatus(gameStatus);
      setTeams(teams);
      setRounds(rounds);
      setCurrentRound(currentRound);
      setError(null);
    },
    []
  );

  // === DERIVED DATA ===
  // Memoize leaderboard calculation to prevent unnecessary recalculations
  const leaderboard = useMemo(() => {
    return createLeaderboard(teams);
  }, [teams]);

  return {
    state: {
      gameStatus,
      teams,
      rounds,
      currentRound,
      isLoading,
      error,
    },
    actions: {
      setGameStatus,
      setTeams,
      setRounds,
      setCurrentRound,
      setIsLoading,
      setError,
      clearError,
      resetToInitialState,
      initializeState,
    },
    derived: {
      leaderboard,
    },
  };
};
