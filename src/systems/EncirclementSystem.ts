import { HexGrid } from '../grid/HexGrid';
import { AxialCoord, parseHexKey } from '../grid/HexCoord';
import { checkEncirclements, EncirclementResult } from '../grid/Encirclement';
import { EventBus } from '../core/EventBus';
import { Team } from '../entities/Team';
import { Player } from '../entities/Player';
import { MAX_CASCADE_DEPTH, INFLUENCE_FROM_ENCIRCLEMENT } from '../core/Constants';

export class EncirclementSystem {
  private pendingCaptures: {
    coord: AxialCoord;
    teamId: string;
    playerId: string;
  }[] = [];

  constructor(private events: EventBus) {
    this.events.on('hexCaptured', (data) => {
      this.pendingCaptures.push({
        coord: data.coord,
        teamId: data.teamId,
        playerId: data.playerId,
      });
    });
  }

  update(
    grid: HexGrid,
    teams: Map<string, Team>,
    players: Map<string, Player>
  ): EncirclementResult[] {
    const allResults: EncirclementResult[] = [];
    let depth = 0;

    while (this.pendingCaptures.length > 0 && depth < MAX_CASCADE_DEPTH) {
      const captures = [...this.pendingCaptures];
      this.pendingCaptures = [];

      for (const cap of captures) {
        const results = checkEncirclements(grid, cap.coord, cap.teamId);

        for (const result of results) {
          // Execute the capture
          for (const cellKey of result.capturedGroup) {
            const cell = grid.getCellByKey(cellKey);
            if (!cell) continue;

            const prevOwner = cell.ownerId;
            cell.ownerId = result.newOwner;
            cell.capturedBy = cap.playerId;
            cell.capturedAt = Date.now();

            // Update territory counts
            if (prevOwner) {
              const prevTeam = teams.get(prevOwner);
              if (prevTeam) prevTeam.territory--;
            }
            const newTeam = teams.get(result.newOwner);
            if (newTeam) newTeam.territory++;

            // Check for cascading
            const coord = parseHexKey(cellKey);
            this.pendingCaptures.push({
              coord,
              teamId: result.newOwner,
              playerId: cap.playerId,
            });
          }

          // Award influence bonus
          const player = players.get(cap.playerId);
          if (player) {
            player.influence += INFLUENCE_FROM_ENCIRCLEMENT;
          }

          this.events.emit('encirclement', result);
          allResults.push(result);
        }
      }
      depth++;
    }

    this.pendingCaptures = [];
    return allResults;
  }
}
