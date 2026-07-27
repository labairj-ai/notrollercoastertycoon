import { TerrainRenderer } from './TerrainRenderer.js';
import { PathRenderer } from './PathRenderer.js';
import { RideRenderer } from './RideRenderer.js';

export class Renderer {
  #terrain = new TerrainRenderer();
  #path    = new PathRenderer();
  #ride    = new RideRenderer();

  render(worldCtx, uiCtx, world, cam, cssW, cssH) {
    worldCtx.clearRect(0, 0, cssW, cssH);
    uiCtx.clearRect(0, 0, cssW, cssH);

    this.#terrain.render(worldCtx, world, cam, cssW, cssH);
    this.#path.render(worldCtx, world, cam, cssW, cssH);
    this.#ride.render(worldCtx, world, cam);

    // Phase 4+: track, peep, train renderers added here
  }
}
