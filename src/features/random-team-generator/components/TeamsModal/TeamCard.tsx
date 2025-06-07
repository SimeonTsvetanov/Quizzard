/**
 * TeamCard Component
 * 
 * A focused component for displaying a single team card.
 * Shows team name and member list with hover effects.
 * 
 * Responsibilities:
 * - Display team name and members
 * - Provide hover animations
 * - Handle responsive layout
 * - Show team emoji and styling
 */

import { Box, Typography } from '@mui/material';
import type { Team } from '../../types';

/**
 * Props for the TeamCard component
 */
interface TeamCardProps {
  /** The team data to display */
  team: Team;
  /** Whether the card should show refresh animation */
  isRefreshing?: boolean;
}

/**
 * TeamCard Component
 * 
 * Renders a single team card with name and member list.
 * Provides hover effects and responsive design.
 * 
 * @param props - Component props
 * @returns JSX element for the team card
 */
export const TeamCard = ({ team, isRefreshing = false }: TeamCardProps) => {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[2],
        opacity: isRefreshing ? 0.5 : 1,
        transform: isRefreshing ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[4],
          transform: isRefreshing ? 'scale(0.98)' : 'translateY(-2px)',
        }
      }}
    >
      {/* Team Name */}
      <Typography
        variant="subtitle1"
        fontWeight={600}
        color="primary.main"
        sx={{ 
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        🏆 {team.name}
      </Typography>
      
      {/* Team Members */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0.5 
        }}
      >
        {team.members.map((member, index) => (
          <Typography
            key={member.id}
            variant="body2"
            color="text.primary"
            sx={{
              fontSize: '0.875rem',
              lineHeight: 1.4
            }}
          >
            {index + 1}. {member.name}
          </Typography>
        ))}
      </Box>
      
      {/* Member Count Badge */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mt: 1,
          display: 'block',
          fontSize: '0.75rem',
          fontStyle: 'italic'
        }}
      >
        {team.members.length} member{team.members.length !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
}; 