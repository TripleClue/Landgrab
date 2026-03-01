import { AxialCoord, hexKey, hexNeighborCoords } from './HexCoord';
import { HexCell, createHexCell } from './HexCell';

export class HexGrid {
  private cells: Map<string, HexCell> = new Map();
  readonly radius: number;

  constructor(radius: number) {
    this.radius = radius;
    this.build();
  }

  private build(): void {
    for (let q = -this.radius; q <= this.radius; q++) {
      const r1 = Math.max(-this.radius, -q - this.radius);
      const r2 = Math.min(this.radius, -q + this.radius);
      for (let r = r1; r <= r2; r++) {
        const key = hexKey(q, r);
        this.cells.set(key, createHexCell({ q, r }));
      }
    }
  }

  getCell(q: number, r: number): HexCell | undefined {
    return this.cells.get(hexKey(q, r));
  }

  getCellByKey(key: string): HexCell | undefined {
    return this.cells.get(key);
  }

  hasCell(q: number, r: number): boolean {
    return this.cells.has(hexKey(q, r));
  }

  getNeighbors(q: number, r: number): HexCell[] {
    const result: HexCell[] = [];
    for (const nc of hexNeighborCoords(q, r)) {
      const cell = this.cells.get(hexKey(nc.q, nc.r));
      if (cell) result.push(cell);
    }
    return result;
  }

  getConnectedGroup(q: number, r: number, teamId: string): Set<string> {
    const group = new Set<string>();
    const startKey = hexKey(q, r);
    const startCell = this.cells.get(startKey);
    if (!startCell || startCell.ownerId !== teamId) return group;

    const queue: AxialCoord[] = [{ q, r }];
    group.add(startKey);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of this.getNeighbors(current.q, current.r)) {
        const nKey = hexKey(neighbor.coord.q, neighbor.coord.r);
        if (group.has(nKey)) continue;
        if (neighbor.ownerId !== teamId) continue;
        group.add(nKey);
        queue.push(neighbor.coord);
      }
    }

    return group;
  }

  getCellsOwnedBy(teamId: string): HexCell[] {
    const result: HexCell[] = [];
    for (const cell of this.cells.values()) {
      if (cell.ownerId === teamId) result.push(cell);
    }
    return result;
  }

  forEachCell(fn: (cell: HexCell, key: string) => void): void {
    this.cells.forEach((cell, key) => fn(cell, key));
  }

  get totalCells(): number {
    return this.cells.size;
  }

  getAllKeys(): string[] {
    return Array.from(this.cells.keys());
  }
}
