import { useState, useCallback } from 'react';
import { type Participant, type TeamGeneratorState } from '../types';
import { TeamGenerator } from '../utils/teamGenerator';
import { InputValidator } from '../utils/inputValidator';

interface UseTeamGeneratorProps {
  onShowMessage?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const useTeamGenerator = (props?: UseTeamGeneratorProps) => {
  const [state, setState] = useState<TeamGeneratorState>({
    participants: [],
    teams: [],
    teamCount: 2,
    isGenerating: false,
    showResults: false
  });

  const showMessage = props?.onShowMessage || (() => {});

  const addParticipant = useCallback((name: string) => {
    if (!InputValidator.validateParticipantName(name)) {
      showMessage('Please enter a valid name (1-50 characters)', 'error');
      return;
    }

    setState(prev => {
      const newParticipant: Participant = {
        id: `participant-${Date.now()}-${prev.participants.length}`,
        name: name.trim(),
        number: prev.participants.length + 1
      };

      return {
        ...prev,
        participants: [...prev.participants, newParticipant]
      };
    });
  }, [showMessage]);

  const removeParticipant = useCallback((id: string) => {
    setState(prev => {
      const filteredParticipants = prev.participants.filter(p => p.id !== id);
      // Renumber participants
      const renumberedParticipants = filteredParticipants.map((p, index) => ({
        ...p,
        number: index + 1
      }));

      return {
        ...prev,
        participants: renumberedParticipants
      };
    });
  }, []);

  const updateParticipant = useCallback((id: string, name: string) => {
    if (!InputValidator.validateParticipantName(name)) {
      return;
    }

    setState(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === id ? { ...p, name: name.trim() } : p
      )
    }));
  }, []);

  const setTeamCount = useCallback((count: number) => {
    const validCount = Math.max(2, Math.min(count, 20)); // Limit between 2-20 teams
    setState(prev => ({
      ...prev,
      teamCount: validCount
    }));
  }, []);

  const generateTeams = useCallback(() => {
    const validation = InputValidator.validateTeamCreation(state.participants, state.teamCount);
    
    if (!validation.isValid) {
      showMessage(validation.message || 'Invalid input', 'error');
      return;
    }

    // Check for duplicates
    if (InputValidator.hasDuplicateNames(state.participants)) {
      const duplicates = InputValidator.getDuplicateNames(state.participants);
      showMessage(`Duplicate names found: ${duplicates.join(', ')}`, 'warning');
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));

    // Add a small delay for better UX
    setTimeout(() => {
      const teams = TeamGenerator.generateTeams(state.participants, state.teamCount);
      
      setState(prev => ({
        ...prev,
        teams,
        isGenerating: false,
        showResults: true
      }));

      showMessage(`Generated ${teams.length} teams successfully!`, 'success');
    }, 500);
  }, [state.participants, state.teamCount, showMessage]);

  const shuffleTeams = useCallback(() => {
    if (state.teams.length === 0) return;

    setState(prev => ({ ...prev, isGenerating: true }));

    setTimeout(() => {
      const shuffledTeams = TeamGenerator.shuffleTeams(state.teams);
      
      setState(prev => ({
        ...prev,
        teams: shuffledTeams,
        isGenerating: false
      }));

      showMessage('Teams shuffled!', 'success');
    }, 300);
  }, [state.teams, showMessage]);

  const copyTeamsToClipboard = useCallback(async () => {
    if (state.teams.length === 0) return;

    try {
      const formattedTeams = TeamGenerator.formatTeamsForClipboard(state.teams);
      await navigator.clipboard.writeText(formattedTeams);
      showMessage('Teams copied to clipboard!', 'success');
    } catch (error) {
      showMessage('Failed to copy teams', 'error');
    }
  }, [state.teams, showMessage]);

  const closeResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      showResults: false
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState({
      participants: [],
      teams: [],
      teamCount: 2,
      isGenerating: false,
      showResults: false
    });
    showMessage('All participants cleared', 'info');
  }, [showMessage]);

  return {
    ...state,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setTeamCount,
    generateTeams,
    shuffleTeams,
    copyTeamsToClipboard,
    closeResults,
    clearAll
  };
}; 