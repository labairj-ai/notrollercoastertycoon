import { ToolPanel } from './ToolPanel.js';
import { HUD } from './HUD.js';
import { RidePanel } from './RidePanel.js';
import { TrackEditorPanel } from './TrackEditorPanel.js';

export class UIManager {
  #toolPanel;
  #hud;
  #ridePanel;
  #trackPanel;

  constructor(bus, world, trackEditor) {
    this.#toolPanel  = new ToolPanel(bus);
    this.#hud        = new HUD(world.economy, bus);
    this.#ridePanel  = new RidePanel();
    this.#trackPanel = new TrackEditorPanel(trackEditor, bus);
    bus.on('economyUpdate', data => this.#hud.update(data));
  }

  get currentTool() { return this.#toolPanel.currentTool; }
  get ridePanel()   { return this.#ridePanel; }
}
