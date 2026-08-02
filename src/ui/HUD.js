export class HUD {
  #moneyEl;
  #dayEl;
  #guestsEl;
  #ratingEl;
  #speedBtns;

  constructor(economy, bus) {
    const hud = document.createElement('div');
    hud.className = 'hud';
    hud.innerHTML = `
      <span class="hud-item" id="hud-money"></span>
      <span class="hud-sep">|</span>
      <span class="hud-item" id="hud-day"></span>
      <span class="hud-sep">|</span>
      <span class="hud-item" id="hud-guests"></span>
      <span class="hud-sep">|</span>
      <span class="hud-item" id="hud-rating"></span>
      <span class="hud-sep">|</span>
      <span class="hud-speeds">
        <button class="speed-btn" data-speed="0" title="Pause">⏸</button>
        <button class="speed-btn active" data-speed="1" title="Normal">▶</button>
        <button class="speed-btn" data-speed="3" title="Fast">⏩</button>
      </span>
    `;
    document.getElementById('app').appendChild(hud);

    this.#moneyEl  = document.getElementById('hud-money');
    this.#dayEl    = document.getElementById('hud-day');
    this.#guestsEl = document.getElementById('hud-guests');
    this.#ratingEl = document.getElementById('hud-rating');
    this.#speedBtns = hud.querySelectorAll('.speed-btn');

    hud.querySelector('.hud-speeds').addEventListener('click', e => {
      const btn = e.target.closest('.speed-btn');
      if (!btn) return;
      const speed = +btn.dataset.speed;
      bus.emit('speedChange', { speed });
      for (const b of this.#speedBtns) b.classList.toggle('active', +b.dataset.speed === speed);
    });

    this.update(economy);
  }

  update({ money, day, guestCount, parkRating }) {
    this.#moneyEl.textContent  = `$${money.toLocaleString()}`;
    this.#dayEl.textContent    = `Day ${day}`;
    this.#guestsEl.textContent = `${guestCount} guests`;
    this.#ratingEl.textContent = `★ ${parkRating}`;
  }
}
