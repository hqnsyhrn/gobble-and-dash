// Gobble & Dash — particle system: feathers, sparks, dust, floating score text.
export class Particles {
  constructor() { this.list = []; this.texts = []; }
  feather(x, y, n = 6) {
    for (let i = 0; i < n; i++) this.list.push({
      x, y, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 130 - 20,
      life: 0.9 + Math.random() * 0.5, age: 0, kind: 'feather',
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 6,
      color: ['#8c5a2b', '#a8703a', '#6b4423'][i % 3], size: 4 + Math.random() * 3,
    });
  }
  spark(x, y, n = 10, color = '#ffb84a') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 160;
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30,
        life: 0.4 + Math.random() * 0.4, age: 0, kind: 'spark', color, size: 2 + Math.random() * 2.5 });
    }
  }
  dust(x, y) {
    this.list.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 20,
      life: 0.5, age: 0, kind: 'dust', color: 'rgba(210,170,120,0.5)', size: 3 + Math.random() * 3 });
  }
  text(x, y, str, color = '#ffe066') {
    this.texts.push({ x, y, str, color, life: 1.0, age: 0 });
  }
  update(dt) {
    for (const p of this.list) {
      p.age += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'feather') { p.vy += 60 * dt; p.vx *= 0.98; p.rot += p.vr * dt; }
      else if (p.kind === 'spark') { p.vy += 300 * dt; }
    }
    this.list = this.list.filter((p) => p.age < p.life);
    for (const t of this.texts) { t.age += dt; t.y -= 30 * dt; }
    this.texts = this.texts.filter((t) => t.age < t.life);
  }
  draw(g) {
    for (const p of this.list) {
      const a = 1 - p.age / p.life;
      g.globalAlpha = a;
      if (p.kind === 'feather') {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        g.fillStyle = p.color;
        g.beginPath(); g.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2); g.fill();
        g.restore();
      } else {
        g.fillStyle = p.color;
        g.beginPath(); g.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2); g.fill();
      }
    }
    g.globalAlpha = 1;
    g.textAlign = 'center';
    for (const t of this.texts) {
      g.globalAlpha = 1 - t.age / t.life;
      g.font = 'bold 16px sans-serif';
      g.fillStyle = t.color;
      g.fillText(t.str, t.x, t.y);
    }
    g.globalAlpha = 1;
  }
}
