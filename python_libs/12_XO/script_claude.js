/* ==========================================================================
   NEXUS · Starship Tic Tac Toe
   --------------------------------------------------------------------------
   Vanilla ES2020. No frameworks, no build step. Organised as small modules
   that talk to each other through the `Game` state object and the `UI` layer:

     Store      · localStorage persistence (settings + scoreboard)
     Sound      · WebAudio synthesiser — no audio files to download
     Ripple     · material-style click waves on any .ripple element
     Particles  · floating background dust (canvas)
     Confetti   · victory explosion (canvas)
     AI         · minimax + alpha-beta, with difficulty throttling
     Game       · pure game state / rules
     UI         · rendering, screens, modals, keyboard access
   ========================================================================== */
'use strict';

/* ==========================================================================
   CONSTANTS
   ========================================================================== */
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],   // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8],   // columns
  [0, 4, 8], [2, 4, 6]               // diagonals
];

const SHIP_NAME = { X: 'Interceptor', O: 'Cruiser' };

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const rand  = (min, max) => min + Math.random() * (max - min);
const wait  = ms => new Promise(res => setTimeout(res, ms));


/* ==========================================================================
   STORE — persisted settings and scores
   ========================================================================== */
const Store = {
  KEY: 'nexus-ttt-v1',

  defaults: {
    mode: 'ai',              // 'ai' | 'human'
    difficulty: 'medium',    // 'easy' | 'medium' | 'impossible'
    humanSide: 'X',          // which fleet the human commands in AI mode
    theme: 'dark',
    accent: 'violet',
    sound: true,
    particles: true,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    score: { X: 0, O: 0, draws: 0, round: 1 }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? { ...this.defaults, ...JSON.parse(raw) } : { ...this.defaults };
    } catch {
      return { ...this.defaults };           // private mode / blocked storage
    }
  },

  save(state) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify({
        mode: state.mode, difficulty: state.difficulty, humanSide: state.humanSide,
        theme: state.theme, accent: state.accent, sound: state.sound,
        particles: state.particles, reduceMotion: state.reduceMotion, score: state.score
      }));
    } catch { /* storage unavailable — settings simply won't persist */ }
  }
};


/* ==========================================================================
   SOUND — tiny WebAudio synth (every effect is generated, nothing is loaded)
   ========================================================================== */
const Sound = {
  ctx: null,
  master: null,
  enabled: true,

  /* The AudioContext can only start after a user gesture. */
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  /** One shaped oscillator voice. */
  tone({ freq = 440, to = null, type = 'sine', dur = 0.18, gain = 0.2, delay = 0, glideAt = 0.6 }) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur * glideAt);

    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(env).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },

  /** Filtered noise burst — used for thrusters and the draw "power-down". */
  noise({ dur = 0.3, gain = 0.12, from = 1800, to = 300, delay = 0 }) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const frames = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filter).connect(env).connect(this.master);
    src.start(t0);
  },

  /* --- named effects --- */
  hover()  { this.tone({ freq: 620, type: 'sine', dur: 0.06, gain: 0.035 }); },
  click()  { this.tone({ freq: 320, to: 480, type: 'triangle', dur: 0.1, gain: 0.1 }); },
  deploy(player) {
    // X = bright ascending blip, O = deeper warm thrum
    const base = player === 'X' ? 520 : 300;
    this.tone({ freq: base, to: base * 1.8, type: 'triangle', dur: 0.2, gain: 0.16 });
    this.tone({ freq: base * 2, to: base * 3, type: 'sine', dur: 0.14, gain: 0.06, delay: 0.02 });
    this.noise({ dur: 0.22, gain: 0.05, from: 2400, to: 400 });
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      this.tone({ freq: f, type: 'triangle', dur: 0.5, gain: 0.13, delay: i * 0.09 }));
    this.noise({ dur: 0.9, gain: 0.07, from: 3000, to: 200, delay: 0.1 });
  },
  lose() {
    [440, 392, 330, 262].forEach((f, i) =>
      this.tone({ freq: f, type: 'sawtooth', dur: 0.35, gain: 0.08, delay: i * 0.1 }));
  },
  draw() {
    this.tone({ freq: 300, to: 150, type: 'sine', dur: 0.7, gain: 0.12 });
    this.noise({ dur: 0.6, gain: 0.08, from: 900, to: 120 });
  },
  start() {
    this.tone({ freq: 220, to: 660, type: 'sawtooth', dur: 0.45, gain: 0.09 });
    this.noise({ dur: 0.5, gain: 0.07, from: 400, to: 3000 });
  }
};


/* ==========================================================================
   RIPPLE — click waves, delegated so it works on any .ripple element
   ========================================================================== */
const Ripple = {
  init() {
    document.addEventListener('pointerdown', e => {
      const host = e.target.closest('.ripple');
      if (!host) return;

      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const wave = document.createElement('span');

      wave.className = 'ripple__wave';
      wave.style.width = wave.style.height = `${size}px`;
      wave.style.left = `${e.clientX - rect.left - size / 2}px`;
      wave.style.top  = `${e.clientY - rect.top  - size / 2}px`;

      host.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove());
    });
  }
};


