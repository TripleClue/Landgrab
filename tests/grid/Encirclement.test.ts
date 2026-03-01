import { describe, it, expect } from 'vitest';
import { HexGrid } from '../../src/grid/HexGrid';
import { checkEncirclements } from '../../src/grid/Encirclement';
import { hexNeighborCoords } from '../../src/grid/HexCoord';

describe('Encirclement', () => {
  it('detects simple single-hex encirclement', () => {
    const grid = new HexGrid(5);
    const attacker = 'team_a';
    const defender = 'team_b';

    // Place a single defender hex at 0,0
    grid.getCell(0, 0)!.ownerId = defender;

    // Surround with attacker hexes (all 6 neighbors)
    const neighbors = hexNeighborCoords(0, 0);
    for (const n of neighbors) {
      const cell = grid.getCell(n.q, n.r);
      if (cell) cell.ownerId = attacker;
    }

    // Check from the last placed hex
    const lastNeighbor = neighbors[5];
    const results = checkEncirclements(grid, lastNeighbor, attacker);

    expect(results).toHaveLength(1);
    expect(results[0].size).toBe(1);
    expect(results[0].previousOwner).toBe(defender);
    expect(results[0].newOwner).toBe(attacker);
  });

  it('does not trigger encirclement with escape route', () => {
    const grid = new HexGrid(5);
    const attacker = 'team_a';
    const defender = 'team_b';

    grid.getCell(0, 0)!.ownerId = defender;

    // Surround with attacker hexes but leave one gap (neutral)
    const neighbors = hexNeighborCoords(0, 0);
    for (let i = 0; i < 5; i++) {
      const cell = grid.getCell(neighbors[i].q, neighbors[i].r);
      if (cell) cell.ownerId = attacker;
    }
    // Last neighbor is left neutral (escape route)

    const results = checkEncirclements(grid, neighbors[4], attacker);
    expect(results).toHaveLength(0);
  });

  it('detects multi-hex group encirclement', () => {
    const grid = new HexGrid(5);
    const attacker = 'team_a';
    const defender = 'team_b';

    // Place two connected defender hexes
    grid.getCell(0, 0)!.ownerId = defender;
    grid.getCell(1, 0)!.ownerId = defender;

    // Surround both with attacker hexes
    // Get all unique neighbors of both cells that aren't defenders
    const toCapture = new Set<string>();
    for (const center of [{ q: 0, r: 0 }, { q: 1, r: 0 }]) {
      for (const n of hexNeighborCoords(center.q, center.r)) {
        const cell = grid.getCell(n.q, n.r);
        if (cell && cell.ownerId !== defender) {
          toCapture.add(`${n.q},${n.r}`);
        }
      }
    }

    let lastCoord = { q: 0, r: 0 };
    for (const key of toCapture) {
      const [q, r] = key.split(',').map(Number);
      const cell = grid.getCell(q, r);
      if (cell) {
        cell.ownerId = attacker;
        lastCoord = { q, r };
      }
    }

    const results = checkEncirclements(grid, lastCoord, attacker);
    expect(results).toHaveLength(1);
    expect(results[0].size).toBe(2);
  });

  it('does not false-positive on own team', () => {
    const grid = new HexGrid(5);
    const team = 'team_a';

    // Fill center and all neighbors with the same team
    grid.getCell(0, 0)!.ownerId = team;
    for (const n of hexNeighborCoords(0, 0)) {
      const cell = grid.getCell(n.q, n.r);
      if (cell) cell.ownerId = team;
    }

    const results = checkEncirclements(grid, { q: 0, r: 1 }, team);
    expect(results).toHaveLength(0);
  });

  it('edge group cannot be encircled (boundary is neutral)', () => {
    const grid = new HexGrid(3);
    const attacker = 'team_a';
    const defender = 'team_b';

    // Place defender at grid edge
    grid.getCell(3, -3)!.ownerId = defender;

    // Surround all in-grid neighbors with attacker
    const neighbors = grid.getNeighbors(3, -3);
    for (const n of neighbors) {
      n.ownerId = attacker;
    }

    const results = checkEncirclements(
      grid,
      neighbors[0].coord,
      attacker
    );

    // Should NOT be encircled because boundary positions are treated as neutral (escape route)
    expect(results).toHaveLength(0);
  });
});
