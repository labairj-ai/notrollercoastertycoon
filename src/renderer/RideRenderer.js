import { RIDE_TYPE } from '../rides/RideRegistry.js';
import { TILE_W, TILE_H, ELEV_HEIGHT } from '../constants.js';
import { drawIsoBox, drawIsoDiamond } from './DrawPrimitives.js';

const GONDOLA_COLORS = ['#e03030', '#30a030', '#3060e0', '#e0a030', '#c030c0', '#30c0c0'];

export class RideRenderer {
  render(ctx, world, cam) {
    if (world.rides.size === 0) return;

    // Sort rides back-to-front by the furthest-forward tile in their footprint
    const sorted = [...world.rides.values()].sort((a, b) => {
      const keyA = Math.max(...a.footprint.map(f => (a.tx + f.dx) + (a.ty + f.dy)));
      const keyB = Math.max(...b.footprint.map(f => (b.tx + f.dx) + (b.ty + f.dy)));
      return keyA - keyB;
    });

    for (const ride of sorted) {
      switch (ride.type) {
        case RIDE_TYPE.FERRIS_WHEEL:   this.#ferrisWheel(ctx, ride, cam); break;
        case RIDE_TYPE.CAROUSEL:       this.#carousel(ctx, ride, cam);    break;
        case RIDE_TYPE.BUMPER_CARS:    this.#bumperCars(ctx, ride, cam);  break;
        case RIDE_TYPE.STALL_FOOD:     this.#stall(ctx, ride, cam, STALL_FOOD_C);     break;
        case RIDE_TYPE.STALL_DRINK:    this.#stall(ctx, ride, cam, STALL_DRINK_C);    break;
        case RIDE_TYPE.STALL_SOUVENIR: this.#stall(ctx, ride, cam, STALL_SOUVENIR_C); break;
      }
    }
  }

  #ferrisWheel(ctx, ride, cam) {
    const { tx, ty } = ride;
    const hw = (TILE_W / 2) * cam.zoom;
    const hh = (TILE_H / 2) * cam.zoom;

    // Gray platform tiles
    for (const { dx, dy } of ride.footprint) {
      const { sx, sy } = cam.worldToScreen(tx + dx, ty + dy, 0);
      drawIsoBox(ctx, sx, sy, cam.zoom, ELEV_HEIGHT / 2, '#888', '#555', '#666');
    }

    // Center of 2×2 footprint at ground level
    const { sx: cx, sy: cy } = cam.worldToScreen(tx + 0.5, ty + 0.5, 0);
    const platTop = cy - (ELEV_HEIGHT / 2) * cam.zoom;

    // Wheel geometry
    const WR  = hw * 1.25;           // screen semi-major (x)
    const WRy = WR * 0.5;            // screen semi-minor (y, iso foreshortening)
    const postH  = 4 * hh;           // screen height of support post
    const wheelCy = platTop - postH;
    const wheelCx = cx;

    // A-frame support posts
    const postX = hw * 0.55;
    ctx.strokeStyle = '#666';
    ctx.lineWidth   = 2.5 * cam.zoom;
    ctx.beginPath(); ctx.moveTo(cx - postX, platTop); ctx.lineTo(wheelCx, wheelCy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + postX, platTop); ctx.lineTo(wheelCx, wheelCy); ctx.stroke();
    // Axle
    ctx.beginPath(); ctx.moveTo(wheelCx - 6 * cam.zoom, wheelCy); ctx.lineTo(wheelCx + 6 * cam.zoom, wheelCy); ctx.stroke();

    // Wheel rim
    ctx.beginPath();
    ctx.ellipse(wheelCx, wheelCy, WR, WRy, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth   = 3 * cam.zoom;
    ctx.stroke();

    // Spokes + gondolas
    const N = 6;
    for (let i = 0; i < N; i++) {
      const a  = ride.animAngle + (i / N) * Math.PI * 2;
      const gx = wheelCx + WR  * Math.cos(a);
      const gy = wheelCy + WRy * Math.sin(a);

      ctx.strokeStyle = '#888';
      ctx.lineWidth   = 1 * cam.zoom;
      ctx.beginPath(); ctx.moveTo(wheelCx, wheelCy); ctx.lineTo(gx, gy); ctx.stroke();

      ctx.fillStyle = GONDOLA_COLORS[i];
      ctx.beginPath(); ctx.arc(gx, gy, 5 * cam.zoom, 0, Math.PI * 2); ctx.fill();
    }

    // Hub
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.arc(wheelCx, wheelCy, 4 * cam.zoom, 0, Math.PI * 2); ctx.fill();
  }

  #carousel(ctx, ride, cam) {
    const { tx, ty } = ride;
    const { sx, sy } = cam.worldToScreen(tx, ty, 0);
    const hw = (TILE_W / 2) * cam.zoom;
    const hh = (TILE_H / 2) * cam.zoom;

    // Platform
    drawIsoBox(ctx, sx, sy, cam.zoom, ELEV_HEIGHT, '#c06090', '#802060', '#a04070');

