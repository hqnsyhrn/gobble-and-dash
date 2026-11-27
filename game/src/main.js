// Gobble & Dash — game loop and state machine: title → play (5 stages) → end, with
// pause, lives, score, invulnerability flash and a screenshot hook (?shot=start|play|end&seed=N)
// that renders a fixed frame for the entry's screenshots.
import { CONFIG } from './config.js';
import { Input } from './input.js';
import { buildStage } from './level.js';
import { createWorld, updateWorld } from './world.js';
import { render, drawTitle, drawEnd } from './render.js';
import { sfx } from './audio.js';
import { music } from './music.js';
import { Particles } from './particles.js';
import { makeRng } from './random.js';

const canvas = document.getElementById('game');
const g = canvas.getContext('2d');
const input = new Input();
const particles = new Particles();

const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');        // start | play | end | hit
const seed = Number(params.get('seed') ?? Math.floor(Math.random() * 1e9));

let state = 'title';           // title | play | end
let time = 0;
let world = null;
let ui = { score: 0, lives: CONFIG.lives };
let invuln = 0;                // seconds of invulnerability after a hit
let endWon = false;
let paused = false;
const rng = makeRng(seed);

function startStage(i) {
  const stage = buildStage(i, seed);
  world = createWorld(stage, seed);
  invuln = 1.0;
}

function startGame() {
  state = 'play';
  ui = { score: 0, lives: CONFIG.lives };
  startStage(0);
  sfx.click();
  music.start();
}

function hit(cause) {
  if (invuln > 0) return;
  ui.lives -= 1;
  ui.score = Math.max(0, ui.score - 50);
  invuln = 1.6;
  sfx.hurt();
  if (cause === 'knife') sfx.knife();
  particles.feather(world.turkey.x * CONFIG.tile, world.turkey.y * CONFIG.tile, 12);
  if (ui.lives <= 0) {
    state = 'end'; endWon = false; music.stop();
  } else {
    // Knock the turkey back to the stage start.
    world.turkey.x = world.start[0] + 0.5;
    world.turkey.y = world.start[1] + 0.5;
    world.turkey.hidden = false;
  }
}

function update(dt) {
  time += dt;
  if (state === 'title') {
    if (input.confirmPressed() || input.mouse.clicked) startGame();
    return;
  }
  if (state === 'end') {
    if (input.confirmPressed() || input.restartPressed()) { startGame(); }
    return;
  }
  if (input.pausePressed()) paused = !paused;
  if (input.restartPressed()) startGame();
  if (paused) return;

  const events = [];
  const { hit: wasHit } = updateWorld(world, input, dt, events);
  for (const e of events) {
    if (e === 'spotted') sfx.spotted();
    else if (e === 'hide' || e === 'unhide') sfx.gobble();
    else if (e.type === 'corn') {
      ui.score += e.gain;
      sfx.corn();
      particles.spark((e.x + 0.5) * CONFIG.tile, (e.y + 0.5) * CONFIG.tile, 8, '#ffe066');
      particles.text(world.turkey.x * CONFIG.tile, world.turkey.y * CONFIG.tile - 30,
        e.combo >= 2 ? `+${e.gain} x${e.combo}` : `+${e.gain}`, e.combo >= 2 ? '#ffb84a' : '#ffe066');
    }
    else if (e.type === 'hit') hit(e.cause);
    else if (e.type === 'goal') {
      ui.score += CONFIG.goalScore;
      particles.spark(world.turkey.x * CONFIG.tile, world.turkey.y * CONFIG.tile, 20, '#a8e88a');
      if (world.stageIndex >= 4) { state = 'end'; endWon = true; sfx.goal(); music.stop(); }
      else { startStage(world.stageIndex + 1); sfx.goal(); }
    }
  }
  if (invuln > 0) invuln -= dt;
  // Survival score trickles up: the farther you run, the more you score.
  ui.score += Math.round(world.turkey.x * 0.02);
  // Running dust puffs behind the turkey.
  if (world.turkey.squash > 0.5 && Math.random() < 0.3)
    particles.dust(world.turkey.x * CONFIG.tile, world.turkey.y * CONFIG.tile + 16);
  particles.update(dt);
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - (frame.last ?? ts)) / 1000);
  frame.last = ts;
  if (shotMode) {
    // Deterministic screenshot frames for the entry's screenshots.
    renderShot();
    return;
  }
  update(dt);
  draw();
  input.endFrame();
  requestAnimationFrame(frame);
}

