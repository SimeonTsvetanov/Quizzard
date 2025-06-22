/**
 * Team Scoring Card Component - Modern Design with Marquee Animation
 *
 * Beautiful, responsive team card that displays:
 * - Team name with smart text overflow handling
 * - Marquee animation for long team names (only when card is focused/hovered)
 * - Current round score input with decimal precision support
 * - Total accumulated score display
 * - Modern hover effects and visual feedback
 *
 * Features:
 * - Marquee Animation: Scrolls long team names smoothly when card is active
 * - Decimal Scoring: Supports scores like 0.5, 1.25, 2.75 with validation
 * - Responsive Design: Adapts to mobile and desktop screen sizes
 * - Modern UI: Hover effects, focus states, gradient accents
 * - Auto-resize: Detects text overflow and enables marquee accordingly
 *
 * Animation Details:
 * - Duration: 10 seconds for comfortable reading
 * - Trigger: Only on hover/focus and only when text overflows
 * - Pattern: Start position → pause → scroll → long pause → reset
 * - Timing: 8% start pause, 42% scroll time, 35% end pause, 15% reset
 *
 * @fileoverview Modern team scoring card for Points Counter
 * @version 2.0.0
 * @since December 2025
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, Typography, TextField, Box } from "@mui/material";
import type { Team } from "../../types";
import { isValidScore, roundScore } from "../../utils/gameUtils";

/**
 * Props Interface for TeamCard Component
 */
interface TeamCardProps {
  /** Team data containing name, scores, and identification */
  team: Team;
  /** Current round number for score input (1-based) */
  currentRound: number;
  /** Callback when team score is updated - supports decimal values */
  onScoreUpdate: (teamId: string, round: number, score: number) => void;
  /** Whether the card is in edit mode (currently unused but available for future features) */
  editMode?: boolean;
}

/**
 * Beautiful Team Scoring Card Component
 *
 * Renders individual team card with modern design, marquee text animation,
 * and decimal scoring input. Handles all user interactions and provides
 * visual feedback for scoring operations.
 *
 * Usage Example:
 * ```tsx
 * <TeamCard
 *   team={{
 *     id: 'team-1',
 *     name: 'The Amazing Quiz Champions',
 *     totalScore: 12.5,
 *     roundScores: { 1: 5, 2: 2.5, 3: 5 }
 *   }}
 *   currentRound={3}
 *   onScoreUpdate={(teamId, round, score) => updateScore(teamId, round, score)}
 * />
 * ```
 */
