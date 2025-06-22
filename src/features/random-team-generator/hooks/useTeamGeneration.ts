/**
 * useTeamGeneration Hook
 *
 * Custom hook for managing team generation state and operations.
 * Handles team creation, state management, and validation.
 */

import { useState, useCallback, useMemo } from "react";
import type { Team, TeamMember, Participant, GenerationState } from "../types";
import { CONSTANTS } from "../types";
import { TeamGenerator } from "../utils/teamGenerator";
import { useLocalStoragePersistence } from "../../../shared/hooks/useLocalStoragePersistence";
import { STORAGE_KEYS } from "../../../shared/utils/storageKeys";

/**
 * Hook return type defining all team generation related state and functions
 */
interface UseTeamGenerationReturn {
  /** Array of generated teams */
  teams: Team[];
  /** Current team count setting */
  teamCount: number;
  /** Generation state (loading, refreshing) */
  generationState: GenerationState;
  /** Whether teams modal is open */
  teamsModalOpen: boolean;
  /** Set team count */
  setTeamCount: (count: number) => void;
  /** Reset team count to minimum value */
  resetTeamCount: () => void;
  /** Generate teams from participant names */
  generateTeams: (participantNames: string[]) => Team[];
  /** Refresh existing teams with same participants */
  refreshTeams: () => void;
  /** Clear all generated teams */
  clearTeams: () => void;
  /** Open teams modal */
  openTeamsModal: () => void;
  /** Close teams modal */
  closeTeamsModal: () => void;
  /** Get team distribution message */
  getTeamDistributionMessage: (participantCount: number) => string;
  /** Validate if teams can be generated */
  canGenerateTeams: (participantCount: number) => {
    canGenerate: boolean;
    message?: string;
  };
}

/**
 * Custom hook for managing team generation operations
 *
 * @returns Object containing team generation state and management functions
 */
