// ============================================================
// SIGNAL ARENA V2 — CORE DATA LAYER
// 18 Market Entities · 12 Archetypes · 5 Disciplines
// Terminal Voice · Bestiary · Error Journal · Admin Pipeline
// Adopted visual style: signal-arena-project-brief
// ============================================================

// ── COLOR PALETTE (matching project-brief) ──
export const C = {
  signal: "#22d3ee", short: "#fb4b6b", long: "#2bd47f",
  gold: "#fbbf24", grape: "#8b5cf6", amber: "#f59e0b",
  pink: "#ec4899", blue: "#4f8cff", void: "#05070f",
  ink: "#e2e8f0", inkSoft: "#94a3b8", inkDim: "#5e6d85",
};

// ── RARITY ──
export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export const RARITY: Record<Rarity, { tag: string; color: string; glow: string }> = {
  common: { tag: "COMMON", color: "#5bc0eb", glow: "rgba(91,192,235,0.5)" },
  rare: { tag: "RARE", color: "#4f8cff", glow: "rgba(79,140,255,0.55)" },
  epic: { tag: "EPIC", color: "#b15cff", glow: "rgba(177,92,255,0.6)" },
  legendary: { tag: "LEGENDARY", color: "#fbbf24", glow: "rgba(251,191,36,0.6)" },
  mythic: { tag: "MYTHIC", color: "#ff5e8a", glow: "rgba(255,94,138,0.65)" },
};

// ── 15 RANKS ──
export interface Rank {
  id: number; nameRu: string; nameEn: string; tier: string;
  color: string; minXp: number; blurb: string;
}
export const RANKS: Rank[] = [
  { id: 0, nameRu: "Первый раз открыл график", nameEn: "First Chart Opened", tier: "Initiate", color: "#5e6d85", minXp: 0, blurb: "Свечи? Тени? Зелёные и красные прямоугольники, которые движутся." },
  { id: 1, nameRu: "Новичок свечей", nameEn: "Candle Novice", tier: "Initiate", color: "#94a3b8", minXp: 200, blurb: "Читает одну свечу. Тело, тень, убеждение." },
  { id: 2, nameRu: "Охотник за трендом", nameEn: "Trend Hunter", tier: "Apprentice", color: C.signal, minXp: 500, blurb: "Видит структуру: HH, HL, линии намерения." },
  { id: 3, nameRu: "Ученик риск-менеджмента", nameEn: "Risk Apprentice", tier: "Apprentice", color: C.long, minXp: 900, blurb: "Одна сделка больше не рискует королевством." },
  { id: 4, nameRu: "Читатель ликвидности", nameEn: "Liquidity Reader", tier: "Adept", color: C.signal, minXp: 1400, blurb: "Видит бассейны, где охотятся на стопы." },
  { id: 5, nameRu: "Анти-FOMO трейдер", nameEn: "Anti-FOMO Trader", tier: "Adept", color: C.long, minXp: 2000, blurb: "Зелёная свеча кричит. Разум ждёт." },
  { id: 6, nameRu: "Аналитик новостей", nameEn: "News Analyst", tier: "Veteran", color: C.gold, minXp: 2700, blurb: "Отделяет катализатор от шума." },
  { id: 7, nameRu: "On-chain разведчик", nameEn: "On-chain Scout", tier: "Veteran", color: C.grape, minXp: 3500, blurb: "Следует за деньгами там, где графики не лгут." },
  { id: 8, nameRu: "Макро-следопыт", nameEn: "Macro Tracker", tier: "Expert", color: C.blue, minXp: 4400, blurb: "Ставки, DXY, приливы ликвидности." },
  { id: 9, nameRu: "Турнирный стратег", nameEn: "Tournament Strategist", tier: "Expert", color: C.amber, minXp: 5400, blurb: "Побеждает стабильно под давлением." },
  { id: 10, nameRu: "Мастер вероятностей", nameEn: "Probability Master", tier: "Master", color: C.grape, minXp: 6500, blurb: "Мыслит распределениями, не уверенностями." },
  { id: 11, nameRu: "Рыночный тактик", nameEn: "Market Tactician", tier: "Master", color: C.pink, minXp: 7700, blurb: "Складывает края. Знает, когда стол ошибается." },
  { id: 12, nameRu: "Crypto Analyst", nameEn: "Crypto Analyst", tier: "Elite", color: C.gold, minXp: 9000, blurb: "Full-stack чтец рынка через все слои." },
  { id: 13, nameRu: "Alpha Hunter", nameEn: "Alpha Hunter", tier: "Elite", color: C.amber, minXp: 10500, blurb: "Находит сигнал, который толпа не закладывает." },
  { id: 14, nameRu: "Grandmaster of Signals", nameEn: "Grandmaster of Signals", tier: "Grandmaster", color: C.short, minXp: 12500, blurb: "Мыслит как сильнейший участник. Proof of Skill." },
];

// ── 12 ARCHETYPES ──
export interface Archetype {
  id: string; name: string; glyph: string; behavior: string;
  color: string; gameplay: string; visualMotif: string;
}
export const ARCHETYPES: Archetype[] = [
  { id: "phantom", name: "Phantom", glyph: "👻", behavior: "Скрывается, прячет опасность", color: C.grape, gameplay: "Раскрыть скрытое до решения", visualMotif: "Полупрозрачность, скрытые контуры, '???' элементы" },
  { id: "mimic", name: "Mimic", glyph: "🎭", behavior: "Притворяется полезным/безопасным", color: C.blue, gameplay: "Отличить настоящее от подделки", visualMotif: "Двойственность, маска, false facade" },
  { id: "wraith", name: "Wraith", glyph: "💀", behavior: "Давит психологически", color: C.short, gameplay: "Устоять эмоционально", visualMotif: "Тёмные искажённые формы, эмоциональные триггеры" },
  { id: "cult", name: "Cult", glyph: "🕯️", behavior: "Заражает мышление", color: C.pink, gameplay: "Не 'заразиться' чужим тезисом", visualMotif: "Групповые символы, echo patterns, repeating motifs" },
  { id: "hydra", name: "Hydra", glyph: "🐍", behavior: "Проблема множится", color: C.long, gameplay: "Решать корень, а не симптом", visualMotif: "Множественные головы, разветвления, cascading elements" },
  { id: "titan", name: "Titan", glyph: "⛰️", behavior: "Огромное системное событие", color: C.gold, gameplay: "Готовиться заранее, пережить удар", visualMotif: "Массивные, монолитные, unavoidable presence" },
  { id: "syndicate", name: "Syndicate", glyph: "🕴️", behavior: "Скоординированный капитал", color: C.blue, gameplay: "Читать действия крупного игрока", visualMotif: "Связи, сеть, координация, многоточие" },
  { id: "goblin", name: "Goblin", glyph: "👺", behavior: "Заманивает силой со скрытой ценой", color: C.signal, gameplay: "Видеть реальную цену предложения", visualMotif: "Мелкий, хитрый, сделка с дьяволом" },
  { id: "siren", name: "Siren", glyph: "🧜", behavior: "Заманивает нарративом", color: C.pink, gameplay: "Не слушать сладкую песню", visualMotif: "Привлекательность, соблазн, красивая ловушка" },
  { id: "dragon", name: "Dragon", glyph: "🐉", behavior: "Растёт с твоим успехом", color: C.amber, gameplay: "Проверка гордыни после побед", visualMotif: "Величие, мощь, растущая угроза" },
  { id: "parasite", name: "Parasite", glyph: "🪱", behavior: "Медленно истощает", color: C.grape, gameplay: "Обнаружить при глубоком анализе", visualMotif: "Медленное поглощение, истощение, скрытый drain" },
  { id: "mirage", name: "Mirage", glyph: "🌫️", behavior: "Создаёт иллюзию реальности", color: C.inkDim, gameplay: "Отличить иллюзию от паттерна", visualMotif: "Мерцание, иллюзорность, ложные паттерны" },
];

