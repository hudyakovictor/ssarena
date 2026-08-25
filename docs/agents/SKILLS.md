# SIGNAL ARENA — AI SKILLS & CAPABILITIES
## Компетенции AI для работы с проектом

---

## 🧠 ЧТО AI УМЕЕТ

### 1. Анализ retention
- Когортный анализ D1/D3/D7/D14/D30
- Сегментация по рангам, premium/free
- Выявление главных точек оттока
- Пост-поражения: return rate, loss streak impact

### 2. Экономический аудит
- Burn/Emission ratio мониторинг
- Sink utilization (какие sinks работают)
- Free vs Premium winrate fairness
- Token velocity и unused rewards

### 3. LiveOps планирование
- Календарь ивентов и турниров
- Контент-каденс (сценарии/неделю)
- Сезонные возможности
- Market correlation (цена токена ↔ активность)

### 4. Верификация контента
- 5 виртуальных агентов: FOMO Bot, Satoshi Sleuth, Bastion, Degen, Contrarian
- Проверка: distinct options, difficulty calibration, Layer 2/3 quality
- Батч-верификация всех непроверенных сценариев

### 5. Безопасность
- Anti-recon middleware: паттерны сканирования
- Rate limiting enforcement
- IP banning (автоматический после 3+ нарушений)
- Latency penalty для сканеров

### 6. Симуляция (sandbox)
- 6 предустановленных сценариев
- Изолированные клоны агентов
- Ускоренное время (1 день = 100ms)
- Full diff-отчёт после симуляции

## 📁 КЛЮЧЕВЫЕ ФАЙЛЫ

| Файл | Назначение |
|------|-----------|
| `server/src/agents/agent-system.js` | Система агентов: SafetyController, AgentOrchestrator, AIAgent |
| `server/src/simulation/simulation-engine.js` | Sandbox симуляции: SandboxedAgent, SimulationEngine, SCENARIOS |
| `server/src/routes/agent-api.js` | API: halt, resume, chat, scan, summary |
| `server/src/routes/simulation-api.js` | API: scenarios, create, run, history |
| `src/components/MaintenanceBanner.tsx` | Баннер техработ на проде |
| `src/screens/Admin.tsx` | 6 вкладок: Chat, Generator, Scenarios, Pipeline, Safety, Simulation |

## 🚀 БЫСТРЫЙ СТАРТ

```bash
# Backend
cd server && npm run dev
# → Agent API: :3001/api/agents/summary
# → Simulation: :3001/api/sim/quick -d '{"scenario":"healthy-growth"}'

# Frontend
npm run dev
# → Admin: UI → Настройки → Админ-панель
# → Simulation: вкладка "🧪 Sim"
```
