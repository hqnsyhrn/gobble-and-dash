// Gobble & Dash — world simulation: turkey movement with collision, farmer AI
// (patrol → spot → chase → search), carving-knife patrols, oven flames, corn, hiding.
import { CONFIG } from './config.js';

const T = { EMPTY: 0, WALL: 1, HAY: 2, OVEN: 3, GOAL: 4 };

function tileAt(world, x, y) {
  const gx = Math.floor(x), gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= world.cols || gy >= world.rows) return T.WALL;
  return world.grid[gy][gx];
}

function blocked(world, x, y) {
  const t = tileAt(world, x, y);
  return t === T.WALL;
}

// Slide along walls: try full move, then axis-separated.
function moveEntity(world, ent, dx, dy, dt, speed) {
  const nx = ent.x + dx * speed * dt;
  const ny = ent.y + dy * speed * dt;
  const r = ent.radius ?? 0.3;
  if (!blocked(world, nx + Math.sign(dx) * r, ent.y) || tileAt(world, ent.x, ent.y) !== T.WALL) ent.x = nx;
  if (!blocked(world, ent.x, ny + Math.sign(dy) * r)) ent.y = ny;
}

function lineOfSight(world, x0, y0, x1, y1) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocked(world, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

function updateFarmer(world, f, dt, turkey) {
  const cfg = CONFIG.farmer;
  const dist = Math.hypot(turkey.x - f.x, turkey.y - f.y);
  const turkeyHidden = turkey.hidden;
  if (f.facing === undefined) f.facing = 0;

  if (f.state === 'patrol') {
    f.stateTime -= dt;
    // Wander: walk until a wall, then turn around.
    const before = { x: f.x, y: f.y };
    const dir = f.patrolAngle ?? 0;
    moveEntity(world, f, Math.cos(dir), Math.sin(dir), dt, cfg.walkSpeed);
    if (Math.hypot(f.x - before.x, f.y - before.y) < cfg.walkSpeed * dt * 0.3 || f.stateTime <= 0) {
      f.patrolAngle = (f.patrolAngle ?? 0) + (Math.random() - 0.5) * 2.4;
      f.stateTime = 1 + Math.random() * 1.5;
    }
    f.facing = f.patrolAngle ?? 0;
    // Spot the turkey.
    if (!turkeyHidden && dist < cfg.sightRange) {
      const ang = Math.atan2(turkey.y - f.y, turkey.x - f.x);
      if (angleDiff(ang, f.facing) < (cfg.fovDeg * Math.PI / 180) / 2 &&
          lineOfSight(world, f.x, f.y, turkey.x, turkey.y)) {
        f.state = 'chase'; f.alert = 1; world.onSpotted?.();
      }
    }
  } else if (f.state === 'chase') {
    const speed = dist < 2.5 ? cfg.cornerSpeed : cfg.runSpeed;
    const dx = (turkey.x - f.x) / (dist || 1), dy = (turkey.y - f.y) / (dist || 1);
    moveEntity(world, f, dx, dy, dt, speed);
    f.facing = Math.atan2(dy, dx);
    f.lastSeen = { x: turkey.x, y: turkey.y };
    if (turkeyHidden || dist > cfg.sightRange * 1.4 ||
        (dist > 5 && !lineOfSight(world, f.x, f.y, turkey.x, turkey.y))) {
      f.stateTime = cfg.searchTime; f.state = 'search';
    }
  } else if (f.state === 'search') {
    f.stateTime -= dt;
    if (f.lastSeen) {
      const dx = f.lastSeen.x - f.x, dy = f.lastSeen.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.4) moveEntity(world, f, dx / d, dy / d, dt, cfg.walkSpeed);
      f.facing = Math.atan2(dy, dx);
      // Peek around near the last spot.
      f.facing += Math.sin(f.stateTime * 4) * 0.8;
    }
    if (!turkeyHidden && dist < cfg.sightRange && lineOfSight(world, f.x, f.y, turkey.x, turkey.y)) {
      f.state = 'chase'; world.onSpotted?.();
    }
    if (f.stateTime <= 0) { f.state = 'patrol'; f.alert = Math.max(0, f.alert - dt); f.stateTime = 1; }
  }
  f.alert = Math.max(f.alert - dt * 0.2, f.state === 'chase' ? 1 : f.alert);
}

