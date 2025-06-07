/**
 * TeamsModal Component
 * 
 * Container component for displaying generated teams in a modal dialog.
 * Handles the modal layout, team grid, and action buttons.
 * 
 * Responsibilities:
 * - Display teams in a responsive grid layout
 * - Handle modal open/close state
 * - Coordinate team actions (refresh, copy)
 * - Provide proper modal accessibility
 */

import { Dialog, DialogTitle, DialogContent, Box, Typography } from '@mui/material';
import { TeamCard } from './TeamCard';
import { ModalActions } from './ModalActions';
import type { Team } from '../../types';

/**
 * Props for the TeamsModal component
 */
interface TeamsModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Array of teams to display */
  teams: Team[];
  /** Whether teams are being refreshed */
  isRefreshing: boolean;
  /** Whether teams are being generated */
  isGenerating: boolean;
  /** Handle modal close */
  onClose: () => void;
  /** Handle refresh teams action */
  onRefresh: () => void;
  /** Handle copy teams action */
  onCopy: () => void;
}

/**
 * TeamsModal Component
 * 
 * Renders the teams modal with generated teams in a grid layout.
 * Provides actions for refreshing, copying, and closing.
 * 
 * @param props - Component props
 * @returns JSX element for the teams modal
 */
export const TeamsModal = ({
  open,
  teams,
  isRefreshing,
  isGenerating,
  onClose,
  onRefresh,
  onCopy
}: TeamsModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '80vh',
          m: 2
        }
      }}
      // Accessibility attributes
      aria-labelledby="teams-modal-title"
      aria-describedby="teams-modal-content"
    >
      {/* Modal Header */}
      <DialogTitle 
        id="teams-modal-title"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Your Teams
        </Typography>
        
        {/* Action Buttons */}
        <ModalActions
          isRefreshing={isRefreshing}
          isGenerating={isGenerating}
          onRefresh={onRefresh}
          onCopy={onCopy}
          onClose={onClose}
        />
      </DialogTitle>
      
      {/* Modal Content */}
      <DialogContent 
        id="teams-modal-content"
        sx={{ pt: 1 }}
      >
        {teams.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(auto-fit, minmax(200px, 1fr))' 
              },
              gap: 2,
              opacity: isRefreshing ? 0.5 : 1,
              transform: isRefreshing ? 'scale(0.98)' : 'scale(1)',
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isRefreshing={isRefreshing}
              />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
              textAlign: 'center'
            }}
          >
            <Typography 
              variant="body1" 
              color="text.secondary"
            >
              No teams generated yet.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}; 