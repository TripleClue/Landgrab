import { Easing } from './Easing';

export class Tween {
  startValue = 0;
  endValue = 0;
  duration = 0;
  elapsed = 0;
  easingFn: (t: number) => number = Easing.linear;
  onUpdate: (value: number) => void = () => {};
  onComplete: (() => void) | null = null;
  isActive = false;

  init(
    start: number,
    end: number,
    duration: number,
    easing: (t: number) => number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ): void {
    this.startValue = start;
    this.endValue = end;
    this.duration = duration;
    this.elapsed = 0;
    this.easingFn = easing;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete ?? null;
    this.isActive = true;
  }

  update(dt: number): boolean {
    if (!this.isActive) return false;
    this.elapsed += dt * 1000;
    const t = Math.min(this.elapsed / this.duration, 1);
    const easedT = this.easingFn(t);
    const value = this.startValue + (this.endValue - this.startValue) * easedT;
    this.onUpdate(value);
    if (t >= 1) {
      this.onComplete?.();
      this.isActive = false;
      return false;
    }
    return true;
  }
}

export class TweenManager {
  private tweens: Tween[] = [];

  add(
    start: number,
    end: number,
    duration: number,
    easing: (t: number) => number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ): Tween {
    const tween = new Tween();
    tween.init(start, end, duration, easing, onUpdate, onComplete);
    this.tweens.push(tween);
    return tween;
  }

  update(dt: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      if (!this.tweens[i].update(dt)) {
        this.tweens.splice(i, 1);
      }
    }
  }

  get activeCount(): number {
    return this.tweens.length;
  }
}
