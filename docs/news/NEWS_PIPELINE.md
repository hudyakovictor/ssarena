# SIGNAL ARENA — NEWS PIPELINE
## Раздел новостей в админке + внешние коммуникации

---

## 📰 ВНУТРЕННИЙ NEWS PIPELINE

### Структура в админке

```
Admin → News (новый раздел)
├── Create Post
│   ├── Title (RU + EN)
│   ├── Category: [update, event, community, market, dev]
│   ├── Body (Markdown, 2 языка)
│   ├── Image (опционально)
│   ├── Pinned: да/нет
│   ├── Publish date (сейчас / запланировать)
│   └── Target: [all, rank_0_2, rank_3_5, premium_only]
│
├── Drafts
├── Scheduled
├── Published
└── Analytics (просмотры, клики)
```

### Категории новостей

| Категория | Пример | Частота | Аудитория |
|-----------|--------|---------|-----------|
| **update** | "Добавлены 3 новые Market Entities: Insider Syndicate, Token Parasite, Meme Mirage" | По факту | Все |
| **event** | "Weekend Warrior: +50% XP в эти выходные!" | 1-2×/нед | Все |
| **community** | "Топ-10 игроков недели: кто победил больше всех Wraiths?" | 1×/нед | Все |
| **market** | "$SIG burn ratio достиг 40% — дефляция ускоряется" | 2×/мес | Держатели |
| **dev** | "Дорожная карта Q4: что мы строим" | 1×/мес | Все |
| **education** | "Как работает Honeypot Mimic: реальный пример из рынка" | 1×/нед | Новички |

### News → In-game уведомления

```
Варианты доставки:
  1. Баннер на Dashboard ("Новый Market Entity доступен!")
  2. Модальное окно при логине (для важных анонсов)
  3. Красный бейдж на иконке "Новости" в сайдбаре
  4. Push-уведомление (когда будут мобильные приложения)
```

### News → Social auto-post

```
При публикации новости в админке — авто-пост в:
  🔲 Discord #announcements (через webhook)
  🔲 Twitter/X (через API)
  🔲 Telegram (через bot API)

Формат адаптируется под платформу автоматически.
```

---

## 🐦 СОЦИАЛЬНЫЕ СЕТИ (ПЛАН ПОДКЛЮЧЕНИЯ)

### Twitter/X API v2

```typescript
// Конфигурация в админке
const TWITTER_CONFIG = {
  apiKey: process.env.TWITTER_API_KEY,
  apiSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
};

// Авто-пост при публикации новости
async function autoPostToTwitter(news: NewsPost) {
  const tweet = formatForTwitter(news); // обрезать до 280 символов + ссылка
  await twitterClient.v2.tweet(tweet);
}
```

### Discord Webhook

```typescript
// Простой webhook — не требует API ключа
const DISCORD_WEBHOOK = process.env.DISCORD_ANNOUNCEMENTS_WEBHOOK;

async function autoPostToDiscord(news: NewsPost) {
  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: news.title,
        description: news.body.slice(0, 2000),
        color: 0x22d3ee,
        timestamp: new Date().toISOString(),
        footer: { text: 'Signal Arena News' },
      }],
    }),
  });
}
```

### Telegram Bot

