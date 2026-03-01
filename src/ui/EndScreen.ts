import { Team } from '../entities/Team';
import { Player } from '../entities/Player';
import { hslString } from '../rendering/Colors';

export class EndScreen {
  private overlay: HTMLDivElement | null = null;
  private onRestart: (() => void) | null = null;

  setRestartHandler(handler: () => void): void {
    this.onRestart = handler;
  }

  show(
    winner: Team | null,
    player: Player,
    teams: Map<string, Team>
  ): void {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 100;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(13, 13, 26, 0.9);
      animation: fadeIn 0.5s ease;
    `;

    const winnerColor = winner
      ? hslString(winner.color.hue, winner.color.saturation, winner.color.lightness)
      : '#fff';

    const sorted = Array.from(teams.values()).sort(
      (a, b) => b.territory - a.territory
    );

    const teamRows = sorted
      .map((t) => {
        const color = hslString(t.color.hue, t.color.saturation, t.color.lightness);
        const isWinner = winner && t.id === winner.id;
        return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;${isWinner ? 'font-weight:bold;' : ''}">
          <div style="width:12px;height:12px;border-radius:50%;background:${color}"></div>
          <span style="color:#ddd;flex:1">${t.name}</span>
          <span style="color:#999">${t.territory} hexes</span>
        </div>`;
      })
      .join('');

    this.overlay.innerHTML = `
      <div style="text-align:center;max-width:400px;padding:30px;">
        <h1 style="color:${winnerColor};font-size:32px;margin-bottom:8px;font-family:Inter,sans-serif">
          ${winner ? winner.name + ' Wins!' : 'Round Over!'}
        </h1>
        <p style="color:#999;margin-bottom:20px;font-family:Inter,sans-serif">
          You captured ${player.hexesCaptured} hexes
        </p>
        <div style="background:rgba(30,30,50,0.8);border-radius:12px;padding:16px;margin-bottom:24px;text-align:left;">
          ${teamRows}
        </div>
        <button id="restart-btn" style="
          padding:14px 40px;background:#00d4d4;color:#0d0d1a;
          border:none;border-radius:8px;font-size:18px;font-weight:bold;
          cursor:pointer;font-family:Inter,sans-serif;
        ">Play Again</button>
      </div>
    `;

    // Add fade-in keyframe
    if (!document.getElementById('fade-style')) {
      const style = document.createElement('style');
      style.id = 'fade-style';
      style.textContent = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
      document.head.appendChild(style);
    }

    document.body.appendChild(this.overlay);

    this.overlay.querySelector('#restart-btn')!.addEventListener('click', () => {
      this.hide();
      this.onRestart?.();
    });
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
