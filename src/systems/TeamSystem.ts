import { Team } from '../entities/Team';
import { Player } from '../entities/Player';
import { EventBus } from '../core/EventBus';

export class TeamSystem {
  constructor(private events: EventBus) {}

  update(teams: Map<string, Team>, players: Map<string, Player>): void {
    // Check for eliminated teams (no territory and no members with energy)
    for (const [teamId, team] of teams) {
      if (team.isOriginal && team.territory === 0 && team.members.size > 0) {
        // Check if any member still has territory
        let hasTerritory = false;
        for (const memberId of team.members) {
          const member = players.get(memberId);
          if (member && !member.isEliminated) {
            hasTerritory = true;
            break;
          }
        }
        if (!hasTerritory && team.territory === 0) {
          // Don't eliminate original teams early, let them fight back
        }
      }

      // Eliminate non-original teams with 0 territory
      if (!team.isOriginal && team.territory === 0) {
        this.eliminateTeam(teamId, team, players, teams);
      }
    }
  }

  private eliminateTeam(
    teamId: string,
    team: Team,
    players: Map<string, Player>,
    teams: Map<string, Team>
  ): void {
    // Move all players to free agent status
    for (const memberId of team.members) {
      const player = players.get(memberId);
      if (player) {
        player.isEliminated = true;
      }
    }
    teams.delete(teamId);
    this.events.emit('teamEliminated', { teamId });
  }

  joinTeam(player: Player, newTeamId: string, teams: Map<string, Team>): void {
    const oldTeam = teams.get(player.teamId);
    if (oldTeam) oldTeam.members.delete(player.id);

    const newTeam = teams.get(newTeamId);
    if (newTeam) {
      newTeam.members.add(player.id);
      player.teamId = newTeamId;
      player.isEliminated = false;
      player.influence *= 0.5; // penalty for switching
    }
  }
}
