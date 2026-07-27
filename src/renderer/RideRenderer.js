import { RIDE_TYPE } from '../rides/RideRegistry.js';
import { TILE_W, TILE_H, ELEV_HEIGHT } from '../constants.js';
import { drawIsoBox } from './DrawPrimitives.js';

const GONDOLA_COLORS = ['#e03030','#30a030','#3060e0','#e0a030','#c030c0','#30c0c0'];
// Shared concrete platform palette
const PLAT = { top: '#9a9a8a', left: '#606058', right: '#7c7c6e' };

export class RideRenderer {
  render(ctx, world, cam) {
    if (world.rides.size === 0) return;

    const sorted = [...world.rides.values()].sort((a, b) => {
      const key = r => Math.max(...r.footprint.map(f => (r.tx+f.dx)+(r.ty+f.dy)));
      return key(a) - key(b);
    });

    for (const ride of sorted) {
      switch (ride.type) {
        case RIDE_TYPE.FERRIS_WHEEL:   this.#ferrisWheel(ctx, ride, cam);           break;
        case RIDE_TYPE.CAROUSEL:       this.#carousel(ctx, ride, cam);              break;
        case RIDE_TYPE.BUMPER_CARS:    this.#bumperCars(ctx, ride, cam);            break;
        case RIDE_TYPE.STALL_FOOD:     this.#stall(ctx, ride, cam, FOOD_C);         break;
        case RIDE_TYPE.STALL_DRINK:    this.#stall(ctx, ride, cam, DRINK_C);        break;
        case RIDE_TYPE.STALL_SOUVENIR: this.#stall(ctx, ride, cam, SOUVENIR_C);     break;
      }
      if (ride.status === 'CLOSED') this.#closedOverlay(ctx, ride, cam);
    }
  }

  // ── shared helpers ─────────────────────────────────────────────────────────

  #closedOverlay(ctx, ride, cam) {
    const fpLen = ride.footprint.length;
    const avgDx = ride.footprint.reduce((s, f) => s + f.dx, 0) / fpLen;
    const avgDy = ride.footprint.reduce((s, f) => s + f.dy, 0) / fpLen;
    const { sx: cx, sy: cy } = cam.worldToScreen(ride.tx + avgDx, ride.ty + avgDy, 0);
    const hw = TILE_W / 2 * cam.zoom * (fpLen > 1 ? 1.4 : 0.9);
    const hh = TILE_H / 2 * cam.zoom * (fpLen > 1 ? 1.4 : 0.9);

    ctx.fillStyle = 'rgba(180,20,20,0.22)';
    ctx.beginPath();
    ctx.moveTo(cx, cy-hh*1.4); ctx.lineTo(cx+hw, cy); ctx.lineTo(cx, cy+hh*0.6); ctx.lineTo(cx-hw, cy);
    ctx.closePath(); ctx.fill();

