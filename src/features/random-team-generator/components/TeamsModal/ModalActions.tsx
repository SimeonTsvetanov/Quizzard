/**
 * ModalActions Component
 * 
 * A focused component for the teams modal action buttons.
 * Handles refresh, copy, and close actions with proper states.
 * 
 * Responsibilities:
 * - Display action buttons (refresh, copy, close)
 * - Handle loading states and animations
 * - Provide proper accessibility attributes
 * - Show visual feedback for actions
 */

import { Box, IconButton } from '@mui/material';
import { 
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * Props for the ModalActions component
 */
interface ModalActionsProps {
  /** Whether teams are being refreshed */
  isRefreshing: boolean;
  /** Whether teams are being generated */
  isGenerating: boolean;
  /** Handle refresh teams action */
  onRefresh: () => void;
  /** Handle copy teams action */
  onCopy: () => void;
  /** Handle close modal action */
  onClose: () => void;
}

/**
 * ModalActions Component
 * 
 * Renders the action buttons for the teams modal.
 * Provides refresh, copy, and close functionality.
 * 
 * @param props - Component props
 * @returns JSX element for the modal action buttons
 */
export const ModalActions = ({
  isRefreshing,
  isGenerating,
  onRefresh,
  onCopy,
  onClose
}: ModalActionsProps) => {
  const isRefreshDisabled = isGenerating || isRefreshing;

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {/* Refresh Button */}
      <IconButton
        onClick={onRefresh}
        disabled={isRefreshDisabled}
        sx={{ 
          color: 'primary.main',
          '&:hover': { 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText' 
          },
          transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease-in-out',
          '&.Mui-disabled': {
            color: 'action.disabled'
          }
        }}
        aria-label="Refresh teams"
        title="Generate new teams with same participants"
      >
        <RefreshIcon />
      </IconButton>
      
      {/* Copy Button */}
      <IconButton
        onClick={onCopy}
        sx={{ 
          color: 'success.main',
          '&:hover': { 
            bgcolor: 'success.main', 
            color: 'success.contrastText' 
          }
        }}
        aria-label="Copy teams to clipboard"
        title="Copy teams to clipboard"
      >
        <CopyIcon />
      </IconButton>
      
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{ 
          color: 'text.secondary',
          '&:hover': { 
            bgcolor: 'error.main', 
            color: 'error.contrastText' 
          }
        }}
        aria-label="Close teams modal"
        title="Close teams modal"
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
}; 