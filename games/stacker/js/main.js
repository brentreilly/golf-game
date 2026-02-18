// Stacker — Neon Block Puzzle
// Main game class: loop, state machine, input handling, canvas management
// Pattern follows games/summit/js/main.js exactly

import { Board, PIECES } from './board.js';
import { Renderer } from './renderer.js';
import { Particles } from './particles.js';

// --- Game states ---
const STATE = Object.freeze({
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
});

class Game {
  constructor() {
    // 1. Canvas + context
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // 2. Sub-systems
    this.board = new Board();
    this.renderer = new Renderer(this.ctx);
    this.particles = new Particles();

    // 3. State
    this.state = STATE.START;
    this.dropTimer = 0;
    this.lastTime = 0;
    this.prevLevel = 1;

    // 4. Cache DOM refs (avoid getElementById in loop)
    this.scoreEl = document.getElementById('score-value');
    this.linesEl = document.getElementById('lines-value');
    this.levelEl = document.getElementById('level-value');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');

    // 5. Setup
    this.setupCanvas();
    this.setupInput();
    this.setupUI();

    // 6. Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  // --- Canvas sizing (EXACT Summit pattern) ---
  setupCanvas() {
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.renderer.resize(this.width, this.height);
    };
    resize();
    window.addEventListener('resize', resize);
  }

