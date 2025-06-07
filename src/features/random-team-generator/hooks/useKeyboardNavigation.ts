/**
 * useKeyboardNavigation Hook
 * 
 * Custom hook for managing keyboard navigation between participant inputs.
 * Handles Enter, Arrow Up, and Arrow Down key navigation with focus management.
 */

import { useCallback } from 'react';
import type { ParticipantInput } from '../types';
import { CONSTANTS } from '../types';

/**
 * Hook return type defining keyboard navigation functions
 */
interface UseKeyboardNavigationReturn {
  /** Handle keyboard events for navigation */
  handleKeyDown: (id: number, e: React.KeyboardEvent) => void;
}

/**
 * Props for the useKeyboardNavigation hook
 */
interface UseKeyboardNavigationProps {
  /** Array of current participants */
  participants: ParticipantInput[];
  /** Next available ID for new participants */
  nextId: number;
  /** Map of input element references */
  inputRefs: React.MutableRefObject<Map<number, HTMLInputElement>>;
  /** Function to add new participant */
  onAddParticipant: () => void;
}

/**
 * Custom hook for managing keyboard navigation between input fields
 * 
 * @param props - Configuration object with participants and refs
 * @returns Object containing keyboard navigation handlers
 */
export const useKeyboardNavigation = ({
  participants,
  nextId,
  inputRefs,
  onAddParticipant
}: UseKeyboardNavigationProps): UseKeyboardNavigationReturn => {

  /**
   * Focuses an input element by participant ID
   */
  const focusInput = useCallback((id: number) => {
    const input = inputRefs.current.get(id);
    input?.focus();
  }, [inputRefs]);

  /**
   * Handles Enter key navigation
   * Moves to next input or creates new one if at the end
   */
  const handleEnterKey = useCallback((currentId: number) => {
    const currentIndex = participants.findIndex(p => p.id === currentId);
    
    if (currentIndex < participants.length - 1) {
      // Move to next existing input
      const nextParticipant = participants[currentIndex + 1];
      focusInput(nextParticipant.id);
    } else if (participants.length < CONSTANTS.MAX_PARTICIPANTS) {
      // Create new input and focus it
      onAddParticipant();
      
      // Focus the new input after it's created
      setTimeout(() => {
        focusInput(nextId);
      }, 10);
    }
  }, [participants, nextId, focusInput, onAddParticipant]);

  /**
   * Handles Arrow Up key navigation
   * Moves to previous input if available
   */
  const handleArrowUp = useCallback((currentId: number) => {
    const currentIndex = participants.findIndex(p => p.id === currentId);
    
    if (currentIndex > 0) {
      const prevParticipant = participants[currentIndex - 1];
      focusInput(prevParticipant.id);
    }
  }, [participants, focusInput]);

  /**
   * Handles Arrow Down key navigation
   * Moves to next input if available
   */
  const handleArrowDown = useCallback((currentId: number) => {
    const currentIndex = participants.findIndex(p => p.id === currentId);
    
    if (currentIndex < participants.length - 1) {
      const nextParticipant = participants[currentIndex + 1];
      focusInput(nextParticipant.id);
    }
  }, [participants, focusInput]);

  /**
   * Main keyboard event handler
   * Routes different key events to appropriate handlers
   */
  const handleKeyDown = useCallback((id: number, e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleEnterKey(id);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        handleArrowUp(id);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        handleArrowDown(id);
        break;
        
      default:
        // Let other keys pass through normally
        break;
    }
  }, [handleEnterKey, handleArrowUp, handleArrowDown]);

  return {
    handleKeyDown
  };
}; 