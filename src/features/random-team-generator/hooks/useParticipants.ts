/**
 * useParticipants Hook
 * 
 * Custom hook for managing participant state in the Random Team Generator.
 * Handles participant input management, cheat codes, localStorage persistence, and validation.
 * 
 * FIXED (Dec 2025): Resolved localStorage persistence race condition issue:
 * - Removed auto-cleanup useEffect that was competing with auto-save
 * - Increased debounce to 1000ms for better stability
 * - Added localStorage verification for iOS compatibility
 * - Manual cleanup only occurs during explicit user actions
 * - Saves exact user state without aggressive filtering
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ParticipantInput } from '../types';
import { CONSTANTS } from '../types';
import { isCheatCode, generateFriendsParticipants, getNextIdAfterCheatCode } from '../utils/cheatCodes';
import { STORAGE_KEYS } from '../../../shared/utils/storageKeys';

/**
 * LocalStorage key for saving participant data
 * FIXED: Now uses centralized storage key system to prevent migration conflicts
 */
const STORAGE_KEY = STORAGE_KEYS.RTG_PARTICIPANTS;

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
 * 
 * FIXED: Improved validation and better handling of edge cases
 */
const loadParticipantsFromStorage = (): StoredParticipantData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: StoredParticipantData = JSON.parse(stored);
      
      // Validate the data structure
      if (data.participants && Array.isArray(data.participants) && 
          typeof data.nextId === 'number') {
        
        // Handle case where all participants are empty (valid state)
        if (data.participants.length === 0) {
          return {
            participants: [{ id: data.nextId, value: '' }],
            nextId: data.nextId + 1
          };
        }
        
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

// REMOVED: saveParticipantsToStorage function - no longer needed
// Auto-save now happens directly in useEffect with better error handling

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
   * 
   * FIXED: Added manual cleanup logic for better UX after explicit removal
   */
  const removeParticipant = useCallback((id: number) => {
    if (participants.length > 1) {
      setParticipants(prev => {
        const filtered = prev.filter(p => p.id !== id);
        
        // Manual cleanup: ensure we have exactly one empty input at the end
        const nonEmpty = filtered.filter(p => p.value.trim() !== '');
        const hasEmpty = filtered.some(p => p.value.trim() === '');
        
        if (hasEmpty) {
          // Keep existing structure if there's already an empty input
          return filtered;
        } else {
          // Add one empty input if none exists
          return [...nonEmpty, { id: nextId, value: '' }];
        }
      });
      
      // Update nextId if we added a new empty input
      const hasEmptyAfterRemoval = participants.filter(p => p.id !== id).some(p => p.value.trim() === '');
      if (!hasEmptyAfterRemoval) {
        setNextId(prev => prev + 1);
      }
    }
  }, [participants, nextId]);

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
   * 
   * FIXED: Removed race condition with auto-cleanup effect.
   * Now uses longer debounce (1000ms) and saves exact user state without aggressive filtering.
   * Only manual cleanup occurs during explicit user actions (remove button, clear all).
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const dataToSave: StoredParticipantData = {
          participants,
          nextId
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        
        // Verify save was successful (iOS safety check)
        const verification = localStorage.getItem(STORAGE_KEY);
        if (!verification) {
          console.warn('localStorage save verification failed - data may not persist on iOS');
        }
      } catch (error) {
        console.warn('Error saving participants to localStorage:', error);
        // App continues working even if localStorage fails
      }
    }, 1000); // Increased debounce to 1000ms for better stability
    
    return () => clearTimeout(timer);
  }, [participants, nextId]);

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