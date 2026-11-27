// Gobble & Dash — music: a looping WebAudio chiptune with bass, lead and percussion.
const TEMPO = 132;                       // beats per minute
const BEAT = 60 / TEMPO / 2;             // eighth note

// Simple minor-key loop in A (Thanksgiving-tense but playful).
const BASS = [110, 110, 146.8, 110, 98, 98, 130.8, 98];          // A2 A2 D3 A2 G2 G2 C3 G2
const LEAD = [440, 523.3, 493.9, 440, 392, 440, 0, 349.2,        // arpeggio figures
              392, 440, 523.3, 587.3, 523.3, 440, 392, 0];

let ctx = null;
let timer = null;
let step = 0;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playNote(freq, dur, type, vol, when) {
  const a = ac();
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, when + dur);
  o.connect(g).connect(a.destination);
  o.start(when); o.stop(when + dur + 0.05);
}

function playHat(when) {
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate * 0.04, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(); s.buffer = buf;
  const g = a.createGain(); g.gain.value = 0.025;
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
  s.connect(f).connect(g).connect(a.destination);
  s.start(when);
}

function tick() {
  const a = ac();
  const when = a.currentTime + 0.05;
  const i = step % 16;
  if (i % 2 === 0) playNote(BASS[(step >> 1) % BASS.length], BEAT * 1.6, 'triangle', 0.10, when);
  const lead = LEAD[i];
  if (lead) playNote(lead, BEAT * 0.9, 'square', 0.05, when);
  if (i % 4 === 2) playHat(when);
  step++;
}

export const music = {
  enabled: true,
  start() {
    if (!this.enabled || timer) return;
    ac();
    timer = setInterval(tick, BEAT * 1000);
  },
  stop() { if (timer) { clearInterval(timer); timer = null; } },
};
