/**
 * Types for the Final Question feature
 */

/**
 * Represents a final question with its details
 */
export interface FinalQuestion {
  /** Unique identifier for the question */
  id: string;
  /** The question text */
  question: string;
  /** The answer to the question */
  answer: string;
  /** Optional category or topic */
  category?: string;
  /** Optional difficulty level */
  difficulty?: "easy" | "medium" | "hard";
  /** Optional points value */
  points?: number;
}

/**
 * Props for the FinalQuestionCard component
 */
export interface FinalQuestionCardProps {
  /** The final question data to display */
  question: FinalQuestion;
  /** Whether the card should show refresh animation */
  isRefreshing?: boolean;
}

/**
 * Props for the FinalQuestionModal component
 */
export interface FinalQuestionModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** The final question to display */
  question: FinalQuestion | null;
  /** Whether the question is being refreshed */
  isRefreshing: boolean;
  /** Whether the question is being generated */
  isGenerating: boolean;
  /** Handle modal close */
  onClose: () => void;
  /** Handle refresh question action */
  onRefresh: () => void;
  /** Handle copy question action */
  onCopy: () => void;
}

export type QuestionCategory =
  | "General Knowledge"
  | "Science"
  | "History"
  | "Geography"
  | "Literature"
  | "Sports"
  | "Entertainment"
  | "Technology";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Question {
  question: string;
  answer: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
}
