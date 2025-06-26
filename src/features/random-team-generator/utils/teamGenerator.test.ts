import { TeamGenerator } from "./teamGenerator";
import type { Participant, Team } from "../types";

/**
 * Unit tests for TeamGenerator.generateTeams
 */
describe("TeamGenerator.generateTeams", () => {
  /**
   * Test Case 2.1: Even distribution of participants into teams
   */
  it("should correctly distribute an even number of participants into teams", () => {
    const participants: Participant[] = [
      { id: "1", name: "Alice", number: 1 },
      { id: "2", name: "Bob", number: 2 },
      { id: "3", name: "Charlie", number: 3 },
      { id: "4", name: "Diana", number: 4 },
    ];
    const teams = TeamGenerator.generateTeams(participants, 2);
    expect(teams).toHaveLength(2);
    expect(teams[0].members).toHaveLength(2);
    expect(teams[1].members).toHaveLength(2);
    // All participants should be present in some team
    const allMembers = [...teams[0].members, ...teams[1].members].map(
      (m) => m.name
    );
    expect(allMembers).toEqual(
      expect.arrayContaining(["Alice", "Bob", "Charlie", "Diana"])
    );
  });

  /**
   * Test Case 2.2: Uneven distribution of participants into teams
   */
  it("should correctly handle an uneven distribution (e.g., 7 participants into 3 teams)", () => {
    const participants: Participant[] = [
      { id: "1", name: "A", number: 1 },
      { id: "2", name: "B", number: 2 },
      { id: "3", name: "C", number: 3 },
      { id: "4", name: "D", number: 4 },
      { id: "5", name: "E", number: 5 },
      { id: "6", name: "F", number: 6 },
      { id: "7", name: "G", number: 7 },
    ];
    const teams = TeamGenerator.generateTeams(participants, 3);
    expect(teams).toHaveLength(3);
    // The first (extraMembers) teams should have 3 members, the rest 2
    const memberCounts = teams.map((t) => t.members.length);
    expect(memberCounts.sort()).toEqual([2, 2, 3]);
    // All participants should be present in some team
    const allMembers = teams.flatMap((t) => t.members.map((m) => m.name));
    expect(allMembers).toEqual(
      expect.arrayContaining(["A", "B", "C", "D", "E", "F", "G"])
    );
  });

  /**
   * Test Case 2.3: Empty participant list returns teams with empty members
   */
  it("should return teams with empty members when participant list is empty", () => {
    const participants: Participant[] = [];
    const teams = TeamGenerator.generateTeams(participants, 3);
    expect(teams).toHaveLength(3);
    expect(teams[0].members).toEqual([]);
    expect(teams[1].members).toEqual([]);
    expect(teams[2].members).toEqual([]);
    expect(teams[0].name).toBe("Team 1");
    expect(teams[1].name).toBe("Team 2");
    expect(teams[2].name).toBe("Team 3");
  });
});
