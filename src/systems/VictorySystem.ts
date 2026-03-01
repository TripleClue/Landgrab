import { HexGrid } from '../grid/HexGrid';
import { Team } from '../entities/Team';
import { EventBus } from '../core/EventBus';
import { ROUND_DURATION, DOMINATION_THRESHOLD } from '../core/Constants';

export class VictorySystem {
  roundTimer = ROUND_DURATION;
  private roundEnded = false;

  constructor(private events: EventBus) {}

  update(grid: HexGrid, teams: Map<string, Team>, dt: number): void {
    if (this.roundEnded) return;

    this.roundTimer -= dt;

    // Check domination victory
    const totalCells = grid.totalCells;
    for (const team of teams.values()) {
      if (team.territory / totalCells >= DOMINATION_THRESHOLD) {
        this.endRound(team.id);
        return;
      }
    }

    // Check timer
    if (this.roundTimer <= 0) {
      let winnerId: string | null = null;
      let maxTerritory = 0;
      for (const team of teams.values()) {
        if (team.territory > maxTerritory) {
          maxTerritory = team.territory;
          winnerId = team.id;
        }
      }
      this.endRound(winnerId);
    }
  }

  private endRound(winnerId: string | null): void {
    this.roundEnded = true;
    this.events.emit('roundEnd', { winnerId });
  }

  get isRoundOver(): boolean {
    return this.roundEnded;
  }

  get timeRemaining(): number {
    return Math.max(0, this.roundTimer);
  }

  reset(): void {
    this.roundTimer = ROUND_DURATION;
    this.roundEnded = false;
  }
}
