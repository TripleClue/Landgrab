import { HexGrid } from '../grid/HexGrid';
import { Player } from '../entities/Player';

export class InfluenceSystem {
  update(grid: HexGrid, players: Map<string, Player>, dt: number): void {
    for (const player of players.values()) {
      if (player.isEliminated) continue;

      // Passive influence gain based on owned cells
      let ownedCount = 0;
      grid.forEachCell((cell) => {
        if (cell.capturedBy === player.id) ownedCount++;
      });

      player.influence += (ownedCount * dt) / 10;
    }
  }

  getPlayerInfluencedCells(grid: HexGrid, playerId: string): Set<string> {
    const cells = new Set<string>();
    grid.forEachCell((cell, key) => {
      if (cell.capturedBy === playerId) cells.add(key);
    });
    return cells;
  }

  canStartRevolution(player: Player, teamCount: number, maxTeams: number): boolean {
    return (
      player.influence >= player.revolutionThreshold &&
      !player.isChannelingRevolution &&
      teamCount < maxTeams
    );
  }
}
