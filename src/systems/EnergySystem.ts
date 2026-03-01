import { Player } from '../entities/Player';
import { FOCUS_REGEN_MULTIPLIER, OVERCLOCK_MAX_BONUS, OVERCLOCK_DECAY } from '../core/Constants';

export class EnergySystem {
  private tabFocused = true;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.tabFocused = !document.hidden;
      });
    }
  }

  update(players: Map<string, Player>, dt: number): void {
    for (const player of players.values()) {
      // Base regen
      let regenRate = player.energyRegenRate;

      // Focus bonus
      if (this.tabFocused && !player.isBot) {
        regenRate *= FOCUS_REGEN_MULTIPLIER;
      }

      // Overclock bonus
      if (player.comboMeter > 0) {
        regenRate *= 1 + player.comboMeter * OVERCLOCK_MAX_BONUS;
        player.comboMeter = Math.max(0, player.comboMeter - OVERCLOCK_DECAY * dt);
      }

      player.energy = Math.min(player.maxEnergy, player.energy + regenRate * dt);
    }
  }
}