/* ==========================================================================
   PARTICLES — slow drifting dust, parallaxed to the pointer
   ========================================================================== */
const Particles = {
  canvas: null, ctx: null, items: [], raf: null,
  enabled: true, dpr: 1, w: 0, h: 0,
  pointer: { x: 0, y: 0, tx: 0, ty: 0 },

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.resize();

    window.addEventListener('resize', () => this.resize(), { passive: true });
    window.addEventListener('pointermove', e => {
      this.pointer.tx = (e.clientX / window.innerWidth - 0.5) * 26;
      this.pointer.ty = (e.clientY / window.innerHeight - 0.5) * 26;
    }, { passive: true });

    // Pause when the tab is hidden so we never burn cycles in the background
    document.addEventListener('visibilitychange', () => {
      document.hidden ? this.stop() : this.start();
    });

    this.start();
  },

  resize() {
    this.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width  = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width  = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.build();
  },

  /* Density scales with viewport area, capped for phones. */
  build() {
    const count = clamp(Math.round((this.w * this.h) / 26000), 26, 90);
    this.items = Array.from({ length: count }, () => this.spawn());
  },

  spawn() {
    return {
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      r: rand(0.6, 2.4),
      vx: rand(-0.16, 0.16),
      vy: rand(-0.34, -0.06),
      a: rand(0.12, 0.6),
      depth: rand(0.3, 1),
      hue: Math.random()          // picked from the three theme colours
    };
  },

  colors() {
    const cs = getComputedStyle(document.documentElement);
    return [
      cs.getPropertyValue('--accent').trim() || '#8b5cf6',
      cs.getPropertyValue('--x-color').trim() || '#22d3ee',
      cs.getPropertyValue('--o-color').trim() || '#f472b6'
    ];
  },

  start() {
    if (!this.enabled || this.raf) return;
    this.palette = this.colors();
    const loop = () => { this.step(); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  },

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  },

  setEnabled(on) {
    this.enabled = on;
    if (on) { this.start(); }
    else { this.stop(); this.ctx.clearRect(0, 0, this.w, this.h); }
  },

  refreshPalette() { this.palette = this.colors(); },

  step() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);

    // eased parallax
    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.045;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.045;

    for (const p of this.items) {
      p.x += p.vx; p.y += p.vy;

      // wrap around the viewport
      if (p.y < -12) { p.y = this.h + 12; p.x = Math.random() * this.w; }
      if (p.x < -12) p.x = this.w + 12;
      if (p.x > this.w + 12) p.x = -12;

      const px = p.x + this.pointer.x * p.depth;
      const py = p.y + this.pointer.y * p.depth;

      ctx.globalAlpha = p.a * p.depth;
      ctx.fillStyle = this.palette[Math.floor(p.hue * this.palette.length)];
      ctx.beginPath();
      ctx.arc(px, py, p.r * p.depth, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
};


/* ==========================================================================
   CONFETTI — physics-driven victory explosion
   ========================================================================== */
const Confetti = {
  canvas: null, ctx: null, pieces: [], raf: null, dpr: 1, w: 0, h: 0,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  },

  resize() {
    this.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width  = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width  = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  },

  /** Burst from a screen point. `colors` comes from the winning fleet. */
  burst(x, y, colors, amount = 130) {
    for (let i = 0; i < amount; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(4, 15);
      this.pieces.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(2, 6),
        w: rand(5, 11),
        h: rand(4, 14),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.3, 0.3),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() < 0.28 ? 'circle' : 'rect',
        life: 1,
        decay: rand(0.006, 0.014),
        wobble: rand(0, Math.PI * 2)
      });
    }
    this.start();
  },

  /** Two side cannons + a centre pop — the classic celebratory pattern. */
  celebrate(centerX, centerY, colors) {
    this.burst(centerX, centerY, colors, 120);
    setTimeout(() => this.burst(this.w * 0.08, this.h * 0.72, colors, 70), 160);
    setTimeout(() => this.burst(this.w * 0.92, this.h * 0.72, colors, 70), 280);
    setTimeout(() => this.burst(centerX, centerY, colors, 60), 420);
  },

  start() {
    if (this.raf) return;
    const loop = () => {
      this.step();
      if (this.pieces.length) { this.raf = requestAnimationFrame(loop); }
      else { this.raf = null; this.ctx.clearRect(0, 0, this.w, this.h); }
    };
    this.raf = requestAnimationFrame(loop);
  },

  clear() {
    this.pieces = [];
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.ctx.clearRect(0, 0, this.w, this.h);
  },

  step() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);

    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];

      p.vy += 0.32;                 // gravity
      p.vx *= 0.985;                // drag
      p.vy *= 0.985;
      p.wobble += 0.1;
      p.x += p.vx + Math.sin(p.wobble) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > this.h + 40) { this.pieces.splice(i, 1); continue; }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // squash vertically as it tumbles, so pieces read as thin foil
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.wobble * 0.6)));
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
};