// ── 5 DISCIPLINES ──
export type Discipline = "ta" | "derivatives" | "fundamental" | "psychology" | "security";
export const DISCIPLINES: Record<Discipline, { nameRu: string; nameEn: string; color: string; glyph: string }> = {
  ta: { nameRu: "Технический анализ", nameEn: "Technical Analysis", color: C.signal, glyph: "📊" },
  derivatives: { nameRu: "Деривативный анализ", nameEn: "Derivatives & Liquidity", color: C.gold, glyph: "🔥" },
  fundamental: { nameRu: "Фундаментальный анализ", nameEn: "Fundamental & Macro", color: C.blue, glyph: "🌐" },
  psychology: { nameRu: "Психология рынка", nameEn: "Market Psychology", color: C.short, glyph: "🧠" },
  security: { nameRu: "Безопасность проектов", nameEn: "Protocol Security", color: C.grape, glyph: "🛡️" },
};

// ── THREAT LEVELS ──
export type ThreatLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export const THREAT_COLORS: Record<ThreatLevel, string> = { LOW: C.long, MEDIUM: C.gold, HIGH: C.pink, CRITICAL: C.short };

// ── ENTITY STATUS ──
export type EntityStatus = "undiscovered" | "encountered" | "defeated" | "mastered";

// ── 18 MARKET ENTITIES ──
export interface MarketEntity {
  id: string; name: string; nameRu: string; title: string;
  archetype: string; discipline: Discipline; threatLevel: ThreatLevel;
  corruption: number; glyph: string;
  description: string; manifestDesc: string; psychology: string; realMarket: string;
  expectedMistakes: string[]; counterCards: string[]; weakSkills: string[]; keyData: string[];
  axes: { infoDensity: number; timePressure: number; emotionalIntensity: number; trapSophistication: number; consequenceWeight: number; uncertaintyLevel: number; };
  loreSnippet: string;
  // progression
  unlockRank: number;
}

