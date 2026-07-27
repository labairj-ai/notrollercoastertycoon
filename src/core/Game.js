import { Camera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { EventBus } from './EventBus.js';
import { World } from '../world/World.js';
import { Renderer } from '../renderer/Renderer.js';
import { UIManager } from '../ui/UIManager.js';
import { TOOL } from '../ui/ToolPanel.js';
import { SURFACE, HUD_HEIGHT, TOOL_PANEL_HEIGHT } from '../constants.js';

export class Game {
  #bus      = new EventBus();
  #world    = new World();
  #renderer = new Renderer();
  #cam;
  #ui;
  #worldCanvas;
  #uiCanvas;
  #worldCtx;
  #uiCtx;
  #rafId = null;

  constructor(worldCanvas, uiCanvas) {
    this.#worldCanvas = worldCanvas;
    this.#uiCanvas    = uiCanvas;
    this.#worldCtx    = worldCanvas.getContext('2d');
    this.#uiCtx       = uiCanvas.getContext('2d');

    this.#resize();
    this.#cam = new Camera(window.innerWidth, window.innerHeight, HUD_HEIGHT);

    // UIManager must be created after canvas so DOM is ready for appendChild
    this.#ui = new UIManager(this.#bus, this.#world);

    new InputManager(worldCanvas, this.#bus);

    // Routing: pan → camera only in VIEW mode; PATH tool drag → paint tiles
    this.#bus.on('pan', ({ dx, dy }) => {
      if (this.#ui.currentTool !== TOOL.PATH) this.#cam.pan(dx, dy);
    });
    this.#bus.on('zoom', ({ screenX, screenY, factor }) => {
      this.#cam.zoomAt(screenX, screenY, factor);
    });
    // During PATH drag: paint tiles under finger
    this.#bus.on('pointerMove', ({ x, y, dragging }) => {
      if (dragging && this.#ui.currentTool === TOOL.PATH) this.#applyTool(x, y);
    });
    // Tap always applies current tool
    this.#bus.on('tap', ({ x, y }) => this.#applyTool(x, y));

    window.addEventListener('resize', () => this.#resize());
  }

  #resize() {
    const dpr = window.devicePixelRatio || 1;
    const w   = window.innerWidth;
    const h   = window.innerHeight;

    for (const canvas of [this.#worldCanvas, this.#uiCanvas]) {
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      // canvas.width resets the transform — reapply DPR scale
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  #applyTool(x, y) {
    const { tx, ty } = this.#cam.screenToWorld(x, y);
    const tile = this.#world.grid.get(tx, ty);
    if (!tile) return;

    switch (this.#ui.currentTool) {
      case TOOL.VIEW:
        this.#bus.emit('tileSelect', { tx, ty });
        break;
      case TOOL.PATH:
        this.#placePath(tx, ty, tile);
        break;
      case TOOL.RAISE:
        tile.elevation = Math.min(8, tile.elevation + 1);
        break;
      case TOOL.LOWER:
        tile.elevation = Math.max(0, tile.elevation - 1);
        break;
    }
  }

  #placePath(tx, ty, tile) {
    if (tile.surface === SURFACE.PATH) return;
    tile.surface = SURFACE.PATH;
    this.#world.economy.money -= 10;
    this.#updatePathMask(tx, ty);
    this.#bus.emit('economyUpdate', this.#world.economy);
  }

  #updatePathMask(tx, ty) {
    // [neighborX, neighborY, bitInThisTile, bitInNeighbor]
    const dirs = [
      [tx,     ty - 1, 0, 2], // N ↔ S
      [tx + 1, ty,     1, 3], // E ↔ W
      [tx,     ty + 1, 2, 0], // S ↔ N
      [tx - 1, ty,     3, 1], // W ↔ E
    ];
    const tile = this.#world.grid.get(tx, ty);
    let mask = 0;
    for (const [nx, ny, bit, nbit] of dirs) {
      const ntile = this.#world.grid.get(nx, ny);
      if (ntile?.surface === SURFACE.PATH) {
        mask |= (1 << bit);
        ntile.pathMask |= (1 << nbit);
      }
    }
    tile.pathMask = mask;
  }

  start() {
    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.#renderer.render(this.#worldCtx, this.#uiCtx, this.#world, this.#cam, w, h);
      this.#rafId = requestAnimationFrame(tick);
    };
    this.#rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  get bus()   { return this.#bus;   }
  get world() { return this.#world; }
  get cam()   { return this.#cam;   }
}
