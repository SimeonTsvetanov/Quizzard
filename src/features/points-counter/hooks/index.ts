/**
 * Points Counter Feature Hook Exports
 *
 * This file provides centralized exports for all hooks related to
 * the Points Counter feature.
 *
 * Hooks exported:
 * - usePointsCounter: Main Points Counter hook (REFACTORED - now composition hook)
 * - useGameState: Core state management (REFACTORED)
 * - useGamePersistence: localStorage operations and auto-save (REFACTORED)
 * - useGameActions: Game lifecycle actions (REFACTORED)
 *
 * Usage:
 * import { usePointsCounter } from './hooks';
 *
 * @fileoverview Hook exports for Points Counter feature
 * @version 2.0.0 (Refactored)
 */

// REFACTORED: Main composition hook
export { usePointsCounter } from "./usePointsCounter";

// REFACTORED: Separated concerns following Single Responsibility Principle
export { useGameState } from "./useGameState";
export { useGamePersistence } from "./useGamePersistence";
export { useGameActions } from "./useGameActions";

// Export types for external use
export type {
  GameState,
  GameStateActions,
  UseGameStateReturn,
} from "./useGameState";
export type { GamePersistenceActions } from "./useGamePersistence";
export type { GameActions } from "./useGameActions";