export const MARKET_ENTITIES: MarketEntity[] = [
  // ── PHANTOMS (2) ──
  {
    id: "fake-breakout-phantom", name: "Fake Breakout Phantom", nameRu: "Фантом Ложного Пробоя", title: "Phantom",
    archetype: "phantom", discipline: "ta", threatLevel: "HIGH", corruption: 78, glyph: "👻",
    description: "Ловушка, замаскированная под возможность. Пробой выглядит настоящим, объём подтверждает, ты входишь — затем цена разворачивается, сметая стопы. Ты предоставил exit liquidity.",
    manifestDesc: "В бою проявляется как 'идеальный' пробой: цена пробивает сопротивление, объём повышен. Но Multi-Timeframe показывает ложность. Phantom прячется в данных — нужно раскрыть скрытые слои.",
    psychology: "Трейдеры попадаются потому что пробой выглядит УБЕДИТЕЛЬНО. Всё кричит 'входи'. Жадность + недостаток терпения. Хочется быть в рынке, а не ждать.",
    realMarket: "На реальном рынке: BTC пробивает $70K, все кричат 'новый ATH', объём выглядит нормальным. Но дневная свеча закрывается ниже — и начинается -15% коррекция.",
    expectedMistakes: ["Fake Breakout Entry", "Ignored Volume", "Single Timeframe Trap"],
    counterCards: ["Volume Confirmation", "Breakout Confirmation", "MTF Alignment"],
    weakSkills: ["Chart Reading", "Timing", "Volatility Assessment"],
    keyData: ["Volume", "Open Interest", "Multi-Timeframe"],
    axes: { infoDensity: 55, timePressure: 40, emotionalIntensity: 35, trapSophistication: 70, consequenceWeight: 45, uncertaintyLevel: 60 },
    loreSnippet: "First documented during the 2021 Bitcoin 'Elon pump'. Witnesses reported: breakout looked real, volume was high, green candles were endless. Then the Phantom revealed itself. -22% in 4 hours. 'The pattern was perfect,' survivors say. 'Too perfect.'",
    unlockRank: 0,
  },
  {
    id: "rug-pull-phantom", name: "Rug Pull Phantom", nameRu: "Фантом Rug Pull", title: "Phantom",
    archetype: "phantom", discipline: "security", threatLevel: "CRITICAL", corruption: 95, glyph: "🪝",
    description: "Выглядит дружелюбно. Предлагает 10000% APY. Улыбается верифицированным контрактом. Когда ты наконец пытаешься выйти, показывает истинную форму: 'Function transfer() restricted. Liquidity withdrawn 3 minutes ago.'",
    manifestDesc: "В бою: контракт выглядит проверенным, ликвидность якобы заблокирована. Но Admin Function Scanner показывает скрытые права mint. Phantom прячется в деталях контракта.",
    psychology: "Жадность + доверие к 'аудиту'. Люди думают: 'CertiK проверил — значит безопасно'. Но аудит не покрывает все векторы. Phantom использует слепые пятна.",
    realMarket: "Реальный рынок: проект с 'аудитом', ликвидность 'заблокирована'. Через 72 часа после запуска — deployer вытаскивает $2M через скрытую функцию. 'Но ведь аудит был!' — не покрывал upgradeable proxy.",
    expectedMistakes: ["No Contract Verification", "Unchecked Liquidity", "Mint Authority Risk"],
    counterCards: ["Contract Verification Check", "Liquidity Lock Verify", "Admin Function Scanner"],
    weakSkills: ["Smart Contract Audit", "Liquidity Evaluation"],
    keyData: ["Contract Security Scan", "Liquidity Status", "Holder Distribution"],
    axes: { infoDensity: 85, timePressure: 50, emotionalIntensity: 55, trapSophistication: 90, consequenceWeight: 98, uncertaintyLevel: 70 },
    loreSnippet: "Одним весенним утром 2022 года токен $SQUID вырос на 45000%. Создатели улыбались. Верифицированный контракт сиял на BSCScan. Инвесторы праздновали. Затем кнопка 'Sell' превратилась в тыкву. GAME OVER.",
    unlockRank: 5,
  },
  // ── WRAITHS (3) ──
  {
    id: "fomo-wraith", name: "FOMO Wraith", nameRu: "Wraith Упущенной Выгоды", title: "Wraith",
    archetype: "wraith", discipline: "psychology", threatLevel: "HIGH", corruption: 82, glyph: "💀",
    description: "Питается страхом упустить прибыль. Шепчет 'все покупают, а ты нет'. Чем дольше ждёшь — тем сильнее давление. Пик эйфории — его время кормления.",
    manifestDesc: "В бою: зелёные свечи одна за другой, Social Sentiment 95% bullish, таймер давит. FOMO Wraith нашёптывает через каждый data source. Discipline Shield — единственная защита.",
    psychology: "FOMO — базовая эмоция. Видишь, как другие зарабатывают. Кажется, что ты теряешь деньги, просто ничего не делая. Wraith превращает рациональное 'подождать' в мучительное.",
    realMarket: "Реальный рынок: Dogecoin +400% за неделю. Твиттер в огне. Друзья хвастаются профитом. Ты покупаешь на вершине. Через 3 дня -60%.",
    expectedMistakes: ["FOMO Entry", "Late Entry", "Herd Following"],
    counterCards: ["Don't Chase Green", "Anti-FOMO Shield", "Wait for Retest"],
    weakSkills: ["FOMO Resistance", "Discipline", "Timing"],
    keyData: ["Social Sentiment", "Funding Rate"],
    axes: { infoDensity: 30, timePressure: 80, emotionalIntensity: 95, trapSophistication: 50, consequenceWeight: 55, uncertaintyLevel: 40 },
    loreSnippet: "First spotted during the 2021 Dogecoin rally. Witnesses report hearing whispers: 'Everyone's buying... you're missing out... it's going to $10...' Those who listened bought the top. The Wraith fed well that spring.",
    unlockRank: 0,
  },
  {
    id: "loss-aversion-wraith", name: "Loss Aversion Wraith", nameRu: "Wraith Страха Убытка", title: "Wraith",
    archetype: "wraith", discipline: "psychology", threatLevel: "HIGH", corruption: 75, glyph: "💀",
    description: "Парализует страхом признания убытка. Заставляет держать падающую позицию, сдвигать стопы, верить что 'развернётся'. Маленький убыток становится катастрофическим.",
    manifestDesc: "Позиция -5%. Разум говорит 'закрой'. Wraith шепчет 'ещё чуть-чуть'. -8%. 'Ну уже поздно'. -15%. Wraith пирует.",
    psychology: "Loss aversion: потеря $100 ощущается в 2.5 раза сильнее чем радость от заработка $100. Мозг готов на всё чтобы избежать фиксации убытка. Даже на больший убыток.",
    realMarket: "LUNA, май 2022. $80 → $60: 'отскочит'. $60 → $30: 'ну уже дно'. $30 → $0.0001: 'я держу до нуля из принципа'.",
    expectedMistakes: ["Disposition Effect", "Anchoring", "Sunk Cost Fallacy", "Endowment Effect"],
    counterCards: ["Stop-Loss Discipline", "Risk/Reward", "Liquidity Sweep"],
    weakSkills: ["Risk Management", "Discipline", "Adaptability"],
    keyData: ["Chart", "Volume"],
    axes: { infoDensity: 25, timePressure: 60, emotionalIntensity: 90, trapSophistication: 45, consequenceWeight: 75, uncertaintyLevel: 35 },
    loreSnippet: "LUNA, май 2022. Цена: $80. Wraith: 'Отскочит.' $60. 'Дно близко.' $30. 'Продавать поздно.' $0.0001. Wraith: 'Я же говорил.'",
    unlockRank: 3,
  },
  {
    id: "revenge-wraith", name: "Revenge Wraith", nameRu: "Wraith Отыгрыша", title: "Wraith",
    archetype: "wraith", discipline: "psychology", threatLevel: "MEDIUM", corruption: 68, glyph: "💀",
    description: "Нападает после убытка. Толкает к немедленному открытию сделки хаотичным объёмом без анализа. 'Верни потерянное. Прямо сейчас.' Тильт в чистом виде.",
    manifestDesc: "Ты только что получил стоп. Эмоции кипят. Рука тянется открыть новую сделку. Wraith уже здесь — предлагает 'верный сетап'. Без анализа. Без стопа.",
    psychology: "После поражения мозг хочет 'отыграться'. Это эволюционный механизм. Но на рынке он убивает. Каждая revenge-сделка в среднем хуже предыдущей.",
    realMarket: "Трейдер теряет $500 на шорте. Открывает лонг на $1000 'чтобы вернуть'. Теряет ещё $800. Открывает шорт на $2000. Теряет всё.",
    expectedMistakes: ["Revenge Trading", "Inflexible Sizing", "Stop Widening"],
    counterCards: ["Anti-FOMO Shield", "Stop-Loss Discipline", "Pre-trade Checklist"],
    weakSkills: ["Discipline", "FOMO Resistance", "Position Sizing"],
    keyData: ["Все (проблема в состоянии)"],
    axes: { infoDensity: 20, timePressure: 75, emotionalIntensity: 98, trapSophistication: 30, consequenceWeight: 65, uncertaintyLevel: 25 },
    loreSnippet: "Каждый опытный трейдер знает: худшие сделки совершаются сразу после стоп-лосса. Не потому что рынок изменился. А потому что ты изменился.",
    unlockRank: 9,
  },
  // ── TITANS (2) ──
  {
    id: "headline-titan", name: "Headline Titan", nameRu: "Титан Заголовков", title: "Titan",
    archetype: "titan", discipline: "fundamental", threatLevel: "CRITICAL", corruption: 92, glyph: "⛰️",
    description: "Внезапный новостной шок. Обрушивает волну паники на рынок. Нельзя игнорировать — но и реагировать импульсивно — фатально.",
    manifestDesc: "Breaking News: 'SEC sues major exchange'. Рынок падает -18% за 15 минут. Titan давит. Каждое решение под экстремальным давлением времени.",
    psychology: "Паника заразна. Когда все бегут, инстинкт говорит 'беги'. Но профессионалы знают: первая реакция рынка на новости — часто ошибочна.",
    realMarket: "FTX collapse, ноябрь 2022. Заголовки: 'FTX insolvent'. Биткоин -25% за день. Паника тотальная. Те, кто сохранили дисциплину — купили дно.",
    expectedMistakes: ["News Overreaction", "Sentiment Blindness", "Regulatory Blind Spot"],
    counterCards: ["Event-Driven Setup", "Macro Catalyst", "Stop-Loss Discipline"],
    weakSkills: ["News Analysis", "Macro Awareness", "Adaptability"],
    keyData: ["News Feed", "AI Summary", "Macro Calendar"],
    axes: { infoDensity: 65, timePressure: 95, emotionalIntensity: 90, trapSophistication: 45, consequenceWeight: 92, uncertaintyLevel: 80 },
    loreSnippet: "Ноябрь 2022. Заголовок: 'Binance отказывается от покупки FTX'. Через 48 часов $32 миллиарда рыночной стоимости исчезли. Headline Titan покормился. Сэм сидит в тюрьме. Трейдеры, сохранившие дисциплину, купили дешёвый биткоин.",
    unlockRank: 6,
  },
  {
    id: "unlock-titan", name: "Unlock Titan", nameRu: "Титан Разблокировки", title: "Titan",
    archetype: "titan", discipline: "fundamental", threatLevel: "HIGH", corruption: 70, glyph: "⛰️",
    description: "Лавина продаж от массовой разблокировки токенов VC и команды. Медленное, предсказуемое, неумолимое. Все делают вид что его нет — пока не становится поздно.",
    manifestDesc: "Ты видишь: проект хорош, график силён. Но календарь показывает: через 3 дня анлок 15% supply. Titan надвигается. Вопрос: ты готов?",
    psychology: "Игнорирование неприятной информации. 'Ну анлок — и что? Проект же хороший.' Классический confirmation bias. Titan наказывает за игнорирование.",
    realMarket: "Arbitrum, март 2024. Анлок $2.3B токенов. Цена -40% за 2 недели. Все знали дату. Никто не хотел верить.",
    expectedMistakes: ["Tokenomics Neglect", "Governance Blindness", "Revenue vs Narrative"],
    counterCards: ["Token Unlock Warning", "Governance Risk", "Protocol Revenue Check"],
    weakSkills: ["Tokenomics", "On-chain Logic", "Probability Thinking"],
    keyData: ["Token Unlocks", "On-chain Flow"],
    axes: { infoDensity: 45, timePressure: 65, emotionalIntensity: 60, trapSophistication: 55, consequenceWeight: 90, uncertaintyLevel: 50 },
    loreSnippet: "Arbitrum, март 2024. Календарь показывал анлок $2.3B за 3 месяца. Все видели. Никто не верил. Цена: -40% за 2 недели. Titan не прощает игнорирования.",
    unlockRank: 6,
  },
  // ── HYDRA (1) ──
  {
    id: "liquidity-hydra", name: "Liquidity Hydra", nameRu: "Гидра Ликвидности", title: "Hydra",
    archetype: "hydra", discipline: "derivatives", threatLevel: "HIGH", corruption: 76, glyph: "🐍",
    description: "Каскадный сбор стоп-ордеров толпы. 'Отрубил одну голову — выросли две'. Сдвинул стоп? Рынок пошёл за ним. Поставил новый? Снесли и его.",
    manifestDesc: "Цена подходит к твоему стопу. Ты сдвигаешь с -3% на -5%. Цена идёт к -5%. Сдвигаешь на -8%. Гидра смеётся — каждая новая голова ближе к ликвидации.",
    psychology: "Сдвиг стопа кажется 'разумным': 'ну рынок шумный, дай больше пространства'. Но каждое расширение стопа — это увеличение риска. Hydra эксплуатирует нашу нелюбовь к маленьким потерям.",
    realMarket: "Трейдер: стоп на -2%. Цена: пробила. 'Поставлю -4%'. Пробила. '-6%'. Ликвидация. Цена развернулась +15% сразу после.",
    expectedMistakes: ["Stop Widening", "Correlated Exposure", "Volatility Blindness"],
    counterCards: ["Liquidity Sweep", "Volatility Compression", "Options Gamma Zone"],
    weakSkills: ["Liquidity Awareness", "Risk Management", "Volatility Assessment"],
    keyData: ["On-chain Flow", "Volume"],
    axes: { infoDensity: 50, timePressure: 60, emotionalIntensity: 55, trapSophistication: 75, consequenceWeight: 70, uncertaintyLevel: 65 },
    loreSnippet: "-2%. Сдвинул на -4%. -4%. Сдвинул на -6%. -6%. Гидра: 'Поставь -10%, я не дойду.' Дошла. Цена развернулась +20% через 3 минуты.",
    unlockRank: 3,
  },
  // ── CULTS (2) ──
  {
    id: "indicator-cult", name: "Indicator Cult", nameRu: "Культ Индикаторов", title: "Cult",
    archetype: "cult", discipline: "ta", threatLevel: "MEDIUM", corruption: 65, glyph: "🕯️",
    description: "Заражает верой в индикаторы как религию. 'Добавь ещё один и станет яснее.' Но каждый новый индикатор не проясняет, а запутывает. Analysis paralysis.",
    manifestDesc: "Ты открываешь RSI. Потом MACD. Потом Stochastic. Bollinger Bands. EMA 50, 100, 200. 14 индикаторов на экране. Cult шепчет: 'Ещё один, и картина станет ясной.' Картина не становится.",
    psychology: "Желание определённости. 'Если я добавлю достаточно инструментов, я увижу истину.' Но рынок хаотичен. Индикаторы — карта, не территория.",
    realMarket: "Новичок открывает TradingView. Добавляет 8 индикаторов. Сигналы противоречат друг другу. Паралич анализа. Сделка не открыта. Движение упущено.",
    expectedMistakes: ["Indicator Overload", "Analysis Paralysis"],
    counterCards: ["Trend Check", "Support/Resistance", "Candle Pattern Reading"],
    weakSkills: ["Chart Reading", "Probability Thinking"],
    keyData: ["Chart", "Volume"],
    axes: { infoDensity: 75, timePressure: 35, emotionalIntensity: 40, trapSophistication: 50, consequenceWeight: 30, uncertaintyLevel: 70 },
    loreSnippet: "Некоторые трейдеры верят: если добавить 15-й индикатор — рынок раскроет секрет. Cult знает правду: 15 индикаторов = 15 противоречащих сигналов = 0 сделок.",
    unlockRank: 6,
  },
  {
    id: "confirmation-cult", name: "Confirmation Bias Cult", nameRu: "Культ Подтверждения", title: "Cult",
    archetype: "cult", discipline: "psychology", threatLevel: "MEDIUM", corruption: 72, glyph: "🕯️",
    description: "Сектантская вера в правоту своей позиции. Игрок видит ТОЛЬКО подтверждающую информацию. Опровергающие данные? 'Это шум.' 'Это исключение.' 'Это FUD.'",
    manifestDesc: "Ты в лонге. Cult услужливо подсовывает: бычьи твиты, зелёные свечи на 15m, 'аналитиков' с целями $100K BTC. Медвежьи аргументы? Cult их прячет. Ты их не ищешь.",
    psychology: "Мозг ненавидит быть неправым. Когда у тебя есть позиция, ты бессознательно ищешь её подтверждения. Cult institutionalises этот bias.",
    realMarket: "Трейдер в лонге. Читает только bullish аналитику. Игнорирует растущий funding rate и negative divergence. 'Рынок просто не понимает.' Нет, рынок понимает.",
    expectedMistakes: ["Confirmation Bias", "Gambler's Fallacy", "Herd Following"],
    counterCards: ["Devil's Advocate", "On-chain Divergence", "Macro Catalyst"],
    weakSkills: ["Narrative Detection", "Probability Thinking", "Adaptability"],
    keyData: ["On-chain Flow", "Macro Calendar"],
    axes: { infoDensity: 35, timePressure: 30, emotionalIntensity: 65, trapSophistication: 55, consequenceWeight: 50, uncertaintyLevel: 70 },
    loreSnippet: "Трейдер: 'Я в лонге, поэтому читаю только bullish.' Cult: 'Правильно. Медвежьи аргументы — FUD. Ты умнее рынка.' Цена: -40%. Cult: 'Это коррекция. Докупай.'",
    unlockRank: 9,
  },
  // ── MIMIC (1) ──
  {
    id: "honeypot-mimic", name: "Honeypot Mimic", nameRu: "Мимик Honeypot", title: "Mimic",
    archetype: "mimic", discipline: "security", threatLevel: "CRITICAL", corruption: 95, glyph: "🎭",
    description: "Смарт-контракт, притворяющийся алмазом. Демонстрирует идеальный рост без падений. Купить можно. Продать — нельзя. 'Кнопка Sell была декоративной.'",
    manifestDesc: "График: только вверх. Объём: есть. Контракт: верифицирован. Но Security Scan показывает: есть скрытая функция setTax(). 99% — при продаже.",
    psychology: "Жадность + недостаток due diligence. 'Растёт же! Чего проверять?' Именно этого Mimic и ждёт. Самая опасная ловушка для самоуверенных.",
    realMarket: "Токен на DEX: только зелёные свечи. $100 → $1000 → $5000. Ты покупаешь на $5000. Пытаешься продать. Транзакция revert. 'Sell tax: 99%.' Добро пожаловать.",
    expectedMistakes: ["Honeypot Blindness", "Proxy Blindness", "Fake Audit Trust"],
    counterCards: ["Honeypot Test", "Proxy Pattern Detector", "Admin Function Scanner"],
    weakSkills: ["Smart Contract Audit", "Centralization & Governance Risk"],
    keyData: ["Contract Security Scan", "Holder Distribution"],
    axes: { infoDensity: 85, timePressure: 50, emotionalIntensity: 60, trapSophistication: 95, consequenceWeight: 98, uncertaintyLevel: 70 },
    loreSnippet: "Кнопка BUY работала идеально. Кнопка SELL... 'Transaction reverted'. Mimic: 'Какая кнопка продажи? Здесь только вход. Добро пожаловать навсегда.'",
    unlockRank: 5,
  },
  // ── SIREN (1) ──
  {
    id: "narrative-siren", name: "Narrative Siren", nameRu: "Сирена Нарратива", title: "Siren",
    archetype: "siren", discipline: "fundamental", threatLevel: "MEDIUM", corruption: 68, glyph: "🧜",
    description: "Поёт сладкую песню о будущем проекта. 'Это новый Ethereum.' 'Революция в DeFi.' 'Команда из Google и MIT.' История прекрасна. Данные — не очень.",
    manifestDesc: "Каждый data source шепчет историей. Красивой. Убедительной. Но On-chain Divergence показывает: revenue = $0, users = боты, TVL = накрутка. Siren не любит когда смотрят данные.",
    psychology: "Люди верят историям. Это evolutionary. Нарратив 'революционная технология' активирует те же зоны мозга что и религиозный опыт. Siren использует это.",
    realMarket: "2021: 'ICP — это новый интернет.' $700 → $5. 2022: 'LUNA — будущее stablecoins.' $120 → $0. 2023: 'Hamster Kombat — Web3 gaming revolution.' Иди потапай своего хомячка.",
    expectedMistakes: ["Narrative Blindness", "Narrative Attachment", "Signal/Noise Confusion"],
    counterCards: ["Narrative Rotation", "Reflexivity Trap", "On-chain Divergence"],
    weakSkills: ["Narrative Detection", "News Analysis", "Adaptability"],
    keyData: ["Social Sentiment", "News Feed", "On-chain Flow"],
    axes: { infoDensity: 40, timePressure: 55, emotionalIntensity: 88, trapSophistication: 55, consequenceWeight: 55, uncertaintyLevel: 60 },
    loreSnippet: "2021: 'ICP — это новый интернет.' $700. Сегодня: $5. 2022: 'LUNA — будущее stablecoins.' $120. Сегодня: $0.0001. 2023: 'Хомяк в Telegram — Web3 revolution.' Потапай своего хомячка.",
    unlockRank: 6,
  },
  // ── GOBLIN (1) ──
  {
    id: "leverage-goblin", name: "Leverage Goblin", nameRu: "Гоблин Плеча", title: "Goblin",
    archetype: "goblin", discipline: "derivatives", threatLevel: "HIGH", corruption: 80, glyph: "👺",
    description: "Предлагает сделку: 'Умножь прибыль. 5x — это безопасно. 10x — для уверенных. 100x — для избранных.' Цена сделки: ликвидация при -1.5% движении против тебя.",
    manifestDesc: "Сетап идеален. Уверенность 9/10. Goblin: 'Всё подтверждено. Почему бы не взять 20x? Ты заслужил.' Стоп ставится. Но 20x означает ликвидацию при -4.5%.",
    psychology: "Goblin эксплуатирует overconfidence после серии побед и желание 'максимизировать'. Маленький риск × большое плечо = большой риск. Но мозг видит только первую часть.",
    realMarket: "Трейдер: 6 побед подряд. Следующий сетап: 'уверен на 100%'. Плечо: 25x. Движение: -3.5%. Ликвидация. 'Но направление было верным!' Goblin: 'Плечо было неверным.'",
    expectedMistakes: ["Overleverage", "Oversized Risk", "No Stop-Loss"],
    counterCards: ["Risk/Reward", "Stop-Loss Discipline", "Funding Heat"],
    weakSkills: ["Risk Management", "Position Sizing", "Discipline"],
    keyData: ["Funding Rate", "Open Interest"],
    axes: { infoDensity: 40, timePressure: 55, emotionalIntensity: 70, trapSophistication: 60, consequenceWeight: 88, uncertaintyLevel: 55 },
    loreSnippet: "Сетап был верным. Направление было верным. Плечо 25x было ошибкой. Goblin улыбается: 'Я не врал про прибыль. Я умолчал про ликвидацию.'",
    unlockRank: 3,
  },
  // ── MIRAGE (1) ──
  {
    id: "meme-mirage", name: "Meme Mirage", nameRu: "Мираж Мема", title: "Mirage",
    archetype: "mirage", discipline: "ta", threatLevel: "MEDIUM", corruption: 55, glyph: "🌫️",
    description: "Создаёт иллюзию паттерна там, где его нет. Три случайные свечи. Твой мозг: 'Это голова и плечи!' Mirage: 'Да, продолжай...'",
    manifestDesc: "Ты смотришь на график. Видишь: паттерн. Уверен. Mirage кивает. Но Volume Confirmation показывает: объёма нет. Структуры нет. Только три случайные свечи и твоё воображение.",
    psychology: "Apophenia — склонность видеть паттерны в случайных данных. Мозг для этого evolved. Mirage — не враг, а отражение твоего собственного желания найти meaning в noise.",
    realMarket: "Каждый день трейдеры видят 'паттерны' на случайных графиках. Head & Shoulders на 5-минутном таймфрейме. 'Треугольник' из трёх тиков. Mirage кормится верой.",
    expectedMistakes: ["Pattern Forcing", "Signal/Noise Confusion", "Range/Trend Confusion"],
    counterCards: ["Trend Check", "Volatility Compression", "Narrative Rotation"],
    weakSkills: ["Chart Reading", "Narrative Detection", "Probability Thinking"],
    keyData: ["News Feed", "Social Sentiment"],
    axes: { infoDensity: 30, timePressure: 25, emotionalIntensity: 30, trapSophistication: 65, consequenceWeight: 30, uncertaintyLevel: 85 },
    loreSnippet: "Три случайные свечи. Мозг: 'Head & Shoulders!' Mirage: 'Бери шорт, я подтверждаю.' Стоп: снесён. Mirage: 'Сорри, это был не паттерн. Это были просто свечи.'",
    unlockRank: 0,
  },
  // ── SYNDICATES (2) ──
  {
    id: "whale-syndicate", name: "Whale Syndicate", nameRu: "Синдикат Китов", title: "Syndicate",
    archetype: "syndicate", discipline: "fundamental", threatLevel: "HIGH", corruption: 78, glyph: "🕴️",
    description: "Организованные манипуляции крупным капиталом. Спуфинг, wash trading, coordinated dumps. Действуют согласованно через 47 промежуточных кошельков. Ты не видишь связей — они на это рассчитывают.",
    manifestDesc: "Цена растёт. Объём огромный. 'Киты заходят!' Но Wallet Cluster Map показывает: 8 адресов = 1 entity. Это не накопление. Это distribution перед дампом.",
    psychology: "Желание следовать за 'умными деньгами'. Если кит покупает — я тоже. Но Syndicate знает, что ты смотришь. И рисует картину специально для тебя.",
    realMarket: "Адрес кита покупает на $5M. Толпа: 'КИТ ЗАХОДИТ!!!' Покупают. Цена растёт. Кит продаёт через 12 других кошельков на +15%. Толпа держит падающий нож.",
    expectedMistakes: ["On-chain Ignorance", "Macro Blindness", "Narrative Blindness"],
    counterCards: ["Whale Alert", "Exchange Reserve Shift", "Stablecoin Flow"],
    weakSkills: ["On-chain Logic", "Macro Awareness", "Liquidity Awareness"],
    keyData: ["On-chain Flow", "Macro Calendar"],
    axes: { infoDensity: 80, timePressure: 40, emotionalIntensity: 45, trapSophistication: 85, consequenceWeight: 75, uncertaintyLevel: 65 },
    loreSnippet: "Кошелёк 'кита' купил на $10M. Твиттер: 'Smart money заходит!' Толпа: покупает. Цена: +25%. Кит: продаёт через 23 других кошелька. Толпа: 'Почему я в -40%?' Syndicate: 'Потому что ты exit liquidity.'",
    unlockRank: 6,
  },
  {
    id: "insider-syndicate", name: "Insider Syndicate", nameRu: "Синдикат Инсайдеров", title: "Syndicate",
    archetype: "syndicate", discipline: "security", threatLevel: "CRITICAL", corruption: 88, glyph: "🕴️",
    description: "Команда с добрыми лицами и скрытыми admin keys. Multisig 5/8 выглядит децентрализованно — но 5 подписантов связаны. Timelock 24h — слишком короткий для реакции. Всё выглядит легитимно. Всё — ложь.",
    manifestDesc: "В бою: команда doxxed, multisig, timelock, аудит пройден. Всё чисто. Но Wallet Cluster Map + Multisig Audit показывают: 5 'независимых' подписантов делят офис.",
    psychology: "Мы верим лицам. 'У них LinkedIn! Они не могут быть скамерами.' Но LinkedIn не заменяет on-chain audit. Syndicate использует social proof как дымовую завесу.",
    realMarket: "Проект: команда на сайте с фото, LinkedIn, 'опыт в Google'. Multisig 5/8. Timelock 24h. Реальность: 5 ключей у CEO, timelock слишком короткий, $5M выведено за выходные.",
    expectedMistakes: ["Ignoring Admin Functions", "Team Anonymity Risk", "Social Proof Fallacy"],
    counterCards: ["Admin Function Scanner", "Multisig & Timelock Audit", "Wallet Cluster Map"],
    weakSkills: ["Centralization & Governance Risk", "Smart Contract Audit"],
    keyData: ["Contract Security Scan", "Holder Distribution"],
    axes: { infoDensity: 80, timePressure: 35, emotionalIntensity: 45, trapSophistication: 90, consequenceWeight: 92, uncertaintyLevel: 60 },
    loreSnippet: "Команда: фото, LinkedIn, 'ex-Google'. Multisig: 5/8. Timelock: 24h. Реальность: CEO владеет 5 ключами. Timelock короче чем выходные. $8M выведено. LinkedIn аккаунты удалены.",
    unlockRank: 9,
  },
  // ── DRAGON (1) ──
  {
    id: "hubris-dragon", name: "Hubris Dragon", nameRu: "Дракон Гордыни", title: "Dragon",
    archetype: "dragon", discipline: "psychology", threatLevel: "HIGH", corruption: 70, glyph: "🐉",
    description: "Единственная сущность, которая РАСТЁТ с твоими победами. 3 победы — Dragon маленький. 10 побед — Dragon взрослый. 50 побед — Dragon огромный. Серия побед → самоуверенность → увеличение риска → капитуляция.",
    manifestDesc: "Ты выиграл 8 раз подряд. Уверенность: 100%. Position size: ×3 от обычного. Dragon вырос. Он ждал именно этого момента. Проверка: сможешь ли ты сохранить дисциплину когда уверен что непобедим?",
    psychology: "После серии побед мозг переоценивает свои способности. 'Я понял рынок.' Нет. Тебе повезло, и ты принял удачу за скилл. Dragon питается этим самообманом.",
    realMarket: "Трейдер делает +400% за 3 месяца. Уверенность: 'Я гений.' Увеличивает риски ×5. Одна чёрная неделя: -90%. Dragon: 'Я же говорил.'",
    expectedMistakes: ["Overconfidence", "Self-Attribution Bias", "Hindsight Bias"],
    counterCards: ["Risk/Reward", "Stop-Loss Discipline", "Pre-trade Checklist"],
    weakSkills: ["Discipline", "Probability Thinking", "Risk Management"],
    keyData: ["Open Interest", "Funding Rate"],
    axes: { infoDensity: 30, timePressure: 50, emotionalIntensity: 85, trapSophistication: 70, consequenceWeight: 90, uncertaintyLevel: 60 },
    loreSnippet: "10 побед подряд. Уверенность: безгранична. Position size: ×5. Dragon: 'Ты непобедим.' Рынок: 'Держу пиво.' Следующие 3 сделки: -70% депозита. Dragon сыт.",
    unlockRank: 9,
  },
  // ── PARASITE (1) ──
  {
    id: "token-parasite", name: "Token Parasite", nameRu: "Паразит Токена", title: "Parasite",
    archetype: "parasite", discipline: "security", threatLevel: "MEDIUM", corruption: 65, glyph: "🪱",
    description: "Медленно высасывает средства через структуру токена. Team allocation 40% без вестинга. Топ-10 кошельков владеют 89%. Паразит не убивает быстро — он истощает медленно, незаметно.",
    manifestDesc: "Проект выглядит нормально. Но Holder Distribution показывает: команда без вестинга, концентрация 89%. Паразит ест твои инвестиции по 1% в день через скрытые sell-offs.",
    psychology: "Смерть от тысячи порезов. Каждый день -1% не пугает. Но за год: -97%. Паразит использует нашу неспособность воспринимать медленные угрозы.",
    realMarket: "Токен: цена стабильна... почти. -1% сегодня. -0.5% завтра. За месяц -20%. 'Рынок в целом падает.' Нет. Это команда медленно выходит через 15 кошельков.",
    expectedMistakes: ["Vesting Neglect", "Wallet Concentration Ignorance", "Thin Liquidity Blindness"],
    counterCards: ["Token Distribution Analyzer", "Vesting Schedule Decoder", "Liquidity Lock Verify"],
    weakSkills: ["Token Distribution Analysis", "Liquidity Evaluation"],
    keyData: ["Holder Distribution", "Liquidity Status"],
    axes: { infoDensity: 70, timePressure: 25, emotionalIntensity: 30, trapSophistication: 80, consequenceWeight: 60, uncertaintyLevel: 50 },
    loreSnippet: "-1% сегодня. -0.8% завтра. -1.2% послезавтра. Через месяц: -25%. 'Коррекция рынка.' Нет. Это команда медленно выходит через 15 кошельков. Паразит не торопится.",
    unlockRank: 9,
  },
];

