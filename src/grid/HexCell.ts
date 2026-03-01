import { AxialCoord } from './HexCoord';

export interface HexCell {
  coord: AxialCoord;
  ownerId: string | null;
  capturedBy: string | null;
  capturedAt: number;
  influenceMap: Map<string, number>;
}

export function createHexCell(coord: AxialCoord): HexCell {
  return {
    coord,
    ownerId: null,
    capturedBy: null,
    capturedAt: 0,
    influenceMap: new Map(),
  };
}
