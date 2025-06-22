/**
 * Team Setup Form State Management Hook
 *
 * Manages all state logic for the TeamSetup component including team inputs,
 * validation, dialog states, and user interactions. Extracted from the
 * monolithic TeamSetup component to improve maintainability.
 *
 * Features:
 * - Team input management with auto-expansion
 * - Round count validation
 * - Edit mode vs fresh setup handling
 * - Validation error tracking
 * - Dialog state management
 * - Placeholder text generation
 *
 * @fileoverview State management hook for TeamSetup component
 * @version 1.0.0
 * @since December 2025
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Team } from "../../../types";
import { GAME_CONSTANTS, FUNNY_TEAM_NAMES } from "../../../types";

/**
 * Team input interface for internal state management
 */
interface TeamInput {
  id: number;
  value: string;
}

/**
 * Team setup form state interface
 */
export interface TeamSetupFormState {
  teams: TeamInput[];
  nextId: number;
  roundCountInput: string;
  clearDialogOpen: boolean;
  validationError: string | null;
  inputRefs: React.MutableRefObject<Map<number, HTMLInputElement>>;
}

/**
 * Team setup form actions interface
 */
export interface TeamSetupFormActions {
  handleInputChange: (id: number, value: string) => void;
  handleKeyDown: (id: number, event: React.KeyboardEvent<HTMLElement>) => void;
  handleRoundCountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeTeam: (id: number) => void;
  getPlaceholderText: (index: number) => string;
  validateSetup: () => boolean;
  setClearDialogOpen: (open: boolean) => void;
  setValidationError: (error: string | null) => void;
}

/**
 * Hook return type
 */
export interface UseTeamSetupFormReturn {
  state: TeamSetupFormState;
  actions: TeamSetupFormActions;
  derivedValues: {
    roundCount: number;
    isEditMode: boolean;
    filledTeams: TeamInput[];
  };
}

/**
 * Props for the hook
 */
interface UseTeamSetupFormProps {
  gameStatus: "ON" | "OFF";
  existingTeams?: Team[];
  existingRounds?: number;
}

/**
 * Team Setup Form State Management Hook
 *
 * Manages all complex state for team setup including team inputs, validation,
 * dialog states, and user interactions.
 *
 * @param props - Hook configuration props
 * @returns State, actions, and derived values for team setup
 */
