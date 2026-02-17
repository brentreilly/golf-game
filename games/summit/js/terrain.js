// Procedural terrain generation using layered sine waves
// HCR2-inspired: grass surface, dirt underground, sharper hills earlier

const SEGMENT_WIDTH = 5; // world units between terrain sample points
const GROUND_BASE = 400; // base Y position (lower = higher on screen in canvas)
const GRASS_DEPTH = 8;   // thickness of the grass strip on surface

export class Terrain {
  constructor() {
    this.heights = []; // array of {x, y} points
    this.generatedUpTo = 0;
    this.reset();
  }

  reset() {
    this.heights = [];
    this.generatedUpTo = 0;
    // Generate initial chunk
    this.ensureGenerated(3000);
  }

  // Generate terrain points up to worldX
  ensureGenerated(worldX) {
    while (this.generatedUpTo < worldX) {
      const x = this.generatedUpTo;
      const y = this.getHeightAt(x);
      this.heights.push({ x, y });
      this.generatedUpTo += SEGMENT_WIDTH;
    }
  }

  // Calculate terrain height at any X position using layered sine waves
  getHeightAt(x) {
    // Distance factor (0 to 1+) controls difficulty ramp
    const dist = x / 10; // convert to meters
    const progress = Math.min(dist / 2000, 1); // 0→1 over 2000m

    // Base gentle rolling
    let h = Math.sin(x * 0.003) * 60;

    // Medium hills — kick in earlier and stronger
    h += Math.sin(x * 0.008 + 1.3) * (50 + progress * 90);

    // Sharper features — start sooner
    h += Math.sin(x * 0.02 + 2.7) * (20 + progress * 60);

    // Sharp peaks at moderate distance (was 0.3, now 0.15)
    if (progress > 0.15) {
      h += Math.sin(x * 0.04 + 4.1) * ((progress - 0.15) * 70);
    }

    // Steep ramps at distance
    if (progress > 0.5) {
      h += Math.sin(x * 0.06 + 5.5) * ((progress - 0.5) * 40);
    }

    return GROUND_BASE - h;
  }

  // Get height at arbitrary X by interpolating between sample points
  heightAt(x) {
    if (x <= 0) return GROUND_BASE;
    const idx = x / SEGMENT_WIDTH;
    const i = Math.floor(idx);
    const frac = idx - i;

    if (i >= this.heights.length - 1) {
      return this.getHeightAt(x);
    }

    const a = this.heights[i];
    const b = this.heights[i + 1];
    return a.y + (b.y - a.y) * frac;
  }

  // Get terrain slope angle at X
  slopeAt(x) {
    const dx = SEGMENT_WIDTH * 0.5;
    const left = this.heightAt(x - dx);
    const right = this.heightAt(x + dx);
    return Math.atan2(right - left, dx * 2);
  }

  render(ctx, camX, viewW, camY, viewH) {
    const left = camX - viewW * 0.5;
    const right = camX + viewW * 1.5;

    // Find visible range indices
    const startIdx = Math.max(0, Math.floor(left / SEGMENT_WIDTH) - 1);
    const endIdx = Math.min(this.heights.length - 1, Math.ceil(right / SEGMENT_WIDTH) + 1);

    if (startIdx >= endIdx) return;

    const bottomY = camY + viewH;
    const firstX = this.heights[startIdx].x;
    const lastX = this.heights[endIdx].x;

    // --- Underground dirt (main fill) ---
    ctx.beginPath();
    ctx.moveTo(firstX, this.heights[startIdx].y);
    for (let i = startIdx; i <= endIdx; i++) {
      ctx.lineTo(this.heights[i].x, this.heights[i].y);
    }
    ctx.lineTo(lastX, bottomY);
    ctx.lineTo(firstX, bottomY);
    ctx.closePath();

    // Dirt gradient: lighter near surface, darker deeper
    const dirtGrad = ctx.createLinearGradient(0, GROUND_BASE - 150, 0, GROUND_BASE + 200);
    dirtGrad.addColorStop(0, '#8B6914');
    dirtGrad.addColorStop(0.3, '#6B4E12');
    dirtGrad.addColorStop(0.7, '#4A3510');
    dirtGrad.addColorStop(1, '#2D1F08');
    ctx.fillStyle = dirtGrad;
    ctx.fill();

    // --- Grass surface strip ---
    ctx.beginPath();
    ctx.moveTo(firstX, this.heights[startIdx].y);
    for (let i = startIdx; i <= endIdx; i++) {
      ctx.lineTo(this.heights[i].x, this.heights[i].y);
    }
    // Trace back along offset path for grass thickness
    for (let i = endIdx; i >= startIdx; i--) {
      ctx.lineTo(this.heights[i].x, this.heights[i].y + GRASS_DEPTH);
    }
    ctx.closePath();
    ctx.fillStyle = '#4a7c2e';
    ctx.fill();

    // --- Surface edge (darker green line) ---
    ctx.beginPath();
    ctx.moveTo(firstX, this.heights[startIdx].y);
    for (let i = startIdx; i <= endIdx; i++) {
      ctx.lineTo(this.heights[i].x, this.heights[i].y);
    }
    ctx.strokeStyle = '#2d5a1a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Dirt texture lines (horizontal stripes underground) ---
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let stripe = 30; stripe < 300; stripe += 40) {
      ctx.beginPath();
      for (let i = startIdx; i <= endIdx; i++) {
        const p = this.heights[i];
        const y = p.y + GRASS_DEPTH + stripe;
        if (i === startIdx) ctx.moveTo(p.x, y);
        else ctx.lineTo(p.x, y);
      }
      ctx.stroke();
    }
  }

  // Render parallax background hills (called before camera transform)
  renderBackground(ctx, camX, camY, viewW, viewH) {
    // --- Far mountains (very slow parallax) ---
    const farOffset = camX * 0.05;
    ctx.fillStyle = '#0d1520';
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let x = 0; x <= viewW + 50; x += 50) {
      const worldX = x + farOffset;
      const h = Math.sin(worldX * 0.0008) * 80
              + Math.sin(worldX * 0.0015 + 2) * 50
              + Math.sin(worldX * 0.003 + 5) * 25;
      ctx.lineTo(x, viewH * 0.35 - h);
    }
    ctx.lineTo(viewW + 50, viewH);
    ctx.closePath();
    ctx.fill();

    // --- Mid mountains ---
    const midOffset = camX * 0.12;
    ctx.fillStyle = '#111d2a';
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let x = 0; x <= viewW + 40; x += 40) {
      const worldX = x + midOffset;
      const h = Math.sin(worldX * 0.0012) * 60
              + Math.sin(worldX * 0.003 + 1.5) * 35
              + Math.sin(worldX * 0.005 + 3) * 15;
      ctx.lineTo(x, viewH * 0.45 - h);
    }
    ctx.lineTo(viewW + 40, viewH);
    ctx.closePath();
    ctx.fill();

    // --- Near hills (faster parallax) ---
    const nearOffset = camX * 0.25;
    ctx.fillStyle = '#1a2a18';
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let x = 0; x <= viewW + 30; x += 30) {
      const worldX = x + nearOffset;
      const h = Math.sin(worldX * 0.002) * 40
              + Math.sin(worldX * 0.005 + 2.2) * 25
              + Math.sin(worldX * 0.01 + 4) * 10;
      ctx.lineTo(x, viewH * 0.55 - h);
    }
    ctx.lineTo(viewW + 30, viewH);
    ctx.closePath();
    ctx.fill();
  }
}
