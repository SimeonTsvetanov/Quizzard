/**
 * Leaderboard Component for Points Counter
 * 
 * Displays team rankings with styled positions, scores, and point differences.
 * Features trophy emojis for top 3 positions and responsive design.
 * 
 * @fileoverview Leaderboard display component
 * @version 1.0.0
 * @since December 2025
 */

import React from 'react';
import {
  Box,
  Card,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
// Types imported in utils
import { createLeaderboard } from '../../utils/gameUtils';

/**
 * Props interface for Leaderboard component
 */
interface LeaderboardProps {
  /** Array of teams to display in leaderboard */
  teams: any[];
  /** Current round number for context */
  currentRound: number;
  /** Whether to show detailed breakdown */
  showDetails?: boolean;
}

/**
 * Leaderboard Component
 * Displays team rankings with positions and scores
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({
  teams,
  currentRound,
  showDetails = false,
}) => {
  // Create leaderboard entries with rankings
  const leaderboard = createLeaderboard(teams);

  /**
   * Gets position emoji or number for ranking display
   */
  const getPositionDisplay = (position: number): string => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${position}.`;
    }
  };

  /**
   * Gets background color for position styling
   */
  const getPositionColor = (position: number): string => {
    switch (position) {
      case 1:
        return 'gold';
      case 2:
        return 'silver';
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return 'transparent';
    }
  };

  /**
   * Formats score display with proper decimal places
   */
  const formatScore = (score: number): string => {
    return score % 1 === 0 ? score.toString() : score.toFixed(2);
  };

  if (leaderboard.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontStyle: 'italic' }}
        >
          No teams to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Leaderboard Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          gap: 1,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          🏆 Leaderboard
        </Typography>
        
        <Chip
          label={`Round ${currentRound}`}
          color="primary"
          variant="outlined"
          size="small"
          sx={{
            fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)',
            fontWeight: 600,
          }}
        />
      </Box>

      {/* Leaderboard List */}
      <Card
        sx={{
          backgroundColor: 'background.paper',
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <List sx={{ p: 0 }}>
          {leaderboard.map((entry, index) => (
            <React.Fragment key={entry.team.id}>
              <ListItem
                sx={{
                  py: { xs: 2, sm: 2.5 },
                  px: { xs: 2, sm: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundColor: entry.position <= 3 
                    ? `${getPositionColor(entry.position)}15` // 15% opacity
                    : 'transparent',
                  border: entry.isLeader ? '2px solid' : 'none',
                  borderColor: entry.isLeader ? 'primary.main' : 'transparent',
                  borderRadius: entry.isLeader ? 1 : 0,
                  mx: entry.isLeader ? 1 : 0,
                  my: entry.isLeader ? 0.5 : 0,
                }}
              >
                {/* Position Display */}
                <Box
                  sx={{
                    minWidth: { xs: 40, sm: 50 },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                      fontWeight: 700,
                    }}
                  >
                    {getPositionDisplay(entry.position)}
                  </Typography>
                </Box>

                {/* Team Name and Details */}
                <ListItemText
                  primary={
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                        fontWeight: entry.isLeader ? 700 : 600,
                        color: entry.isLeader ? 'primary.main' : 'text.primary',
                      }}
                    >
                      {entry.team.name}
                    </Typography>
                  }
                  secondary={
                    entry.pointsFromFirst > 0 && !entry.isLeader ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: 'clamp(0.8rem, 1.5vw, 0.85rem)',
                          fontStyle: 'italic',
                        }}
                      >
                        -{entry.pointsFromFirst} from leader
                      </Typography>
                    ) : entry.isLeader ? (
                      <Typography
                        variant="body2"
                        color="primary.main"
                        sx={{
                          fontSize: 'clamp(0.8rem, 1.5vw, 0.85rem)',
                          fontWeight: 600,
                        }}
                      >
                        Leading!
                      </Typography>
                    ) : null
                  }
                />

                {/* Score Display */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    minWidth: { xs: 80, sm: 100 },
                  }}
                >
                  <Chip
                    label={formatScore(entry.team.totalScore)}
                    color={entry.isLeader ? 'primary' : 'default'}
                    variant={entry.isLeader ? 'filled' : 'outlined'}
                    sx={{
                      fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                      fontWeight: 700,
                      minWidth: { xs: 60, sm: 80 },
                    }} 
                  />
                  
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      fontSize: 'clamp(0.7rem, 1.2vw, 0.75rem)',
                    }}
                  >
                    points
                  </Typography>
                </Box>
              </ListItem>

              {/* Divider between entries (except last) */}
              {index < leaderboard.length - 1 && (
                <Divider sx={{ mx: 2 }} />
              )}
            </React.Fragment>
          ))}
        </List>
      </Card>

      {/* Additional Stats */}
      {showDetails && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textAlign: 'center',
              fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
            }}
          >
            Total Teams: {leaderboard.length} • Current Round: {currentRound}
          </Typography>
        </Box>
      )}
    </Box>
  );
}; 