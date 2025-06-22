/**
 * Wizard Header Component
 *
 * Handles the header section of the quiz wizard modal including title,
 * navigation buttons (back, cancel, next). Provides consistent header
 * styling and functionality with icon-based navigation.
 *
 * @fileoverview Wizard header component for QuizWizardModal
 * @version 2.0.0
 * @since December 2025
 */

import React from "react";
import {
  DialogTitle,
  Box,
  Typography,
  IconButton,
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
 * Props for WizardHeader component
 */
interface WizardHeaderProps {
  editQuiz?: any; // Quiz object for edit mode, undefined for create mode
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  validation: ValidationResult;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * Wizard Header Component
 *
 * Renders the modal header with navigation buttons integrated into the header.
 * Left: Back button (when available)
 * Center: Title
 * Right: Cancel and Next/Complete buttons
 */
export const WizardHeader: React.FC<WizardHeaderProps> = ({
  editQuiz,
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
  const isLastStep = currentStep === totalSteps - 1;
  const showBackButton = currentStep > 0;

  return (
    <DialogTitle
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        position: "sticky",
        top: 0,
        zIndex: 1100,
        minHeight: 64,
        px: 2,
      }}
    >
      {/* Left side - Back button */}
      <Box sx={{ width: 48, display: "flex", justifyContent: "flex-start" }}>
        {showBackButton && (
          <IconButton
            onClick={onPrevious}
            sx={{ color: "text.primary" }}
            aria-label="Go back"
          >
            <ArrowBackIcon />
          </IconButton>
        )}
      </Box>

      {/* Center - Title */}
      <Typography
        variant="h6"
        component="h2"
        sx={{ textAlign: "center", flex: 1 }}
      >
        {editQuiz ? "Edit Quiz" : "Create New Quiz"}
      </Typography>

      {/* Right side - Cancel and Next/Complete buttons */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Cancel button */}
        <IconButton
          onClick={onCancel}
          sx={{ color: "text.secondary" }}
          aria-label="Cancel and save draft"
        >
          <CloseIcon />
        </IconButton>

        {/* Next/Complete button */}
        {isLastStep ? (
          <IconButton
            onClick={onComplete}
            disabled={!validation.isValid || isSubmitting}
            sx={{
              color:
                validation.isValid && !isSubmitting
                  ? "primary.main"
                  : "text.disabled",
            }}
            aria-label="Complete quiz creation"
          >
            {isSubmitting ? (
              <CircularProgress size={20} />
            ) : (
              <CheckCircleIcon />
            )}
          </IconButton>
        ) : (
          <IconButton
            onClick={onNext}
            disabled={!canProceed}
            sx={{
              color: canProceed ? "primary.main" : "text.disabled",
            }}
            aria-label="Next step"
          >
            <ArrowForwardIcon />
          </IconButton>
        )}
      </Box>
    </DialogTitle>
  );
};
