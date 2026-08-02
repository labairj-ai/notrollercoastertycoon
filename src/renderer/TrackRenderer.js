import { TILE_W, TILE_H } from '../constants.js';
import { PIECE_TYPE } from '../track/PieceCatalog.js';
import { EDITOR_STATE } from '../track/TrackEditor.js';

// ── palette ─────────────────────────────────────────────────────────────────
const C = {
  bed:        '#2a1e12',
  rail:       '#9a9aaa',
  tie:        '#5a3a18',
  slope:      '#1e3a5a',
  brake:      '#c03030',
  station:    '#d4b84a',
  stationEdge:'#a08020',
  ghost_ok:   'rgba(80,220,80,0.65)',
  ghost_bad:  'rgba(220,60,60,0.65)',
};

const RAIL_HALF = 4;   // half-gap between rails (unscaled px)
const TIE_COUNT = 3;   // ties per piece

export class TrackRenderer {
  render(ctx, world, trackEditor, cam, cssW, cssH) {
    // Closed coasters stored in world
    for (const layout of world.coasters.values()) {
      for (const piece of layout.pieces) {
        if (cam.isVisible(piece.tx, piece.ty, cssW, cssH, piece.elev)) {
          this.#drawPiece(ctx, piece, cam, 1.0, true);
        }
      }
    }

    // In-progress layout from the editor
    if (trackEditor?.layout) {
      for (const piece of trackEditor.layout.pieces) {
        if (cam.isVisible(piece.tx, piece.ty, cssW, cssH, piece.elev)) {
          this.#drawPiece(ctx, piece, cam, 1.0, true);
        }
      }
    }

    // Ghost piece
    const ghost = trackEditor?.ghost;
    if (ghost?.piece) {
      const { tx, ty, elev } = ghost;
      if (cam.isVisible(tx, ty, cssW, cssH, elev)) {
        this.#drawPiece(ctx, ghost.piece, cam, 0.55, ghost.canPlace);
      }
    }
  }

  // ── per-piece draw ─────────────────────────────────────────────────────────

  #drawPiece(ctx, piece, cam, alpha, valid) {
    const { sx, sy } = cam.worldToScreen(piece.tx, piece.ty, piece.elev);
    const hw = (TILE_W / 2) * cam.zoom;
    const hh = (TILE_H / 2) * cam.zoom;

    // Edge midpoints at piece.elev (entry side)
    const conn = [
      [sx + hw * 0.5, sy - hh * 0.5],  // 0 N
      [sx + hw * 0.5, sy + hh * 0.5],  // 1 E
      [sx - hw * 0.5, sy + hh * 0.5],  // 2 S
      [sx - hw * 0.5, sy - hh * 0.5],  // 3 W
    ];

    // Slope pieces exit at a different elevation — only sy changes with elev
    const exitSy = sy - piece.dz * hh;
    const connExit = piece.dz !== 0 ? [
      [sx + hw * 0.5, exitSy - hh * 0.5],  // 0 N at exit elev
      [sx + hw * 0.5, exitSy + hh * 0.5],  // 1 E at exit elev
      [sx - hw * 0.5, exitSy + hh * 0.5],  // 2 S at exit elev
      [sx - hw * 0.5, exitSy - hh * 0.5],  // 3 W at exit elev
    ] : conn;

    const [ex, ey] = conn[piece.entryDir];
    const [xx, xy] = connExit[piece.exitDir];

    ctx.globalAlpha = alpha;

    if (!valid) {
      ctx.strokeStyle = C.ghost_bad;
      ctx.lineWidth   = Math.max(2, cam.zoom * 3);
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(sx, sy);
      ctx.lineTo(xx, xy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      return;
    }

    const isCurve = piece.type === PIECE_TYPE.CURVE_L || piece.type === PIECE_TYPE.CURVE_R;

    if (piece.isStation) {
      this.#drawStation(ctx, ex, ey, xx, xy, sx, sy, cam.zoom);
    } else if (isCurve) {
      this.#drawCurve(ctx, ex, ey, sx, sy, xx, xy, cam.zoom, piece.isBrake);
    } else {
      // Ramp face drawn first so rails render on top of it
      if (piece.dz !== 0) this.#drawSlopeRamp(ctx, piece, conn, hh, cam.zoom);
      this.#drawStraight(ctx, ex, ey, xx, xy, cam.zoom, piece.dz !== 0, piece.isBrake);
    }

    ctx.globalAlpha = 1;
  }

  // ── shape helpers ──────────────────────────────────────────────────────────

