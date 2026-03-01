import { TICK_DURATION } from './Constants';

export class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private running = false;
  private animationFrameId = 0;

  constructor(
    private updateFn: (dt: number) => void,
    private renderFn: (alpha: number) => void
  ) {}

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  private loop(currentTime: number): void {
    if (!this.running) return;

    const frameTime = Math.min(currentTime - this.lastTime, 250);
    this.lastTime = currentTime;
    this.accumulator += frameTime;

    while (this.accumulator >= TICK_DURATION) {
      this.updateFn(TICK_DURATION / 1000);
      this.accumulator -= TICK_DURATION;
    }

    const alpha = this.accumulator / TICK_DURATION;
    this.renderFn(alpha);

    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }
}
