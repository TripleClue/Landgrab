import { HexGrid } from '../grid/HexGrid';
// HexCoord used indirectly via HexGrid
import { Team } from '../entities/Team';
import { EventBus } from '../core/EventBus';
import { PULSE_INTERVAL, PULSE_NEIGHBOR_THRESHOLD } from '../core/Constants';

export class PulseSystem {
  timer = PULSE_INTERVAL;
  private tickCount = 0;

  constructor(private events: EventBus) {}

  update(grid: HexGrid, teams: Map<string, Team>, dt: number): string[] {
    this.timer -= dt;
    this.tickCount++;

    if (this.timer <= 0) {
      this.timer = PULSE_INTERVAL;
      const flipped = this.executePulse(grid, teams);
      this.events.emit('pulseTriggered', { tick: this.tickCount });
      return flipped;
    }

    return [];
  }

  private executePulse(grid: HexGrid, teams: Map<string, Team>): string[] {
    const flipped: string[] = [];
    const toFlip: { key: string; teamId: string }[] = [];

    // Find neutral hexes adjacent to 3+ hexes of the same team
    grid.forEachCell((cell, key) => {
      if (cell.ownerId !== null) return;

      const neighbors = grid.getNeighbors(cell.coord.q, cell.coord.r);
      const teamCounts = new Map<string, number>();

      for (const n of neighbors) {
        if (n.ownerId) {
          teamCounts.set(n.ownerId, (teamCounts.get(n.ownerId) ?? 0) + 1);
        }
      }

      for (const [teamId, count] of teamCounts) {
        if (count >= PULSE_NEIGHBOR_THRESHOLD) {
          toFlip.push({ key, teamId });
          break; // Only flip to first qualifying team
        }
      }
    });

    for (const { key, teamId } of toFlip) {
      const cell = grid.getCellByKey(key);
      if (!cell) continue;
      cell.ownerId = teamId;
      cell.capturedAt = Date.now();
      const team = teams.get(teamId);
      if (team) team.territory++;
      flipped.push(key);
    }

    return flipped;
  }

  get timeRemaining(): number {
    return this.timer;
  }
}
