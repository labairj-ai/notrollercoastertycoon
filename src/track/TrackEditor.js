import { TrackLayout } from './TrackLayout.js';
import { makePiece, PIECE_TYPE, getPieceDef } from './PieceCatalog.js';
import { validateTrack } from './TrackValidator.js';
import { SURFACE, GRID_SIZE } from '../constants.js';

export const EDITOR_STATE = {
  IDLE:             'IDLE',
  AWAITING_STATION: 'AWAITING_STATION',
  PLACING:          'PLACING',
  CLOSED:           'CLOSED',
};

export class TrackEditor {
  state        = EDITOR_STATE.IDLE;
  layout       = null;
  selectedType = PIECE_TYPE.STRAIGHT;
  ghost        = null;   // { tx, ty, elev, piece, canPlace } or null
  hoverTx      = 0;
  hoverTy      = 0;
  validation   = null;

  #world;
  #bus;

  constructor(world, bus) {
    this.#world = world;
    this.#bus   = bus;
  }

  // Called when COASTER tool is activated
  activate() {
    if (this.state === EDITOR_STATE.IDLE) {
      this.layout     = new TrackLayout();
      this.state      = EDITOR_STATE.AWAITING_STATION;
      this.validation = null;
      this.#refreshGhost();
      this.#emit();
    }
  }

  // Called when a different tool is selected — keeps in-progress layout alive
  deactivate() {
    // intentionally keep layout; editor resumes when tool re-selected
  }

  cancel() {
    if (!this.layout) return;
    // Restore tiles
    for (const p of this.layout.pieces) {
      const t = this.#world.grid.get(p.tx, p.ty);
      if (t && t.rideId === this.layout.id) {
        t.surface = SURFACE.NONE;
        t.rideId  = null;
      }
    }
    this.layout     = null;
    this.state      = EDITOR_STATE.IDLE;
    this.ghost      = null;
    this.validation = null;
    this.#emit();
  }

  setHover(tx, ty) {
    if (this.hoverTx === tx && this.hoverTy === ty) return;
    this.hoverTx = tx;
    this.hoverTy = ty;
    if (this.state === EDITOR_STATE.AWAITING_STATION) {
      this.#refreshGhost();
    }
  }

  handleTap(tx, ty) {
    if (this.state === EDITOR_STATE.AWAITING_STATION) {
      this.#placeStation(tx, ty);
    } else if (this.state === EDITOR_STATE.PLACING) {
      this.#placeNext();
    }
  }

  selectType(type) {
    this.selectedType = type;
    this.#refreshGhost();
    this.#emit();
  }

  undo() {
    if (!this.layout || this.layout.pieces.length <= 1) return; // keep station
    const p = this.layout.removeLast();
    const t = this.#world.grid.get(p.tx, p.ty);
    if (t && t.rideId === this.layout.id) { t.surface = SURFACE.NONE; t.rideId = null; }
    this.#refreshGhost();
    this.#emit();
  }

  closeLoop() {
    if (!this.layout?.canClose()) return;
    const result = validateTrack(this.layout);
    this.validation = result;
    if (result.valid) {
      this.layout.status = 'CLOSED';
      this.state         = EDITOR_STATE.CLOSED;
      this.ghost         = null;
      this.#world.coasters.set(this.layout.id, this.layout);
    }
    this.#emit();
  }

  editLayout() {
    if (this.state !== EDITOR_STATE.CLOSED) return;
    this.#world.coasters.delete(this.layout.id);
    this.layout.status = 'BUILDING';
    this.state         = EDITOR_STATE.PLACING;
    this.#refreshGhost();
    this.#emit();
  }

  openRide() {
    if (this.state !== EDITOR_STATE.CLOSED) return;
    this.layout.status = 'OPEN';
    this.state         = EDITOR_STATE.IDLE;
    this.layout        = null;
    this.ghost         = null;
    this.#emit();
  }

  // ── private ─────────────────────────────────────────────

  #placeStation(tx, ty) {
    const tile = this.#world.grid.get(tx, ty);
    if (!tile || tile.surface !== SURFACE.NONE) return;
    // Station starts heading East → entryDir = W = 3
    const piece = makePiece(PIECE_TYPE.STATION, tx, ty, tile.elevation, 3);
    this.layout.addPiece(piece);
    tile.surface = SURFACE.RIDE_BASE;
    tile.rideId  = this.layout.id;
    this.state   = EDITOR_STATE.PLACING;
    this.#refreshGhost();
    this.#emit();
  }

  #placeNext() {
    const g = this.ghost;
    if (!g || !g.canPlace) return;

    // If ghost is on the station tile, close the loop instead of adding a piece
    const isFirst = (g.tx === this.layout.pieces[0].tx && g.ty === this.layout.pieces[0].ty);
    if (isFirst) { this.closeLoop(); return; }

    const def  = getPieceDef(this.selectedType);
    const cost = def?.cost ?? 0;
    if (this.#world.economy.money < cost) return;

    const piece = makePiece(this.selectedType, g.tx, g.ty, g.elev, g.entryDir);
    this.layout.addPiece(piece);

    const tile = this.#world.grid.get(g.tx, g.ty);
    if (tile && tile.surface === SURFACE.NONE) {
      tile.surface = SURFACE.RIDE_BASE;
      tile.rideId  = this.layout.id;
    }
    this.#world.economy.money -= cost;
    this.#bus.emit('economyUpdate', this.#world.economy);

    this.#refreshGhost();
    this.#emit();
  }

  #refreshGhost() {
    if (this.state === EDITOR_STATE.AWAITING_STATION) {
      const tx = this.hoverTx;
      const ty = this.hoverTy;
      const tile = this.#world.grid.get(tx, ty);
      const canPlace = !!tile && tile.surface === SURFACE.NONE;
      const piece = canPlace
        ? makePiece(PIECE_TYPE.STATION, tx, ty, tile?.elevation ?? 0, 3)
        : null;
      this.ghost = { tx, ty, elev: tile?.elevation ?? 0, entryDir: 3, piece, canPlace };
      return;
    }

    if (this.state !== EDITOR_STATE.PLACING || !this.layout) {
      this.ghost = null;
      return;
    }

    const end = this.layout.openEnd;
    if (!end) { this.ghost = null; return; }

    const { tx, ty, elev, entryDir } = end;
    const tile       = this.#world.grid.get(tx, ty);
    const occupied   = this.layout.footprintSet();
    const isFirst    = (tx === this.layout.pieces[0].tx && ty === this.layout.pieces[0].ty);
    const inBounds   = tx >= 0 && ty >= 0 && tx < GRID_SIZE && ty < GRID_SIZE;
    const elevOk     = elev >= 0 && elev <= 8;

    const nextDz     = getPieceDef(this.selectedType)?.dz ?? 0;
    const nextElevOk = (elev + nextDz) >= 0 && (elev + nextDz) <= 8;

    const canPlace = inBounds && elevOk && nextElevOk && (
      isFirst
        ? this.layout.canClose()
        : (!!tile && tile.surface === SURFACE.NONE && !occupied.has(`${tx},${ty}`))
    );

    this.ghost = {
      tx, ty, elev, entryDir,
      piece:    makePiece(this.selectedType, tx, ty, elev, entryDir),
      canPlace,
    };
  }

  #emit() {
    this.#bus.emit('trackEditorUpdate', {
      state:        this.state,
      layout:       this.layout,
      ghost:        this.ghost,
      selectedType: this.selectedType,
      canClose:     this.layout?.canClose() ?? false,
      validation:   this.validation,
    });
  }

  get isActive() { return this.state !== EDITOR_STATE.IDLE; }
}
