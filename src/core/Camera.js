import { TILE_W, TILE_H } from '../constants.js';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.5;

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;

  constructor(cssW, cssH, topOffset = 48) {
    // Place apex tile (0,0) just below the HUD
    this.x = cssW / 2;
    this.y = topOffset + TILE_H + 10;
  }

  pan(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  zoomAt(screenX, screenY, factor) {
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoom * factor));
    const scale = next / this.zoom;
    this.x = screenX + (this.x - screenX) * scale;
    this.y = screenY + (this.y - screenY) * scale;
    this.zoom = next;
  }

  worldToScreen(tx, ty, elev = 0) {
    const sx = (tx - ty) * (TILE_W / 2) * this.zoom + this.x;
    const sy = ((tx + ty) * (TILE_H / 2) - elev * (TILE_H / 2)) * this.zoom + this.y;
    return { sx, sy };
  }

  screenToWorld(sx, sy) {
    const rx = (sx - this.x) / this.zoom;
    const ry = (sy - this.y) / this.zoom;
    const tx = Math.floor((rx / (TILE_W / 2) + ry / (TILE_H / 2)) / 2);
    const ty = Math.floor((ry / (TILE_H / 2) - rx / (TILE_W / 2)) / 2);
    return { tx, ty };
  }

  isVisible(tx, ty, cssW, cssH, elev = 0) {
    const { sx, sy } = this.worldToScreen(tx, ty, elev);
    const hw = (TILE_W / 2) * this.zoom;
    const hh = (TILE_H / 2) * this.zoom;
    return sx + hw > 0 && sx - hw < cssW && sy + hh > 0 && sy - hh < cssH;
  }
}