    if (cam.zoom > 0.35) {
      ctx.strokeStyle = 'rgba(220,30,30,0.85)';
      ctx.lineWidth   = 2.5 * cam.zoom;
      ctx.beginPath(); ctx.moveTo(cx-hw*0.42, cy-hh*0.55); ctx.lineTo(cx+hw*0.42, cy+hh*0.35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+hw*0.42, cy-hh*0.55); ctx.lineTo(cx-hw*0.42, cy+hh*0.35); ctx.stroke();
    }
  }

  // Striped canopy over a stall. Quad A→D (back edge), B→C (front edge), split into N strips.
  #stripedCanopy(ctx, sx, ay, hw, hh, primary, secondary, N = 5) {
    const A = [sx - hw*0.15, ay - hh*0.1];
    const D = [sx + hw*0.1,  ay - hh*0.2];
    const B = [sx - hw*0.9,  ay + hh*0.45];
    const C = [sx + hw*0.6,  ay + hh*0.25];

    for (let i = 0; i < N; i++) {
      const t0 = i/N, t1 = (i+1)/N;
      const lerp = (P, Q, t) => [P[0]+(Q[0]-P[0])*t, P[1]+(Q[1]-P[1])*t];
      const [p0, p1, p2, p3] = [lerp(A,D,t0), lerp(A,D,t1), lerp(B,C,t1), lerp(B,C,t0)];
      ctx.fillStyle = i % 2 === 0 ? primary : secondary;
      ctx.beginPath();
      ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]);
      ctx.lineTo(p2[0],p2[1]); ctx.lineTo(p3[0],p3[1]);
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth   = 0.6;
    ctx.beginPath();
    ctx.moveTo(A[0],A[1]); ctx.lineTo(D[0],D[1]);
    ctx.lineTo(C[0],C[1]); ctx.lineTo(B[0],B[1]);
    ctx.closePath(); ctx.stroke();
  }

  // ── ferris wheel ───────────────────────────────────────────────────────────

  #ferrisWheel(ctx, ride, cam) {
    const { tx, ty } = ride;
    const hw = TILE_W/2 * cam.zoom;
    const hh = TILE_H/2 * cam.zoom;

    // Concrete platform
    for (const { dx, dy } of ride.footprint) {
      const { sx, sy } = cam.worldToScreen(tx+dx, ty+dy, 0);
      drawIsoBox(ctx, sx, sy, cam.zoom, ELEV_HEIGHT/2, PLAT.top, PLAT.left, PLAT.right);
    }

    const { sx: cx, sy: cy } = cam.worldToScreen(tx+0.5, ty+0.5, 0);
    const platTop = cy - (ELEV_HEIGHT/2) * cam.zoom;
    const postH   = 4 * hh;
    const wheelCy = platTop - postH;
    const postX   = hw * 0.55;

    // A-frame legs + cross brace (arch)
    ctx.lineWidth   = 3 * cam.zoom;
    ctx.strokeStyle = '#505050';
    ctx.beginPath(); ctx.moveTo(cx-postX, platTop); ctx.lineTo(cx, wheelCy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+postX, platTop); ctx.lineTo(cx, wheelCy); ctx.stroke();
    const braceY = platTop - postH * 0.32;
    ctx.lineWidth   = 1.8 * cam.zoom;
    ctx.strokeStyle = '#686868';
    ctx.beginPath();
    ctx.moveTo(cx - postX*0.6, braceY - hh*0.08);
    ctx.lineTo(cx + postX*0.6, braceY + hh*0.08);
    ctx.stroke();
    // Second brace lower
    const braceY2 = platTop - postH * 0.65;
    ctx.beginPath();
    ctx.moveTo(cx - postX*0.35, braceY2 - hh*0.05);
    ctx.lineTo(cx + postX*0.35, braceY2 + hh*0.05);
    ctx.stroke();

    // Outer + inner rim
    const WR  = hw * 1.25;
    const WRy = WR * 0.5;
    ctx.lineWidth = 3.5 * cam.zoom; ctx.strokeStyle = '#cccccc';
    ctx.beginPath(); ctx.ellipse(cx, wheelCy, WR, WRy, 0, 0, Math.PI*2); ctx.stroke();
    ctx.lineWidth = 1.5 * cam.zoom; ctx.strokeStyle = '#aaaaaa';
    ctx.beginPath(); ctx.ellipse(cx, wheelCy, WR*0.55, WRy*0.55, 0, 0, Math.PI*2); ctx.stroke();

    // Spokes + hanging gondola carts
    for (let i = 0; i < 6; i++) {
      const a  = ride.animAngle + (i/6) * Math.PI * 2;
      const gx = cx + WR  * Math.cos(a);
      const gy = wheelCy + WRy * Math.sin(a);

      ctx.strokeStyle = '#888'; ctx.lineWidth = 1 * cam.zoom;
      ctx.beginPath(); ctx.moveTo(cx, wheelCy); ctx.lineTo(gx, gy); ctx.stroke();

      // Hanging cable
      const cableLen = 7 * cam.zoom;
      ctx.strokeStyle = '#777'; ctx.lineWidth = 0.8 * cam.zoom;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy+cableLen); ctx.stroke();

      // Cart rectangle
      const cw = 7*cam.zoom, ch = 5.5*cam.zoom;
      ctx.fillStyle   = GONDOLA_COLORS[i];
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth   = 0.7 * cam.zoom;
      ctx.beginPath();
      ctx.rect(gx-cw/2, gy+cableLen, cw, ch);
      ctx.fill(); ctx.stroke();
      // Cart window dot
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.arc(gx, gy+cableLen+ch*0.4, 1.5*cam.zoom, 0, Math.PI*2); ctx.fill();
    }

    // Hub
    ctx.fillStyle='#ddd'; ctx.strokeStyle='#888'; ctx.lineWidth=1.5*cam.zoom;
    ctx.beginPath(); ctx.arc(cx, wheelCy, 5*cam.zoom, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  }

  // ── carousel ───────────────────────────────────────────────────────────────

  #carousel(ctx, ride, cam) {
    const { tx, ty } = ride;
    const { sx, sy } = cam.worldToScreen(tx, ty, 0);
    const hw = TILE_W/2 * cam.zoom;
    const hh = TILE_H/2 * cam.zoom;

    // Concrete platform
    drawIsoBox(ctx, sx, sy, cam.zoom, ELEV_HEIGHT, PLAT.top, PLAT.left, PLAT.right);

    const baseY  = sy - ELEV_HEIGHT * cam.zoom;
    const drumRx = hw * 0.65;
    const drumRy = hh * 0.32;
    const drumH  = 1.8 * hh;
    const roofY  = baseY - drumH;
    const peakH  = 2.2 * hh;
    const peakY  = roofY - peakH;

    // 4 vertical poles (before drum so drum overlaps base of poles)
    ctx.strokeStyle = '#d0d0f8'; ctx.lineWidth = 1.5 * cam.zoom;
    const poleAngles = [0, Math.PI/2, Math.PI, Math.PI*3/2];
    for (const pa of poleAngles) {
      const ppx = sx + drumRx * 0.88 * Math.cos(pa);
      const ppy = baseY + drumRy * 0.88 * Math.sin(pa);
      ctx.beginPath();
      ctx.moveTo(ppx, ppy);
      ctx.lineTo(ppx, peakY + 2*cam.zoom);
      ctx.stroke();
    }

    // Drum body (sides)
    ctx.fillStyle = '#d07898';
    ctx.beginPath();
    ctx.moveTo(sx-drumRx, baseY); ctx.lineTo(sx-drumRx, roofY);
    ctx.ellipse(sx, roofY, drumRx, drumRy, 0, Math.PI, 0);
    ctx.lineTo(sx+drumRx, baseY);
    ctx.ellipse(sx, baseY, drumRx, drumRy, 0, 0, Math.PI);
    ctx.closePath(); ctx.fill();

    // Drum top ellipse
    ctx.beginPath(); ctx.ellipse(sx, roofY, drumRx, drumRy, 0, 0, Math.PI*2);
    ctx.fillStyle = '#e090a8'; ctx.fill();

    // Scalloped peaked roof — 8 alternating segments
    const SEGS = 8;
    for (let i = 0; i < SEGS; i++) {
      const a0 = (i/SEGS)*Math.PI*2;
      const a1 = ((i+1)/SEGS)*Math.PI*2;
      ctx.fillStyle = i%2===0 ? '#e02050' : '#fff0f0';
      ctx.beginPath();
      ctx.moveTo(sx, peakY);
      ctx.lineTo(sx + drumRx*Math.cos(a0), roofY + drumRy*Math.sin(a0));
      ctx.lineTo(sx + drumRx*Math.cos(a1), roofY + drumRy*Math.sin(a1));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5*cam.zoom; ctx.stroke();
    }

    // Rotating horses — body ellipse + head circle
    const horseColors = ['#ffe000','#ff6060','#60ff60','#60a0ff'];
    for (let i = 0; i < 4; i++) {
      const a  = ride.animAngle + (i/4)*Math.PI*2;
      const hx = sx + drumRx * 0.62 * Math.cos(a);
      const hy = baseY - hh*0.52 + drumRy * 0.55 * Math.sin(a);
      ctx.fillStyle = horseColors[i];
      // Body
      ctx.beginPath(); ctx.ellipse(hx, hy, 5*cam.zoom, 3.5*cam.zoom, -0.28, 0, Math.PI*2); ctx.fill();
      // Head
      ctx.beginPath(); ctx.arc(hx + 4.5*cam.zoom, hy - 3.2*cam.zoom, 2.8*cam.zoom, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.6*cam.zoom; ctx.stroke();
    }
  }

  // ── bumper cars ────────────────────────────────────────────────────────────

  #bumperCars(ctx, ride, cam) {
    const { tx, ty } = ride;
    const hw = TILE_W/2 * cam.zoom;
    const hh = TILE_H/2 * cam.zoom;
    const platH = ELEV_HEIGHT / 3;

    // Dark platform + floor grid lines
    for (const { dx, dy } of ride.footprint) {
      const { sx, sy } = cam.worldToScreen(tx+dx, ty+dy, 0);
      drawIsoBox(ctx, sx, sy, cam.zoom, platH, '#1e2a4a', '#0a1830', '#12203e');
      const fy = sy - platH * cam.zoom;
      ctx.strokeStyle = 'rgba(60,90,180,0.35)'; ctx.lineWidth = 0.6*cam.zoom;
      ctx.beginPath(); ctx.moveTo(sx-hw*0.5, fy-hh*0.25); ctx.lineTo(sx+hw*0.5, fy+hh*0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx-hw*0.5, fy+hh*0.25); ctx.lineTo(sx+hw*0.5, fy-hh*0.25); ctx.stroke();
    }

    const { sx: cx, sy: cy } = cam.worldToScreen(tx+0.5, ty+0.5, 0);
    const arenaY = cy - platH * cam.zoom;

    // Bumper rail around perimeter
    ctx.strokeStyle='#c8c000'; ctx.lineWidth=4*cam.zoom;
    ctx.beginPath();
    ctx.moveTo(cx,       arenaY - hh*1.08);
    ctx.lineTo(cx+hw*1.06, arenaY);
    ctx.lineTo(cx,       arenaY + hh*1.08);
    ctx.lineTo(cx-hw*1.06, arenaY);
    ctx.closePath(); ctx.stroke();

    // Ceiling grid (dashed ellipse)
    const ceilH = (platH + ELEV_HEIGHT*1.4) * cam.zoom;
    ctx.strokeStyle='#4060c0'; ctx.lineWidth=1.5*cam.zoom;
    ctx.setLineDash([3*cam.zoom, 3*cam.zoom]);
    ctx.beginPath(); ctx.ellipse(cx, cy-ceilH, hw*0.88, hh*0.88, 0, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);

    // Mini bumper cars — iso parallelogram body + wheel dots
    const carColors = ['#e03030','#30c030','#e0c000'];
    const offsets   = [[0.28, 0.04], [-0.26, -0.2], [0.02, 0.28]];
    for (let i = 0; i < 3; i++) {
      const [ox, oy] = offsets[i];
      const carX = cx + ox * hw;
      const carY = arenaY + oy * hh;
      const cw = 9*cam.zoom, ch = 5*cam.zoom;

      ctx.fillStyle   = carColors[i];
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth   = 0.7 * cam.zoom;
      ctx.beginPath();
      ctx.moveTo(carX-cw,   carY-ch*0.2);
      ctx.lineTo(carX,      carY-ch*0.7);
      ctx.lineTo(carX+cw,   carY-ch*0.2);
      ctx.lineTo(carX,      carY+ch*0.3);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Windshield
      ctx.fillStyle='rgba(180,220,255,0.6)';
      ctx.beginPath();
      ctx.moveTo(carX-cw*0.3, carY-ch*0.35);
      ctx.lineTo(carX,        carY-ch*0.65);
      ctx.lineTo(carX+cw*0.3, carY-ch*0.35);
      ctx.closePath(); ctx.fill();

      // Wheels
      ctx.fillStyle='#111';
      for (const [wx, wy] of [[-cw*0.55, 0],[cw*0.55, 0]]) {
        ctx.beginPath(); ctx.arc(carX+wx, carY+wy, 2.2*cam.zoom, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  // ── stalls ─────────────────────────────────────────────────────────────────

  #stall(ctx, ride, cam, C) {
    const { tx, ty } = ride;
    const { sx, sy } = cam.worldToScreen(tx, ty, 0);
    const hw = TILE_W/2 * cam.zoom;
    const hh = TILE_H/2 * cam.zoom;

    // Concrete base
    drawIsoBox(ctx, sx, sy, cam.zoom, ELEV_HEIGHT, PLAT.top, PLAT.left, PLAT.right);

    // Colored counter top
    const topY = sy - ELEV_HEIGHT * cam.zoom;
    ctx.fillStyle = C.top; ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.6*cam.zoom;
    ctx.beginPath();
    ctx.moveTo(sx, topY-hh); ctx.lineTo(sx+hw, topY); ctx.lineTo(sx, topY+hh); ctx.lineTo(sx-hw, topY);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Front-facing counter strip (left/right lower face band)
    ctx.fillStyle = C.counter;
    ctx.beginPath();
    ctx.moveTo(sx-hw, topY + hh*0.2);
    ctx.lineTo(sx,    topY + hh*1.3);
    ctx.lineTo(sx,    sy);
    ctx.lineTo(sx-hw, sy - hh*0.85);
    ctx.closePath(); ctx.fill();

    // Striped canopy
    this.#stripedCanopy(ctx, sx, topY, hw, hh, C.stripe1, C.stripe2);

    // Floating sign label
    if (cam.zoom > 0.45) {
      const signY = topY - hh * 0.48;
      const sw = hw * 1.1, sh = hh * 0.58;
      ctx.fillStyle   = 'rgba(12,12,22,0.85)';
      ctx.strokeStyle = C.stripe1;
      ctx.lineWidth   = 1.2 * cam.zoom;
      ctx.beginPath(); ctx.rect(sx-sw/2, signY-sh, sw, sh); ctx.fill(); ctx.stroke();
      ctx.fillStyle    = '#ffffff';
      ctx.font         = `bold ${Math.max(7, Math.round(6.5*cam.zoom))}px system-ui`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(C.label, sx, signY - sh*0.5);
    }

    // Distinctive detail per stall type
    if (C.detail) C.detail(ctx, sx, topY, hw, hh, cam.zoom);
  }
}

// ── stall palettes ──────────────────────────────────────────────────────────

const FOOD_C = {
  top:     '#c88800',
  counter: '#a06800',
  stripe1: '#dd2020',
  stripe2: '#fff4e0',
  label:   '🌭 HOT DOGS',
  detail(ctx, sx, topY, hw, hh, zoom) {
    if (zoom < 0.45) return;
    // Chimney
    ctx.fillStyle = '#444';
    ctx.fillRect(sx + hw*0.25 - 3.5*zoom, topY - hh*1.35 - 9*zoom, 7*zoom, 10*zoom);
    // Smoke puff
    ctx.fillStyle = 'rgba(190,190,190,0.5)';
    ctx.beginPath(); ctx.arc(sx+hw*0.25, topY-hh*1.35-10*zoom, 4.5*zoom, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx+hw*0.2,  topY-hh*1.35-16*zoom, 3*zoom, 0, Math.PI*2);   ctx.fill();
  },
};

const DRINK_C = {
  top:     '#0058b8',
  counter: '#003878',
  stripe1: '#0088dd',
  stripe2: '#e8f4ff',
  label:   '🥤 DRINKS',
  detail(ctx, sx, topY, hw, hh, zoom) {
    if (zoom < 0.45) return;
    // Cup on counter
    const cx = sx + hw*0.22, cy = topY + hh*0.42;
    const cw = 6*zoom, ch = 10*zoom;
    ctx.fillStyle = 'rgba(60,150,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(cx-cw, cy-ch); ctx.lineTo(cx-cw*0.65, cy); ctx.lineTo(cx+cw*0.65, cy); ctx.lineTo(cx+cw, cy-ch);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=0.8*zoom; ctx.stroke();
    // Straw
    ctx.strokeStyle='#ff4488'; ctx.lineWidth=1.5*zoom;
    ctx.beginPath(); ctx.moveTo(cx+cw*0.3, cy-ch); ctx.lineTo(cx+cw*0.55, cy-ch-8*zoom); ctx.stroke();
  },
};

const SOUVENIR_C = {
  top:     '#7828b8',
  counter: '#4e1878',
  stripe1: '#b848e8',
  stripe2: '#f8e8ff',
  label:   '🎈 GIFTS',
  detail(ctx, sx, topY, hw, hh, zoom) {
    if (zoom < 0.45) return;
    // Balloon on a string
    const bx = sx + hw*0.18, bstringY = topY - hh*0.55;
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 0.8*zoom;
    ctx.beginPath(); ctx.moveTo(sx, topY-hh*0.2); ctx.lineTo(bx, bstringY+9*zoom); ctx.stroke();
    // Balloon body
    ctx.fillStyle = '#ff40a0';
    ctx.beginPath(); ctx.ellipse(bx, bstringY-2*zoom, 6*zoom, 8*zoom, 0, 0, Math.PI*2); ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.beginPath(); ctx.ellipse(bx-2*zoom, bstringY-4*zoom, 2.5*zoom, 3.5*zoom, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(200,0,80,0.35)'; ctx.lineWidth=0.8*zoom;
    ctx.beginPath(); ctx.ellipse(bx, bstringY-2*zoom, 6*zoom, 8*zoom, 0, 0, Math.PI*2); ctx.stroke();
  },
};
