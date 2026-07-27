import { TrackPiece } from './TrackPiece.js';

export const PIECE_TYPE = {
  STATION:  'STATION',
  STRAIGHT: 'STRAIGHT',
  CURVE_L:  'CURVE_L',
  CURVE_R:  'CURVE_R',
  SLOPE_UP: 'SLOPE_UP',
  SLOPE_DN: 'SLOPE_DN',
  BRAKE:    'BRAKE',
};

// turns: +1 = CW, -1 = CCW, 0 = straight
const DEFS = {
  [PIECE_TYPE.STATION]:  { label: 'Station',  turns:  0, dz:  0, isStation: true,  cost: 1500, icon: '🏠' },
  [PIECE_TYPE.STRAIGHT]: { label: 'Straight', turns:  0, dz:  0, cost:  80, icon: '↔' },
  [PIECE_TYPE.CURVE_L]:  { label: 'Left',     turns: -1, dz:  0, cost: 100, icon: '↰' },
  [PIECE_TYPE.CURVE_R]:  { label: 'Right',    turns: +1, dz:  0, cost: 100, icon: '↱' },
  [PIECE_TYPE.SLOPE_UP]: { label: 'Up',       turns:  0, dz: +1, cost: 120, icon: '↑' },
  [PIECE_TYPE.SLOPE_DN]: { label: 'Down',     turns:  0, dz: -1, cost: 120, icon: '↓' },
  [PIECE_TYPE.BRAKE]:    { label: 'Brake',    turns:  0, dz:  0, isBrake: true, cost: 200, icon: '🛑' },
};

export function getCatalog() { return DEFS; }

export function getPieceDef(type) { return DEFS[type]; }

// Instantiate a piece at a specific tile given entryDir (direction train arrives from)
export function makePiece(type, tx, ty, elev, entryDir) {
  const def = DEFS[type];
  if (!def) throw new Error(`Unknown piece type: ${type}`);
  // heading = direction of travel = opposite of entryDir
  const heading = (entryDir + 2) % 4;
  // exitDir = heading rotated by turns
  const exitDir = (heading + def.turns + 4) % 4;
  return new TrackPiece({
    type, tx, ty, elev, entryDir, exitDir,
    dz:        def.dz        ?? 0,
    isBrake:   def.isBrake   ?? false,
    isStation: def.isStation ?? false,
  });
}

// Piece types available in the builder (no station — placed separately)
export const BUILDER_PIECES = [
  PIECE_TYPE.STRAIGHT,
  PIECE_TYPE.CURVE_L,
  PIECE_TYPE.CURVE_R,
  PIECE_TYPE.SLOPE_UP,
  PIECE_TYPE.SLOPE_DN,
  PIECE_TYPE.BRAKE,
];
