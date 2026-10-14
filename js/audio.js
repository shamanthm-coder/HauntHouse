let ctx;

function context() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlock() {
  try {
    context();
  } catch {
    /* Autoplay can block until the first gesture. The game still runs silent. */
  }
}

function tone(freq, dur, type, gainValue, delay = 0) {
  if (!ctx) return;
  const audio = context();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainValue;
  osc.connect(gain);
  gain.connect(audio.destination);
  const start = audio.currentTime + delay;
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function blip() {
  try {
    tone(520, 0.04, 'square', 0.015);
  } catch {
    /* ignore missing audio devices */
  }
}

export function react(previous, state) {
  if (!state.sound) return;
  try {
    if (state.phase === 'caught' && previous !== 'caught') {
      tone(196, 0.35, 'sawtooth', 0.04);
      tone(146, 0.55, 'triangle', 0.03, 0.08);
      return;
    }
    if (state.phase === 'escaped' && previous !== 'escaped') {
      tone(392, 0.18, 'sine', 0.03);
      tone(523, 0.28, 'sine', 0.03, 0.12);
      return;
    }
    if (state.phase === 'midnight' && previous !== 'midnight') {
      tone(90, 0.6, 'sine', 0.05);
      return;
    }
    if (state.phase === 'hiding' && previous === 'play') tone(180, 0.08, 'triangle', 0.02);
  } catch {
    /* ignore */
  }
}
