/**
 * ParticipantsList Component
 * 
 * Container component that manages the list of participant input fields and team controls.
 * Handles the scrollable area, header with clear button, individual inputs, and team generation controls.
 * 
 * Responsibilities:
 * - Render the participants input section with header
 * - Manage scrollable list of participant inputs
 * - Handle clear all functionality
 * - Coordinate between individual inputs and parent state
 * - Provide team count selection and generate button controls
 */

import { Box, Typography, Button, IconButton, useTheme } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Shuffle as ShuffleIcon } from '@mui/icons-material';
import { ParticipantInput } from './ParticipantInput';
import type { ParticipantInput as ParticipantInputType } from '../../types';
import { CONSTANTS } from '../../types';

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
  /** Current team count */
  teamCount: number;
  /** Whether teams are being generated */
  isGenerating: boolean;
  /** Team distribution message */
  distributionMessage: string;
  /** Whether generate button should be disabled */
  canGenerate: boolean;
  /** Handle team count changes */
  onTeamCountChange: (count: number) => void;
  /** Handle generate teams action */
  onGenerateTeams: () => void;
}

/**
 * ParticipantsList Component
 * 
 * Renders the complete participants input section with header, scrollable list, and team controls.
 * Manages the layout and coordinates between individual participant inputs and team generation.
 * 
 * @param props - Component props
 * @returns JSX element for the participants list section with integrated team controls
 */
export const ParticipantsList = ({
  participants,
  filledCount,
  isOnlyInput,
  inputRefs,
  onInputChange,
  onKeyDown,
  onRemoveParticipant,
  onClearAll,
  teamCount,
  isGenerating,
  distributionMessage,
  canGenerate,
  onTeamCountChange,
  onGenerateTeams
}: ParticipantsListProps) => {
  const theme = useTheme();
  
  // Check if there are any filled participants to show clear button
  const hasParticipants = filledCount > 0;

  // Team count selector logic
  const safeTeamCount = typeof teamCount === 'number' && teamCount > 0 ? teamCount : CONSTANTS.MIN_TEAMS;
  const canDecrement = safeTeamCount > CONSTANTS.MIN_TEAMS;
  const canIncrement = safeTeamCount < CONSTANTS.MAX_TEAMS;

  const handleDecrement = () => {
    if (canDecrement) {
      onTeamCountChange(safeTeamCount - 1);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onTeamCountChange(safeTeamCount + 1);
    }
  };

  // Generate button logic
  const isDisabled = !canGenerate || isGenerating;
  const buttonText = isGenerating ? 'Generating...' : 'Generate Teams';

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        // Take full available height in the new viewport layout
        height: '100%', // Full height of available space
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
          pb: 1, // Optimized spacing to header-to-input gap
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
          flex: 1, // Take remaining space
          p: { xs: 1, sm: 2 },
          pt: 0.5, // Optimized top padding for compact header-to-input spacing
          overflowY: 'auto', // Only this area scrolls
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          // Enhanced scrollbar styling for better UX in full viewport mode
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

      {/* Integrated Team Controls Section - Combined from separate TeamControls component */}
      <Box 
        sx={{ 
          flexShrink: 0, // Fixed size at bottom
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(0.25rem, 1vw, 0.5rem)', // Optimized compact spacing for team controls
          p: { xs: 1, sm: 2 }, // Match scrollable area padding for consistency
          pt: 'clamp(0.25rem, 1vw, 0.75rem)', // Optimized top padding for compact separation
        }}
      >
        {/* Team Count Controls */}
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(1rem, 2.5vw, 2rem)' // Fluid gap for better button spacing
          }}
        >
          {/* Decrement Button */}
          <IconButton
            onClick={handleDecrement}
            disabled={!canDecrement}
            sx={{ 
              bgcolor: 'background.default',
              '&:hover': { 
                bgcolor: canDecrement ? 'action.hover' : 'background.default' 
              },
              '&.Mui-disabled': {
                bgcolor: 'background.default',
                opacity: 0.5
              }
            }}
            aria-label="Decrease team count"
            title={`Decrease team count (minimum ${CONSTANTS.MIN_TEAMS})`}
          >
            <RemoveIcon />
          </IconButton>
          
          {/* Team Count Display */}
          <Typography 
            variant="quizCounter"
            sx={{ 
              minWidth: { xs: 120, sm: 140 },
              textAlign: 'center',
              userSelect: 'none', // Prevent text selection
              marginBottom: 0, // Override theme margin
            }}
            aria-live="polite" // Announce changes to screen readers
          >
            {safeTeamCount} Team{safeTeamCount !== 1 ? 's' : ''}
          </Typography>
          
          {/* Increment Button */}
          <IconButton
            onClick={handleIncrement}
            disabled={!canIncrement}
            sx={{ 
              bgcolor: 'background.default',
              '&:hover': { 
                bgcolor: canIncrement ? 'action.hover' : 'background.default' 
              },
              '&.Mui-disabled': {
                bgcolor: 'background.default',
                opacity: 0.5
              }
            }}
            aria-label="Increase team count"
            title={`Increase team count (maximum ${CONSTANTS.MAX_TEAMS})`}
          >
            <AddIcon />
          </IconButton>
        </Box>

        {/* Distribution Message */}
        {distributionMessage && (
          <Typography 
            variant="quizInstructions"
            sx={{ 
              textAlign: 'center',
              minHeight: '1.2em', // Prevent layout shift
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 0, // Override theme margin
            }}
          >
            {distributionMessage}
          </Typography>
        )}

        {/* Generate Teams Button - Centered */}
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button
            variant="contained"
            startIcon={<ShuffleIcon />}
            onClick={onGenerateTeams}
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
        </Box>
      </Box>
    </Box>
  );
}; 