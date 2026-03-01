import { Camera } from '../rendering/Camera';
import { pixelToHex, AxialCoord, hexKey } from '../grid/HexCoord';

export type HexClickHandler = (coord: AxialCoord) => void;
export type HexHoverHandler = (key: string | null) => void;

export class InputManager {
  private isDragging = false;
  private lastPos = { x: 0, y: 0 };
  private dragStartPos = { x: 0, y: 0 };
  private pinchStartDist = 0;
  private pinchStartZoom = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    private camera: Camera,
    private onHexClick: HexClickHandler,
    private onHexHover: HexHoverHandler
  ) {
    this.bindMouse();
    this.bindTouch();
  }

  private bindMouse(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = false;
      this.lastPos = { x: e.clientX, y: e.clientY };
      this.dragStartPos = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (e.buttons & 1) {
        const dx = e.clientX - this.lastPos.x;
        const dy = e.clientY - this.lastPos.y;
        this.camera.targetX -= dx / this.camera.zoom;
        this.camera.targetY -= dy / this.camera.zoom;
        this.lastPos = { x: e.clientX, y: e.clientY };

        const totalDrag =
          Math.abs(e.clientX - this.dragStartPos.x) +
          Math.abs(e.clientY - this.dragStartPos.y);
        if (totalDrag > 5) this.isDragging = true;
      }

      // Hover
      const world = this.camera.screenToWorld(e.clientX, e.clientY);
      const hex = pixelToHex(world.wx, world.wy);
      this.onHexHover(hexKey(hex.q, hex.r));
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (!this.isDragging) {
        const world = this.camera.screenToWorld(e.clientX, e.clientY);
        const hex = pixelToHex(world.wx, world.wy);
        this.onHexClick(hex);
      }
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.camera.adjustZoom(delta);
    }, { passive: false });

    this.canvas.addEventListener('mouseleave', () => {
      this.onHexHover(null);
    });
  }

  private bindTouch(): void {
    let lastTouchPos: { x: number; y: number } | null = null;
    let isTapping = false;
    let touchStartTime = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.dragStartPos = { ...lastTouchPos };
        touchStartTime = performance.now();
        isTapping = true;
      } else if (e.touches.length === 2) {
        isTapping = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
        this.pinchStartZoom = this.camera.zoom;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && lastTouchPos) {
        const dx = e.touches[0].clientX - lastTouchPos.x;
        const dy = e.touches[0].clientY - lastTouchPos.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isTapping = false;
        this.camera.targetX -= dx / this.camera.zoom;
        this.camera.targetY -= dy / this.camera.zoom;
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const zoomDelta = dist / this.pinchStartDist;
        this.camera.targetZoom = Math.max(0.3, Math.min(3.0, this.pinchStartZoom * zoomDelta));
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      if (isTapping && lastTouchPos) {
        const elapsed = performance.now() - touchStartTime;
        if (elapsed < 300) {
          const world = this.camera.screenToWorld(lastTouchPos.x, lastTouchPos.y);
          const hex = pixelToHex(world.wx, world.wy);
          this.onHexClick(hex);
        }
      }
      if (e.touches.length === 0) {
        lastTouchPos = null;
        isTapping = false;
      }
    }, { passive: false });
  }
}
