const SHIP_SIZE = 15;
const ROTATION_SPEED = Math.PI; // radians per second
const THRUST = 300; // pixels per second squared
const MAX_SPEED = 400; // pixels per second
const FRICTION = 0.985; // applied each frame

export class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2; // pointing up
    this.vx = 0;
    this.vy = 0;
    this.thrusting = false;
    this.rotatingLeft = false;
    this.rotatingRight = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.dead = false;
  }

  update(dt, width, height) {
    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    if (this.rotatingLeft) this.angle -= ROTATION_SPEED * dt;
    if (this.rotatingRight) this.angle += ROTATION_SPEED * dt;

    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > MAX_SPEED) {
        this.vx = (this.vx / speed) * MAX_SPEED;
        this.vy = (this.vy / speed) * MAX_SPEED;
      }
    } else {
      this.vx *= Math.pow(FRICTION, dt * 60);
      this.vy *= Math.pow(FRICTION, dt * 60);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Wrap around screen edges
    if (this.x < 0) this.x += width;
    if (this.x > width) this.x -= width;
    if (this.y < 0) this.y += height;
    if (this.y > height) this.y -= height;
  }

  draw(ctx) {
    // Blink when invincible
    if (this.invincible && Math.floor(this.invincibleTimer * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE * 0.8, SHIP_SIZE * 0.6);
    ctx.lineTo(-SHIP_SIZE * 0.5, 0);
    ctx.lineTo(-SHIP_SIZE * 0.8, -SHIP_SIZE * 0.6);
    ctx.closePath();
    ctx.stroke();

    // Thruster flame
    if (this.thrusting) {
      ctx.strokeStyle = '#f80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-SHIP_SIZE * 0.5, SHIP_SIZE * 0.3);
      ctx.lineTo(-SHIP_SIZE * 1.4, 0);
      ctx.lineTo(-SHIP_SIZE * 0.5, -SHIP_SIZE * 0.3);
      ctx.stroke();
    }

    ctx.restore();
  }

  respawn(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = -Math.PI / 2;
    this.dead = false;
    this.invincible = true;
    this.invincibleTimer = 3;
  }

  getRadius() {
    return SHIP_SIZE * 0.8;
  }

  getTipPosition() {
    return {
      x: this.x + Math.cos(this.angle) * SHIP_SIZE,
      y: this.y + Math.sin(this.angle) * SHIP_SIZE,
    };
  }
}