/* ==========================================================================
   AI — minimax with alpha-beta pruning
   Difficulty is applied by *how often* the engine is allowed to play its
   best move, not by weakening the search itself.
   ========================================================================== */
const AI = {
  /** Chance the engine plays optimally, per difficulty. */
  accuracy: { easy: 0.18, medium: 0.62, impossible: 1 },

  choose(board, me, difficulty) {
    const empty = board.map((v, i) => v ? null : i).filter(i => i !== null);
    if (!empty.length) return null;

    const skill = this.accuracy[difficulty] ?? 0.62;

    // Sub-optimal roll: still avoid the most obviously bad move at medium by
    // taking a random legal square instead of a blunder-checked one.
    if (Math.random() > skill) {
      if (difficulty === 'medium') {
        // medium still takes a win or blocks a loss when one is on the board
        const tactical = this.tactical(board, me);
        if (tactical !== null) return tactical;
      }
      return empty[Math.floor(Math.random() * empty.length)];
    }

    return this.best(board, me);
  },

  /** Immediate win, else immediate block, else null. */
  tactical(board, me) {
    const you = me === 'X' ? 'O' : 'X';
    for (const player of [me, you]) {
      for (const [a, b, c] of WIN_LINES) {
        const line = [board[a], board[b], board[c]];
        const idx  = [a, b, c];
        const mine  = line.filter(v => v === player).length;
        const blank = line.filter(v => !v).length;
        if (mine === 2 && blank === 1) return idx[line.findIndex(v => !v)];
      }
    }
    return null;
  },

  best(board, me) {
    let bestScore = -Infinity, move = null;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = me;
      const score = this.minimax(board, 0, false, me, -Infinity, Infinity);
      board[i] = null;
      if (score > bestScore) { bestScore = score; move = i; }
    }
    return move;
  },

  minimax(board, depth, maximizing, me, alpha, beta) {
    const you = me === 'X' ? 'O' : 'X';
    const winner = Game.winnerOf(board);

    // Depth is subtracted so the engine wins as fast as possible and,
    // when losing, stalls as long as possible.
    if (winner === me)  return 10 - depth;
    if (winner === you) return depth - 10;
    if (board.every(Boolean)) return 0;

    if (maximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i]) continue;
        board[i] = me;
        best = Math.max(best, this.minimax(board, depth + 1, false, me, alpha, beta));
        board[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = you;
      best = Math.min(best, this.minimax(board, depth + 1, true, me, alpha, beta));
      board[i] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
};


/* ==========================================================================
   GAME — rules and state, with no knowledge of the DOM
   ========================================================================== */
const Game = {
  state: Store.load(),

  board: Array(9).fill(null),
  current: 'X',
  over: false,
  winner: null,        // 'X' | 'O' | 'draw' | null
  winLine: null,
  busy: false,         // true while the AI is thinking / animations run

  get aiSide()    { return this.state.humanSide === 'X' ? 'O' : 'X'; },
  get vsAI()      { return this.state.mode === 'ai'; },
  isHumanTurn()   { return !this.vsAI || this.current === this.state.humanSide; },

  reset(keepScore = true) {
    this.board = Array(9).fill(null);
    this.current = 'X';
    this.over = false;
    this.winner = null;
    this.winLine = null;
    this.busy = false;
    if (!keepScore) this.state.score = { X: 0, O: 0, draws: 0, round: 1 };
  },

  play(index, player = this.current) {
    if (this.over || this.board[index]) return false;
    this.board[index] = player;

    const line = this.lineOf(this.board);
    if (line) {
      this.over = true;
      this.winner = this.board[line[0]];
      this.winLine = line;
      this.state.score[this.winner]++;
    } else if (this.board.every(Boolean)) {
      this.over = true;
      this.winner = 'draw';
      this.state.score.draws++;
    } else {
      this.current = this.current === 'X' ? 'O' : 'X';
    }
    Store.save(this.state);
    return true;
  },

  /** The winning triple, or null. */
  lineOf(board) {
    return WIN_LINES.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]) || null;
  },

  winnerOf(board) {
    const line = this.lineOf(board);
    return line ? board[line[0]] : null;
  },

  /** Display name for a side, given the current mode. */
  nameOf(side) {
    if (!this.vsAI) return side === 'X' ? 'Player 1' : 'Player 2';
    return side === this.state.humanSide ? 'You' : 'Computer';
  }
};


/* ==========================================================================
   UI — everything that touches the DOM
   ========================================================================== */
