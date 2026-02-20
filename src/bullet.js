const BULLET_SPEED = 550;    // pixels per second
const BULLET_LIFETIME = 1.1; // seconds

export class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.lifetime = BULLET_LIFETIME;
    this.active = true;
  }

  update(dt, width, height) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;

    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }

    // Wrap around screen edges
    if (this.x < 0)       this.x += width;
    if (this.x > width)   this.x -= width;
    if (this.y < 0)       this.y += height;
    if (this.y > height)  this.y -= height;
  }

  draw(ctx) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
