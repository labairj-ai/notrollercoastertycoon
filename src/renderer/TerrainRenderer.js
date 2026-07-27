import { GRID_SIZE, TERRAIN, ELEV_HEIGHT } from '../constants.js';
import { drawIsoDiamond, drawIsoBox } from './DrawPrimitives.js';

// top = top face, right/left = box side faces (light from top-right)
const COLORS = {
  [TERRAIN.GRASS]: { top: '#5a8a3c', edge: '#4a7a2c', right: '#4a7a2c', left: '#3d6128' },
  [TERRAIN.SAND]:  { top: '#d4b483', edge: '#c4a473', right: '#c4a473', left: '#a8875a' },
  [TERRAIN.WATER]: { top: '#3a7fc1', edge: '#2a6fb1', right: '#2a6fb1', left: '#1a5f9e' },
  [TERRAIN.ROCK]:  { top: '#888888', edge: '#777777', right: '#777777', left: '#666666' },
};

export class TerrainRenderer {
  render(ctx, world, cam, cssW, cssH) {
    for (let ty = 0; ty < GRID_SIZE; ty++) {
      for (let tx = 0; tx < GRID_SIZE; tx++) {
        const tile = world.grid.get(tx, ty);
        // Check visibility at the tile's elevated top face
        if (!cam.isVisible(tx, ty, cssW, cssH, tile.elevation)) continue;

        const c = COLORS[tile.terrain] ?? COLORS[TERRAIN.GRASS];

        if (tile.elevation > 0) {
          // drawIsoBox expects ground-level center (elevation=0), rises upward by boxH
          const { sx, sy } = cam.worldToScreen(tx, ty, 0);
          const boxH = tile.elevation * ELEV_HEIGHT;
          drawIsoBox(ctx, sx, sy, cam.zoom, boxH, c.top, c.left, c.right);
        } else {
          const { sx, sy } = cam.worldToScreen(tx, ty, 0);
          drawIsoDiamond(ctx, sx, sy, cam.zoom, c.top, c.edge);
        }
      }
    }
  }
}
