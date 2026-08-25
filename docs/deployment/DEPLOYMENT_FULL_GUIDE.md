# SIGNAL ARENA — FULL DEPLOYMENT GUIDE (DEV → PROD)
## Одна команда на каждом этапе. Без сотрудников.

---

## 🖥️ DEV-РЕЖИМ (Локальная разработка)

```bash
# 1. Клонировать
git clone <repo> && cd signal-arena-v2

# 2. Установить зависимости
npm install && cd server && npm install && cd ..

# 3. Заполнить БД контентом
cd server && npm run db:seed && cd ..

# 4. Запустить бэкенд (терминал 2)
cd server && npm run dev
# → API: http://localhost:3001
# → WebSocket: ws://localhost:3001
# → AI Co-Pilot: http://localhost:3001/api/ai/scan

# 5. Запустить фронтенд (терминал 1)
npm run dev
# → UI: http://localhost:5173

# 6. Открыть браузер → http://localhost:5173
```

**Проверка:** Перейти на `/overseer` → нажать "Полный скан" → должны появиться алерты.

---

## 🐳 DOCKER-РЕЖИМ (Локальное тестирование продакшена)

```bash
cd server

# Запустить все сервисы
docker-compose up -d
# → API ×3 (реплики), PostgreSQL ×2, Redis, RabbitMQ

# Проверить
curl http://localhost:3001/api/health

# Остановить
docker-compose down
```

---

## ☸️ KUBERNETES (Продакшен)

### Предварительные требования
- K8s кластер (GKE/EKS/AKS/DigitalOcean)
- kubectl настроен на кластер
- Ingress controller (nginx) установлен
- cert-manager установлен
- Домен api.signalarena.io направлен на IP балансировщика

### Деплой

```bash
cd server/k8s

# 1. Создать namespace
kubectl create namespace signal-arena

# 2. Применить секреты (ЗАМЕНИТЬ ЗНАЧЕНИЯ!)
kubectl create secret generic sa-secrets \
  --from-literal=jwt-secret="$(openssl rand -base64 64)" \
  --from-literal=db-users-password="$(openssl rand -base64 32)" \
  --from-literal=db-content-password="$(openssl rand -base64 32)" \
  --from-literal=rabbitmq-url="amqp://sa-rabbitmq-service:5672" \
  -n signal-arena

# 3. Деплой инфраструктуры (БД, Redis)
kubectl apply -f infrastructure.yaml

# 4. Деплой приложения (API + HPA + Ingress)
kubectl apply -f deployment.yaml

# 5. Проверить
kubectl get pods -n signal-arena
kubectl get svc -n signal-arena
kubectl get ingress -n signal-arena

# 6. Проверить health
curl https://api.signalarena.io/api/health
```

---

## 🔧 АДМИНКА (Локальная / удалённая)

### Вариант A: Локальная (рекомендуется)
```bash
# Просто npm run dev. Админ работает на localhost.
# Прод-сервер принимает команды только с localhost админского сервера.
```

### Вариант B: Отдельный VPS (скрытый)
```bash
# VPS без домена, доступ только по SSH
ssh admin-vps
cd /opt/signal-arena-v2
npm run dev -- --host 0.0.0.0 --port 5173

# Настроить VPN туннель между админ-VPS и прод-кластером
# Админские запросы идут через внутреннюю сеть
```

---

## 🔄 ОБНОВЛЕНИЕ КОНТЕНТА НА ПРОДЕ

```bash
# 1. В админке: Admin Panel → Generate Scenarios → APPROVE
# 2. В админке: npm run sync:content (или кнопка "Push to Staging")
# 3. На проде: Pull Agent автоматически забирает (каждые 60 мин)
# ИЛИ вручную:
kubectl exec -it deploy/signal-arena-api -n signal-arena -- \
  node src/content/pull-agent.js

# 4. Проверить:
curl https://api.signalarena.io/api/admin/content/pull-staging \
  -H "X-Admin-Token: ..."
```

---

## 📊 ПРОВЕРКА ПОСЛЕ ДЕПЛОЯ

```bash
# Health
curl https://api.signalarena.io/api/health

# AI Co-Pilot
curl -X POST https://api.signalarena.io/api/ai/scan \
  -H "Content-Type: application/json" -d '{}'

# Статистика подов
kubectl top pods -n signal-arena

# Логи (последние 100 строк)
kubectl logs -l app=signal-arena -n signal-arena --tail=100

# Активные WebSocket соединения
curl https://api.signalarena.io/api/admin/broker/status

# Проверить burn/emission
# Открыть админку → Overseer → Экономика
```

---

## 🔙 ОТКАТ

```bash
# Откатить API
kubectl rollout undo deployment/signal-arena-api -n signal-arena

# Откатить БД (из бэкапа)
# Восстановить из S3 бэкапа:
kubectl exec -it sa-db-users-0 -n signal-arena -- \
  psql -U sa_user -d signal_arena_users < /backup/latest.sql
```
