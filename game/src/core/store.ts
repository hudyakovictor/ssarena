/**
 * Zustand-стор без React: vanilla-стор + подписки из сцен Phaser.
 * Персист — localStorage (прототип; в проде заменяется на Fastify/SQLite).
 */
import { createStore } from 'zustand/vanilla';
import { RANKS } from '../content/lore';

export type MarketMood = 'normal' | 'euphoria' | 'panic' | 'aftermath';

export interface PlayerState {
  name: string;
  xp: number;
  sig: number;          // мягкая валюта $SIG
  streak: number;       // дни подряд (Duolingo-петля)
  lives: number;        // «терпение» — 5 сердец
  accuracy: number;     // % верных решений
  played: number;
  correct: number;
  rating: number;       // рейтинг арены
  mood: MarketMood;
  unlocked: string[];   // id сущностей бестиария
  owned: string[];      // купленное на базаре
  lessons: Record<string, number>; // дисциплина → пройдено уроков
  sound: boolean;
  reduceMotion: boolean;
}

export interface Actions {
  answer(correct: boolean, xpGain: number, sigGain: number): void;
  spend(n: number): boolean;
  buy(id: string, price: number): boolean;
  unlock(id: string): void;
  completeLesson(disc: string): void;
  setMood(m: MarketMood): void;
  toggle(k: 'sound' | 'reduceMotion'): void;
  reset(): void;
}

const KEY = 'signal-arena-v3';

const initial: PlayerState = {
  name: 'Аноним #4417',
  xp: 1240, sig: 860, streak: 6, lives: 5,
  accuracy: 0, played: 34, correct: 21, rating: 1180,
  mood: 'normal',
  unlocked: ['fomo-wraith', 'leverage-goblin', 'stop-hunter', 'fake-breakout', 'narrative-siren'],
  owned: [],
  lessons: { candles: 6, risk: 3, liquidity: 2, psychology: 1, macro: 0 },
  sound: true, reduceMotion: false,
};

function load(): PlayerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...JSON.parse(raw) };
  } catch { /* приватный режим — работаем в памяти */ }
  return { ...initial };
}

export const store = createStore<PlayerState & Actions>((set, get) => ({
  ...load(),

  answer(correct, xpGain, sigGain) {
    const s = get();
    set({
      xp: s.xp + (correct ? xpGain : Math.round(xpGain * 0.25)),
      sig: s.sig + (correct ? sigGain : 0),
      played: s.played + 1,
      correct: s.correct + (correct ? 1 : 0),
      lives: correct ? s.lives : Math.max(0, s.lives - 1),
      rating: Math.max(0, s.rating + (correct ? 18 : -12)),
    });
  },
  spend(n) {
    const s = get();
    if (s.sig < n) return false;
    set({ sig: s.sig - n });
    return true;
  },
  buy(id, price) {
    const s = get();
    if (s.owned.includes(id) || s.sig < price) return false;
    set({ sig: s.sig - price, owned: [...s.owned, id] });
    return true;
  },
  unlock(id) {
    const s = get();
    if (!s.unlocked.includes(id)) set({ unlocked: [...s.unlocked, id] });
  },
  completeLesson(disc) {
    const s = get();
    set({ lessons: { ...s.lessons, [disc]: (s.lessons[disc] ?? 0) + 1 }, xp: s.xp + 60 });
  },
  setMood(mood) { set({ mood }); },
  toggle(k) { set({ [k]: !get()[k] } as any); },
  reset() { set({ ...initial }); },
}));

store.subscribe((s) => {
  try {
    const { name, xp, sig, streak, lives, played, correct, rating, mood, unlocked, owned, lessons, sound, reduceMotion } = s;
    localStorage.setItem(KEY, JSON.stringify({ name, xp, sig, streak, lives, played, correct, rating, mood, unlocked, owned, lessons, sound, reduceMotion }));
  } catch { /* noop */ }
});

// ── селекторы ──
export const getState = () => store.getState();
export const accuracy = () => {
  const s = getState();
  return s.played ? Math.round((s.correct / s.played) * 100) : 0;
};
export const rankOf = (xp: number) => {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].minXp) i = k;
  const cur = RANKS[i], next = RANKS[i + 1];
  const pct = next ? (xp - cur.minXp) / (next.minXp - cur.minXp) : 1;
  return { index: i, cur, next, pct: Math.max(0, Math.min(1, pct)) };
};
