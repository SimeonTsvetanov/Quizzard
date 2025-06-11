/**
 * TypeScript Type Definitions for Points Counter Feature
 * 
 * Defines all interfaces and types used throughout the Points Counter
 * for quiz scoring, team management, and game state persistence.
 * 
 * @fileoverview Points Counter type definitions and interfaces
 * @version 1.0.0
 * @since December 2025
 */

/**
 * Represents a single team participating in the quiz
 */
export interface Team {
  /** Unique identifier for the team */
  id: string;
  /** Display name of the team (editable by user) */
  name: string;
  /** Total accumulated points across all rounds */
  totalScore: number;
  /** Points scored in each round (indexed by round number) */
  roundScores: Record<number, number>;
  /** Color theme for team identification (optional) */
  color?: string;
}

/**
 * Represents a single round in the quiz
 */
export interface Round {
  /** Round number (1-based indexing) */
  number: number;
  /** Optional round title/description */
  title?: string;
  /** Whether this round has been completed */
  completed: boolean;
  /** Points awarded to each team in this round */
  teamScores: Record<string, number>; // teamId -> score
}

/**
 * Complete game state for the Points Counter
 */
export interface GameState {
  /** Array of all teams in the game */
  teams: Team[];
  /** Array of all rounds in the game */
  rounds: Round[];
  /** Currently active round number */
  currentRound: number;
  /** Total number of rounds planned */
  totalRounds: number;
  /** Whether the game is in setup mode or active play */
  gameMode: 'setup' | 'playing' | 'finished';
  /** Game creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Props interface for team scoring cards
 */
export interface TeamCardProps {
  /** Team data to display */
  team: Team;
  /** Current round number for score input */
  currentRound: number;
  /** Callback when team score is updated */
  onScoreUpdate: (teamId: string, roundScore: number) => void;
  /** Whether the card is in edit mode */
  editMode?: boolean;
}

/**
 * Props interface for the leaderboard component
 */
export interface LeaderboardProps {
  /** Array of teams sorted by score */
  teams: Team[];
  /** Whether to show detailed round breakdown */
  showDetails?: boolean;
  /** Current round number for context */
  currentRound: number;
}

/**
 * Props interface for round navigation
 */
export interface RoundNavigationProps {
  /** Current active round */
  currentRound: number;
  /** Total number of rounds */
  totalRounds: number;
  /** Callback when round is changed */
  onRoundChange: (round: number) => void;
  /** Whether navigation is disabled */
  disabled?: boolean;
}

/**
 * Configuration options for team setup
 */
export interface TeamSetupConfig {
  /** Number of teams to create */
  teamCount: number;
  /** Whether to use random funny team names */
  useRandomNames: boolean;
  /** Custom team names provided by user */
  customNames?: string[];
}

/**
 * Leaderboard entry for ranking display
 */
export interface LeaderboardEntry {
  /** Ranking position (1st, 2nd, 3rd, etc.) */
  position: number;
  /** Team data */
  team: Team;
  /** Points difference from first place */
  pointsFromFirst: number;
  /** Whether this is the current leader */
  isLeader: boolean;
}

/**
 * Export format options for leaderboard sharing
 */
export type ExportFormat = 'text' | 'json' | 'csv';

/**
 * Game action types for state management
 */
export type GameAction = 
  | { type: 'SET_TEAMS'; payload: Team[] }
  | { type: 'UPDATE_TEAM_SCORE'; payload: { teamId: string; round: number; score: number } }
  | { type: 'SET_CURRENT_ROUND'; payload: number }
  | { type: 'ADD_ROUND'; payload: Round }
  | { type: 'RESET_GAME' }
  | { type: 'SET_GAME_MODE'; payload: GameState['gameMode'] }
  | { type: 'UPDATE_TEAM_NAME'; payload: { teamId: string; name: string } };

/**
 * Default team names pool for random selection
 */
export const FUNNY_TEAM_NAMES = [
  "Quiz Khalifa", "The Mighty Morphin Flower Arrangers", "Agatha Quiztie", 
  "Les Quizerables", "The Questionables", "Trivia Newton John", "Quiz Team Aguilera",
  "50 Shades of Quiz", "Game of Phones", "The Quizzards of Oz", "Quiz Me Maybe",
  "The Brainy Bunch", "Smarty Pints", "The Think Tank", "Quiz and Tell",
  "The Answer is 42", "Ctrl+Alt+Defeat", "The WiFi Seekers", "404 Team Not Found",
  "The Googleheads", "Byte Me", "The Neural Network", "Artificial Stupidity",
  "The Data Miners", "Cloud Nine", "The Debugging Ducks", "Syntax Errors",
  "The Recursive Rebels", "Boolean Operators", "Stack Overflow Heroes"
] as const;

/**
 * Game configuration constants
 */
export const GAME_CONSTANTS = {
  /** Minimum number of teams allowed */
  MIN_TEAMS: 1,
  /** Maximum number of teams allowed */
  MAX_TEAMS: 20,
  /** Default number of teams */
  DEFAULT_TEAMS: 4,
  /** Default number of rounds */
  DEFAULT_ROUNDS: 5,
  /** Maximum score allowed per round */
  MAX_ROUND_SCORE: 999.99,
  /** Minimum score allowed per round */
  MIN_ROUND_SCORE: -999.99,
  /** Minimum score that can be entered */
  MIN_SCORE: -999,
  /** Maximum score that can be entered */
  MAX_SCORE: 999,
  /** Maximum decimal places for scores */
  SCORE_DECIMAL_PLACES: 2,
} as const; 