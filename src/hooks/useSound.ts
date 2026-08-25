// Simple sound manager — uses Web Audio API for UI feedback
// No external files needed. Generates tones procedurally.
import { useCallback, useRef } from "react";

let audioCtx: AudioContext | null = null;
function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.08) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch { /* audio not available */ }
}

function playSequence(notes: Array<[number, number, OscillatorType?, number?]>) {
  let delay = 0;
  notes.forEach(([freq, dur, type, vol]) => {
    setTimeout(() => playTone(freq, dur, type, vol), delay);
    delay += dur * 800;
  });
}

export function useSound() {
  const enabled = useRef(true);

  const toggle = useCallback(() => { enabled.current = !enabled.current; return enabled.current; }, []);
  const isEnabled = useCallback(() => enabled.current, []);

  return {
    toggle, isEnabled,
    click: () => { if (enabled.current) playTone(800, 0.05, "square", 0.04); },
    hover: () => { if (enabled.current) playTone(1200, 0.03, "sine", 0.02); },
    success: () => { if (enabled.current) playSequence([[523, 0.1], [659, 0.1], [784, 0.15]]); },
    error: () => { if (enabled.current) playSequence([[200, 0.2, "sawtooth", 0.06], [150, 0.3, "sawtooth", 0.06]]); },
    battleStart: () => { if (enabled.current) playSequence([[330, 0.15, "triangle", 0.05], [440, 0.1, "triangle", 0.05], [550, 0.2, "triangle", 0.06]]); },
    timerTick: () => { if (enabled.current) playTone(1000, 0.02, "square", 0.03); },
    twist: () => { if (enabled.current) playTone(80, 0.4, "sawtooth", 0.07); },
    entityDefeated: () => { if (enabled.current) playSequence([[440, 0.1], [554, 0.1], [660, 0.1], [880, 0.3]]); },
  };
}
