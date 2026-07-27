import { GRID_SIZE } from '../constants.js';
import { Tile } from './Tile.js';

export class TileGrid {
  #tiles;
  version = 0; // bump on structural changes to invalidate path caches

  constructor() {
    this.#tiles = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => new Tile());
  }

  get(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= GRID_SIZE || ty >= GRID_SIZE) return null;
    return this.#tiles[ty * GRID_SIZE + tx];
  }

  set(tx, ty, tile) {
    if (tx < 0 || ty < 0 || tx >= GRID_SIZE || ty >= GRID_SIZE) return;
    this.#tiles[ty * GRID_SIZE + tx] = tile;
    this.version++;
  }

  neighbors(tx, ty) {
    return [
      this.get(tx,     ty - 1), // N
      this.get(tx + 1, ty    ), // E
      this.get(tx,     ty + 1), // S
      this.get(tx - 1, ty    ), // W
    ];
  }
}
