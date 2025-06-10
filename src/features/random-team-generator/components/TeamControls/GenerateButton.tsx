/**
 * GenerateButton Component
 * 
 * A focused component for the main "Generate Teams" action button.
 * Handles loading states, validation, and visual feedback.
 * 
 * Responsibilities:
 * - Display the primary generate teams button
 * - Show loading state during generation
 * - Handle disabled state based on validation
 * - Provide visual feedback and animations
 */

import { Button } from '@mui/material';
import { Shuffle as ShuffleIcon } from '@mui/icons-material';

/**
 * Props for the GenerateButton component
 */
interface GenerateButtonProps {
  /** Whether teams are currently being generated */
  isGenerating: boolean;
  /** Whether the button should be disabled */
  disabled: boolean;
  /** Handle button click */
  onClick: () => void;
}

/**
 * GenerateButton Component
 * 
 * Renders the main generate teams button with proper states and animations.
 * Provides visual feedback for loading and disabled states.
 * 
 * @param props - Component props
 * @returns JSX element for the generate teams button
 */
export const GenerateButton = ({ 
  isGenerating, 
  disabled, 
  onClick 
}: GenerateButtonProps) => {
  const isDisabled = disabled || isGenerating;
  const buttonText = isGenerating ? 'Generating...' : 'Generate Teams';

  return (
    <Button
      variant="contained"
      startIcon={<ShuffleIcon />}
      onClick={onClick}
      disabled={isDisabled}
      sx={{ 
        px: { xs: 4, sm: 6 },
        py: { xs: 1.5, sm: 1.25 },
        // Font family and weight inherited from theme button typography variant
        fontSize: 'clamp(0.8rem, 1.2vw, 0.875rem)', // Fluid scaling for responsive button text
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[2],
        '&:hover': {
          boxShadow: (theme) => theme.shadows[4],
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out'
        },
        '&:active': {
          transform: 'translateY(0px)',
        },
        '&.Mui-disabled': {
          boxShadow: (theme) => theme.shadows[1],
          transform: 'none'
        }
      }}
      // Accessibility attributes
      aria-label={isGenerating ? 'Generating teams, please wait' : 'Generate teams'}
      title={isGenerating ? 'Generating teams...' : 'Generate teams from participants'}
    >
      {buttonText}
    </Button>
  );
}; 