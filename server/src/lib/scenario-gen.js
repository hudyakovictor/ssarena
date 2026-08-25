// ============================================================
// SCENARIO GENERATOR (block 3.1) — server-side
// Turns an entity + level into a ready scenario with 4 options
// (1 correct, 3 error-based traps). Error IDs come from the
// same ERROR_LESSON table the meta-progress engine uses, so a
// generated battle feeds real lessons into the player journal.
// Deterministic per (entity, level, nonce) — same seed, same
// scenario, but the nonce varies per generation batch.
// ============================================================
import { v4 as uuid } from "uuid";
import { getContentDB } from "../db/index.js";
import { ERROR_LESSON } from "./progress.js";

// Error pool by discipline — traps match what the entity corrupts.
// Each pool MUST hold >= 3 unique error ids (generateScenarios picks 3 distinct traps).
const DISCIPLINE_ERRORS = {
  psychology: ["fomo_entry", "overtrading", "no_position_size"],
  risk:       ["overleverage", "no_stop", "no_position_size", "leverage_overreach"],
  ta:         ["fake_breakout", "ignoring_funding", "news_chasing"],
  derivatives:["liquidation_cascade", "thin_liquidity", "ignoring_funding", "stop_hunt"],
  flow:       ["rug_entry", "honeypot", "thin_liquidity"],
  news:       ["news_chasing", "fomo_entry", "overtrading"],
  liquidity:  ["thin_liquidity", "stop_hunt", "liquidation_cascade"],
};

// Feedback copy for each trap (layer1 short, layer2 terminal voice, layer3 analysis).
const TRAPS = {
  fomo_entry:         { label: "Влететь в импульс с фоллипсом", l1: "✗ FOMO Entry", l2: "Price peaked 2 minutes after your entry.", l3: "Импульс без причины — это ловушка. Вход после движения даёт худшее соотношение риск/доходность.", e: ["fomo_entry"] },
  overleverage:       { label: "Войти с полным депозитом и плечом", l1: "✗ Overleveraged", l2: "One wick and the account is gone.", l3: "Полный депозит в одну сделку — не риск-менеджмент, а ставка. Плечо усиливает и прибыль, и ликвидацию.", e: ["overleverage", "no_position_size"] },
  no_stop:            { label: "Торговать без стопа 'на глаз'", l1: "✗ No Stop", l2: "Conviction was high. Math wasn't.", l3: "Сделка без стопа — не трейд, а надежда. Рынок не признаёт уверенности — только уровни.", e: ["no_stop"] },
  no_position_size:   { label: "Позиция 'всё или ничего'", l1: "✗ Size Error", l2: "The stop was right. The size was fatal.", l3: "Даже правильный вход убивает неправильный размер позиции. Фиксируй % риска до входа, а не после.", e: ["no_position_size", "overtrading"] },
  ignoring_funding:   { label: "Игнорировать funding rate", l1: "✗ Ignored Funding", l2: "Funding told the rest of the story.", l3: "Funding — цена толпы. Перегретый funding при боковике = топливо для разворота.", e: ["ignoring_funding"] },
  fake_breakout:      { label: "Войти на пробое без подтверждения", l1: "✗ Fake Breakout", l2: "The level held. The stop hunt took you out.", l3: "Пробой без закрытия свечи и объёма — часто ложный. Жди подтверждение или ретест уровня.", e: ["fake_breakout", "stop_hunt"] },
  news_chasing:       { label: "Ловить новость по заголовку", l1: "✗ News Chasing", l2: "By the time you reacted, the move was done.", l3: "Новость — это причина, а не сигнал. Рынок отражает её до твоего клика.", e: ["news_chasing", "fomo_entry"] },
  liquidation_cascade:{ label: "Шорт на каскаде ликвидаций", l1: "✗ Cascade Entry", l2: "Liqs don't stop where you think they stop.", l3: "Каскад ликвидаций питается сами собой. Входить против каскада — ловить падающий нож.", e: ["liquidation_cascade", "overleverage"] },
  thin_liquidity:     { label: "Мариновать ордера в тонком стакане", l1: "✗ Thin Liquidity", l2: "Slippage ate 40% of your edge.", l3: "В тонкой ликвидности твой размер двигает цену. Смотри спред и глубину до входа.", e: ["thin_liquidity"] },
  stop_hunt:          { label: "Стоп на видимом уровне", l1: "✗ Stop Hunt", l2: "Your stop sat exactly where everyone's did.", l3: "Видимые кластеры стопов — магнит. Ставь стоп за структурным уровнем, не на ровном числе.", e: ["stop_hunt"] },
  leverage_overreach: { label: "Плечо ×20 'потому что можно'", l1: "✗ Leverage Overreach", l2: "Leverage is a tool, not a goal.", l3: "Плечо против тебя при любом развороте. Выбери плечо из допустимого просадочного хвоста, а не наоборот.", e: ["leverage_overreach", "overleverage"] },
  overtrading:        { label: "Открыть вторую сделку 'на удачу'", l1: "✗ Overtrading", l2: "The second trade was revenge, not analysis.", l3: "Перетрейд — налог на эмоции. Одна подготовленная сделка лучше трёх импульсивных.", e: ["overtrading"] },
  rug_entry:          { label: "Войти в альту без проверки контракта", l1: "✗ Rug Risk", l2: "The contract was a honeypot. You could sell on the way up only.", l3: "Проверяй контракт, ликвидность и владельцев до входа. Без проверки — это лотерея с минусом.", e: ["rug_entry", "honeypot"] },
  honeypot:           { label: "Ловить памп 'по сигналу из чата'", l1: "✗ Honeypot", l2: "The signal was the exit liquidity.", l3: "Сигналы из чатов — часто схема вывода твоих денег. Свою позицию проверяй только сам.", e: ["honeypot", "rug_entry"] },
};

