# AI CO-PILOT — WIRING & DATA REQUIREMENTS
## Как каждый AI-модуль получает данные. Полная карта подключений.

---

## 🧠 5 МОДУЛЕЙ → 11 ТАБЛИЦ ДАННЫХ

```
                        ┌─────────────────────────┐
                        │   AI Co-Pilot Orchestrator │
                        └────────────┬────────────┘
                                     │
        ┌────────┬──────────┬────────┼────────┬──────────┐
        ▼        ▼          ▼        ▼        ▼          ▼
   Retention  Economy  Fairness  LiveOps  Market    Verifier
   Intel      Intel    Auditor   Planner  Observer   (5 agents)
```

## 📊 МОДУЛЬ 1: RETENTION INTELLIGENCE

**Файл:** `server/src/analytics/intelligence/retention.js`
**Данные из таблиц:**

| Таблица | Поля | Как используется |
|---------|------|-----------------|
| `metrics_retention_cohorts` | d1_retention, d7_retention, d30_retention, cohort_size, segment | Анализ оттока по когортам. D1<40% → CRITICAL |
| `metrics_churn_risk` | churn_score, loss_streak, days_inactive, discipline_decline, risk_factors | Персональные churn prediction |
| `battle_logs` | player_id, result, entity_id, created_at | Loss streak анализ, post-defeat return rate |
| `players` | rank_index, created_at, last_battle_at | Сегментация по рангам, активность |

**Пороги алертов:**
- D1 < 40% → CRITICAL (онбординг сломан)
- D1→D7 drop > 50% → HIGH (контент-гэп)
- Loss streak 3+ → churn rate > 30% → HIGH
- Session depth: 60%+ сессий = 1 бой → MEDIUM

---

## 📊 МОДУЛЬ 2: ECONOMY INTELLIGENCE

**Файл:** `server/src/analytics/intelligence/economy.js`
**Данные из таблиц:**

| Таблица | Поля | Как используется |
|---------|------|-----------------|
| `metrics_sink_faucet` | tokens_emitted, tokens_burned, burn_emission_ratio, active_sinks | Burn/emission ratio |
| `players` | premium_status | Premium conversion rate |
| `metrics_conversion_funnels` | funnel_name, conversion_rate, dropoff_reason | Воронка premium |
| `metrics_token_pressure` | token_price_usd, buy_pressure, sell_pressure | Токен-экономика |

**Пороги:**
- Burn ratio < 20% → CRITICAL (инфляция)
- Premium conversion < 3% → HIGH
- Shop utilization < 10% → MEDIUM

---

## 📊 МОДУЛЬ 3: FAIRNESS AUDITOR

**Файл:** Встроен в EconomyIntelligence
**Данные из таблиц:**

| Таблица | Поля | Как используется |
|---------|------|-----------------|
| `metrics_fairness` | segment, avg_winrate, avg_progress_speed, leaderboard_top100_pct, pay_to_win_flag | Сравнение free vs premium |
| `players` | premium_status, win_rate, rank_index | Сегментация |
| `battle_logs` | player_id, result, mode | Win rate по сегментам |

**Пороги:**
- Winrate gap > 5% → CRITICAL (pay-to-win detected!)
- Progress speed gap > 2x → HIGH

---

## 📊 МОДУЛЬ 4: LIVEOPS PLANNER

**Файл:** `server/src/analytics/intelligence/liveops.js`
**Данные из таблиц:**

| Таблица | Поля | Как используется |
|---------|------|-----------------|
| `metrics_tournament_perf` | entries, roi_for_platform, returning_players_pct | Эффективность турниров |
| `metrics_scenario_perf` | retention_uplift, win_rate, replay_rate | Какие сценарии работают |
| `metrics_conversion_funnels` | tournament_view → entry → completion | Воронка турниров |
| `metrics_token_pressure` | game_activity_correlation | Корреляция цена/активность |

**Пороги:**
- 0 активных турниров → HIGH
- Event gap > 10 дней → MEDIUM
- Scenarios/week < 50% нормы → MEDIUM

---

## 📊 МОДУЛЬ 5: MARKET OBSERVER

**Файл:** Встроен в LiveOpsIntelligence
**Данные из таблиц:**

| Таблица | Поля | Как используется |
|---------|------|-----------------|
| `metrics_token_pressure` | token_price_usd, price_change_24h, exchange_inflow, exchange_outflow, buy_pressure, sell_pressure | Рыночная активность |
| `metrics_token_pressure` | game_activity_correlation, new_wallets_24h | Корреляция с игрой |

**Пороги:**
- Token drawdown > 50% от ATH → HIGH
- Exchange inflow > 2x outflow → WARNING (готовятся продавать)
- Price/game correlation > |0.5| → INSIGHT

---

## 🔄 ПОТОК ДАННЫХ: ОТ СОБЫТИЯ ДО AI-ИНСАЙТА

```
1. Игрок завершает бой
   ↓
2. battle_logs INSERT (DB_USERS)
   ↓
3. Broker emit("sa.battle.events", { type: "result", ... })
   ↓
4. Analytics Consumer получает событие
   ↓
5. Обновляет derived metrics таблицы:
   - metrics_retention_cohorts (пересчёт D1/D7/D30)
   - metrics_churn_risk (обновление churn_score)
   - metrics_sink_faucet (если был burn)
   - metrics_scenario_perf (обновление win_rate)
   ↓
6. AI Co-Pilot Orchestrator (каждые 30 минут или по запросу)
   ↓
7. RetentionIntelligence.analyze(aggregatedState)
   ↓
8. Выявление алертов, 20/80 приоритизация
   ↓
9. TOP-3 действия → Overseer Dashboard
   ↓
10. Human: APPROVE / REJECT
    ↓
11. metrics_ai_recommendations (outcome tracking)
```

## ⚡ ГАРАНТИИ ДОСТАВКИ ДАННЫХ

| Этап | Гарантия | Механизм |
|------|---------|----------|
| Battle log → DB | ACID | PostgreSQL транзакция |
| DB → Broker | Best-effort | In-memory emit (не теряется при работающем сервере) |
| Broker → Consumer | At-least-once | Consumer pull/flush |
| Consumer → Derived Metrics | ACID | SQL INSERT/UPDATE |
| Derived Metrics → AI | On-demand | Прямой запрос к таблицам |

**Критический разрыв:** Broker in-memory в dev-режиме теряет события при рестарте.
**Решение:** RabbitMQ в production (persistent queues).

---

## 🧪 ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЙ

```bash
# 1. Проверить что боевые события попадают в брокер
curl http://localhost:3001/api/admin/broker/status

# 2. Проверить derived metrics
# (в production: SQL запрос к metrics_retention_cohorts)

# 3. Проверить AI скан
curl -X POST http://localhost:3001/api/ai/scan \
  -H "Content-Type: application/json" \
  -d '{"activePlayers": 12847, "d1Retention": 0.38}'

# 4. Проверить что алерты генерируются
curl http://localhost:3001/api/ai/last-scan | jq '.stats'
```
