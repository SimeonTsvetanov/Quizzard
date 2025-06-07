/**
 * ClearConfirmDialog Component
 * 
 * A focused component for confirming the clear all participants action.
 * Provides a confirmation dialog with proper messaging and actions.
 * 
 * Responsibilities:
 * - Display confirmation dialog for clearing participants
 * - Show participant count in confirmation message
 * - Provide cancel and confirm actions
 * - Handle proper dialog accessibility
 */

import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from '@mui/material';

/**
 * Props for the ClearConfirmDialog component
 */
interface ClearConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Number of participants to be cleared */
  participantCount: number;
  /** Handle dialog close/cancel */
  onCancel: () => void;
  /** Handle confirm clear action */
  onConfirm: () => void;
}

/**
 * ClearConfirmDialog Component
 * 
 * Renders a confirmation dialog for clearing all participants.
 * Shows the number of participants that will be cleared.
 * 
 * @param props - Component props
 * @returns JSX element for the clear confirmation dialog
 */
export const ClearConfirmDialog = ({
  open,
  participantCount,
  onCancel,
  onConfirm
}: ClearConfirmDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      // Accessibility attributes
      aria-labelledby="clear-dialog-title"
      aria-describedby="clear-dialog-description"
    >
      <DialogTitle id="clear-dialog-title">
        Clear All Participants?
      </DialogTitle>
      
      <DialogContent>
        <Typography id="clear-dialog-description">
          Are you sure you want to clear all {participantCount} participant{participantCount !== 1 ? 's' : ''}?
          This action cannot be undone.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onCancel}
          color="inherit"
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained"
          autoFocus // Focus the primary action
        >
          Clear All
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 