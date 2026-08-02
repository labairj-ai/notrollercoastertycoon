import { GRID_SIZE, SURFACE } from '../constants.js';

// BFS path cache — cleared whenever grid.version changes
let _cacheVersion = -1;
const _cache = new Map();

export function findPath(grid, fromTx, fromTy, toTx, toTy) {
  if (grid.version !== _cacheVersion) {
    _cache.clear();
    _cacheVersion = grid.version;
  }
  const k = `${fromTx},${fromTy}:${toTx},${toTy}`;
  if (_cache.has(k)) return _cache.get(k);
  const path = _bfs(grid, fromTx, fromTy, toTx, toTy);
  _cache.set(k, path);
  return path;
}

function _bfs(grid, fromTx, fromTy, toTx, toTy) {
  if (fromTx === toTx && fromTy === toTy) return [[fromTx, fromTy]];

  const idx    = (tx, ty) => ty * GRID_SIZE + tx;
  const parent = new Map();
  parent.set(idx(fromTx, fromTy), null); // sentinel: start has no parent
  const queue  = [[fromTx, fromTy]];

  while (queue.length > 0) {
    const [tx, ty] = queue.shift();
    if (tx === toTx && ty === toTy) {
      const path = [];
      let cur = [toTx, toTy];
      while (cur !== null) {
        path.push(cur);
        cur = parent.get(idx(cur[0], cur[1]));
      }
      return path.reverse();
    }
    for (const [dx, dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const nx = tx + dx, ny = ty + dy;
      const k  = idx(nx, ny);
      if (!parent.has(k)) {
        const t = grid.get(nx, ny);
        if (t && t.surface === SURFACE.PATH) {
          parent.set(k, [tx, ty]);
          queue.push([nx, ny]);
        }
      }
    }
  }
  return null; // no path exists
}
