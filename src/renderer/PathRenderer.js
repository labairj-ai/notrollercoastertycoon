import { GRID_SIZE, SURFACE } from '../constants.js';
import { drawIsoDiamond } from './DrawPrimitives.js';

// No stroke on path tiles so adjacent tiles visually merge into a connected road.
const PATH_FILL = '#8b7355';

export class PathRenderer {
  render(ctx, world, cam, cssW, cssH) {
    for (let ty = 0; ty < GRID_SIZE; ty++) {
      for (let tx = 0; tx < GRID_SIZE; tx++) {
        const tile = world.grid.get(tx, ty);
        if (tile.surface !== SURFACE.PATH) continue;
        if (!cam.isVisible(tx, ty, cssW, cssH, tile.elevation)) continue;
        const { sx, sy } = cam.worldToScreen(tx, ty, tile.elevation);
        drawIsoDiamond(ctx, sx, sy, cam.zoom, PATH_FILL, null);
      }
    }
  }
}
