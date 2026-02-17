# Summit — Monster Truck Hill Climber

**One-line pitch:** Drive a monster truck over endless desert hills, grab fuel to keep going, and chase your best distance.

## Core Mechanic

**Two-thumb gas/brake.** Hold the right side of the screen to accelerate forward. Hold the left side to brake/reverse. The truck drives over procedurally generated desert terrain. The fun comes from managing speed, catching air, and not flipping over steep hills.

- **One gesture per thumb** — hold to activate, release to stop
- **Instantly satisfying** — the truck responds immediately, wheels spin, dust flies
- **Visible result** — every touch moves the truck, kicks up dust, and changes the distance counter

## Controls Layout

```
+-------------------------------------------+
|  [🏔️ 1,247m]                    [⏸ PAUSE] |
|                                            |
|          ~~~TERRAIN & TRUCK~~~             |
|        ⛽ FUEL [████████░░]                |
|                                            |
|  [◀ BRAKE]                      [GAS ▶]  |
|  (left half)                  (right half) |
+-------------------------------------------+
```

- **Gas zone:** Entire right half of screen (below game area). Big semi-transparent arrow icon as a hint.
- **Brake zone:** Entire left half of screen (below game area). Big semi-transparent arrow icon.
- **Distance:** Top-left, neon green, Press Start 2P font. Shows meters traveled.
- **Fuel bar:** Centered below the truck, horizontal bar that depletes left-to-right. Green when full, yellow when low, red when critical.
- **Pause:** Top-right corner, 48px+ tap target, ⏸ icon.

Touch zones are the full bottom ~30% of the screen split in half. No small buttons to miss.

## Progression / Fun Loop

**Distance chasing.** One number: how far you got in meters. Beat your best distance.

- Current distance displayed prominently during play
- Best distance saved to localStorage
- End screen shows: "You drove 1,247m!" with best distance comparison
- If new record: celebratory animation (flashing neon text, simple particle burst)

## Entity List

| # | Entity | Visual | Purpose |
|---|--------|--------|---------|
| 1 | **Monster Truck** | Chunky rectangle body + two large circle wheels. Dark body with neon accent stripe. | Player vehicle. Physics-driven with gravity, torque, and rotation. |
| 2 | **Terrain** | Sandy brown/orange filled polygon with darker outline. Procedural hills via layered sine waves. | The "level." Gets progressively steeper and more irregular with distance. |
| 3 | **Fuel Can** | Bright neon green ⛽ icon sitting on terrain surface. | Pickup that refills ~25% of fuel bar. Spawns every 200-400m, randomized. |
| 4 | **Dust Particles** | Small brown/tan circles that fade out. Max 10-15 at once. | Visual feedback when wheels touch ground. No gameplay impact. |

## Visual Style

- **Background:** Dark night sky gradient (deep navy → black). Simple pixel stars (static dots, 20-30 of them).
- **Terrain:** Sandy brown (#c2956b) fill with darker (#8b6914) outline. Solid fill, no textures.
- **Truck:** Canvas2D drawn. Dark body (#333) with neon green (#39ff14) accent stripe. Big round wheels with visible axle dots.
- **Dust:** Small circles in sandy colors, spawn at wheel contact points, fade out over 0.5s.
- **Fuel cans:** Neon green rectangle with ⛽ or simple "F" label. Glow effect (shadow blur).
- **UI text:** Press Start 2P font. Neon green (#39ff14) for distance. White for labels.
- **Fuel bar:** 200px wide bar. Green → yellow → red gradient as it depletes. Subtle pulse animation when critically low.
- **Night desert vibe:** Fits the arcade dark aesthetic while clearly reading as outdoor terrain.

## Difficulty Approach

### Terrain Progression
- **0-500m:** Gentle rolling hills. Smooth sine waves, low amplitude. Easy cruising.
- **500-1500m:** Hills get taller and steeper. Occasional sharp peaks. Moderate challenge.
- **1500m+:** Steep climbs, sharp drops, irregular terrain. The truck catches real air. Expert zone.

### Fuel Economy
- **0-500m:** Fuel cans every 150-200m. Hard to run out.
- **500-1500m:** Fuel cans every 250-350m. Need to be aware of fuel.
- **1500m+:** Fuel cans every 350-500m. Fuel tension becomes real.

### Forgiveness
- **Flipping:** The truck has a wide wheelbase and low center of gravity. Hard to flip. If the truck DOES go past 150°, it auto-rights with a bounce after 1 second. No death — just a brief pause and lost momentum.
- **Generous collision:** Fuel can pickup radius is 1.5x visual size.
- **Fuel runs out = run ends.** Screen shows "OUT OF GAS!" with distance and a big "TAP TO RETRY" button. One tap = instant restart.
- **No lives, no penalties.** Every run starts fresh with full fuel.

## Tech Notes

- **Renderer:** Canvas2D only. No Three.js needed — this is a 2D side-scroller.
- **Physics:** Simple custom physics. No library needed.
  - Truck = two wheels (circles) connected by a rigid body
  - Gravity pulls down, gas applies torque to wheels
  - Wheels follow terrain surface via raycasting down from wheel positions
  - Angular momentum for air rotation
  - Simple ground friction and air drag
- **Terrain generation:** Procedural using layered sine waves with increasing amplitude/frequency over distance. Generate chunks ahead of the camera, discard chunks behind.
- **Camera:** Follows the truck with slight lookahead in the direction of movement. Smooth lerp.
- **Performance budget:** <30 active objects at any time. Terrain drawn as a single polygon path per frame. Dust particles pooled and recycled.
- **Libraries:** None. Vanilla HTML/CSS/JS with Canvas2D.
- **Target resolution:** 1280x800 (Fire HD landscape). Responsive canvas scaling.
- **Font:** Press Start 2P via Google Fonts CDN.
- **Storage:** localStorage for best distance.

## File Structure

```
games/summit/
├── index.html          ← Game page (canvas + UI overlay)
├── css/
│   └── summit.css      ← Game UI styles (fuel bar, buttons, overlays)
└── js/
    ├── main.js         ← Entry point, game loop, state management
    ├── truck.js        ← Monster truck entity, physics, rendering
    ├── terrain.js      ← Procedural terrain generation and rendering
    ├── camera.js       ← Camera follow logic
    ├── fuel.js         ← Fuel system, fuel can spawning and pickup
    ├── particles.js    ← Dust particle pool
    └── ui.js           ← HUD (distance, fuel bar), pause, game-over screen
```

## Game Name

**SUMMIT** — short, punchy, fits the arcade card. Suggests climbing to the top.

### Arcade Card

```
[🏔️]
SUMMIT
Monster Truck Hills
```
