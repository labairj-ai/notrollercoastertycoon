import { Camera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { EventBus } from './EventBus.js';
import { World } from '../world/World.js';
import { Renderer } from '../renderer/Renderer.js';

export class Game {
  #bus      = new EventBus();
  #world    = new World();
  #renderer = new Renderer();
  #cam;
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

    // Size canvases to device pixels before creating Camera so dimensions are final
    this.#resize();
    this.#cam = new Camera(window.innerWidth, window.innerHeight);

    new InputManager(worldCanvas, this.#bus);

    this.#bus.on('pan',  ({ dx, dy })                   => this.#cam.pan(dx, dy));
    this.#bus.on('zoom', ({ screenX, screenY, factor }) => this.#cam.zoomAt(screenX, screenY, factor));
    this.#bus.on('tap',  ({ x, y })                     => this.#onTap(x, y));

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
      // canvas.width assignment resets the transform — reapply DPR scale so all
      // drawing coordinates stay in CSS pixels throughout the codebase.
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  #onTap(x, y) {
    const { tx, ty } = this.#cam.screenToWorld(x, y);
    this.#bus.emit('tileSelect', { tx, ty });
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
