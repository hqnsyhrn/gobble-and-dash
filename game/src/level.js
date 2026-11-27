// Gobble & Dash — stage layouts: each stage is a grid built from a generator, with walls
// (fences, counters), hay-bush hiding spots, corn pickups, ovens and the kitchen door goal.
import { CONFIG } from './config.js';
import { makeRng } from './random.js';

const T = { EMPTY: 0, WALL: 1, HAY: 2, OVEN: 3, GOAL: 4 };

// Carve a random walk from start to goal so every stage is always solvable.
function carvePath(grid, rng, cols, rows, from, to) {
  let [x, y] = from;
  while (x !== to[0] || y !== to[1]) {
    grid[y][x] = T.EMPTY;
    const dx = Math.sign(to[0] - x), dy = Math.sign(to[1] - y);
    if (dx !== 0 && dy !== 0) {
      if (rng() < 0.5) x += dx; else y += dy;
    } else if (dx !== 0) x += dx; else y += dy;
  }
  grid[to[1]][to[0]] = T.EMPTY;
}

function scatter(grid, rng, cols, rows, kind, count, avoid) {
  let placed = 0, tries = 0;
  while (placed < count && tries < count * 30) {
    tries++;
    const x = 2 + Math.floor(rng() * (cols - 4));
    const y = 1 + Math.floor(rng() * (rows - 2));
    if (grid[y][x] !== T.EMPTY) continue;
    if (avoid.some(([ax, ay]) => Math.abs(ax - x) < 3 && Math.abs(ay - y) < 2)) continue;
    grid[y][x] = kind;
    placed++;
  }
}

export function buildStage(stageIndex, seed) {
  const rng = makeRng(seed * 7919 + stageIndex * 104729 + 17);
  const cols = CONFIG.worldCols;
  const rows = 15;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(T.WALL));
  const open = stageIndex; // stages open up as they get harder

  // Carve a winding main corridor plus side rooms.
  const start = [2, Math.floor(rows / 2)];
  const goal = [cols - 3, Math.floor(rows / 2)];
  carvePath(grid, rng, cols, rows, start, goal);
  for (let i = 0; i < 14 + open * 4; i++) {
    const x = 2 + Math.floor(rng() * (cols - 5));
    const y = 1 + Math.floor(rng() * (rows - 2));
    const w = 2 + Math.floor(rng() * 4), h = 2 + Math.floor(rng() * 3);
    for (let yy = y; yy < Math.min(rows - 1, y + h); yy++)
      for (let xx = x; xx < Math.min(cols - 2, x + w); xx++) grid[yy][xx] = T.EMPTY;
  }
  grid[start[1]][start[0]] = T.EMPTY;
  grid[goal[1]][goal[0]] = T.GOAL;

  // Density of obstacles grows with the stage.
  const wallCount = 40 + open * 22;
  scatter(grid, rng, cols, rows, T.WALL, wallCount, [start, goal]);
  // Re-carve the main corridor so scattered walls can never seal the route.
  carvePath(grid, rng, cols, rows, start, goal);
  grid[goal[1]][goal[0]] = T.GOAL;
  scatter(grid, rng, cols, rows, T.HAY, 10 + open * 2, [start, goal]);
  const ovenCount = Math.max(0, open - 1) * 2; // ovens appear from stage 3
  scatter(grid, rng, cols, rows, T.OVEN, ovenCount, [start, goal]);

  // Corn along the path, more in later stages (risk/reward).
  const corn = [];
  scatter(grid, rng, cols, rows, 'corn-mark', 0, []);
  let cornPlaced = 0, tries = 0;
  const cornTarget = 14 + open * 4;
  while (cornPlaced < cornTarget && tries < cornTarget * 40) {
    tries++;
    const x = 2 + Math.floor(rng() * (cols - 4));
    const y = 1 + Math.floor(rng() * (rows - 2));
    if (grid[y][x] !== T.EMPTY) continue;
    if (corn.some((c) => Math.abs(c.x - x) < 2 && Math.abs(c.y - y) < 2)) continue;
    if (Math.abs(x - start[0]) < 3 && Math.abs(y - start[1]) < 2) continue;
    corn.push({ x, y, taken: false });
    cornPlaced++;
  }

  // Farmers: one on stage 1, up to three by stage 5.
  const farmers = [];
  const farmerCount = Math.min(3, 1 + Math.floor(open / 2));
  for (let i = 0; i < farmerCount; i++) {
    let fx, fy, t2 = 0;
    do {
      fx = Math.floor(cols * (0.35 + 0.55 * rng()));
      fy = 1 + Math.floor(rng() * (rows - 2));
      t2++;
    } while (grid[fy][fx] !== T.EMPTY && t2 < 200);
    farmers.push({ x: fx, y: fy, state: 'patrol', target: null, stateTime: 0,
      patrolDir: rng() < 0.5 ? 1 : -1, alert: 0, lastSeen: null });
  }

  // Knives patrol the corridor from stage 2.
  const knives = [];
  const knifeCount = Math.max(0, open - 1);
  for (let i = 0; i < knifeCount; i++) {
    let kx, ky, t3 = 0;
    do {
      kx = Math.floor(cols * (0.3 + 0.6 * rng()));
      ky = 1 + Math.floor(rng() * (rows - 2));
      t3++;
    } while (grid[ky][kx] !== T.EMPTY && t3 < 200);
    knives.push({ x: kx, y: ky, dirX: rng() < 0.5 ? 1 : -1, dirY: 0, spin: 0 });
  }

  return { grid, cols, rows, T, start, goal, corn, farmers, knives, stageIndex, seed };
}
