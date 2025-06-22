/**
 * Game Actions Hook
 *
 * Focused hook that manages game lifecycle actions for the Points Counter.
 * Extracted from the monolithic usePointsCounter hook to improve maintainability
 * and follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Starting new games
 * - Ending/clearing games
 * - Edit mode functionality
 * - Updating game setup
 * - Team score management
 * - Round navigation
 *
 * @fileoverview Game action management for Points Counter
 * @version 1.0.0
 * @since December 2025
 */

import { useCallback } from "react";
import type { Team } from "../types";
import { GAME_CONSTANTS } from "../types";
import { STORAGE_KEYS } from "../../../shared/utils/storageKeys";
import {
  calculateTeamTotalScore,
  isValidScore,
  roundScore,
} from "../utils/gameUtils";
import type { GameState, GameStateActions } from "./useGameState";

/**
 * Game Actions Interface
 */
export interface GameActions {
  startGame: (teams: Team[], rounds: number) => void;
  endGame: () => void;
  enterEditMode: () => void;
  updateGameSetup: (teams: Team[], rounds: number) => void;
  updateTeamScore: (teamId: string, round: number, score: number) => void;
  setCurrentRound: (round: number) => void;
  clearAllData: () => void;
}

/**
 * Game Actions Hook
 *
 * Manages game lifecycle actions and team score operations.
 * Provides comprehensive game management functionality.
 *
 * @param state - Current game state
 * @param actions - Game state actions
 * @returns Object containing game actions
 */
export const useGameActions = (
  state: GameState,
  actions: GameStateActions
): GameActions => {
  const { gameStatus, teams, rounds, currentRound } = state;
  const {
    setGameStatus,
    setTeams,
    setRounds,
    setCurrentRound: setStateCurrentRound,
    setIsLoading,
    setError,
    resetToInitialState,
  } = actions;

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
  const startGame = useCallback(
    (newTeams: Team[], newRounds: number) => {
      setIsLoading(true);
      setError(null);

      try {
        // Validation: Minimum requirements
        if (newTeams.length < 1 || newRounds < 1) {
          setError("Fill minimum one Team and at least 1 Round");
          setIsLoading(false);
          return;
        }

        // Initialize teams with complete round score structure
        const initializedTeams = newTeams.map((team) => {
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
        setStateCurrentRound(1);
        setGameStatus("ON");

        console.log(
          `Started new game: ${newTeams.length} teams, ${newRounds} rounds`
        );

        // Brief loading state for smooth UX
        setTimeout(() => setIsLoading(false), 300);
      } catch (error) {
        console.error("Failed to start game:", error);
        setError("Failed to start game");
        setIsLoading(false);
      }
    },
    [
      setIsLoading,
      setError,
      setTeams,
      setRounds,
      setStateCurrentRound,
      setGameStatus,
    ]
  );

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
      resetToInitialState();

      console.log("Game ended, all data cleared");

      // Brief loading for smooth transition
      setTimeout(() => setIsLoading(false), 300);
    } catch (error) {
      console.error("Failed to end game:", error);
      setError("Failed to end game");
      setIsLoading(false);
    }
  }, [setIsLoading, setError, resetToInitialState]);

  /**
   * Enter Edit Mode
   *
   * Allows modification of teams and rounds while keeping game ON.
   * This enables live adjustments without losing existing scores.
   * UI will show setup screen but with existing data pre-filled.
   */
  const enterEditMode = useCallback(() => {
    setError(null);
    console.log("Entered edit mode");
  }, [setError]);

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
  const updateGameSetup = useCallback(
    (newTeams: Team[], newRounds: number) => {
      setIsLoading(true);
      setError(null);

      try {
        // Validation
        if (newTeams.length < 1 || newRounds < 1) {
          setError("Fill minimum one Team and at least 1 Round");
          setIsLoading(false);
          return;
        }

        // Smart team update: preserve existing scores, add new teams
        const updatedTeams = newTeams.map((newTeam) => {
          const existingTeam = teams.find((t) => t.name === newTeam.name);

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
                roundScores: updatedRoundScores,
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
          setStateCurrentRound(newRounds);
        }

        // Keep gameStatus as 'ON' - don't change it

        console.log(
          `Updated game setup: ${newTeams.length} teams, ${newRounds} rounds`
        );

        setTimeout(() => setIsLoading(false), 300);
      } catch (error) {
        console.error("Failed to update game setup:", error);
        setError("Failed to update game setup");
        setIsLoading(false);
      }
    },
    [
      teams,
      rounds,
      currentRound,
      setIsLoading,
      setError,
      setTeams,
      setRounds,
      setStateCurrentRound,
    ]
  );

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
  const updateTeamScore = useCallback(
    (teamId: string, round: number, score: number) => {
      // Validate score input
      if (!isValidScore(score)) {
        setError(
          `Score must be between ${GAME_CONSTANTS.MIN_SCORE} and ${GAME_CONSTANTS.MAX_SCORE}`
        );
        return;
      }

      // Round to allowed decimal places
      const roundedScore = roundScore(score);

      setError(null);

      setTeams((prevTeams) =>
        prevTeams.map((team) => {
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
    },
    [setError, setTeams]
  );

  /**
   * Navigate to Different Round
   *
   * Changes current round within valid range (1 to rounds).
   * Provides validation and error feedback.
   *
   * @param round - Target round number (1-based)
   */
  const setCurrentRound = useCallback(
    (round: number) => {
      if (round >= 1 && round <= rounds) {
        setStateCurrentRound(round);
        setError(null);
      } else {
        setError(`Round must be between 1 and ${rounds}`);
      }
    },
    [rounds, setStateCurrentRound, setError]
  );

  /**
   * Clear All Data (alias for endGame)
   * Provides semantic clarity for "Clear All" buttons
   */
  const clearAllData = useCallback(() => {
    endGame();
  }, [endGame]);

  return {
    startGame,
    endGame,
    enterEditMode,
    updateGameSetup,
    updateTeamScore,
    setCurrentRound,
    clearAllData,
  };
};
