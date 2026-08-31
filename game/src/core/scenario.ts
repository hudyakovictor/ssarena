/**
 * Детерминированный генератор рыночных сценариев.
 * seedrandom → одинаковый seed даёт идентичный график и правильный ответ,
 * что позволяет честно сравнивать игроков (Proof of Skill) и воспроизводить баги.
 */
import seedrandom from 'seedrandom';

export interface Candle { o: number; h: number; l: number; c: number; v: number }
export type Answer = 'long' | 'short' | 'wait';

export interface Scenario {
  seed: string;
  candles: Candle[];
  /** Сколько свечей скрыто справа — «будущее», которое раскроется после ответа. */
  reveal: number;
  answer: Answer;
  regime: 'trend-up' | 'trend-down' | 'range' | 'trap' | 'panic';
  question: string;
  explain: string;
  headline: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

const REGIMES = ['trend-up', 'trend-down', 'range', 'trap', 'panic'] as const;

const HEADLINES: Record<Scenario['regime'], string[]> = {
  'trend-up': ['Оптимизм объявлен обязательным', 'Все внезапно поверили в фундамент'],
  'trend-down': ['Коррекция здоровая. Как и все предыдущие', 'Продавцы вежливо забирают надежду'],
  range: ['Рынок задумался. Это дороже, чем кажется', 'Боковик: департамент скуки на смене'],
  trap: ['Пробой века. Век длился 4 минуты', 'Уровень сдался. Потом передумал'],
  panic: ['Ликвидация века. Опять', 'Паника поставлена на поток'],
};

const QUESTIONS: Record<Scenario['regime'], string> = {
  'trend-up': 'Структура растёт. Твоё решение на следующие 12 свечей?',
  'trend-down': 'Каждый максимум ниже предыдущего. Что делаешь?',
  range: 'Цена ходит между двумя стенами. Твой ход?',
  trap: 'Уровень пробит. Объём подозрительно тихий. Веришь?',
  panic: 'Свеча съела четыре предыдущие. Реакция?',
};

const EXPLAIN: Record<Scenario['regime'], string> = {
  'trend-up': 'Серия HH/HL — тренд вверх. Работать против тренда без сигнала разворота = платить за мнение.',
  'trend-down': 'Серия LH/LL — продавцы контролируют. Ловля дна оплачивается твоим депозитом.',
  range: 'Диапазон без объёма — рынок не решил. Лучшая сделка здесь — её отсутствие.',
  trap: 'Пробой без объёма и без ретеста — ловушка ликвидности. Тебя пригласили как топливо.',
  panic: 'Импульсная свеча на панике — не вход, а чужая ликвидация. Жди стабилизации структуры.',
};

export function generateScenario(seed: string, difficulty: 1 | 2 | 3 | 4 | 5 = 2): Scenario {
  const rng = seedrandom(seed);
  const regime = REGIMES[Math.floor(rng() * REGIMES.length)];
  const total = 56;
  const reveal = 12;
  const candles: Candle[] = [];

  let price = 100 + rng() * 60;
  // Волатильность растёт с уровнем сложности → шум маскирует структуру.
  const vol = 0.6 + difficulty * 0.28;
  let drift = regime === 'trend-up' ? 0.34 : regime === 'trend-down' ? -0.34 : 0;

  for (let i = 0; i < total; i++) {
    const t = i / total;
    if (regime === 'trap' && i === total - reveal - 4) drift = 0.9;       // фальшивый рывок
    if (regime === 'trap' && i === total - reveal + 1) drift = -1.1;      // возврат
    if (regime === 'panic' && i === total - reveal - 1) drift = -3.2;
    if (regime === 'panic' && i > total - reveal) drift = -0.15;
    if (regime === 'range') drift = Math.sin(t * Math.PI * 5) * 0.5;

    const o = price;
    const noise = (rng() - 0.5) * vol * 2;
    const body = drift + noise;
    const c = Math.max(1, o + body);
    const wick = Math.abs(body) * (0.4 + rng() * 1.4) + vol * 0.4;
    const h = Math.max(o, c) + rng() * wick;
    const l = Math.min(o, c) - rng() * wick;
    const v = 0.3 + rng() * 0.7 + (Math.abs(body) / (vol + 0.01)) * 0.5;
    candles.push({ o, h, l, c, v });
    price = c;
  }

  const answer: Answer =
    regime === 'trend-up' ? 'long' :
    regime === 'trend-down' || regime === 'panic' ? 'short' :
    'wait';

  const hl = HEADLINES[regime];
  return {
    seed,
    candles,
    reveal,
    answer,
    regime,
    difficulty,
    question: QUESTIONS[regime],
    explain: EXPLAIN[regime],
    headline: hl[Math.floor(rng() * hl.length)],
  };
}

/** Ежедневный сид — у всех игроков один и тот же «выпуск». */
export function dailySeed(offset = 0): string {
  const d = new Date(Date.now() + offset * 864e5);
  return `daily-${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}
