/**
 * Validation Alerts Component
 *
 * Handles display and dismissal of validation errors and warnings in the
 * quiz wizard. Provides compact, dismissible alerts with proper styling
 * and accessibility features.
 *
 * @fileoverview Validation alerts component for QuizWizardModal
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import { Box, Alert, Typography, IconButton } from "@mui/material";
import {
  Close as CloseIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import type { WizardUIState, WizardUIActions } from "../hooks/useWizardUIState";

/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Props for ValidationAlerts component
 */
interface ValidationAlertsProps {
  validation: ValidationResult;
  showValidation: boolean;
  uiState: WizardUIState;
  uiActions: WizardUIActions;
}

/**
 * Validation Alerts Component
 *
 * Renders dismissible error and warning alerts based on validation results.
 * Provides compact display with clear messaging and accessibility features.
 */
export const ValidationAlerts: React.FC<ValidationAlertsProps> = ({
  validation,
  showValidation,
  uiState,
  uiActions,
}) => {
  const { dismissedAlerts } = uiState;
  const { setDismissedAlerts } = uiActions;

  // Don't render if validation is not being shown
  if (!showValidation) {
    return null;
  }

  // Don't render if no errors or warnings, or all are dismissed
  const hasErrors = validation.errors.length > 0 && !dismissedAlerts.errors;
  const hasWarnings =
    validation.warnings.length > 0 && !dismissedAlerts.warnings;

  if (!hasErrors && !hasWarnings) {
    return null;
  }

  return (
    <Box sx={{ px: { xs: 3, sm: 4 }, pt: 2, pb: 1 }}>
      {/* Error alerts */}
      {hasErrors && (
        <Alert
          severity="error"
          sx={{ mb: 1 }}
          icon={<WarningIcon />}
          action={
            <IconButton
              size="small"
              onClick={() =>
                setDismissedAlerts((prev) => ({
                  ...prev,
                  errors: true,
                }))
              }
              aria-label="Dismiss error"
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Please fix these issues:
            </Typography>
            <Typography variant="body2" component="div">
              {validation.errors.join(" • ")}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Warning alerts */}
      {hasWarnings && (
        <Alert
          severity="warning"
          sx={{ mb: 1 }}
          action={
            <IconButton
              size="small"
              onClick={() =>
                setDismissedAlerts((prev) => ({
                  ...prev,
                  warnings: true,
                }))
              }
              aria-label="Dismiss warning"
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Typography variant="body2" component="div">
            {validation.warnings.join(" • ")}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};
