import './style.css';
import { Game } from './core/Game';

function resizeCanvas(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
}

function main(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  resizeCanvas(canvas);

  window.addEventListener('resize', () => resizeCanvas(canvas));
  window.addEventListener('orientationchange', () => {
    setTimeout(() => resizeCanvas(canvas), 100);
  });

  const game = new Game(canvas);
  game.start();
}

main();
