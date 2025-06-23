/**
 * Header Utilities
 *
 * Utility functions for dynamic header text generation based on current route.
 * Provides responsive font sizing to ensure text fits on all screen sizes.
 *
 * Extracted from Header.tsx to improve maintainability and follow
 * the Single Responsibility Principle from development standards.
 *
 * Features:
 * - Route-based dynamic text generation
 * - Responsive font sizing based on text length
 * - Clean path processing for universal compatibility
 * - Consistent mapping for all application routes
 *
 * @fileoverview Header utility functions
 * @version 1.0.0
 * @since December 2025
 */

/**
 * Interface for dynamic header text configuration
 */
interface HeaderTextConfig {
  /** The display text for the header */
  text: string;
  /** Responsive font size configuration for MUI sx prop */
  fontSize: { xs: string; sm: string };
}

/**
 * Get dynamic header text based on current route
 *
 * Processes the current pathname to determine appropriate header text
 * with responsive font sizing to ensure text fits between icons on all screens.
 *
 * @param pathname - Current route pathname
 * @returns Object with text and responsive font sizing
 */
export const getDynamicHeaderText = (pathname: string): HeaderTextConfig => {
  // Debug: Log the pathname for development
  console.log("Current pathname:", pathname);

  // Remove base path if present to get the clean route
  const cleanPath = pathname.replace("/quizzard", "");
  console.log("Clean path:", cleanPath);

  // Define text mappings with character counts for responsive sizing
  // Using clean paths (without base path) for universal compatibility
  const textMappings = {
    "/": { text: "QUIZZARD", chars: 8 },
    "": { text: "QUIZZARD", chars: 8 }, // Empty string for base route
    "/random-team-generator": { text: "RANDOM GENERATOR", chars: 16 },
    "/points-counter": { text: "POINTS COUNTER", chars: 14 },
    "/quizzes": { text: "QUIZZES", chars: 7 },
    "/final-question": { text: "FINAL QUESTION", chars: 13 },
  };

  // Use clean path for matching, fallback to home
  const mapping =
    textMappings[cleanPath as keyof typeof textMappings] || textMappings["/"];

  return {
    text: mapping.text,
    fontSize: getFontSize(mapping.chars),
  };
};

/**
 * Get responsive font sizing based on text length
 *
 * Calculates appropriate font sizes for different screen sizes based on
 * the character count to ensure text always fits in the available space.
 *
 * @param chars - Number of characters in the text
 * @returns Responsive font size configuration
 */
const getFontSize = (chars: number): { xs: string; sm: string } => {
  if (chars <= 8) {
    return { xs: "1.75rem", sm: "2.1rem" }; // Standard size (QUIZZARD, QUIZZES)
  } else if (chars <= 14) {
    return { xs: "1.4rem", sm: "1.8rem" }; // Medium size (POINTS COUNTER)
  } else {
    return { xs: "1.2rem", sm: "1.6rem" }; // Compact size (RANDOM GENERATOR)
  }
};
