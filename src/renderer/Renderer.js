import { TerrainRenderer } from './TerrainRenderer.js';

export class Renderer {
  #terrain = new TerrainRenderer();

  render(worldCtx, uiCtx, world, cam, cssW, cssH) {
    worldCtx.clearRect(0, 0, cssW, cssH);
    uiCtx.clearRect(0, 0, cssW, cssH);

    // Phase 1
    this.#terrain.render(worldCtx, world, cam, cssW, cssH);

    // Phase 2+: path, ride, peep, train renderers added here in draw order
  }
}