export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  currentRound,
  onScoreUpdate,
}) => {
  // === INPUT STATE ===
  /** Current value in the score input field */
  const [inputValue, setInputValue] = useState<string>("");
  /** Whether input has validation errors */
  const [hasError, setHasError] = useState(false);

  // === INTERACTION STATE ===
  /** Whether user is hovering over the card */
  const [isHovered, setIsHovered] = useState(false);
  /** Whether any input in the card has focus */
  const [isFocused, setIsFocused] = useState(false);

  // === MARQUEE STATE ===
  /** Whether team name overflows the container (enables marquee) */
  const [textOverflows, setTextOverflows] = useState(false);

  // === DOM REFERENCES ===
  /** Reference to the typography element containing team name */
  const textRef = useRef<HTMLElement>(null);
  /** Reference to the container that constrains text width */
  const containerRef = useRef<HTMLElement>(null);

  // === DERIVED STATE ===
  /** Get current round score for this team (default to 0 if not set) */
  const currentRoundScore = team.roundScores[currentRound] || 0;

  /**
   * Text Overflow Detection
   *
   * Checks if the team name text width exceeds its container.
   * This determines whether to enable the marquee animation.
   * Uses scrollWidth vs clientWidth comparison for accuracy.
   */
  const checkTextOverflow = () => {
    if (textRef.current && containerRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;
      setTextOverflows(textWidth > containerWidth);
    }
  };

  /**
   * Initialize Input Value Effect
   *
   * Updates input field when round changes or team data updates.
   * Shows empty input (placeholder visible) when score is 0,
   * but maintains actual score values for calculations in background.
   * Clears any validation errors when data changes.
   */
  useEffect(() => {
    // Only show value in input if it's not 0 (let placeholder show for 0)
    setInputValue(currentRoundScore === 0 ? "" : currentRoundScore.toString());
    setHasError(false);
  }, [currentRound, currentRoundScore]);

  /**
   * Text Overflow Detection Effect
   *
   * Checks text overflow on mount and when team name changes.
   * Also listens for window resize events to handle dynamic layout changes.
   * Properly cleans up event listener on unmount.
   */
  useEffect(() => {
    checkTextOverflow();
    const handleResize = () => checkTextOverflow();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [team.name]);

  /**
   * Score Input Change Handler
   *
   * Handles user input in the score field with real-time validation:
   * 1. Allows empty input for easier editing
   * 2. Validates numeric format and range
   * 3. Updates team score immediately if valid
   * 4. Shows error state for invalid input
   *
   * @param event - Input change event
   */
  const handleScoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    // Allow empty input for easier editing experience
    if (value === "") {
      setHasError(false);
      return;
    }

    // Parse and validate numeric input
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setHasError(true);
      return;
    }

    // Validate against allowed score range
    if (!isValidScore(numericValue)) {
      setHasError(true);
      return;
    }

    // Valid input: clear errors and update score
    setHasError(false);
    const roundedScore = roundScore(numericValue);
    onScoreUpdate(team.id, currentRound, roundedScore);
  };

  /**
   * Input Blur Handler
   *
   * Handles when user leaves the input field:
   * - Empty input: Saves as 0 but keeps input empty (shows placeholder)
   * - Invalid input: Resets to current value or empty if 0
   * - Valid input: Maintains the entered value
   * Provides consistent user experience and prevents invalid states.
   */
  const handleBlur = () => {
    if (inputValue === "") {
      // Empty input = 0 score, but keep input empty to show placeholder
      onScoreUpdate(team.id, currentRound, 0);
      setHasError(false);
    } else if (hasError) {
      // Reset to current round score if input has errors
      setInputValue(
        currentRoundScore === 0 ? "" : currentRoundScore.toString()
      );
      setHasError(false);
    }
  };

  /**
   * Score Display Formatter
   *
   * Formats score values for consistent display:
   * - Whole numbers: "5" (no decimal places)
   * - Decimal numbers: "5.25" (up to 2 decimal places)
   *
   * @param score - Numeric score value
   * @returns Formatted string representation
   */
  const formatScore = (score: number): string => {
    return score % 1 === 0 ? score.toString() : score.toFixed(2);
  };

  /**
   * Marquee Animation Condition
   *
   * Determines when to show marquee animation:
   * - Text must overflow the container
   * - Card must be hovered OR any input focused
   * This prevents distracting animation unless user is actively engaged
   */
  const shouldShowMarquee = textOverflows && (isHovered || isFocused);

  return (
    <Card
      // === INTERACTION HANDLERS ===
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0} // Make card focusable for accessibility
      sx={{
        // === CARD SIZING ===
        height: { xs: 145, sm: 165 }, // Responsive height for content
        width: "100%",
        maxWidth: { xs: "100%", sm: 240, md: 220, lg: 230 }, // Wider for longer names

        // === BASE STYLING ===
        backgroundColor: "background.paper",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)", // Subtle default shadow
        border: "1px solid",
        borderColor:
          isHovered || isFocused ? "primary.main" : "rgba(0,0,0,0.06)",
        borderRadius: 3, // Modern rounded corners

        // === INTERACTION STYLING ===
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // Smooth easing curve
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",

        // === HOVER STATE ===
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", // Enhanced shadow on hover
          borderColor: "primary.main",
          transform: "translateY(-2px)", // Subtle lift effect
        },

        // === FOCUS STATE ===
        "&:focus": {
          outline: "none", // Remove default browser focus outline
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderColor: "primary.main",
          transform: "translateY(-2px)",
        },

        // === ACCENT LINE (shows on hover/focus) ===
        "&:before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #1976d2, #42a5f5)", // Primary gradient
          opacity: isHovered || isFocused ? 1 : 0,
          transition: "opacity 0.3s ease",
        },
      }}
    >
      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between", // Distribute content evenly
          alignItems: "center",
          p: { xs: 2, sm: 2.5 }, // Responsive padding
          "&:last-child": {
            pb: { xs: 2, sm: 2.5 }, // Override MUI default last-child padding
          },
        }}
      >
        {/* === TEAM NAME SECTION === */}
        <Box
          ref={containerRef}
          sx={{
            width: "100%",
            overflow: "hidden", // Hide overflowing text
            position: "relative",
            mb: 1.5,
            minHeight: "clamp(1.2rem, 2.6vw, 1.44rem)", // Reserve space for text
          }}
        >
          <Typography
            ref={textRef}
            variant="h6"
            sx={{
              fontSize: "clamp(1rem, 2.2vw, 1.2rem)", // Responsive font size
              fontWeight: 600,
              textAlign: "center",
              color: "text.primary",
              lineHeight: 1.2,
              whiteSpace: "nowrap", // Prevent text wrapping

              // === MARQUEE ANIMATION (conditional) ===
              ...(shouldShowMarquee && {
                animation: "marqueeScroll 10s ease-in-out infinite",
                "@keyframes marqueeScroll": {
                  "0%": {
                    transform: "translateX(0%)", // Start at normal position
                  },
                  "8%": {
                    transform: "translateX(0%)", // Short pause to read beginning (0.8s)
                  },
                  "50%": {
                    transform: "translateX(-100%)", // Scroll to show end (4.2s movement)
                  },
                  "85%": {
                    transform: "translateX(-100%)", // Long pause at end (3.5s pause)
                  },
                  "100%": {
                    transform: "translateX(0%)", // Reset to start (1.5s transition)
                  },
                },
              }),

              // === STATIC TEXT OVERFLOW (when not animating) ===
              ...(!shouldShowMarquee && {
                overflow: "hidden",
                textOverflow: "ellipsis", // Show "..." for overflowing text
              }),
            }}
          >
            {team.name}
          </Typography>
        </Box>

        {/* === SCORE INPUT SECTION === */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            mb: 1.5,
          }}
        >
          <TextField
            size="small"
            type="text"
            inputMode="decimal" // Mobile keyboard optimization
            value={inputValue}
            onChange={handleScoreChange}
            onBlur={handleBlur}
            onFocus={() => setIsFocused(true)}
            error={hasError}
            placeholder="0" // Hint text instead of actual value
            variant="outlined"
            sx={{
              width: { xs: 80, sm: 90 }, // Compact input field
              "& .MuiOutlinedInput-root": {
                fontSize: "clamp(1.1rem, 2.8vw, 1.4rem)",
                fontWeight: 600,
                borderRadius: 2,
                backgroundColor: hasError
                  ? "rgba(244, 67, 54, 0.04)" // Light red for errors
                  : "rgba(25, 118, 210, 0.04)", // Light blue for normal
                transition: "all 0.2s ease",

                "& input": {
                  textAlign: "center", // Center-align score input
                  py: { xs: 0.75, sm: 1 },
                  px: { xs: 0.5, sm: 0.75 },
                  color: hasError ? "error.main" : "primary.main",
                  fontWeight: 600,
                },

                // === INPUT BORDER STYLING ===
                "& fieldset": {
                  borderColor: hasError
                    ? "error.main"
                    : "rgba(25, 118, 210, 0.2)",
                  borderWidth: 1.5,
                },
                "&:hover fieldset": {
                  borderColor: hasError ? "error.main" : "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: hasError ? "error.main" : "primary.main",
                  borderWidth: 2, // Thicker border when focused
                },
              },
            }}
          />
        </Box>

        {/* === TOTAL SCORE SECTION === */}
        <Typography
          variant="body2"
          sx={{
            fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)",
            fontWeight: 500,
            color: "text.secondary",
            textAlign: "center",
            letterSpacing: "0.5px", // Slight letter spacing for readability
          }}
        >
          Total:{" "}
          <Box
            component="span"
            sx={{
              color: "primary.main", // Highlight the score value
              fontWeight: 700,
              fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
            }}
          >
            {formatScore(team.totalScore)}
          </Box>
        </Typography>
      </CardContent>
    </Card>
  );
};
