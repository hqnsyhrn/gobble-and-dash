// Gobble & Dash — rendering: rich autumn-palette canvas art with textured tiles, detailed
// characters, shadows, particles, combo popups, minimap and HUD. Camera follows the turkey.
import { CONFIG } from './config.js';

const PAL = {
  sky: '#2b1d16', ground: '#c88a4b', groundDark: '#b57a3e', wall: '#8a4b2a',
  fence: '#6b3a1f', hay: '#d9b44a', hayDark: '#b8932f', oven: '#4a3a35',
  corn: '#f2c94c', goal: '#7dc95e',
  turkeyBody: '#8c5a2b', turkeyBodyDark: '#6e4520', turkeyWattle: '#d64545',
  turkeyTail1: '#7a4a22', turkeyTail2: '#a5652f', turkeyTail3: '#c98a3f',
  farmerHat: '#e8dcc0', farmerBody: '#3e5c76', farmerSkin: '#e8b48a',
  kitchenFloor: '#d8d2c8', alert: '#ff5544', stamina: '#7ec96a',
};

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function shadow(g, px, py, w = 18, h = 6) {
  g.fillStyle = 'rgba(30,15,5,0.25)';
  g.beginPath(); g.ellipse(px, py + h + 6, w, h, 0, 0, Math.PI * 2); g.fill();
}

