import { describe, it, expect } from 'vitest';
import { HexGrid } from '../../src/grid/HexGrid';

describe('HexGrid', () => {
  it('constructs correct number of cells for given radius', () => {
    // Formula: 3*r^2 + 3*r + 1
    const grid = new HexGrid(5);
    expect(grid.totalCells).toBe(3 * 25 + 3 * 5 + 1); // 91
  });

  it('has center cell at 0,0', () => {
    const grid = new HexGrid(3);
    const cell = grid.getCell(0, 0);
    expect(cell).toBeDefined();
    expect(cell!.coord.q).toBe(0);
    expect(cell!.coord.r).toBe(0);
  });

  it('does not have cells outside radius', () => {
    const grid = new HexGrid(3);
    expect(grid.getCell(4, 0)).toBeUndefined();
    expect(grid.getCell(0, 4)).toBeUndefined();
  });

  it('getNeighbors returns correct neighbors', () => {
    const grid = new HexGrid(5);
    const neighbors = grid.getNeighbors(0, 0);
    expect(neighbors).toHaveLength(6);
  });

  it('edge cells have fewer neighbors', () => {
    const grid = new HexGrid(2);
    // Corner cell at (2, -2) should have fewer than 6 neighbors
    const neighbors = grid.getNeighbors(2, -2);
    expect(neighbors.length).toBeLessThan(6);
  });

  it('getConnectedGroup finds connected territory', () => {
    const grid = new HexGrid(5);
    const teamId = 'team_a';

    // Create a connected region
    grid.getCell(0, 0)!.ownerId = teamId;
    grid.getCell(1, 0)!.ownerId = teamId;
    grid.getCell(0, 1)!.ownerId = teamId;

    const group = grid.getConnectedGroup(0, 0, teamId);
    expect(group.size).toBe(3);
  });

  it('getConnectedGroup does not cross team boundaries', () => {
    const grid = new HexGrid(5);

    grid.getCell(0, 0)!.ownerId = 'team_a';
    grid.getCell(1, 0)!.ownerId = 'team_b';
    grid.getCell(0, 1)!.ownerId = 'team_a';

    const group = grid.getConnectedGroup(0, 0, 'team_a');
    // 0,1 is not connected to 0,0 via team_a because 1,0 is team_b
    // But 0,0 and 0,1 are neighbors directly (direction 0,1), so they should be connected
    expect(group.size).toBe(2);
  });

  it('getCellsOwnedBy returns correct cells', () => {
    const grid = new HexGrid(3);
    grid.getCell(0, 0)!.ownerId = 'team_a';
    grid.getCell(1, 0)!.ownerId = 'team_a';
    grid.getCell(-1, 0)!.ownerId = 'team_b';

    expect(grid.getCellsOwnedBy('team_a')).toHaveLength(2);
    expect(grid.getCellsOwnedBy('team_b')).toHaveLength(1);
    expect(grid.getCellsOwnedBy('team_c')).toHaveLength(0);
  });
});
