import { GRAVITY, BRAKE_DECEL } from '../constants.js';

const LAUNCH_SPEED  = 2.0;   // pieces/sec at dispatch
const MIN_SPEED     = 0.4;
const MAX_SPEED     = 12.0;
const BOARD_SECONDS = 5;
const FLAT_FRICTION = 0.08;  // gentle drag on flat track

export class Train {
  constructor(layout) {
    this.id           = `train_${Date.now()}`;
    this.layoutId     = layout.id;
    this.layout       = layout;
    this.pieceIdx     = 0;
    this.t            = 0;
    this.speed        = 0;
    this.boardingTimer = BOARD_SECONDS;
    this.status       = 'BOARDING'; // BOARDING | RUNNING
  }

  update(dt) {
    if (this.status === 'BOARDING') {
      this.boardingTimer -= dt;
      if (this.boardingTimer <= 0) {
        this.status = 'RUNNING';
        this.speed  = LAUNCH_SPEED;
      }
      return;
    }

    const piece = this.layout.pieces[this.pieceIdx];

    if (piece.isBrake) {
      this.speed = Math.max(MIN_SPEED, this.speed - BRAKE_DECEL * dt);
    } else if (piece.dz < 0) {
      this.speed = Math.min(MAX_SPEED, this.speed + GRAVITY * dt);
    } else if (piece.dz > 0) {
      this.speed = Math.max(MIN_SPEED, this.speed - GRAVITY * dt);
    } else {
      this.speed = Math.max(MIN_SPEED, this.speed - FLAT_FRICTION * dt);
    }

    this.t += this.speed * dt;

    while (this.t >= 1) {
      this.t -= 1;
      this.pieceIdx = (this.pieceIdx + 1) % this.layout.pieces.length;
      const next = this.layout.pieces[this.pieceIdx];
      if (next.isStation) {
        this.speed         = 0;
        this.t             = 0;
        this.status        = 'BOARDING';
        this.boardingTimer = BOARD_SECONDS;
        return;
      }
    }
  }
}