```typescript
// @signalarenabot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL = '@signalarena';

async function autoPostToTelegram(news: NewsPost) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHANNEL,
      text: `📡 ${news.title}\n\n${news.body.slice(0, 500)}\n\n🔗 https://signalarena.io/news/${news.id}`,
      parse_mode: 'HTML',
    }),
  });
}
```

### YouTube Community Tab

```
🔲 Подключение через YouTube Data API v3
🔲 Авто-пост в Community Tab канала Signal Arena
```

---

## 📅 КОНТЕНТ-ПЛАН (ПЕРВЫЕ 30 ДНЕЙ)

| День | Тип | Тема | Платформы |
|------|-----|------|-----------|
| 1 | announcement | "Signal Arena: Public Beta открыта!" | Все |
| 2 | education | "Что такое Market Entities? 12 архетипов." | Twitter, Discord |
| 3 | community | "Первые 100 игроков! Спасибо!" | Discord |
| 4 | dev | "Как работает AI Co-Pilot в админке" | Twitter |
| 5 | event | "Weekend Warrior: +50% XP" | Все |
| 6 | community | "Топ-5 побед недели" | Twitter, Discord |
| 7 | education | "FOMO Wraith: как распознать и победить" | Все |
| 8 | market | "Токеномика $SIG: почему deflationary" | Twitter |
| 9 | update | "Новый Market Entity: Rug Pull Phantom" | Все |
| 10 | community | "AMA с разработчиком в Discord" | Discord |
| ... | | | |
| 30 | announcement | "Месяц после запуска: метрики и планы" | Все |

---

## 🔄 GOOGLE ANALYTICS 4 (ПОДКЛЮЧЕНИЕ К АДМИНКЕ)

### Шаг 1: Создать GA4 property

```
1. analytics.google.com → Admin → Create Property
2. Название: Signal Arena
3. Часовой пояс: UTC
4. Валюта: USD
5. Получить Measurement ID (G-XXXXXXXXXX)
```

### Шаг 2: Интеграция в админку

```typescript
// src/screens/Admin.tsx или отдельный AnalyticsDashboard

import { useEffect } from 'react';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

function AnalyticsDashboard() {
  useEffect(() => {
    // Загрузить GA4 скрипт один раз
    if (!GA_MEASUREMENT_ID) return;
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) { window.dataLayer.push(args); }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  }, []);

  // Трекинг ключевых событий
  function trackEvent(name: string, params?: Record<string, any>) {
    if (window.gtag) {
      window.gtag('event', name, params);
    }
  }

  // Автоматический трекинг:
  // - page_view (каждый экран)
  // - battle_started (mode, entity, level)
  // - battle_completed (result, score, time_spent)
  // - premium_purchase (plan, amount)
  // - wallet_connected (provider)
  // - share_card_clicked (entity, result)
}
```

### Шаг 3: Ключевые события для отслеживания

| Событие | Параметры | Зачем |
|---------|----------|-------|
| `page_view` | screen_name | Трафик по экранам |
| `battle_start` | mode, entity_id | Во что играют |
| `battle_result` | result, score, time | Win rate, engagement |
| `premium_view` | — | Воронка premium |
| `premium_purchase` | plan, price | Конверсия в premium |
| `wallet_connect` | provider | Какие кошельки |
| `share_card` | entity, result | Виральность |
| `error_encountered` | error_type | Где спотыкаются |
| `tournament_enter` | tournament_id | Турнирный интерес |
| `market_view` | — | Интерес к магазину |
| `market_purchase` | item, price | Что покупают |

### Шаг 4: Админ-дашборд с GA данными

```
В админке — вкладка "Analytics":
├── Активные пользователи (30 мин)
├── Новые vs Returning
├── По странам
├── По устройствам (mobile vs desktop)
├── Battle funnel: start → complete → share
├── Premium funnel: view → trial → purchase
├── Топ сценариев по вовлечению
└── Источники трафика
```

---

## 📊 СТРУКТУРА ДАННЫХ ДЛЯ NEWS

```sql
-- Таблица новостей (в DB_CONTENT)
CREATE TABLE news_posts (
  id          TEXT PRIMARY KEY,
  title_ru    TEXT NOT NULL,
  title_en    TEXT NOT NULL,
  category    TEXT NOT NULL,  -- update, event, community, market, dev, education
  body_ru     TEXT NOT NULL,
  body_en     TEXT NOT NULL,
  image_url   TEXT,
  pinned      INTEGER DEFAULT 0,
  target_segment TEXT DEFAULT 'all',
  published_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  author      TEXT DEFAULT 'AI Co-Pilot'
);

-- Просмотры новостей
CREATE TABLE news_analytics (
  post_id     TEXT NOT NULL,
  player_id   TEXT,
  source      TEXT NOT NULL,  -- in_app, twitter, discord, telegram
  viewed_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
```
