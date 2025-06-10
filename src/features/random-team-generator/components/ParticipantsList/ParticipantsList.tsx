/**
 * ParticipantsList Component
 * 
 * Container component that manages the list of participant input fields.
 * Handles the scrollable area, header with clear button, and individual inputs.
 * 
 * Responsibilities:
 * - Render the participants input section with header
 * - Manage scrollable list of participant inputs
 * - Handle clear all functionality
 * - Coordinate between individual inputs and parent state
 */

import { Box, Typography, Button, useTheme } from '@mui/material';
import { ParticipantInput } from './ParticipantInput';
import type { ParticipantInput as ParticipantInputType } from '../../types';

/**
 * Props for the ParticipantsList component
 */
interface ParticipantsListProps {
  /** Array of participant inputs */
  participants: ParticipantInputType[];
  /** Count of filled participants for numbering */
  filledCount: number;
  /** Whether this is the only input (disable delete) */
  isOnlyInput: boolean;
  /** Map of input element references */
  inputRefs: React.MutableRefObject<Map<number, HTMLInputElement>>;
  /** Handle input value changes */
  onInputChange: (id: number, value: string) => void;
  /** Handle keyboard navigation */
  onKeyDown: (id: number, e: React.KeyboardEvent) => void;
  /** Handle participant removal */
  onRemoveParticipant: (id: number) => void;
  /** Handle clear all participants */
  onClearAll: () => void;
}

/**
 * ParticipantsList Component
 * 
 * Renders the complete participants input section with header and scrollable list.
 * Manages the layout and coordinates between individual participant inputs.
 * 
 * @param props - Component props
 * @returns JSX element for the participants list section
 */
export const ParticipantsList = ({
  participants,
  filledCount,
  isOnlyInput,
  inputRefs,
  onInputChange,
  onKeyDown,
  onRemoveParticipant,
  onClearAll
}: ParticipantsListProps) => {
  const theme = useTheme();
  
  // Check if there are any filled participants to show clear button
  const hasParticipants = filledCount > 0;

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        // Reduced sizing by 30% - more compact but still fits 7 names
        minHeight: { xs: 224, sm: 252 }, // Reduced from 320/360
        maxHeight: { xs: 350, sm: 385 }, // Reduced from 500/550
        bgcolor: 'background.paper',
        borderRadius: 3,
        elevation: 4,
        boxShadow: (theme) => theme.shadows[4],
        overflow: 'hidden'
      }}
    >
      {/* Header Section */}
      <Box 
        sx={{ 
          p: { xs: 2, sm: 3 },
          pb: 1,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Title and Hint - Using modern typography system for consistency */}
        <Typography 
          variant="quizTitle" 
          component="h2"
          sx={{ 
            flex: 1, 
            marginBottom: 0, // Override theme margin since we use gap layout
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', // Slightly smaller than default quizTitle for section context
          }}
        >
          Participants{' '}
          {/* Instructions using quiz-specific variant for consistency */}
          <Typography 
            component="span"
            variant="quizInstructions"
            sx={{ 
              fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)', // Fluid scaling replaces manual breakpoints
              fontWeight: 400,
              marginBottom: 0, // Override theme margin for inline span
            }}
          >
            (Add your names - each on a new line)
          </Typography>
        </Typography>
        
        {/* Clear All Button - Only show when there are names */}
        {hasParticipants && (
          <Button
            onClick={onClearAll}
            size="small"
            variant="contained"
            sx={{
              ml: 1,
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              boxShadow: (theme) => theme.shadows[1],
              '&:hover': {
                bgcolor: 'secondary.dark',
                boxShadow: (theme) => theme.shadows[2]
              }
            }}
            // Accessibility attributes
            aria-label="Clear all participants"
            title="Clear all participants"
          >
            Clear
          </Button>
        )}
      </Box>
      
      {/* Participant List - Scrollable Area */}
      <Box 
        sx={{ 
          flex: 1,
          p: { xs: 1, sm: 2 },
          overflowY: 'auto', // Always scrollable
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          // Enhanced scrollbar styling
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.05)',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.3)' 
              : 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.4)' 
                : 'rgba(0,0,0,0.4)',
            },
          },
        }}
      >
        {participants.map((participant, index) => {
          // Calculate display number and visibility
          const showNumber = participant.value.trim() !== '' || index < filledCount;
          const displayNumber = participant.value.trim() !== '' ? index + 1 : filledCount + 1;
          
          return (
            <ParticipantInput
              key={participant.id}
              participant={participant}
              displayNumber={displayNumber}
              showNumber={showNumber}
              isOnlyInput={isOnlyInput}
              inputRef={(el) => {
                if (el) {
                  inputRefs.current.set(participant.id, el);
                }
              }}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              onRemove={onRemoveParticipant}
            />
          );
        })}
      </Box>
    </Box>
  );
}; 