function draw() {
  render(g, canvas, world, ui, time, particles);
  if (state === 'title') drawTitle(g, canvas, time);
  if (state === 'end') drawEnd(g, canvas, endWon, ui, time);
  if (paused && state === 'play') {
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = '#ffe066'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center';
    g.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    g.fillStyle = '#f2e8d8'; g.font = '16px sans-serif';
    g.fillText('P to resume · R to restart', canvas.width / 2, canvas.height / 2 + 40);
  }
}

// One fixed, representative frame per ?shot= mode.
function renderShot() {
  if (shotMode === 'start') {
    const stage = buildStage(0, seed);
    world = createWorld(stage, seed);
    ui = { score: 0, lives: CONFIG.lives };
    state = 'title';
    drawTitle(g, canvas, 1.2);
  } else if (shotMode === 'play') {
    const stageIndex = Number(params.get('stage') ?? 2);
    const stage = buildStage(stageIndex, seed);
    world = createWorld(stage, seed);
    ui = { score: 1240, lives: 2 };
    // Place the turkey mid-run near a farmer chase for an action shot.
    world.turkey.x = stage.cols * 0.45; world.turkey.y = stage.rows / 2 + 0.5;
    world.turkey.bob = 5; world.turkey.squash = 1;
    const f = world.farmers[0];
    if (f) { f.x = world.turkey.x + 3; f.y = world.turkey.y; f.state = 'chase'; f.facing = Math.PI; }
    world.combo = 3; world.comboTimer = 3;
    particles.spark(world.turkey.x * CONFIG.tile + 30, world.turkey.y * CONFIG.tile - 20, 10, '#ffe066');
    particles.feather(world.turkey.x * CONFIG.tile - 20, world.turkey.y * CONFIG.tile - 10, 5);
    particles.text(world.turkey.x * CONFIG.tile, world.turkey.y * CONFIG.tile - 34, '+75 x3', '#ffb84a');
    time = 3;
    render(g, canvas, world, ui, time, particles);
  } else if (shotMode === 'hit') {
    const stage = buildStage(4, seed);
    world = createWorld(stage, seed);
    ui = { score: 980, lives: 1 };
    world.turkey.x = stage.cols * 0.5; world.turkey.y = stage.rows / 2;
    const kn = world.knives[0];
    if (kn) { kn.x = world.turkey.x + 1.2; kn.y = world.turkey.y; }
    particles.feather(world.turkey.x * CONFIG.tile, world.turkey.y * CONFIG.tile, 10);
    particles.spark(world.turkey.x * CONFIG.tile, world.turkey.y * CONFIG.tile, 12, '#ff8844');
    const ov = world.ovensFiring[0] ?? null;
    time = 2;
    render(g, canvas, world, ui, time, particles);
  } else if (shotMode === 'end') {
    const stage = buildStage(0, seed);
    world = createWorld(stage, seed);
    ui = { score: 1840, lives: 0 };
    endWon = params.get('won') === '1';
    state = 'end';
    drawEnd(g, canvas, endWon, ui, 1.0);
  }
}

// Boot.
if (shotMode) {
  // Screenshot mode: render once after fonts/layout settle.
  window.addEventListener('load', () => setTimeout(renderShot, 300));
  setTimeout(renderShot, 600); // in case load already fired
} else {
  requestAnimationFrame(frame);
}
