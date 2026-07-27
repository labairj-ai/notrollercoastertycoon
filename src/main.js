import { Game } from './core/Game.js';

const game = new Game(
  document.getElementById('world'),
  document.getElementById('ui'),
);

game.start();
