# SIGNAL ARENA V2 — ARCHITECTURE OVERVIEW
## Полная карта всех соединений и потоков данных

---

## 🏗️ ФИЗИЧЕСКАЯ ТОПОЛОГИЯ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ЛОКАЛЬНЫЙ КОНТУР (Админ)                              │
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐   │
│  │ Admin UI (:5173) │───▶│ OpenRouter API   │───▶│ DB_CONTENT (MASTER)  │   │
│  │ (React SPA)      │    │ (claude/gpt-4o)  │    │ (SQLite/PostgreSQL)  │   │
│  └──────────────────┘    └──────────────────┘    └──────────┬───────────┘   │
│                                                              │               │
│  ┌──────────────────┐    ┌──────────────────┐               │               │
│  │ AI Co-Pilot      │◀───│ Message Broker   │◀──────────────┘               │
│  │ (5 modules)      │    │ (Memory/RabbitMQ) │                               │
│  └──────────────────┘    └──────────────────┘                               │
│                                                              │               │
│  ┌──────────────────┐                                        │               │
│  │ Content Sync     │──encrypt(AES-256)──▶ S3/Minio Staging  │               │
│  │ (push script)    │                                        │               │
│  └──────────────────┘                                        │               │
└──────────────────────────────────────────────────────────────┼───────────────┘
                                                               │
                    ═══════════ VPN/SSH ТУННЕЛЬ ═══════════════
                                                               │
┌──────────────────────────────────────────────────────────────┼───────────────┐
│                       ПРОДАКШЕН КОНТУР (K8s/Cloud)           │               │
│                                                               ▼               │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐   │
│  │ Cloudflare CDN   │    │ Nginx Ingress    │    │ DB_CONTENT (REPLICA) │   │
│  │ (static assets)  │    │ (rate limit)     │    │ (READ-ONLY!)         │   │
│  └──────────────────┘    └────────┬─────────┘    └──────────────────────┘   │
│                                    │                                         │
│  ┌──────────────────┐    ┌────────▼─────────┐    ┌──────────────────────┐   │
│  │ Игроки           │───▶│ Fastify API ×3   │───▶│ DB_USERS (PG)        │   │
│  │ (Browser/Wallet) │    │ (stateless)      │    │ (транзакционный)     │   │
│  └──────────────────┘    └────────┬─────────┘    └──────────────────────┘   │
│                                    │                                         │
│  ┌──────────────────┐    ┌────────▼─────────┐    ┌──────────────────────┐   │
│  │ WebSocket        │◀──▶│ Socket.io        │───▶│ Redis (сессии)       │   │
│  │ (real-time PvP)  │    │ (matchmaking)    │    │ (30min TTL)          │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────────┘   │
│                                                                             │
│  ┌──────────────────┐                                                        │
│  │ Pull Agent       │──GET(every 60min)──▶ S3 Staging ──decrypt──▶ DB_CONTENT│
│  │ (cron job)       │                                                        │
│  └──────────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📡 ВСЕ ТОЧКИ СОЕДИНЕНИЙ

