import { AxialCoord } from '../grid/HexCoord';
import { EncirclementResult } from '../grid/Encirclement';

export interface GameEvents {
  hexCaptured: { coord: AxialCoord; playerId: string; teamId: string };
  encirclement: EncirclementResult;
  pulseTriggered: { tick: number };
  revolutionStarted: { playerId: string; newTeamId: string };
  revolutionCompleted: { playerId: string; newTeamId: string; hexCount: number };
  teamEliminated: { teamId: string };
  roundEnd: { winnerId: string | null };
}

type Handler<T> = (data: T) => void;

export class EventBus {
  private handlers = new Map<string, Handler<unknown>[]>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler as Handler<unknown>);
  }

  off<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    const list = this.handlers.get(event);
    if (!list) return;
    const idx = list.indexOf(handler as Handler<unknown>);
    if (idx >= 0) list.splice(idx, 1);
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const list = this.handlers.get(event);
    if (!list) return;
    for (const handler of list) {
      handler(data);
    }
  }
}
