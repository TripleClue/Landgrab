import { HexGrid } from '../grid/HexGrid';
import { Team } from '../entities/Team';
import { Player } from '../entities/Player';
import { GRID_RADIUS } from './Constants';

export type GamePhase = 'playing' | 'ending' | 'results';

export interface GameState {
  grid: HexGrid;
  teams: Map<string, Team>;
  players: Map<string, Player>;
  phase: GamePhase;
  tickNumber: number;
  winnerId: string | null;
}

export function createGameState(): GameState {
  return {
    grid: new HexGrid(GRID_RADIUS),
    teams: new Map(),
    players: new Map(),
    phase: 'playing',
    tickNumber: 0,
    winnerId: null,
  };
}
