import { PEEP_STATE } from '../peeps/Peep.js';

const SKIN = '#e8b88a';

export class PeepRenderer {
  render(ctx, world, cam, cssW, cssH) {
    if (world.peeps.length === 0) return;

    const s = cam.zoom;

    // ── Build AT_RIDE cluster map (tile key → ordered array of peeps) ─────────
    const atRideMap = new Map();
    for (const peep of world.peeps) {
      if (peep.state !== PEEP_STATE.AT_RIDE) continue;
      const key = `${peep.tx},${peep.ty}`;
      if (!atRideMap.has(key)) atRideMap.set(key, []);
      atRideMap.get(key).push(peep);
    }

    ctx.save();
    ctx.globalAlpha = 0.92;

    // ── AT_RIDE clusters: standing figures near ride entry tile ───────────────
    for (const [, peeps] of atRideMap) {
      const ref  = peeps[0];
      const tile = world.grid.get(ref.tx, ref.ty);
      const elev = tile?.elevation ?? 0;
      const { sx, sy } = cam.worldToScreen(ref.tx, ref.ty, elev);
      if (sx < -40 || sx > cssW + 40 || sy < -80 || sy > cssH + 40) continue;

      for (let n = 0; n < peeps.length; n++) {
        const peep = peeps[n];
        // 4-per-row grid spread across the tile surface
        const ox = (n % 4 - 1.5) * 5 * s;
        const oy = (Math.floor(n / 4) - 0.5) * 4 * s;
        this.#drawPeep(ctx, sx + ox, sy + oy, s, peep, 0);
      }
    }

    // ── Walking + leaving peeps: animated figures ─────────────────────────────
    for (const peep of world.peeps) {
      if (peep.state === PEEP_STATE.GONE || peep.state === PEEP_STATE.AT_RIDE) continue;

      const tile = world.grid.get(Math.round(peep.visualTx), Math.round(peep.visualTy));
      const elev = tile?.elevation ?? 0;
      const { sx, sy } = cam.worldToScreen(peep.visualTx, peep.visualTy, elev);
      if (sx < -20 || sx > cssW + 20 || sy < -60 || sy > cssH + 20) continue;

      // 2 full strides per tile — stepT drives the walk cycle
      const walkPhase = peep.stepT * Math.PI * 4;
      this.#drawPeep(ctx, sx, sy, s, peep, walkPhase);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Draw one peep figure at screen position (sx, sy).
  // walkPhase=0 → standing still; otherwise drives leg/arm swing.
  #drawPeep(ctx, sx, sy, s, peep, walkPhase) {
    // ── LOD: dot only at very small zoom ─────────────────────────────────────
    if (s < 0.4) {
      const r = Math.max(2, 3 * s);
      ctx.fillStyle = peep.color;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(sx - r * 0.28, sy - r * 0.28, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // ── LOD: head + body blob at medium zoom ──────────────────────────────────
    if (s < 0.8) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 4 * s, 2 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = peep.color;
      ctx.fillRect(sx - 2.5 * s, sy - 9 * s, 5 * s, 5 * s);
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.arc(sx, sy - 12 * s, 3.5 * s, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // ── Full detailed figure ──────────────────────────────────────────────────
    // In iso, screen-x movement = (facingDx - facingDy) * TILE_W/2
    // positive → moving right on screen → mirror right
    const facingSign = (peep.facingDx - peep.facingDy) >= 0 ? 1 : -1;
    const swing      = Math.sin(walkPhase) * 2.5 * s * facingSign;
    const armSwing   = -swing * 0.6;
    const pantsColor = this.#darken(peep.color);

    ctx.lineCap = 'round';

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 4 * s, 2 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (drawn first, behind body)
    ctx.strokeStyle = pantsColor;
    ctx.lineWidth   = Math.max(1, 1.5 * s);
    ctx.beginPath();
    ctx.moveTo(sx - 1.5 * s, sy - 5 * s);
    ctx.lineTo(sx - 1.5 * s + swing, sy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 1.5 * s, sy - 5 * s);
    ctx.lineTo(sx + 1.5 * s - swing, sy);
    ctx.stroke();

    // Pants
    ctx.fillStyle = pantsColor;
    ctx.fillRect(sx - 2.5 * s, sy - 8 * s, 5 * s, 3 * s);

    // Shirt / body
    ctx.fillStyle = peep.color;
    ctx.fillRect(sx - 2.5 * s, sy - 13 * s, 5 * s, 5 * s);

    // Arms
    ctx.strokeStyle = peep.color;
    ctx.lineWidth   = Math.max(1, 1.5 * s);
    ctx.beginPath();
    ctx.moveTo(sx - 2.5 * s, sy - 12 * s);
    ctx.lineTo(sx - 5 * s,   sy -  9 * s + armSwing);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 2.5 * s, sy - 12 * s);
    ctx.lineTo(sx + 5 * s,   sy -  9 * s - armSwing);
    ctx.stroke();

    // Head
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.arc(sx, sy - 16.5 * s, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Hat — brim then crown
    ctx.fillStyle = peep.hatColor;
    ctx.fillRect(sx - 3   * s, sy - 20 * s, 6 * s, 1.5 * s);
    ctx.fillRect(sx - 1.5 * s, sy - 23 * s, 3 * s, 3   * s);
  }

  // Darken a hex color by ~45% for pants and limbs
  #darken(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * 0.55)},${Math.round(g * 0.55)},${Math.round(b * 0.55)})`;
  }
}
