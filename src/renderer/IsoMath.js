import { TILE_W, TILE_H } from '../constants.js';

export function worldToScreen(tx, ty, elev, cam) {
  const sx = (tx - ty) * (TILE_W / 2) * cam.zoom + cam.x;
  const sy = ((tx + ty) * (TILE_H / 2) - elev * (TILE_H / 2)) * cam.zoom + cam.y;
  return { sx, sy };
}

export function screenToWorld(sx, sy, cam) {
  const rx = (sx - cam.x) / cam.zoom;
  const ry = (sy - cam.y) / cam.zoom;
  const tx = Math.floor((rx / (TILE_W / 2) + ry / (TILE_H / 2)) / 2);
  const ty = Math.floor((ry / (TILE_H / 2) - rx / (TILE_W / 2)) / 2);
  return { tx, ty };
}

// Lower key = drawn first = visually behind.
// For flat terrain, row-col order (ty-outer, tx-inner) is equivalent and cache-friendly.
// Switch to diagonal sum ordering when elevation or tall objects are introduced.
export function painterKey(tx, ty) {
  return tx + ty;
}
