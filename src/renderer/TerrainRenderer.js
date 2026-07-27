import { GRID_SIZE, TERRAIN } from '../constants.js';
import { drawIsoDiamond } from './DrawPrimitives.js';

const COLORS = {
  [TERRAIN.GRASS]: { top: '#5a8a3c', edge: '#4a7a2c' },
  [TERRAIN.SAND]:  { top: '#d4b483', edge: '#c4a473' },
  [TERRAIN.WATER]: { top: '#3a7fc1', edge: '#2a6fb1' },
  [TERRAIN.ROCK]:  { top: '#888888', edge: '#777777' },
};

export class TerrainRenderer {
  render(ctx, world, cam, cssW, cssH) {
    // Row-col order is correct painter order for flat terrain.
    // When elevation is added in later phases, switch to diagonal-sum iteration.
    for (let ty = 0; ty < GRID_SIZE; ty++) {
      for (let tx = 0; tx < GRID_SIZE; tx++) {
        if (!cam.isVisible(tx, ty, cssW, cssH)) continue;
        const tile = world.grid.get(tx, ty);
        const { sx, sy } = cam.worldToScreen(tx, ty, tile.elevation);
        const c = COLORS[tile.terrain] ?? COLORS[TERRAIN.GRASS];
        drawIsoDiamond(ctx, sx, sy, cam.zoom, c.top, c.edge);
      }
    }
  }
}
