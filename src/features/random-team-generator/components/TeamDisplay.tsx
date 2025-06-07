import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Zoom,
  Slide,
  useTheme,
  useMediaQuery,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon,
  Shuffle as ShuffleIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { type Team } from '../types';
import { type TransitionProps } from '@mui/material/transitions';

interface TeamDisplayProps {
  open: boolean;
  teams: Team[];
  isGenerating: boolean;
  onClose: () => void;
  onShuffle: () => void;
  onCopy: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function TeamDisplay({
  open,
  teams,
  isGenerating,
  onClose,
  onShuffle,
  onCopy
}: TeamDisplayProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Transition}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default',
          backgroundImage: 'none',
          borderRadius: isMobile ? 0 : 4,
          maxHeight: isMobile ? '100vh' : '90vh',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
        },
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {isGenerating ? 'Generating Teams...' : 'Generated Teams'}
          </Typography>
          {!isGenerating && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {teams.length} teams • {teams.reduce((sum, team) => sum + team.members.length, 0)} participants
            </Typography>
          )}
        </Box>
        
        <IconButton 
          onClick={onClose}
          size="large"
          sx={{
            ml: 2,
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: 'text.primary',
              backgroundColor: 'action.hover',
              transform: 'scale(1.1)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'background.default',
          minHeight: '400px',
          display: 'flex',
          alignItems: isGenerating ? 'center' : 'flex-start',
          justifyContent: isGenerating ? 'center' : 'flex-start',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            '&:hover': {
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            },
          },
        }}
      >
        {isGenerating ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              gap: 3,
            }}
          >
            <CircularProgress 
              size={60} 
              thickness={4}
              sx={{
                color: 'primary.main',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }}
            />
            <Typography 
              variant="h6" 
              color="text.primary" 
              fontWeight={600}
              sx={{ 
                textAlign: 'center',
                opacity: 0.8
              }}
            >
              Creating perfect teams...
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(auto-fit, minmax(300px, 1fr))'
              },
              gap: { xs: 3, sm: 4 },
              width: '100%',
            }}
          >
            {teams.map((team, index) => (
              <Zoom
                key={team.id}
                in={!isGenerating}
                timeout={500 + index * 150}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    p: 4,
                    backgroundColor: 'background.paper',
                    borderRadius: 4,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 6,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      borderRadius: '16px 16px 0 0',
                    }
                  }}
                >
                  {/* Team Header */}
                  <Box sx={{ mb: 3, pt: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        textAlign: 'center',
                        mb: 2
                      }}
                    >
                      {team.name}
                    </Typography>
                    
                    <Divider sx={{ 
                      opacity: 0.4,
                      background: `linear-gradient(90deg, transparent, ${theme.palette.text.secondary}, transparent)`,
                    }} />
                  </Box>

                  {/* Team Members */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      minHeight: 140,
                      mb: 3,
                    }}
                  >
                    {team.members.map((member, memberIndex) => (
                      <Zoom
                        key={member.id}
                        in={!isGenerating}
                        timeout={700 + memberIndex * 150}
                        style={{ transitionDelay: `${(index * 100) + (memberIndex * 80)}ms` }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.02)',
                            borderRadius: 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${theme.palette.divider}`,
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.08)' 
                                : 'rgba(0, 0, 0, 0.04)',
                              transform: 'translateX(8px) scale(1.02)',
                              boxShadow: `0 4px 16px ${theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(0, 0, 0, 0.1)'}`,
                            }
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              textAlign: 'center',
                            }}
                          >
                            {member.name}
                          </Typography>
                        </Box>
                      </Zoom>
                    ))}
                  </Box>

                  {/* Team Member Count */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      label={`${team.members.length} member${team.members.length !== 1 ? 's' : ''}`}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        px: 1,
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Zoom>
            ))}
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      {!isGenerating && teams.length > 0 && (
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            gap: 2
          }}
        >
          <Button
            onClick={onShuffle}
            startIcon={<ShuffleIcon />}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderWidth: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            Shuffle Again
          </Button>
          
          <Button
            onClick={onCopy}
            startIcon={<CopyIcon />}
            variant="contained"
            size="large"
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            Copy Teams
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
} 