export const useTeamSetupForm = (
  props: UseTeamSetupFormProps
): UseTeamSetupFormReturn => {
  const { gameStatus, existingTeams, existingRounds } = props;

  // === PRIMARY STATE ===
  const [teams, setTeams] = useState<TeamInput[]>([]);
  const [nextId, setNextId] = useState(1);
  const [roundCountInput, setRoundCountInput] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Add ref to track when keyboard navigation is in progress
  const isNavigatingRef = useRef(false);

  // === DERIVED VALUES ===
  const roundCount = parseInt(roundCountInput) || 0;
  const isEditMode = gameStatus === "ON";
  const filledTeams = teams.filter((t) => t.value.trim() !== "");

  /**
   * Gets placeholder text with memoized funny names
   */
  const getPlaceholderNames = useMemo(() => {
    const shuffledNames = [...FUNNY_TEAM_NAMES].sort(() => Math.random() - 0.5);
    return shuffledNames;
  }, []);

  /**
   * Gets placeholder text for team input
   */
  const getPlaceholderText = useCallback(
    (index: number): string => {
      return getPlaceholderNames[index % getPlaceholderNames.length];
    },
    [getPlaceholderNames]
  );

  /**
   * Initialize component state from props or defaults
   */
  useEffect(() => {
    console.log("TeamSetup hook initializing:", {
      gameStatus,
      existingTeams,
      existingRounds,
    });

    if (isEditMode && existingTeams && existingTeams.length > 0) {
      console.log("Loading edit mode with existing teams:", existingTeams);
      const teamInputs: TeamInput[] = existingTeams.map((team, index) => ({
        id: index + 1,
        value: team.name,
      }));
      // Add empty input at the end for adding new teams
      teamInputs.push({ id: existingTeams.length + 1, value: "" });
      setTeams(teamInputs);
      setNextId(existingTeams.length + 2);
    } else {
      console.log("Creating fresh setup");
      // Start with just ONE empty input with placeholder hint
      const singleTeam: TeamInput[] = [{ id: 1, value: "" }];
      console.log("Setting single empty team:", singleTeam);
      setTeams(singleTeam);
      setNextId(2);
    }

    if (isEditMode && existingRounds) {
      setRoundCountInput(existingRounds.toString());
    } else {
      setRoundCountInput("");
    }

    // Clear validation error when props change
    setValidationError(null);
  }, [isEditMode, existingTeams, existingRounds]);

  /**
   * Validates current setup
   */
  const validateSetup = useCallback((): boolean => {
    const currentFilledTeams = teams.filter((t) => t.value.trim() !== "");

    if (currentFilledTeams.length < 1) {
      setValidationError("Fill minimum one Team and at least 1 Round");
      return false;
    }

    if (roundCount < 1) {
      setValidationError("Fill minimum one Team and at least 1 Round");
      return false;
    }

    setValidationError(null);
    return true;
  }, [teams, roundCount]);

  /**
   * Handles team name input changes
   */
  const handleInputChange = useCallback(
    (id: number, value: string) => {
      console.log("handleInputChange called:", { id, value });
      // Clear validation error when user starts typing
      setValidationError(null);

      // Update team value
      setTeams((prev) => {
        const newTeams = prev.map((t) => (t.id === id ? { ...t, value } : t));
        console.log("Setting teams after input change:", newTeams);
        return newTeams;
      });

      // Auto-create new input if typing in the last field and it's not empty
      // BUT ONLY if we're not in the middle of keyboard navigation (Tab/Enter)
      const isLastInput = teams[teams.length - 1]?.id === id;
      if (
        isLastInput &&
        value.trim() &&
        teams.length < GAME_CONSTANTS.MAX_TEAMS &&
        !isNavigatingRef.current // Prevent auto-creation during keyboard navigation
      ) {
        console.log("Auto-adding new team input");
        setTeams((prev) => [...prev, { id: nextId, value: "" }]);
        setNextId((prev) => prev + 1);
      }
    },
    [teams, nextId]
  );

  /**
   * Handles keyboard navigation and shortcuts
   */
  const handleKeyDown = useCallback(
    (id: number, event: React.KeyboardEvent<HTMLElement>) => {
      const currentIndex = teams.findIndex((t) => t.id === id);
      const currentTeam = teams[currentIndex];

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();

        // Set flag to prevent auto-creation during navigation
        isNavigatingRef.current = true;

        // If field is empty, accept the placeholder text and move cursor to end
        if (!currentTeam?.value.trim()) {
          const placeholderText = getPlaceholderText(currentIndex);
          handleInputChange(id, placeholderText);

          // Create new empty field below immediately
          setTimeout(() => {
            if (teams.length < GAME_CONSTANTS.MAX_TEAMS) {
              const newTeam = { id: nextId, value: "" };
              setTeams((prev) => [...prev, newTeam]);
              setNextId((prev) => prev + 1);
            }

            // Move cursor to end of current field (the filled placeholder text)
            const currentInput = inputRefs.current.get(id);
            if (currentInput) {
              currentInput.focus();
              // Move cursor to end of text
              const textLength = placeholderText.length;
              currentInput.setSelectionRange(textLength, textLength);
            }

            // Reset navigation flag after operation completes
            setTimeout(() => {
              isNavigatingRef.current = false;
            }, 50);
          }, 0);
        } else {
          // Field has content, just navigate to next field
          const nextIndex = currentIndex + 1;
          if (nextIndex < teams.length) {
            // Move to existing next input
            const nextTeam = teams[nextIndex];
            const nextInput = inputRefs.current.get(nextTeam.id);
            nextInput?.focus();
          } else if (teams.length < GAME_CONSTANTS.MAX_TEAMS) {
            // Create new input and focus it
            const newTeam = { id: nextId, value: "" };
            setTeams((prev) => [...prev, newTeam]);
            setNextId((prev) => prev + 1);

            // Focus the new input after it's created
            setTimeout(() => {
              const newInput = inputRefs.current.get(newTeam.id);
              newInput?.focus();
            }, 0);
          }

          // Reset navigation flag after operation completes
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 50);
        }
      }
    },
    [teams, nextId, getPlaceholderText, handleInputChange]
  );

  /**
   * Handles round count input changes
   */
  const handleRoundCountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Clear validation error when user starts typing
      setValidationError(null);
      setRoundCountInput(event.target.value);
    },
    []
  );

  /**
   * Removes a team input
   */
  const removeTeam = useCallback(
    (id: number) => {
      if (teams.length <= 1) return; // Prevent removing the last input

      setTeams((prev) => prev.filter((t) => t.id !== id));
      inputRefs.current.delete(id);
    },
    [teams.length]
  );

  // === RETURN HOOK INTERFACE ===
  return {
    state: {
      teams,
      nextId,
      roundCountInput,
      clearDialogOpen,
      validationError,
      inputRefs,
    },
    actions: {
      handleInputChange,
      handleKeyDown,
      handleRoundCountChange,
      removeTeam,
      getPlaceholderText,
      validateSetup,
      setClearDialogOpen,
      setValidationError,
    },
    derivedValues: {
      roundCount,
      isEditMode,
      filledTeams,
    },
  };
};
