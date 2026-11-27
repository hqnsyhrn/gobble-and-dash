// Gobble & Dash — rendering: autumn-palette canvas drawing of the farm, turkey, farmer,
// knives, ovens, hay, corn, HUD and screens. Camera follows the turkey.
import { CONFIG } from './config.js';

const PAL = {
  sky: '#2b1d16', ground: '#c88a4b', groundDark: '#b57a3e', wall: '#8a4b2a',
  fence: '#6b3a1f', hay: '#d9b44a', hayDark: '#c2a03a', oven: '#4a3a35',
  flame: '#ff8c3a', corn: '#f2c94c', goal: '#7dc95e',
  turkeyBody: '#8c5a2b', turkeyWattle: '#d64545', turkeyTail: '#5a3a1a',
  farmerHat: '#e8dcc0', farmerBody: '#3e5c76', farmerSkin: '#e8b48a',
  kitchenFloor: '#d8d2c8', night: 'rgba(20,10,5,0.35)',
  alert: '#ff5544', stamina: '#7ec96a',
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

function drawTurkey(g, px, py, t, scale = 1) {
  g.save();
  g.translate(px, py);
  const bob = Math.sin(t.bob) * 2 * scale;
  const squash = 1 + t.squash * 0.08;
  g.scale(scale, scale * squash);
  // Tail fan
  g.fillStyle = PAL.turkeyTail;
  for (let i = -3; i <= 3; i++) {
    g.save(); g.rotate(i * 0.32 + Math.sin(t.facing || 0));
    g.fillRect(-3, -22, 6, 14); g.restore();
  }
  // Body
  g.fillStyle = PAL.turkeyBody;
  g.beginPath(); g.ellipse(0, bob, 11, 13, 0, 0, Math.PI * 2); g.fill();
  // Head + beak + wattle
  g.fillStyle = PAL.turkeyBody;
  g.beginPath(); g.arc(6, -8 + bob, 6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f2a83a';
  g.beginPath(); g.moveTo(11, -8 + bob); g.lineTo(16, -6 + bob); g.lineTo(11, -4 + bob); g.fill();
  g.fillStyle = PAL.turkeyWattle;
  g.beginPath(); g.ellipse(9, -3 + bob, 2.4, 3.6, 0, 0, Math.PI * 2); g.fill();
  // Eye
  g.fillStyle = '#1a1a1a';
  g.beginPath(); g.arc(8, -10 + bob, 1.5, 0, Math.PI * 2); g.fill();
  // Legs
  g.strokeStyle = '#e8a23a'; g.lineWidth = 2;
  const step = Math.sin(t.bob) * 3;
  g.beginPath(); g.moveTo(-3, 12 + bob); g.lineTo(-3 + step, 18); g.moveTo(3, 12 + bob); g.lineTo(3 - step, 18); g.stroke();
  g.restore();
}

function drawFarmer(g, px, py, f, scale = 1) {
  g.save(); g.translate(px, py); g.scale(scale, scale);
  g.fillStyle = PAL.farmerBody;
  rr(g, -9, -6, 18, 20, 4); g.fill();
  g.fillStyle = PAL.farmerSkin;
  g.beginPath(); g.arc(0, -11, 6, 0, Math.PI * 2); g.fill();
  g.fillStyle = PAL.farmerHat;
  g.beginPath(); g.ellipse(0, -14, 10, 3.5, 0, 0, Math.PI * 2); g.fill();
  rr(g, -5, -20, 10, 6, 2); g.fill();
  // Eyes look toward facing
  const fx = Math.cos(f.facing ?? 0), fy = Math.sin(f.facing ?? 0);
  g.fillStyle = '#1a1a1a';
  g.beginPath(); g.arc(fx * 2 - 2, -11 + fy * 2, 1.2, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(fx * 2 + 2, -11 + fy * 2, 1.2, 0, Math.PI * 2); g.fill();
  // Pitchfork when chasing
  if (f.state === 'chase') {
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(fx * 10, fy * 10 + 4); g.lineTo(fx * 18, fy * 18 + 4); g.stroke();
    g.strokeStyle = PAL.alert;
    g.beginPath(); g.moveTo(fx * 18 - 3, fy * 18 + 1); g.lineTo(fx * 18, fy * 18 + 4); g.lineTo(fx * 18 + 3, fy * 18 + 1); g.stroke();
  }
  g.restore();
}

function drawKnife(g, px, py, k) {
  g.save(); g.translate(px, py); g.rotate(k.spin);
  g.fillStyle = '#c8ccd4';
  g.beginPath(); g.moveTo(0, -14); g.lineTo(5, 4); g.lineTo(-5, 4); g.closePath(); g.fill();
  g.fillStyle = '#4a3a30';
  g.fillRect(-2.5, 4, 5, 9);
  g.restore();
}

function drawFlame(g, px, py, time) {
  g.save(); g.translate(px, py);
  for (let i = 0; i < 3; i++) {
    const h = 14 + Math.sin(time * 12 + i * 2) * 5;
    g.fillStyle = i === 0 ? 'rgba(255,140,58,0.9)' : i === 1 ? 'rgba(255,190,80,0.8)' : 'rgba(255,240,180,0.8)';
    g.beginPath();
    g.moveTo(-8 + i * 3, 6);
    g.quadraticCurveTo(-4 + i * 3, -h * 0.6, 0 + i * 4 - 4, -h);
    g.quadraticCurveTo(4 + i * 3, -h * 0.6, 8 + i * 3, 6);
    g.fill();
  }
  g.restore();
}

export function render(g, canvas, world, ui, time) {
  const W = canvas.width, H = canvas.height, T = world.T ?? { WALL:1, HAY:2, OVEN:3, GOAL:4 };
  const tile = CONFIG.tile;
  const t = world.turkey;
  const kitchen = world.stageIndex >= 4;
  // Camera centers the turkey, clamped to the world.
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
        g.fillStyle = 'rgba(0,0,0,0.15)';
        g.fillRect(px, py + tile - 5, tile, 5);
        if (!kitchen && (x + y) % 3 === 0) { g.fillStyle = PAL.fence; g.fillRect(px + 8, py + 8, tile - 16, tile - 16); }
      } else {
        g.fillStyle = kitchen ? (x % 2 === y % 2 ? '#dcd6cc' : '#d2ccc2') : ((x + y) % 2 ? PAL.ground : PAL.groundDark);
        g.fillRect(px, py, tile, tile);
        if (cell === T.HAY) {
          g.fillStyle = PAL.hay; rr(g, px + 4, py + 6, tile - 8, tile - 12, 8); g.fill();
          g.strokeStyle = PAL.hayDark; g.lineWidth = 2;
          g.beginPath(); g.moveTo(px + 8, py + tile / 2); g.lineTo(px + tile - 8, py + tile / 2); g.stroke();
        } else if (cell === T.OVEN) {
          g.fillStyle = PAL.oven; rr(g, px + 3, py + 3, tile - 6, tile - 6, 4); g.fill();
          g.fillStyle = '#111'; g.fillRect(px + 8, py + 10, tile - 16, tile - 20);
        } else if (cell === T.GOAL) {
          g.fillStyle = PAL.goal;
          g.fillRect(px, py, tile, tile);
          g.fillStyle = '#2a5a1a'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
          g.fillText('EXIT', px + tile / 2, py + tile / 2 + 8);
        }
      }
    }
  }

  // Corn pickups
  for (const c of world.corn) {
    if (c.taken) continue;
    const px = ox + c.x * tile + tile / 2, py = oy + c.y * tile + tile / 2;
    g.fillStyle = PAL.corn;
    g.beginPath(); g.ellipse(px, py, 6, 10, 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c8992a'; g.fillRect(px - 2, py - 12, 3, 6);
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
    drawFarmer(g, px, py, f);
  }

  // Turkey (hidden = just ears poking from the hay)
  const tpx = ox + t.x * tile, tpy = oy + t.y * tile;
  if (t.hidden) {
    g.globalAlpha = 0.45;
    drawTurkey(g, tpx, tpy, t, 0.8);
    g.globalAlpha = 1;
  } else {
    drawTurkey(g, tpx, tpy, t);
  }

  // Danger vignette when chased
  const chased = world.farmers.some((f) => f.state === 'chase');
  if (chased) {
    g.fillStyle = 'rgba(255,60,40,0.12)';
    g.fillRect(0, 0, W, H);
  }

  drawHud(g, canvas, world, ui);
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
  // Lives as little turkeys
  for (let i = 0; i < ui.lives; i++) {
    g.fillStyle = PAL.turkeyBody;
    g.beginPath(); g.arc(W - 140 + i * 22, 32, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f2a83a';
    g.beginPath(); g.moveTo(W - 140 + i * 22 + 5, 30); g.lineTo(W - 140 + i * 22 + 9, 32); g.lineTo(W - 140 + i * 22 + 5, 34); g.fill();
  }
  // Stamina bar
  const tw = 110;
  g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(W - 70 - tw, 24, tw, 10);
  g.fillStyle = PAL.stamina; g.fillRect(W - 70 - tw, 24, tw * (world.turkey.stamina / CONFIG.turkey.staminaMax), 10);
  g.fillStyle = '#f2e8d8'; g.font = '11px sans-serif';
  g.fillText('SPRINT', W - 70 - tw, 40);
  if (world.turkey.hidden) {
    g.fillStyle = '#ffe066'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center';
    g.fillText('HIDDEN — press E to leave the hay', W / 2, canvas.height - 24);
  }
  g.restore();
}

// Title / end overlays
export function drawTitle(g, canvas, time) {
  const W = canvas.width, H = canvas.height;
  g.fillStyle = 'rgba(30,18,10,0.82)'; g.fillRect(0, 0, W, H);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ffb84a';
  g.font = `bold ${Math.min(64, W / 10)}px Georgia, serif`;
  g.fillText('GOBBLE & DASH', W / 2, H / 2 - 90 + Math.sin(time * 2) * 4);
  g.fillStyle = '#f2e8d8'; g.font = '18px sans-serif';
  g.fillText('The farmer wants you for Thanksgiving. Gobble, dash and escape to the kitchen door!', W / 2, H / 2 - 30);
  g.font = '16px sans-serif'; g.fillStyle = '#c9b896';
  g.fillText('WASD / arrows — run     SHIFT — sprint     E — hide in hay     P — pause     R — restart', W / 2, H / 2 + 10);
  g.fillStyle = '#ffe066'; g.font = 'bold 22px sans-serif';
  g.fillText('Press ENTER to start', W / 2, H / 2 + 70 + Math.sin(time * 4) * 3);
  // Decorative turkey
  drawTurkey(g, W / 2, H / 2 + 130, { bob: time * 8, squash: 0, facing: 0 }, 2.2);
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
