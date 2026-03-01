import { HEX_SIZE } from '../core/Constants';

export interface AxialCoord {
  readonly q: number;
  readonly r: number;
}

export interface CubeCoord {
  readonly q: number;
  readonly r: number;
  readonly s: number;
}

const SQRT3 = Math.sqrt(3);

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseHexKey(key: string): AxialCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function axialToCube(q: number, r: number): CubeCoord {
  return { q, r, s: -q - r };
}

export function cubeToAxial(q: number, r: number, _s: number): AxialCoord {
  return { q, r };
}

export function cubeRound(q: number, r: number, s: number): CubeCoord {
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);

  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }

  return { q: rq || 0, r: rr || 0, s: rs || 0 };
}

export function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * (3 / 2) * q;
  const y = HEX_SIZE * ((SQRT3 / 2) * q + SQRT3 * r);
  return { x, y };
}

export function pixelToHex(px: number, py: number): AxialCoord {
  const q = ((2 / 3) * px) / HEX_SIZE;
  const r = ((-1 / 3) * px + (SQRT3 / 3) * py) / HEX_SIZE;
  const s = -q - r;
  const rounded = cubeRound(q, r, s);
  return { q: rounded.q, r: rounded.r };
}

export function hexDistance(a: AxialCoord, b: AxialCoord): number {
  const ac = axialToCube(a.q, a.r);
  const bc = axialToCube(b.q, b.r);
  return Math.max(
    Math.abs(ac.q - bc.q),
    Math.abs(ac.r - bc.r),
    Math.abs(ac.s - bc.s)
  );
}

// The 6 axial direction vectors for flat-top hexagons
export const HEX_DIRECTIONS: readonly AxialCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexNeighborCoords(q: number, r: number): AxialCoord[] {
  return HEX_DIRECTIONS.map((d) => ({ q: q + d.q, r: r + d.r }));
}