  // --- Touch + pointer input ---
  setupInput() {
    this.activePointers = new Map(); // pointerId → action ('left'|'rotate'|'right')
    this.repeatTimer = 0;
    this.repeatDelay = 0.15;    // 150ms initial delay before auto-repeat
    this.repeatInterval = 0.08; // 80ms between repeats
    this.repeating = false;
    this.swipeStartY = null;

    const zones = document.getElementById('touch-controls');

    zones.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const zone = e.target.closest('.touch-zone');
      if (!zone || this.state !== STATE.PLAYING) return;
      const action = zone.dataset.action;
      this.activePointers.set(e.pointerId, action);

      // Immediate action on press
      if (action === 'left') this.board.moveLeft();
      else if (action === 'right') this.board.moveRight();
      else if (action === 'rotate') this.board.rotate();

      // Start repeat timer for left/right
      if (action !== 'rotate') {
        this.repeating = false;
        this.repeatTimer = 0;
      }
    });

    const pointerUp = (e) => {
      this.activePointers.delete(e.pointerId);
      if (this.activePointers.size === 0) {
        this.repeating = false;
        this.repeatTimer = 0;
      }
    };
    zones.addEventListener('pointerup', pointerUp);
    zones.addEventListener('pointercancel', pointerUp);
    zones.addEventListener('pointerleave', pointerUp);

    // Hard drop: swipe down on canvas
    this.canvas.addEventListener('pointerdown', (e) => {
      this.swipeStartY = e.clientY;
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (this.swipeStartY !== null && this.state === STATE.PLAYING) {
        if (e.clientY - this.swipeStartY > 30) {
          this.board.hardDrop();
          this.swipeStartY = null; // consume the swipe
        }
      }
    });
    this.canvas.addEventListener('pointerup', () => { this.swipeStartY = null; });

    // Keyboard fallback for dev
    window.addEventListener('keydown', (e) => {
      if (this.state !== STATE.PLAYING) return;
      switch (e.key) {
        case 'ArrowLeft': this.board.moveLeft(); break;
        case 'ArrowRight': this.board.moveRight(); break;
        case 'ArrowUp': this.board.rotate(); break;
        case 'ArrowDown': this.board.softDrop(); break;
        case ' ': this.board.hardDrop(); break;
      }
    });

    // Silk browser fix: prevent default on touchstart except overlays
    document.addEventListener('touchstart', (e) => {
      if (e.target.closest('#start-screen, #gameover-screen, #pause-screen, #back-btn')) return;
      e.preventDefault();
    }, { passive: false });
  }

  // --- UI wiring ---
  setupUI() {
    document.getElementById('play-btn').addEventListener('click', () => this.startGame());
    document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
    document.getElementById('pause-btn').addEventListener('click', () => this.pause());
    document.getElementById('resume-btn').addEventListener('click', () => this.resume());
    document.getElementById('quit-btn').addEventListener('click', () => this.quitToStart());
  }

  // --- State transitions ---
  startGame() {
    this.board.reset();
    this.particles.reset();
    this.dropTimer = 0;
    this.state = STATE.PLAYING;
    this.prevLevel = 1;

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('touch-controls').classList.remove('hidden');
  }

  gameOver() {
    this.state = STATE.GAME_OVER;

    // Update high score
    const best = parseInt(localStorage.getItem('stacker-best') || '0', 10);
    const newBest = this.board.score > best;
    if (newBest) localStorage.setItem('stacker-best', String(this.board.score));

    // Populate game over screen
    this.finalScoreEl.textContent = this.board.score;
    this.bestScoreEl.textContent = newBest ? this.board.score : best;

    // Show/hide new record indicator
    const newRecordEl = document.getElementById('gameover-new-record');
    if (newRecordEl) newRecordEl.classList.toggle('hidden', !newBest);

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('touch-controls').classList.add('hidden');
    document.getElementById('gameover-screen').classList.remove('hidden');
  }

  pause() {
    if (this.state !== STATE.PLAYING) return;
    this.state = STATE.PAUSED;
    document.getElementById('pause-screen').classList.remove('hidden');
  }

  resume() {
    this.state = STATE.PLAYING;
    this.lastTime = performance.now(); // prevent dt spike
    document.getElementById('pause-screen').classList.add('hidden');
  }

  quitToStart() {
    this.state = STATE.START;
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('touch-controls').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
  }

  // --- Main loop (EXACT Summit pattern) ---
  loop(time) {
    requestAnimationFrame((t) => this.loop(t)); // schedule at TOP, not bottom

    // Delta time (capped at 50ms to avoid physics explosions)
    const dt = Math.min((time - (this.lastTime || time)) / 1000, 0.05);
    this.lastTime = time;

    if (this.state === STATE.PLAYING) {
      this.update(dt);
    }

    // Particles animate regardless of state (visual polish)
    this.particles.update(dt);

    // Render always
    this.renderer.render(this.board);
    this.particles.render(this.ctx);
  }

  // --- Game logic ---
  update(dt) {
    // Auto-repeat for held left/right
    const heldAction = this.getHeldDirection();
    if (heldAction) {
      this.repeatTimer += dt;
      if (!this.repeating && this.repeatTimer >= this.repeatDelay) {
        this.repeating = true;
        this.repeatTimer = 0;
        if (heldAction === 'left') this.board.moveLeft();
        else this.board.moveRight();
      } else if (this.repeating && this.repeatTimer >= this.repeatInterval) {
        this.repeatTimer = 0;
        if (heldAction === 'left') this.board.moveLeft();
        else this.board.moveRight();
      }
    }

    // Gravity
    const dropInterval = Math.pow(0.85, this.board.level - 1); // ~15% faster per level
    this.dropTimer += dt;
    if (this.dropTimer >= dropInterval) {
      this.dropTimer = 0;
      const alive = this.board.tick();
      if (!alive) {
        this.gameOver();
        return;
      }
    }

    // Check for line clears (particles)
    if (this.board.lastClearedRows && this.board.lastClearedRows.length > 0) {
      for (const row of this.board.lastClearedRows) {
        const y = this.renderer.gridY + row * this.renderer.cellSize;
        this.particles.emitLine(y, this.renderer.gridX, this.renderer.cellSize * this.board.cols, '#fff');
      }
      // Clear so we don't re-emit
      this.board.lastClearedRows = [];
    }

    // Update HUD
    this.scoreEl.textContent = this.board.score;
    this.linesEl.textContent = this.board.lines;
    this.levelEl.textContent = this.board.level;
  }

  getHeldDirection() {
    for (const action of this.activePointers.values()) {
      if (action === 'left' || action === 'right') return action;
    }
    return null;
  }
}

// Boot
new Game();
