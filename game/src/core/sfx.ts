/**
 * Звук без единого аудиофайла: синтез на WebAudio.
 * Палитра — «аналоговый терминал»: клики реле, тональные подтверждения,
 * шумовой удар на провале. Тихо, коротко, не раздражает на 200-м раунде.
 */
import { getState } from './store';

let ctx: AudioContext | null = null;
const ac = () => (ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)());

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.05, slide = 0) {
  if (!getState().sound) return;
  const a = ac();
  if (a.state === 'suspended') a.resume();
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(0, a.currentTime);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start(); o.stop(a.currentTime + dur + 0.02);
}

function noise(dur: number, gain = 0.06, hp = 400) {
  if (!getState().sound) return;
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = a.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export const SFX: Record<string, () => void> = {
  hover: () => tone(880, 0.04, 'square', 0.012),
  click: () => { tone(420, 0.06, 'square', 0.03, -120); noise(0.04, 0.02, 1800); },
  enter: () => { tone(320, 0.10, 'triangle', 0.04, 220); tone(480, 0.16, 'sine', 0.03, 160); },
  win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.045), i * 70)); },
  lose: () => { tone(180, 0.32, 'sawtooth', 0.05, -90); noise(0.3, 0.05, 200); },
  tick: () => tone(1200, 0.02, 'square', 0.01),
  coin: () => { tone(1046, 0.07, 'square', 0.03); setTimeout(() => tone(1568, 0.09, 'square', 0.025), 60); },
};

export function installSfx(game: Phaser.Game) {
  game.events.on('sfx', (name: string) => SFX[name]?.());
  const unlock = () => { ac().resume(); window.removeEventListener('pointerdown', unlock); };
  window.addEventListener('pointerdown', unlock);
}
