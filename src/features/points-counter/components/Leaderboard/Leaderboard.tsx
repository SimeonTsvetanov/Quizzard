/**
 * Leaderboard Component - v3.0.0
 *
 * Displays team rankings with beautiful card-based design
 * Features modern styling, position indicators, and responsive layout
 * Optimized for full-screen modal display with proper space utilization
 *
 * @fileoverview Modern leaderboard with enhanced visual design
 * @version 3.0.0 - Complete redesign for beauty and space efficiency
 * @since December 2025
 */

import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import type { Team } from "../../types";
import { formatScore } from "../../utils/gameUtils";

/**
 * Props for Leaderboard component
 */
interface LeaderboardProps {
  teams: Team[];
  currentRound: number;
  totalRounds?: number; // Optional for backward compatibility
  showDetails?: boolean;
}

/**
 * Leaderboard entry interface
 */
interface LeaderboardEntry {
  position: number;
  team: Team;
  pointsFromFirst: number;
  isLeader: boolean;
}

/**
 * Get position styling based on rank
 */
const getPositionStyling = (position: number) => {
  switch (position) {
    case 1:
      return {
        bgcolor: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
        color: "#000",
        icon: "🥇",
        chipColor: "warning" as const,
      };
    case 2:
      return {
        bgcolor: "linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)",
        color: "#000",
        icon: "🥈",
        chipColor: "default" as const,
      };
    case 3:
      return {
        bgcolor: "linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)",
        color: "#fff",
        icon: "🥉",
        chipColor: "default" as const,
      };
    default:
      return {
        bgcolor: "background.paper",
        color: "text.primary",
        icon: null,
        chipColor: "default" as const,
      };
  }
};

/**
 * Leaderboard Component
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({
  teams,
  currentRound,
  totalRounds,
  showDetails = false,
}) => {
  // Calculate leaderboard entries with rankings
  const leaderboardEntries: LeaderboardEntry[] = React.useMemo(() => {
    const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore);
    const topScore = sortedTeams[0]?.totalScore || 0;

    return sortedTeams.map((team, index) => ({
      position: index + 1,
      team,
      pointsFromFirst: topScore - team.totalScore,
      isLeader: index === 0,
    }));
  }, [teams]);

  // Determine round display text
  const getRoundDisplayText = (): string => {
    if (totalRounds && currentRound === totalRounds) {
      return "Final Round";
    }
    return `Round ${currentRound}`;
  };

  if (teams.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 8,
          color: "text.secondary",
        }}
      >
        <TrophyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
        <Typography variant="h6">No teams to display</Typography>
        <Typography variant="body2">
          Start adding teams to see the leaderboard
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Stats Header */}
      {showDetails && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            mb: 3,
            p: 2,
            bgcolor: "rgba(25, 118, 210, 0.1)",
            borderRadius: 2,
            border: "1px solid rgba(25, 118, 210, 0.2)",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="primary" fontWeight={700}>
              {teams.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Teams
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="primary" fontWeight={700}>
              {getRoundDisplayText()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current Round
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="primary" fontWeight={700}>
              {formatScore(Math.max(...teams.map((t) => t.totalScore)))}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Top Score
            </Typography>
          </Box>
        </Box>
      )}

      {/* Teams List */}
      <List sx={{ p: 0, gap: 2, display: "flex", flexDirection: "column" }}>
        {leaderboardEntries.map((entry, index) => {
          const styling = getPositionStyling(entry.position);

          return (
            <Card
              key={entry.team.id}
              sx={{
                background:
                  entry.position <= 3 ? styling.bgcolor : "background.paper",
                border: entry.isLeader
                  ? "2px solid #1976d2"
                  : "1px solid rgba(0,0,0,0.12)",
                borderRadius: 3,
                overflow: "visible",
                position: "relative",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 2, sm: 3 },
                  }}
                >
                  {/* Position Avatar */}
                  <Avatar
                    sx={{
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      bgcolor:
                        entry.position <= 3
                          ? "rgba(255,255,255,0.9)"
                          : "primary.main",
                      color: entry.position <= 3 ? "#000" : "#fff",
                      fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                      fontWeight: 700,
                      border: entry.isLeader ? "3px solid #1976d2" : "none",
                    }}
                  >
                    {styling.icon || entry.position}
                  </Avatar>

                  {/* Team Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
                          fontWeight: entry.isLeader ? 700 : 600,
                          color: styling.color,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {entry.team.name}
                      </Typography>

                      {entry.isLeader && (
                        <StarIcon
                          sx={{
                            color: "#FFD700",
                            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                          }}
                        />
                      )}
                    </Box>

                    {/* Progress Info */}
                    {showDetails && entry.pointsFromFirst > 0 && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: styling.color,
                          opacity: 0.8,
                          fontSize: "clamp(0.75rem, 1.8vw, 0.85rem)",
                        }}
                      >
                        {formatScore(entry.pointsFromFirst)} behind leader
                      </Typography>
                    )}
                  </Box>

                  {/* Score Display */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 1,
                    }}
                  >
                    <Chip
                      label={formatScore(entry.team.totalScore)}
                      color={entry.isLeader ? "primary" : styling.chipColor}
                      variant={entry.isLeader ? "filled" : "outlined"}
                      sx={{
                        fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
                        fontWeight: 700,
                        minWidth: { xs: 70, sm: 85 },
                        height: { xs: 32, sm: 36 },
                      }}
                    />

                    {showDetails && entry.team.totalScore > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: styling.color,
                          opacity: 0.7,
                        }}
                      >
                        <TrendingUpIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption">
                          {Object.keys(entry.team.roundScores).length} rounds
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>

              {/* Leader Badge */}
              {entry.isLeader && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: 16,
                    bgcolor: "#1976d2",
                    color: "white",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    zIndex: 1,
                  }}
                >
                  <TrophyIcon sx={{ fontSize: 14 }} />
                  LEADER
                </Box>
              )}
            </Card>
          );
        })}
      </List>

      {/* Footer Statistics */}
      {showDetails && teams.length > 3 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box
            sx={{
              textAlign: "center",
              py: 2,
              bgcolor: "rgba(0,0,0,0.02)",
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {teams.length} teams competing • {getRoundDisplayText()} • Total
              points:{" "}
              {formatScore(
                teams.reduce((sum, team) => sum + team.totalScore, 0)
              )}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};
