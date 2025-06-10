/**
 * Typography Helper Utilities for Quizzard
 * Provides consistent application of typography across components
 * Following development standards for component composition
 */

import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Base typography styles with Poppins font integration
 * Follows development standards for minimal padding/margins
 */
export const getBaseTypographyStyles = (): SxProps<Theme> => ({
  fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  lineHeight: 1.6,
  letterSpacing: '0.00938em',
});

/**
 * Header element typography styles consistent with development standards
 * Maintains the established sizing standards from Header component
 */
export const getHeaderElementStyles = (): SxProps<Theme> => ({
  ...getBaseTypographyStyles(),
  fontSize: { xs: '1.75rem', sm: '2.1rem' },
  fontWeight: 700,
  padding: { xs: 0.25, sm: 0.5 },
  minWidth: { xs: 36, sm: 44 },
  minHeight: { xs: 36, sm: 44 },
});

/**
 * Fluid typography styles using clamp() for responsive scaling
 * Provides smooth scaling across all device sizes
 */
export const getFluidTypographyStyles = (
  minSize: string,
  viewportScale: string,
  maxSize: string
): SxProps<Theme> => ({
  ...getBaseTypographyStyles(),
  fontSize: `clamp(${minSize}, ${viewportScale}, ${maxSize})`,
});

/**
 * Quiz content typography styles with reduced spacing
 * Optimized for content-focused design as per development standards
 */
export const getQuizContentStyles = (variant: 'title' | 'question' | 'option' | 'feedback'): SxProps<Theme> => {
  const baseStyles = getBaseTypographyStyles();
  
  switch (variant) {
    case 'title':
      return {
        ...baseStyles,
        fontWeight: 700,
        fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
        marginBottom: '0.75rem', // Reduced margin for more content space
        color: 'primary.main',
      };
    case 'question':
      return {
        ...baseStyles,
        fontWeight: 500,
        fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
        marginBottom: '1rem',
        color: 'text.primary',
      };
    case 'option':
      return {
        ...baseStyles,
        fontWeight: 400,
        fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
        padding: '0.5rem 0.75rem', // Reduced padding for more content
        marginBottom: '0.5rem',
        color: 'text.primary',
      };
    case 'feedback':
      return {
        ...baseStyles,
        fontWeight: 500,
        fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
        padding: '0.5rem', // Minimal padding
      };
    default:
      return baseStyles;
  }
};

/**
 * Component-specific typography standards
 * Ensures consistency across different UI components
 */
export const getComponentTypographyStyles = (component: 'card' | 'button' | 'navigation' | 'form'): SxProps<Theme> => {
  const baseStyles = getBaseTypographyStyles();
  
  switch (component) {
    case 'card':
      return {
        ...baseStyles,
        fontSize: 'clamp(0.9rem, 1.5vw, 1rem)',
        lineHeight: 1.5,
      };
    case 'button':
      return {
        ...baseStyles,
        fontWeight: 500,
        fontSize: 'clamp(0.8rem, 1.2vw, 0.875rem)',
        letterSpacing: '0.02857em',
        textTransform: 'none' as const,
      };
    case 'navigation':
      return {
        ...baseStyles,
        fontWeight: 500,
        fontSize: 'clamp(0.9rem, 1.5vw, 1rem)',
      };
    case 'form':
      return {
        ...baseStyles,
        fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
        lineHeight: 1.7,
      };
    default:
      return baseStyles;
  }
};

/**
 * Advanced responsive patterns for cross-device optimization
 * Implements content-aware responsive scaling
 */
export const getAdvancedResponsiveStyles = (
  breakpoints: { xs?: string; sm?: string; md?: string; lg?: string }
): SxProps<Theme> => ({
  ...getBaseTypographyStyles(),
  fontSize: {
    xs: breakpoints.xs || 'clamp(0.9rem, 2vw, 1rem)',
    sm: breakpoints.sm || 'clamp(1rem, 2.5vw, 1.125rem)',
    md: breakpoints.md || 'clamp(1rem, 2vw, 1.125rem)',
    lg: breakpoints.lg || 'clamp(1rem, 1.5vw, 1.125rem)',
  },
});

/**
 * Accessibility-enhanced typography styles
 * Ensures WCAG compliance with improved readability
 */
export const getAccessibleTypographyStyles = (): SxProps<Theme> => ({
  ...getBaseTypographyStyles(),
  lineHeight: 1.6, // Minimum 1.5, using 1.6 for better readability
  letterSpacing: '0.12em', // WCAG recommended minimum
  wordSpacing: '0.16em', // WCAG recommended minimum
  // Ensure sufficient contrast is handled by theme colors
});

/**
 * Performance-optimized typography styles
 * Minimal CSS properties for fast rendering
 */
export const getPerformantTypographyStyles = (): SxProps<Theme> => ({
  fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  fontWeight: 'inherit',
}); 