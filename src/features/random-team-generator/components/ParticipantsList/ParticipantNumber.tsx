/**
 * ParticipantNumber Component
 * 
 * A small, focused component that displays the participant number indicator.
 * Shows a circular badge with the participant's number when the input has content.
 * 
 * Responsibilities:
 * - Display participant number in a circular badge
 * - Show/hide based on whether input has content
 * - Provide smooth transitions for better UX
 */

import { Box } from '@mui/material';

/**
 * Props for the ParticipantNumber component
 */
interface ParticipantNumberProps {
  /** The number to display (1-based index) */
  number: number;
  /** Whether to show the number (based on input content) */
  show: boolean;
}

/**
 * ParticipantNumber Component
 * 
 * Displays a circular badge with the participant number.
 * Only visible when the associated input has content.
 * 
 * @param props - Component props
 * @returns JSX element for the participant number indicator
 */
export const ParticipantNumber = ({ number, show }: ParticipantNumberProps) => {
  return (
    <Box
      sx={{
        minWidth: 24,
        height: 24,
        borderRadius: '50%',
        bgcolor: show ? 'primary.main' : 'transparent',
        color: show ? 'primary.contrastText' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 600,
        flexShrink: 0,
        transition: 'all 0.2s ease',
        // Accessibility: Ensure minimum touch target size
        minHeight: 24,
      }}
    >
      {show ? number : ''}
    </Box>
  );
}; 