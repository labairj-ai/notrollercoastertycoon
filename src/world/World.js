import { TileGrid } from './TileGrid.js';

export class World {
  grid     = new TileGrid();
  rides    = new Map();  // rideId → Ride
  coasters = new Map();  // layoutId → TrackLayout
  trains   = new Map();  // trainId → Train
  peeps    = [];
  staff    = [];
  entrance = null;       // { tx, ty } — first path tile placed; peeps spawn here

  economy = {
    money:      10_000,
    day:        1,
    guestCount: 0,
    parkRating: 500,
    parkName:   'My Park',
  };
}
