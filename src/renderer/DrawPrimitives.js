import { TILE_W, TILE_H } from '../constants.js';

// All functions work in CSS pixels. The ctx DPR transform (set in Game.#resize)
// scales to physical pixels automatically — never multiply by DPR here.

export function drawIsoDiamond(ctx, sx, sy, zoom, fillColor, strokeColor) {
  const hw = (TILE_W / 2) * zoom;
  const hh = (TILE_H / 2) * zoom;
  ctx.beginPath();
  ctx.moveTo(sx,      sy - hh);
  ctx.lineTo(sx + hw, sy     );
  ctx.lineTo(sx,      sy + hh);
  ctx.lineTo(sx - hw, sy     );
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

export function drawIsoBox(ctx, sx, sy, zoom, boxH, topColor, leftColor, rightColor) {
  const hw = (TILE_W / 2) * zoom;
  const hh = (TILE_H / 2) * zoom;
  const eh = boxH * zoom;

  // Top face
  ctx.beginPath();
  ctx.moveTo(sx,      sy - hh - eh);
  ctx.lineTo(sx + hw, sy      - eh);
  ctx.lineTo(sx,      sy + hh - eh);
  ctx.lineTo(sx - hw, sy      - eh);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();

  // Left face
  ctx.beginPath();
  ctx.moveTo(sx - hw, sy      - eh);
  ctx.lineTo(sx,      sy + hh - eh);
  ctx.lineTo(sx,      sy + hh    );
  ctx.lineTo(sx - hw, sy         );
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();

  // Right face
  ctx.beginPath();
  ctx.moveTo(sx + hw, sy      - eh);
  ctx.lineTo(sx,      sy + hh - eh);
  ctx.lineTo(sx,      sy + hh    );
  ctx.lineTo(sx + hw, sy         );
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();
}

export function drawIsoSlope(ctx, sx, sy, zoom, dz, facing, color) {
  const hw = (TILE_W / 2) * zoom;
  const hh = (TILE_H / 2) * zoom;
  const eh = dz * (hh / 2) * zoom; // elevation delta in px

  // Simplified slope quad — proper per-face shading added in Phase 4 (track renderer)
  ctx.beginPath();
  if (facing === 'N') {
    ctx.moveTo(sx,      sy - hh - eh);
    ctx.lineTo(sx + hw, sy          );
    ctx.lineTo(sx,      sy + hh     );
    ctx.lineTo(sx - hw, sy      - eh);
  } else if (facing === 'S') {
    ctx.moveTo(sx,      sy - hh     );
    ctx.lineTo(sx + hw, sy      - eh);
    ctx.lineTo(sx,      sy + hh - eh);
    ctx.lineTo(sx - hw, sy          );
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
