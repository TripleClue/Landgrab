import { HexGrid } from '../grid/HexGrid';
import { AxialCoord } from '../grid/HexCoord';
import { Player } from '../entities/Player';
import { Team } from '../entities/Team';
import { ENERGY_COST_CLAIM, INFLUENCE_PER_CAPTURE } from '../core/Constants';
import { EventBus } from '../core/EventBus';

export class CaptureSystem {
  constructor(private events: EventBus) {}

  canCapture(
    grid: HexGrid,
    coord: AxialCoord,
    player: Player,
    teams: Map<string, Team>
  ): boolean {
    const cell = grid.getCell(coord.q, coord.r);
    if (!cell) return false;
    if (cell.ownerId === player.teamId) return false;
    if (player.energy < ENERGY_COST_CLAIM) return false;
    if (player.isChannelingRevolution) return false;

    // Must be adjacent to own territory, OR team has no territory yet (first claim)
    const team = teams.get(player.teamId);
    if (!team || team.territory === 0) return true;

    const neighbors = grid.getNeighbors(coord.q, coord.r);
    return neighbors.some((n) => n.ownerId === player.teamId);
  }

  capture(
    grid: HexGrid,
    coord: AxialCoord,
    player: Player,
    teams: Map<string, Team>
  ): boolean {
    if (!this.canCapture(grid, coord, player, teams)) return false;

    const cell = grid.getCell(coord.q, coord.r)!;
    const previousOwner = cell.ownerId;

    // Deduct energy
    player.energy -= ENERGY_COST_CLAIM;

    // Update previous owner's territory count
    if (previousOwner) {
      const prevTeam = teams.get(previousOwner);
      if (prevTeam) prevTeam.territory--;
    }

    // Update cell
    cell.ownerId = player.teamId;
    cell.capturedBy = player.id;
    cell.capturedAt = Date.now();

    // Update influence
    const currentInfluence = cell.influenceMap.get(player.id) ?? 0;
    cell.influenceMap.set(player.id, currentInfluence + INFLUENCE_PER_CAPTURE);
    player.influence += INFLUENCE_PER_CAPTURE;

    // Update new owner's territory count
    const team = teams.get(player.teamId)!;
    team.territory++;

    player.hexesCaptured++;

    this.events.emit('hexCaptured', {
      coord,
      playerId: player.id,
      teamId: player.teamId,
    });

    return true;
  }
}
