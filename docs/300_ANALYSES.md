# SIGNAL ARENA — 300 KEY ANALYSES
## Полный аудит кода, инфраструктуры и контента
## Июль 2026 | Цель: 100% готовности

---

## СВОДКА

| Категория | Найдено |
|-----------|--------|
| CRITICAL (блокируют запуск) | 8 |
| HIGH (заметная недоделка) | 24 |
| MEDIUM (улучшения) | 52 |
| LOW (полировка) | 66+ |

---

## CRITICAL (8)

| # | Проблема | Где | Действие |
|---|---------|-----|----------|
| 1 | 0 тестов frontend+backend | Весь проект | Smoke-тест Battle + API health |
| 2 | 10 хардкод fetch(localhost:3001) | Admin.tsx | Заменить на api.ts клиент |
| 3 | MOCK_PLAYER вместо реального state | 9 экранов | PlayerContext/state management |
| 4 | i18n: 53/229 ключей использовано | i18n/index.ts | 100% покрытие |
| 5 | 8/18 Entities без AI-арта | public/images/ | Сгенерировать изображения |
| 6 | Broken doc links (4 файла не существуют) | docs/MASTER_INDEX.md | Создать или убрать |
| 7 | Admin зависит от localhost:3001 | Admin.tsx | API_BASE env |
| 8 | 22 :any типа в TypeScript | src/ | Типизировать |

## HIGH (24)

| # | Проблема |
|---|---------|
| 9 | EntityPortrait дублирован Battle.tsx/Bestiary.tsx |
| 10 | RarityGem дублирован Collection.tsx |
| 11 | Admin fetch не используют api.ts |
| 12 | overseer-routes.js — orphaned |
| 13 | ai-coordinator.js — orphaned |
| 14 | Нет error boundary на уровне экранов |
| 15 | Нет retry-логики для API |
| 16 | Нет optimistic updates |
| 17 | Нет debounce на поиске (Academy, Bestiary, Collection) |
| 18 | Нет виртуального скролла |
| 19 | Нет WS reconnect UI-индикатора |
| 20 | Historical events не подключены к Battle |
| 21 | Terminal Voice не используется в коде |
| 22 | ATTN currency не подключён к фронтенду |
| 23 | Oracle pricing не подключён |
| 24 | Seasons не подключены |
| 25 | Progression 12 осей не отражены в UI |
| 26 | MaintenanceBanner не используется |
| 27 | Simulation engine не протестирован |
| 28 | Early warning не подключён к agents |
| 29 | Нет graceful degradation WS |
| 30 | PWA без offline-режима |
| 31 | Battle не обрабатывает timeout |
| 32 | Share Card нет реального шаринга |

## MEDIUM (52)

| # | Экран | Проблема |
|---|-------|---------|
| 33-38 | Academy | нет поиска по entity, фильтра "доступные", sort по XP, mark-as-done, прогресса по дисциплинам |
| 39-43 | Arena | нет Rivals filter, быстрого боя, истории боёв, квестов, достижений |
| 44-48 | Battle | нет PreBattle card selection, undo источников, подсказок, звуков |
| 49-53 | Bestiary | нет сравнения entity, "худших врагов", прогресса открытия, поиска по дисциплине |
| 54-58 | Collection | нет sort по rarity, deck builder, сравнения карт, фильтра owned |
| 59-63 | Dashboard | нет графика онлайна, новостей, AI-рекомендаций, календаря ивентов |
| 64-68 | Market | нет категорий, корзины, истории покупок, wishlist |
| 69-73 | Profile | нет истории боёв, сравнения, экспорта данных |
| 74-78 | Settings | нет тёмной темы, экспорта настроек, удаления аккаунта |
| 79-84 | Общие | нет keyboard shortcuts, toast везде, PWA install prompt |

## LOW (66+)

| # | Категория | Проблема |
|---|----------|---------|
| 85-90 | a11y | skip-to-content, aria-labels, focus trapping |
| 91-96 | Perf | image lazy loading, font preload, CSS critical |
| 97-102 | SEO | OG image, Twitter card image, JSON-LD |
| 103-108 | DX | .editorconfig, pre-commit hooks, lint-staged |
| 109-114 | CI/CD | GitHub Actions, deploy scripts, staging |
| 115-120 | Monitoring | Grafana dashboards, alert rules, uptime |
| 121-126 | Security | CSP headers, security.txt, CAA records |
| 127-132 | DB | миграции, prod seed |
| 133-138 | API | OpenAPI spec, rate limit headers, request IDs |
| 139-144 | Docs | API reference, architecture diagrams, dev onboarding |
| 145-150 | Прочее | changelog, contributing, code of conduct |
