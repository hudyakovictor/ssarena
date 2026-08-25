# SIGNAL ARENA — 50-АНАЛИЗОВ ДЛЯ СЛЕДУЮЩЕЙ ИТЕРАЦИИ

## КРИТИЧЕСКИЕ (5)

**A1. Admin завязан на фронтенд** — `App.tsx`: 5 строк admin/overseer. План: `VITE_ADMIN_ENABLED` env flag → при false zero admin code в билде.
**A2. 11/12 экранов без i18n** — Только Settings использует useT(). План: обернуть все экраны.
**A3. 10/12 экранов без API** — Mock-данные везде. План: api.ts клиент на все экраны.
**A4. 9/12 экранов без error handling** — План: ErrorBoundary + try/catch + retry.
**A5. Arena.tsx — 72 строки** — Самый недоработанный. План: WS-матчмейкинг, турнирная сетка.

## ВЫСОКИЕ (10)

A6. Loading skeletons (0/12 экранов)
A7. Empty states (0/12)
A8. Dashboard: хардкод метрик
A9. Collection: не подключён к API
A10. Profile: нет API-интеграции
A11. Market: кнопки не работают
A12. Onboarding: не сохраняет прогресс
A13. Battle: нет WS-статуса
A14. Sound не используется в Battle
A15. Bestiary: нет фильтра по статусу

## СРЕДНИЕ (15)

A16-A30: Academy progress bar, Arena турниры, Battle выбор карт, Bestiary лор, Collection сортировка, Dashboard streak, Market категории, Overseer график, Profile история боёв, Settings тема.

## НИЗКИЕ (20)

A31-A50: SEO, a11y, performance, toast-уведомления, debounce, keyboard nav, React Query, виртуальный скролл.

## 20/80 ПЛАН

Фаза 1: VITE_ADMIN_ENABLED (admin отделяется)
Фаза 2: i18n на все экраны
Фаза 3: API-интеграция (Dashboard, Battle, Bestiary, Collection, Profile, Arena, Market)
Фаза 4: Loading/Empty/Error states
Фаза 5: Arena + Battle polish (WS, звуки, выбор карт)
Фаза 6: SEO + a11y
Фаза 7: Performance
