import { HexGrid } from '../grid/HexGrid';
import { hexToPixel } from '../grid/HexCoord';
import { getHexVertices } from '../grid/HexMath';
import { Camera } from './Camera';
import { HEX_SIZE, NEUTRAL_COLOR, GRID_LINE_COLOR } from '../core/Constants';
import { hslString } from './Colors';
import { Team } from '../entities/Team';

export interface HexAnimState {
  scale: number;
  glowIntensity: number;
  flashAlpha: number;
  colorOverride: string | null;
}

export class HexRenderer {
  private hexPaths = new Map<string, Path2D>();
  private hexAnimStates = new Map<string, HexAnimState>();
  private hoverHex: string | null = null;

  buildPaths(grid: HexGrid): void {
    this.hexPaths.clear();
    grid.forEachCell((cell, key) => {
      const { x, y } = hexToPixel(cell.coord.q, cell.coord.r);
      const path = new Path2D();
      const verts = getHexVertices(x, y, HEX_SIZE * 0.96);
      path.moveTo(verts[0][0], verts[0][1]);
      for (let i = 1; i < 6; i++) path.lineTo(verts[i][0], verts[i][1]);
      path.closePath();
      this.hexPaths.set(key, path);
    });
  }

  setHover(key: string | null): void {
    this.hoverHex = key;
  }

  getAnimState(key: string): HexAnimState {
    let state = this.hexAnimStates.get(key);
    if (!state) {
      state = { scale: 1, glowIntensity: 0, flashAlpha: 0, colorOverride: null };
      this.hexAnimStates.set(key, state);
    }
    return state;
  }

  render(
    ctx: CanvasRenderingContext2D,
    grid: HexGrid,
    camera: Camera,
    teams: Map<string, Team>
  ): void {
    // Draw filled hexes
    grid.forEachCell((cell, key) => {
      const { x, y } = hexToPixel(cell.coord.q, cell.coord.r);
      if (!camera.isVisible(x, y)) return;

      const path = this.hexPaths.get(key);
      if (!path) return;

      const animState = this.hexAnimStates.get(key);

      // Determine fill color
      let fillColor: string;
      if (animState?.colorOverride) {
        fillColor = animState.colorOverride;
      } else if (cell.ownerId) {
        const team = teams.get(cell.ownerId);
        if (team) {
          fillColor = hslString(team.color.hue, team.color.saturation, team.color.lightness);
        } else {
          fillColor = NEUTRAL_COLOR;
        }
      } else {
        fillColor = NEUTRAL_COLOR;
      }

      ctx.fillStyle = fillColor;
      ctx.fill(path);

      // Hover highlight
      if (key === this.hoverHex) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill(path);
      }

      // Flash effect
      if (animState && animState.flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${animState.flashAlpha})`;
        ctx.fill(path);
      }

      // Grid lines
      ctx.strokeStyle = GRID_LINE_COLOR;
      ctx.lineWidth = 0.5;
      ctx.stroke(path);
    });

    // Draw territory border glows
    this.renderBorderGlows(ctx, grid, camera, teams);
  }

  private renderBorderGlows(
    ctx: CanvasRenderingContext2D,
    grid: HexGrid,
    camera: Camera,
    teams: Map<string, Team>
  ): void {
    grid.forEachCell((cell) => {
      if (!cell.ownerId) return;
      const { x, y } = hexToPixel(cell.coord.q, cell.coord.r);
      if (!camera.isVisible(x, y)) return;

      const team = teams.get(cell.ownerId);
      if (!team) return;

      const neighbors = grid.getNeighbors(cell.coord.q, cell.coord.r);
      const verts = getHexVertices(x, y, HEX_SIZE * 0.96);

      for (let i = 0; i < 6; i++) {
        const neighbor = neighbors.find((n) => {
          const nIdx = this.getNeighborIndex(cell.coord.q, cell.coord.r, n.coord.q, n.coord.r);
          return nIdx === i;
        });

        const isBorder =
          !neighbor || (neighbor && neighbor.ownerId !== cell.ownerId);

        if (isBorder) {
          ctx.beginPath();
          ctx.moveTo(verts[i][0], verts[i][1]);
          ctx.lineTo(verts[(i + 1) % 6][0], verts[(i + 1) % 6][1]);
          ctx.strokeStyle = team.color.neonGlow;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    });
  }

  private getNeighborIndex(q: number, r: number, nq: number, nr: number): number {
    const dq = nq - q;
    const dr = nr - r;
    const dirs = [
      [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
    ];
    for (let i = 0; i < 6; i++) {
      if (dirs[i][0] === dq && dirs[i][1] === dr) return i;
    }
    return -1;
  }
}