// ── TERMINAL VOICE COMMENTARY (§32) ──
export interface TerminalComment {
  layer1: string; // Factual (2-5 words)
  layer2: string; // Voice (5-12 words, dry wit)
  layer3: string; // Professional explanation (2-4 sentences)
  icon: "✓" | "✗" | "⚠" | "◆";
}
export const TERMINAL_VOICE: Record<string, TerminalComment[]> = {
  "fomo-entry-defeat": [
    { icon: "✗", layer1: "✗ Late Entry Executed", layer2: "Social pressure peaked. You entered. Price peaked 2 minutes later.", layer3: "Вход после +40% движения за 6 часов на фоне эйфории в соцсетях. Объём был повышен но снижался (дивергенция). Оптимальный вход: -18% ниже, на ретесте консолидации. FOMO Wraith Level 62." },
    { icon: "✗", layer1: "✗ FOMO Entry Confirmed", layer2: "Everyone was buying. You joined last. Exit liquidity provided.", layer3: "Social Sentiment: 87% bullish. Funding: +0.09%. Классический сигнал перегрева. Ты купил когда все уже купили. Выходная ликвидность." },
    { icon: "✗", layer1: "✗ Chased Green Candle", layer2: "Green candles looked infinite. Reversion looked inevitable. It was.", layer3: "Параболический рост без фундаментальных катализаторов. Вероятность продолжения: <15%. Вероятность коррекции: >85%. Зелёная свеча манит, но за ней — обрыв." },
  ],
  "leverage-defeat": [
    { icon: "✗", layer1: "✗ Position Liquidated", layer2: "The Goblin's deal was attractive. The liquidation price wasn't.", layer3: "Плечо 15x при волатильности 4%. Ликвидация при -6.7%. Сетап был верен, направление верно. Но плечо превратило winning trade в survival bet." },
  ],
  "stop-loss-success": [
    { icon: "✓", layer1: "✓ Risk Management Applied", layer2: "Stop hit -2.1%. Position closed. No hesitation, no second-guessing.", layer3: "Стоп размещён на уровне инвалидации (-2% ниже структуры). Цена пробила — выход. Дисциплина сохранена. Это профессионализм." },
  ],
  "fomo-resisted": [
    { icon: "✓", layer1: "✓ FOMO Resisted", layer2: "The green candles screamed. You waited. Rare discipline.", layer3: "Ты не вошёл на импульсе. Дождался ретеста. Сохранил депозит. FOMO Wraith остался голодным." },
  ],
  "honeypot-detected": [
    { icon: "✓", layer1: "✓ Honeypot Detected", layer2: "Contract said 'welcome'. You checked the exit. Smart.", layer3: "Тестовая транзакция выявила sell tax 99%. Вход отменён. Средства сохранены. Mimic не прошёл." },
  ],
};

