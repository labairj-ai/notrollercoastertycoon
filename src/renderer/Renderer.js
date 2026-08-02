import { TerrainRenderer } from './TerrainRenderer.js';
import { PathRenderer } from './PathRenderer.js';
import { RideRenderer } from './RideRenderer.js';
import { TrackRenderer } from './TrackRenderer.js';
import { TrainRenderer } from './TrainRenderer.js';
import { PeepRenderer } from './PeepRenderer.js';

// Sky color stops: [timeOfDay 0–1, r, g, b]
// 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1 = midnight
const SKY_STOPS = [
  [0.00,  13,  17,  35],  // midnight — deep navy
  [0.18,  25,  20,  65],  // pre-dawn purple
  [0.25, 215, 120,  55],  // sunrise golden
  [0.33,  90, 155, 220],  // morning blue
  [0.50,  65, 125, 210],  // midday
  [0.67,  90, 155, 220],  // afternoon
  [0.75, 215, 100,  45],  // sunset orange
  [0.82,  35,  25,  70],  // post-dusk
  [1.00,  13,  17,  35],  // midnight
];

function skyColor(t) {
  for (let i = 1; i < SKY_STOPS.length; i++) {
    const [t0, r0, g0, b0] = SKY_STOPS[i - 1];
    const [t1, r1, g1, b1] = SKY_STOPS[i];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return `rgb(${Math.round(r0+(r1-r0)*f)},${Math.round(g0+(g1-g0)*f)},${Math.round(b0+(b1-b0)*f)})`;
    }
  }
  return 'rgb(13,17,35)';
}

export class Renderer {
  #terrain = new TerrainRenderer();
  #path    = new PathRenderer();
  #ride    = new RideRenderer();
  #track   = new TrackRenderer();
  #train   = new TrainRenderer();
  #peep    = new PeepRenderer();

  render(worldCtx, uiCtx, world, trackEditor, cam, cssW, cssH) {
    const sky = skyColor(world.timeOfDay);

    // Fill with sky color instead of clearRect — also colors the area outside the grid
    worldCtx.fillStyle = sky;
    worldCtx.fillRect(0, 0, cssW, cssH);
    uiCtx.clearRect(0, 0, cssW, cssH);

    // Keep the HTML body background in sync for safe-area regions on mobile
    document.body.style.background = sky;

    this.#terrain.render(worldCtx, world, cam, cssW, cssH);
    this.#path.render(worldCtx, world, cam, cssW, cssH);
    this.#ride.render(worldCtx, world, cam);
    this.#track.render(worldCtx, world, trackEditor, cam, cssW, cssH);
    this.#train.render(worldCtx, world, cam, cssW, cssH);
    this.#peep.render(worldCtx, world, cam, cssW, cssH);
  }
}
