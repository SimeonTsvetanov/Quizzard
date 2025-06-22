/**
 * Game Persistence Hook
 *
 * Focused hook that manages localStorage persistence for the Points Counter game.
 * Extracted from the monolithic usePointsCounter hook to improve maintainability
 * and follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Loading persisted game state from localStorage
 * - Saving game state to localStorage
 * - Auto-save with debouncing (500ms)
 * - Data validation and error handling
 * - Migration support for legacy keys
 *
 * @fileoverview Persistence management for Points Counter
 * @version 1.0.0
 * @since December 2025
 */

import { useEffect, useCallback } from "react";
import type { Team } from "../types";
import { STORAGE_KEYS } from "../../../shared/utils/storageKeys";
import type { GameState, GameStateActions } from "./useGameState";

/**
 * Game Status Types
 */
type GameStatus = "ON" | "OFF";

/**
 * Complete Game Data Structure for localStorage Persistence
 */
interface GameData {
  gameStatus: GameStatus;
  teams: Team[];
  rounds: number;
  currentRound: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Game Persistence Actions Interface
 */
export interface GamePersistenceActions {
  loadPersistedState: () => void;
  saveGameState: () => void;
}

/**
 * Game Persistence Hook
 *
 * Manages localStorage operations for the Points Counter game.
 * Provides loading, saving, and auto-save functionality.
 *
 * @param state - Current game state
 * @param actions - Game state actions
 * @returns Object containing persistence actions
 */
export const useGamePersistence = (
  state: GameState,
  actions: GameStateActions
): GamePersistenceActions => {
  const { gameStatus, teams, rounds, currentRound } = state;
  const { initializeState, resetToInitialState, setError } = actions;

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
        if (
          gameData.gameStatus &&
          Array.isArray(gameData.teams) &&
          typeof gameData.rounds === "number" &&
          gameData.rounds > 0
        ) {
          initializeState(
            gameData.gameStatus,
            gameData.teams,
            gameData.rounds,
            gameData.currentRound || 1
          );

          console.log(
            `Restored ${gameData.gameStatus} game with ${gameData.teams.length} teams, ${gameData.rounds} rounds`
          );
          return; // Successfully restored
        }
      }

      // No valid data found - initialize fresh game in OFF mode
      console.log("No valid game state found, starting fresh");
      resetToInitialState();
    } catch (error) {
      console.error("Failed to load persisted game state:", error);
      // Reset to safe state on any error
      resetToInitialState();
      setError("Failed to load saved game data");
    }
  }, [initializeState, resetToInitialState, setError]);

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

      localStorage.setItem(
        STORAGE_KEYS.PC_GAME_STATE,
        JSON.stringify(gameData)
      );
    } catch (error) {
      console.error("Failed to save game state:", error);
      setError("Failed to save game progress");
    }
  }, [gameStatus, teams, rounds, currentRound, setError]);

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
      if (gameStatus === "ON" && teams.length > 0) {
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

  return {
    loadPersistedState,
    saveGameState,
  };
};
