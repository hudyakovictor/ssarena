// ============================================================
// MARKET PROFILE LAYER — market-agnostic battle engine
// The battle engine (useBattle) reads ONE active profile.
// Adding a market (FX, stocks, metals) = adding a profile object.
// No engine changes required.
// ============================================================

export interface SourceFact {
  id: string;
  cost: number;
  name: string;
  glyph: string;
  fact: string;
  disc: "ta" | "derivatives" | "fundamental" | "psychology" | "security" | "macro";
}

export interface BattleOption {
  id: string;
  label: string;
  correct: boolean;
  layer1: string;
  layer2: string;
  layer3: string;
}

export interface MarketProfile {
  id: "crypto" | "fx" | "stocks";
  label: string;
  asset: string; // header pair/symbol in battle view
  chartFact: string;
  sources: SourceFact[];
  options: BattleOption[];
  tickers: { sym: string; price: string; chg: number }[];
}

// ── CRYPTO PROFILE (current default) ─────────────────────────
export const CRYPTO_PROFILE: MarketProfile = {
  id: "crypto",
  label: "Crypto",
  asset: "ETH/USDT",
  chartFact: "ETH/USDT +8% за 24ч. Сопротивление $3,420.",
  sources: [
    { id: "chart", cost: 1, name: "Price Chart", glyph: "📈", disc: "ta", fact: "" /* filled by entity line */ },
    { id: "volume", cost: 1, name: "Volume", glyph: "📊", disc: "ta", fact: "Объём ниже среднего за 30 дней. Подтверждения пробоя нет." },
    { id: "funding", cost: 1, name: "Funding Rate", glyph: "🌡️", disc: "derivatives", fact: "Funding +0.09% (8ч) — экстремальный перегрев." },
    { id: "oi", cost: 1, name: "Open Interest", glyph: "📡", disc: "derivatives", fact: "Open Interest растёт быстрее цены. Плечо в рынке накапливается." },
    { id: "news", cost: 1, name: "News Feed", glyph: "📰", disc: "fundamental", fact: "Крупных новостей нет. Через 12 часов — публикация CPI." },
    { id: "sentiment", cost: 2, name: "Social Sentiment", glyph: "💬", disc: "psychology", fact: "Social Sentiment: 87% bullish. Эйфория — исторический против-сигнал." },
    { id: "onchain", cost: 2, name: "On-chain Flow", glyph: "🔗", disc: "fundamental", fact: "Биржевые резервы ETH снижаются. Накопление или подготовка к распределению?" },
    { id: "unlocks", cost: 2, name: "Token Unlocks", glyph: "🔓", disc: "fundamental", fact: "Ближайших анлоков нет." },
  ],
  options: [
    { id: "a", label: "Войти в лонг на весь депозит — тренд сильный", correct: false,
      layer1: "✗ Late Entry", layer2: "Social pressure peaked. You entered. Price peaked 2 minutes later.",
      layer3: "Ты вошёл после +8% импульса без volume confirmation. Funding перегрет, сентимент в эйфории." },
    { id: "b", label: "Подождать ретест + подтверждение, снизить риск перед CPI", correct: true,
      layer1: "✓ Discipline Confirmed", layer2: "The green candles screamed. You waited. Rare discipline.",
      layer3: "Рынок перегрет, объём не подтверждает. Ты не дал FOMO Wraith покормиться." },
    { id: "c", label: "Открыть шорт без стопа — 'слишком выросло'", correct: false,
      layer1: "✗ Risk Failed", layer2: "Conviction was high. Stop-loss wasn't present.",
      layer3: "Идея могла быть верной. Без стоп-лосса это азартная ставка." },
    { id: "d", label: "Игнорировать funding, смотреть только на свечи", correct: false,
      layer1: "✗ Incomplete Analysis", layer2: "Charts alone don't tell the full story. Funding told the rest.",
      layer3: "Funding — ключевой сигнал перекоса толпы. Игнорировать опасно." },
  ],
  tickers: [
    { sym: "BTC", price: "71,842", chg: 2.8 }, { sym: "ETH", price: "3,914", chg: 1.4 },
    { sym: "SOL", price: "184.2", chg: -0.9 }, { sym: "$SIG", price: "0.482", chg: 6.2 },
    { sym: "FUNDING", price: "0.038%", chg: 0.9 }, { sym: "FEAR/GREED", price: "78", chg: 1.5 },
    { sym: "BTC.D", price: "52.4", chg: -0.3 }, { sym: "OI", price: "$38.2B", chg: 4.1 },
  ],
};

