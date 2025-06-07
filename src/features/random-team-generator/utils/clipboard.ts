/**
 * Clipboard Utilities for Random Team Generator
 * 
 * This file handles all clipboard operations, specifically copying generated teams
 * to the clipboard in a nicely formatted text format suitable for sharing.
 */

import type { Team } from '../types';

/**
 * Formats teams into a nicely structured text format for sharing
 * Creates a formatted string with emojis and proper spacing
 * 
 * @param teams - Array of teams to format
 * @returns Formatted string ready for clipboard or sharing
 */
export const formatTeamsForClipboard = (teams: Team[]): string => {
  if (teams.length === 0) {
    return 'No teams generated yet.';
  }

  let formattedText = '🎯 **TEAM GENERATOR RESULTS** 🎯\n\n';
  
  teams.forEach((team, index) => {
    formattedText += `🏆 **${team.name}**\n`;
    team.members.forEach((member, memberIndex) => {
      formattedText += `   ${memberIndex + 1}. ${member.name}\n`;
    });
    
    // Add spacing between teams (except after the last one)
    if (index < teams.length - 1) {
      formattedText += '\n';
    }
  });
  
  formattedText += '\n✨ Generated with Quizzard Team Generator ✨';
  
  return formattedText;
};

/**
 * Copies teams to the system clipboard with proper error handling
 * Uses the modern Clipboard API with fallback handling
 * 
 * @param teams - Array of teams to copy
 * @returns Promise that resolves to true if successful, false if failed
 */
export const copyTeamsToClipboard = async (teams: Team[]): Promise<boolean> => {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available');
      return false;
    }

    const formattedText = formatTeamsForClipboard(teams);
    await navigator.clipboard.writeText(formattedText);
    
    return true;
  } catch (error) {
    console.error('Failed to copy teams to clipboard:', error);
    return false;
  }
};

/**
 * Gets a preview of how the teams will look when copied
 * Useful for showing users what will be copied before the action
 * 
 * @param teams - Array of teams to preview
 * @returns Formatted preview string (truncated if too long)
 */
export const getClipboardPreview = (teams: Team[]): string => {
  const formatted = formatTeamsForClipboard(teams);
  const maxLength = 200;
  
  if (formatted.length <= maxLength) {
    return formatted;
  }
  
  return formatted.substring(0, maxLength) + '...';
};

/**
 * Validates if teams data is suitable for clipboard operations
 * Checks for empty teams, missing data, etc.
 * 
 * @param teams - Array of teams to validate
 * @returns Object with validation result and optional error message
 */
export const validateTeamsForClipboard = (teams: Team[]): { 
  isValid: boolean; 
  message?: string; 
} => {
  if (!teams || teams.length === 0) {
    return {
      isValid: false,
      message: 'No teams available to copy'
    };
  }

  const hasEmptyTeams = teams.some(team => !team.members || team.members.length === 0);
  if (hasEmptyTeams) {
    return {
      isValid: false,
      message: 'Some teams are empty'
    };
  }

  const hasInvalidMembers = teams.some(team => 
    team.members.some(member => !member.name || member.name.trim() === '')
  );
  if (hasInvalidMembers) {
    return {
      isValid: false,
      message: 'Some team members have invalid names'
    };
  }

  return { isValid: true };
}; 