  #railOffset(ex, ey, xx, xy) {
    const dx  = xx - ex;
    const dy  = xy - ey;
    const len = Math.hypot(dx, dy) || 1;
    return { nx: -dy / len, ny: dx / len }; // unit perpendicular (CCW)
  }

  // Draws the vertical ramp face at the exit side of a slope piece.
  // conn is at piece.elev; the face spans from conn[exitDir] (base level)
  // to connExit[exitDir] (elevated level), bridging the step visually.
  #drawSlopeRamp(ctx, piece, conn, hh, zoom) {
    const g = RAIL_HALF * zoom;
    // cx,cy is the exit edge midpoint at piece.elev (the BASE of the step for Up,
    // the TOP of the step for Down)
    const [cx, cy] = conn[piece.exitDir];

    const [ex, ey] = conn[piece.entryDir];
    const [xx, xy] = conn[piece.exitDir];
    const { nx, ny } = this.#railOffset(ex, ey, xx, xy);

    // faceH: negative = upward on screen (Up slope), positive = downward (Down slope)
    const faceH = -piece.dz * hh;

    ctx.fillStyle = piece.dz > 0 ? '#2a5a8a' : '#8a4a1a';
    ctx.beginPath();
    ctx.moveTo(cx + nx * g * 2, cy);
    ctx.lineTo(cx - nx * g * 2, cy);
    ctx.lineTo(cx - nx * g * 2, cy + faceH);
    ctx.lineTo(cx + nx * g * 2, cy + faceH);
    ctx.closePath();
    ctx.fill();

    // Highlight at the elevated edge (where rails connect to next piece)
    ctx.strokeStyle = piece.dz > 0 ? '#6ab0e0' : '#e0904a';
    ctx.lineWidth   = Math.max(1.5, zoom * 2);
    ctx.beginPath();
    ctx.moveTo(cx + nx * g * 2, cy + faceH);
    ctx.lineTo(cx - nx * g * 2, cy + faceH);
    ctx.stroke();
  }

  #drawStraight(ctx, ex, ey, xx, xy, zoom, isSlope, isBrake) {
    const g = RAIL_HALF * zoom;
    const { nx, ny } = this.#railOffset(ex, ey, xx, xy);

    // Track bed
    ctx.fillStyle = isSlope ? C.slope : C.bed;
    ctx.beginPath();
    ctx.moveTo(ex + nx * g * 2, ey + ny * g * 2);
    ctx.lineTo(xx + nx * g * 2, xy + ny * g * 2);
    ctx.lineTo(xx - nx * g * 2, xy - ny * g * 2);
    ctx.lineTo(ex - nx * g * 2, ey - ny * g * 2);
    ctx.closePath();
    ctx.fill();

    // Cross-ties
    const tc = isBrake ? C.brake : C.tie;
    ctx.strokeStyle = tc;
    ctx.lineWidth   = Math.max(1, zoom * 1.5);
    for (let i = 1; i <= TIE_COUNT; i++) {
      const t  = i / (TIE_COUNT + 1);
      const mx = ex + (xx - ex) * t;
      const my = ey + (xy - ey) * t;
      ctx.beginPath();
      ctx.moveTo(mx + nx * g * 1.8, my + ny * g * 1.8);
      ctx.lineTo(mx - nx * g * 1.8, my - ny * g * 1.8);
      ctx.stroke();
    }

    // Rails
    ctx.strokeStyle = isBrake ? C.brake : C.rail;
    ctx.lineWidth   = Math.max(1, zoom * 1.5);
    for (const s of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(ex + nx * g * s, ey + ny * g * s);
      ctx.lineTo(xx + nx * g * s, xy + ny * g * s);
      ctx.stroke();
    }
  }

  #drawCurve(ctx, ex, ey, mx, my, xx, xy, zoom, isBrake) {
    // Two-segment approximation through tile centre
    const g = RAIL_HALF * zoom;

    // Bed quads for each segment
    const segments = [
      [ex, ey, mx, my],
      [mx, my, xx, xy],
    ];
    ctx.fillStyle = C.bed;
    for (const [ax, ay, bx, by] of segments) {
      const { nx, ny } = this.#railOffset(ax, ay, bx, by);
      ctx.beginPath();
      ctx.moveTo(ax + nx*g*2, ay + ny*g*2);
      ctx.lineTo(bx + nx*g*2, by + ny*g*2);
      ctx.lineTo(bx - nx*g*2, by - ny*g*2);
      ctx.lineTo(ax - nx*g*2, ay - ny*g*2);
      ctx.closePath();
      ctx.fill();
    }

    // Rails as two-segment polylines
    ctx.strokeStyle = isBrake ? C.brake : C.rail;
    ctx.lineWidth   = Math.max(1, zoom * 1.5);
    for (const s of [1, -1]) {
      ctx.beginPath();
      for (const [ax, ay, bx, by] of segments) {
        const { nx, ny } = this.#railOffset(ax, ay, bx, by);
        ctx.moveTo(ax + nx*g*s, ay + ny*g*s);
        ctx.lineTo(bx + nx*g*s, by + ny*g*s);
      }
      ctx.stroke();
    }

    // Tie at centre
    {
      const { nx: n1, ny: ny1 } = this.#railOffset(ex, ey, mx, my);
      ctx.strokeStyle = isBrake ? C.brake : C.tie;
      ctx.lineWidth   = Math.max(1, zoom * 1.5);
      ctx.beginPath();
      ctx.moveTo(mx + n1*g*1.8, my + ny1*g*1.8);
      ctx.lineTo(mx - n1*g*1.8, my - ny1*g*1.8);
      ctx.stroke();
    }
  }

  #drawStation(ctx, ex, ey, xx, xy, sx, sy, zoom) {
    const g = RAIL_HALF * zoom;
    const { nx, ny } = this.#railOffset(ex, ey, xx, xy);

    // Platform (wider than regular track)
    ctx.fillStyle   = C.station;
    ctx.strokeStyle = C.stationEdge;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(ex + nx*g*3, ey + ny*g*3);
    ctx.lineTo(xx + nx*g*3, xy + ny*g*3);
    ctx.lineTo(xx - nx*g*3, xy - ny*g*3);
    ctx.lineTo(ex - nx*g*3, ey - ny*g*3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rails
    ctx.strokeStyle = C.rail;
    ctx.lineWidth   = Math.max(1, zoom * 1.5);
    for (const s of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(ex + nx*g*s, ey + ny*g*s);
      ctx.lineTo(xx + nx*g*s, xy + ny*g*s);
      ctx.stroke();
    }

    // 'S' label when zoomed in enough
    if (zoom > 0.55) {
      ctx.fillStyle    = '#2a1a00';
      ctx.font         = `bold ${Math.round(9 * zoom)}px system-ui`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', sx, sy - (TILE_H / 2) * zoom * 0.35);
    }
  }
}
