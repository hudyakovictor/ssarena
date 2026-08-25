# SIGNAL ARENA — PRODUCTION READINESS CHECKLIST (100 ПУНКТОВ)
## Пройти все пункты перед `kubectl apply -f k8s/`

---

## 🔐 БЕЗОПАСНОСТЬ (25 пунктов)

- [ ] 1. Все пароли в K8s Secrets, не в ConfigMaps и не в коде
- [ ] 2. JWT_SECRET заменён на случайную строку длиной ≥ 64 символа
- [ ] 3. DB_USERS_PASSWORD заменён на уникальный сложный пароль
- [ ] 4. DB_CONTENT_PASSWORD заменён (read-only юзер!)
- [ ] 5. ENCRYPTION_KEY для контент-пакетов задан (32+ символов)
- [ ] 6. OpenRouter API key задан (или осознанно оставлен пустым для expert mode)
- [ ] 7. Все порты кроме 80/443 закрыты файрволом
- [ ] 8. PostgreSQL порты (5432) не exposed наружу — только VPC
- [ ] 9. Redis порт (6379) не exposed наружу
- [ ] 10. Админские эндпоинты заблокированы с внешних IP
- [ ] 11. Anti-recon middleware включен и протестирован
- [ ] 12. Rate limiting настроен: 100 req/min для /api/*
- [ ] 13. CORS настроен только для signalarena.io и localhost
- [ ] 14. CSP заголовки заданы в Nginx
- [ ] 15. HTTPS enforced (redirect HTTP → HTTPS)
- [ ] 16. SSL сертификат валиден (Let's Encrypt auto-renew)
- [ ] 17. Баланс облачного аккаунта > $500 (защита от отключения)
- [ ] 18. 2FA включен на облачном аккаунте
- [ ] 19. K8s RBAC настроен (минимальные права)
- [ ] 20. Docker images сканированы на уязвимости
- [ ] 21. .env файл НЕ закоммичен в Git
- [ ] 22. Все secrets НЕ в логах (проверить console.log)
- [ ] 23. WebSocket будет работать через WSS (TLS)
- [ ] 24. Content-Security-Policy: default-src 'self'
- [ ] 25. Проведён быстрый пентест (хотя бы nikto или OWASP ZAP)

## 🗄️ БАЗЫ ДАННЫХ (15 пунктов)

- [ ] 26. PostgreSQL PVC имеет размер ≥ 50GB (DB_USERS) и ≥ 20GB (DB_CONTENT)
- [ ] 27. Автобэкап настроен: pg_dump → S3 каждые 24 часа
- [ ] 28. Бэкап проверен восстановлением (хотя бы раз)
- [ ] 29. Индексы на player_id, entity_id, created_at созданы
- [ ] 30. DB_CONTENT юзер имеет ТОЛЬКО SELECT права (проверить: GRANT SELECT)
- [ ] 31. DB_USERS юзер имеет полные права (INSERT/UPDATE/DELETE)
- [ ] 32. WAL archiving включен (для point-in-time recovery)
- [ ] 33. Connection pool настроен (pgbouncer или встроенный)
- [ ] 34. Slow query log включен (логировать >500ms)
- [ ] 35. VACUUM ANALYZE настроен на ежедневный запуск
- [ ] 36. Дисковое пространство мониторится (alert при <20%)
- [ ] 37. derived metrics таблицы созданы (schema.sql применён)
- [ ] 38. metrics_retention_cohorts инициализированы
- [ ] 39. Seed данные загружены (npm run db:seed)
- [ ] 40. Проверена целостность foreign key constraints

## 🖥️ API / БЭКЕНД (15 пунктов)

- [ ] 41. Health check эндпоинт работает: GET /api/health → 200
- [ ] 42. K8s liveness probe указывает на /api/health
- [ ] 43. K8s readiness probe указывает на /api/health
- [ ] 44. JWT авторизация работает (проверить валидный/невалидный токен)
- [ ] 45. Guest login работает: POST /api/auth/guest → token
- [ ] 46. Wallet login работает (если Web3 включен)
- [ ] 47. Game эндпоинты: prebattle, battle/decide, battle/toggle-source
- [ ] 48. Twist events генерируются с вероятностью ~40%
- [ ] 49. Ghost duels: GET /api/game/ghost/:playerId работает
- [ ] 50. Leaderboard: GET /api/leaderboard/global работает
- [ ] 51. Player profile: GET /api/player/:id работает
- [ ] 52. Admin content push работает (с localhost)
- [ ] 53. AI Co-Pilot scan работает: POST /api/ai/scan
- [ ] 54. Логирование всех ошибок в broker работает
- [ ] 55. Response time < 200ms для 95% запросов (проверить load test)

## 🌐 ФРОНТЕНД (10 пунктов)

- [ ] 56. Production build собран без ошибок: `npm run build`
- [ ] 57. Все 16 чанков загружаются (проверить в Network tab)
- [ ] 58. Lazy loading работает: экраны грузятся по требованию
- [ ] 59. ErrorBoundary перехватывает ошибки
- [ ] 60. Все 10 AI-изображений загружаются
- [ ] 61. TradingView график рендерится без ошибок
- [ ] 62. WebSocket подключается к WSS на проде
- [ ] 63. WalletConnect показывает guest mode при отсутствии MetaMask
- [ ] 64. Мобильная версия работает (проверить на iPhone/Android)
- [ ] 65. PWA манифест и service worker добавлены

## 📊 МОНИТОРИНГ (10 пунктов)

- [ ] 66. K8s metrics-server работает: `kubectl top pods`
- [ ] 67. Prometheus (или аналог) собирает метрики
- [ ] 68. Alert manager настроен на критические события
- [ ] 69. Uptime мониторинг внешний (BetterStack/Pingdom/UptimeRobot)
- [ ] 70. Логи агрегируются (хотя бы `kubectl logs`)
- [ ] 71. Error rate мониторится
- [ ] 72. P95/P99 latency мониторится
- [ ] 73. Broker queue depth мониторится (растёт → проблема)
- [ ] 74. Disk usage алерты
- [ ] 75. Ежедневный AI Co-Pilot отчёт настроен

## 💰 ЭКОНОМИКА (10 пунктов)

- [ ] 76. Sink механизмы протестированы (косметика сжигает токены)
- [ ] 77. Tournament fees распределяются: 50% burn, 50% treasury
- [ ] 78. Premium subscription создаёт burn event
- [ ] 79. Earn-only путь проверен: можно играть БЕЗ токенов
- [ ] 80. Токен не даёт игрового преимущества (non-pay-to-win)
- [ ] 81. Fairness метрики инициализированы (free vs premium)
- [ ] 82. Treasury адрес — multisig (в будущем)
- [ ] 83. Максимальная эмиссия не превышает заданную
- [ ] 84. Ни одна механика не создаёт бесконечную инфляцию
- [ ] 85. Цена токена отслеживается (CoinGecko/DexScreener API)

## 🚀 ДЕПЛОЙ (10 пунктов)

- [ ] 86. `docker-compose up -d` работает локально
- [ ] 87. K8s манифесты валидны: `kubectl apply --dry-run=client -f k8s/`
- [ ] 88. Ingress controller установлен: `kubectl get pods -n ingress-nginx`
- [ ] 89. cert-manager установлен: `kubectl get pods -n cert-manager`
- [ ] 90. Pull agent cron job настроен (или ручной запуск)
- [ ] 91. Staging bucket доступен (S3/Minio)
- [ ] 92. Контент-пакет протестирован: encrypt → push → pull → decrypt
- [ ] 93. Rolling update strategy: maxSurge=2, maxUnavailable=0
- [ ] 94. HPA: min 3 реплики, max 20 (по CPU 70%)
- [ ] 95. Pod anti-affinity: поды на разных нодах

## 📋 ОПЕРАЦИОННЫЕ (5 пунктов)

- [ ] 96. Все секреты задокументированы (НЕ в Git!)
- [ ] 97. Контакты на случай инцидента (Discord/Twitter/Email)
- [ ] 98. План коммуникации при инциденте готов
- [ ] 99. Процедура восстановления из бэкапа протестирована
- [ ] 100. **Последний пункт: запущена команда `kubectl apply -f k8s/`**

---

## 🎯 РЕЗУЛЬТАТ

**Пройдено: ___ / 100**

- 90-100: ✅ Готов к продакшену
- 75-89: ⚠️ Можно запускать, но доделать оставшееся
- 50-74: 🔴 Рискованно. Завершить критические пункты.
- <50: 🚫 НЕ ЗАПУСКАТЬ.

**Минимальный набор для запуска (must-have):** 1-5, 7-10, 26, 41-44, 56-57, 60, 66, 86-88.
