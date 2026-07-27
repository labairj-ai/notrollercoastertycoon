import { ToolPanel } from './ToolPanel.js';
import { HUD } from './HUD.js';
import { RidePanel } from './RidePanel.js';

export class UIManager {
  #toolPanel;
  #hud;
  #ridePanel;

  constructor(bus, world) {
    this.#toolPanel = new ToolPanel(bus);
    this.#hud       = new HUD(world.economy);
    this.#ridePanel = new RidePanel();
    bus.on('economyUpdate', data => this.#hud.update(data));
  }

  get currentTool() { return this.#toolPanel.currentTool; }
  get ridePanel()   { return this.#ridePanel; }
}
