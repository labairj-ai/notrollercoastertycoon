export const TILE_W = 64;
export const TILE_H = 32;
export const GRID_SIZE = 128;
export const ELEV_HEIGHT = TILE_H / 2;       // 16px per elevation unit

export const GRAVITY      = 9.8;
export const FRICTION     = 0.01;
export const CHAIN_ACCEL  = 2.0;
export const BRAKE_DECEL  = 4.0;
export const BOARD_TIME   = 30;

export const STAFF_DAILY_WAGE = { HANDYMAN: 50, MECHANIC: 80, ENTERTAINER: 60 };
export const INTEREST_RATE_PER_DAY = 0.0003;
export const MAX_PEEPS          = 500;
export const MAX_DAILY_ARRIVALS = 20;
export const DAY_LENGTH_MS      = 30_000;

export const DIRS    = { N: 0, E: 1, S: 2, W: 3 };
export const DIR_VEC = [[0,-1],[1,0],[0,1],[-1,0]];

export const TERRAIN = { GRASS: 'GRASS', SAND: 'SAND', WATER: 'WATER', ROCK: 'ROCK' };
export const SURFACE = { NONE: 'NONE', PATH: 'PATH', QUEUE: 'QUEUE', RIDE_BASE: 'RIDE_BASE' };

// Mobile UI — Apple HIG minimum tap target
export const MIN_TOUCH_TARGET  = 44;
export const TOOL_PANEL_HEIGHT = 80; // bottom toolbar height
