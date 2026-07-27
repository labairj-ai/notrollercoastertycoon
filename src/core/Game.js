import { Camera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { EventBus } from './EventBus.js';
import { World } from '../world/World.js';
import { Renderer } from '../renderer/Renderer.js';
import { UIManager } from '../ui/UIManager.js';
import { TOOL } from '../ui/ToolPanel.js';
import { RIDE_CATALOG, RIDE_TYPE } from '../rides/RideRegistry.js';
import { Ride } from '../rides/Ride.js';
import { SURFACE, HUD_HEIGHT } from '../constants.js';
import { TrackEditor } from '../track/TrackEditor.js';

const TOOL_TO_RIDE = {
  [TOOL.RIDE_FERRIS]:    RIDE_TYPE.FERRIS_WHEEL,
  [TOOL.RIDE_CAROUSEL]:  RIDE_TYPE.CAROUSEL,
  [TOOL.RIDE_BUMPERS]:   RIDE_TYPE.BUMPER_CARS,
  [TOOL.STALL_FOOD]:     RIDE_TYPE.STALL_FOOD,
  [TOOL.STALL_DRINK]:    RIDE_TYPE.STALL_DRINK,
  [TOOL.STALL_SOUVENIR]: RIDE_TYPE.STALL_SOUVENIR,
};

export class Game {
  #bus          = new EventBus();
  #world        = new World();
  #renderer     = new Renderer();
  #trackEditor;
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
    this.#cam         = new Camera(window.innerWidth, window.innerHeight, HUD_HEIGHT);
    this.#trackEditor = new TrackEditor(this.#world, this.#bus);
    this.#ui          = new UIManager(this.#bus, this.#world, this.#trackEditor);

    new InputManager(worldCanvas, this.#bus);

    this.#bus.on('pan', ({ dx, dy }) => {
      const t = this.#ui.currentTool;
      if (t !== TOOL.PATH) this.#cam.pan(dx, dy);
    });
    this.#bus.on('zoom', ({ screenX, screenY, factor }) => {
      this.#cam.zoomAt(screenX, screenY, factor);
    });
    this.#bus.on('pointerMove', ({ x, y, dragging }) => {
      if (dragging && this.#ui.currentTool === TOOL.PATH) this.#applyTool(x, y);
      // Track hover tile for track editor ghost
      if (this.#ui.currentTool === TOOL.COASTER) {
        const { tx, ty } = this.#cam.screenToWorld(x, y);
        this.#trackEditor.setHover(tx, ty);
      }
    });
    this.#bus.on('tap', ({ x, y }) => this.#applyTool(x, y));
    this.#bus.on('toolChange', ({ tool }) => {
      if (tool === TOOL.COASTER) {
        this.#trackEditor.activate();
      } else {
        this.#trackEditor.deactivate();
      }
    });

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
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  #applyTool(x, y) {
    const { tx, ty } = this.#cam.screenToWorld(x, y);

    // Coaster tool: TrackEditor handles its own bounds checking
    if (this.#ui.currentTool === TOOL.COASTER) {
      this.#trackEditor.handleTap(tx, ty);
      return;
    }

    // Ride placement tools
    const rideType = TOOL_TO_RIDE[this.#ui.currentTool];
    if (rideType) { this.#placeRide(tx, ty, rideType); return; }

    const tile = this.#world.grid.get(tx, ty);
    if (!tile) return;

    switch (this.#ui.currentTool) {
      case TOOL.VIEW:
        if (tile.surface === SURFACE.RIDE_BASE && tile.rideId) {
          const ride = this.#world.rides.get(tile.rideId);
          if (ride) { this.#ui.ridePanel.show(ride); return; }
        }
        this.#ui.ridePanel.hide();
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
    if (tile.surface !== SURFACE.NONE) return;
    tile.surface = SURFACE.PATH;
    this.#world.economy.money -= 10;
    this.#updatePathMask(tx, ty);
    this.#bus.emit('economyUpdate', this.#world.economy);
  }

  #updatePathMask(tx, ty) {
    const dirs = [
      [tx,     ty - 1, 0, 2],
      [tx + 1, ty,     1, 3],
      [tx,     ty + 1, 2, 0],
      [tx - 1, ty,     3, 1],
    ];
    const tile = this.#world.grid.get(tx, ty);
    let mask = 0;
    for (const [nx, ny, bit, nbit] of dirs) {
      const n = this.#world.grid.get(nx, ny);
      if (n?.surface === SURFACE.PATH) {
        mask |= (1 << bit);
        n.pathMask |= (1 << nbit);
      }
    }
    tile.pathMask = mask;
  }

  #placeRide(tx, ty, rideType) {
    const def = RIDE_CATALOG[rideType];
    if (!def || this.#world.economy.money < def.cost) return;

    for (const { dx, dy } of def.footprint) {
      const t = this.#world.grid.get(tx + dx, ty + dy);
      if (!t || t.surface !== SURFACE.NONE) return;
    }

    const id   = `r${Date.now()}`;
    const ride = new Ride({ id, type: rideType, tx, ty, ...def });
    this.#world.rides.set(id, ride);
    this.#world.economy.money -= def.cost;

    for (const { dx, dy } of def.footprint) {
      const t    = this.#world.grid.get(tx + dx, ty + dy);
      t.surface  = SURFACE.RIDE_BASE;
      t.rideId   = id;
    }
    this.#bus.emit('economyUpdate', this.#world.economy);
  }

  #update(dt) {
    for (const ride of this.#world.rides.values()) {
      if (ride.animated && ride.status === 'OPEN') {
        ride.animAngle = (ride.animAngle + dt * ride.animSpeed) % (Math.PI * 2);
      }
    }
  }

  start() {
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;
      this.#update(dt);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.#renderer.render(this.#worldCtx, this.#uiCtx, this.#world, this.#trackEditor, this.#cam, w, h);
      this.#rafId = requestAnimationFrame(tick);
    };
    this.#rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.#rafId) { cancelAnimationFrame(this.#rafId); this.#rafId = null; }
  }

  get bus()   { return this.#bus;   }
  get world() { return this.#world; }
  get cam()   { return this.#cam;   }
}
