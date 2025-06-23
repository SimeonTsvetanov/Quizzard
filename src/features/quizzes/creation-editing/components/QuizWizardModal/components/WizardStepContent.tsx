/**
 * Wizard Step Content Component
 *
 * Handles rendering of the appropriate step component based on the current
 * wizard step. Manages step transitions and content display logic.
 *
 * @fileoverview Step content component for QuizWizardModal
 * @version 1.0.0
 * @since December 2025
 */

import React from "react";
import { Box, Card, Typography, Chip } from "@mui/material";
import {
  Category as CategoryIcon,
  QuestionAnswer as QuestionIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";

// Import wizard step components
import { BasicInfoStep } from "../../../steps/BasicInfoStep";
import { RoundsQuestionsStep } from "../../../steps/QuestionsStep";

/**
 * Props for WizardStepContent component
 */
interface WizardStepContentProps {
  currentStep: number;
  draftQuiz: any; // Quiz draft object
  updateDraft: (updates: any) => void;
  validateStep: () => any; // Validation function
  showValidation: boolean;
}

/**
 * Wizard Step Content Component
 *
 * Renders the appropriate step component based on current step index.
 * Handles step-specific props and content display logic.
 */
export const WizardStepContent: React.FC<WizardStepContentProps> = ({
  currentStep,
  draftQuiz,
  updateDraft,
  validateStep,
  showValidation,
}) => {
  /**
   * Renders the appropriate step component based on current step
   */
  const renderStepContent = React.useCallback(() => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            draftQuiz={draftQuiz}
            updateDraft={updateDraft}
            validation={validateStep()}
          />
        );
      case 1:
        return (
          <RoundsQuestionsStep
            draftQuiz={draftQuiz}
            updateDraft={updateDraft}
            showValidation={showValidation}
          />
        );
      case 2:
        return (
          <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
            <Card
              variant="outlined"
              sx={{ p: 3, mb: 3, bgcolor: "background.paper", boxShadow: 2 }}
            >
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h5" fontWeight={700} flex={1}>
                  {draftQuiz.title}
                </Typography>
                <Chip
                  icon={<CategoryIcon />}
                  label={draftQuiz.category || "General"}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Typography variant="body1" color="text.secondary" paragraph>
                {draftQuiz.description || "No description provided"}
              </Typography>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  icon={<QuestionIcon />}
                  label={`${
                    draftQuiz.rounds?.flatMap((r: any) => r.questions).length ||
                    0
                  } Questions`}
                  variant="filled"
                  color="primary"
                  size="small"
                />
                <Chip
                  icon={<TimerIcon />}
                  label={`${draftQuiz.rounds?.length || 0} Rounds`}
                  variant="filled"
                  color="secondary"
                  size="small"
                />
              </Box>
            </Card>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Review your quiz above and click "Create Quiz" to save it.
            </Typography>
          </Box>
        );
      default:
        return (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="error">
              Unknown step: {currentStep}
            </Typography>
          </Box>
        );
    }
  }, [currentStep, draftQuiz, updateDraft, validateStep, showValidation]);

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        px: { xs: 3, sm: 4 },
        py: { xs: 3, sm: 4 },
      }}
    >
      {renderStepContent()}
    </Box>
  );
};
