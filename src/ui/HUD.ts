import { Player } from '../entities/Player';
import { Team } from '../entities/Team';
import { hslString } from '../rendering/Colors';
import { AudioManager } from '../audio/AudioManager';

export class HUD {
  private muteButton: HTMLButtonElement;
  private revolutionButton: HTMLButtonElement | null = null;
  private onRevolution: (() => void) | null = null;

  constructor(private audio: AudioManager) {
    // Create mute button
    this.muteButton = document.createElement('button');
    this.muteButton.textContent = '♪';
    this.muteButton.style.cssText = `
      position: fixed; top: 10px; right: 10px;
      width: 36px; height: 36px;
      background: rgba(30, 30, 50, 0.8); color: #fff;
      border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;
      font-size: 18px; cursor: pointer; z-index: 10;
      display: flex; align-items: center; justify-content: center;
    `;
    this.muteButton.addEventListener('click', () => {
      const muted = this.audio.toggleMute();
      this.muteButton.textContent = muted ? '✕' : '♪';
    });
    document.body.appendChild(this.muteButton);
  }

  setRevolutionHandler(handler: () => void): void {
    this.onRevolution = handler;
  }

  render(
    ctx: CanvasRenderingContext2D,
    player: Player,
    teams: Map<string, Team>,
    roundTimer: number,
    pulseTimer: number,
    canvasWidth: number,
    _canvasHeight: number
  ): void {
    // Energy bar
    this.drawEnergyBar(ctx, player, 20, 20);

    // Round timer
    this.drawTimer(ctx, roundTimer, canvasWidth);

    // Pulse countdown
    this.drawPulseTimer(ctx, pulseTimer, canvasWidth);

    // Team scoreboard
    this.drawTeamPanel(ctx, teams, canvasWidth);

    // Revolution indicator
    this.drawRevolutionIndicator(ctx, player);
  }

  private drawEnergyBar(
    ctx: CanvasRenderingContext2D,
    player: Player,
    x: number,
    y: number
  ): void {
    const barWidth = 200;
    const barHeight = 20;
    const fillWidth = (player.energy / player.maxEnergy) * barWidth;

    // Background
    ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    // Fill
    const hue = 120 * (player.energy / player.maxEnergy);
    ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
    ctx.fillRect(x, y, fillWidth, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Energy: ${Math.floor(player.energy)}/${player.maxEnergy}`,
      x + 5,
      y + 14
    );
  }

  private drawTimer(
    ctx: CanvasRenderingContext2D,
    seconds: number,
    canvasWidth: number
  ): void {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, canvasWidth / 2, 35);
  }

  private drawPulseTimer(
    ctx: CanvasRenderingContext2D,
    pulseTimer: number,
    canvasWidth: number
  ): void {
    const secs = Math.ceil(pulseTimer);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Pulse in ${secs}s`, canvasWidth / 2, 55);
  }

  private drawTeamPanel(
    ctx: CanvasRenderingContext2D,
    teams: Map<string, Team>,
    canvasWidth: number
  ): void {
    const x = canvasWidth - 180;
    let y = 60;

    ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
    ctx.fillRect(x - 10, y - 15, 175, teams.size * 28 + 25);

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('TEAMS', x, y);
    y += 20;

    const sorted = Array.from(teams.values()).sort(
      (a, b) => b.territory - a.territory
    );

    for (const team of sorted) {
      const color = hslString(team.color.hue, team.color.saturation, team.color.lightness);
      // Color dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + 6, y - 4, 5, 0, Math.PI * 2);
      ctx.fill();

      // Name and territory
      ctx.fillStyle = '#ddd';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`${team.name}`, x + 18, y);
      ctx.fillStyle = '#999';
      ctx.textAlign = 'right';
      ctx.fillText(`${team.territory}`, x + 155, y);
      ctx.textAlign = 'left';

      y += 22;
    }
  }

  private drawRevolutionIndicator(
    ctx: CanvasRenderingContext2D,
    player: Player
  ): void {
    if (player.isChannelingRevolution) {
      const barWidth = 200;
      const barHeight = 8;
      const x = 20;
      const y = 50;

      ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
      ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 18);

      ctx.fillStyle = '#ff4444';
      ctx.fillRect(x, y, barWidth * player.revolutionProgress, barHeight);

      ctx.fillStyle = '#fff';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DECLARING INDEPENDENCE...', x, y + 16);
    }

    // Show revolution availability
    const progress = player.influence / player.revolutionThreshold;
    if (progress >= 0.5 && !player.isChannelingRevolution) {
      const x = 20;
      const y = 50;
      ctx.fillStyle = 'rgba(255, 68, 68, 0.6)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Revolution: ${Math.floor(progress * 100)}%`,
        x,
        y + 10
      );

      if (progress >= 1.0) {
        // Show the button prompt
        this.showRevolutionButton();
      } else {
        this.hideRevolutionButton();
      }
    } else {
      this.hideRevolutionButton();
    }
  }

  private showRevolutionButton(): void {
    if (this.revolutionButton) return;
    this.revolutionButton = document.createElement('button');
    this.revolutionButton.textContent = 'DECLARE INDEPENDENCE';
    this.revolutionButton.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      padding: 12px 24px; background: #ff4444; color: #fff;
      border: none; border-radius: 8px; font-size: 16px; font-weight: bold;
      cursor: pointer; z-index: 10; animation: pulse-btn 1s infinite;
    `;
    this.revolutionButton.addEventListener('click', () => {
      this.onRevolution?.();
      this.hideRevolutionButton();
    });
    document.body.appendChild(this.revolutionButton);

    // Add pulsing animation
    if (!document.getElementById('pulse-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-style';
      style.textContent = `
        @keyframes pulse-btn {
          0%, 100% { box-shadow: 0 0 10px rgba(255,68,68,0.5); }
          50% { box-shadow: 0 0 25px rgba(255,68,68,0.8); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  private hideRevolutionButton(): void {
    if (this.revolutionButton) {
      this.revolutionButton.remove();
      this.revolutionButton = null;
    }
  }

  destroy(): void {
    this.muteButton.remove();
    this.hideRevolutionButton();
  }
}
