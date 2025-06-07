export interface Participant {
  id: string;
  name: string;
  number: number;
}

export interface Team {
  id: string;
  name: string;
  members: Participant[];
  color: string;
}

export interface TeamGenerationConfig {
  participants: Participant[];
  teamCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface TeamGeneratorState {
  participants: Participant[];
  teams: Team[];
  teamCount: number;
  isGenerating: boolean;
  showResults: boolean;
}

export const TEAM_COLORS = [
  'rgba(76, 175, 80, 0.1)', // Green
  'rgba(33, 150, 243, 0.1)', // Blue  
  'rgba(156, 39, 176, 0.1)', // Purple
  'rgba(255, 152, 0, 0.1)', // Orange
  'rgba(233, 30, 99, 0.1)', // Pink
  'rgba(96, 125, 139, 0.1)', // Blue Grey
  'rgba(121, 85, 72, 0.1)', // Brown
  'rgba(158, 158, 158, 0.1)', // Grey
] as const; 