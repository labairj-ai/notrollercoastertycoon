import { ToolPanel } from './ToolPanel.js';
import { HUD } from './HUD.js';

export class UIManager {
  #toolPanel;
  #hud;

  constructor(bus, world) {
    this.#toolPanel = new ToolPanel(bus);
    this.#hud       = new HUD(world.economy);
    bus.on('economyUpdate', data => this.#hud.update(data));
  }

  get currentTool() { return this.#toolPanel.currentTool; }
}
