/**
 * Wizard Bottom Navigation Component
 *
 * Fixed bottom navigation bar for the quiz wizard with back, cancel, and next/complete buttons.
 * Positioned as a sticky footer that stays at the bottom while content scrolls underneath.
 *
 * Features:
 * - Fixed positioning at bottom of screen
 * - Icon-based navigation (back arrow, close, forward arrow/checkmark)
 * - Auto-save on cancel with confirmation message
 * - Responsive button sizing
 * - Proper z-index layering
 * - Accessibility compliant
 *
 * @fileoverview Bottom navigation component for quiz wizard
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import {
  Box,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Props for WizardBottomNavigation component
 */
interface WizardBottomNavigationProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether user can proceed to next step */
  canProceed: boolean;
  /** Current validation state */
  validation: ValidationResult;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Callback for going to previous step */
  onPrevious: () => void;
  /** Callback for going to next step */
  onNext: () => void;
  /** Callback for completing the wizard */
  onComplete: () => void;
  /** Callback for canceling/closing the wizard */
  onCancel: () => void;
}

/**
 * Wizard Bottom Navigation Component
 *
 * Fixed bottom navigation for quiz wizard with icon-based controls.
 * Provides consistent navigation experience with proper visual feedback.
 */
export const WizardBottomNavigation: React.FC<WizardBottomNavigationProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  validation,
  isSubmitting,
  onPrevious,
  onNext,
  onComplete,
  onCancel,
}) => {
  // Determine if we're on the last step
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        borderRadius: 0,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          minHeight: { xs: 60, sm: 70 },
          // Add safe area padding for mobile devices
          paddingBottom: {
            xs: "calc(1.5rem + env(safe-area-inset-bottom))",
            sm: 2,
          },
        }}
      >
        {/* Left: Back Button */}
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 60 }}>
          {!isFirstStep && (
            <IconButton
              onClick={onPrevious}
              disabled={isSubmitting}
              aria-label="Go back to previous step"
              size="large"
              sx={{
                color: "text.primary",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                "&:disabled": {
                  color: "text.disabled",
                },
              }}
            >
              <ArrowBackIcon
                sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
              />
            </IconButton>
          )}
        </Box>

        {/* Center: Step Indicator */}
        <Box
          sx={{ display: "flex", alignItems: "center", textAlign: "center" }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              fontWeight: 500,
            }}
          >
            Step {currentStep + 1} of {totalSteps}
          </Typography>
        </Box>

        {/* Right: Cancel and Next/Complete Buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 60,
            justifyContent: "flex-end",
          }}
        >
          {/* Cancel Button */}
          <IconButton
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Cancel and save draft"
            size="large"
            sx={{
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "action.hover",
                color: "text.primary",
              },
              "&:disabled": {
                color: "text.disabled",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }} />
          </IconButton>

          {/* Next/Complete Button */}
          <IconButton
            onClick={() => {
              console.log("[DEBUG] Button clicked - isLastStep:", isLastStep);
              console.log("[DEBUG] canProceed:", canProceed);
              console.log("[DEBUG] isSubmitting:", isSubmitting);
              console.log("[DEBUG] validation:", validation);
              if (isLastStep) {
                console.log("[DEBUG] Calling onComplete");
                onComplete();
              } else {
                console.log("[DEBUG] Calling onNext");
                onNext();
              }
            }}
            disabled={!canProceed || isSubmitting}
            aria-label={
              isLastStep ? "Complete quiz creation" : "Go to next step"
            }
            size="large"
            sx={{
              color: canProceed ? "primary.main" : "text.disabled",
              "&:hover": {
                backgroundColor: "primary.light",
                color: "primary.contrastText",
              },
              "&:disabled": {
                color: "text.disabled",
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : isLastStep ? (
              <CheckCircleIcon
                sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
              />
            ) : (
              <ArrowForwardIcon
                sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
              />
            )}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};
