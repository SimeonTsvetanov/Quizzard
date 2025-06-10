/**
 * Quiz-specific typography variant definitions
 * Following Quizzard development standards for type safety and consistency
 */

export interface QuizTypographyVariants {
  // Quiz-specific typography styles
  quizTitle: React.CSSProperties;
  quizQuestion: React.CSSProperties;
  quizOption: React.CSSProperties;
  quizFeedback: React.CSSProperties;
  quizInstructions: React.CSSProperties;
  quizCounter: React.CSSProperties;
  quizScore: React.CSSProperties;
}

export interface QuizTypographyProps {
  variant?: keyof QuizTypographyVariants;
  component?: React.ElementType;
  children: React.ReactNode;
  sx?: object;
}

// Typography variant names for consistent usage across components
export const QUIZ_TYPOGRAPHY_VARIANTS = {
  QUIZ_TITLE: 'quizTitle',
  QUIZ_QUESTION: 'quizQuestion', 
  QUIZ_OPTION: 'quizOption',
  QUIZ_FEEDBACK: 'quizFeedback',
  QUIZ_INSTRUCTIONS: 'quizInstructions',
  QUIZ_COUNTER: 'quizCounter',
  QUIZ_SCORE: 'quizScore',
} as const;

export type QuizTypographyVariantKeys = typeof QUIZ_TYPOGRAPHY_VARIANTS[keyof typeof QUIZ_TYPOGRAPHY_VARIANTS]; 