// Pixel-detail turkey: layered tail fan, shaded body, wing flap, bobbing head.
function drawTurkey(g, px, py, t, scale = 1, wingPhase = 0) {
  shadow(g, px, py, 12 * scale, 4 * scale);
  g.save();
  g.translate(px, py);
  const bob = Math.sin(t.bob) * 2 * scale;
  const squash = 1 + t.squash * 0.08;
  g.scale(scale, scale * squash);
  // Tail fan with banded feathers
  const tailColors = [PAL.turkeyTail1, PAL.turkeyTail2, PAL.turkeyTail3];
  for (let i = -4; i <= 4; i++) {
    g.save(); g.rotate(i * 0.28 + Math.sin(t.facing || 0) * 0.2);
    g.fillStyle = tailColors[Math.abs(i) % 3];
    rr(g, -3, -26, 6, 18, 3); g.fill();
    g.fillStyle = 'rgba(255,220,150,0.55)';
    rr(g, -2, -26, 4, 5, 2); g.fill();
    g.restore();
  }
  // Body with shading
  const grad = g.createRadialGradient(-4, bob - 4, 3, 0, bob, 16);
  grad.addColorStop(0, '#a5703a'); grad.addColorStop(1, PAL.turkeyBodyDark);
  g.fillStyle = grad;
  g.beginPath(); g.ellipse(0, bob, 12, 14, 0, 0, Math.PI * 2); g.fill();
  // Wing flaps while sprinting
  const flap = Math.sin(wingPhase || t.bob * 1.5) * 0.6;
  g.save(); g.translate(-6, bob - 2); g.rotate(-0.4 + flap);
  g.fillStyle = PAL.turkeyBodyDark;
  g.beginPath(); g.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,230,180,0.25)';
  g.beginPath(); g.ellipse(0, -3, 5, 6, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  // Head + beak + wattle + eye with highlight
  g.fillStyle = PAL.turkeyBody;
  g.beginPath(); g.arc(7, -10 + bob, 6.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f2a83a';
  g.beginPath(); g.moveTo(12, -10 + bob); g.lineTo(18, -8 + bob); g.lineTo(12, -6 + bob); g.closePath(); g.fill();
  g.fillStyle = PAL.turkeyWattle;
  g.beginPath(); g.ellipse(10, -4 + bob, 2.6, 4, 0.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1a1a1a';
  g.beginPath(); g.arc(9, -12 + bob, 1.8, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(9.6, -12.6 + bob, 0.6, 0, Math.PI * 2); g.fill();
  // Legs stride
  g.strokeStyle = '#e8a23a'; g.lineWidth = 2.4;
  const step = Math.sin(t.bob) * 4;
  g.beginPath();
  g.moveTo(-3, 12 + bob); g.lineTo(-3 + step, 19);
  g.moveTo(3, 12 + bob); g.lineTo(3 - step, 19);
  g.stroke();
  // Feet
  g.beginPath();
  g.moveTo(-3 + step - 2, 19); g.lineTo(-3 + step + 2, 19);
  g.moveTo(3 - step - 2, 19); g.lineTo(3 - step + 2, 19);
  g.stroke();
  g.restore();
}

// Farmer: overalls, straw hat with band, boots, swinging pitchfork, alert exclamation.
function drawFarmer(g, px, py, f, scale = 1, time = 0) {
  shadow(g, px, py, 12 * scale, 4 * scale);
  g.save(); g.translate(px, py); g.scale(scale, scale);
  const fx = Math.cos(f.facing ?? 0), fy = Math.sin(f.facing ?? 0);
  const walk = Math.sin(time * 8 + f.x) * 1.5;
  // Boots
  g.fillStyle = '#3a2a1a';
  rr(g, -7 + walk * 0.4, 12, 6, 6, 2); g.fill();
  rr(g, 1 - walk * 0.4, 12, 6, 6, 2); g.fill();
  // Overalls with straps
  g.fillStyle = PAL.farmerBody;
  rr(g, -9, -6, 18, 20, 4); g.fill();
  g.fillStyle = '#2d4658';
  g.fillRect(-9, 0, 18, 3);
  g.fillRect(-6, -6, 3, 7); g.fillRect(3, -6, 3, 7);
  // Arms swing
  g.strokeStyle = PAL.farmerSkin; g.lineWidth = 3.4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-8, -2); g.lineTo(-9 - walk, 6); g.stroke();
  g.beginPath(); g.moveTo(8, -2); g.lineTo(9 + walk, 6); g.stroke();
  // Head + beard
  g.fillStyle = PAL.farmerSkin;
  g.beginPath(); g.arc(0, -11, 6.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c8c0b0';
  g.beginPath(); g.arc(0, -7.5, 4.4, 0, Math.PI); g.fill();
  // Straw hat
  g.fillStyle = PAL.farmerHat;
  g.beginPath(); g.ellipse(0, -14.5, 11, 3.8, 0, 0, Math.PI * 2); g.fill();
  rr(g, -5.5, -21, 11, 7, 3); g.fill();
  g.fillStyle = '#a8802a';
  g.fillRect(-5.5, -16.5, 11, 2.5);
  // Eyes
  g.fillStyle = '#1a1a1a';
  g.beginPath(); g.arc(fx * 2 - 2.2, -11 + fy * 2, 1.3, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(fx * 2 + 2.2, -11 + fy * 2, 1.3, 0, Math.PI * 2); g.fill();
  // Pitchfork when chasing
  if (f.state === 'chase') {
    g.save(); g.translate(fx * 9, fy * 9 + 4); g.rotate(Math.atan2(fy, fx));
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(14, 0); g.stroke();
    g.strokeStyle = '#b8bcc4'; g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(14, -5); g.lineTo(14, 5);
    g.moveTo(14, -5); g.lineTo(20, -5);
    g.moveTo(14, 0); g.lineTo(21, 0);
    g.moveTo(14, 5); g.lineTo(20, 5);
    g.stroke();
    g.restore();
    // Alert bubble
    g.fillStyle = PAL.alert;
    g.font = 'bold 15px sans-serif'; g.textAlign = 'center';
    g.fillText('!', 0, -26 + Math.sin(time * 10) * 2);
  } else if (f.state === 'search') {
    g.fillStyle = '#ffb84a';
    g.font = 'bold 14px sans-serif'; g.textAlign = 'center';
    g.fillText('?', 0, -26 + Math.sin(time * 6) * 2);
  }
  g.restore();
}

// Carving knife: steel blade with gleam, riveted handle.
function drawKnife(g, px, py, k) {
  shadow(g, px, py, 8, 3);
  g.save(); g.translate(px, py); g.rotate(k.spin);
  // Gleam
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.beginPath(); g.moveTo(2, -16); g.lineTo(4, -12); g.lineTo(0, -10); g.closePath(); g.fill();
  g.fillStyle = '#c8ccd4';
  g.beginPath(); g.moveTo(0, -16); g.lineTo(6, 4); g.lineTo(-6, 4); g.closePath(); g.fill();
  g.fillStyle = '#98a0ac';
  g.beginPath(); g.moveTo(0, -16); g.lineTo(2, 4); g.lineTo(-6, 4); g.closePath(); g.fill();
  g.fillStyle = '#4a3a30';
  rr(g, -3, 4, 6, 11, 2); g.fill();
  g.fillStyle = '#2a2018';
  g.beginPath(); g.arc(0, 7, 1.1, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(0, 11, 1.1, 0, Math.PI * 2); g.fill();
  g.restore();
}

// Oven flame with three layered tongues and glow.
function drawFlame(g, px, py, time) {
  // Glow on the floor
  const glow = g.createRadialGradient(px, py, 4, px, py, 42);
  glow.addColorStop(0, 'rgba(255,150,60,0.35)'); glow.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = glow;
  g.beginPath(); g.arc(px, py, 42, 0, Math.PI * 2); g.fill();
  g.save(); g.translate(px, py);
  for (let i = 0; i < 3; i++) {
    const h = 16 + Math.sin(time * 12 + i * 2) * 6;
    g.fillStyle = i === 0 ? 'rgba(255,120,40,0.9)' : i === 1 ? 'rgba(255,190,80,0.85)' : 'rgba(255,240,180,0.9)';
    g.beginPath();
    g.moveTo(-8 + i * 3, 6);
    g.quadraticCurveTo(-4 + i * 3, -h * 0.6, i * 4 - 4, -h);
    g.quadraticCurveTo(4 + i * 3, -h * 0.6, 8 + i * 3, 6);
    g.fill();
  }
  g.restore();
}

function drawCornCob(g, px, py, time, i) {
  const wob = Math.sin(time * 3 + i) * 2;
  shadow(g, px, py + 4, 6, 2);
  g.save(); g.translate(px, py + wob); g.rotate(0.3);
  g.fillStyle = PAL.corn;
  rr(g, -5, -9, 10, 18, 5); g.fill();
  g.fillStyle = '#e0b030';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++)
    g.fillRect(-4 + c * 4, -7 + r * 5, 3, 3);
  g.fillStyle = '#7aa53a';
  g.beginPath(); g.ellipse(-4, -10, 3, 6, -0.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(4, -10, 3, 6, 0.5, 0, Math.PI * 2); g.fill();
  g.restore();
}

function drawHayBale(g, px, py, tile) {
  g.fillStyle = PAL.hay;
  rr(g, px + 4, py + 6, tile - 8, tile - 12, 9); g.fill();
  // Straw lines
  g.strokeStyle = PAL.hayDark; g.lineWidth = 1.6;
  for (let i = 1; i <= 2; i++) {
    g.beginPath();
    g.moveTo(px + 7, py + 6 + (tile - 12) * i / 3);
    g.lineTo(px + tile - 7, py + 6 + (tile - 12) * i / 3);
    g.stroke();
  }
  // Cross-tie
  g.strokeStyle = '#a8842a'; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(px + tile / 2 - 1, py + 8); g.lineTo(px + tile / 2 - 1, py + tile - 8); g.stroke();
  // Top highlight
  g.fillStyle = 'rgba(255,235,170,0.35)';
  rr(g, px + 7, py + 8, tile - 14, 5, 3); g.fill();
}

function drawOven(g, px, py, tile, firing) {
  g.fillStyle = PAL.oven;
  rr(g, px + 3, py + 3, tile - 6, tile - 6, 5); g.fill();
  g.fillStyle = '#2a2018';
  rr(g, px + 6, py + 6, tile - 12, tile - 12, 4); g.fill();
  g.fillStyle = '#111';
  g.fillRect(px + 9, py + 10, tile - 18, tile - 20);
  // Dials
  g.fillStyle = '#8a8078';
  g.beginPath(); g.arc(px + tile - 10, py + 8, 2.2, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(px + tile - 16, py + 8, 2.2, 0, Math.PI * 2); g.fill();
  if (firing) {
    g.fillStyle = '#ff6a2a';
    g.fillRect(px + 9, py + 10, tile - 18, tile - 20);
  }
}

function drawGoalDoor(g, px, py, tile, time) {
  g.fillStyle = '#5a8a3a';
  g.fillRect(px, py, tile, tile);
  // Door frame
  g.fillStyle = '#3a6a24';
  g.fillRect(px, py, tile, 4); g.fillRect(px, py, 4, tile); g.fillRect(px + tile - 4, py, 4, tile);
  // Door with window and glow
  g.fillStyle = PAL.goal;
  rr(g, px + 6, py + 6, tile - 12, tile - 10, 4); g.fill();
  const pulse = 0.4 + Math.sin(time * 3) * 0.2;
  g.fillStyle = `rgba(255,240,170,${pulse})`;
  rr(g, px + 12, py + 10, tile - 24, 8, 3); g.fill();
  g.fillStyle = '#2a5a1a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center';
  g.fillText('EXIT', px + tile / 2, py + tile / 2 + 10);
}

// Minimap: whole stage in the corner.
function drawMinimap(g, canvas, world) {
  const mw = 130, mh = Math.round(mw * world.rows / world.cols);
  const mx = canvas.width - mw - 14, my = 64;
  g.save();
  g.globalAlpha = 0.85;
  g.fillStyle = 'rgba(25,15,10,0.75)';
  rr(g, mx - 4, my - 4, mw + 8, mh + 8, 6); g.fill();
  const sx = mw / world.cols, sy = mh / world.rows;
  for (let y = 0; y < world.rows; y++) {
    for (let x = 0; x < world.cols; x++) {
      const c = world.grid[y][x];
      if (c === 1) g.fillStyle = '#6a4530';
      else if (c === 2) g.fillStyle = '#c8a840';
      else if (c === 3) g.fillStyle = '#554540';
      else if (c === 4) g.fillStyle = PAL.goal;
      else continue;
      g.fillRect(mx + x * sx, my + y * sy, Math.ceil(sx), Math.ceil(sy));
    }
  }
  // Dots: corn gold, farmers red, turkey white
  g.fillStyle = PAL.corn;
  for (const c of world.corn) if (!c.taken) g.fillRect(mx + c.x * sx - 1, my + c.y * sy - 1, 3, 3);
  g.fillStyle = PAL.alert;
  for (const f of world.farmers) g.fillRect(mx + f.x * sx - 1.5, my + f.y * sy - 1.5, 4, 4);
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(mx + world.turkey.x * sx, my + world.turkey.y * sy, 3, 0, Math.PI * 2); g.fill();
  g.restore();
}

export function render(g, canvas, world, ui, time, particles = null) {
  const W = canvas.width, H = canvas.height, T = world.T ?? { WALL:1, HAY:2, OVEN:3, GOAL:4 };
  const tile = CONFIG.tile;
  const t = world.turkey;
  const kitchen = world.stageIndex >= 4;
  const camX = Math.max(W / 2, Math.min(world.cols * tile - W / 2, t.x * tile));
  const camY = Math.max(H / 2, Math.min(world.rows * tile - H / 2, t.y * tile));
  const ox = W / 2 - camX, oy = H / 2 - camY;

  g.fillStyle = kitchen ? PAL.kitchenFloor : PAL.sky;
  g.fillRect(0, 0, W, H);

  const x0 = Math.max(0, Math.floor((camX - W / 2) / tile) - 1);
  const x1 = Math.min(world.cols, Math.ceil((camX + W / 2) / tile) + 1);
  const y0 = Math.max(0, Math.floor((camY - H / 2) / tile) - 1);
  const y1 = Math.min(world.rows, Math.ceil((camY + H / 2) / tile) + 1);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const cell = world.grid[y][x];
      const px = ox + x * tile, py = oy + y * tile;
      if (cell === T.WALL) {
        g.fillStyle = kitchen ? '#9a9088' : PAL.wall;
        g.fillRect(px, py, tile, tile);
        // Textured wall: brick lines and top edge light
        g.strokeStyle = kitchen ? 'rgba(70,60,55,0.5)' : 'rgba(60,30,12,0.5)';
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(px, py + tile / 2); g.lineTo(px + tile, py + tile / 2);
        g.moveTo(px + tile / 2, py); g.lineTo(px + tile / 2, py + tile / 2);
        g.moveTo(px + tile / 4, py + tile / 2); g.lineTo(px + tile / 4, py + tile);
        g.moveTo(px + 3 * tile / 4, py + tile / 2); g.lineTo(px + 3 * tile / 4, py + tile);
        g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(px, py + tile - 5, tile, 5);
        g.fillStyle = 'rgba(255,220,170,0.12)';
        g.fillRect(px, py, tile, 3);
      } else {
        g.fillStyle = kitchen ? (x % 2 === y % 2 ? '#dcd6cc' : '#d2ccc2') : ((x + y) % 2 ? PAL.ground : PAL.groundDark);
        g.fillRect(px, py, tile, tile);
        // Grass tufts on open farm ground
        if (!kitchen && cell === T.EMPTY && (x * 13 + y * 7) % 11 === 0) {
          g.strokeStyle = 'rgba(120,150,60,0.5)'; g.lineWidth = 1.5;
          g.beginPath();
          g.moveTo(px + 10, py + 30); g.lineTo(px + 12, py + 24);
          g.moveTo(px + 14, py + 31); g.lineTo(px + 15, py + 25);
          g.stroke();
        }
        if (cell === T.HAY) drawHayBale(g, px, py, tile);
        else if (cell === T.OVEN) drawOven(g, px, py, tile, world.ovensFiring.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y));
        else if (cell === T.GOAL) drawGoalDoor(g, px, py, tile, time);
      }
    }
  }

  // Corn pickups
  for (let i = 0; i < world.corn.length; i++) {
    const c = world.corn[i];
    if (c.taken) continue;
    drawCornCob(g, ox + c.x * tile + tile / 2, oy + c.y * tile + tile / 2, time, i);
  }

  // Ovens firing flames
  for (const o of world.ovensFiring) drawFlame(g, ox + o.x * tile, oy + o.y * tile + tile / 2 - 6, time);

  // Knives
  for (const k of world.knives) drawKnife(g, ox + k.x * tile, oy + k.y * tile, k);

  // Farmers with vision cones
  for (const f of world.farmers) {
    const px = ox + f.x * tile, py = oy + f.y * tile;
    const range = CONFIG.farmer.sightRange * tile;
    const half = (CONFIG.farmer.fovDeg * Math.PI / 180) / 2;
    const grad = g.createRadialGradient(px, py, 10, px, py, range);
    const coneColor = f.state === 'chase' ? 'rgba(255,85,68,0.28)' : f.state === 'search' ? 'rgba(255,200,60,0.2)' : 'rgba(255,255,255,0.13)';
    grad.addColorStop(0, coneColor); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.beginPath(); g.moveTo(px, py);
    g.arc(px, py, range, (f.facing ?? 0) - half, (f.facing ?? 0) + half);
    g.closePath(); g.fill();
    drawFarmer(g, px, py, f, 1, time);
  }

  // Turkey (hidden = faded into the hay)
  const tpx = ox + t.x * tile, tpy = oy + t.y * tile;
  if (t.hidden) {
    g.globalAlpha = 0.45;
    drawTurkey(g, tpx, tpy, t, 0.8);
    g.globalAlpha = 1;
  } else {
    drawTurkey(g, tpx, tpy, t, 1, t.bob * 2);
  }

  // Particles above everything
  if (particles) particles.draw(g);

  // Danger vignette when chased
  const chased = world.farmers.some((f) => f.state === 'chase');
  if (chased) {
    const vg = g.createRadialGradient(W / 2, H / 2, H / 3, W / 2, H / 2, W / 1.4);
    vg.addColorStop(0, 'rgba(255,60,40,0)'); vg.addColorStop(1, 'rgba(255,60,40,0.22)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
  }

  drawHud(g, canvas, world, ui);
  drawMinimap(g, canvas, world);
}

function drawHud(g, canvas, world, ui) {
  const W = canvas.width;
  g.save();
  g.fillStyle = 'rgba(30,20,12,0.75)';
  rr(g, 10, 10, W - 20, 44, 10); g.fill();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillStyle = '#f2e8d8'; g.font = 'bold 16px sans-serif';
  g.fillText(`SCORE ${ui.score}`, 24, 32);
  g.fillText(`STAGE ${world.stageIndex + 1}/5 · ${CONFIG.stageNames[world.stageIndex]}`, 160, 32);
  // Combo counter
  if ((world.combo ?? 0) >= 2) {
    g.fillStyle = '#ffb84a'; g.font = 'bold 15px sans-serif';
    g.fillText(`COMBO x${world.combo}`, 380, 32);
  }
  // Lives as little turkeys
  for (let i = 0; i < ui.lives; i++) {
    g.fillStyle = PAL.turkeyBody;
    g.beginPath(); g.arc(W - 150 + i * 22, 32, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f2a83a';
    g.beginPath(); g.moveTo(W - 150 + i * 22 + 5, 30); g.lineTo(W - 150 + i * 22 + 9, 32); g.lineTo(W - 150 + i * 22 + 5, 34); g.fill();
  }
  // Stamina bar with gradient
  const tw = 110, tx = W - 70 - tw;
  g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(tx, 24, tw, 10);
  const sg = g.createLinearGradient(tx, 0, tx + tw, 0);
  sg.addColorStop(0, '#5aa84a'); sg.addColorStop(1, PAL.stamina);
  g.fillStyle = sg; g.fillRect(tx, 24, tw * (world.turkey.stamina / CONFIG.turkey.staminaMax), 10);
  g.fillStyle = '#f2e8d8'; g.font = '11px sans-serif';
  g.fillText('SPRINT', tx, 40);
  if (world.turkey.hidden) {
    g.fillStyle = '#ffe066'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center';
    g.fillText('HIDDEN — press E to leave the hay', W / 2, canvas.height - 24);
  }
  g.restore();
}

// Title / end overlays
export function drawTitle(g, canvas, time) {
  const W = canvas.width, H = canvas.height;
  // Sunset gradient backdrop with silhouetted barn
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#3a2416'); sky.addColorStop(0.6, '#8a4a22'); sky.addColorStop(1, '#d88a3a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // Sun
  g.fillStyle = 'rgba(255,210,120,0.9)';
  g.beginPath(); g.arc(W / 2, H * 0.62, 60, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,230,160,0.25)';
  g.beginPath(); g.arc(W / 2, H * 0.62, 90, 0, Math.PI * 2); g.fill();
  // Barn silhouette
  g.fillStyle = '#2a1810';
  g.fillRect(W * 0.62, H * 0.52, 180, 110);
  g.beginPath();
  g.moveTo(W * 0.62 - 14, H * 0.52); g.lineTo(W * 0.62 + 90, H * 0.44); g.lineTo(W * 0.62 + 194, H * 0.52);
  g.closePath(); g.fill();
  g.fillStyle = '#d88a3a';
  g.fillRect(W * 0.62 + 75, H * 0.58, 30, 42);
  // Fence silhouettes
  g.fillStyle = '#241410';
  for (let i = 0; i < 8; i++) g.fillRect(W * 0.05 + i * 34, H * 0.72, 8, 46);
  g.fillRect(W * 0.05, H * 0.76, 8 * 34, 6);
  g.fillStyle = 'rgba(20,10,5,0.55)';
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ffd98a';
  g.font = `bold ${Math.min(64, W / 10)}px Georgia, serif`;
  g.fillText('GOBBLE & DASH', W / 2, H / 2 - 100 + Math.sin(time * 2) * 4);
  g.fillStyle = '#fff2dc'; g.font = '18px sans-serif';
  g.fillText('The farmer wants you for Thanksgiving. Gobble, dash and escape to the kitchen door!', W / 2, H / 2 - 38);
  g.font = '16px sans-serif'; g.fillStyle = '#e8d4b0';
  g.fillText('WASD / arrows — run     SHIFT — sprint     E — hide in hay     P — pause     R — restart', W / 2, H / 2 + 0);
  g.fillStyle = '#ffe066'; g.font = 'bold 22px sans-serif';
  g.fillText('Press ENTER to start', W / 2, H / 2 + 62 + Math.sin(time * 4) * 3);
  drawTurkey(g, W / 2, H / 2 + 128, { bob: time * 8, squash: 0, facing: 0 }, 2.2);
}

export function drawEnd(g, canvas, won, ui, time) {
  const W = canvas.width, H = canvas.height;
  g.fillStyle = won ? 'rgba(30,60,25,0.85)' : 'rgba(70,20,15,0.85)';
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = won ? '#a8e88a' : '#ff9a7a';
  g.font = `bold ${Math.min(56, W / 11)}px Georgia, serif`;
  g.fillText(won ? 'ESCAPED!' : 'CAUGHT!', W / 2, H / 2 - 80);
  g.fillStyle = '#f2e8d8'; g.font = '20px sans-serif';
  g.fillText(won ? 'You outran Thanksgiving. The forest feast is yours.' : 'The farmer got you. Nearly dinner…', W / 2, H / 2 - 30);
  g.font = 'bold 26px sans-serif'; g.fillStyle = '#ffe066';
  g.fillText(`Final score: ${ui.score}`, W / 2, H / 2 + 10);
  g.font = '16px sans-serif'; g.fillStyle = '#c9b896';
  g.fillText('Press ENTER to run again', W / 2, H / 2 + 60 + Math.sin(time * 4) * 3);
}
