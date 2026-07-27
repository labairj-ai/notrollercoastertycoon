export const TOOL = {
  VIEW:  'VIEW',
  PATH:  'PATH',
  RAISE: 'RAISE',
  LOWER: 'LOWER',
};

const TOOL_DEFS = [
  { id: TOOL.VIEW,  icon: '👁',  label: 'View'  },
  { id: TOOL.PATH,  icon: '🛤',  label: 'Path'  },
  { id: TOOL.RAISE, icon: '▲',   label: 'Raise' },
  { id: TOOL.LOWER, icon: '▼',   label: 'Lower' },
];

export class ToolPanel {
  #bus;
  #currentTool = TOOL.VIEW;
  #buttons = {};

  constructor(bus) {
    this.#bus = bus;

    const panel = document.createElement('div');
    panel.className = 'tool-panel';

    for (const def of TOOL_DEFS) {
      const btn = document.createElement('button');
      btn.className = 'tool-btn' + (def.id === this.#currentTool ? ' active' : '');
      btn.innerHTML = `<span class="tool-icon">${def.icon}</span><span class="tool-label">${def.label}</span>`;
      // Consume pointer events so they don't fall through to the canvas
      btn.addEventListener('pointerdown', e => e.stopPropagation());
      btn.addEventListener('click', () => this.#select(def.id));
      panel.appendChild(btn);
      this.#buttons[def.id] = btn;
    }

    document.getElementById('app').appendChild(panel);
  }

  #select(toolId) {
    this.#currentTool = toolId;
    for (const [id, btn] of Object.entries(this.#buttons)) {
      btn.classList.toggle('active', id === toolId);
    }
    this.#bus.emit('toolChange', { tool: toolId });
  }

  get currentTool() { return this.#currentTool; }
}
