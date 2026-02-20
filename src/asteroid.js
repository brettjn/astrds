const ASTEROID_SIZES = {
  large:  { radius: 50, speed: 80,  points: 20  },
  medium: { radius: 25, speed: 130, points: 50  },
  small:  { radius: 12, speed: 200, points: 100 },
};

const SIZE_SEQUENCE = ['large', 'medium', 'small'];

export class Asteroid {
  constructor(x, y, size = 'large') {
    this.x = x;
    this.y = y;
    this.size = size;

    const props = ASTEROID_SIZES[size];
    this.radius = props.radius;
    this.points = props.points;

    const speed = props.speed * (0.6 + Math.random() * 0.8);
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.vertices = this._generateVertices();
  }

  _generateVertices() {
    const count = 8 + Math.floor(Math.random() * 5);
    const vertices = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = this.radius * (0.65 + Math.random() * 0.6);
      vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return vertices;
  }

  update(dt, width, height) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Wrap around screen edges (account for radius so they don't pop in)
    if (this.x < -this.radius)             this.x += width  + this.radius * 2;
    if (this.x >  width + this.radius)     this.x -= width  + this.radius * 2;
    if (this.y < -this.radius)             this.y += height + this.radius * 2;
    if (this.y >  height + this.radius)    this.y -= height + this.radius * 2;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  split() {
    const idx = SIZE_SEQUENCE.indexOf(this.size);
    if (idx === SIZE_SEQUENCE.length - 1) return [];
    const nextSize = SIZE_SEQUENCE[idx + 1];
    return [
      new Asteroid(this.x, this.y, nextSize),
      new Asteroid(this.x, this.y, nextSize),
    ];
  }
}

export function createInitialAsteroids(count, width, height, safeX, safeY) {
  const asteroids = [];
  const minDist = 150;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = Math.random() * width;
      y = Math.random() * height;
    } while (Math.hypot(x - safeX, y - safeY) < minDist);
    asteroids.push(new Asteroid(x, y, 'large'));
  }
  return asteroids;
}