function updateKnife(world, k, dt) {
  k.spin += dt * 9;
  const before = { x: k.x, y: k.y };
  moveEntity(world, k, k.dirX, k.dirY, dt, CONFIG.danger.knifeSpeed);
  if (Math.hypot(k.x - before.x, k.y - before.y) < CONFIG.danger.knifeSpeed * dt * 0.3) {
    // Hit a wall: pick a new open direction.
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy]) =>
      !blocked(world, k.x + dx * 0.6, k.y + dy * 0.6));
    if (dirs.length) {
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      k.dirX = d[0]; k.dirY = d[1];
    }
  }
}

export function createWorld(stage, seed) {
  return {
    ...stage,
    turkey: {
      x: stage.start[0] + 0.5, y: stage.start[1] + 0.5,
      radius: CONFIG.turkey.radius, hidden: false, hiding: false,
      stamina: CONFIG.turkey.staminaMax, facing: 0, bob: 0, squash: 0,
    },
    seed, stage,
    time: 0, ovensFiring: [],
  };
}

export function updateWorld(world, input, dt, events) {
  const turkey = world.turkey;
  const cfg = CONFIG.turkey;
  world.time += dt;
  world.onSpotted = () => events.push('spotted');

  // Hiding in hay bales (press E near a hay tile).
  const here = tileAt(world, turkey.x, turkey.y);
  if (input.hidePressed() && here === T.HAY) {
    turkey.hidden = !turkey.hidden;
    events.push(turkey.hidden ? 'hide' : 'unhide');
  }
  turkey.hiding = turkey.hidden;

  // Movement + sprint.
  const ax = input.axis();
  let speed = ax.moving ? (input.sprinting() && turkey.stamina > 0 ? cfg.sprintSpeed : cfg.speed) : 0;
  if (turkey.hidden) speed = 0;
  if (input.sprinting() && speed > 0 && turkey.stamina > 0) {
    turkey.stamina = Math.max(0, turkey.stamina - dt);
    if (turkey.stamina === 0) events.push('winded');
  } else {
    turkey.stamina = Math.min(cfg.staminaMax, turkey.stamina + cfg.staminaRegen * dt);
  }
  if (speed > 0) {
    turkey.facing = Math.atan2(ax.y, ax.x);
    moveEntity(world, turkey, ax.x, ax.y, dt, speed);
    turkey.bob += dt * (speed > cfg.speed ? 14 : 9);
    turkey.squash = 1;
  } else turkey.squash = Math.max(0, turkey.squash - dt * 4);

  // Farmers.
  for (const f of world.farmers) updateFarmer(world, f, dt, turkey);

  // Knives.
  for (const k of world.knives) updateKnife(world, k, dt);

  // Ovens: fire on a cycle; the flame reaches ovenRange.
  world.ovensFiring = [];
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      if (world.grid[y][x] === T.OVEN) {
        const phase = (world.time / CONFIG.danger.ovenCooldown + (x * 7 + y * 13) % 10) % 1;
        if (phase < 0.45) world.ovensFiring.push({ x: x + 0.5, y: y + 0.5 });
      }
    }
  }

  // Corn pickup, with combo scoring.
  if (world.combo === undefined) world.combo = 0;
  if (world.comboTimer === undefined) world.comboTimer = 0;
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }
  for (const c of world.corn) {
    if (!c.taken && Math.hypot(c.x + 0.5 - turkey.x, c.y + 0.5 - turkey.y) < 0.6) {
      c.taken = true;
      world.combo += 1;
      world.comboTimer = CONFIG.corn.comboWindow;
      const gain = CONFIG.corn.score * Math.min(4, world.combo);
      events.push({ type: 'corn', gain, combo: world.combo, x: c.x, y: c.y });
      turkey.stamina = Math.min(cfg.staminaMax, turkey.stamina + CONFIG.corn.staminaBoost);
    }
  }

  // Hazards and the goal.
  let hit = null;
  for (const f of world.farmers) {
    if (!turkey.hidden && Math.hypot(f.x - turkey.x, f.y - turkey.y) < 0.7) hit = 'farmer';
  }
  for (const k of world.knives) {
    if (Math.hypot(k.x - turkey.x, k.y - turkey.y) < 0.55) hit = 'knife';
  }
  for (const o of world.ovensFiring) {
    if (Math.hypot(o.x - turkey.x, o.y - turkey.y) < CONFIG.danger.ovenRange) hit = 'oven';
  }
  if (hit) events.push({ type: 'hit', cause: hit });

  if (tileAt(world, turkey.x, turkey.y) === T.GOAL) events.push({ type: 'goal' });
  return { hit };
}
