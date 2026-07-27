import { TerrainRenderer } from './TerrainRenderer.js';
import { PathRenderer } from './PathRenderer.js';

export class Renderer {
  #terrain = new TerrainRenderer();
  #path    = new PathRenderer();

  render(worldCtx, uiCtx, world, cam, cssW, cssH) {
    worldCtx.clearRect(0, 0, cssW, cssH);
    uiCtx.clearRect(0, 0, cssW, cssH);

    this.#terrain.render(worldCtx, world, cam, cssW, cssH);
    this.#path.render(worldCtx, world, cam, cssW, cssH);

    // Phase 3+: ride, peep, train, UI renderers added here
  }
}
