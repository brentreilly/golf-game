// Fuel system — depletion, fuel can spawning, and pickup detection

const MAX_FUEL = 100;
const FUEL_DRAIN_RATE = 2;       // percent per second when driving (~50s full tank)
const FUEL_IDLE_DRAIN = 0.5;     // percent per second when idle
const FUEL_CAN_REFILL = 30;      // percent refilled per can
const PICKUP_RADIUS = 50;        // very generous pickup detection (1.5x visual)
const CAN_SIZE = 22;
const COLLECT_FX_DURATION = 0.6;

export class FuelSystem {
  constructor() {
    this.fuel = MAX_FUEL;
    this.cans = [];
    this.nextCanDistance = 0;
    this.collectedFx = [];        // visual feedback for collected cans
  }

  reset() {
    this.fuel = MAX_FUEL;
    this.cans = [];
    this.collectedFx = [];
    this.nextCanDistance = 100;    // first can at 100m
  }

  get percent() {
    return Math.max(0, this.fuel);
  }

  isEmpty() {
    return this.fuel <= 0;
  }

  update(dt, truck, terrain, distance) {
    // Drain fuel
    const driving = Math.abs(truck.vx) > 10;
    const drainRate = driving ? FUEL_DRAIN_RATE : FUEL_IDLE_DRAIN;
    this.fuel -= drainRate * dt;

    // Spawn fuel cans based on distance
    while (distance >= this.nextCanDistance) {
      this.spawnCan(this.nextCanDistance, terrain);
      this.nextCanDistance += this.getSpawnInterval(this.nextCanDistance);
    }

    // Check pickup
    for (let i = this.cans.length - 1; i >= 0; i--) {
      const can = this.cans[i];
      if (can.collected) continue;

      const dx = truck.x - can.x;
      const dy = truck.y - can.y;
      if (Math.sqrt(dx * dx + dy * dy) < PICKUP_RADIUS) {
        can.collected = true;
        this.fuel = Math.min(MAX_FUEL, this.fuel + FUEL_CAN_REFILL);
        this.collectedFx.push({ x: can.x, y: can.y, timer: COLLECT_FX_DURATION });
      }
    }

    // Update collected effects
    for (let i = this.collectedFx.length - 1; i >= 0; i--) {
      this.collectedFx[i].timer -= dt;
      if (this.collectedFx[i].timer <= 0) this.collectedFx.splice(i, 1);
    }

    // Cleanup old cans far behind truck
    this.cans = this.cans.filter(c => c.x > truck.x - 500);
  }

  getSpawnInterval(distanceMeters) {
    // Fuel cans space out as distance increases
    if (distanceMeters < 500) return 150 + Math.random() * 50;
    if (distanceMeters < 1500) return 250 + Math.random() * 100;
    return 350 + Math.random() * 150;
  }

  spawnCan(distanceMeters, terrain) {
    // Place can on terrain surface
    const worldX = distanceMeters * 10; // meters back to world units
    const terrainY = terrain.heightAt(worldX);
    this.cans.push({
      x: worldX,
      y: terrainY - CAN_SIZE - 2, // sit on top of terrain
      collected: false,
    });
  }

  render(ctx) {
    // Draw fuel cans
    for (const can of this.cans) {
      if (can.collected) continue;

      ctx.save();
      ctx.translate(can.x, can.y);

      // Glow (simple circle behind — cheaper than shadowBlur on Fire HD)
      ctx.fillStyle = 'rgba(57, 255, 20, 0.15)';
      ctx.beginPath();
      ctx.arc(0, 0, CAN_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Can body
      ctx.fillStyle = '#39ff14';
      ctx.beginPath();
      ctx.roundRect(-CAN_SIZE / 2, -CAN_SIZE / 2, CAN_SIZE, CAN_SIZE, 3);
      ctx.fill();

      // "F" label
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('F', 0, 1);

      ctx.restore();
    }

    // Collection effect — expanding ring
    for (const fx of this.collectedFx) {
      const progress = 1 - (fx.timer / COLLECT_FX_DURATION);
      const alpha = 1 - progress;
      const radius = 15 + progress * 30;

      ctx.strokeStyle = `rgba(57, 255, 20, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
