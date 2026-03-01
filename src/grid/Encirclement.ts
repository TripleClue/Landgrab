import { AxialCoord, hexKey, hexNeighborCoords } from './HexCoord';
import { HexGrid } from './HexGrid';

export interface EncirclementResult {
  capturedGroup: Set<string>;
  previousOwner: string;
  newOwner: string;
  size: number;
}

export function checkEncirclements(
  grid: HexGrid,
  capturedCoord: AxialCoord,
  capturingTeamId: string
): EncirclementResult[] {
  const results: EncirclementResult[] = [];
  const checked = new Set<string>();
  const neighbors = grid.getNeighbors(capturedCoord.q, capturedCoord.r);

  for (const neighbor of neighbors) {
    if (neighbor.ownerId === null || neighbor.ownerId === capturingTeamId) continue;

    const key = hexKey(neighbor.coord.q, neighbor.coord.r);
    if (checked.has(key)) continue;

    const group = findConnectedGroup(grid, neighbor.coord, neighbor.ownerId);
    for (const cellKey of group) checked.add(cellKey);

    const hasEscape = checkGroupHasEscape(grid, group, capturingTeamId);

    if (!hasEscape) {
      results.push({
        capturedGroup: group,
        previousOwner: neighbor.ownerId,
        newOwner: capturingTeamId,
        size: group.size,
      });
    }
  }

  return results;
}

function findConnectedGroup(
  grid: HexGrid,
  start: AxialCoord,
  teamId: string
): Set<string> {
  const group = new Set<string>();
  const queue: AxialCoord[] = [start];
  group.add(hexKey(start.q, start.r));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = grid.getNeighbors(current.q, current.r);

    for (const neighbor of neighbors) {
      const nKey = hexKey(neighbor.coord.q, neighbor.coord.r);
      if (group.has(nKey)) continue;
      if (neighbor.ownerId !== teamId) continue;
      group.add(nKey);
      queue.push(neighbor.coord);
    }
  }

  return group;
}

function checkGroupHasEscape(
  grid: HexGrid,
  group: Set<string>,
  capturingTeamId: string
): boolean {
  for (const cellKey of group) {
    const [q, r] = cellKey.split(',').map(Number);
    // Check all potential neighbor positions, including off-grid
    const neighborCoords = hexNeighborCoords(q, r);

    for (const nc of neighborCoords) {
      const nKey = hexKey(nc.q, nc.r);
      if (group.has(nKey)) continue;

      const neighbor = grid.getCell(nc.q, nc.r);
      // If a neighbor is off-grid (outside the map boundary) we treat the
      // boundary as neutral, meaning the group has an escape route
      if (!neighbor) return true;

      if (neighbor.ownerId !== capturingTeamId) {
        return true;
      }
    }
  }

  return false;
}
