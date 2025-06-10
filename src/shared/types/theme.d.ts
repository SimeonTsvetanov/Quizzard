/**
 * Material-UI Theme Type Extensions for Quizzard
 * Extends default MUI theme to include quiz-specific typography variants
 */

import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    quizTitle: React.CSSProperties;
    quizQuestion: React.CSSProperties;
    quizOption: React.CSSProperties;
    quizFeedback: React.CSSProperties;
    quizInstructions: React.CSSProperties;
    quizCounter: React.CSSProperties;
    quizScore: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    quizTitle?: React.CSSProperties;
    quizQuestion?: React.CSSProperties;
    quizOption?: React.CSSProperties;
    quizFeedback?: React.CSSProperties;
    quizInstructions?: React.CSSProperties;
    quizCounter?: React.CSSProperties;
    quizScore?: React.CSSProperties;
  }
}

// Also extend Typography component props
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    quizTitle: true;
    quizQuestion: true;
    quizOption: true;
    quizFeedback: true;
    quizInstructions: true;
    quizCounter: true;
    quizScore: true;
  }
} 