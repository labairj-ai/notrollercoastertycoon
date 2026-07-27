export class RidePanel {
  #el;
  #nameEl;
  #statusEl;
  #statsEl;
  #toggleBtn;
  #ride = null;

  constructor() {
    this.#el = this.#build();
    this.#el.style.display = 'none';
    document.getElementById('app').appendChild(this.#el);
  }

  #build() {
    const panel = document.createElement('div');
    panel.className = 'ride-panel';
    panel.innerHTML = `
      <div class="rp-header">
        <span class="rp-name"></span>
        <button class="rp-close">×</button>
      </div>
      <div class="rp-status"></div>
      <div class="rp-stats"></div>
      <div class="rp-footer">
        <button class="rp-toggle"></button>
      </div>
    `;

    const stopProp = e => e.stopPropagation();
    panel.addEventListener('pointerdown', stopProp);

    panel.querySelector('.rp-close').addEventListener('click', () => this.hide());

    this.#nameEl   = panel.querySelector('.rp-name');
    this.#statusEl = panel.querySelector('.rp-status');
    this.#statsEl  = panel.querySelector('.rp-stats');
    this.#toggleBtn = panel.querySelector('.rp-toggle');
    this.#toggleBtn.addEventListener('click', () => {
      if (!this.#ride) return;
      this.#ride.status = this.#ride.status === 'OPEN' ? 'CLOSED' : 'OPEN';
      this.#render();
    });
    return panel;
  }

  show(ride) {
    this.#ride = ride;
    this.#render();
    this.#el.style.display = '';
  }

  hide() {
    this.#ride = null;
    this.#el.style.display = 'none';
  }

  #render() {
    const r = this.#ride;
    this.#nameEl.textContent = r.name;

    const SC = { OPEN: '#44cc44', CLOSED: '#888', BROKEN: '#cc4444' };
    const SL = { OPEN: '● OPEN', CLOSED: '● CLOSED', BROKEN: '● BROKEN' };
    this.#statusEl.innerHTML =
      `<span style="color:${SC[r.status]}">${SL[r.status]}</span>` +
      `<span class="rp-price">$${r.price.toFixed(2)}/ride</span>`;

    const isStall = r.excitement === 0;
    this.#statsEl.innerHTML = isStall
      ? `<div class="rp-row">Income: $${r.incomeTotal.toFixed(2)}</div>`
      : `<div class="rp-row">Excitement <span class="bar"><span class="bf" style="width:${r.excitement*10}%;background:#2080e0"></span></span> ${r.excitement}</div>
         <div class="rp-row">Intensity  <span class="bar"><span class="bf" style="width:${r.intensity*10}%;background:#e08020"></span></span> ${r.intensity}</div>
         <div class="rp-row">Nausea     <span class="bar"><span class="bf" style="width:${r.nausea*10}%;background:#20a040"></span></span> ${r.nausea}</div>
         <div class="rp-row">Riders: ${r.riderCount} · Income: $${r.incomeTotal.toFixed(2)}</div>`;

    this.#toggleBtn.textContent = r.status === 'OPEN' ? 'Close Ride' : 'Open Ride';
    this.#toggleBtn.style.color        = r.status === 'OPEN' ? '#cc6060' : '#60cc60';
    this.#toggleBtn.style.borderColor  = r.status === 'OPEN' ? 'rgba(200,60,60,0.4)' : 'rgba(60,200,60,0.4)';
    this.#toggleBtn.style.background   = r.status === 'OPEN' ? 'rgba(200,60,60,0.15)' : 'rgba(60,200,60,0.15)';
  }
}
