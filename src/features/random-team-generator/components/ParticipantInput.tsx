import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Chip, 
  Typography,
  Fade
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { type Participant } from '../types';
import { useTheme } from '@mui/material/styles';

interface ParticipantInputProps {
  participants: Participant[];
  onAddParticipant: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
  onUpdateParticipant: (id: string, name: string) => void;
}

interface NameInput {
  id: string;
  value: string;
  hasContent: boolean;
}

export default function ParticipantInput({
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant
}: ParticipantInputProps) {
  const [nameInputs, setNameInputs] = useState<NameInput[]>([]);
  const [autoRemoveTimeouts, setAutoRemoveTimeouts] = useState<Map<string, number>>(new Map());
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const theme = useTheme();

  // Cheat code list - "the followers"
  const friendNames = [
    "Simeon", "Iliyana", "George", "Viki", "Eli", "Asen", 
    "Lubomir", "Ralica", "Venci", "Slavi", "Djoni", "Apapa", 
    "Mitaka G", "Antonio", "Dinkata", "Raiko", "Tancheto"
  ];

  const clearAutoRemoveTimeout = useCallback((id: string) => {
    const timeout = autoRemoveTimeouts.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      setAutoRemoveTimeouts(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }
  }, [autoRemoveTimeouts]);

  const setAutoRemoveTimeout = useCallback((id: string, callback: () => void) => {
    clearAutoRemoveTimeout(id);
    const timeout = window.setTimeout(callback, 500);
    setAutoRemoveTimeouts(prev => new Map(prev).set(id, timeout));
  }, [clearAutoRemoveTimeout]);

  const addNameInput = useCallback((value = '', focus = false) => {
    const newInput: NameInput = {
      id: `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value,
      hasContent: value.trim().length > 0
    };

    setNameInputs(prev => [...prev, newInput]);

    if (focus) {
      setTimeout(() => {
        const inputElement = inputRefs.current.get(newInput.id);
        inputElement?.focus();
      }, 50);
    }

    return newInput.id;
  }, []);

  const activateCheatCode = useCallback(() => {
    // Clear existing inputs
    setNameInputs([]);
    
    // Clear all participants
    participants.forEach(p => onRemoveParticipant(p.id));

    // Add friend names
    setTimeout(() => {
      friendNames.forEach((name, index) => {
        setTimeout(() => {
          onAddParticipant(name);
        }, index * 50); // Stagger the additions slightly for smooth effect
      });

      // Add empty input at the end
      setTimeout(() => {
        addNameInput('', true);
      }, friendNames.length * 50 + 100);
    }, 100);
  }, [participants, onRemoveParticipant, onAddParticipant, addNameInput, friendNames]);

  // Initialize with one empty input
  useEffect(() => {
    if (nameInputs.length === 0) {
      addNameInput('', true);
    }
  }, [nameInputs.length, addNameInput]);

  // Sync with participants and ensure there's always an empty input at the end
  useEffect(() => {
    const participantInputs: NameInput[] = participants.map(p => ({
      id: p.id,
      value: p.name,
      hasContent: true
    }));

    // Check if we need an empty input at the end
    const hasEmptyInput = nameInputs.some(input => !input.hasContent);
    
    if (!hasEmptyInput || nameInputs.length === 0) {
      const emptyInputId = addNameInput('', false);
      participantInputs.push({
        id: emptyInputId,
        value: '',
        hasContent: false
      });
    } else {
      // Keep existing empty inputs
      const emptyInputs = nameInputs.filter(input => !input.hasContent);
      participantInputs.push(...emptyInputs);
    }

    setNameInputs(participantInputs);
  }, [participants]);

  const handleInputChange = useCallback((id: string, value: string) => {
    clearAutoRemoveTimeout(id);

    // Check for cheat code (but don't show hint)
    if (value.trim().toLowerCase() === "the followers") {
      activateCheatCode();
      return;
    }

    const isParticipant = participants.some(p => p.id === id);
    const hasContent = value.trim().length > 0;

    // Update local state immediately for smooth UX
    setNameInputs(prev => prev.map(input => 
      input.id === id 
        ? { ...input, value, hasContent }
        : input
    ));

    if (isParticipant) {
      // Update existing participant - allow any characters
      if (hasContent) {
        onUpdateParticipant(id, value.trim());
      } else {
        // Remove participant if value becomes empty
        onRemoveParticipant(id);
      }
    } else {
      // Handle new input - only create participant when user finishes typing
      if (hasContent) {
        // Don't auto-create participant on every keystroke
        // User should press Enter or move to next field manually
      } else {
        // Auto-remove empty inputs (except if it's the last one)
        const inputIndex = nameInputs.findIndex(input => input.id === id);
        const isLastInput = inputIndex === nameInputs.length - 1;
        
        if (!isLastInput && nameInputs.length > 1) {
          setAutoRemoveTimeout(id, () => {
            setNameInputs(prev => {
              const filtered = prev.filter(input => input.id !== id);
              
              // Focus next available input
              const nextInput = filtered[Math.min(inputIndex, filtered.length - 1)];
              if (nextInput) {
                setTimeout(() => {
                  const inputElement = inputRefs.current.get(nextInput.id);
                  inputElement?.focus();
                }, 50);
              }
              
              return filtered;
            });
          });
        }
      }
    }
  }, [
    clearAutoRemoveTimeout, 
    participants, 
    nameInputs, 
    activateCheatCode, 
    onUpdateParticipant, 
    onRemoveParticipant, 
    setAutoRemoveTimeout
  ]);

  const handleKeyDown = useCallback((id: string, event: React.KeyboardEvent) => {
    const currentIndex = nameInputs.findIndex(input => input.id === id);
    
    if (event.key === 'Enter') {
      event.preventDefault();
      const currentInput = nameInputs[currentIndex];
      
      // Only create participant when Enter is pressed
      if (currentInput?.value.trim()) {
        const isParticipant = participants.some(p => p.id === id);
        if (!isParticipant) {
          onAddParticipant(currentInput.value.trim());
        }
        
        // Move to next input or create new one
        const nextIndex = currentIndex + 1;
        if (nextIndex < nameInputs.length) {
          const nextInputElement = inputRefs.current.get(nameInputs[nextIndex].id);
          nextInputElement?.focus();
        } else {
          // Create new input and focus it
          addNameInput('', true);
        }
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (currentIndex > 0) {
        const prevInputElement = inputRefs.current.get(nameInputs[currentIndex - 1].id);
        prevInputElement?.focus();
        // Move cursor to end
        setTimeout(() => {
          if (prevInputElement) {
            prevInputElement.setSelectionRange(prevInputElement.value.length, prevInputElement.value.length);
          }
        }, 0);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (currentIndex < nameInputs.length - 1) {
        const nextInputElement = inputRefs.current.get(nameInputs[currentIndex + 1].id);
        nextInputElement?.focus();
        // Move cursor to end
        setTimeout(() => {
          if (nextInputElement) {
            nextInputElement.setSelectionRange(nextInputElement.value.length, nextInputElement.value.length);
          }
        }, 0);
      }
    }
  }, [nameInputs, addNameInput, participants, onAddParticipant]);

  const handleDelete = useCallback((id: string) => {
    const isParticipant = participants.some(p => p.id === id);
    
    if (isParticipant) {
      onRemoveParticipant(id);
    } else {
      // For empty inputs, just clear the value
      setNameInputs(prev => prev.map(input => 
        input.id === id 
          ? { ...input, value: '', hasContent: false }
          : input
      ));
    }
  }, [participants, onRemoveParticipant]);

  const getParticipantNumber = useCallback((id: string): number | null => {
    const participant = participants.find(p => p.id === id);
    return participant?.number || null;
  }, [participants]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'text',
        overflow: 'auto', // Make the entire component scrollable
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          borderRadius: '3px',
          '&:hover': {
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          },
        },
      }}
      onClick={(e) => {
        // Focus last input when clicking on empty area
        if (e.target === e.currentTarget) {
          const lastInput = nameInputs[nameInputs.length - 1];
          if (lastInput) {
            const inputElement = inputRefs.current.get(lastInput.id);
            inputElement?.focus();
          }
        }
      }}
    >
      {/* Content - Now takes full height */}
      <Box sx={{ 
        flex: 1,
        p: 2,
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1
        }}>
          {nameInputs.map((input) => {
            const participantNumber = getParticipantNumber(input.id);
            
            return (
              <Fade key={input.id} in timeout={300}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1,
                    px: 1.5,
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      transform: 'translateX(4px)',
                    }
                  }}
                >
                  {/* Participant Number */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {participantNumber && (
                      <Chip
                        label={participantNumber}
                        size="small"
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '& .MuiChip-label': {
                            px: 0.5
                          }
                        }}
                      />
                    )}
                  </Box>

                  {/* Input Field */}
                  <TextField
                    inputRef={(el) => {
                      if (el) {
                        inputRefs.current.set(input.id, el);
                      } else {
                        inputRefs.current.delete(input.id);
                      }
                    }}
                    value={input.value}
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(input.id, e)}
                    placeholder="Enter name..."
                    variant="outlined"
                    size="medium"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'transparent',
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover fieldset': {
                          border: 'none',
                        },
                        '&.Mui-focused fieldset': {
                          border: 'none',
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: 'text.primary',
                      }
                    }}
                  />

                  {/* Delete Button */}
                  <Box sx={{ width: 40, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    {input.hasContent && (
                      <IconButton
                        onClick={() => handleDelete(input.id)}
                        size="small"
                        sx={{
                          width: 32,
                          height: 32,
                          color: 'text.secondary',
                          opacity: 0.7,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            opacity: 1,
                            color: 'error.main',
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(244, 67, 54, 0.1)' 
                              : 'rgba(244, 67, 54, 0.05)',
                            transform: 'scale(1.2)',
                          }
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Fade>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
} 