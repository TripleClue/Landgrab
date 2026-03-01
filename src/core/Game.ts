import { GameState, createGameState } from './GameState';
import { EventBus } from './EventBus';
import { GameLoop } from './GameLoop';
import { Camera } from '../rendering/Camera';
import { Renderer } from '../rendering/Renderer';
import { InputManager } from '../input/InputManager';
import { CaptureSystem } from '../systems/CaptureSystem';
import { EncirclementSystem } from '../systems/EncirclementSystem';
import { EnergySystem } from '../systems/EnergySystem';
import { PulseSystem } from '../systems/PulseSystem';
import { BotSystem } from '../systems/BotSystem';
import { VictorySystem } from '../systems/VictorySystem';
import { InfluenceSystem } from '../systems/InfluenceSystem';
import { RevolutionSystem } from '../systems/RevolutionSystem';
import { TeamSystem } from '../systems/TeamSystem';
import { AudioManager } from '../audio/AudioManager';
import { HUD } from '../ui/HUD';
import { Minimap } from '../ui/Minimap';
import { EndScreen } from '../ui/EndScreen';
import { createTeam } from '../entities/Team';
import { createPlayer } from '../entities/Player';
import { STARTING_COLORS } from '../rendering/Colors';
import { AxialCoord, hexKey, hexToPixel, parseHexKey } from '../grid/HexCoord';
import { BOT_COUNT } from './Constants';
import { Easing } from '../animation/Easing';
import { TweenManager } from '../animation/Tween';
import { EncirclementResult } from '../grid/Encirclement';
import { CASCADE_STAGGER_MS } from './Constants';

export class Game {
  private state: GameState;
  private events: EventBus;
  private loop: GameLoop;
  private camera: Camera;
  private renderer: Renderer;
  // InputManager stored to prevent GC (event listeners bound in constructor)
  private _input!: InputManager;
  private tweens: TweenManager;

  // Systems
  private captureSystem: CaptureSystem;
  private encirclementSystem: EncirclementSystem;
  private energySystem: EnergySystem;
  private pulseSystem: PulseSystem;
  private botSystem: BotSystem;
  private victorySystem: VictorySystem;
  private influenceSystem: InfluenceSystem;
  private revolutionSystem: RevolutionSystem;
  private teamSystem: TeamSystem;

  // UI
  private audio: AudioManager;
  private hud: HUD;
  private minimap: Minimap;
  private endScreen: EndScreen;

