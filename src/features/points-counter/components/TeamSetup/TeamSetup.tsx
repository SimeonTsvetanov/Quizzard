/**
 * Team Setup Component for Points Counter
 * 
 * Provides interface for setting up teams before starting the quiz game.
 * Features RTG-style dynamic team management with funny name placeholders.
 * Supports both initial setup (game OFF) and edit mode (game ON).
 * 
 * @fileoverview Team setup and configuration component
 * @version 2.1.0
 * @since December 2025
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Close as CloseIcon,
  DeleteForever as ClearIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowRight as ArrowRightIcon,
} from '@mui/icons-material';
import type { Team } from '../../types';
import { GAME_CONSTANTS, FUNNY_TEAM_NAMES } from '../../types';
import { STORAGE_KEYS } from '../../../../shared/utils/storageKeys';

/**
 * Props interface for TeamSetup component
 */
interface TeamSetupProps {
  /** Current game status - 'ON' means active game with edit mode, 'OFF' means fresh setup */
  gameStatus: 'ON' | 'OFF';
  /** Callback when game should start or continue */
  onStartGame: (teams: Team[], rounds: number) => void;
  /** Callback when setup should be updated (edit mode) */
  onUpdateSetup?: (teams: Team[], rounds: number) => void;
  /** Callback when all data should be cleared */
  onClearAllData: () => void;
  /** Whether the setup is currently loading */
  isLoading?: boolean;
  /** Current error message */
  error?: string | null;
  /** Existing teams data for edit mode */
  existingTeams?: Team[];
  /** Existing rounds count for edit mode */
  existingRounds?: number;
}

/**
 * Team input interface for internal state management
 */
interface TeamInput {
  id: number;
  value: string;
}

/**
 * Team Number Component
 * Displays a circular badge with the team number
 */
const TeamNumber: React.FC<{ number: number; show: boolean }> = ({ number, show }) => (
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
      minHeight: 24,
    }}
  >
    {show ? number : ''}
  </Box>
);

/**
 * Team Setup Component
 * Allows configuration of teams and rounds before starting the quiz game
 */
