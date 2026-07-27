export const TOOL = {
  VIEW:           'VIEW',
  PATH:           'PATH',
  RAISE:          'RAISE',
  LOWER:          'LOWER',
  RIDE_FERRIS:    'RIDE_FERRIS',
  RIDE_CAROUSEL:  'RIDE_CAROUSEL',
  RIDE_BUMPERS:   'RIDE_BUMPERS',
  STALL_FOOD:     'STALL_FOOD',
  STALL_DRINK:    'STALL_DRINK',
  STALL_SOUVENIR: 'STALL_SOUVENIR',
};

const TOOL_DEFS = [
  { id: TOOL.VIEW,           icon: '👁',  label: 'View'     },
  { id: TOOL.PATH,           icon: '🛤',  label: 'Path'     },
  { id: TOOL.RAISE,          icon: '▲',   label: 'Raise'    },
  { id: TOOL.LOWER,          icon: '▼',   label: 'Lower'    },
  null, // separator
  { id: TOOL.RIDE_FERRIS,    icon: '🎡',  label: 'Ferris'   },
  { id: TOOL.RIDE_CAROUSEL,  icon: '🎠',  label: 'Carousel' },
  { id: TOOL.RIDE_BUMPERS,   icon: '🚗',  label: 'Bumpers'  },
  null,
  { id: TOOL.STALL_FOOD,     icon: '🌭',  label: 'Food'     },
  { id: TOOL.STALL_DRINK,    icon: '🥤',  label: 'Drink'    },
  { id: TOOL.STALL_SOUVENIR, icon: '🎈',  label: 'Souvenir' },
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
      if (def === null) {
        const sep = document.createElement('div');
        sep.className = 'tool-sep';
        panel.appendChild(sep);
        continue;
      }
      const btn = document.createElement('button');
      btn.className = 'tool-btn' + (def.id === this.#currentTool ? ' active' : '');
      btn.innerHTML = `<span class="tool-icon">${def.icon}</span><span class="tool-label">${def.label}</span>`;
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
