# RUNBOOK — ЭКСТРЕННЫЕ ПРОЦЕДУРЫ
## Что делать прямо сейчас при инциденте

---

## 🚨 ИНЦИДЕНТ 1: ИГРА НЕ РАБОТАЕТ (полный даун)

**Симптом:** api.signalarena.io не отвечает. Cloudflare показывает 502.

```bash
# 1. Проверить поды
kubectl get pods -n signal-arena
# Если CrashLoopBackOff → смотреть логи

# 2. Проверить логи
kubectl logs -l app=signal-arena -n signal-arena --tail=100 | grep -i error

# 3. Проверить БД
kubectl exec -it sa-db-users-0 -n signal-arena -- psql -U sa_user -c "SELECT 1"
# Если не отвечает → рестарт

# 4. Быстрый фикс: рестарт всего
kubectl rollout restart deployment/signal-arena-api -n signal-arena

# 5. Если не помогло: проверить облачный баланс
# Закончились деньги? Пополнить.

# 6. Коммуникация:
# Discord: "@everyone Brief maintenance. Back in 15 min."
```

---

## 🚨 ИНЦИДЕНТ 2: БАЗА ДАННЫХ ПОВРЕЖДЕНА

```bash
# 1. Проверить целостность
kubectl exec -it sa-db-users-0 -n signal-arena -- \
  psql -U sa_user -d signal_arena_users -c "SELECT count(*) FROM players"

# 2. Если ошибка: восстановить из бэкапа
kubectl exec -it sa-db-users-0 -n signal-arena -- \
  sh -c "aws s3 cp s3://sa-backups/latest.sql - | psql -U sa_user -d signal_arena_users"

# 3. Проверить replication lag (если есть standby)
kubectl exec -it sa-db-users-0 -n signal-arena -- \
  psql -U sa_user -c "SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn()"

# 4. Время восстановления: 5-15 минут (зависит от размера БД)
```

---

## 🚨 ИНЦИДЕНТ 3: DDOS-АТАКА

```bash
# 1. Проверить нагрузку
kubectl top pods -n signal-arena

# 2. Включить Cloudflare "Under Attack" mode
# → Cloudflare Dashboard → Security → Under Attack Mode: ON

# 3. Увеличить rate limit
kubectl set env deployment/signal-arena-api -n signal-arena RATE_LIMIT_MAX=30

# 4. Проверить IP атакующих
kubectl logs -l app=signal-arena -n signal-arena --tail=500 | \
  grep -oP 'ip=\K[0-9.]+' | sort | uniq -c | sort -rn | head -20

# 5. Забанить топ-5 IP
for ip in <IP1> <IP2> <IP3>; do
  curl -X POST https://api.signalarena.io/api/admin/security/ban \
    -H "Content-Type: application/json" \
    -d "{\"ip\": \"$ip\", \"durationMs\": 86400000}"
done

# 6. Масштабировать (если нужно)
kubectl scale deployment signal-arena-api --replicas=10 -n signal-arena
```

---

## 🚨 ИНЦИДЕНТ 4: ТОКЕН ПАДАЕТ −50% ЗА ДЕНЬ

```bash
# 1. НЕ ПРОДАВАТЬ свои токены. Сохранять спокойствие.

# 2. Проверить: это organic или атака?
# Посмотреть exchange inflow/outflow:
curl https://api.signalarena.io/api/ai/market | jq '.exchangeInflow, .exchangeOutflow'

# 3. Если massive inflow (>5x нормы): whale dump
# → Запустить buyback (если treasury позволяет)
# → Коммуникация: "Treasury активен. Мы верим в проект."

# 4. Если organic: усилить sink механики
# → Админка → Economy → Execute: ADD_PREMIUM_SINK
# → Админка → Economy → Execute: LIMITED_EDITION_SKINS

# 5. Усилить коммуникацию
# Twitter: "D1 retention: 38% → 52%. Игра растёт. Токен — топливо, не цель."
# Discord: Метрики. Прозрачность. Roadmap.
```

---

## 🚨 ИНЦИДЕНТ 5: УТЕЧКА КЛЮЧЕЙ

```bash
# 1. Немедленно: сбросить ВСЕ ключи
kubectl delete secret sa-secrets -n signal-arena

# 2. Создать новые
kubectl create secret generic sa-secrets \
  --from-literal=jwt-secret="NEW_RANDOM_64_CHAR_STRING" \
  --from-literal=db-users-password="NEW_PASSWORD" \
  --from-literal=db-content-password="NEW_PASSWORD" \
  -n signal-arena

# 3. Рестарт подов
kubectl rollout restart deployment/signal-arena-api -n signal-arena

# 4. Инвалидировать все JWT токены
# (автоматически — новый secret = старые токены невалидны)

# 5. Сообщить игрокам: "Security upgrade. Please re-login."
# Игроки перезаходят → новые токены.

# 6. Провести аудит: кто имел доступ? Что могло утечь?
# Проверить логи админки на предмет неавторизованных доступов.
```

---

## 📞 ШАБЛОН СООБЩЕНИЯ В DISCORD ПРИ ИНЦИДЕНТЕ

```
🚨 SERVICE INCIDENT

**Статус:** Расследуем проблему с API.
**Влияние:** Бои могут быть недоступны.
**Ваш прогресс:** Сохранён. Всё восстановится.
**ETA:** 15 минут.

Следите за обновлениями в этом канале.
```

---

## ⏱️ SLA (SERVICE LEVEL AGREEMENT) — ВНУТРЕННИЙ

| Инцидент | Целевое время реакции | Целевое время восстановления |
|----------|----------------------|------------------------------|
| Полный даун | 2 минуты | 15 минут |
| Деградация API | 5 минут | 30 минут |
| Проблема с контентом | 30 минут | 2 часа |
| Токен -50% | 1 час | Непрерывно |
| Утечка ключей | Немедленно | 1 час |

**Один человек может уложиться в эти SLA благодаря AI Co-Pilot и автоматизации.**
