export const RIDE_TYPE = {
  FERRIS_WHEEL:   'FERRIS_WHEEL',
  CAROUSEL:       'CAROUSEL',
  BUMPER_CARS:    'BUMPER_CARS',
  STALL_FOOD:     'STALL_FOOD',
  STALL_DRINK:    'STALL_DRINK',
  STALL_SOUVENIR: 'STALL_SOUVENIR',
};

const FP1 = [{ dx: 0, dy: 0 }];
const FP2 = [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }];

export const RIDE_CATALOG = {
  [RIDE_TYPE.FERRIS_WHEEL]: {
    name: 'Ferris Wheel',   cost: 2000,
    footprint: FP2,         price: 2,
    excitement: 5, intensity: 2, nausea: 1,
    animated: true,  animSpeed: 0.5,
  },
  [RIDE_TYPE.CAROUSEL]: {
    name: 'Carousel',       cost: 600,
    footprint: FP1,         price: 1,
    excitement: 2, intensity: 1, nausea: 0,
    animated: true,  animSpeed: 1.5,
  },
  [RIDE_TYPE.BUMPER_CARS]: {
    name: 'Bumper Cars',    cost: 1200,
    footprint: FP2,         price: 1.5,
    excitement: 3, intensity: 3, nausea: 2,
    animated: false, animSpeed: 0,
  },
  [RIDE_TYPE.STALL_FOOD]: {
    name: 'Hot Dog Stand',  cost: 250,
    footprint: FP1,         price: 2,
    excitement: 0, intensity: 0, nausea: 0,
    animated: false, animSpeed: 0,
  },
  [RIDE_TYPE.STALL_DRINK]: {
    name: 'Drink Stand',    cost: 200,
    footprint: FP1,         price: 1.5,
    excitement: 0, intensity: 0, nausea: 0,
    animated: false, animSpeed: 0,
  },
  [RIDE_TYPE.STALL_SOUVENIR]: {
    name: 'Souvenir Stall', cost: 300,
    footprint: FP1,         price: 3,
    excitement: 0, intensity: 0, nausea: 0,
    animated: false, animSpeed: 0,
  },
};
