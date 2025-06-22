/**
 * Wizard Footer Component
 *
 * Handles the footer section of the quiz wizard modal including navigation
 * buttons (Back, Cancel, Next/Complete). Provides proper button states,
 * loading indicators, and responsive behavior.
 *
 * @fileoverview Wizard footer component for QuizWizardModal
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import { DialogActions, Button, CircularProgress } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
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
 * Props for WizardFooter component
 */
interface WizardFooterProps {
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
 * Wizard Footer Component
 *
 * Renders navigation buttons with proper states and loading indicators.
 * Handles both step navigation and final quiz completion.
 */
export const WizardFooter: React.FC<WizardFooterProps> = ({
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

  return (
    <DialogActions
      sx={{
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 1.5, // Reduced from { xs: 2, sm: 3 }
        gap: 1,
        position: "sticky",
        bottom: 0,
        zIndex: 1100,
      }}
    >
      {/* Back button */}
      <Button
        onClick={onPrevious}
        disabled={currentStep === 0}
        startIcon={<ArrowBackIcon />}
        sx={{ mr: "auto" }}
      >
        Back
      </Button>

      {/* Cancel button */}
      <Button onClick={onCancel} variant="outlined" color="secondary">
        Cancel
      </Button>

      {/* Next/Complete button */}
      {isLastStep ? (
        <Button
          onClick={onComplete}
          variant="contained"
          disabled={!validation.isValid || isSubmitting}
          startIcon={
            isSubmitting ? <CircularProgress size={16} /> : <CheckCircleIcon />
          }
        >
          {isSubmitting ? "Creating..." : "Create Quiz"}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          variant="contained"
          disabled={!canProceed}
          endIcon={<ArrowForwardIcon />}
        >
          Next
        </Button>
      )}
    </DialogActions>
  );
};
