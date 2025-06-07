import { type Participant, type ValidationResult } from '../types';

/**
 * Utility class for validating input and processing participants
 */
export class InputValidator {
  /**
   * Create participants from name strings
   */
  static createParticipants(names: string[]): Participant[] {
    return names
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .map((name, index) => ({
        id: `participant-${Date.now()}-${index}`,
        name,
        number: index + 1
      }));
  }

  /**
   * Validate if teams can be created with given parameters
   */
  static validateTeamCreation(participants: Participant[], teamCount: number): ValidationResult {
    if (participants.length < 2) {
      return {
        isValid: false,
        message: 'Please enter at least two names!'
      };
    }

    if (participants.length < teamCount) {
      return {
        isValid: false,
        message: `I can't split ${participants.length} people into ${teamCount} groups`
      };
    }

    if (teamCount < 2) {
      return {
        isValid: false,
        message: 'You need at least 2 teams!'
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Validate a single participant name
   */
  static validateParticipantName(name: string): boolean {
    return name.trim().length > 0 && name.trim().length <= 50;
  }

  /**
   * Check for duplicate names
   */
  static hasDuplicateNames(participants: Participant[]): boolean {
    const names = participants.map(p => p.name.toLowerCase());
    return new Set(names).size !== names.length;
  }

  /**
   * Get duplicate names for error reporting
   */
  static getDuplicateNames(participants: Participant[]): string[] {
    const nameCount = new Map<string, number>();
    const duplicates = new Set<string>();

    participants.forEach(p => {
      const lowerName = p.name.toLowerCase();
      const count = nameCount.get(lowerName) || 0;
      nameCount.set(lowerName, count + 1);
      
      if (count > 0) {
        duplicates.add(p.name);
      }
    });

    return Array.from(duplicates);
  }
} 