// Web Audio API sound effects — no external dependencies, no files needed.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function resume() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  return c;
}

function tone(
  freq: number,
  type: OscillatorType,
  start: number,
  duration: number,
  gainPeak: number,
  c: AudioContext,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  gain.gain.setValueAtTime(0, c.currentTime + start);
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.01);
}

export function playPinDrop() {
  try {
    const c = resume();
    tone(660, 'sine', 0, 0.12, 0.3, c);
    tone(440, 'sine', 0.08, 0.18, 0.15, c);
  } catch { /* silently ignore */ }
}

export function playReveal() {
  try {
    const c = resume();
    tone(330, 'triangle', 0, 0.15, 0.25, c);
    tone(440, 'triangle', 0.1, 0.15, 0.25, c);
    tone(550, 'triangle', 0.2, 0.2, 0.25, c);
  } catch { /* silently ignore */ }
}

export function playFanfare() {
  try {
    const c = resume();
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone(f, 'triangle', i * 0.12, 0.3, 0.3, c));
    tone(1047, 'triangle', 0.6, 0.6, 0.4, c);
  } catch { /* silently ignore */ }
}

export function playTick() {
  try {
    const c = resume();
    tone(880, 'square', 0, 0.04, 0.05, c);
  } catch { /* silently ignore */ }
}

export function playTimesUp() {
  try {
    const c = resume();
    tone(220, 'sawtooth', 0, 0.5, 0.25, c);
    tone(165, 'sawtooth', 0.3, 0.5, 0.2, c);
  } catch { /* silently ignore */ }
}