### 1. Игрок → Игра
| От | К | Протокол | Данные |
|----|---|----------|--------|
| Браузер | Cloudflare CDN | HTTPS | index.html, JS bundles, images (/dist) |
| Браузер | Nginx Ingress | HTTPS | API запросы (/api/*) |
| Браузер | Socket.io | WSS | Real-time дуэли, чат, presence |
| MetaMask | ethers.js | Browser API | Подпись, адрес, баланс |

### 2. Игра → Базы данных
| От | К | Протокол | Данные |
|----|---|----------|--------|
| Fastify API | DB_USERS (PG) | TCP/5432 (VPC) | Игроки, скиллы, карты, ошибки, баджи |
| Fastify API | DB_CONTENT (PG) | TCP/5432 (VPC) | Сценарии, сущности, карты навыков (SELECT ONLY) |
| Fastify API | Redis | TCP/6379 (VPC) | Боевые сессии (30-min TTL) |
| Fastify API | RabbitMQ | AMQP/5672 (VPC) | События: батлы, ошибки, экшены |

### 3. Админ → Игра (ПРОДАКШЕН)
| От | К | Протокол | Данные |
|----|---|----------|--------|
| Admin UI | Fastify API | HTTPS | Контент-пуш, AI-команды (только с localhost!) |
| Admin UI | OpenRouter | HTTPS | AI-генерация сценариев |
| Admin DB | S3 Staging | HTTPS/AWS SDK | Зашифрованные контент-пакеты (.sapkg) |

### 4. Игра → Админ (АНАЛИТИКА)
| От | К | Протокол | Данные |
|----|---|----------|--------|
| RabbitMQ | Analytics Consumer | AMQP | Все события (батлы, ошибки, экшены) |
| Прод-сервер | Админ (pull) | Исходящий HTTPS | Логи, метрики (админ сам забирает) |

### 5. AI Co-Pilot → Данные
| AI Модуль | Источник данных | Таблицы |
|-----------|----------------|---------|
| RetentionIntelligence | metrics_retention_cohorts, metrics_churn_risk, battle_logs | D1/D7/D30, streaks, churn scores |
| EconomyIntelligence | metrics_sink_faucet, metrics_fairness, players | Burn/emission, free vs premium |
| LiveOpsIntelligence | metrics_tournament_perf, metrics_scenario_perf, metrics_token_pressure | Турниры, ивенты, цена токена |
| ScenarioVerifier | scenarios, scenario_options | Валидация AI-сгенерированных сценариев |
| PredictiveAnalytics | battle_logs, player_errors, player_skills | Аномалии, churn prediction |

## 🔐 КЛЮЧЕВЫЕ ПРИНЦИПЫ БЕЗОПАСНОСТИ

1. **DB_CONTENT на проде — READ-ONLY.** Сервер игры НЕ МОЖЕТ писать в контент.
2. **Админские эндпоинты доступны только с localhost.** Внешний IP → 403.
3. **Контент-пакеты шифруются AES-256-GCM перед отправкой.**
4. **Аналитические данные админ ЗАБИРАЕТ сам.** Прод не знает IP админа.
5. **Все секреты в K8s Secrets, не в коде.**
6. **Anti-recon middleware ловит сканирование портов и банит.**

## 🔄 ПОТОК ОБНОВЛЕНИЯ КОНТЕНТА

```
[Админ генерирует сценарий]
        │
        ▼
[AI Verifier: 5 агентов тестируют]
        │
        ▼
[Human review: APPROVE]
        │
        ▼
[Content Sync: encrypt + push → S3 Staging]
        │
        ▼
[Pull Agent (cron/60min): detect new → pull → verify HMAC → decrypt]
        │
        ▼
[DB_CONTENT Replica: atomic swap]
        │
        ▼
[CDN cache invalidate: /locales/*]
```

## 📊 ПОТОК ДАННЫХ ДЛЯ AI CO-PILOT

```
[Игровые события] → [Broker] → [Analytics Consumer] → [Derived Metrics Tables]
                                                              │
                    ┌─────────────────────────────────────────┘
                    ▼
            [AI Co-Pilot Orchestrator]
                    │
        ┌───────────┼───────────┬───────────┬───────────┐
        ▼           ▼           ▼           ▼           ▼
   Retention   Economy    Fairness    LiveOps     Market
   Intelligence Intelligence Auditor   Planner    Observer
        │           │           │           │           │
        └───────────┴───────────┴───────────┴───────────┘
                    │
                    ▼
            [TOP-3 20/80 Actions]
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   [Auto-Execute]          [Human Approve]
   (low severity)          (CRITICAL/HIGH)
        │                       │
        └───────────┬───────────┘
                    ▼
            [metrics_ai_recommendations]
            (outcome tracking for ROI)
```

## 🖥️ DEV vs PROD

| Компонент | DEV | PROD |
|-----------|-----|------|
| Frontend | `npm run dev` (:5173) | Cloudflare CDN (статический билд) |
| Backend | Node.js (1 процесс) | Fastify ×3 (K8s replicas) |
| DB Users | SQLite (файл) | PostgreSQL 16 (StatefulSet) |
| DB Content | SQLite (файл) | PostgreSQL 16 (Read-Only replica) |
| Redis | Нет (in-memory Map) | Redis 7 (K8s deployment) |
| Брокер | In-memory | RabbitMQ 4 |
| Админка | localhost:5173 | Отдельный VPS/локальная машина |
| Staging | Локальная папка | S3/Minio bucket |
| CDN | Нет | Cloudflare/CloudFront |
| SSL | Нет | Let's Encrypt (cert-manager) |
| Мониторинг | Console.log | Grafana + Prometheus (planned) |
| Логи | Console | Broker → Analytics Consumer |
