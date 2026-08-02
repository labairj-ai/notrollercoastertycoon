import { PEEP_STATE } from '../peeps/Peep.js';

const BASE_RADIUS = 3; // px at zoom=1

export class PeepRenderer {
  render(ctx, world, cam, cssW, cssH) {
    if (world.peeps.length === 0) return;

    ctx.save();
    for (const peep of world.peeps) {
      if (peep.state === PEEP_STATE.GONE || peep.state === PEEP_STATE.AT_RIDE) continue;

      const tile = world.grid.get(Math.round(peep.visualTx), Math.round(peep.visualTy));
      const elev = tile?.elevation ?? 0;

      const { sx, sy } = cam.worldToScreen(peep.visualTx, peep.visualTy, elev);
      if (sx < -20 || sx > cssW + 20 || sy < -20 || sy > cssH + 20) continue;

      const r = Math.max(2, BASE_RADIUS * cam.zoom);

      // Body
      ctx.globalAlpha = 0.92;
      ctx.fillStyle   = peep.color;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(sx - r * 0.28, sy - r * 0.28, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