    const baseY = sy - ELEV_HEIGHT * cam.zoom;
    const drumRx = hw * 0.65;
    const drumRy = hh * 0.32;
    const drumH  = 1.8 * hh;
    const roofY  = baseY - drumH;

    // Drum body (sides)
    ctx.fillStyle = '#d07898';
    ctx.beginPath();
    ctx.moveTo(sx - drumRx, baseY);
    ctx.lineTo(sx - drumRx, roofY);
    ctx.ellipse(sx, roofY, drumRx, drumRy, 0, Math.PI, 0);
    ctx.lineTo(sx + drumRx, baseY);
    ctx.ellipse(sx, baseY, drumRx, drumRy, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fill();

    // Roof top ellipse
    ctx.beginPath();
    ctx.ellipse(sx, roofY, drumRx, drumRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e090a8';
    ctx.fill();

    // Peaked tent roof
    const peakH = 2 * hh;
    ctx.fillStyle = '#f04060';
    ctx.beginPath();
    ctx.moveTo(sx, roofY - peakH);
    ctx.lineTo(sx - drumRx, roofY);
    ctx.lineTo(sx + drumRx, roofY);
    ctx.closePath();
    ctx.fill();

    // Rotating horses (4 dots)
    const horseColors = ['#ffe000', '#ff6060', '#60ff60', '#60a0ff'];
    for (let i = 0; i < 4; i++) {
      const a  = ride.animAngle + (i / 4) * Math.PI * 2;
      const hx = sx + drumRx * 0.65 * Math.cos(a);
      const hy = baseY - hh * 0.6 + drumRy * 0.55 * Math.sin(a);
      ctx.fillStyle = horseColors[i];
      ctx.beginPath(); ctx.arc(hx, hy, 4 * cam.zoom, 0, Math.PI * 2); ctx.fill();
    }
  }

  #bumperCars(ctx, ride, cam) {
    const { tx, ty } = ride;
    const hw = (TILE_W / 2) * cam.zoom;
    const hh = (TILE_H / 2) * cam.zoom;

    for (const { dx, dy } of ride.footprint) {
      const { sx, sy } = cam.worldToScreen(tx + dx, ty + dy, 0);
      drawIsoBox(ctx, sx, sy, cam.zoom, ELEV_HEIGHT / 3, '#1a2a4a', '#0a1a3a', '#101f40');
    }

    // Electrified ceiling grid (just a stroke ellipse above center)
    const { sx: cx, sy: cy } = cam.worldToScreen(tx + 0.5, ty + 0.5, 0);
    const h = (ELEV_HEIGHT / 3 + ELEV_HEIGHT * 1.5) * cam.zoom;
    ctx.strokeStyle = '#4060c0';
    ctx.lineWidth = 1.5 * cam.zoom;
    ctx.beginPath();
    ctx.ellipse(cx, cy - h, hw * 0.9, hh * 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bumper cars (3 colored blobs)
    const carColors = ['#e03030', '#30c030', '#e0c000'];
    const offsets   = [[0.3, 0.1], [-0.3, -0.15], [0, 0.3]];
    for (let i = 0; i < 3; i++) {
      const [ox, oy] = offsets[i];
      const carX = cx + ox * hw;
      const carY = cy - (ELEV_HEIGHT / 3) * cam.zoom + oy * hh;
      ctx.fillStyle = carColors[i];
      ctx.beginPath();
      ctx.ellipse(carX, carY, 7 * cam.zoom, 4 * cam.zoom, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  #stall(ctx, ride, cam, colors) {
    const { tx, ty } = ride;
    const { sx, sy } = cam.worldToScreen(tx, ty, 0);
    const hw = (TILE_W / 2) * cam.zoom;
    const hh = (TILE_H / 2) * cam.zoom;

    drawIsoBox(ctx, sx, sy, cam.zoom, ELEV_HEIGHT, colors.top, colors.left, colors.right);

    // Awning extending forward (toward viewer = toward bottom-left in iso)
    const awningY = sy - ELEV_HEIGHT * cam.zoom;
    ctx.fillStyle = colors.awning;
    ctx.beginPath();
    ctx.moveTo(sx - hw * 0.15, awningY - hh * 0.1);
    ctx.lineTo(sx - hw * 0.9,  awningY + hh * 0.45);
    ctx.lineTo(sx + hw * 0.6,  awningY + hh * 0.25);
    ctx.lineTo(sx + hw * 0.1,  awningY - hh * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.5 * cam.zoom;
    ctx.stroke();
  }
}

const STALL_FOOD_C     = { top: '#d09000', left: '#906000', right: '#b07800', awning: '#f0c000' };
const STALL_DRINK_C    = { top: '#0060c0', left: '#003a80', right: '#0050a0', awning: '#0090e0' };
const STALL_SOUVENIR_C = { top: '#8030c0', left: '#501880', right: '#6820a0', awning: '#b050e0' };
