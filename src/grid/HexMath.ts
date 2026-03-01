import { AxialCoord, HEX_DIRECTIONS } from './HexCoord';

export function getHexVertices(
  cx: number,
  cy: number,
  size: number
): [number, number][] {
  const vertices: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    vertices.push([cx + size * Math.cos(angleRad), cy + size * Math.sin(angleRad)]);
  }
  return vertices;
}

export function hexRing(center: AxialCoord, radius: number): AxialCoord[] {
  if (radius === 0) return [center];
  const results: AxialCoord[] = [];
  let q = center.q + HEX_DIRECTIONS[4].q * radius;
  let r = center.r + HEX_DIRECTIONS[4].r * radius;

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push({ q, r });
      q += HEX_DIRECTIONS[i].q;
      r += HEX_DIRECTIONS[i].r;
    }
  }
  return results;
}

export function hexRange(center: AxialCoord, radius: number): AxialCoord[] {
  const results: AxialCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
}
