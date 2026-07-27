// Unified Pointer Events handler — covers mouse, touch, and stylus with no branching.
// Pinch-to-zoom: two simultaneous pointers → measures distance delta.
// Single pointer: drag threshold of 6px before emitting pan (prevents tap mis-fires).
export class InputManager {
  #bus;
  #canvas;
  #pointers = new Map();   // pointerId → {x, y}
  #lastPinchDist = null;
  #isDragging = false;
  #hadMultiPointer = false;
  #DRAG_THRESHOLD = 6;

  constructor(canvas, bus) {
    this.#canvas = canvas;
    this.#bus = bus;
    this.#bind();
  }

  #bind() {
    const el = this.#canvas;
    el.addEventListener('pointerdown',   e => this.#onDown(e),   { passive: false });
    el.addEventListener('pointermove',   e => this.#onMove(e),   { passive: false });
    el.addEventListener('pointerup',     e => this.#onUp(e),     { passive: false });
    el.addEventListener('pointercancel', e => this.#onUp(e),     { passive: false });
    el.addEventListener('wheel',         e => this.#onWheel(e),  { passive: false });
    el.addEventListener('contextmenu',   e => e.preventDefault());
  }

  #onDown(e) {
    e.preventDefault();
    this.#canvas.setPointerCapture(e.pointerId);
    this.#pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.#pointers.size >= 2) this.#hadMultiPointer = true;
  }

  #onMove(e) {
    e.preventDefault();
    const prev = this.#pointers.get(e.pointerId);
    if (!prev) return;

    const curr = { x: e.clientX, y: e.clientY };
    this.#pointers.set(e.pointerId, curr);

    if (this.#pointers.size >= 2) {
      const pts = [...this.#pointers.values()];
      if (pts.length < 2) return;
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (this.#lastPinchDist !== null) {
        const factor = dist / this.#lastPinchDist;
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        this.#bus.emit('zoom', { screenX: cx, screenY: cy, factor });
      }
      this.#lastPinchDist = dist;
    } else {
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      if (!this.#isDragging && Math.hypot(dx, dy) > this.#DRAG_THRESHOLD) {
        this.#isDragging = true;
      }
      if (this.#isDragging) {
        this.#bus.emit('pan', { dx, dy });
      }
    }
  }

  #onUp(e) {
    e.preventDefault();
    const pos = this.#pointers.get(e.pointerId);

    // Only emit tap on a clean single-finger tap (no drag, no pinch)
    if (pos && !this.#isDragging && !this.#hadMultiPointer && this.#pointers.size === 1) {
      this.#bus.emit('tap', { x: e.clientX, y: e.clientY });
    }

    this.#pointers.delete(e.pointerId);
    if (this.#pointers.size < 2) this.#lastPinchDist = null;
    if (this.#pointers.size === 0) {
      this.#isDragging = false;
      this.#hadMultiPointer = false;
    }
  }

  #onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this.#bus.emit('zoom', { screenX: e.clientX, screenY: e.clientY, factor });
  }
}