// ── FX PROFILE (proof it's just data, not a fork) ────────────
export const FX_PROFILE: MarketProfile = {
  id: "fx",
  label: "Forex",
  asset: "EUR/USD",
  chartFact: "EUR/USD +0.6% за сессию. Сопротивление 1.0940. Банковские стопы выстроены над 1.0925.",
  sources: [
    { id: "chart", cost: 1, name: "Price Chart", glyph: "📈", disc: "ta", fact: "" },
    { id: "volume", cost: 1, name: "Tick Volume", glyph: "📊", disc: "ta", fact: "Tick-объём ниже среднего перед сессией. Подтверждения пробоя нет." },
    { id: "positioning", cost: 1, name: "CFTC Positioning", glyph: "🌡️", disc: "derivatives", fact: "Speculative longs на 87-м центиле за 12 месяцев — экстремальный перекос." },
    { id: "flow", cost: 1, name: "Central Bank Flow", glyph: "📡", disc: "macro", fact: "ECB-член готовит интервенцию при 1.0950 — вербализация зафиксирована." },
    { id: "news", cost: 1, name: "News Feed", glyph: "📰", disc: "fundamental", fact: "Крупных новостей нет. Через 6 часов — NFP США." },
    { id: "sentiment", cost: 2, name: "Retail Sentiment", glyph: "💬", disc: "psychology", fact: "Retail-позиционирование: 87% long. Эйфория — исторический против-сигнал." },
    { id: "correlations", cost: 2, name: "DXY Crosses", glyph: "🔗", disc: "fundamental", fact: "DXY дивергирует от EUR/USD. Корреляция сломалась — рынок выбирает сторону." },
    { id: "calendar", cost: 2, name: "Macro Calendar", glyph: "🔓", disc: "macro", fact: "Сегодня: NFP (высокий риск) и речь Fed в 20:30." },
  ],
  options: [
    { id: "a", label: "Купить сессионный пробой на полный лот — тренд сильный", correct: false,
      layer1: "✗ Late Entry", layer2: "Positioning peaked. You entered. Price reversed 30 minutes later.",
      layer3: "Ты вошёл после 0.6% импульса без объёмного подтверждения. Спекулянты перегреты, толпа в эйфории." },
    { id: "b", label: "Подождать ретест 1.0940, снизить маржу перед NFP", correct: true,
      layer1: "✓ Discipline Confirmed", layer2: "The pips screamed. You waited. Rare discipline.",
      layer3: "Рынок перегрет, объём не подтверждает. Ты не дал FOMO Wraith покормиться." },
    { id: "c", label: "Шортнуть без стопа — 'верх явно'", correct: false,
      layer1: "✗ Risk Failed", layer2: "Conviction was high. Stop-loss wasn't present.",
      layer3: "Идея могла быть верной. Без стоп-лосса это азартная ставка — а баннер-стопы над 1.0925 — их любимая еда." },
    { id: "d", label: "Игнорировать CFTC, смотреть только на свечи", correct: false,
      layer1: "✗ Incomplete Analysis", layer2: "Charts alone don't tell the full story. Positioning told the rest.",
      layer3: "Позиционирование — ключевой сигнал перекоса толпы. Игнорировать опасно." },
  ],
  tickers: [
    { sym: "EUR/USD", price: "1.0923", chg: 0.6 }, { sym: "GBP/JPY", price: "198.44", chg: 1.1 },
    { sym: "USD/JPY", price: "156.82", chg: -0.4 }, { sym: "$SIG", price: "0.482", chg: 6.2 },
    { sym: "DXY", price: "99.31", chg: -0.2 }, { sym: "VIX", price: "14.2", chg: -2.1 },
    { sym: "US10Y", price: "4.28%", chg: 0.4 }, { sym: "AUD/USD", price: "0.6612", chg: 0.3 },
  ],
};

// ── ACTIVE PROFILE (swapped at runtime / later by branding) ──
export const ACTIVE_PROFILE: MarketProfile = CRYPTO_PROFILE;

// Profiles keyed by id. `stocks` is a planned extension (kept in the
// MarketProfile["id"] union), so the map is open-typed until it lands.
export const ALL_PROFILES: Record<string, MarketProfile> = {
  crypto: CRYPTO_PROFILE,
  fx: FX_PROFILE,
};