export const TeamSetup: React.FC<TeamSetupProps> = ({
  gameStatus,
  onStartGame,
  onUpdateSetup,
  onClearAllData,
  isLoading = false,
  error,
  existingTeams,
  existingRounds,
}) => {
  const [teams, setTeams] = useState<TeamInput[]>([]);
  const [nextId, setNextId] = useState(1);
  const [roundCountInput, setRoundCountInput] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Derived values
  const roundCount = parseInt(roundCountInput) || 0;
  const isEditMode = gameStatus === 'ON';

  /**
   * Gets placeholder text for team input with memoized funny names
   */
  const getPlaceholderNames = useMemo(() => {
    const shuffledNames = [...FUNNY_TEAM_NAMES].sort(() => Math.random() - 0.5);
    return shuffledNames;
  }, []);

  /**
   * Gets placeholder text for team input
   */
  const getPlaceholderText = (index: number): string => {
    return getPlaceholderNames[index % getPlaceholderNames.length];
  };

  /**
   * Initialize component state from props or defaults
   */
  useEffect(() => {
    console.log('TeamSetup initializing:', { gameStatus, existingTeams, existingRounds });
    
    if (isEditMode && existingTeams && existingTeams.length > 0) {
      console.log('Loading edit mode with existing teams:', existingTeams);
      const teamInputs: TeamInput[] = existingTeams.map((team, index) => ({
        id: index + 1,
        value: team.name,
      }));
      // Add empty input at the end for adding new teams
      teamInputs.push({ id: existingTeams.length + 1, value: '' });
      setTeams(teamInputs);
      setNextId(existingTeams.length + 2);
    } else {
      console.log('Creating fresh setup');
      // Start with just ONE empty input with placeholder hint
      const singleTeam: TeamInput[] = [{ id: 1, value: '' }];
      console.log('Setting single empty team:', singleTeam);
      setTeams(singleTeam);
      setNextId(2);
    }

    if (isEditMode && existingRounds) {
      setRoundCountInput(existingRounds.toString());
    } else {
      setRoundCountInput('');
    }

    // Clear validation error when props change
    setValidationError(null);
  }, [isEditMode, existingTeams, existingRounds]);

  /**
   * Validates current setup
   */
  const validateSetup = useCallback((): boolean => {
    const filledTeams = teams.filter(t => t.value.trim() !== '');
    
    if (filledTeams.length < 1) {
      setValidationError('Fill minimum one Team and at least 1 Round');
      return false;
    }

    if (roundCount < 1) {
      setValidationError('Fill minimum one Team and at least 1 Round');
      return false;
    }

    setValidationError(null);
    return true;
  }, [teams, roundCount]);

  /**
   * Handles team name input changes
   */
  const handleInputChange = useCallback((id: number, value: string) => {
    console.log('handleInputChange called:', { id, value });
    // Clear validation error when user starts typing
    setValidationError(null);
    
    // Update team value
    setTeams(prev => {
      const newTeams = prev.map(t => t.id === id ? { ...t, value } : t);
      console.log('Setting teams after input change:', newTeams);
      return newTeams;
    });
    
    // Auto-create new input if typing in the last field and it's not empty
    const isLastInput = teams[teams.length - 1]?.id === id;
    if (isLastInput && value.trim() && teams.length < GAME_CONSTANTS.MAX_TEAMS) {
      setTeams(prev => [...prev, { id: nextId, value: '' }]);
      setNextId(prev => prev + 1);
    }
  }, [teams, nextId]);

  /**
   * Handles keyboard navigation
   */
  const handleKeyDown = useCallback((id: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      const currentIndex = teams.findIndex(t => t.id === id);
      const currentTeam = teams[currentIndex];
      
      // If the current input is empty, use the placeholder text as the team name
      if (currentTeam && currentTeam.value.trim() === '') {
        e.preventDefault(); // Prevent default behavior for both Enter and Tab
        const placeholderText = getPlaceholderText(currentIndex);
        handleInputChange(id, placeholderText);
        
        // Don't move to next input yet - let the user see the name was accepted
        return;
      }
      
      // Only handle Enter for navigation when input has content
      if (e.key === 'Enter') {
        e.preventDefault();
        if (currentIndex < teams.length - 1) {
          // Move to next existing input
          const nextTeam = teams[currentIndex + 1];
          const nextInput = inputRefs.current.get(nextTeam.id);
          nextInput?.focus();
        } else if (teams.length < GAME_CONSTANTS.MAX_TEAMS) {
          // Create new input and focus it
          setTeams(prev => [...prev, { id: nextId, value: '' }]);
          setTimeout(() => {
            const newInput = inputRefs.current.get(nextId);
            newInput?.focus();
          }, 10);
          setNextId(prev => prev + 1);
        }
      }
      // For Tab with content, let default behavior handle focus movement
    }
  }, [teams, nextId, handleInputChange, getPlaceholderText]);

  /**
   * Removes a team by ID
   */
  const removeTeam = useCallback((id: number) => {
    // Only prevent deletion if it would leave zero input fields
    if (teams.length > 1) {
      setTeams(prev => {
        const filtered = prev.filter(t => t.id !== id);
        
        // Ensure we always have at least one input field
        if (filtered.length === 0) {
          return [{ id: nextId, value: '' }];
        }
        
        // Ensure we always have at least one empty input at the end for adding new teams
        const hasEmptyInput = filtered.some(t => t.value.trim() === '');
        if (!hasEmptyInput) {
          filtered.push({ id: nextId, value: '' });
          setNextId(prev => prev + 1);
        }
        
        return filtered;
      });
    }
  }, [teams, nextId]);

  /**
   * Handles round count input change
   */
  const handleRoundCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Clear validation error when user changes rounds
    setValidationError(null);
    
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 99)) {
      setRoundCountInput(value);
    }
  };

  /**
   * Clears all Points Counter localStorage data
   */
  const handleClearAll = () => {
    setClearDialogOpen(false);
    onClearAllData();
  };

  /**
   * Handles starting/continuing the game with configured teams
   */
  const handleStartGame = () => {
    // Validate setup first
    if (!validateSetup()) {
      return; // Validation error is already set
    }

    const filledTeams = teams.filter(t => t.value.trim() !== '');
    
    const gameTeams: Team[] = filledTeams.map((team, index) => ({
      id: `team-${Date.now()}-${index}`,
      name: team.value.trim(),
      totalScore: 0,
      roundScores: {},
    }));

    if (isEditMode && onUpdateSetup) {
      onUpdateSetup(gameTeams, roundCount);
    } else {
      onStartGame(gameTeams, roundCount);
    }
  };

  /**
   * Gets count of filled teams
   */
  const getFilledTeamCount = (): number => {
    return teams.filter(t => t.value.trim() !== '').length;
  };

  /**
   * Gets header text based on game status
   */
  const getHeaderText = (): string => {
    return isEditMode ? 'Edit Teams' : 'Teams Setup';
  };

  /**
   * Gets button text based on game status
   */
  const getButtonText = (): string => {
    if (isLoading) return 'Processing...';
    return isEditMode ? 'Continue Game' : 'Start Quiz Game';
  };

  // Debug: log current teams on every render
  console.log('TeamSetup render - current teams:', teams);

  return (
    <Box
      sx={{
        // Account for browser chrome (address bar, tabs, etc.) - Same as RTG
        height: 'calc(100vh - 100px)', // Subtract space for browser UI elements
        minHeight: '480px', // Safety minimum for very small screens
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden', // Prevent page-level scrolling
      }}
    >
      {/* Main Content Area - RTG Pattern */}
      <Box sx={{ 
        flex: 1, // Fill available space
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 1, sm: 2 }, // Padding for the card
        overflow: 'hidden', // Ensure no overflow
      }}>
        <Box sx={{ 
          width: '100%',
          height: '100%', // Take full available height
          maxWidth: { 
            xs: 'calc(100vw - 16px)', 
            sm: 'clamp(280px, 50vw, 600px)' // Same as RTG max width constraint
          },
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Single Card Container - Everything Inside */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 4,
              overflow: 'hidden',
            }}
          >
        {/* Header Section - Title and Rounds on same row */}
        <Box
          sx={{
            flexShrink: 0,
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            display: 'flex',
            alignItems: 'baseline', // Changed to baseline for better text alignment
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {/* Game Setup Title - Left side */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              }}
            >
              {getHeaderText()}
            </Typography>
            {/* Small downward arrow pointing to team inputs */}
            <ArrowDownIcon
              sx={{
                fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                color: 'text.secondary',
                opacity: 0.6,
                ml: 0.5,
              }}
            />
          </Box>
          
          {/* Rounds Control - Right side, inline style */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline', // Align with the title baseline
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  color: 'text.primary',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  whiteSpace: 'nowrap',
                }}
              >
                Rounds
              </Typography>
              {/* Small rightward arrow pointing to rounds input */}
              <ArrowRightIcon
                sx={{
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  color: 'text.secondary',
                  opacity: 0.6,
                  ml: 0.25,
                }}
              />
            </Box>
            <TextField
              type="number"
              size="small"
              value={roundCountInput}
              onChange={handleRoundCountChange}
              inputProps={{
                min: 1,
                max: 999,
                inputMode: 'numeric',
                style: {
                  textAlign: 'center',
                  padding: '6px 8px',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  fontWeight: 500,
                  MozAppearance: 'textfield',
                },
              }}
              sx={{
                width: { xs: 55, sm: 65 },
                '& .MuiOutlinedInput-root': {
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: 'divider',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '1px', // Keep border thin
                  },
                },
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />
          </Box>
        </Box>

        {/* Validation Error Alert */}
        {(validationError || error) && (
          <Box sx={{ px: { xs: 2, sm: 3 }, pb: 1 }}>
            <Alert 
              severity="error" 
              sx={{ 
                fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
                '& .MuiAlert-message': {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              {validationError || error}
            </Alert>
          </Box>
        )}

        {/* Team Names Input Area - Expandable/Scrollable */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 1, sm: 2 },
            pt: (validationError || error) ? 0 : 0, // Adjust top padding based on error display
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(0,0,0,0.4)',
              },
            },
          }}
        >
            {teams.map((team, index) => {
              const hasContent = team.value.trim() !== '';
              const showNumber = hasContent; // Only show numbers when there's actual content
              const displayNumber = index + 1;
              const canDelete = teams.length > 1; // Can delete any team as long as it's not the last input field

              return (
                <Box
                  key={team.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minHeight: 40,
                  }}
                >
                  {/* Team Number */}
                  <TeamNumber number={displayNumber} show={showNumber} />
                  
                  {/* Team Name Input */}
                  <TextField
                    inputRef={(input) => {
                      if (input) {
                        inputRefs.current.set(team.id, input);
                      } else {
                        inputRefs.current.delete(team.id);
                      }
                    }}
                    value={team.value}
                    onChange={(e) => handleInputChange(team.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(team.id, e)}
                    placeholder={getPlaceholderText(index)}
                    variant="outlined"
                    size="small"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          border: 'none'
                        },
                        '&:hover fieldset': {
                          border: 'none'
                        },
                        '&.Mui-focused fieldset': {
                          border: 'none'
                        },
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                      }
                    }}
                    aria-label={`Team ${displayNumber} name input`}
                    autoComplete="off"
                  />
                  
                  {/* Delete Button */}
                  <IconButton
                    size="small"
                    onClick={() => removeTeam(team.id)}
                    disabled={!canDelete}
                    sx={{
                      opacity: hasContent && canDelete ? 0.7 : 0,
                      transition: 'opacity 0.2s ease',
                      color: 'error.main',
                      flexShrink: 0,
                      '&:hover': {
                        opacity: hasContent && canDelete ? 1 : 0,
                        bgcolor: 'error.main',
                        color: 'error.contrastText'
                      },
                      '&.Mui-disabled': {
                        opacity: 0
                      }
                    }}
                    aria-label={`Remove team ${displayNumber}`}
                    title={`Remove team ${displayNumber}`}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
        </Box>

        {/* Bottom Row - Action Buttons Only */}
        <Box
          sx={{
            flexShrink: 0,
            p: { xs: 1, sm: 2 }, // RTG padding pattern
            pt: 'clamp(0.25rem, 1vw, 0.75rem)', // RTG top padding
          }}
        >
          {/* Action Buttons Row - RTG Pattern */}
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative', // For absolute positioning of clear button
            }}
          >
            {/* Start Game Button - Center (RTG style) */}
            <Button
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <StartIcon />}
              onClick={handleStartGame}
              disabled={isLoading}
              sx={{ 
                px: { xs: 4, sm: 6 },
                py: { xs: 1.5, sm: 1.25 },
                fontSize: 'clamp(0.8rem, 1.2vw, 0.875rem)', // RTG button text sizing
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
              aria-label={isLoading ? 'Processing, please wait' : getButtonText()}
              title={isLoading ? 'Processing...' : getButtonText()}
            >
              {getButtonText()}
            </Button>

            {/* Clear All Button - Right (RTG style) */}
            <IconButton
              onClick={() => setClearDialogOpen(true)}
              sx={{ 
                position: 'absolute',
                right: 0,
                bgcolor: 'error.main',
                color: 'error.contrastText',
                '&:hover': {
                  bgcolor: 'error.dark',
                  transform: 'scale(1.1)',
                  transition: 'all 0.2s ease-in-out'
                },
                '&:active': {
                  transform: 'scale(1)',
                }
              }}
              aria-label="Clear all data"
              title="Clear all Points Counter data"
            >
              <ClearIcon />
            </IconButton>
          </Box>
        </Box>
        </Box>
      </Box>
    </Box>

    {/* Clear Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontWeight: 600,
            color: 'error.main',
          }}
        >
          Clear All Data?
        </DialogTitle>
        
        <DialogContent>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              lineHeight: 1.6,
            }}
          >
            This will permanently delete all Points Counter data including saved teams, game states, and settings. This action cannot be undone.
          </Typography>
        </DialogContent>
        
        <DialogActions
          sx={{
            justifyContent: 'center',
            gap: 2,
            p: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setClearDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleClearAll}
            startIcon={<ClearIcon />}
          >
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 