export class TrackPiece {
  constructor({ type, tx, ty, elev, entryDir, exitDir, dz, isBrake = false, isStation = false }) {
    this.type      = type;
    this.tx        = tx;
    this.ty        = ty;
    this.elev      = elev;
    this.entryDir  = entryDir;  // 0=N 1=E 2=S 3=W — side the train enters from
    this.exitDir   = exitDir;   // side the train exits toward
    this.dz        = dz;        // elevation delta for this piece
    this.isBrake   = isBrake;
    this.isStation = isStation;
  }
}
