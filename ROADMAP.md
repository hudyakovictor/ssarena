# Signal Arena — Roadmap

Разбивка разработки на блоки. Правило: каждый блок = законченный, проверенный, запушенный шаг.

## Формат
- [ ] = не сделано, [x] = готово
- После каждого блока: `git commit` + `git push origin main`
- Статус проверяется живьём, а не на слово: curl в эндпоинт, tsc, скрин в браузере

## Блок 0 — Чистота и фундамент
- [x] Приватный репозиторий + токен + первый push (2026-08-17)
- [x] Удалены 196 мусорных файлов macOS `__MACOSX` (2026-08-17)
- [x] `.gitignore`: node_modules, dist, .env, логи
- [ ] Partner: invite + clone (ждём логин партнёра)

## Блок 1 — Включить реальный бэкенд
Сейчас: v3 фронт работает полностью на mock (свечи, очко, 10 врагов-клиентов).
Бэкенд в репо существует целиком: Fastify, SQLite, 18 врагов seed, подписанные
контент-паки, battle-api, ws, leaderboard, overseer — но фронт к нему НЕ прибит.

Цель: один toggle `VITE_API_URL` — и игра ходит на сервер.
- [x] 1.1 Поднять бэкенд на :3001 (`npm i && npm run dev`), curl /api/health
- [x] 1.2 `useBattle`/`TradingChart`: живой candle API вместо `generateMockCandles`
- [x] 1.3 `useWebSocket`: подключить ws-дуэли (live-режим)
- [x] 1.4 Логин/регистрация: экран Onboarding → POST /api/player
- [x] 1.5 Лидерборд Dashboard: GET /api/leaderboard
- [x] 1.6 Враги: 18 с сервера (content pack) вместо 10 в `data.ts`
- [x] Проверка: tsc 0 ошибок, live-бой проходит, очко пишется в SQLite (E2E cycle_probe)

## Блок 2 — Экономика и мета-прогресс
- [x] 2.1 Счёт/XP игрока: save в БД после боя (server `lib/progress.js`, XP-экономика `content/ranks.js`)
- [x] 2.2 Ранги и разлоки (RANKS ↔ реальные пороги XP, ранк-ап + бейдж)
- [x] 2.3 Твинсто / «за ошибку урок»: journal ошибок → панель «Урок за ошибку» в Академии (кнопка ведёт к лечению)
- [x] 2.4 Профиль игрока: `usePlayerProfile` синк реального профиля (рейтинг, статы, навыки, враги, карточки, ошибки)
- [x] 2.5 Коллекция / карточки: дроп карты за 3 победы над врагом (discipline→карта), синк в Collection.tsx
- [x] Проверка: полный цикл новый игрок → 10 боёв → ранг → карточки (E2E e2e_meta.js: 350XP, ранг 1, card anti-fomo, топ-15)

## Блок 3 — Боевой контент и админка (готово 2026-08-16)
- [x] 3.1 Admin: генерация сценариев → save в контент-БД (server `lib/scenario-gen.js`: 1 верный вариант + 3 ловушки из журнала ошибок, детерминированный seed). `POST /api/admin/content/generate`, list/approve/publish/delete через `/api/admin/content/scenarios`. Publish = approve + signPackage (HMAC-SHA256) + bump версии пака.
- [x] 3.2 Контент-паки: `GET /api/game/pack` (публичный, подписанный снапшот: 18 entities, 8 cards, approved scenarios). Клиент: `api.getContentPack()` + Admin → Pipeline показывает счётчики/версию/сигнатуру. E2E пересчитывает HMAC клиентом — подпись совпадает.
- [x] 3.3 Overseer: `GET /api/overseer/dashboard` с РЕАЛЬНЫМИ метриками из обеих БД (игроки, бои 24ч, топ-ошибка, сценарии, баны) + скан ai-overseer. Фронт Overseer.tsx: live-адаптер → тот же ScanReport, бейдж LIVE-DB/DEMO, mock — только офлайн-фолбэк.
- [x] 3.4 Турнирная сетка: `GET /api/content/tournament/weekly` — weekly cup из топ-16 лидерборда (mirror-seeding, ghosts до 16). TournamentBracket подключён в Arena → Tur...[truncated]

