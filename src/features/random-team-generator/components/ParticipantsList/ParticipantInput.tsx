/**
 * ParticipantInput Component
 * 
 * A focused component that handles a single participant input field.
 * Manages the input field, delete button, and participant number display.
 * 
 * Responsibilities:
 * - Render individual participant input field
 * - Handle input changes and keyboard navigation
 * - Show/hide delete button based on content
 * - Display participant number when appropriate
 */

import { Box, TextField, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ParticipantNumber } from './ParticipantNumber';
import type { ParticipantInput as ParticipantInputType } from '../../types';

/**
 * Props for the ParticipantInput component
 */
interface ParticipantInputProps {
  /** The participant data */
  participant: ParticipantInputType;
  /** The display number for this participant */
  displayNumber: number;
  /** Whether to show the participant number */
  showNumber: boolean;
  /** Whether this is the only input (disable delete) */
  isOnlyInput: boolean;
  /** Ref callback for the input element */
  inputRef: (el: HTMLInputElement | null) => void;
  /** Handle input value changes */
  onChange: (id: number, value: string) => void;
  /** Handle keyboard navigation */
  onKeyDown: (id: number, e: React.KeyboardEvent) => void;
  /** Handle participant removal */
  onRemove: (id: number) => void;
}

/**
 * ParticipantInput Component
 * 
 * Renders a single participant input with number indicator and delete button.
 * Handles all interactions for one participant entry.
 * 
 * @param props - Component props
 * @returns JSX element for the participant input row
 */
export const ParticipantInput = ({
  participant,
  displayNumber,
  showNumber,
  isOnlyInput,
  inputRef,
  onChange,
  onKeyDown,
  onRemove
}: ParticipantInputProps) => {
  const hasContent = participant.value.trim() !== '';

  return (
    <Box 
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        // Ensure consistent height for all input rows
        minHeight: 40,
      }}
    >
      {/* Participant Number Indicator */}
      <ParticipantNumber 
        number={displayNumber} 
        show={showNumber} 
      />
      
      {/* Input Field */}
      <TextField
        inputRef={inputRef}
        value={participant.value}
        onChange={(e) => onChange(participant.id, e.target.value)}
        onKeyDown={(e) => onKeyDown(participant.id, e)}
        placeholder="Enter name..."
        variant="outlined"
        size="small"
        sx={{ 
          flex: 1,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              border: 'none'
            },
            '&:hover fieldset': {
              border: 'none'
            },
            '&.Mui-focused fieldset': {
              border: 'none'
            },
            bgcolor: 'background.default',
            borderRadius: 1
          }
        }}
        // Accessibility attributes
        aria-label={`Participant ${displayNumber} name input`}
        autoComplete="off"
      />
      
      {/* Delete Button */}
      <IconButton
        size="small"
        onClick={() => onRemove(participant.id)}
        disabled={isOnlyInput}
        sx={{
          // Show button when input has content, hide when empty
          opacity: hasContent ? 0.7 : 0,
          transition: 'opacity 0.2s ease',
          color: 'error.main',
          flexShrink: 0,
          '&:hover': {
            opacity: hasContent ? 1 : 0,
            bgcolor: 'error.main',
            color: 'error.contrastText'
          },
          '&.Mui-disabled': {
            opacity: 0
          }
        }}
        // Accessibility attributes
        aria-label={`Remove participant ${displayNumber}`}
        title={`Remove participant ${displayNumber}`}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}; 