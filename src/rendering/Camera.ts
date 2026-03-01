import { MIN_ZOOM, MAX_ZOOM, CAMERA_LERP, HEX_SIZE } from '../core/Constants';

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  targetZoom = 1;
  targetX = 0;
  targetY = 0;
  viewportWidth = 0;
  viewportHeight = 0;

  update(_dt: number): void {
    this.x += (this.targetX - this.x) * CAMERA_LERP;
    this.y += (this.targetY - this.y) * CAMERA_LERP;
    this.zoom += (this.targetZoom - this.zoom) * CAMERA_LERP;
  }

  worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
    return {
      sx: (wx - this.x) * this.zoom + this.viewportWidth / 2,
      sy: (wy - this.y) * this.zoom + this.viewportHeight / 2,
    };
  }

  screenToWorld(sx: number, sy: number): { wx: number; wy: number } {
    return {
      wx: (sx - this.viewportWidth / 2) / this.zoom + this.x,
      wy: (sy - this.viewportHeight / 2) / this.zoom + this.y,
    };
  }

  isVisible(worldX: number, worldY: number): boolean {
    const screen = this.worldToScreen(worldX, worldY);
    const margin = HEX_SIZE * this.zoom * 2;
    return (
      screen.sx > -margin &&
      screen.sx < this.viewportWidth + margin &&
      screen.sy > -margin &&
      screen.sy < this.viewportHeight + margin
    );
  }

  adjustZoom(delta: number): void {
    this.targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.targetZoom + delta));
  }

  setViewport(w: number, h: number): void {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }
}
