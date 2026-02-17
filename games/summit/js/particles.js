// Dust particle pool — spawns behind wheels when grounded

const MAX_PARTICLES = 20;
const PARTICLE_LIFETIME = 0.6;

const DUST_COLORS = ['#d4b896', '#c9a87c', '#e0c8a0', '#dbb87a'];

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.spawnTimer = 0;
  }

  reset() {
    this.particles = [];
    this.spawnTimer = 0;
  }

  update(dt, truck) {
    // Spawn dust when grounded and moving
    if (truck.grounded && Math.abs(truck.vx) > 30) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 0.03; // spawn rate
        this.spawnDust(truck);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 20 * dt; // drift upward
    }
  }

  spawnDust(truck) {
    if (this.particles.length >= MAX_PARTICLES) return;

    // Spawn behind the truck (at rear wheel area)
    const cos = Math.cos(truck.angle);
    const sin = Math.sin(truck.angle);
    const rearX = truck.x - cos * 30;
    const rearY = truck.y - sin * 30;

    this.particles.push({
      x: rearX + (Math.random() - 0.5) * 10,
      y: rearY + (Math.random() - 0.5) * 5,
      vx: -truck.vx * 0.1 + (Math.random() - 0.5) * 20,
      vy: -(Math.random() * 30 + 10),
      life: PARTICLE_LIFETIME * (0.7 + Math.random() * 0.3),
      radius: Math.random() * 5 + 3,
      color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
    });
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / PARTICLE_LIFETIME);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
