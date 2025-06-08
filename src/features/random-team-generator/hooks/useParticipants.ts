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
 * LocalStorage key for saving participant data
 */
const STORAGE_KEY = 'quizzard-random-team-generator-participants';

/**
 * Interface for stored participant data
 */
interface StoredParticipantData {
  participants: ParticipantInput[];
  nextId: number;
}

/**
 * Loads participant data from localStorage
 * Returns default state if no data exists or data is corrupted
 */
const loadParticipantsFromStorage = (): StoredParticipantData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: StoredParticipantData = JSON.parse(stored);
      
      // Validate the data structure
      if (data.participants && Array.isArray(data.participants) && 
          typeof data.nextId === 'number' && data.participants.length > 0) {
        
        // Ensure we have at least one empty input for user interaction
        const hasEmptyInput = data.participants.some(p => p.value.trim() === '');
        if (!hasEmptyInput) {
          data.participants.push({ id: data.nextId, value: '' });
          data.nextId += 1;
        }
        
        return data;
      }
    }
  } catch (error) {
    console.warn('Error loading participants from localStorage:', error);
  }
  
  // Return default state if loading fails
  return {
    participants: [{ id: 1, value: '' }],
    nextId: 2
  };
};

/**
 * Saves participant data to localStorage
 * Filters out completely empty participants except for one empty input
 */
const saveParticipantsToStorage = (participants: ParticipantInput[], nextId: number): void => {
  try {
    // Filter participants to only save non-empty ones + one empty for UX
    const nonEmpty = participants.filter(p => p.value.trim() !== '');
    const oneEmpty = participants.filter(p => p.value.trim() === '').slice(0, 1);
    const participantsToSave = [...nonEmpty, ...oneEmpty];
    
    const dataToSave: StoredParticipantData = {
      participants: participantsToSave,
      nextId
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.warn('Error saving participants to localStorage:', error);
  }
};

/**
 * Clears participant data from localStorage
 */
const clearParticipantsFromStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Error clearing participants from localStorage:', error);
  }
};

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
  // Load initial state from localStorage
  const initialData = loadParticipantsFromStorage();
  
  // State management
  const [participants, setParticipants] = useState<ParticipantInput[]>(initialData.participants);
  const [nextId, setNextId] = useState(initialData.nextId);
  
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
   * Also clears localStorage data
   */
  const clearAllParticipants = useCallback(() => {
    setParticipants([{ id: 1, value: '' }]);
    setNextId(2);
    clearParticipantsFromStorage();
  }, []);

  /**
   * Effect to save participant data to localStorage whenever state changes
   * Debounced to avoid excessive writes during fast typing
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      saveParticipantsToStorage(participants, nextId);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [participants, nextId]);

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