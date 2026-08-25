// ============================================================
// DB SEED — Populate content database with initial data
// Run: node src/db/seed.js
// ============================================================
import { v4 as uuid } from "uuid";
import { initContentDB, initUsersDB, getContentDB } from "./index.js";

function seed() {
  console.log("🌱 Seeding databases...\n");

  // Init both DBs
  initUsersDB();
  const db = initContentDB();

  // ── MARKET ENTITIES (18) ──
  const entities = [
    { id: "fake-breakout-phantom", name: "Fake Breakout Phantom", name_ru: "Фантом Ложного Пробоя", archetype: "phantom", discipline: "ta", threat_level: "HIGH", corruption: 78, description: "Ловушка, замаскированная под возможность. Пробой выглядит настоящим, но это ловушка.", unlock_rank: 0 },
    { id: "fomo-wraith", name: "FOMO Wraith", name_ru: "Wraith Упущенной Выгоды", archetype: "wraith", discipline: "psychology", threat_level: "HIGH", corruption: 82, description: "Питается страхом упустить прибыль. Шепчет 'все покупают, а ты нет'.", unlock_rank: 0 },
    { id: "meme-mirage", name: "Meme Mirage", name_ru: "Мираж Мема", archetype: "mirage", discipline: "ta", threat_level: "MEDIUM", corruption: 55, description: "Создаёт иллюзию паттерна там, где его нет.", unlock_rank: 0 },
    { id: "leverage-goblin", name: "Leverage Goblin", name_ru: "Гоблин Плеча", archetype: "goblin", discipline: "derivatives", threat_level: "HIGH", corruption: 80, description: "Предлагает умножить прибыль. Цена: ликвидация.", unlock_rank: 3 },
    { id: "liquidity-hydra", name: "Liquidity Hydra", name_ru: "Гидра Ликвидности", archetype: "hydra", discipline: "derivatives", threat_level: "HIGH", corruption: 76, description: "Каскадный сбор стоп-ордеров.", unlock_rank: 3 },
    { id: "loss-aversion-wraith", name: "Loss Aversion Wraith", name_ru: "Wraith Страха Убытка", archetype: "wraith", discipline: "psychology", threat_level: "HIGH", corruption: 75, description: "Парализует страхом признания убытка.", unlock_rank: 3 },
    { id: "rug-pull-phantom", name: "Rug Pull Phantom", name_ru: "Фантом Rug Pull", archetype: "phantom", discipline: "security", threat_level: "CRITICAL", corruption: 95, description: "Выглядит дружелюбно. Предлагает 10000% APY.", unlock_rank: 5 },
    { id: "honeypot-mimic", name: "Honeypot Mimic", name_ru: "Мимик Honeypot", archetype: "mimic", discipline: "security", threat_level: "CRITICAL", corruption: 95, description: "Смарт-контракт, притворяющийся алмазом.", unlock_rank: 5 },
    { id: "headline-titan", name: "Headline Titan", name_ru: "Титан Заголовков", archetype: "titan", discipline: "fundamental", threat_level: "CRITICAL", corruption: 92, description: "Внезапный новостной шок.", unlock_rank: 6 },
    { id: "unlock-titan", name: "Unlock Titan", name_ru: "Титан Разблокировки", archetype: "titan", discipline: "fundamental", threat_level: "HIGH", corruption: 70, description: "Лавина продаж от разблокировки токенов.", unlock_rank: 6 },
    { id: "indicator-cult", name: "Indicator Cult", name_ru: "Культ Индикаторов", archetype: "cult", discipline: "ta", threat_level: "MEDIUM", corruption: 65, description: "Заражает верой в индикаторы.", unlock_rank: 6 },
    { id: "narrative-siren", name: "Narrative Siren", name_ru: "Сирена Нарратива", archetype: "siren", discipline: "fundamental", threat_level: "MEDIUM", corruption: 68, description: "Поёт сладкую песню о будущем.", unlock_rank: 6 },
    { id: "whale-syndicate", name: "Whale Syndicate", name_ru: "Синдикат Китов", archetype: "syndicate", discipline: "fundamental", threat_level: "HIGH", corruption: 78, description: "Организованные манипуляции.", unlock_rank: 6 },
    { id: "revenge-wraith", name: "Revenge Wraith", name_ru: "Wraith Отыгрыша", archetype: "wraith", discipline: "psychology", threat_level: "MEDIUM", corruption: 68, description: "Нападает после убытка.", unlock_rank: 9 },
    { id: "confirmation-cult", name: "Confirmation Bias Cult", name_ru: "Культ Подтверждения", archetype: "cult", discipline: "psychology", threat_level: "MEDIUM", corruption: 72, description: "Сектантская вера в правоту.", unlock_rank: 9 },
    { id: "hubris-dragon", name: "Hubris Dragon", name_ru: "Дракон Гордыни", archetype: "dragon", discipline: "psychology", threat_level: "HIGH", corruption: 70, description: "Растёт с твоими победами.", unlock_rank: 9 },
    { id: "token-parasite", name: "Token Parasite", name_ru: "Паразит Токена", archetype: "parasite", discipline: "security", threat_level: "MEDIUM", corruption: 65, description: "Медленно высасывает средства.", unlock_rank: 9 },
    { id: "insider-syndicate", name: "Insider Syndicate", name_ru: "Синдикат Инсайдеров", archetype: "syndicate", discipline: "security", threat_level: "CRITICAL", corruption: 88, description: "Команда с добрыми лицами.", unlock_rank: 9 },
  ];

  const insertEntity = db.prepare(`
    INSERT OR REPLACE INTO market_entities (id, name, name_ru, archetype, discipline, threat_level, corruption, description, unlock_rank, axes_json, mistakes_json, counters_json, weak_skills_json, key_data_json, published)
    VALUES (?,?,?,?,?,?,?,?,?, '{}','[]','[]','[]','[]',1)
  `);

  for (const e of entities) {
    insertEntity.run(e.id, e.name, e.name_ru, e.archetype, e.discipline, e.threat_level, e.corruption, e.description, e.unlock_rank);
  }
  console.log(`  ✓ ${entities.length} Market Entities seeded`);

  // ── SKILL CARDS ──
  const cards = [
    { id: "trend-check", name_en: "Trend Check", name_ru: "Trend Check", tier: 1, rarity: "common", cost: 1, discipline: "ta", category: "chart", effect: "Определи тренд на старшем ТФ", flavor: "Торгуй с рекой, не против." },
    { id: "stop-discipline", name_en: "Stop-Loss Discipline", name_ru: "Stop-Loss Discipline", tier: 1, rarity: "rare", cost: 1, discipline: "derivatives", category: "risk", effect: "Никогда не входи без стопа", flavor: "Где твоя идея неверна." },
    { id: "dont-chase", name_en: "Don't Chase Green", name_ru: "Don't Chase Green", tier: 1, rarity: "epic", cost: 1, discipline: "psychology", category: "psych", effect: "Блокирует входы после импульса", flavor: "Свеча горяча. Руки — нет." },
    { id: "volume-confirm", name_en: "Volume Confirmation", name_ru: "Volume Confirmation", tier: 1, rarity: "common", cost: 1, discipline: "ta", category: "chart", effect: "Проверь пробой объёмом", flavor: "Нет объёма — нет убеждения." },
    { id: "funding-heat", name_en: "Funding Heat", name_ru: "Funding Heat", tier: 2, rarity: "rare", cost: 2, discipline: "derivatives", category: "deriv", effect: "Показывает перегретый funding", flavor: "Лонги платят лонгам." },
    { id: "anti-fomo", name_en: "Anti-FOMO Shield", name_ru: "Anti-FOMO Shield", tier: 1, rarity: "epic", cost: 1, discipline: "psychology", category: "psych", effect: "Щит от импульсивных решений", flavor: "Свеча кричит. Щит молчит." },
    { id: "macro-pulse", name_en: "Macro Pulse", name_ru: "Macro Pulse", tier: 2, rarity: "rare", cost: 2, discipline: "fundamental", category: "macro", effect: "Календарь макро-событий в одном пульсе", flavor: "FOMC, CPI, DXY — заранее." },
    { id: "contract-shield", name_en: "Contract Shield", name_ru: "Contract Shield", tier: 2, rarity: "rare", cost: 2, discipline: "security", category: "security", effect: "Красные флаги смарт-контракта", flavor: "10000% APY — это не доход, это звонок." },
  ];

  const insertCard = db.prepare("INSERT OR REPLACE INTO skill_cards (id, name_en, name_ru, tier, rarity, cost, discipline, category, effect, flavor, glyph, published) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)");
  for (const c of cards) { insertCard.run(c.id, c.name_en, c.name_ru, c.tier, c.rarity, c.cost, c.discipline, c.category, c.effect, c.flavor, c.glyph || "📊"); }
  console.log(`  ✓ ${cards.length} Skill Cards seeded`);

  // ── SAMPLE SCENARIO ──
  const scenarioId = uuid();
  db.prepare("INSERT OR REPLACE INTO scenarios (id, entity_id, level, rank_req, asset, briefing, title, difficulty_axes, time_limit, rounds, data_sources, generation_type, approved) VALUES (?,?,?,?,?,?,?,?,?,?,?,'manual',1)")
    .run(scenarioId, "fomo-wraith", 5, 0, "ETH/USDT", "ETH +8% за 24ч. Funding перегрет. CPI через 12ч.", "The Funding Trap", '{}', 45, 2, '{}');

  const options = [
    { id: `${scenarioId}_opt_A`, scenario_id: scenarioId, opt_index: "A", label: "Подождать ретест, снизить риск", correct: 1, layer1: "✓ Discipline Confirmed", layer2: "Green candles screamed. You waited.", layer3: "Рынок перегрет. Ты не дал Wraith покормиться.", errors: [], skills: { discipline: 3, fomo: 2, liquidity: 1 } },
    { id: `${scenarioId}_opt_B`, scenario_id: scenarioId, opt_index: "B", label: "Войти в лонг на весь депозит", correct: 0, layer1: "✗ Late Entry", layer2: "Price peaked 2 minutes later.", layer3: "Ты вошёл после импульса.", errors: ["fomo_entry", "overleverage"], skills: { risk: -2, discipline: -1 } },
    { id: `${scenarioId}_opt_C`, scenario_id: scenarioId, opt_index: "C", label: "Шорт без стопа", correct: 0, layer1: "✗ Risk Failed", layer2: "Conviction was high. Math wasn't.", layer3: "Без стопа — не сделка.", errors: ["no_stop", "overleverage"], skills: { risk: -3 } },
    { id: `${scenarioId}_opt_D`, scenario_id: scenarioId, opt_index: "D", label: "Игнорировать funding", correct: 0, layer1: "✗ Incomplete", layer2: "Funding told the rest.", layer3: "Funding — ключевой сигнал.", errors: ["ignoring_funding"], skills: { liquidity: -1 } },
  ];

  const insertOpt = db.prepare("INSERT OR REPLACE INTO scenario_options (id, scenario_id, opt_index, label, correct, layer1, layer2, layer3, errors_triggered, skill_deltas) VALUES (?,?,?,?,?,?,?,?,?,?)");
  for (const o of options) { insertOpt.run(o.id, o.scenario_id, o.opt_index, o.label, o.correct, o.layer1, o.layer2, o.layer3, JSON.stringify(o.errors || []), JSON.stringify(o.skills || {})); }
  console.log(`  ✓ 1 Sample Scenario seeded with ${options.length} options`);

  console.log("\n✅ Database seed complete!");
  console.log("   Run: npm run dev");
}

seed();
