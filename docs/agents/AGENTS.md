# SIGNAL ARENA — AI AGENTS REFERENCE
## Для будущей работы с проектом (человек + AI)

---

## 🤖 АКТИВНЫЕ АГЕНТЫ

| # | ID | Имя | Роль | Файл |
|---|-----|------|------|------|
| 1 | `retention` | Retention Analyst 🎯 | D1/D7/D30, Loss streak, Tournament funnel, Post-defeat analysis | `server/src/analytics/intelligence/retention.js` |
| 2 | `economy` | Economy Controller 💰 | Burn/Emission, Premium conversion, Fairness audit, Token velocity | `server/src/analytics/intelligence/economy.js` |
| 3 | `liveops` | LiveOps Commander 📅 | Event planning, Tournament calendar, Market correlation, Content cadence | `server/src/analytics/intelligence/liveops.js` |
| 4 | `verifier` | Content Verifier 🔍 | 5 virtual traders test scenarios | `server/src/analytics/ai-copilot.js` |
| 5 | `security` | Security Sentinel 🛡️ | Anti-recon, Rate limiting, IP bans, DDoS detection | `server/src/agents/agent-system.js` |

## 🧪 СИМУЛЯЦИОННЫЕ АГЕНТЫ (Sandbox)

При запуске симуляции создаются клоны агентов с изолированным data universe. Реальные агенты НЕ знают о симуляции.

| Сценарий | Длительность | Описание |
|----------|------------|----------|
| `healthy-growth` | 90 дней | Органический рост: retention ↑, burn ↑, premium > 5% |
| `market-crash` | 60 дней | Токен -60%, паника, отток, восстановление |
| `force-majeure` | 30 дней | DDoS → DB crash → recovery |
| `inflation-spiral` | 45 дней | Sinks сломаны, инфляция, экстренное исправление |
| `council-of-signals` | 15 дней | Все 18 entities одновременно |
| `zero-retention` | 10 дней | Баг: метрики показывают 0, детекция аномалии |

## 🔗 ВЗАИМОДЕЙСТВИЕ АГЕНТОВ

```
Admin UI (Chat)
  │
  ├─ "retention" → Retention Analyst
  ├─ "экономика" → Economy Controller
  ├─ "ивент" → LiveOps Commander
  ├─ "сценарий" → Content Verifier
  ├─ "безопасность" → Security Sentinel
  ├─ "всех" → All 5 agents respond
  └─ "сводка" → Autonomous summary
```

## 🛡️ УПРАВЛЕНИЕ

```bash
# Остановить всех агентов
POST /api/agents/halt  { reason: "emergency" }

# Возобновить
POST /api/agents/resume

# Отключить конкретного агента
POST /api/agents/toggle  { agentId: "retention", enabled: false }

# Бэкап
POST /api/agents/backup

# Статус безопасности
GET /api/agents/safety
```

## 🧪 СИМУЛЯЦИЯ

```bash
# Список сценариев
GET /api/sim/scenarios

# Быстрый запуск
POST /api/sim/quick  { scenario: "market-crash", acceleration: 100 }

# Статус
GET /api/sim/status/:simId

# История
GET /api/sim/history
```

## 📋 КЛЮЧЕВЫЕ ПРИНЦИПЫ

1. **Агенты автономны** — сканируют систему, генерируют алерты, предлагают действия
2. **Чат = диалог без действий** — через чат агенты только отвечают, не исполняют
3. **Kill-switch глобальный** — HALT ALL останавливает всех немедленно
4. **Симуляция изолирована** — sandboxed агенты не влияют на реальную систему
5. **Pre-configured prompts** — у каждого агента есть short и full наборы промптов
