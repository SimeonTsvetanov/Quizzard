/**
 * TeamControls Component
 * 
 * Container component that manages the team generation controls section.
 * Combines team count selection, distribution message, and generate button.
 * 
 * Responsibilities:
 * - Render the controls section with proper layout
 * - Display team count selector and generate button
 * - Show team distribution preview message
 * - Coordinate between control components
 */

import { Box, Typography } from '@mui/material';
import { TeamCountSelector } from './TeamCountSelector';
import { GenerateButton } from './GenerateButton';

/**
 * Props for the TeamControls component
 */
interface TeamControlsProps {
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
 * TeamControls Component
 * 
 * Renders the complete team controls section with count selector and generate button.
 * Manages the layout and coordinates between control components.
 * 
 * @param props - Component props
 * @returns JSX element for the team controls section
 */
export const TeamControls = ({
  teamCount,
  isGenerating,
  distributionMessage,
  canGenerate,
  onTeamCountChange,
  onGenerateTeams
}: TeamControlsProps) => {
  return (
    <Box 
      sx={{ 
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: (theme) => theme.shadows[4],
        p: { xs: 2, sm: 3 }
      }}
    >
      {/* Team Count Controls */}
      <TeamCountSelector 
        teamCount={teamCount}
        onTeamCountChange={onTeamCountChange}
      />

      {/* Distribution Message */}
      {distributionMessage && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          textAlign="center"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            minHeight: '1.2em', // Prevent layout shift
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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
        <GenerateButton
          isGenerating={isGenerating}
          disabled={!canGenerate}
          onClick={onGenerateTeams}
        />
      </Box>
    </Box>
  );
}; 