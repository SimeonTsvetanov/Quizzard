/**
 * QuizTypography Component
 * 
 * Provides quiz-specific typography variants for enhanced user experience
 * Utilizes the custom typography variants defined in the theme
 * Follows development standards for component composition and type safety
 */

import React from 'react';
import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';

interface QuizTypographyProps extends Omit<TypographyProps, 'variant'> {
  /** Quiz-specific typography variant */
  variant: 'quizTitle' | 'quizQuestion' | 'quizOption' | 'quizFeedback' | 'quizInstructions' | 'quizCounter' | 'quizScore';
  /** Content to display */
  children: React.ReactNode;
  /** Additional styling */
  sx?: TypographyProps['sx'];
  /** HTML element to render */
  component?: TypographyProps['component'];
}

/**
 * QuizTypography component for consistent quiz content presentation
 * 
 * @param variant - Quiz-specific typography style
 * @param children - Content to display
 * @param sx - Additional Material-UI styling
 * @param component - HTML element to render (default: 'div')
 * @param props - Additional Typography props
 * @returns Styled Typography component with quiz-specific formatting
 * 
 * @example
 * ```tsx
 * <QuizTypography variant="quizTitle">
 *   Quiz Title
 * </QuizTypography>
 * 
 * <QuizTypography variant="quizQuestion" component="h2">
 *   What is the capital of France?
 * </QuizTypography>
 * 
 * <QuizTypography variant="quizOption">
 *   A) Paris
 * </QuizTypography>
 * ```
 */
export const QuizTypography: React.FC<QuizTypographyProps> = ({ 
  variant, 
  children, 
  sx, 
  component = 'div',
  ...props 
}) => {
  return (
    <Typography
      variant={variant as any} // Custom variants require type assertion
      component={component}
      sx={sx}
      {...props}
    >
      {children}
    </Typography>
  );
};

export default QuizTypography; 