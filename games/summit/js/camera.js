// Camera follows the truck with smooth lerp and lookahead

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }

  update(dt, truck) {
    // Target: truck position with forward lookahead based on velocity
    const lookahead = Math.max(0, truck.vx * 0.4);
    const targetX = truck.x + lookahead;
    const targetY = truck.y - 50; // keep truck slightly above center

    // Smooth lerp — faster horizontal, gentler vertical
    const lerpX = 1 - Math.pow(0.02, dt);
    const lerpY = 1 - Math.pow(0.05, dt);

    this.x += (targetX - this.x) * lerpX;
    this.y += (targetY - this.y) * lerpY;
  }
}
