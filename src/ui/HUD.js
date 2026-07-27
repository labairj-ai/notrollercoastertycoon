export class HUD {
  #moneyEl;
  #dayEl;
  #guestsEl;
  #ratingEl;

  constructor(economy) {
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
    `;
    document.getElementById('app').appendChild(hud);

    this.#moneyEl  = document.getElementById('hud-money');
    this.#dayEl    = document.getElementById('hud-day');
    this.#guestsEl = document.getElementById('hud-guests');
    this.#ratingEl = document.getElementById('hud-rating');

    this.update(economy);
  }

  update({ money, day, guestCount, parkRating }) {
    this.#moneyEl.textContent  = `$${money.toLocaleString()}`;
    this.#dayEl.textContent    = `Day ${day}`;
    this.#guestsEl.textContent = `${guestCount} guests`;
    this.#ratingEl.textContent = `★ ${parkRating}`;
  }
}
