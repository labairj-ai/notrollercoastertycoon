import { TERRAIN, SURFACE } from '../constants.js';

export class Tile {
  terrain   = TERRAIN.GRASS;
  elevation = 0;
  surface   = SURFACE.NONE;
  pathMask  = 0;   // 4-bit neighbor connectivity bitmask
  rideId    = null;
  hasLitter = false;
  hasVomit  = false;
}
