import { describe, it, expect } from 'vitest';
import { HexGrid } from '../../src/grid/HexGrid';
import { CaptureSystem } from '../../src/systems/CaptureSystem';
import { EventBus } from '../../src/core/EventBus';
import { createPlayer } from '../../src/entities/Player';
import { createTeam } from '../../src/entities/Team';
import { STARTING_COLORS } from '../../src/rendering/Colors';
import { ENERGY_COST_CLAIM } from '../../src/core/Constants';

function createTestSetup() {
  const events = new EventBus();
  const captureSystem = new CaptureSystem(events);
  const grid = new HexGrid(5);
  const teams = new Map();

  const team = createTeam('team_a', 'Alpha', STARTING_COLORS[0], true);
  teams.set('team_a', team);

  const player = createPlayer('player_1', 'Test', 'team_a', false);
  team.members.add(player.id);

  return { events, captureSystem, grid, teams, team, player };
}

describe('CaptureSystem', () => {
  it('allows first capture anywhere when team has no territory', () => {
    const { captureSystem, grid, player, teams } = createTestSetup();
    const result = captureSystem.capture(grid, { q: 0, r: 0 }, player, teams);
    expect(result).toBe(true);
    expect(grid.getCell(0, 0)!.ownerId).toBe('team_a');
  });

  it('deducts energy on capture', () => {
    const { captureSystem, grid, player, teams } = createTestSetup();
    const initialEnergy = player.energy;
    captureSystem.capture(grid, { q: 0, r: 0 }, player, teams);
    expect(player.energy).toBe(initialEnergy - ENERGY_COST_CLAIM);
  });

  it('requires adjacency after first capture', () => {
    const { captureSystem, grid, player, teams } = createTestSetup();
    captureSystem.capture(grid, { q: 0, r: 0 }, player, teams);

    // Adjacent hex should work
    const adjacent = captureSystem.capture(grid, { q: 1, r: 0 }, player, teams);
    expect(adjacent).toBe(true);

    // Non-adjacent hex should fail
    const nonAdjacent = captureSystem.capture(grid, { q: 3, r: 3 }, player, teams);
    expect(nonAdjacent).toBe(false);
  });

  it('prevents capture when energy is too low', () => {
    const { captureSystem, grid, player, teams } = createTestSetup();
    player.energy = 5; // Below ENERGY_COST_CLAIM
    const result = captureSystem.capture(grid, { q: 0, r: 0 }, player, teams);
    expect(result).toBe(false);
  });

  it('cannot capture own territory', () => {
    const { captureSystem, grid, player, teams } = createTestSetup();
    captureSystem.capture(grid, { q: 0, r: 0 }, player, teams);
    const result = captureSystem.capture(grid, { q: 0, r: 0 }, player, teams);
    expect(result).toBe(false);
  });

  it('updates territory counts', () => {
    const { captureSystem, grid, player, teams, team } = createTestSetup();
    expect(team.territory).toBe(0);
    captureSystem.capture(grid, { q: 0, r: 0 }, player, teams);
    expect(team.territory).toBe(1);
    captureSystem.capture(grid, { q: 1, r: 0 }, player, teams);
    expect(team.territory).toBe(2);
  });

  it('emits hexCaptured event', () => {
    const { captureSystem, grid, player, teams, events } = createTestSetup();
    let emitted = false;
    events.on('hexCaptured', () => {
      emitted = true;
    });
    captureSystem.capture(grid, { q: 0, r: 0 }, player, teams);
    expect(emitted).toBe(true);
  });
});
