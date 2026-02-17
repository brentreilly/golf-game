// Summit — Monster Truck Hill Climber
// Main game loop, state machine, input handling, canvas management

import { Terrain } from './terrain.js';
import { Truck } from './truck.js';
import { Camera } from './camera.js';
import { FuelSystem } from './fuel.js';
import { ParticleSystem } from './particles.js';

// --- Game states ---
const STATE = {
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
};

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Game systems
    this.terrain = new Terrain();
    this.truck = new Truck();
    this.camera = new Camera();
    this.fuel = new FuelSystem();
    this.particles = new ParticleSystem();

    // State
    this.state = STATE.START;
    this.distance = 0;
    this.bestDistance = parseInt(localStorage.getItem('summit-best') || '0', 10);
    this.lastTime = 0;

    // Input
    this.input = { gas: false, brake: false };
    this.activePointers = new Map();

    // Cached DOM refs for per-frame updates
    this.hudDistance = document.getElementById('distance-display');
    this.fuelFill = document.getElementById('fuel-bar-fill');

    this.setupCanvas();
    this.setupInput();
    this.setupUI();

    // Start the loop
    requestAnimationFrame((t) => this.loop(t));
  }

  // --- Canvas sizing ---
  setupCanvas() {
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this._stars = null; // regenerate stars for new viewport
    };
    resize();
    window.addEventListener('resize', resize);
  }

  // --- Touch + pointer input ---
  setupInput() {
    const zones = document.getElementById('touch-zones');
    const brakeZone = document.getElementById('zone-brake');
    const gasZone = document.getElementById('zone-gas');

    const updateInput = () => {
      this.input.brake = false;
      this.input.gas = false;
      for (const [, zone] of this.activePointers) {
        if (zone === 'brake') this.input.brake = true;
        if (zone === 'gas') this.input.gas = true;
      }
      brakeZone.classList.toggle('active', this.input.brake);
      gasZone.classList.toggle('active', this.input.gas);
    };

    const getZone = (x) => {
      return x < window.innerWidth / 2 ? 'brake' : 'gas';
    };

    zones.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.activePointers.set(e.pointerId, getZone(e.clientX));
      updateInput();
    });

    zones.addEventListener('pointermove', (e) => {
      if (this.activePointers.has(e.pointerId)) {
        this.activePointers.set(e.pointerId, getZone(e.clientX));
        updateInput();
      }
    });

    const pointerUp = (e) => {
      this.activePointers.delete(e.pointerId);
      updateInput();
    };
    zones.addEventListener('pointerup', pointerUp);
    zones.addEventListener('pointercancel', pointerUp);
    zones.addEventListener('pointerleave', pointerUp);

    // Keyboard fallback (for dev/testing)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.gas = true;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.brake = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.gas = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.brake = false;
    });
  }

  // --- UI wiring ---
  setupUI() {
    document.getElementById('start-play-btn').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('gameover-retry-btn').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('pause-btn').addEventListener('click', () => {
      if (this.state === STATE.PLAYING) this.pause();
    });
    document.getElementById('pause-resume-btn').addEventListener('click', () => {
      if (this.state === STATE.PAUSED) this.resume();
    });
  }

  // --- State transitions ---
  startGame() {
    this.state = STATE.PLAYING;
    this.distance = 0;
    this.terrain.reset();
    this.truck.reset();
    this.camera.reset();
    this.fuel.reset();
    this.particles.reset();

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('fuel-container').classList.remove('hidden');
    document.getElementById('touch-zones').classList.remove('hidden');
  }

  gameOver() {
    this.state = STATE.GAME_OVER;
    const dist = Math.floor(this.distance);
    const isRecord = dist > this.bestDistance;

    if (isRecord) {
      this.bestDistance = dist;
      localStorage.setItem('summit-best', String(dist));
    }

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('fuel-container').classList.add('hidden');
    document.getElementById('touch-zones').classList.add('hidden');

    document.getElementById('gameover-distance').textContent = `${dist}m`;

    document.getElementById('gameover-best').textContent = `BEST: ${this.bestDistance}m`;
    document.getElementById('gameover-new-record').classList.toggle('hidden', !isRecord);
    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  pause() {
    this.state = STATE.PAUSED;
    document.getElementById('pause-screen').classList.remove('hidden');
  }

  resume() {
    this.state = STATE.PLAYING;
    this.lastTime = performance.now();
    document.getElementById('pause-screen').classList.add('hidden');
  }

  // --- Main loop ---
  loop(time) {
    requestAnimationFrame((t) => this.loop(t));

    // Delta time (capped at 50ms to avoid physics explosions)
    const dt = Math.min((time - (this.lastTime || time)) / 1000, 0.05);
    this.lastTime = time;

    if (this.state === STATE.PLAYING) {
      this.update(dt);
    }

    this.render();
  }

  update(dt) {
    // Update truck physics
    this.truck.update(dt, this.input, this.terrain);

    // Track distance (truck X position in world units, convert to meters)
    this.distance = Math.max(this.distance, this.truck.x / 10);

    // Update fuel
    this.fuel.update(dt, this.truck, this.terrain, this.distance);
    if (this.fuel.isEmpty()) {
      this.gameOver();
      return;
    }

    // Update camera
    this.camera.update(dt, this.truck);

    // Update particles
    this.particles.update(dt, this.truck);

    // Generate terrain ahead
    this.terrain.ensureGenerated(this.truck.x + this.width * 2);

    // Update HUD distance display
    this.hudDistance.textContent = `${Math.floor(this.distance)}m`;

    // Update fuel bar
    const pct = this.fuel.percent;
    this.fuelFill.style.width = `${pct}%`;
    this.fuelFill.classList.toggle('warning', pct < 40 && pct >= 15);
    this.fuelFill.classList.toggle('critical', pct < 15);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Sky gradient — deeper night sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.8);
    skyGrad.addColorStop(0, '#000510');
    skyGrad.addColorStop(0.4, '#061020');
    skyGrad.addColorStop(1, '#0a1628');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars (static, screen-space)
    this.renderStars(ctx, w, h);

    // Parallax background hills (screen-space, before camera transform)
    this.terrain.renderBackground(ctx, this.camera.x, this.camera.y, w, h);

    // Camera transform
    ctx.save();
    const cx = this.camera.x;
    const cy = this.camera.y;
    ctx.translate(-cx + w * 0.3, -cy + h * 0.5);

    // Terrain
    this.terrain.render(ctx, cx, w, cy, h);

    // Fuel cans
    this.fuel.render(ctx);

    // Truck
    this.truck.render(ctx);

    // Particles
    this.particles.render(ctx);

    ctx.restore();
  }

  renderStars(ctx, w, h) {
    if (!this._stars) {
      this._stars = [];
      let seed = 42;
      const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 30; i++) {
        this._stars.push({
          x: rng() * w,
          y: rng() * h * 0.5,
          r: rng() * 1.5 + 0.5,
          a: rng() * 0.5 + 0.3,
        });
      }
    }
    for (const s of this._stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Boot
new Game();
