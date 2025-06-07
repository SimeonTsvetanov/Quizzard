/**
 * Cheat Code Utilities for Random Team Generator
 * 
 * This file handles all cheat code functionality, specifically the "the followers"
 * easter egg that populates the participant list with real friend names.
 */

import { FRIEND_NAMES } from '../types';
import type { ParticipantInput } from '../types';

/**
 * Checks if the provided input value is a cheat code trigger
 * Currently supports: "the followers" (case-insensitive)
 * 
 * @param value - The input value to check
 * @returns True if the value is a cheat code trigger
 */
export const isCheatCode = (value: string): boolean => {
  const normalizedValue = value.toLowerCase().trim();
  return normalizedValue === 'the followers';
};

/**
 * Generates participant inputs from the friend names cheat code
 * Creates a list of ParticipantInput objects with friend names plus one empty input
 * 
 * @param startingId - The ID to start numbering from
 * @returns Array of ParticipantInput objects with friend names and one empty input
 */
export const generateFriendsParticipants = (startingId: number = 1): ParticipantInput[] => {
  // Create participant inputs for each friend
  const friendParticipants: ParticipantInput[] = FRIEND_NAMES.map((name, index) => ({
    id: startingId + index,
    value: name
  }));

  // Add one empty input at the end for continued input
  const emptyInput: ParticipantInput = {
    id: startingId + FRIEND_NAMES.length,
    value: ''
  };

  return [...friendParticipants, emptyInput];
};

/**
 * Gets the next available ID after processing a cheat code
 * Used to ensure unique IDs for subsequent participant additions
 * 
 * @param startingId - The ID that was used as the starting point
 * @returns The next available ID for new participants
 */
export const getNextIdAfterCheatCode = (startingId: number = 1): number => {
  return startingId + FRIEND_NAMES.length + 1;
};

/**
 * Gets information about available cheat codes for display or documentation
 * 
 * @returns Object containing cheat code information
 */
export const getCheatCodeInfo = () => ({
  trigger: 'the followers',
  description: 'Populates the list with real friend names',
  friendCount: FRIEND_NAMES.length,
  friendNames: FRIEND_NAMES
}); 