// ── SKILL CARDS ──
export interface SkillCard {
  id: string; nameEn: string; nameRu: string; tier: 1|2|3; rarity: Rarity; cost: number;
  discipline: Discipline; glyph: string; category: string; effect: string; flavor: string;
  owned: boolean;
}
export const CARDS: SkillCard[] = [
  { id: "trend-check", nameEn: "Trend Check", nameRu: "Trend Check", tier: 1, rarity: "common", cost: 1, discipline: "ta", glyph: "📈", category: "chart", effect: "Определи направление тренда на старшем ТФ.", flavor: "Торгуй с рекой, не против неё.", owned: true },
  { id: "support-resistance", nameEn: "Support / Resistance", nameRu: "Support / Resistance", tier: 1, rarity: "common", cost: 1, discipline: "ta", glyph: "🧱", category: "chart", effect: "Найди зоны где цена разворачивалась ранее.", flavor: "Память рынка, нарисованная линиями.", owned: true },
  { id: "volume-confirm", nameEn: "Volume Confirmation", nameRu: "Volume Confirmation", tier: 1, rarity: "common", cost: 1, discipline: "ta", glyph: "📊", category: "chart", effect: "Проверь пробой реальным объёмом.", flavor: "Нет объёма — нет убеждения.", owned: true },
  { id: "candle-pattern", nameEn: "Candle Pattern Reading", nameRu: "Candle Pattern Reading", tier: 1, rarity: "common", cost: 1, discipline: "ta", glyph: "🕯️", category: "chart", effect: "Читай одиночные и множественные паттерны.", flavor: "Каждая свеча — история борьбы.", owned: true },
  { id: "risk-reward", nameEn: "Risk / Reward", nameRu: "Risk / Reward", tier: 1, rarity: "rare", cost: 1, discipline: "derivatives", glyph: "⚖️", category: "risk", effect: "Оцени R:R до входа в сделку.", flavor: "Единственный край, который складывается.", owned: true },
  { id: "stop-discipline", nameEn: "Stop-Loss Discipline", nameRu: "Stop-Loss Discipline", tier: 1, rarity: "rare", cost: 1, discipline: "derivatives", glyph: "🛑", category: "risk", effect: "Никогда не входи без стоп-лосса.", flavor: "Где твоя идея доказуемо неверна.", owned: true },
  { id: "dont-chase", nameEn: "Don't Chase Green", nameRu: "Don't Chase Green", tier: 1, rarity: "epic", cost: 1, discipline: "psychology", glyph: "🟢", category: "psych", effect: "Блокирует входы после истощённого импульса.", flavor: "Свеча горяча. Твои руки — нет.", owned: true },
  { id: "anti-fomo", nameEn: "Anti-FOMO Shield", nameRu: "Anti-FOMO Shield", tier: 1, rarity: "epic", cost: 1, discipline: "psychology", glyph: "🛡️", category: "psych", effect: "Щит от импульсивных решений под давлением.", flavor: "Зелёная свеча кричит. Щит молчит.", owned: false },
  { id: "wait-retest", nameEn: "Wait for Retest", nameRu: "Wait for Retest", tier: 1, rarity: "rare", cost: 1, discipline: "ta", glyph: "⏳", category: "chart", effect: "Дождись ретеста уровня перед входом.", flavor: "Первое касание — незнакомец. Ретест — друг.", owned: false },
  { id: "funding-heat", nameEn: "Funding Heat", nameRu: "Funding Heat", tier: 2, rarity: "rare", cost: 2, discipline: "derivatives", glyph: "🌡️", category: "deriv", effect: "Показывает перегретый funding rate.", flavor: "Когда лонги платят лонгам — вершина близка.", owned: false },
  { id: "liquidity-sweep", nameEn: "Liquidity Sweep", nameRu: "Liquidity Sweep", tier: 2, rarity: "epic", cost: 2, discipline: "derivatives", glyph: "🌊", category: "deriv", effect: "Выявляет stop-hunt перед разворотом.", flavor: "Цена ныряет чтобы накормить, затем бежит.", owned: false },
  { id: "whale-alert", nameEn: "Whale Alert", nameRu: "Whale Alert", tier: 2, rarity: "epic", cost: 2, discipline: "fundamental", glyph: "🐋", category: "flow", effect: "Флагирует крупные ончейн-переводы.", flavor: "Тень движется раньше цены.", owned: false },
  { id: "token-unlock", nameEn: "Token Unlock Warning", nameRu: "Token Unlock Warning", tier: 2, rarity: "rare", cost: 2, discipline: "fundamental", glyph: "🔓", category: "macro", effect: "Показывает предстоящие анлоки.", flavor: "Предложение, которое не видишь — почувствуешь.", owned: false },
  { id: "devils-advocate", nameEn: "Devil's Advocate", nameRu: "Devil's Advocate", tier: 2, rarity: "epic", cost: 2, discipline: "psychology", glyph: "😈", category: "psych", effect: "Показывает контраргументы к твоему тезису.", flavor: "Твой мозг врёт тебе. Адвокат — нет.", owned: false },
  { id: "honeypot-test", nameEn: "Honeypot Test", nameRu: "Honeypot Test", tier: 3, rarity: "legendary", cost: 3, discipline: "security", glyph: "🔍", category: "flow", effect: "Симулирует buy/sell транзакции.", flavor: "Кнопка BUY есть у всех. SELL — роскошь.", owned: false },
  { id: "admin-scanner", nameEn: "Admin Function Scanner", nameRu: "Admin Scanner", tier: 3, rarity: "legendary", cost: 3, discipline: "security", glyph: "🛡️", category: "flow", effect: "Сканирует опасные функции контракта.", flavor: "Не твой ключ — не твой... контракт.", owned: false },
];

