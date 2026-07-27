import { DIR_VEC } from '../constants.js';
import { getPieceDef } from './PieceCatalog.js';

export class TrackLayout {
  pieces = [];

  constructor(id) {
    this.id     = id ?? `coaster_${Date.now()}`;
    this.status = 'BUILDING'; // BUILDING | OPEN | CLOSED
  }

  // Position + entryDir where the next piece must connect
  get openEnd() {
    if (this.pieces.length === 0) return null;
    const last = this.pieces[this.pieces.length - 1];
    const [ddx, ddy] = DIR_VEC[last.exitDir];
    return {
      tx:       last.tx + ddx,
      ty:       last.ty + ddy,
      elev:     last.elev + last.dz,
      entryDir: (last.exitDir + 2) % 4,
    };
  }

  addPiece(piece) { this.pieces.push(piece); }
  removeLast()    { return this.pieces.pop(); }

  // Set<"tx,ty"> of all occupied tiles
  footprintSet() {
    const s = new Set();
    for (const p of this.pieces) s.add(`${p.tx},${p.ty}`);
    return s;
  }

  canClose() {
    if (this.pieces.length < 4) return false;
    const end   = this.openEnd;
    const first = this.pieces[0];
    if (!end) return false;
    // Position and elevation must match; direction is handled by the train physics layer
    return (
      end.tx   === first.tx  &&
      end.ty   === first.ty  &&
      end.elev === first.elev
    );
  }

  get totalCost() {
    return this.pieces.reduce((sum, p) => sum + (getPieceDef(p.type)?.cost ?? 0), 0);
  }
}
