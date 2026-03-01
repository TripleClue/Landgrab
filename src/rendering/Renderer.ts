import { HexGrid } from '../grid/HexGrid';
import { Camera } from './Camera';
import { HexRenderer } from './HexRenderer';
import { ParticleSystem } from '../animation/ParticleSystem';
import { Team } from '../entities/Team';
import { BG_COLOR } from '../core/Constants';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  hexRenderer: HexRenderer;
  particles: ParticleSystem;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.hexRenderer = new HexRenderer();
    this.particles = new ParticleSystem();
  }

  render(
    grid: HexGrid,
    camera: Camera,
    teams: Map<string, Team>,
    _alpha: number
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Apply camera transform
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Draw hex grid
    this.hexRenderer.render(ctx, grid, camera, teams);

    // Draw particles
    this.particles.render(ctx);

    ctx.restore();
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
