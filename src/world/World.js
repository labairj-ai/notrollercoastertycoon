import { TileGrid } from './TileGrid.js';

export class World {
  grid  = new TileGrid();
  rides = new Map();  // rideId → Ride
  peeps = [];
  staff = [];
}
