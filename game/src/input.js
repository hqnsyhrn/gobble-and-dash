// Gobble & Dash — keyboard + mouse input: WASD/arrows move, Shift sprints, S hides, P pauses, R restarts.
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();      // keys pressed this frame
    this.mouse = { x: 0, y: 0, clicked: false };
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    window.addEventListener('mousedown', () => { this.mouse.clicked = true; });
  }
  axis() {
    let dx = 0, dy = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len, moving: dx !== 0 || dy !== 0 };
  }
  sprinting() { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }
  hidePressed() { return this.keys.has('KeyE') || this.keys.has('KeyC'); }
  pausePressed() { return this.pressed.has('KeyP') || this.pressed.has('Escape'); }
  restartPressed() { return this.pressed.has('KeyR'); }
  confirmPressed() { return this.pressed.has('Enter') || this.pressed.has('Space'); }
  endFrame() { this.pressed.clear(); this.mouse.clicked = false; }
}