  // Local player reference
  private playerId = 'player_local';
  private screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };

  constructor(private canvas: HTMLCanvasElement) {
    this.events = new EventBus();
    this.state = createGameState();
    this.camera = new Camera();
    this.renderer = new Renderer(canvas);
    this.tweens = new TweenManager();

    // Systems
    this.captureSystem = new CaptureSystem(this.events);
    this.encirclementSystem = new EncirclementSystem(this.events);
    this.energySystem = new EnergySystem();
    this.pulseSystem = new PulseSystem(this.events);
    this.botSystem = new BotSystem();
    this.victorySystem = new VictorySystem(this.events);
    this.influenceSystem = new InfluenceSystem();
    this.revolutionSystem = new RevolutionSystem(this.events);
    this.teamSystem = new TeamSystem(this.events);

    // Audio
    this.audio = new AudioManager();

    // UI
    this.hud = new HUD(this.audio);
    this.minimap = new Minimap();
    this.endScreen = new EndScreen();

    // Input
    this._input = new InputManager(
      canvas,
      this.camera,
      (coord) => this.onHexClick(coord),
      (key) => this.renderer.hexRenderer.setHover(key)
    );

    // Game loop
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );

    // Event handlers
    this.setupEventHandlers();

    // UI callbacks
    this.hud.setRevolutionHandler(() => this.startRevolution());
    this.endScreen.setRestartHandler(() => this.restart());

    // Initialize game
    this.initGame();
  }

  private setupEventHandlers(): void {
    this.events.on('hexCaptured', (data) => {
      this.audio.playClaimSound();
      this.spawnCaptureParticles(data.coord, data.teamId);
    });

    this.events.on('encirclement', (result) => {
      this.playEncirclementAnimation(result);
    });

    this.events.on('pulseTriggered', () => {
      this.audio.playPulseSound();
    });

    this.events.on('revolutionCompleted', () => {
      this.audio.playRevolutionSound();
      this.triggerScreenShake(4);
    });

    this.events.on('roundEnd', (data) => {
      this.state.phase = 'results';
      this.state.winnerId = data.winnerId;
      this.audio.playVictorySound();

      const winner = data.winnerId
        ? this.state.teams.get(data.winnerId) ?? null
        : null;
      const player = this.state.players.get(this.playerId)!;
      this.endScreen.show(winner, player, this.state.teams);
    });
  }

  private initGame(): void {
    // Create two starting teams
    const team1 = createTeam('team_cyan', 'Neon Tide', STARTING_COLORS[0], true);
    const team2 = createTeam('team_magenta', 'Void Pulse', STARTING_COLORS[1], true);
    this.state.teams.set(team1.id, team1);
    this.state.teams.set(team2.id, team2);

    // Create human player
    const humanPlayer = createPlayer(this.playerId, 'You', team1.id, false);
    this.state.players.set(humanPlayer.id, humanPlayer);
    team1.members.add(humanPlayer.id);

    // Create bots
    const botNames = ['Nova', 'Blitz', 'Echo', 'Drift', 'Surge'];
    for (let i = 0; i < BOT_COUNT; i++) {
      const teamId = i < Math.ceil(BOT_COUNT / 2) ? team1.id : team2.id;
      const botId = `bot_${i}`;
      const bot = createPlayer(botId, botNames[i], teamId, true);
      this.state.players.set(bot.id, bot);
      const team = this.state.teams.get(teamId)!;
      team.members.add(bot.id);
      this.botSystem.registerBot(botId);
    }

    // Build renderer paths
    this.renderer.hexRenderer.buildPaths(this.state.grid);

    // Give each team a starting position
    this.placeStartingTerritories();

    // Init audio on first click
    const initAudio = () => {
      this.audio.init();
      this.audio.resume();
      this.canvas.removeEventListener('click', initAudio);
      this.canvas.removeEventListener('touchstart', initAudio);
    };
    this.canvas.addEventListener('click', initAudio);
    this.canvas.addEventListener('touchstart', initAudio);
  }

  private placeStartingTerritories(): void {
    const r = this.state.grid.radius;
    const positions = [
      { q: -Math.floor(r * 0.6), r: 0 },
      { q: Math.floor(r * 0.6), r: 0 },
    ];

    const teamIds = Array.from(this.state.teams.keys());
    for (let i = 0; i < teamIds.length && i < positions.length; i++) {
      const teamId = teamIds[i];
      const team = this.state.teams.get(teamId)!;
      const pos = positions[i];

      // Claim a small cluster
      for (let dq = -2; dq <= 2; dq++) {
        for (let dr = Math.max(-2, -dq - 2); dr <= Math.min(2, -dq + 2); dr++) {
          const cell = this.state.grid.getCell(pos.q + dq, pos.r + dr);
          if (cell) {
            cell.ownerId = teamId;
            team.territory++;
          }
        }
      }
    }
  }

  private onHexClick(coord: AxialCoord): void {
    if (this.state.phase !== 'playing') return;

    const player = this.state.players.get(this.playerId);
    if (!player) return;

    this.captureSystem.capture(
      this.state.grid,
      coord,
      player,
      this.state.teams
    );
  }

  private startRevolution(): void {
    const player = this.state.players.get(this.playerId);
    if (!player) return;

    if (
      this.influenceSystem.canStartRevolution(
        player,
        this.state.teams.size,
        6
      )
    ) {
      this.revolutionSystem.startRevolution(player);
    }
  }

  private update(dt: number): void {
    if (this.state.phase !== 'playing') return;

    this.state.tickNumber++;

    // Update systems in order
    this.energySystem.update(this.state.players, dt);

    this.encirclementSystem.update(
      this.state.grid,
      this.state.teams,
      this.state.players
    );

    const pulsedHexes = this.pulseSystem.update(this.state.grid, this.state.teams, dt);
    if (pulsedHexes.length > 0) {
      for (const key of pulsedHexes) {
        const coord = parseHexKey(key);
        const cell = this.state.grid.getCell(coord.q, coord.r);
        if (cell && cell.ownerId) {
          this.spawnCaptureParticles(coord, cell.ownerId);
        }
      }
    }

    this.influenceSystem.update(this.state.grid, this.state.players, dt);
    this.revolutionSystem.update(
      this.state.grid,
      this.state.players,
      this.state.teams,
      dt
    );
    this.teamSystem.update(this.state.teams, this.state.players);
    this.victorySystem.update(this.state.grid, this.state.teams, dt);

    // Bot AI
    this.botSystem.update(
      this.state.grid,
      this.state.players,
      this.state.teams,
      this.captureSystem,
      dt
    );

    // Animations
    this.tweens.update(dt);
    this.renderer.particles.update(dt);

    // Screen shake decay
    if (this.screenShake.intensity > 0.1) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.intensity *= this.screenShake.decay;
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
      this.screenShake.intensity = 0;
    }

    // Camera update
    this.camera.update(dt);
  }

  private render(_alpha: number): void {
    const ctx = this.renderer.getContext();
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    // Apply screen shake offset to camera temporarily
    const origX = this.camera.x;
    const origY = this.camera.y;
    this.camera.x += this.screenShake.x;
    this.camera.y += this.screenShake.y;

    this.renderer.render(this.state.grid, this.camera, this.state.teams, _alpha);

    // Restore camera
    this.camera.x = origX;
    this.camera.y = origY;

    // Draw HUD (not affected by camera)
    const player = this.state.players.get(this.playerId);
    if (player) {
      this.hud.render(
        ctx,
        player,
        this.state.teams,
        this.victorySystem.timeRemaining,
        this.pulseSystem.timeRemaining,
        w,
        h
      );
    }

    // Draw minimap
    this.minimap.render(ctx, this.state.grid, this.state.teams, this.camera, w, h);
  }

  private spawnCaptureParticles(coord: AxialCoord, teamId: string): void {
    const team = this.state.teams.get(teamId);
    if (!team) return;

    const { x, y } = hexToPixel(coord.q, coord.r);
    this.renderer.particles.emit({
      x, y,
      count: 12,
      speed: 80,
      spread: 4,
      size: 3,
      sizeVariance: 1.5,
      lifetime: 0.5,
      lifetimeVariance: 0.2,
      color: team.color.neonGlow,
      friction: 0.92,
    });

    // Bouncy scale animation on the hex
    const key = hexKey(coord.q, coord.r);
    const animState = this.renderer.hexRenderer.getAnimState(key);
    animState.flashAlpha = 0.6;
    this.tweens.add(0.6, 0, 300, Easing.quadOut, (v) => {
      animState.flashAlpha = v;
    });
  }

  private playEncirclementAnimation(result: EncirclementResult): void {
    this.audio.playEncirclementStart();
    this.triggerScreenShake(2);

    const team = this.state.teams.get(result.newOwner);
    if (!team) return;

    // Flash all captured hexes, then cascade
    let index = 0;
    const total = result.capturedGroup.size;
    const sortedKeys = Array.from(result.capturedGroup);

    for (const cellKey of sortedKeys) {
      const delay = index * CASCADE_STAGGER_MS;
      const currentIndex = index;

      setTimeout(() => {
        const coord = parseHexKey(cellKey);
        const { x, y } = hexToPixel(coord.q, coord.r);

        // Flash effect
        const animState = this.renderer.hexRenderer.getAnimState(cellKey);
        animState.flashAlpha = 0.9;
        this.tweens.add(0.9, 0, 400, Easing.cubicOut, (v) => {
          animState.flashAlpha = v;
        });

        // Particles per hex
        this.renderer.particles.emit({
          x, y,
          count: 4,
          speed: 50,
          spread: 3,
          size: 2,
          sizeVariance: 1,
          lifetime: 0.4,
          lifetimeVariance: 0.15,
          color: team.color.neonGlow,
          friction: 0.94,
        });

        this.audio.playEncirclementFlip(currentIndex, total);
      }, delay);

      index++;
    }

    // Completion effect
    setTimeout(() => {
      this.audio.playEncirclementComplete();
      if (total >= 10) {
        this.triggerScreenShake(5);
      }
    }, total * CASCADE_STAGGER_MS + 200);
  }

  private triggerScreenShake(intensity: number): void {
    this.screenShake.intensity = intensity;
  }

  start(): void {
    this.loop.start();
  }

  private restart(): void {
    // Clean up
    this.hud.destroy();
    this.endScreen.hide();
    this.loop.stop();

    // Reinitialize
    this.state = createGameState();
    this.events = new EventBus();
    this.victorySystem = new VictorySystem(this.events);
    this.captureSystem = new CaptureSystem(this.events);
    this.encirclementSystem = new EncirclementSystem(this.events);
    this.pulseSystem = new PulseSystem(this.events);
    this.revolutionSystem = new RevolutionSystem(this.events);
    this.teamSystem = new TeamSystem(this.events);
    this.botSystem = new BotSystem();
    this.tweens = new TweenManager();

    this.hud = new HUD(this.audio);
    this.hud.setRevolutionHandler(() => this.startRevolution());
    this.endScreen.setRestartHandler(() => this.restart());
    this.setupEventHandlers();

    this._input = new InputManager(
      this.canvas,
      this.camera,
      (coord) => this.onHexClick(coord),
      (key) => this.renderer.hexRenderer.setHover(key)
    );

    this.initGame();
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );
    this.loop.start();
  }
}
