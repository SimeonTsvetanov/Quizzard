/**
 * TeamCountSelector Component
 * 
 * A focused component for selecting the number of teams to generate.
 * Provides increment/decrement buttons with proper constraints.
 * 
 * Responsibilities:
 * - Display current team count
 * - Provide increment/decrement controls
 * - Enforce min/max team count limits
 * - Show visual feedback for disabled states
 */

import { Box, IconButton, Typography } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { CONSTANTS } from '../../types';

/**
 * Props for the TeamCountSelector component
 */
interface TeamCountSelectorProps {
  /** Current team count */
  teamCount: number;
  /** Handle team count changes */
  onTeamCountChange: (count: number) => void;
}

/**
 * TeamCountSelector Component
 * 
 * Renders team count selection controls with increment/decrement buttons.
 * Enforces minimum and maximum team count constraints.
 * 
 * @param props - Component props
 * @returns JSX element for the team count selector
 */
export const TeamCountSelector = ({ 
  teamCount, 
  onTeamCountChange 
}: TeamCountSelectorProps) => {
  const canDecrement = teamCount > CONSTANTS.MIN_TEAMS;
  const canIncrement = teamCount < CONSTANTS.MAX_TEAMS;

  const handleDecrement = () => {
    if (canDecrement) {
      onTeamCountChange(teamCount - 1);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onTeamCountChange(teamCount + 1);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2
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
        variant="h6" 
        fontWeight={600}
        sx={{ 
          minWidth: { xs: 120, sm: 140 },
          textAlign: 'center',
          fontSize: { xs: '1rem', sm: '1.25rem' },
          userSelect: 'none' // Prevent text selection
        }}
        aria-live="polite" // Announce changes to screen readers
      >
        {teamCount} Team{teamCount !== 1 ? 's' : ''}
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
  );
}; 