## Блок 4 — Монетизация и «замок» (готово 2026-08-16)
- [x] 4.1 Реферальная система (ReferralSystem — orphan, подключить). Сервер: `referral_links` + `$SIG`-леджер (sig_balance/sig_ledger) в users.db, код `SIGMA########` хранится в players.referral_code, `lib/referral.js` (активация, статистика, хуки onFirstBattle/onRankUp), маршруты `/api/referral/status|activate`, guest-логин принимает `?ref=CODE`. Награды: приглашённый +5 / реферер +10 (регистрация), +50 (друг дошёл до Rank 5). Анти: self-referral, один линк на игрока, invalid code → 409. Фронт: живой статус/леджер в панели «Рефералы» (TopBar), офлайн-фолбэк, форма «у меня есть код друга», deep-link `?ref=CODE` на первом входе.
- [x] 4.2 WalletConnect — «бумажный» (demo) режим, без реальных ключей. `POST /api/auth/wallet-demo` — детерминированный 0x-адрес (sha256 от playerId) пишется в players.wallet_addr, прогресс не сбрасывается; `.../disconnect`. Фронт WalletConnect пересобран: без window.ethereum/ethers, кнопка «Connect Wallet (demo)», бейдж DEMO. Реальный Web3 — отдельная юридическая ветка.
- [x] 4.3 B2B API для брокеров (из WHITEPAPER) — stub. `/api/b2b/scenarios|assessment|curriculum|analytics` + выдача API-ключей `POST /api/b2b/keys` (loopback, in-memory dev). Данные читают живые БД (сущности, профиль, battle_logs). Admin → вкладка «B2B API»: выдать ключ + прогнать 4 endpoint. Контент B2B = generateScenarios + approve.
- [ ] Токен — НЕ в этой фазе (отдельная юридическая ветка, по решению)
- [x] Проверка: E2E `e2e_block4.js` 26/26 (референс через ?ref=, +10/+5 $SIG, self/invalid reject, pending→completed после первого боя, paper-wallet детерминирован и очищается, B2B 401/ключ/4 endpoint, persist-сценарии одобрены), tsc app+node 0

## Блок 5 — Качество и релиз
- [x] 5.1 E2E: «новый игрок проходит 3 боя» — `C:/tmp/sa/e2e_block5.js`: guest → pack (проверка integrity) → 3 боя (prebattle+decide, верный вариант) → профиль целостный (battles=3, xp=180, recentBattle) → строка в лидерборде. 13 проверок.
- [x] 5.2 Нагрузочный: 50 одновременных боёв = 0 падений (wall 188ms), p95=78ms на волне 20-параллель (prebattle+decide). WS: duel:queue матчит 2 игроков в комнату + battle:action уходит оппоненту. Попутно починен баг матчмейкинга в ws.js (вызывал несуществующий io.to(...).socketsJoin() — игроки реально не попадали в комнату) и перенос wsRoutes после app.ready().
- [x] 5.3 Секреты/rate-limit/аудит: `server/.env.example` (все секреты — в .env, gitignored); JWT_SECRET ОБЯЗАТЕЛЕН в production (сервер отказывается стартовать с dev-дефолтом). Rate-limit: глобальный 100/мин, auth-поверхность (/api/auth/*, /api/b2b/*) жёсткий 10/мин (brute-force/перечисление кодов); loopback/LAN exempt; dev-only заголовок `x-sa-loadtest: 1` для честного нагрузочного (в production игнорируется). Аудит: `data/audit.log` JSON-строки (auth_failure извне, recon_404, rate_limited 429).
- [ ] 5.4 Продакшен-сборка (vite build + server) на VPN-2. РЕШЕНИЕ (юзер, 17.08): НЕ ДЕПЛОИТЬ ПОКА — сначала полировка игры и отработка багов (вариант В). Порт-вопрос (443 занят Xray) решается к моменту деплоя.
- [ ] 5.5 Мобильная адаптация (планшет — позже, по запросу)

## Архитектурные решения (фикс)
- Крипта = единственный рынок (бренд-фокус).
- Рынок = слой `marketProfile.ts` (CRYPTO_PROFILE активен, FX_PROFILE — образец расширения).
- Враги 8/10 межрыночные; расширение под FX = добавление в один файл, НЕ второй код-бейс.

## Правила работы
- Не начал → `git pull`. Закончил → commit + `git push origin main`.
- Конфликт: `git pull`, при «выбрать слияние» — не паниковать, кинуть в чат.
- Секреты (.env) в git не идут — у каждого свой.
