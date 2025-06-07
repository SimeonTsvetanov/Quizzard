import { type Participant, type Team, type TeamMember } from '../types';

/**
 * Utility class for generating random teams
 */
export class TeamGenerator {
  /**
   * Generate random teams from a list of participants
   */
  static generateTeams(participants: Participant[], teamCount: number): Team[] {
    // Create a copy of participants array to shuffle
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

    // Calculate minimum team size
    const minTeamSize = Math.floor(shuffledParticipants.length / teamCount);
    const extraMembers = shuffledParticipants.length % teamCount;

    // Create teams array
    const teams: Team[] = [];
    let participantIndex = 0;

    for (let i = 0; i < teamCount; i++) {
      const teamSize = i < extraMembers ? minTeamSize + 1 : minTeamSize;
      const teamParticipants = shuffledParticipants.slice(participantIndex, participantIndex + teamSize);
      
      // Convert participants to team members
      const teamMembers: TeamMember[] = teamParticipants.map(participant => ({
        id: participant.id,
        name: participant.name
      }));
      
      teams.push({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
        members: teamMembers
      });
      
      participantIndex += teamSize;
    }

    return teams;
  }

  /**
   * Format teams for copying to clipboard
   */
  static formatTeamsForClipboard(teams: Team[]): string {
    return teams
      .map((team) => {
        const teamHeader = `⭐ ${team.name} ⭐`;
        const members = team.members.map((member) => `- ${member.name}`).join('\n');
        return `${teamHeader}\n${members}`;
      })
      .join('\n\n');
  }

  /**
   * Shuffle an existing set of teams (for refresh functionality)
   */
  static shuffleTeams(teams: Team[]): Team[] {
    // Get all participants from all teams and convert back to Participant format
    const allParticipants: Participant[] = teams.flatMap(team => 
      team.members.map((member, index) => ({
        id: member.id,
        name: member.name,
        number: index + 1 // Add required number property
      }))
    );
    
    // Generate new teams with the same team count
    return this.generateTeams(allParticipants, teams.length);
  }
} 