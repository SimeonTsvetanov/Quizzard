/**
 * Final Question Feature Type Definitions
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the Final Question feature. Centralized type definitions ensure consistency
 * and maintainability across all components, hooks, and services.
 *
 * @fileoverview Type definitions for Final Question feature
 * @version 2.0.0
 * @since December 2025
 */

/**
 * Represents a complete final question with all its metadata
 *
 * This is the core data structure used throughout the Final Question feature.
 * It contains the question text, answer, and optional metadata for categorization
 * and difficulty assessment.
 */
export interface FinalQuestion {
  /** Unique identifier for the question (generated when created) */
  id: string;
  /** The actual question text displayed to users */
  question: string;
  /** The correct answer to the question */
  answer: string;
  /** Optional category or subject area (e.g., "Science", "History") */
  category?: string;
  /** Optional difficulty level for the question */
  difficulty?: QuestionDifficulty;
  /** Optional points value for scoring systems */
  points?: number;
}

/**
 * Available difficulty levels for questions
 * Used for AI generation and user interface filtering
 */
export type QuestionDifficulty = "easy" | "medium" | "hard";

/**
 * Supported question categories for AI generation
 * These categories help the AI generate more focused questions
 */
export type QuestionCategory =
  | "General Knowledge"
  | "Science"
  | "History"
  | "Geography"
  | "Literature"
  | "Sports"
  | "Entertainment"
  | "Technology"
  | "random"; // Special category for random topic selection

/**
 * Props interface for the FinalQuestionCard component
 *
 * Defines all properties that can be passed to the question card
 * component for display and animation control.
 */
export interface FinalQuestionCardProps {
  /** The final question data to display in the card */
  question: FinalQuestion;
  /** Whether the card should show refresh animation (optional, defaults to false) */
  isRefreshing?: boolean;
}

/**
 * Props interface for the FinalQuestionModal component
 *
 * Comprehensive interface for the modal that displays questions.
 * Includes all necessary state and callback functions for full functionality.
 */
export interface FinalQuestionModalProps {
  /** Controls whether the modal is currently visible */
  open: boolean;
  /** The final question to display (null if none generated yet) */
  question: FinalQuestion | null;
  /** Indicates if the current question is being refreshed */
  isRefreshing: boolean;
  /** Indicates if a new question is being generated */
  isGenerating: boolean;
  /** Callback function to handle modal close action */
  onClose: () => void;
  /** Callback function to handle question refresh action */
  onRefresh: () => void;
  /** Callback function to handle question copy action */
  onCopy: () => void;
}

/**
 * Settings interface for question generation
 *
 * Defines user preferences for AI question generation.
 * All properties are optional to allow flexible configuration.
 */
export interface QuestionGenerationSettings {
  /** Preferred difficulty level (empty string for random) */
  difficulty?: string;
  /** Target language for the question (defaults to English) */
  language?: string;
  /** Preferred category or subject area (empty string for random) */
  category?: QuestionCategory | string;
}

/**
 * Interface for session-based question tracking
 *
 * Used to prevent duplicate questions within a single session.
 * Stores minimal data to identify previously generated questions.
 */
export interface SessionQuestion {
  /** The question text for duplicate detection */
  question: string;
  /** The answer text for duplicate detection */
  answer: string;
}

/**
 * Parameters for Gemini AI API calls
 *
 * Structured data sent to the AI service for question generation.
 * Includes user preferences and session context for better results.
 */
export interface GeminiQuestionParams {
  /** Desired difficulty level */
  difficulty: string;
  /** Target language for generation */
  language: string;
  /** Preferred category or topic */
  category: string;
  /** Previously generated questions to avoid duplicates */
  previousQuestions: SessionQuestion[];
}

/**
 * Rate limiting information from the AI service
 *
 * Provides real-time feedback about API usage limits
 * to help users understand when they can make new requests.
 */
export interface RateLimitInfo {
  /** Number of requests remaining in current period */
  requestsRemaining: number;
  /** Seconds until the rate limit resets */
  timeUntilReset: number;
  /** Whether the user is approaching the rate limit */
  isNearLimit: boolean;
}
