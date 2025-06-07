/**
 * useParticipants Hook
 * 
 * Custom hook for managing participant state in the Random Team Generator.
 * Handles participant input management, cheat codes, auto-cleanup, and validation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ParticipantInput } from '../types';
import { CONSTANTS } from '../types';
import { isCheatCode, generateFriendsParticipants, getNextIdAfterCheatCode } from '../utils/cheatCodes';

/**
 * Hook return type defining all participant-related state and functions
 */
interface UseParticipantsReturn {
  /** Array of current participant inputs */
  participants: ParticipantInput[];
  /** Next available ID for new participants */
  nextId: number;
  /** Map of input element references for focus management */
  inputRefs: React.MutableRefObject<Map<number, HTMLInputElement>>;
  /** Handle input value changes */
  handleInputChange: (id: number, value: string) => { isCheatCode: boolean };
  /** Handle participant removal */
  removeParticipant: (id: number) => void;
  /** Get array of participant names (non-empty values) */
  getParticipantNames: () => string[];
  /** Get count of filled participants for numbering */
  getFilledParticipantCount: () => number;
  /** Clear all participants */
  clearAllParticipants: () => void;
}

/**
 * Custom hook for managing participant state and operations
 * 
 * @returns Object containing participant state and management functions
 */
export const useParticipants = (): UseParticipantsReturn => {
  // State management
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { id: 1, value: '' }
  ]);
  const [nextId, setNextId] = useState(2);
  
  // Ref for managing input focus
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  /**
   * Handles input value changes with cheat code detection
   * Manages auto-creation of new inputs and cheat code processing
   */
  const handleInputChange = useCallback((id: number, value: string): { isCheatCode: boolean } => {
    // Check for cheat code FIRST before updating state
    if (isCheatCode(value)) {
      const friendParticipants = generateFriendsParticipants(1);
      setParticipants(friendParticipants);
      setNextId(getNextIdAfterCheatCode(1));
      return { isCheatCode: true };
    }
    
    // Update participant value
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, value } : p));
    
    // Auto-create new input if typing in the last field and it's not empty
    const isLastInput = participants[participants.length - 1]?.id === id;
    if (isLastInput && value.trim() && participants.length < CONSTANTS.MAX_PARTICIPANTS) {
      setParticipants(prev => [...prev, { id: nextId, value: '' }]);
      setNextId(prev => prev + 1);
    }

    return { isCheatCode: false };
  }, [participants, nextId]);

  /**
   * Removes a participant by ID
   * Ensures at least one input always remains
   */
  const removeParticipant = useCallback((id: number) => {
    if (participants.length > 1) {
      setParticipants(prev => prev.filter(p => p.id !== id));
    }
  }, [participants.length]);

  /**
   * Gets array of non-empty participant names
   * Used for team generation and validation
   */
  const getParticipantNames = useCallback((): string[] => {
    return participants
      .map(p => p.value.trim())
      .filter(name => name !== '');
  }, [participants]);

  /**
   * Gets count of participants with content for numbering display
   */
  const getFilledParticipantCount = useCallback((): number => {
    return participants.filter(p => p.value.trim() !== '').length;
  }, [participants]);

  /**
   * Clears all participants and resets to initial state
   */
  const clearAllParticipants = useCallback(() => {
    setParticipants([{ id: 1, value: '' }]);
    setNextId(2);
  }, []);

  /**
   * Auto-cleanup effect: removes empty inputs except the last one
   * Runs with a delay to avoid removing inputs while user is typing
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setParticipants(prev => {
        const nonEmpty = prev.filter(p => p.value.trim() !== '');
        const lastEmpty = prev.filter(p => p.value.trim() === '').slice(-1);
        return [...nonEmpty, ...lastEmpty].slice(0, CONSTANTS.MAX_PARTICIPANTS);
      });
    }, CONSTANTS.AUTO_REMOVE_TIMEOUT);
    
    return () => clearTimeout(timer);
  }, [participants]);

  return {
    participants,
    nextId,
    inputRefs,
    handleInputChange,
    removeParticipant,
    getParticipantNames,
    getFilledParticipantCount,
    clearAllParticipants
  };
}; 