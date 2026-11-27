// Gobble & Dash — audio: WebAudio chiptune blips, no asset files needed.
let ctx = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'square', vol = 0.08, slide = 0) {
  const a = ac();
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start(); o.stop(a.currentTime + dur);
}

function noise(dur, vol = 0.06) {
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(); s.buffer = buf;
  const g = a.createGain(); g.gain.value = vol;
  s.connect(g).connect(a.destination); s.start();
}

export const sfx = {
  enabled: true,
  corn() { if (this.enabled) { tone(880, 0.08, 'square', 0.07); tone(1320, 0.10, 'square', 0.06); } },
  gobble() { if (this.enabled) { tone(300, 0.09, 'sawtooth', 0.09, -120); setTimeout(() => tone(340, 0.12, 'sawtooth', 0.08, -160), 90); } },
  spotted() { if (this.enabled) { tone(220, 0.25, 'sawtooth', 0.10, 200); noise(0.2, 0.04); } },
  hurt() { if (this.enabled) { tone(160, 0.3, 'square', 0.11, -90); noise(0.25, 0.07); } },
  goal() { if (this.enabled) { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.09), i * 110)); } },
  click() { if (this.enabled) tone(660, 0.05, 'square', 0.05); },
  knife() { if (this.enabled) tone(1400, 0.06, 'square', 0.03, -400); },
};
