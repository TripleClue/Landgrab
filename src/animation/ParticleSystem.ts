import { MAX_PARTICLES } from '../core/Constants';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  friction: number;
  alpha: number;
}

export interface EmitterConfig {
  x: number;
  y: number;
  count: number;
  speed: number;
  spread: number;
  size: number;
  sizeVariance: number;
  lifetime: number;
  lifetimeVariance: number;
  color: string;
  gravity?: number;
  friction?: number;
}

function createParticle(): Particle {
  return {
    x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 0, size: 0,
    color: '#fff', gravity: 0, friction: 0.98, alpha: 1,
  };
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];

  constructor() {
    for (let i = 0; i < 200; i++) {
      this.pool.push(createParticle());
    }
  }

  emit(config: EmitterConfig): void {
    for (let i = 0; i < config.count; i++) {
      if (this.particles.length >= MAX_PARTICLES) return;

      let p: Particle;
      if (this.pool.length > 0) {
        p = this.pool.pop()!;
      } else {
        p = createParticle();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = config.speed * (0.5 + Math.random() * 0.5);

      p.x = config.x + (Math.random() - 0.5) * config.spread;
      p.y = config.y + (Math.random() - 0.5) * config.spread;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = config.lifetime + (Math.random() - 0.5) * config.lifetimeVariance;
      p.maxLife = p.life;
      p.size = config.size + (Math.random() - 0.5) * config.sizeVariance;
      p.color = config.color;
      p.gravity = config.gravity ?? 0;
      p.friction = config.friction ?? 0.98;
      p.alpha = 1;

      this.particles.push(p);
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.pool.push(p);
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = p.life / p.maxLife;
      p.size *= 0.998;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha * 0.8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  get count(): number {
    return this.particles.length;
  }
}
