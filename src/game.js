import { Ship } from './ship.js';
import { Asteroid, createInitialAsteroids } from './asteroid.js';
import { Bullet } from './bullet.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

const INITIAL_LIVES = 3;
const INITIAL_ASTEROIDS = 4;
const SHOOT_COOLDOWN = 0.25; // seconds between shots
const HIGH_SCORE_KEY = 'astrds_highscore';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.state = 'start'; // 'start' | 'playing' | 'dead' | 'gameover'
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    this.lives = INITIAL_LIVES;
    this.level = 1;

    this.ship = null;
    this.asteroids = [];
    this.bullets = [];
    this.shootCooldown = 0;
    this.respawnTimer = 0;

    this.keys = {};
    this.lastTime = null;

    this._setupInput();
    requestAnimationFrame((t) => this._loop(t));
  }

  // ── Input ────────────────────────────────────────────────────────────────

  _setupInput() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state === 'start' || this.state === 'gameover') {
          this._startGame();
        }
      }
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  // ── Game-state transitions ───────────────────────────────────────────────

  _startGame() {
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.level = 1;
    this.bullets = [];
    this.shootCooldown = 0;
    this.respawnTimer = 0;
    this.ship = new Ship(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.asteroids = createInitialAsteroids(
      INITIAL_ASTEROIDS,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
    );
    this.state = 'playing';
  }

  _nextLevel() {
    this.level++;
    this.bullets = [];
    this.shootCooldown = 0;
    this.respawnTimer = 0;
    this.ship = new Ship(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.ship.invincible = true;
    this.ship.invincibleTimer = 3;
    const count = INITIAL_ASTEROIDS + this.level - 1;
    this.asteroids = createInitialAsteroids(
      count,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
    );
    this.state = 'playing';
  }

  // ── Main loop ────────────────────────────────────────────────────────────

  _loop(timestamp) {
    const dt = this.lastTime
      ? Math.min((timestamp - this.lastTime) / 1000, 0.05)
      : 0;
    this.lastTime = timestamp;

    this._update(dt);
    this._draw();

    requestAnimationFrame((t) => this._loop(t));
  }

  // ── Update ───────────────────────────────────────────────────────────────

  _update(dt) {
    if (this.state === 'dead') {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.ship.respawn(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        this.state = 'playing';
      }
      // Still update asteroids while dead
      this.asteroids.forEach((a) => a.update(dt, CANVAS_WIDTH, CANVAS_HEIGHT));
      return;
    }

    if (this.state !== 'playing') return;

    // Ship input
    this.ship.rotatingLeft  = !!(this.keys['ArrowLeft']  || this.keys['KeyA']);
    this.ship.rotatingRight = !!(this.keys['ArrowRight'] || this.keys['KeyD']);
    this.ship.thrusting     = !!(this.keys['ArrowUp']    || this.keys['KeyW']);

    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    if ((this.keys['Space'] || this.keys['KeyX']) && this.shootCooldown <= 0) {
      this._shoot();
      this.shootCooldown = SHOOT_COOLDOWN;
    }

    this.ship.update(dt, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Bullets
    this.bullets.forEach((b) => b.update(dt, CANVAS_WIDTH, CANVAS_HEIGHT));
    this.bullets = this.bullets.filter((b) => b.active);

    // Asteroids
    this.asteroids.forEach((a) => a.update(dt, CANVAS_WIDTH, CANVAS_HEIGHT));

    // Collision: bullet ↔ asteroid
    this._handleBulletAsteroidCollisions();

    // Collision: ship ↔ asteroid
    if (!this.ship.invincible) {
      this._handleShipAsteroidCollisions();
    }

    // Level complete when all asteroids are cleared
    if (this.asteroids.length === 0) {
      this._nextLevel();
    }

    // Keep high score up to date
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    }
  }

  _shoot() {
    const tip = this.ship.getTipPosition();
    this.bullets.push(new Bullet(tip.x, tip.y, this.ship.angle));
  }

  _handleBulletAsteroidCollisions() {
    const bulletsToDeactivate = new Set();
    const asteroidsToDestroy = new Set();
    const newAsteroids = [];

    for (let bi = 0; bi < this.bullets.length; bi++) {
      const bullet = this.bullets[bi];
      for (let ai = 0; ai < this.asteroids.length; ai++) {
        if (asteroidsToDestroy.has(ai)) continue;
        const asteroid = this.asteroids[ai];
        if (Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y) < asteroid.radius) {
          bulletsToDeactivate.add(bi);
          asteroidsToDestroy.add(ai);
          this.score += asteroid.points;
          newAsteroids.push(...asteroid.split());
          break;
        }
      }
    }

    bulletsToDeactivate.forEach((i) => { this.bullets[i].active = false; });
    this.bullets = this.bullets.filter((b) => b.active);
    this.asteroids = this.asteroids.filter((_, i) => !asteroidsToDestroy.has(i));
    this.asteroids.push(...newAsteroids);
  }

  _handleShipAsteroidCollisions() {
    for (const asteroid of this.asteroids) {
      if (
        Math.hypot(this.ship.x - asteroid.x, this.ship.y - asteroid.y) <
        asteroid.radius + this.ship.getRadius()
      ) {
        this._shipDestroyed();
        return;
      }
    }
  }

  _shipDestroyed() {
    this.ship.dead = true;
    this.lives--;
    if (this.lives <= 0) {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
      }
      this.state = 'gameover';
    } else {
      this.state = 'dead';
      this.respawnTimer = 1.5;
    }
  }

  // ── Draw ─────────────────────────────────────────────────────────────────

  _draw() {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.state === 'start') {
      this._drawStartScreen();
      return;
    }

    // Game objects
    this.asteroids.forEach((a) => a.draw(ctx));
    this.bullets.forEach((b) => b.draw(ctx));
    if (this.ship && !this.ship.dead) this.ship.draw(ctx);

    // HUD
    this._drawHUD();

    if (this.state === 'gameover') {
      this._drawGameOver();
    }
  }

  _drawStartScreen() {
    const ctx = this.ctx;
    ctx.textAlign = 'center';

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 72px monospace';
    ctx.fillText('ASTRDS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    ctx.font = '22px monospace';
    ctx.fillText('Press SPACE to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.font = '15px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(
      'Arrow Keys / WASD to move   SPACE / X to fire',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 65,
    );

    ctx.fillStyle = '#ff0';
    ctx.font = '18px monospace';
    ctx.fillText(`High Score: ${this.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
  }

  _drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f33';
    ctx.font = 'bold 60px monospace';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`Score: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.fillStyle = '#ff0';
    ctx.fillText(`High Score: ${this.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);

    ctx.fillStyle = '#aaa';
    ctx.font = '18px monospace';
    ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
  }

  _drawHUD() {
    const ctx = this.ctx;
    ctx.font = '20px monospace';

    // Score (top-left)
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 10, 30);

    // High score (top-centre)
    ctx.textAlign = 'center';
    ctx.fillText(`HI: ${this.highScore}`, CANVAS_WIDTH / 2, 30);

    // Level (top-right)
    ctx.textAlign = 'right';
    ctx.fillText(`Level: ${this.level}`, CANVAS_WIDTH - 10, 30);

    // Lives — draw small ship icons
    for (let i = 0; i < this.lives; i++) {
      this._drawLifeIcon(ctx, CANVAS_WIDTH - 20 - i * 24, 55);
    }
  }

  _drawLifeIcon(ctx, x, y) {
    const s = 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.8, s * 0.6);
    ctx.lineTo(-s * 0.5, 0);
    ctx.lineTo(-s * 0.8, -s * 0.6);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}
