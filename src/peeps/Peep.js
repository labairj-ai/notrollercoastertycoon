export const PEEP_STATE = {
  WALKING:  'WALKING',   // following path steps toward a target
  AT_RIDE:  'AT_RIDE',   // spending time at a ride/stall
  LEAVING:  'LEAVING',   // returning to park entrance
  GONE:     'GONE',      // off-map; safe to prune
};

const WALK_SPEED = 2.0; // tiles/second

const COLORS     = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#f06595','#74c0fc'];
const HAT_COLORS = ['#5a3010','#1a2a3a','#4a1818','#1a3a1a','#3a1a4a'];

export class Peep {
  constructor(tx, ty) {
    this.id           = `p_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    this.tx           = tx;        // grid-aligned current tile
    this.ty           = ty;
    this.visualTx     = tx;        // smooth rendered position
    this.visualTy     = ty;
    this.pathSteps    = [];        // [[tx,ty], ...]
    this.pathIdx      = 0;
    this.stepT        = 0;         // 0→1 progress within current step
    this.state        = PEEP_STATE.WALKING;
    this.happiness    = 75 + Math.random() * 20;
    this.cash         = 15 + Math.random() * 35;
    this.ridingTimer  = 0;
    this.targetId     = null;      // ride.id or layout.id
    this.isCoaster    = false;
    this.color        = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.hatColor     = HAT_COLORS[Math.floor(Math.random() * HAT_COLORS.length)];
    this.facingDx     = 0;
    this.facingDy     = 1;
    this.stuckTimer   = 0;
    this.ridesVisited = 0;
  }

  setPath(steps) {
    this.pathSteps = steps;
    this.pathIdx   = 0;
    this.stepT     = 0;
    if (steps.length > 0) {
      this.tx = steps[0][0];
      this.ty = steps[0][1];
    }
  }

  atEndOfPath() {
    return this.pathSteps.length === 0 ||
      (this.pathIdx >= this.pathSteps.length - 1 && this.stepT >= 1);
  }

  update(dt) {
    if (this.state === PEEP_STATE.GONE) return;

    if (this.state === PEEP_STATE.AT_RIDE) {
      this.ridingTimer -= dt;
      return;
    }

    if (this.pathSteps.length === 0) {
      this.stuckTimer += dt;
      return;
    }

    this.stuckTimer = 0;
    this.stepT += WALK_SPEED * dt;

    while (this.stepT >= 1 && this.pathIdx < this.pathSteps.length - 1) {
      this.stepT -= 1;
      const prevTx = this.tx;
      const prevTy = this.ty;
      this.pathIdx++;
      this.tx = this.pathSteps[this.pathIdx][0];
      this.ty = this.pathSteps[this.pathIdx][1];
      this.facingDx = this.tx - prevTx;
      this.facingDy = this.ty - prevTy;
    }

    // Clamp at last step
    if (this.pathIdx >= this.pathSteps.length - 1) {
      this.stepT = Math.min(this.stepT, 1);
    }

    // Visual interpolation
    const cur = this.pathSteps[this.pathIdx];
    const nxt = this.pathSteps[this.pathIdx + 1];
    if (cur && nxt) {
      const t = Math.min(this.stepT, 1);
      this.visualTx = cur[0] + (nxt[0] - cur[0]) * t;
      this.visualTy = cur[1] + (nxt[1] - cur[1]) * t;
    } else if (cur) {
      this.visualTx = cur[0];
      this.visualTy = cur[1];
    }
  }
}