// ── DATA SOURCES ──
export const DATA_SOURCES = [
  { id: "chart", name: "Price Chart", cost: 1, glyph: "📈", disc: "ta" },
  { id: "volume", name: "Volume", cost: 1, glyph: "📊", disc: "ta" },
  { id: "funding", name: "Funding Rate", cost: 1, glyph: "🌡️", disc: "derivatives" },
  { id: "oi", name: "Open Interest", cost: 1, glyph: "📡", disc: "derivatives" },
  { id: "news", name: "News Feed", cost: 1, glyph: "📰", disc: "fundamental" },
  { id: "sentiment", name: "Social Sentiment", cost: 2, glyph: "💬", disc: "psychology" },
  { id: "onchain", name: "On-chain Flow", cost: 2, glyph: "🔗", disc: "fundamental" },
  { id: "unlocks", name: "Token Unlocks", cost: 2, glyph: "🔓", disc: "fundamental" },
  { id: "security", name: "Contract Scan", cost: 2, glyph: "🛡️", disc: "security" },
  { id: "holders", name: "Holder Distribution", cost: 2, glyph: "👥", disc: "security" },
];

// ── MOCK PLAYER ──
export const MOCK_PLAYER = {
  id: "demo", // runtime player always carries an id (from playerState / server profile)
  rankIndex: 4, xp: 1680, attention: 7, maxAttention: 8, disciplineShield: 72, streak: 4,
  winRate: 69, rating: 2098,
  skills: [
    { id: "chart", name: "Chart Reading", value: 78, color: C.signal },
    { id: "risk", name: "Risk Management", value: 62, color: C.long },
    { id: "fomo", name: "FOMO Resistance", value: 48, color: C.short },
    { id: "timing", name: "Timing", value: 66, color: C.signal },
    { id: "discipline", name: "Discipline", value: 52, color: C.short },
    { id: "onchain", name: "On-chain Logic", value: 33, color: C.grape },
    { id: "macro", name: "Macro Awareness", value: 29, color: C.blue },
    { id: "liquidity", name: "Liquidity Awareness", value: 44, color: C.signal },
  ],
  errors: [
    { id: "e1", title: "FOMO Entry", count: 8, status: "improving" as const, domain: "psychology" },
    { id: "e2", title: "No Invalidation", count: 5, status: "active" as const, domain: "risk" },
    { id: "e3", title: "Ignored Volume", count: 3, status: "improving" as const, domain: "ta" },
    { id: "e4", title: "Overconfidence", count: 4, status: "controlled" as const, domain: "psychology" },
  ],
  // Entity encounter history
  entityHistory: {
    "fake-breakout-phantom": { status: "defeated" as EntityStatus, encounters: 12, wins: 8, lastEncounter: "2026-07-01" },
    "meme-mirage": { status: "mastered" as EntityStatus, encounters: 8, wins: 7, lastEncounter: "2026-07-02" },
    "fomo-wraith": { status: "defeated" as EntityStatus, encounters: 15, wins: 9, lastEncounter: "2026-07-03" },
    "leverage-goblin": { status: "encountered" as EntityStatus, encounters: 6, wins: 2, lastEncounter: "2026-06-30" },
    "liquidity-hydra": { status: "encountered" as EntityStatus, encounters: 4, wins: 1, lastEncounter: "2026-06-28" },
    "loss-aversion-wraith": { status: "undiscovered" as EntityStatus, encounters: 0, wins: 0, lastEncounter: null },
  } as Record<string, { status: EntityStatus; encounters: number; wins: number; lastEncounter: string | null }>,
  badges: [
    { id: "b1", name: "Anti-FOMO Shield", glyph: "🛡️", color: C.short, rarity: "epic" as Rarity, earned: true },
    { id: "b2", name: "Candle Reader III", glyph: "🕯️", color: C.signal, rarity: "rare" as Rarity, earned: true },
    { id: "b3", name: "Liquidity Survivor", glyph: "🌊", color: C.long, rarity: "legendary" as Rarity, earned: true },
    { id: "b4", name: "Whale Slayer", glyph: "🐋", color: C.blue, rarity: "legendary" as Rarity, earned: false },
    { id: "b5", name: "Vitalik Mode", glyph: "👑", color: C.grape, rarity: "mythic" as Rarity, earned: false },
  ],
};

