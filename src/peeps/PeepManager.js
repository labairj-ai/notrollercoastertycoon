import { Peep, PEEP_STATE } from './Peep.js';
import { findPath } from './PathFinder.js';
import { MAX_PEEPS, DAY_LENGTH_MS, SURFACE } from '../constants.js';

const RIDE_DURATION   = 25;  // seconds a peep spends at a ride
const MAX_RIDES_VISIT = 4;   // max rides per park visit before leaving

export class PeepManager {
  #spawnAccum  = 0;
  #dayTimer    = 0;   // ms
  #ratingTimer = 0;   // seconds

  update(dt, world, bus) {
    this.#tickDay(dt, world, bus);
    this.#tickSpawn(dt, world);
    this.#tickPeeps(dt, world, bus);
    this.#tickRating(dt, world, bus);

    world.economy.guestCount = world.peeps.filter(p => p.state !== PEEP_STATE.GONE).length;
  }

  // ── Day clock ─────────────────────────────────────────────────────────────

  #tickDay(dt, world, bus) {
    this.#dayTimer += dt * 1000;
    if (this.#dayTimer >= DAY_LENGTH_MS) {
      this.#dayTimer -= DAY_LENGTH_MS;
      world.economy.day++;
      bus.emit('economyUpdate', world.economy);
    }
  }

  // ── Spawning ──────────────────────────────────────────────────────────────

  #tickSpawn(dt, world) {
    if (!world.entrance) return;
    const ent = world.grid.get(world.entrance.tx, world.entrance.ty);
    if (!ent || ent.surface !== SURFACE.PATH) return;

    const active = world.peeps.filter(p => p.state !== PEEP_STATE.GONE).length;
    if (active >= MAX_PEEPS) return;

    // Rate: scale with park rating (max ~0.67 peeps/sec at rating 999)
    const rate = (world.economy.parkRating / 1000) * (20 / (DAY_LENGTH_MS / 1000));
    this.#spawnAccum += dt * rate;

    while (this.#spawnAccum >= 1) {
      this.#spawnAccum -= 1;
      const stillActive = world.peeps.filter(p => p.state !== PEEP_STATE.GONE).length;
      if (stillActive >= MAX_PEEPS) break;
      this.#spawnPeep(world);
    }

    // Prune GONE entries so the array doesn't grow unbounded
    if (world.peeps.length > MAX_PEEPS * 2) {
      world.peeps = world.peeps.filter(p => p.state !== PEEP_STATE.GONE);
    }
  }

  #spawnPeep(world) {
    const { tx, ty } = world.entrance;
    const peep = new Peep(tx, ty);
    world.peeps.push(peep);
    this.#assignTarget(peep, world);
  }

  // ── Target assignment ─────────────────────────────────────────────────────

  #assignTarget(peep, world) {
    if (peep.ridesVisited >= MAX_RIDES_VISIT || peep.happiness < 30 || peep.cash < 1) {
      this.#sendToExit(peep, world);
      return;
    }

    const targets = this.#getReachableTargets(world);
    if (targets.length === 0) {
      this.#sendToExit(peep, world);
      return;
    }

    // Weight by excitement so thrilling rides draw more guests
    const weights = targets.map(t => 1 + t.excitement);
    const total   = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let chosen = targets[targets.length - 1];
    for (let i = 0; i < targets.length; i++) {
      r -= weights[i];
      if (r <= 0) { chosen = targets[i]; break; }
    }

    const path = findPath(world.grid, peep.tx, peep.ty, chosen.entryTx, chosen.entryTy);
    if (!path) {
      this.#sendToExit(peep, world);
      return;
    }

    peep.setPath(path);
    peep.targetId  = chosen.id;
    peep.isCoaster = chosen.isCoaster;
    peep.state     = PEEP_STATE.WALKING;
  }

  #sendToExit(peep, world) {
    if (!world.entrance) { peep.state = PEEP_STATE.GONE; return; }
    const { tx, ty } = world.entrance;
    if (peep.tx === tx && peep.ty === ty) { peep.state = PEEP_STATE.GONE; return; }

    const path = findPath(world.grid, peep.tx, peep.ty, tx, ty);
    if (!path || path.length <= 1) { peep.state = PEEP_STATE.GONE; return; }

    peep.setPath(path);
    peep.state    = PEEP_STATE.LEAVING;
    peep.targetId = null;
  }

  // ── Per-frame peep update ─────────────────────────────────────────────────

  #tickPeeps(dt, world, bus) {
    for (const peep of world.peeps) {
      peep.update(dt);

      if (peep.state === PEEP_STATE.GONE) continue;

      if (peep.state === PEEP_STATE.AT_RIDE) {
        if (peep.ridingTimer <= 0) this.#assignTarget(peep, world);
        continue;
      }

      if (peep.state === PEEP_STATE.LEAVING && peep.atEndOfPath()) {
        peep.state = PEEP_STATE.GONE;
        continue;
      }

      if (peep.state === PEEP_STATE.WALKING && peep.atEndOfPath()) {
        this.#arriveAtTarget(peep, world, bus);
        continue;
      }

      if (peep.stuckTimer > 8) this.#sendToExit(peep, world);
    }
  }

  #arriveAtTarget(peep, world, bus) {
    const { id, isCoaster } = peep;
    let price = 0, excitement = 0, open = false;
    let rideObj = null;

    if (!isCoaster) {
      rideObj = world.rides.get(peep.targetId);
      if (rideObj && rideObj.status === 'OPEN') {
        ({ price, excitement } = rideObj);
        open = true;
      }
    } else {
      const layout = world.coasters.get(peep.targetId);
      if (layout && layout.status === 'OPEN') {
        price = 3; excitement = 8;
        open = true;
      }
    }

    if (!open) {
      this.#assignTarget(peep, world);
      return;
    }

    const paid = Math.min(peep.cash, price);
    peep.cash      -= paid;
    peep.happiness  = Math.min(100, peep.happiness + excitement * 2);
    peep.ridesVisited++;
    peep.state      = PEEP_STATE.AT_RIDE;
    peep.ridingTimer = RIDE_DURATION;
    peep.targetId   = null;

    if (rideObj) {
      rideObj.riderCount++;
      rideObj.incomeTotal += paid;
    }
    world.economy.money += paid;
    bus.emit('economyUpdate', world.economy);
  }

  // ── Park rating ───────────────────────────────────────────────────────────

  #tickRating(dt, world, bus) {
    this.#ratingTimer += dt;
    if (this.#ratingTimer < 5) return;
    this.#ratingTimer = 0;

    const openRides    = [...world.rides.values()].filter(r => r.status === 'OPEN').length;
    const openCoasters = [...world.coasters.values()].filter(l => l.status === 'OPEN').length;
    const rideBonus    = openRides * 25 + openCoasters * 80;

    const active = world.peeps.filter(p => p.state !== PEEP_STATE.GONE);
    let target;
    if (active.length === 0) {
      target = Math.min(200, rideBonus);
    } else {
      const avgHappy = active.reduce((s, p) => s + p.happiness, 0) / active.length;
      target = Math.min(999, avgHappy * 6 + rideBonus);
    }

    // Smooth drift toward target (15% per 5-second tick)
    const diff = target - world.economy.parkRating;
    world.economy.parkRating = Math.round(
      Math.max(0, Math.min(999, world.economy.parkRating + diff * 0.15))
    );
    bus.emit('economyUpdate', world.economy);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  #getReachableTargets(world) {
    const targets = [];

    for (const ride of world.rides.values()) {
      if (ride.status !== 'OPEN') continue;
      const entry = this.#rideEntryTile(ride.footprint.map(({dx,dy}) =>
        ({ tx: ride.tx + dx, ty: ride.ty + dy })), world.grid);
      if (entry) targets.push({
        id: ride.id, entryTx: entry[0], entryTy: entry[1],
        price: ride.price, excitement: ride.excitement, isCoaster: false,
      });
    }

    for (const layout of world.coasters.values()) {
      if (layout.status !== 'OPEN') continue;
      const station = layout.pieces.find(p => p.isStation);
      if (!station) continue;
      const entry = this.#adjacentPathTile(station.tx, station.ty, world.grid);
      if (entry) targets.push({
        id: layout.id, entryTx: entry[0], entryTy: entry[1],
        price: 3, excitement: 8, isCoaster: true,
      });
    }

    return targets;
  }

  #rideEntryTile(footprintTiles, grid) {
    for (const { tx, ty } of footprintTiles) {
      const entry = this.#adjacentPathTile(tx, ty, grid);
      if (entry) return entry;
    }
    return null;
  }

  #adjacentPathTile(tx, ty, grid) {
    for (const [dx, dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const t = grid.get(tx + dx, ty + dy);
      if (t?.surface === SURFACE.PATH) return [tx + dx, ty + dy];
    }
    return null;
  }
}
