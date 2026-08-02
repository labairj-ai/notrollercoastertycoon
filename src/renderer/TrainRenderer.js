import { TILE_W, TILE_H } from '../constants.js';
import { PIECE_TYPE } from '../track/PieceCatalog.js';

const CART_COLOR    = '#e82020';
const CART_BOARDING = '#f5c400';
const CART_OUTLINE  = '#1a0000';
const WINDOW_COLOR  = '#aaddff';

export class TrainRenderer {
  render(ctx, world, cam, cssW, cssH) {
    for (const train of world.trains.values()) {
      const layout = world.coasters.get(train.layoutId);
      if (!layout) continue;
      this.#drawTrain(ctx, train, layout, cam, cssW, cssH);
    }
  }

  #cartPos(piece, t, cam) {
    const { sx, sy } = cam.worldToScreen(piece.tx, piece.ty, piece.elev);
    const hw = (TILE_W / 2) * cam.zoom;
    const hh = (TILE_H / 2) * cam.zoom;

    const conn = [
      [sx + hw * 0.5, sy - hh * 0.5],  // N
      [sx + hw * 0.5, sy + hh * 0.5],  // E
      [sx - hw * 0.5, sy + hh * 0.5],  // S
      [sx - hw * 0.5, sy - hh * 0.5],  // W
    ];

    // Match TrackRenderer: slope exit is at piece.elev + piece.dz
    const exitSy = sy - piece.dz * hh;
    const connExit = piece.dz !== 0 ? [
      [sx + hw * 0.5, exitSy - hh * 0.5],
      [sx + hw * 0.5, exitSy + hh * 0.5],
      [sx - hw * 0.5, exitSy + hh * 0.5],
      [sx - hw * 0.5, exitSy - hh * 0.5],
    ] : conn;

    const [ex, ey] = conn[piece.entryDir];
    const [xx, xy] = connExit[piece.exitDir];

    const isCurve = piece.type === PIECE_TYPE.CURVE_L || piece.type === PIECE_TYPE.CURVE_R;

    if (isCurve) {
      if (t < 0.5) {
        const u = t * 2;
        return { px: ex + (sx - ex) * u, py: ey + (sy - ey) * u, ex, ey, xx: sx, xy: sy };
      } else {
        const u = (t - 0.5) * 2;
        return { px: sx + (xx - sx) * u, py: sy + (xy - sy) * u, ex: sx, ey: sy, xx, xy };
      }
    }

    return { px: ex + (xx - ex) * t, py: ey + (xy - ey) * t, ex, ey, xx, xy };
  }

  #drawTrain(ctx, train, layout, cam, cssW, cssH) {
    const pieces = layout.pieces;
    if (!pieces.length) return;

    const piece = pieces[train.pieceIdx];
    if (!cam.isVisible(piece.tx, piece.ty, cssW, cssH, piece.elev)) return;

    const { px, py, ex, ey, xx, xy } = this.#cartPos(piece, train.t, cam);

    // Direction vector for cart orientation
    const dx = xx - ex;
    const dy = xy - ey;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // Perpendicular
    const perpX = -uy;
    const perpY =  ux;

    const halfL = Math.max(5, cam.zoom * 9);   // half-length along track
    const halfW = Math.max(3, cam.zoom * 5.5); // half-width perpendicular

    const bodyColor = train.status === 'BOARDING' ? CART_BOARDING : CART_COLOR;

    // Body trapezoid
    ctx.globalAlpha = 1;
    ctx.fillStyle   = bodyColor;
    ctx.strokeStyle = CART_OUTLINE;
    ctx.lineWidth   = Math.max(1, cam.zoom * 1.2);

    ctx.beginPath();
    ctx.moveTo(px + ux * halfL + perpX * halfW, py + uy * halfL + perpY * halfW);
    ctx.lineTo(px + ux * halfL - perpX * halfW, py + uy * halfL - perpY * halfW);
    ctx.lineTo(px - ux * halfL - perpX * halfW, py - uy * halfL - perpY * halfW);
    ctx.lineTo(px - ux * halfL + perpX * halfW, py - uy * halfL + perpY * halfW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Window strip (front third of cart)
    if (cam.zoom > 0.5) {
      ctx.fillStyle = WINDOW_COLOR;
      ctx.globalAlpha = 0.75;
      const wOff = halfL * 0.35;
      ctx.beginPath();
      ctx.moveTo(px + ux * halfL + perpX * halfW * 0.6,     py + uy * halfL + perpY * halfW * 0.6);
      ctx.lineTo(px + ux * halfL - perpX * halfW * 0.6,     py + uy * halfL - perpY * halfW * 0.6);
      ctx.lineTo(px + ux * (halfL - wOff) - perpX * halfW * 0.6, py + uy * (halfL - wOff) - perpY * halfW * 0.6);
      ctx.lineTo(px + ux * (halfL - wOff) + perpX * halfW * 0.6, py + uy * (halfL - wOff) + perpY * halfW * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