// ── SHARE CARDS (viral) ──
export const SHARE_CARDS = [
  { title: "Я победил FOMO Wraith", sub: "Discipline > Impulse", glyph: "💀", color: C.short },
  { title: "Я не купил вершину", sub: "Уже прогресс", glyph: "🏔️", color: C.long },
  { title: "Я пережил ликвидационный каскад", sub: "Risk Management Level 99", glyph: "🌊", color: C.signal },
  { title: "Honeypot Mimic detected", sub: "Кнопка SELL работает", glyph: "🎭", color: C.grape },
  { title: "Иди потапай своего хомячка", sub: "А я пока почитаю контракт", glyph: "🐹", color: C.gold },
  { title: "FTX не повторится", sub: "On-chain audit пройден", glyph: "🔍", color: C.short },
];

// ── TOURNAMENTS ──
export const TOURNAMENTS = [
  { id: "t1", name: "Rookie Candle Cup", tag: "Beginner", level: "Rank 0-2", players: 2140, prize: "500 $SIG", timeLeft: "14:22:10", color: C.long, glyph: "🕯️" },
  { id: "t2", name: "Anti-FOMO Sprint", tag: "Discipline", level: "Rank 3-6", players: 1876, prize: "800 $SIG", timeLeft: "08:41:55", color: C.short, glyph: "🛡️" },
  { id: "t3", name: "Whale Hunt", tag: "On-chain", level: "Rank 5-9", players: 964, prize: "1200 $SIG", timeLeft: "22:05:00", color: C.blue, glyph: "🐋" },
  { id: "t4", name: "Grandmaster Championship", tag: "Elite", level: "Rank 12-14", players: 96, prize: "5000 $SIG", timeLeft: "2d 18h", color: C.short, glyph: "👑" },
];

// ── TICKER ──
export const TICKER = [
  { sym: "BTC", price: "71,842", chg: 2.8 }, { sym: "ETH", price: "3,914", chg: 1.4 },
  { sym: "SOL", price: "184.2", chg: -0.9 }, { sym: "$SIG", price: "0.482", chg: 6.2 },
  { sym: "FUNDING", price: "0.038%", chg: 0.9 }, { sym: "FEAR/GREED", price: "78", chg: 1.5 },
  { sym: "BTC.D", price: "52.4", chg: -0.3 }, { sym: "OI", price: "$38.2B", chg: 4.1 },
];

// ── AI CONTENT PIPELINE (ADMIN) ──
export interface ScenarioDef {
  id: string; entityId: string; level: number; rankReq: number;
  asset: string; briefing: string;
  options: { id: string; label: string; correct: boolean;
    layer1: string; layer2: string; layer3: string;
    errors: string[]; skillDeltas: Record<string,number>;
  }[];
  dataSources: Record<string, string>;
  difficultyAxes: MarketEntity["axes"];
}
export const ADMIN_SCENARIOS: ScenarioDef[] = [];
