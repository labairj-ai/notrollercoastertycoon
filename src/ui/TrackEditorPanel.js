import { PIECE_TYPE, BUILDER_PIECES, getCatalog } from '../track/PieceCatalog.js';
import { EDITOR_STATE } from '../track/TrackEditor.js';

export class TrackEditorPanel {
  #el;
  #titleEl;
  #piecesEl;
  #actionsEl;
  #errorsEl;
  #editor;

  constructor(editor, bus) {
    this.#editor = editor;

    this.#el = document.createElement('div');
    this.#el.className = 'track-panel';
    this.#el.style.display = 'none';

    this.#titleEl   = document.createElement('div');
    this.#titleEl.className = 'track-panel-title';

    this.#piecesEl  = document.createElement('div');
    this.#piecesEl.className = 'track-pieces';

    this.#actionsEl = document.createElement('div');
    this.#actionsEl.className = 'track-actions';

    this.#errorsEl  = document.createElement('div');
    this.#errorsEl.className = 'track-errors';

    this.#el.appendChild(this.#titleEl);
    this.#el.appendChild(this.#piecesEl);
    this.#el.appendChild(this.#actionsEl);
    this.#el.appendChild(this.#errorsEl);

    document.getElementById('app').appendChild(this.#el);

    bus.on('trackEditorUpdate', data => this.#update(data));
  }

  #update({ state, layout, selectedType, canClose, validation }) {
    const catalog = getCatalog();

    // Hide entirely when idle
    if (state === EDITOR_STATE.IDLE) {
      this.#el.style.display = 'none';
      return;
    }
    this.#el.style.display = 'flex';

    // ── title ─────────────────────────────────────────────────────────────
    // Show current track-end elevation while building so player can balance slopes
    let titleText = '';
    if (state === EDITOR_STATE.AWAITING_STATION) {
      titleText = '🎢  Tap to place station';
    } else if (state === EDITOR_STATE.PLACING) {
      const last = layout?.pieces[layout.pieces.length - 1];
      const elev = last ? last.elev + last.dz : 0;
      const elevStr = elev === 0 ? '' : elev > 0 ? ` ↑${elev}` : ` ↓${Math.abs(elev)}`;
      titleText = `🎢  Build Track${elevStr}`;
      if (!canClose && layout?.pieces.length >= 4 && elev !== 0) {
        titleText += '  — balance slopes to close';
      }
    } else if (state === EDITOR_STATE.CLOSED) {
      titleText = '🎢  Track Complete';
    }
    this.#titleEl.textContent = titleText;

    // ── piece picker (PLACING only) ────────────────────────────────────────
    this.#piecesEl.innerHTML = '';
    if (state === EDITOR_STATE.PLACING) {
      for (const type of BUILDER_PIECES) {
        const def = catalog[type];
        const btn = document.createElement('button');
        btn.className = 'piece-btn' + (type === selectedType ? ' active' : '');
        btn.innerHTML = `<span style="font-size:16px">${def.icon}</span><span style="font-size:9px">${def.label}</span>`;
        btn.addEventListener('pointerdown', e => e.stopPropagation());
        btn.addEventListener('click', () => this.#editor.selectType(type));
        this.#piecesEl.appendChild(btn);
      }
    }

    // ── action buttons ─────────────────────────────────────────────────────
    this.#actionsEl.innerHTML = '';

    if (state === EDITOR_STATE.AWAITING_STATION || state === EDITOR_STATE.PLACING) {
      if (state === EDITOR_STATE.PLACING) {
        // Undo
        const undo = this.#makeBtn('Undo', 'track-btn', () => this.#editor.undo());
        undo.disabled = !layout || layout.pieces.length <= 1;
        this.#actionsEl.appendChild(undo);

        // Close Loop
        const close = this.#makeBtn('Close Loop', 'track-btn primary', () => this.#editor.closeLoop());
        close.disabled = !canClose;
        this.#actionsEl.appendChild(close);
      }
      // Cancel
      const cancel = this.#makeBtn('Cancel', 'track-btn danger', () => this.#editor.cancel());
      this.#actionsEl.appendChild(cancel);
    }

    if (state === EDITOR_STATE.CLOSED) {
      const openBtn = this.#makeBtn('Open Ride', 'track-btn primary', () => this.#editor.openRide());
      const editBtn = this.#makeBtn('Edit',      'track-btn',         () => this.#editor.editLayout());
      const cancelBtn = this.#makeBtn('Cancel',  'track-btn danger',  () => this.#editor.cancel());
      this.#actionsEl.appendChild(openBtn);
      this.#actionsEl.appendChild(editBtn);
      this.#actionsEl.appendChild(cancelBtn);
    }

    // ── validation errors ──────────────────────────────────────────────────
    this.#errorsEl.textContent = '';
    if (validation && !validation.valid) {
      this.#errorsEl.textContent = validation.errors.join(' · ');
    }
  }

  #makeBtn(label, className, onClick) {
    const btn = document.createElement('button');
    btn.className = className;
    btn.textContent = label;
    btn.addEventListener('pointerdown', e => e.stopPropagation());
    btn.addEventListener('click', onClick);
    return btn;
  }
}
