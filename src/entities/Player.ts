import { MAX_ENERGY, ENERGY_REGEN_RATE, REVOLUTION_BASE_THRESHOLD } from '../core/Constants';

export interface Player {
  id: string;
  name: string;
  teamId: string;
  energy: number;
  maxEnergy: number;
  energyRegenRate: number;
  influence: number;
  revolutionThreshold: number;
  hexesCaptured: number;
  comboMeter: number;
  isChannelingRevolution: boolean;
  revolutionProgress: number;
  isBot: boolean;
  isEliminated: boolean;
}

export function createPlayer(
  id: string,
  name: string,
  teamId: string,
  isBot: boolean
): Player {
  return {
    id,
    name,
    teamId,
    energy: MAX_ENERGY,
    maxEnergy: MAX_ENERGY,
    energyRegenRate: ENERGY_REGEN_RATE,
    influence: 0,
    revolutionThreshold: REVOLUTION_BASE_THRESHOLD,
    hexesCaptured: 0,
    comboMeter: 0,
    isChannelingRevolution: false,
    revolutionProgress: 0,
    isBot,
    isEliminated: false,
  };
}
