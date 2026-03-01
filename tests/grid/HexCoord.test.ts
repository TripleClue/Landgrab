import { describe, it, expect } from 'vitest';
import {
  hexKey,
  parseHexKey,
  axialToCube,
  hexToPixel,
  pixelToHex,
  hexDistance,
  hexNeighborCoords,
} from '../../src/grid/HexCoord';

describe('HexCoord', () => {
  it('hexKey produces correct string', () => {
    expect(hexKey(3, -2)).toBe('3,-2');
    expect(hexKey(0, 0)).toBe('0,0');
    expect(hexKey(-5, 10)).toBe('-5,10');
  });

  it('parseHexKey reverses hexKey', () => {
    const coord = parseHexKey('3,-2');
    expect(coord.q).toBe(3);
    expect(coord.r).toBe(-2);
  });

  it('axialToCube satisfies q+r+s=0', () => {
    const cube = axialToCube(3, -2);
    expect(cube.q + cube.r + cube.s).toBe(0);
  });

  it('hexToPixel and pixelToHex roundtrip', () => {
    const coords = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -3, r: 5 },
      { q: 10, r: -7 },
    ];
    for (const { q, r } of coords) {
      const pixel = hexToPixel(q, r);
      const back = pixelToHex(pixel.x, pixel.y);
      expect(back.q).toBe(q);
      expect(back.r).toBe(r);
    }
  });

  it('hexDistance returns correct values', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: -3 })).toBe(3);
  });

  it('hexNeighborCoords returns 6 neighbors', () => {
    const neighbors = hexNeighborCoords(0, 0);
    expect(neighbors).toHaveLength(6);
    // All neighbors should be distance 1
    for (const n of neighbors) {
      expect(hexDistance({ q: 0, r: 0 }, n)).toBe(1);
    }
  });
});