const UI = {
  el: {},
  focusIndex: 0,
  lastFocused: null,

  /* ---------------------------------------------------------------- boot */
  init() {
    this.cache();
    this.applySettings();
    this.buildBoard();
    this.bindGlobal();
    this.bindMenu();
    this.bindGame();
    this.bindSettings();
    this.syncMenuControls();
    this.renderScore();

    Particles.init(this.el.particles);
    Confetti.init(this.el.confetti);
    Particles.setEnabled(Game.state.particles && !Game.state.reduceMotion);
    Ripple.init();

    this.finishLoading();
  },

  cache() {
    this.el = {
      loader:      $('#loader'),
      app:         $('#app'),
      particles:   $('#particles'),
      confetti:    $('#confetti'),

      screenMenu:  $('#screenMenu'),
      screenGame:  $('#screenGame'),

      modeGroup:   $('#modeGroup'),
      diffGroup:   $('#diffGroup'),
      diffModal:   $('#diffGroupModal'),
      sideGroup:   $('#sideGroup'),
      themeGroup:  $('#themeGroup'),
      accentGroup: $('#accentGroup'),
      diffField:   $('#difficultyField'),
      sideField:   $('#sideField'),
      playBtn:     $('#playBtn'),

      board:       $('#board'),
      winline:     $('#winline'),
      winSeg:      $('#winlineSeg'),
      turnBar:     $('#turnBar'),
      turnText:    $('#turnText'),
      turnMark:    $('#turnMark'),

      modeChip:    $('#modeChip'),
      nameX:       $('#nameX'),
      nameO:       $('#nameO'),
      winsX:       $('#winsX'),
      winsO:       $('#winsO'),
      draws:       $('#draws'),
      roundNum:    $('#roundNum'),
      scoreX:      $('#scoreX'),
      scoreO:      $('#scoreO'),

      resultOverlay: $('#resultOverlay'),
      resultBadge:   $('#resultBadge'),
      resultTitle:   $('#resultTitle'),
      resultSub:     $('#resultSub'),
      rWinsX:        $('#rWinsX'),
      rWinsO:        $('#rWinsO'),
      rDraws:        $('#rDraws'),

      settingsOverlay: $('#settingsOverlay'),
      soundSwitch:     $('#soundSwitch'),
      particlesSwitch: $('#particlesSwitch'),
      motionSwitch:    $('#motionSwitch')
    };
  },

  finishLoading() {
    // Give the fonts and the first paint a beat, then reveal the app.
    const reveal = () => {
      this.el.app.hidden = false;
      requestAnimationFrame(() => {
        this.el.loader.classList.add('is-done');
        setTimeout(() => this.el.loader.remove(), 700);
        this.syncThumbs();
      });
    };
    // Wait for the webfonts so the title doesn't reflow — but never trust the
    // network: race the font promise against a hard cap so a blocked or slow
    // Google Fonts request can't strand the player on the loading screen.
    const minimum = Game.state.reduceMotion ? 250 : 1250;
    const fonts = document.fonts
      ? Promise.race([document.fonts.ready, wait(2200)])
      : Promise.resolve();
    Promise.all([fonts, wait(minimum)]).then(reveal).catch(reveal);
  },

  /* ------------------------------------------------------------ settings */
  applySettings() {
    const s = Game.state;
    document.documentElement.dataset.theme = s.theme;
    document.documentElement.dataset.accent = s.accent;
    document.body.classList.toggle('is-muted', !s.sound);
    document.body.classList.toggle('reduce-motion', s.reduceMotion);
    Sound.enabled = s.sound;

    $('#soundBtn')?.setAttribute('aria-pressed', String(s.sound));
    this.el.soundSwitch?.setAttribute('aria-checked', String(s.sound));
    this.el.particlesSwitch?.setAttribute('aria-checked', String(s.particles));
    this.el.motionSwitch?.setAttribute('aria-checked', String(s.reduceMotion));
    Store.save(s);
  },

  /* --------------------------------------------------------------- board */
  buildBoard() {
    const board = this.el.board;
    // role="grid" needs rows to be valid; a labelled group of buttons is both
    // simpler and better supported by screen readers here.
    board.setAttribute('role', 'group');

    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell ripple';
      cell.dataset.index = String(i);
      cell.tabIndex = i === 0 ? 0 : -1;
      cell.setAttribute('aria-label', this.cellLabel(i, null));

      // ghost preview of the ship about to be deployed
      const ghost = document.createElement('span');
      ghost.className = 'cell__ghost';
      ghost.innerHTML = `<svg viewBox="0 0 100 100"><use href="#ship-x"/></svg>`;
      cell.appendChild(ghost);

      board.insertBefore(cell, this.el.winline);
    }
    this.cells = $$('.cell', board);
  },

  cellLabel(i, value) {
    const row = Math.floor(i / 3) + 1;
    const col = (i % 3) + 1;
    const what = value ? `${SHIP_NAME[value]} (${value})` : 'empty';
    return `Row ${row}, column ${col}, ${what}`;
  },

  /** Point every ghost at the fleet whose turn it is. */
  updateGhosts() {
    const href = Game.current === 'X' ? '#ship-x' : '#ship-o';
    for (const cell of this.cells) {
      const use = cell.querySelector('.cell__ghost use');
      if (use) use.setAttribute('href', href);
    }
  },

  /* -------------------------------------------------------------- events */
  bindGlobal() {
    // The first gesture anywhere unlocks audio (browser autoplay policy).
    const unlock = () => { Sound.init(); Sound.resume(); };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });

    $('#themeBtn').addEventListener('click', () => {
      this.setTheme(Game.state.theme === 'dark' ? 'light' : 'dark');
      Sound.click();
    });

    $('#soundBtn').addEventListener('click', () => {
      this.setSound(!Game.state.sound);
      if (Game.state.sound) Sound.click();
    });

    $('#settingsBtn').addEventListener('click', () => this.openModal(this.el.settingsOverlay));
    $('#brandBtn').addEventListener('click', () => this.toMenu());

    // Global keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!this.el.settingsOverlay.hidden) return this.closeModal(this.el.settingsOverlay);
        if (!this.el.resultOverlay.hidden)   return this.closeModal(this.el.resultOverlay);
        if (this.el.screenGame.classList.contains('is-active')) this.toMenu();
      }
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey &&
          this.el.screenGame.classList.contains('is-active') &&
          this.el.settingsOverlay.hidden) {
        this.restartRound();
      }
    });

    window.addEventListener('resize', () => {
      this.syncThumbs();
      if (Game.winLine) this.drawWinLine(Game.winLine);
    }, { passive: true });
  },

  bindMenu() {
    // Mode
    this.el.modeGroup.addEventListener('click', e => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      Game.state.mode = btn.dataset.mode;
      this.syncMenuControls();
      Store.save(Game.state);
      Sound.click();
    });

    // Difficulty (menu + modal share one handler)
    const onDiff = e => {
      const btn = e.target.closest('[data-diff]');
      if (!btn) return;
      Game.state.difficulty = btn.dataset.diff;
      this.syncMenuControls();
      this.renderScore();
      Store.save(Game.state);
      Sound.click();
    };
    this.el.diffGroup.addEventListener('click', onDiff);
    this.el.diffModal.addEventListener('click', onDiff);

    // Side
    this.el.sideGroup.addEventListener('click', e => {
      const btn = e.target.closest('[data-side]');
      if (!btn) return;
      Game.state.humanSide = btn.dataset.side;
      this.syncMenuControls();
      Store.save(Game.state);
      Sound.click();
    });

    // Radio-group keyboard support (arrow keys move between options)
    for (const group of $$('[role="radiogroup"]')) {
      group.addEventListener('keydown', e => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        const radios = $$('[role="radio"]', group);
        const i = radios.indexOf(document.activeElement);
        if (i < 0) return;
        e.preventDefault();
        const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
        const next = radios[(i + dir + radios.length) % radios.length];
        next.focus();
        next.click();
      });
    }

    this.el.playBtn.addEventListener('click', () => this.startMatch());
  },

  bindGame() {
    const board = this.el.board;

    board.addEventListener('click', e => {
      const cell = e.target.closest('.cell');
      if (cell) this.humanMove(Number(cell.dataset.index));
    });

    // hover blip (throttled by only firing on entry of an empty cell)
    board.addEventListener('pointerover', e => {
      const cell = e.target.closest('.cell');
      if (cell && !cell.classList.contains('is-taken') && !Game.over) Sound.hover();
    });

    // Roving-tabindex arrow navigation across the 3×3 grid
    board.addEventListener('keydown', e => {
      const map = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 };
      if (!(e.key in map)) return;
      e.preventDefault();

      const from = Number(document.activeElement?.dataset.index ?? this.focusIndex);
      let next = from + map[e.key];

      // keep left/right movement inside the same row
      if ((e.key === 'ArrowRight' && from % 3 === 2) || (e.key === 'ArrowLeft' && from % 3 === 0)) next = from;
      if (next < 0 || next > 8) next = from;

      this.focusCell(next);
    });

    $('#restartBtn').addEventListener('click', () => this.restartRound());
    $('#newGameBtn').addEventListener('click', () => this.newGame());
    $('#menuBtn').addEventListener('click', () => this.toMenu());

    $$('.mobile-actions [data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.dataset.act === 'restart' ? this.restartRound() : this.toMenu();
      });
    });

    $('#nextRoundBtn').addEventListener('click', () => {
      this.closeModal(this.el.resultOverlay);
      this.restartRound();
    });
    $('#resultMenuBtn').addEventListener('click', () => {
      this.closeModal(this.el.resultOverlay);
      this.toMenu();
    });
  },

  bindSettings() {
    $('#settingsClose').addEventListener('click', () => this.closeModal(this.el.settingsOverlay));
    $('#settingsDone').addEventListener('click', () => this.closeModal(this.el.settingsOverlay));

    $$('.overlay__backdrop').forEach(bd => {
      bd.addEventListener('click', () => this.closeModal(bd.closest('.overlay')));
    });

    this.el.themeGroup.addEventListener('click', e => {
      const btn = e.target.closest('[data-theme]');
      if (btn) { this.setTheme(btn.dataset.theme); Sound.click(); }
    });

    this.el.accentGroup.addEventListener('click', e => {
      const btn = e.target.closest('[data-accent]');
      if (!btn) return;
      Game.state.accent = btn.dataset.accent;
      document.documentElement.dataset.accent = btn.dataset.accent;
      this.syncMenuControls();
      Particles.refreshPalette();
      Store.save(Game.state);
      Sound.click();
    });

    this.el.soundSwitch.addEventListener('click', () => {
      this.setSound(!Game.state.sound);
      if (Game.state.sound) Sound.click();
    });

    this.el.particlesSwitch.addEventListener('click', () => {
      Game.state.particles = !Game.state.particles;
      this.el.particlesSwitch.setAttribute('aria-checked', String(Game.state.particles));
      Particles.setEnabled(Game.state.particles && !Game.state.reduceMotion);
      Store.save(Game.state);
      Sound.click();
    });

    this.el.motionSwitch.addEventListener('click', () => {
      Game.state.reduceMotion = !Game.state.reduceMotion;
      this.el.motionSwitch.setAttribute('aria-checked', String(Game.state.reduceMotion));
      document.body.classList.toggle('reduce-motion', Game.state.reduceMotion);
      Particles.setEnabled(Game.state.particles && !Game.state.reduceMotion);
      Store.save(Game.state);
      Sound.click();
    });

    $('#resetScoreBtn').addEventListener('click', () => {
      Game.state.score = { X: 0, O: 0, draws: 0, round: 1 };
      this.renderScore();
      Store.save(Game.state);
      Sound.click();
    });
  },

  setTheme(theme) {
    Game.state.theme = theme;
    document.documentElement.dataset.theme = theme;
    this.syncMenuControls();
    Particles.refreshPalette();
    Store.save(Game.state);
  },

  setSound(on) {
    Game.state.sound = on;
    Sound.enabled = on;
    if (on) { Sound.init(); Sound.resume(); }
    document.body.classList.toggle('is-muted', !on);
    $('#soundBtn').setAttribute('aria-pressed', String(on));
    this.el.soundSwitch.setAttribute('aria-checked', String(on));
    Store.save(Game.state);
  },

  /* ------------------------------------------------- control synchronising */
  syncMenuControls() {
    const s = Game.state;
    const mark = (group, attr, value) => {
      if (!group) return;
      $$(`[data-${attr}]`, group).forEach(btn => {
        const on = btn.dataset[attr] === value;
        btn.classList.toggle('is-active', on);
        if (btn.getAttribute('role') === 'radio') btn.setAttribute('aria-checked', String(on));
      });
    };

    mark(this.el.modeGroup,   'mode',   s.mode);
    mark(this.el.diffGroup,   'diff',   s.difficulty);
    mark(this.el.diffModal,   'diff',   s.difficulty);
    mark(this.el.sideGroup,   'side',   s.humanSide);
    mark(this.el.themeGroup,  'theme',  s.theme);
    mark(this.el.accentGroup, 'accent', s.accent);

    // AI-only controls collapse in two-player mode
    const vsAI = s.mode === 'ai';
    this.el.diffField.style.display = vsAI ? '' : 'none';
    this.el.sideField.style.display = vsAI ? '' : 'none';

    this.syncThumbs();
  },

  /** Slide each segmented control's thumb under its active option. */
  syncThumbs() {
    for (const group of $$('.segmented')) {
      const thumb  = $('.seg__thumb', group);
      const active = $('.seg.is-active', group);
      if (!thumb || !active || !active.offsetWidth) continue;
      // offsetLeft is a layout value, so it is unaffected by the transform
      // already on the thumb — the delta between the two is always exact.
      thumb.style.width = `${active.offsetWidth}px`;
      thumb.style.transform = `translateX(${active.offsetLeft - thumb.offsetLeft}px)`;
    }
  },

  /* -------------------------------------------------------------- screens */
  showScreen(next) {
    const current = $('.screen.is-active');
    if (current === next) return;

    if (current) {
      current.classList.add('is-leaving');
      setTimeout(() => {
        current.classList.remove('is-active', 'is-leaving');
        current.hidden = true;
      }, 260);
    }
    setTimeout(() => {
      next.hidden = false;
      next.classList.add('is-active');
      this.syncThumbs();
    }, current ? 260 : 0);
  },

  startMatch() {
    Sound.init(); Sound.resume(); Sound.start();
    Game.reset();
    this.renderBoard();
    this.renderScore();
    this.showScreen(this.el.screenGame);
    setTimeout(() => { this.updateTurn(); this.maybeAIMove(); }, 320);
  },

  toMenu() {
    Confetti.clear();
    this.closeModal(this.el.resultOverlay);
    this.showScreen(this.el.screenMenu);
    Sound.click();
  },

  newGame() {
    Confetti.clear();
    Game.reset(false);
    this.renderBoard();
    this.renderScore();
    this.updateTurn();
    this.maybeAIMove();
    Sound.start();
  },

  restartRound() {
    Confetti.clear();
    Game.reset();
    this.renderBoard();
    this.updateTurn();
    this.maybeAIMove();
    Sound.click();
  },

  /* ------------------------------------------------------------ gameplay */
  humanMove(index) {
    if (Game.over || Game.busy || Game.board[index] || !Game.isHumanTurn()) return;
    this.commitMove(index);
    if (!Game.over) this.maybeAIMove();
  },

  commitMove(index) {
    const player = Game.current;
    if (!Game.play(index, player)) return;

    this.paintCell(index, player);
    Sound.deploy(player);

    if (Game.over) this.endRound();
    else this.updateTurn();
  },

  async maybeAIMove() {
    if (!Game.vsAI || Game.over || Game.isHumanTurn()) return;

    Game.busy = true;
    this.el.board.classList.add('is-locked');
    this.el.turnBar.classList.add('is-thinking');

    // A short, slightly random delay reads as "thinking" and lets the
    // previous ship finish its landing animation.
    await wait(rand(420, 820));

    const move = AI.choose([...Game.board], Game.aiSide, Game.state.difficulty);
    if (move === null || Game.over) { this.clearBusy(); return; }

    // targeting flash on the chosen sector
    const cell = this.cells[move];
    cell.classList.add('is-targeted');
    await wait(200);
    cell.classList.remove('is-targeted');

    this.clearBusy();
    this.commitMove(move);
  },

  clearBusy() {
    Game.busy = false;
    this.el.board.classList.remove('is-locked');
    this.el.turnBar.classList.remove('is-thinking');
  },

  /**
   * Inline a ship instead of referencing it with <use>.
   * <use> renders into a shadow tree that document CSS cannot select into,
   * so the thruster flicker and rotating hull seams would never animate.
   * Cloning the symbol's contents keeps the ship in the light DOM.
   */
  shipMarkup(side, className = '') {
    const symbol = document.getElementById(`ship-${side.toLowerCase()}`);
    return `<svg class="${className}" viewBox="0 0 100 100">${symbol ? symbol.innerHTML : ''}</svg>`;
  },

  /** Drop a ship into a cell. */
  paintCell(index, player) {
    const cell = this.cells[index];
    const mark = document.createElement('span');
    mark.className = `mark mark--${player.toLowerCase()}`;
    mark.innerHTML = `<span class="mark__inner">${this.shipMarkup(player)}</span>`;

    cell.appendChild(mark);
    cell.classList.add('is-taken', player === 'X' ? 'is-x' : 'is-o');
    cell.setAttribute('aria-label', this.cellLabel(index, player));
    cell.setAttribute('aria-disabled', 'true');
  },

  renderBoard() {
    this.el.winline.classList.remove('is-on');
    this.el.board.classList.remove('is-draw', 'is-locked');

    this.cells.forEach((cell, i) => {
      cell.className = 'cell ripple';
      cell.removeAttribute('aria-disabled');
      cell.setAttribute('aria-label', this.cellLabel(i, null));
      cell.tabIndex = i === 0 ? 0 : -1;
      $$('.mark', cell).forEach(m => m.remove());
    });
    this.focusIndex = 0;
    this.updateGhosts();
  },

  updateTurn() {
    const p = Game.current;
    const isHuman = Game.isHumanTurn();

    this.el.turnBar.dataset.player = p;
    this.el.turnMark.className = `turn__mark tag tag--${p.toLowerCase()}`;
    this.el.turnMark.innerHTML = `<svg viewBox="0 0 100 100"><use href="#ship-${p.toLowerCase()}-mini"/></svg>`;

    this.el.turnText.textContent = Game.vsAI
      ? (isHuman ? `Your move — deploy the ${SHIP_NAME[p]}` : 'Computer is plotting a course')
      : `${Game.nameOf(p)}'s move — ${SHIP_NAME[p]}`;

    this.el.scoreX.classList.toggle('is-turn', p === 'X' && !Game.over);
    this.el.scoreO.classList.toggle('is-turn', p === 'O' && !Game.over);

    this.updateGhosts();
  },

  renderScore() {
    const s = Game.state.score;
    this.el.winsX.textContent = s.X;
    this.el.winsO.textContent = s.O;
    this.el.draws.textContent = s.draws;
    this.el.roundNum.textContent = s.round;

    this.el.nameX.textContent = Game.vsAI
      ? (Game.state.humanSide === 'X' ? 'You' : 'Computer')
      : 'Player 1';
    this.el.nameO.textContent = Game.vsAI
      ? (Game.state.humanSide === 'O' ? 'You' : 'Computer')
      : 'Player 2';

    const diff = Game.state.difficulty;
    this.el.modeChip.textContent = Game.vsAI
      ? `vs AI · ${diff[0].toUpperCase()}${diff.slice(1)}`
      : '2 Players · Local';
  },

  /* ---------------------------------------------------------- end of round */
  endRound() {
    Game.state.score.round++;
    Store.save(Game.state);

    this.el.board.classList.add('is-locked');
    this.el.scoreX.classList.remove('is-turn');
    this.el.scoreO.classList.remove('is-turn');

    if (Game.winner === 'draw') this.showDraw();
    else this.showWin(Game.winner);

    this.renderScore();
    this.bumpScore(Game.winner);
  },

  showWin(winner) {
    const line = Game.winLine;

    // highlight winners, dim the rest
    this.cells.forEach((cell, i) => {
      if (line.includes(i)) cell.classList.add('is-win');
      else cell.classList.add('is-dim');
    });

    this.drawWinLine(line);
    this.el.winline.classList.add('is-on');

    const humanWon = !Game.vsAI || winner === Game.state.humanSide;
    humanWon ? Sound.win() : Sound.lose();

    // confetti erupts from the middle of the board
    if (humanWon || !Game.vsAI) {
      const r = this.el.board.getBoundingClientRect();
      Confetti.celebrate(r.left + r.width / 2, r.top + r.height / 2, this.fleetColors(winner));
    }

    this.el.turnText.textContent = `${Game.nameOf(winner)} — ${SHIP_NAME[winner]} takes the line`;
    setTimeout(() => this.openResult(winner), 1150);
  },

  showDraw() {
    this.el.board.classList.add('is-draw');
    Sound.draw();
    this.el.turnText.textContent = 'Stalemate — both fleets hold';
    setTimeout(() => this.openResult('draw'), 900);
  },

  /** Colours for confetti / accents, pulled live from the CSS variables. */
  fleetColors(side) {
    const cs = getComputedStyle(document.documentElement);
    const pick = n => cs.getPropertyValue(n).trim();
    return side === 'X'
      ? [pick('--x-color'), pick('--x-lite'), pick('--accent'), '#ffffff', pick('--x-color-2')]
      : [pick('--o-color'), pick('--o-lite'), pick('--accent'), '#ffffff', pick('--o-color-2')];
  },

  /**
   * Draw the winning streak. Cell centres are measured from the live layout
   * and converted into the SVG's 0–100 space, so it stays correct at any size.
   */
  drawWinLine(line) {
    const boardRect = this.el.board.getBoundingClientRect();
    const centre = i => {
      const r = this.cells[i].getBoundingClientRect();
      return {
        x: ((r.left + r.width / 2) - boardRect.left) / boardRect.width * 100,
        y: ((r.top + r.height / 2) - boardRect.top) / boardRect.height * 100
      };
    };

    const a = centre(line[0]);
    const b = centre(line[2]);

    // extend a little past both ends so the streak overshoots the ships
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ext = 6;
    const ux = (dx / len) * ext, uy = (dy / len) * ext;

    const seg = this.el.winSeg;
    seg.setAttribute('x1', a.x - ux);
    seg.setAttribute('y1', a.y - uy);
    seg.setAttribute('x2', b.x + ux);
    seg.setAttribute('y2', b.y + uy);
  },

  bumpScore(winner) {
    const node = winner === 'draw' ? this.el.draws : (winner === 'X' ? this.el.winsX : this.el.winsO);
    node.classList.remove('is-bumped');
    void node.offsetWidth;                 // restart the animation
    node.classList.add('is-bumped');
  },

  /* --------------------------------------------------------------- modals */
  openResult(outcome) {
    const { resultBadge: badge, resultTitle: title, resultSub: sub } = this.el;
    const s = Game.state.score;

    this.el.rWinsX.textContent = s.X;
    this.el.rWinsO.textContent = s.O;
    this.el.rDraws.textContent = s.draws;

    if (outcome === 'draw') {
      badge.className = 'result__badge is-draw';
      badge.innerHTML = `<svg class="icon"><use href="#i-equal"/></svg>`;
      title.textContent = 'Stalemate';
      sub.textContent = 'Every sector contested, no line taken. Reset and go again.';
    } else {
      badge.className = `result__badge is-${outcome.toLowerCase()}`;
      badge.innerHTML = this.shipMarkup(outcome, 'ship-badge');

      const human = Game.vsAI && outcome === Game.state.humanSide;
      const lost  = Game.vsAI && outcome !== Game.state.humanSide;

      title.textContent = Game.vsAI
        ? (human ? 'Victory!' : 'Defeated')
        : `${Game.nameOf(outcome)} wins!`;

      sub.textContent = lost
        ? `The ${SHIP_NAME[outcome]} locked three sectors. Re-arm and take the centre.`
        : `The ${SHIP_NAME[outcome]} locked three sectors — flawless run.`;
    }

    this.openModal(this.el.resultOverlay);
  },

  openModal(overlay) {
    if (!overlay || !overlay.hidden) return;
    this.lastFocused = document.activeElement;
    overlay.hidden = false;
    Sound.click();

    // focus the first control, and trap Tab inside the dialog
    const focusables = this.focusablesIn(overlay);
    focusables[0]?.focus();

    overlay._trap = e => {
      if (e.key !== 'Tab') return;
      const items = this.focusablesIn(overlay);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    overlay.addEventListener('keydown', overlay._trap);
  },

  closeModal(overlay) {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    if (overlay._trap) overlay.removeEventListener('keydown', overlay._trap);
    this.lastFocused?.focus?.();
  },

  focusablesIn(root) {
    return $$('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', root)
      .filter(el => el.offsetParent !== null);
  },

  /* ------------------------------------------------------- focus handling */
  focusCell(index) {
    index = clamp(index, 0, 8);
    this.cells.forEach((c, i) => { c.tabIndex = i === index ? 0 : -1; });
    this.cells[index].focus();
    this.focusIndex = index;
  }
};


/* ==========================================================================
   BOOT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => UI.init());