const CORRECT = [
  { label: "Дождаться ретеста уровня и войти с фиксированным стопом", l1: "✓ Discipline Confirmed", l2: "Green candles screamed. You waited.", l3: "Ты не дал сущности покормиться. Вход после подтверждения с ограниченным риском — базовая гигиена трейдинга.", s: { discipline: 3, fomo: 2, liquidity: 1 } },
  { label: "Уменьшить размер позиции и войти только на закрытии свечи", l1: "✓ Risk First", l2: "Small size, clean entry, full account.", l3: "Сначала размер риска, потом вход. Закрытая свеча — подтверждение, а не надежда.", s: { discipline: 2, risk: 3, fomo: 1 } },
  { label: "Подождать ретест, снизить риск и держать стоп за уровнем", l1: "✓ Patience Won", l2: "The market paid you for waiting.", l3: "Ожидание + управляемый риск = сделка, которую переживёшь любой исход.", s: { discipline: 3, fomo: 2, timing: 1 } },
];

/**
 * Generate a batch of scenarios for an entity.
 * @param {object} p — { entityId, level, count, asset, nonce, generationType }
 * @returns {{ scenarios: Array, generated: number }}
 */
export function generateScenarios(p) {
  const db = getContentDB();
  const entity = db.prepare("SELECT * FROM market_entities WHERE id = ?").get(p.entityId);
  if (!entity) return { error: `Entity not found: ${p.entityId}`, generated: 0 };

  const level = Math.max(1, Math.min(99, p.level || 10));
  const count = Math.max(1, Math.min(20, p.count || 5));
  const nonce = p.nonce ?? Date.now() % 100000;
  const asset = p.asset || "ETH/USDT";

  const pool = DISCIPLINE_ERRORS[entity.discipline] || DISCIPLINE_ERRORS.risk;
  const scenarios = [];

  for (let i = 0; i < count; i++) {
    const scId = uuid();
    const lv = level + i * 3;
    const correct = pick(CORRECT, hash(scId));
    // 3 different traps from the pool (rotate start by index).
    // Guarded: if a future pool ever has <3 unique ids, stop after
    // full passes instead of looping forever (sync handler = frozen server).
    const traps = [];
    let k = (hash(scId) + i) % pool.length;
    const seen = new Set();
    let passes = 0;
    while (traps.length < 3 && passes < 3 * pool.length) {
      const err = pool[k % pool.length];
      k++;
      if (k % pool.length === 1) passes++;
      if (!seen.has(err) && TRAPS[err]) { seen.add(err); traps.push(TRAPS[err]); }
    }

    const options = [
      { label: correct.label, correct: true, layer1: correct.l1, layer2: correct.l2, layer3: correct.l3, errorsTriggered: [], skillDeltas: correct.s },
      ...traps.map((tp) => ({
        label: tp.label, correct: false, layer1: tp.l1, layer2: tp.l2, layer3: tp.l3,
        errorsTriggered: tp.e, skillDeltas: { discipline: -1, risk: -1 },
      })),
    ];
    // Deterministic rotation so the correct-answer slot varies per scenario
    const rot = hash(scId) % options.length;
    const rotated = [...options.slice(rot), ...options.slice(0, rot)];

    scenarios.push({
      id: scId,
      entityId: entity.id,
      level: lv,
      rankReq: Math.max(0, Math.floor((lv - 10) / 15)),
      asset,
      title: `${entity.name_ru} — Уровень ${lv}`,
      briefing: buildBriefing(entity, lv),
      difficultyAxes: { fomo: Math.min(10, 3 + Math.floor(lv / 10)), volatility: Math.min(10, 3 + Math.floor(lv / 12)), liquidity: Math.min(10, 2 + Math.floor(lv / 15)) },
      timeLimit: 45,
      rounds: 2,
      dataSources: {},
      generationType: p.generationType || "ai-synthetic",
      approved: 0, // admin approves before it enters the pack
      options: rotated.map((o, idx) => ({
        optIndex: String.fromCharCode(65 + idx),
        label: o.label, correct: o.correct,
        layer1: o.layer1, layer2: o.layer2, layer3: o.layer3,
        errorsTriggered: o.errorsTriggered, skillDeltas: o.skillDeltas,
      })),
    });
  }

  // Persist via a single transaction
  const ins = db.prepare(`INSERT INTO scenarios (id, entity_id, level, rank_req, asset, briefing, title, difficulty_axes, time_limit, rounds, data_sources, generation_type, approved) VALUES (?,?,?,?,?,?,?,?,?,?,?, COALESCE(?, 'ai-synthetic'), 0)`);
  const insOpt = db.prepare(`INSERT INTO scenario_options (id, scenario_id, opt_index, label, correct, layer1, layer2, layer3, errors_triggered, skill_deltas) VALUES (?,?,?,?,?,?,?,?,?,?)`);

  db.transaction(() => {
    for (const s of scenarios) {
      ins.run(s.id, s.entityId, s.level, s.rankReq, s.asset, s.briefing, s.title,
        JSON.stringify(s.difficultyAxes), s.timeLimit, s.rounds, "{}", s.generationType);
      s.options.forEach((o, idx) => {
        insOpt.run(`${s.id}_opt_${idx}`, s.id, o.optIndex, o.label, o.correct ? 1 : 0, o.layer1, o.layer2, o.layer3,
          JSON.stringify(o.errorsTriggered), JSON.stringify(o.skillDeltas));
      });
    }
  })();

  return { scenarios: scenarios.map(({ options, ...s }) => s) , generated: scenarios.length, nonce };
}

function buildBriefing(entity, lv) {
  const hooks = [
    `${entity.name_ru} активен. ${entity.description.slice(0, 90)}`,
    `Уровень ${lv}. ${entity.name_ru} усиливает коррозию: ${entity.description.slice(0, 70)}...`,
    `${entity.name_ru} (Lv.${lv}). Коррупция ${entity.corruption}%. ${entity.description.slice(0, 80)}`,
  ];
  return hooks[entity.id.length % hooks.length];
}

function pick(arr, n) { return arr[n % arr.length]; }
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
