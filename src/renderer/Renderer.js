import { TerrainRenderer } from './TerrainRenderer.js';
import { PathRenderer } from './PathRenderer.js';
import { RideRenderer } from './RideRenderer.js';
import { TrackRenderer } from './TrackRenderer.js';

export class Renderer {
  #terrain = new TerrainRenderer();
  #path    = new PathRenderer();
  #ride    = new RideRenderer();
  #track   = new TrackRenderer();

  render(worldCtx, uiCtx, world, trackEditor, cam, cssW, cssH) {
    worldCtx.clearRect(0, 0, cssW, cssH);
    uiCtx.clearRect(0, 0, cssW, cssH);

    this.#terrain.render(worldCtx, world, cam, cssW, cssH);
    this.#path.render(worldCtx, world, cam, cssW, cssH);
    this.#ride.render(worldCtx, world, cam);
    this.#track.render(worldCtx, world, trackEditor, cam, cssW, cssH);
  }
}
