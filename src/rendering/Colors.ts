import { TeamColor } from '../entities/Team';

export const STARTING_COLORS: TeamColor[] = [
  {
    hue: 180,
    saturation: 90,
    lightness: 55,
    neonGlow: '#00ffff',
    hex: '#00d4d4',
  },
  {
    hue: 300,
    saturation: 90,
    lightness: 55,
    neonGlow: '#ff00ff',
    hex: '#d400d4',
  },
];

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hslString(h: number, s: number, l: number, a = 1): string {
  if (a < 1) return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function generateTeamColor(existingColors: TeamColor[]): TeamColor {
  const existingHues = existingColors.map((c) => c.hue);
  let bestHue = 0;
  let bestMinDist = 0;

  for (let candidateHue = 0; candidateHue < 360; candidateHue += 5) {
    let minDist = 360;
    for (const existingHue of existingHues) {
      const dist = Math.min(
        Math.abs(candidateHue - existingHue),
        360 - Math.abs(candidateHue - existingHue)
      );
      minDist = Math.min(minDist, dist);
    }
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      bestHue = candidateHue;
    }
  }

  const saturation = 80 + Math.random() * 15;
  const lightness = 50 + Math.random() * 10;

  return {
    hue: bestHue,
    saturation,
    lightness,
    neonGlow: `hsl(${bestHue}, 100%, 65%)`,
    hex: hslToHex(bestHue, saturation, lightness),
  };
}

export function colorLerp(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
