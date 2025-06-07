/**
 * Type definitions for Random Team Generator feature
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the Random Team Generator feature. Each type is documented with its
 * purpose and usage context.
 */

/**
 * Represents a single participant input field in the UI
 * Used for managing individual name inputs before team generation
 */
export interface ParticipantInput {
  /** Unique identifier for this input field */
  id: number;
  /** The name value entered by the user */
  value: string;
}

/**
 * Represents a participant in the team generation algorithm
 * This is the format used by the TeamGenerator utility
 */
export interface Participant {
  /** Unique identifier for this participant */
  id: string;
  /** The participant's name */
  name: string;
  /** The participant's number (for display purposes) */
  number: number;
}

/**
 * Represents a generated team with its members
 * Used for displaying results in the modal and copying to clipboard
 */
export interface Team {
  /** Unique identifier for this team */
  id: string;
  /** Display name of the team (e.g., "Team 1") */
  name: string;
  /** Array of team members */
  members: TeamMember[];
}

/**
 * Represents a team member (simplified participant for display)
 * Used within Team interface for cleaner data structure
 */
export interface TeamMember {
  /** Unique identifier for this member */
  id: string;
  /** The member's name */
  name: string;
}

/**
 * Configuration object for team generation
 * Used to pass parameters to the TeamGenerator utility
 */
export interface TeamGenerationConfig {
  /** Array of participants to distribute into teams */
  participants: Participant[];
  /** Number of teams to create */
  teamCount: number;
}

/**
 * Snackbar configuration for user feedback
 * Used by the useSnackbar hook for consistent messaging
 */
export interface SnackbarConfig {
  /** Whether the snackbar is currently visible */
  open: boolean;
  /** The message to display */
  message: string;
  /** The severity/type of message (success, error, warning, info) */
  severity: 'success' | 'error' | 'warning' | 'info';
}

/**
 * Navigation direction for keyboard navigation between inputs
 * Used by keyboard navigation handlers
 */
export type NavigationDirection = 'up' | 'down' | 'enter';

/**
 * Team generation state for managing async operations
 * Used to track loading states and prevent duplicate operations
 */
export interface GenerationState {
  /** Whether teams are currently being generated */
  isGenerating: boolean;
  /** Whether teams are being refreshed (for animation) */
  isRefreshing: boolean;
}

/**
 * Cheat code configuration
 * Used for the "the followers" easter egg functionality
 */
export interface CheatCodeConfig {
  /** The trigger phrase to activate the cheat code */
  trigger: string;
  /** Array of friend names to populate */
  names: string[];
}

/**
 * Constants used throughout the Random Team Generator
 */
export const CONSTANTS = {
  /** Maximum number of participants allowed */
  MAX_PARTICIPANTS: 50,
  /** Minimum number of teams allowed */
  MIN_TEAMS: 2,
  /** Maximum number of teams allowed */
  MAX_TEAMS: 10,
  /** Minimum participants needed to generate teams */
  MIN_PARTICIPANTS_FOR_TEAMS: 2,
  /** Timeout for auto-removing empty inputs (ms) */
  AUTO_REMOVE_TIMEOUT: 1000,
} as const;

/**
 * Friend names for the "the followers" cheat code
 * These are the real friend names from the original implementation
 */
export const FRIEND_NAMES = [
  "Simeon",
  "Iliyana", 
  "George",
  "Viki",
  "Eli",
  "Asen",
  "Lubomir",
  "Ralica",
  "Venci",
  "Slavi",
  "Djoni",
  "Apapa",
  "Mitaka G",
  "Antonio",
  "Dinkata",
  "Raiko",
  "Tancheto"
] as const;

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface TeamGeneratorState {
  participants: Participant[];
  teams: Team[];
  teamCount: number;
  isGenerating: boolean;
  showResults: boolean;
}

export const TEAM_COLORS = [
  'rgba(76, 175, 80, 0.1)', // Green
  'rgba(33, 150, 243, 0.1)', // Blue  
  'rgba(156, 39, 176, 0.1)', // Purple
  'rgba(255, 152, 0, 0.1)', // Orange
  'rgba(233, 30, 99, 0.1)', // Pink
  'rgba(96, 125, 139, 0.1)', // Blue Grey
  'rgba(121, 85, 72, 0.1)', // Brown
  'rgba(158, 158, 158, 0.1)', // Grey
] as const; 