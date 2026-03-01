export interface TeamColor {
  hue: number;
  saturation: number;
  lightness: number;
  neonGlow: string;
  hex: string;
}

export interface Team {
  id: string;
  name: string;
  color: TeamColor;
  members: Set<string>;
  territory: number;
  isOriginal: boolean;
  foundedAt: number;
  foundedBy: string | null;
}

export function createTeam(
  id: string,
  name: string,
  color: TeamColor,
  isOriginal: boolean,
  foundedBy: string | null = null
): Team {
  return {
    id,
    name,
    color,
    members: new Set(),
    territory: 0,
    isOriginal,
    foundedAt: Date.now(),
    foundedBy,
  };
}
