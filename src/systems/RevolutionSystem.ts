import { HexGrid } from '../grid/HexGrid';
import { Player } from '../entities/Player';
import { createTeam, TeamColor } from '../entities/Team';
import type { Team } from '../entities/Team';
import { EventBus } from '../core/EventBus';
import { generateTeamColor } from '../rendering/Colors';
import { REVOLUTION_CHANNEL_TIME, REVOLUTION_SCALING, MAX_TEAMS } from '../core/Constants';

const ADJECTIVES = ['Crimson', 'Shadow', 'Iron', 'Storm', 'Ember', 'Void', 'Solar', 'Arctic', 'Phantom', 'Rogue'];
const NOUNS = ['Legion', 'Vanguard', 'Collective', 'Order', 'Alliance', 'Syndicate', 'Dominion', 'Accord', 'Front', 'Rising'];

function generateTeamName(existingNames: Set<string>): string {
  let name: string;
  let attempts = 0;
  do {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    name = `${adj} ${noun}`;
    attempts++;
  } while (existingNames.has(name) && attempts < 100);
  return name;
}

export class RevolutionSystem {
  constructor(private events: EventBus) {}

  startRevolution(player: Player): void {
    if (player.isChannelingRevolution) return;
    player.isChannelingRevolution = true;
    player.revolutionProgress = 0;
  }

  update(
    grid: HexGrid,
    players: Map<string, Player>,
    teams: Map<string, Team>,
    dt: number
  ): void {
    for (const player of players.values()) {
      if (!player.isChannelingRevolution) continue;

      player.revolutionProgress += (dt * 1000) / REVOLUTION_CHANNEL_TIME;

      if (player.revolutionProgress >= 1) {
        this.completeRevolution(grid, player, players, teams);
      }
    }
  }

  private completeRevolution(
    grid: HexGrid,
    player: Player,
    _players: Map<string, Player>,
    teams: Map<string, Team>
  ): void {
    if (teams.size >= MAX_TEAMS) {
      player.isChannelingRevolution = false;
      player.revolutionProgress = 0;
      return;
    }

    // Generate new team
    const existingColors = Array.from(teams.values()).map((t) => t.color);
    const color: TeamColor = generateTeamColor(existingColors);
    const existingNames = new Set(Array.from(teams.values()).map((t) => t.name));
    const name = generateTeamName(existingNames);
    const teamId = `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newTeam = createTeam(teamId, name, color, false, player.id);

    // Move player's influenced cells to new team
    let hexCount = 0;
    grid.forEachCell((cell) => {
      if (cell.capturedBy === player.id && cell.ownerId === player.teamId) {
        const prevTeam = teams.get(cell.ownerId);
        if (prevTeam) prevTeam.territory--;
        cell.ownerId = teamId;
        newTeam.territory++;
        hexCount++;
      }
    });

    // Move player to new team
    const oldTeam = teams.get(player.teamId);
    if (oldTeam) oldTeam.members.delete(player.id);
    player.teamId = teamId;
    newTeam.members.add(player.id);
    teams.set(teamId, newTeam);

    // Reset revolution state
    player.isChannelingRevolution = false;
    player.revolutionProgress = 0;
    player.influence = 0;
    player.revolutionThreshold *= REVOLUTION_SCALING;

    this.events.emit('revolutionCompleted', {
      playerId: player.id,
      newTeamId: teamId,
      hexCount,
    });
  }

  cancelRevolution(player: Player): void {
    player.isChannelingRevolution = false;
    player.revolutionProgress = 0;
  }
}
