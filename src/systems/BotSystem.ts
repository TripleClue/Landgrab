import { HexGrid } from '../grid/HexGrid';
import { AxialCoord } from '../grid/HexCoord';
import { Player } from '../entities/Player';
import { Team } from '../entities/Team';
import { CaptureSystem } from './CaptureSystem';
import { BOT_DECISION_INTERVAL, ENERGY_COST_CLAIM } from '../core/Constants';

interface BotProfile {
  aggressiveness: number;
  expansionism: number;
  encircleSkill: number;
}

export class BotSystem {
  private profiles = new Map<string, BotProfile>();
  private decisionTimer = 0;

  registerBot(playerId: string): void {
    this.profiles.set(playerId, {
      aggressiveness: 0.3 + Math.random() * 0.5,
      expansionism: 0.5 + Math.random() * 0.4,
      encircleSkill: 0.2 + Math.random() * 0.5,
    });
  }

  update(
    grid: HexGrid,
    players: Map<string, Player>,
    teams: Map<string, Team>,
    captureSystem: CaptureSystem,
    dt: number
  ): void {
    this.decisionTimer += dt;
    if (this.decisionTimer < BOT_DECISION_INTERVAL) return;
    this.decisionTimer = 0;

    for (const [playerId, profile] of this.profiles) {
      const player = players.get(playerId);
      if (!player || !player.isBot || player.isEliminated) continue;
      if (player.energy < ENERGY_COST_CLAIM) continue;

      const target = this.decideTarget(grid, player, profile, teams);
      if (target) {
        captureSystem.capture(grid, target, player, teams);
      }
    }
  }

  private decideTarget(
    grid: HexGrid,
    player: Player,
    profile: BotProfile,
    teams: Map<string, Team>
  ): AxialCoord | null {
    const team = teams.get(player.teamId);
    if (!team) return null;

    const frontier: { coord: AxialCoord; score: number }[] = [];

    grid.forEachCell((cell) => {
      if (cell.ownerId !== player.teamId) return;

      const neighbors = grid.getNeighbors(cell.coord.q, cell.coord.r);
      for (const n of neighbors) {
        if (n.ownerId === player.teamId) continue;

        let score = 0;

        if (n.ownerId === null) {
          // Neutral hex - weighted by expansionism
          score = profile.expansionism * 10;
        } else {
          // Enemy hex - weighted by aggressiveness
          score = profile.aggressiveness * 15;
        }

        // Bonus for hexes that would contribute to encirclement
        if (profile.encircleSkill > 0.3) {
          const nNeighbors = grid.getNeighbors(n.coord.q, n.coord.r);
          const friendlyCount = nNeighbors.filter(
            (nn) => nn.ownerId === player.teamId
          ).length;
          score += friendlyCount * profile.encircleSkill * 5;
        }

        // Small random factor for variety
        score += Math.random() * 3;

        frontier.push({ coord: n.coord, score });
      }
    });

    if (frontier.length === 0) return null;

    // Pick the highest-scoring target
    frontier.sort((a, b) => b.score - a.score);
    return frontier[0].coord;
  }
}
