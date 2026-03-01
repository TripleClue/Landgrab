import { HexGrid } from '../grid/HexGrid';
import { hexToPixel } from '../grid/HexCoord';
import { Team } from '../entities/Team';
import { Camera } from '../rendering/Camera';
import { hslString } from '../rendering/Colors';
import { HEX_SIZE, NEUTRAL_COLOR } from '../core/Constants';

export class Minimap {
  private size = 140;
  private padding = 10;

  render(
    ctx: CanvasRenderingContext2D,
    grid: HexGrid,
    teams: Map<string, Team>,
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const x = canvasWidth - this.size - this.padding;
    const y = canvasHeight - this.size - this.padding;

    // Background
    ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
    ctx.fillRect(x - 2, y - 2, this.size + 4, this.size + 4);

    // Calculate scale to fit grid in minimap
    const gridPixelSize = HEX_SIZE * (grid.radius * 2 + 1) * 1.5;
    const scale = this.size / gridPixelSize;
    const centerX = x + this.size / 2;
    const centerY = y + this.size / 2;

    // Draw cells as dots
    grid.forEachCell((cell) => {
      const { x: wx, y: wy } = hexToPixel(cell.coord.q, cell.coord.r);
      const mx = centerX + wx * scale;
      const my = centerY + wy * scale;

      if (cell.ownerId) {
        const team = teams.get(cell.ownerId);
        if (team) {
          ctx.fillStyle = hslString(team.color.hue, team.color.saturation, team.color.lightness);
        } else {
          ctx.fillStyle = NEUTRAL_COLOR;
        }
      } else {
        ctx.fillStyle = 'rgba(34, 34, 51, 0.5)';
      }

      ctx.fillRect(mx - 1, my - 1, 2, 2);
    });

    // Draw viewport indicator
    const vpLeft = camera.x - camera.viewportWidth / (2 * camera.zoom);
    const vpTop = camera.y - camera.viewportHeight / (2 * camera.zoom);
    const vpWidth = camera.viewportWidth / camera.zoom;
    const vpHeight = camera.viewportHeight / camera.zoom;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      centerX + vpLeft * scale,
      centerY + vpTop * scale,
      vpWidth * scale,
      vpHeight * scale
    );

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(x - 2, y - 2, this.size + 4, this.size + 4);
  }
}