export const useTeamGeneration = (): UseTeamGenerationReturn => {
  // State management with localStorage persistence for team count
  const [teams, setTeams] = useState<Team[]>([]);
  const { value: teamCount, setValue: setTeamCountValue } =
    useLocalStoragePersistence<number>(
      STORAGE_KEYS.RTG_TEAM_COUNT,
      CONSTANTS.MIN_TEAMS,
      { debounceMs: 500, iosCompatMode: true }
    );
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    isRefreshing: false,
  });
  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  const [lastParticipantNames, setLastParticipantNames] = useState<string[]>(
    []
  );

  /**
   * Converts participant names to the format expected by TeamGenerator
   */
  const convertNamesToParticipants = useCallback(
    (names: string[]): Participant[] => {
      return names.map((name, index) => ({
        id: `participant-${index}`,
        name,
        number: index + 1,
      }));
    },
    []
  );

  /**
   * Converts TeamGenerator output to our Team format
   */
  const convertToTeamFormat = useCallback((generatedTeams: any[]): Team[] => {
    return generatedTeams.map((team, index) => ({
      id: `team-${index}`,
      name: `Team ${index + 1}`,
      members: team.members.map(
        (member: any): TeamMember => ({
          id: member.id,
          name: member.name,
        })
      ),
    }));
  }, []);

  /**
   * Core team generation logic
   */
  const performTeamGeneration = useCallback(
    (participantNames: string[]): Team[] => {
      try {
        // Convert names to participants format for TeamGenerator
        const participantsForGenerator =
          convertNamesToParticipants(participantNames);

        // Use TeamGenerator utility
        const generatedTeams = TeamGenerator.generateTeams(
          participantsForGenerator,
          teamCount
        );

        // Convert to our Team format
        const formattedTeams = convertToTeamFormat(generatedTeams);

        return formattedTeams;
      } catch (error) {
        console.error("Error generating teams:", error);
        throw new Error("Failed to generate teams. Please try again.");
      }
    },
    [teamCount, convertNamesToParticipants, convertToTeamFormat]
  );

  /**
   * Generates teams from participant names with state management
   */
  const generateTeams = useCallback(
    (participantNames: string[]): Team[] => {
      setGenerationState((prev) => ({ ...prev, isGenerating: true }));

      try {
        const generatedTeams = performTeamGeneration(participantNames);
        setTeams(generatedTeams);
        setLastParticipantNames(participantNames);
        setGenerationState((prev) => ({ ...prev, isGenerating: false }));
        return generatedTeams;
      } catch (error) {
        setGenerationState((prev) => ({ ...prev, isGenerating: false }));
        throw error;
      }
    },
    [performTeamGeneration]
  );

  /**
   * Refreshes teams using the last participant names with animation
   */
  const refreshTeams = useCallback(() => {
    if (lastParticipantNames.length === 0) return;

    setGenerationState((prev) => ({ ...prev, isRefreshing: true }));

    // Add delay for animation effect
    setTimeout(() => {
      try {
        const generatedTeams = performTeamGeneration(lastParticipantNames);
        setTeams(generatedTeams);
        setGenerationState((prev) => ({ ...prev, isRefreshing: false }));
      } catch (error) {
        setGenerationState((prev) => ({ ...prev, isRefreshing: false }));
        throw error;
      }
    }, 300);
  }, [lastParticipantNames, performTeamGeneration]);

  /**
   * Clears all generated teams
   */
  const clearTeams = useCallback(() => {
    setTeams([]);
    setLastParticipantNames([]);
  }, []);

  /**
   * Opens the teams modal
   */
  const openTeamsModal = useCallback(() => {
    setTeamsModalOpen(true);
  }, []);

  /**
   * Closes the teams modal
   */
  const closeTeamsModal = useCallback(() => {
    setTeamsModalOpen(false);
  }, []);

  /**
   * Validates team count constraints
   */
  const setTeamCountSafe = useCallback(
    (count: number) => {
      const safeCount = Math.max(
        CONSTANTS.MIN_TEAMS,
        Math.min(CONSTANTS.MAX_TEAMS, count)
      );
      setTeamCountValue(safeCount);
    },
    [setTeamCountValue]
  );

  /**
   * Gets team distribution message for UI display
   */
  const getTeamDistributionMessage = useCallback(
    (participantCount: number): string => {
      if (participantCount === 0) return "";

      const membersPerTeam = Math.floor(participantCount / teamCount);
      const extraMembers = participantCount % teamCount;

      if (extraMembers === 0) {
        return `Your ${teamCount} teams will have ${membersPerTeam} members each.`;
      } else {
        return `Your ${teamCount} teams will have ${membersPerTeam}-${
          membersPerTeam + 1
        } members each.`;
      }
    },
    [teamCount]
  );

  /**
   * Memoized team distribution message for current participant count
   * This prevents unnecessary recalculations when the same participant count is used
   */
  const memoizedTeamDistributionMessage = useMemo(() => {
    // This will be used by components that need the distribution message
    // without having to pass participant count every time
    return (participantCount: number) =>
      getTeamDistributionMessage(participantCount);
  }, [getTeamDistributionMessage]);

  /**
   * Validates if teams can be generated with current settings
   */
  const canGenerateTeams = useCallback(
    (
      participantCount: number
    ): {
      canGenerate: boolean;
      message?: string;
    } => {
      if (participantCount < CONSTANTS.MIN_PARTICIPANTS_FOR_TEAMS) {
        return {
          canGenerate: false,
          message: `You need at least ${CONSTANTS.MIN_PARTICIPANTS_FOR_TEAMS} participants to generate teams.`,
        };
      }

      if (participantCount < teamCount) {
        return {
          canGenerate: false,
          message: `You need at least ${teamCount} participants to create ${teamCount} teams.`,
        };
      }

      return { canGenerate: true };
    },
    [teamCount]
  );

  /**
   * Resets team count to minimum value
   */
  const resetTeamCount = useCallback(() => {
    setTeamCountSafe(CONSTANTS.MIN_TEAMS);
  }, [setTeamCountSafe]);

  return {
    teams,
    teamCount,
    generationState,
    teamsModalOpen,
    setTeamCount: setTeamCountSafe,
    resetTeamCount,
    generateTeams,
    refreshTeams,
    clearTeams,
    openTeamsModal,
    closeTeamsModal,
    getTeamDistributionMessage,
    canGenerateTeams,
  };
};
