import { 
  Box, 
  TextField,
  Button,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Shuffle as ShuffleIcon,
  Clear as ClearIcon,
  Add as AddIcon, 
  Remove as RemoveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';
import { TeamGenerator } from '../utils/teamGenerator';

interface ParticipantInput {
  id: number;
  value: string;
}

interface Team {
  id: string;
  name: string;
  members: { id: string; name: string }[];
}

export default function RandomTeamGenerator() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  
  // Local state management
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { id: 1, value: '' }
  ]);
  const [nextId, setNextId] = useState(2);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamCount, setTeamCount] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  
  // Auto-create new input when typing in last field
  const handleInputChange = (id: number, value: string) => {
    // Check for cheat code FIRST before updating state
    if (value.toLowerCase().trim() === 'the followers') {
      const friendNames = [
        "Simeon",
        "Iliyana", 
        "George",
        "Viki",
        "Eli",
        "Asen",
        "Lubomir",
        "Ralica",
        "Venci",
        "Slavi",
        "Djoni",
        "Apapa",
        "Mitaka G",
        "Antonio",
        "Dinkata",
        "Raiko",
        "Tancheto"
      ];
      
      // Replace all participants with friend names
      const newParticipants = friendNames.map((name, index) => ({
        id: index + 1,
        value: name
      }));
      
      // Add one more empty input at the end
      newParticipants.push({ id: friendNames.length + 1, value: '' });
      
      setParticipants(newParticipants);
      setNextId(friendNames.length + 2);
      
      showSnackbar('🎉 The followers have joined!', 'success');
      return;
    }
    
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, value } : p));
    
    // If typing in the last input and it's not empty, add a new input
    const isLastInput = participants[participants.length - 1]?.id === id;
    if (isLastInput && value.trim() && participants.length < 50) {
      setParticipants(prev => [...prev, { id: nextId, value: '' }]);
      setNextId(prev => prev + 1);
    }
  };
  
  // Handle key navigation
  const handleKeyDown = (id: number, e: React.KeyboardEvent) => {
    const currentIndex = participants.findIndex(p => p.id === id);
    
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next input or create new one
      if (currentIndex < participants.length - 1) {
        const nextInput = inputRefs.current.get(participants[currentIndex + 1].id);
        nextInput?.focus();
      } else if (participants.length < 50) {
        // Create new input and focus it
        const newId = nextId;
        setParticipants(prev => [...prev, { id: newId, value: '' }]);
        setNextId(prev => prev + 1);
        setTimeout(() => {
          const newInput = inputRefs.current.get(newId);
          newInput?.focus();
        }, 10);
      }
    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      const prevInput = inputRefs.current.get(participants[currentIndex - 1].id);
      prevInput?.focus();
    } else if (e.key === 'ArrowDown' && currentIndex < participants.length - 1) {
      e.preventDefault();
      const nextInput = inputRefs.current.get(participants[currentIndex + 1].id);
      nextInput?.focus();
    }
  };
  
  // Remove participant
  const removeParticipant = (id: number) => {
    if (participants.length > 1) {
      setParticipants(prev => prev.filter(p => p.id !== id));
    }
  };
  
  // Auto-remove empty inputs (except the last one)
  useEffect(() => {
    const timer = setTimeout(() => {
      setParticipants(prev => {
        const nonEmpty = prev.filter(p => p.value.trim() !== '');
        const lastEmpty = prev.filter(p => p.value.trim() === '').slice(-1);
        return [...nonEmpty, ...lastEmpty].slice(0, 50);
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [participants]);

  // Get participant names for team generation
  const getParticipantNames = () => {
    return participants
      .map(p => p.value.trim())
      .filter(name => name !== '');
  };

  // Generate teams function
  const generateTeamsInternal = () => {
    const names = getParticipantNames();
    
    try {
      setIsGenerating(true);
      
      // Convert names to participants format for TeamGenerator
      const participantsForGenerator = names.map((name, index) => ({
        id: `participant-${index}`,
        name,
        number: index + 1
      }));
      
      // Use TeamGenerator directly
      const generatedTeams = TeamGenerator.generateTeams(participantsForGenerator, teamCount);
      
      // Convert to our Team format
      const formattedTeams: Team[] = generatedTeams.map((team, index) => ({
        id: `team-${index}`,
        name: `Team ${index + 1}`,
        members: team.members.map(member => ({
          id: member.id,
          name: member.name
        }))
      }));
      
      setTeams(formattedTeams);
      setIsGenerating(false);
      return formattedTeams;
      
    } catch (error) {
      console.error('Error generating teams:', error);
      setIsGenerating(false);
      showSnackbar('Error generating teams. Please try again.', 'error');
      return [];
    }
  };

  const handleGenerateTeams = async () => {
    const names = getParticipantNames();
    if (names.length < teamCount) {
      showSnackbar(`You need at least ${teamCount} participants to create ${teamCount} teams.`, 'warning');
      return;
    }
    
    if (names.length < 2) {
      showSnackbar('You need at least 2 participants to generate teams.', 'warning');
      return;
    }
    
    const generatedTeams = generateTeamsInternal();
    if (generatedTeams.length > 0) {
      setTeamsModalOpen(true);
      showSnackbar(`Generated ${generatedTeams.length} teams successfully!`, 'success');
    }
  };

  // Refresh teams with animation
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefreshTeams = () => {
    setIsRefreshing(true);
    
    // Add a small delay for the animation effect
    setTimeout(() => {
      const generatedTeams = generateTeamsInternal();
      if (generatedTeams.length > 0) {
        showSnackbar('Teams refreshed!', 'success');
      }
      setIsRefreshing(false);
    }, 300);
  };

  // Copy teams to clipboard with nice formatting
  const handleCopyTeams = async () => {
    if (teams.length === 0) return;

    try {
      let formattedText = '🎯 **TEAM GENERATOR RESULTS** 🎯\n\n';
      
      teams.forEach((team, index) => {
        formattedText += `🏆 **${team.name}**\n`;
        team.members.forEach((member, memberIndex) => {
          formattedText += `   ${memberIndex + 1}. ${member.name}\n`;
        });
        if (index < teams.length - 1) {
          formattedText += '\n';
        }
      });
      
      formattedText += '\n✨ Generated with Quizzard Team Generator ✨';
      
      await navigator.clipboard.writeText(formattedText);
      showSnackbar('Teams copied to clipboard! 📋', 'success');
    } catch (error) {
      showSnackbar('Failed to copy teams', 'error');
    }
  };

  const handleClearAll = () => {
    const participantCount = getParticipantNames().length;
    if (participantCount === 0) {
      showSnackbar('No participants to clear.', 'info');
      return;
    }
    setClearDialogOpen(true);
  };

  const confirmClearAll = () => {
    // Clear everything
    setParticipants([{ id: 1, value: '' }]);
    setNextId(2);
    setTeams([]);
    
    // Close dialog FIRST
    setClearDialogOpen(false);
    
    // Then show message
    setTimeout(() => {
      showSnackbar('All participants cleared.', 'success');
    }, 100);
  };

  const cancelClear = () => {
    setClearDialogOpen(false);
  };

  // Calculate team distribution message
  const getTeamDistributionMessage = () => {
    const participantCount = getParticipantNames().length;
    if (participantCount === 0) return '';
    
    const membersPerTeam = Math.floor(participantCount / teamCount);
    const extraMembers = participantCount % teamCount;
    
    if (extraMembers === 0) {
      return `Your ${teamCount} teams will have ${membersPerTeam} members each.`;
    } else {
      return `Your ${teamCount} teams will have ${membersPerTeam}-${membersPerTeam + 1} members each.`;
    }
  };

  // Get filled participant count for numbering
  const getFilledParticipantCount = () => {
    return participants.filter(p => p.value.trim() !== '').length;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* Main Content - Constrained width like original */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        py: 3,
        px: { xs: 1, sm: 2 }
      }}>
        {/* Content Container with Original Width Constraints */}
        <Box sx={{ 
          width: '100%',
          maxWidth: { 
            xs: 'calc(100vw - 16px)', 
            sm: 'clamp(280px, 50vw, 600px)' // Same as original --main-content-width
          },
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {/* Input Section - Fixed max height with internal scroll */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            maxHeight: { xs: '50vh', sm: '55vh' }, // Fixed max height
            minHeight: { xs: '40vh', sm: '45vh' }, // Minimum height
            bgcolor: 'background.paper',
            borderRadius: 3,
            elevation: 4,
            boxShadow: (theme) => theme.shadows[4],
            overflow: 'hidden'
          }}>
            {/* Header - Now single line with hint and clear button */}
            <Box sx={{ 
              p: { xs: 2, sm: 3 },
              pb: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography 
                variant="h6" 
                fontWeight={600}
                color="text.primary"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, flex: 1 }}
              >
                Participants{' '}
                <Typography 
                  component="span"
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 400
                  }}
                >
                  (Add your names - each on a new line)
                </Typography>
              </Typography>
              
              {/* Clear All Button - Only show when there are names */}
              {getParticipantNames().length > 0 && (
                <Button
                  onClick={handleClearAll}
                  size="small"
                  variant="contained"
                  sx={{
                    ml: 1,
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    bgcolor: 'secondary.main',
                    color: 'secondary.contrastText',
                    boxShadow: (theme) => theme.shadows[1],
                    '&:hover': {
                      bgcolor: 'secondary.dark',
                      boxShadow: (theme) => theme.shadows[2]
                    }
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>
            
            {/* Participant List - Scrollable with fixed max height */}
            <Box sx={{ 
              flex: 1,
              p: { xs: 1, sm: 2 },
              overflowY: 'auto', // Always scrollable
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              // Enhanced scrollbar styling
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                '&:hover': {
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                },
              },
            }}>
              {participants.map((participant, index) => {
                const filledCount = getFilledParticipantCount();
                const showNumber = participant.value.trim() !== '' || index < filledCount;
                const displayNumber = participant.value.trim() !== '' ? index + 1 : filledCount + 1;
                
                return (
                                      <Box key={participant.id} sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                    {/* Participant Number - Only show when needed */}
                    <Box sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: showNumber ? 'primary.main' : 'transparent',
                      color: showNumber ? 'primary.contrastText' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}>
                      {showNumber ? displayNumber : ''}
                    </Box>
                    
                    {/* Input Field */}
                    <TextField
                      inputRef={(el) => {
                        if (el) {
                          inputRefs.current.set(participant.id, el);
                        }
                      }}
                      value={participant.value}
                      onChange={(e) => handleInputChange(participant.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(participant.id, e)}
                      placeholder="Enter name..."
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
                          borderRadius: 1
                        }
                      }}
                    />
                    
                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      onClick={() => removeParticipant(participant.id)}
                      disabled={participants.length === 1}
                      sx={{
                        opacity: participant.value.trim() ? 0.7 : 0,
                        transition: 'opacity 0.2s ease',
                        color: 'error.main',
                        flexShrink: 0,
                        '&:hover': {
                          opacity: participant.value.trim() ? 1 : 0,
                          bgcolor: 'error.main',
                          color: 'error.contrastText'
                        },
                        '&.Mui-disabled': {
                          opacity: 0
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Controls Section */}
          <Box sx={{ 
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: (theme) => theme.shadows[4],
            p: { xs: 2, sm: 3 }
          }}>
            {/* Team Count Controls */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}>
              <IconButton
                onClick={() => setTeamCount(Math.max(2, teamCount - 1))}
                disabled={teamCount <= 2}
                sx={{ 
                  bgcolor: 'background.default',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <RemoveIcon />
              </IconButton>
              
              <Typography 
                variant="h6" 
                fontWeight={600}
                sx={{ 
                  minWidth: { xs: 120, sm: 140 },
                  textAlign: 'center',
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                {teamCount} Teams
              </Typography>
              
              <IconButton
                onClick={() => setTeamCount(Math.min(10, teamCount + 1))}
                disabled={teamCount >= 10}
                sx={{ 
                  bgcolor: 'background.default',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {/* Distribution Message */}
            {getTeamDistributionMessage() && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                textAlign="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                {getTeamDistributionMessage()}
              </Typography>
            )}

            {/* Generate Teams Button - Centered */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center'
            }}>
              <Button
                variant="contained"
                startIcon={<ShuffleIcon />}
                onClick={handleGenerateTeams}
                disabled={isGenerating || getParticipantNames().length < teamCount}
                sx={{ 
                  px: { xs: 4, sm: 6 },
                  py: { xs: 1.5, sm: 1.25 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  borderRadius: 2,
                  boxShadow: (theme) => theme.shadows[2],
                  '&:hover': {
                    boxShadow: (theme) => theme.shadows[4],
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out'
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  }
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate Teams'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Teams Modal */}
      <Dialog
        open={teamsModalOpen}
        onClose={() => setTeamsModalOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '80vh',
            m: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" fontWeight={600}>
            Your Teams
          </Typography>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleRefreshTeams}
              disabled={isGenerating || isRefreshing}
              sx={{ 
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease-in-out'
              }}
              title="Refresh Teams"
            >
              <RefreshIcon />
            </IconButton>
            
            <IconButton
              onClick={handleCopyTeams}
              sx={{ 
                color: 'success.main',
                '&:hover': { bgcolor: 'success.main', color: 'success.contrastText' }
              }}
              title="Copy Teams"
            >
              <CopyIcon />
            </IconButton>
            
            <IconButton
              onClick={() => setTeamsModalOpen(false)}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' }
              }}
              title="Close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
                 <DialogContent sx={{ pt: 1 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(auto-fit, minmax(200px, 1fr))' 
            },
            gap: 2,
            opacity: isRefreshing ? 0.5 : 1,
            transform: isRefreshing ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.3s ease-in-out'
          }}>
            {teams.map((team) => (
              <Box
                key={team.id}
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  boxShadow: (theme) => theme.shadows[2],
                  '&:hover': {
                    boxShadow: (theme) => theme.shadows[4],
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="primary.main"
                  sx={{ mb: 1 }}
                >
                  🏆 {team.name}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {team.members.map((member, index) => (
                    <Typography
                      key={member.id}
                      variant="body2"
                      color="text.primary"
                    >
                      {index + 1}. {member.name}
                    </Typography>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={cancelClear}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Clear All Participants?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all {getParticipantNames().length} participants?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelClear}>Cancel</Button>
          <Button onClick={confirmClearAll} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={hideSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 