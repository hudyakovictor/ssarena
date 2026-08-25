# SIGNAL ARENA — ПОЛНЫЙ ГАЙД ПО КОШЕЛЬКАМ, ТОКЕНАМ И ФИАТУ
## Как реализовать максимально безопасно на проде

---

## 🔐 АРХИТЕКТУРА БЕЗОПАСНОСТИ КОШЕЛЬКОВ

```
┌─────────────────────────────────────────────────────────────┐
│                    УРОВНИ ДОСТУПА                            │
│                                                              │
│  Уровень 0: Guest Mode (без кошелька)                        │
│  ├── Локальный guest_id (localStorage)                       │
│  ├── Можно играть, учиться, проходить сценарии               │
│  ├── НЕЛЬЗЯ: получать токены, торговать, участвовать в PvP  │
│  └── Прогресс сохраняется локально (мигрируется при логине)  │
│                                                              │
│  Уровень 1: Hot Wallet (MetaMask / Browser extension)       │
│  ├── Подпись через personal_sign (EIP-191)                  │
│  ├── JWT токен на 24 часа                                    │
│  ├── МОЖНО: PvP, турниры, earning, marketplace              │
│  └── Лимит: до $1,000 эквивалента без доп. проверок          │
│                                                              │
│  Уровень 2: Hardware Wallet (Ledger / Trezor)                │
│  ├── То же что Hot Wallet + hardware signature              │
│  ├── Повышенные лимиты: до $10,000                           │
│  └── Рекомендуется для treasury и крупных держателей        │
│                                                              │
│  Уровень 3: Multisig (Gnosis Safe / SAFE)                   │
│  ├── Для treasury проекта: 4/7 подписей                      │
│  ├── Для крупных операций: timelock 48 часов                 │
│  └── Все изменения контракта — ТОЛЬКО через multisig         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 ИНТЕГРАЦИЯ КРИПТО-КОШЕЛЬКОВ

### Шаг 1: Выбор провайдера

| Провайдер | Покрытие | Плюсы | Минусы | Статус |
|-----------|---------|-------|--------|--------|
| **MetaMask** | 30M+ пользователей | Самый популярный, ethers.js native | Только EVM-сети | ✅ Рекомендован |
| **WalletConnect v2** | 500+ кошельков | Мобильные кошельки, QR-код | Сложнее интеграция | ✅ Второй этап |
| **Coinbase Wallet** | 10M+ | Интеграция с Coinbase | Меньше аудитория | 🔲 Опционально |
| **Phantom** | Solana аудитория | #1 на Solana | Не EVM | 🔲 При выходе на Solana |
| **Rainbow** | iOS-first | Красивый UX | Маленькая доля | 🔲 Опционально |

### Шаг 2: Имплементация (ethers.js v6)

```typescript
// packages: ethers@6, @web3modal/wagmi (для WalletConnect v2)

import { BrowserProvider } from 'ethers';

async function connectWallet(): Promise<WalletState> {
  // 1. Проверить наличие провайдера
  if (!window.ethereum) {
    throw new Error('Wallet not found. Install MetaMask or use guest mode.');
  }

  // 2. Запросить аккаунты (MetaMask всплывает)
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  const address = accounts[0];

  // 3. Подписать сообщение (EIP-191) — БЕЗ газовых затрат
  const nonce = Date.now().toString();
  const message = `Signal Arena: Proof of Skill\nWallet: ${address}\nNonce: ${nonce}\n\nI confirm that I am the owner of this wallet and agree to the Terms of Service.`;
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);

  // 4. Отправить signature на backend для верификации
  const response = await fetch('/api/auth/wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: address, signature, message }),
  });

  // 5. Backend верифицирует: ethers.verifyMessage(message, signature) === address
  // 6. Backend выдаёт JWT токен на 24 часа
  const { token, playerId } = await response.json();

  // 7. Сохранить JWT в httpOnly cookie (НЕ в localStorage!)
  // Сервер ставит cookie: Set-Cookie: sa_token=<jwt>; HttpOnly; Secure; SameSite=Strict

  return { address, token, playerId };
}
```

### Шаг 3: Безопасность на фронтенде

| Мера | Почему |
|------|--------|
| **JWT в httpOnly cookie** | XSS-атака не украдёт токен |
| **Signature один раз за сессию** | Не дёргать MetaMask на каждый запрос |
| **Nonce защита от replay** | Один nonce — одна подпись |
| **CORS: strict origin** | Только signalarena.io |
| **CSP заголовки** | Блокировать inline scripts |
| **Content-Security-Policy: default-src 'self'** | Никаких сторонних скриптов |

### Шаг 4: Безопасность на бэкенде

```javascript
// server/src/middleware/auth.js — верификация wallet signature

import { ethers } from 'ethers';

export async function verifyWalletSignature(walletAddress, signature, message) {
  // 1. Восстановить адрес из подписи
  const recoveredAddress = ethers.verifyMessage(message, signature);

  // 2. Сравнить (case-insensitive!)
  if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error('Signature verification failed');
  }

  // 3. Проверить nonce (не использовался ли ранее?)
  const nonceMatch = message.match(/Nonce: (\d+)/);
  if (!nonceMatch) throw new Error('No nonce in message');
  const nonce = nonceMatch[1];

  // 4. Проверить что nonce не старше 5 минут
  if (Date.now() - parseInt(nonce) > 5 * 60 * 1000) {
    throw new Error('Nonce expired');
  }

  // 5. Проверить что nonce не использовался (Redis кэш)
  const used = await redis.get(`nonce:${nonce}`);
  if (used) throw new Error('Nonce already used');
  await redis.setex(`nonce:${nonce}`, 600, '1');

  return recoveredAddress;
}
```

---

## 💵 ФИАТНАЯ ИНТЕГРАЦИЯ (КАК ПРАВИЛЬНО)

### Вариант A: Крипто-процессинг (рекомендован)

| Провайдер | Комиссия | Фиат→Крипто | Крипто→Фиат | KYC |
|-----------|---------|-------------|-------------|-----|
| **MoonPay** | 4.5% | ✅ | ❌ | Базовый |
| **Ramp** | 2.9% | ✅ | ❌ | Базовый |
| **Banxa** | 2.99% | ✅ | ❌ | Средний |
| **Transak** | 3.5% | ✅ | ❌ | Лёгкий |
| **Coinbase Commerce** | 1% | ✅ | ❌ | Нет (self-custody) |

**Рекомендация: Ramp + Transak как fallback**

```typescript
// Интеграция Ramp (iframe/widget)
// 1. Открыть Ramp widget:
const rampUrl = `https://buy.ramp.network/?hostApiKey=${RAMP_API_KEY}&userAddress=${walletAddress}&swapAsset=ETH_SIGNAL_ARENA&fiatCurrency=USD&fiatValue=100`;

// 2. В iframe или popup
// 3. Ramp обрабатывает KYC, платёж, отправляет ETH/$SIG на address
// 4. Webhook на backend: POST /api/webhooks/ramp → подтверждение платежа
```

### Вариант B: Прямые карты (Stripe)

```typescript
// Stripe Checkout для premium подписки
// 1. Создать Checkout Session:
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price: 'price_monthly_premium', quantity: 1 }],
  mode: 'subscription',
  success_url: 'https://signalarena.io/premium/activated',
  cancel_url: 'https://signalarena.io/premium/cancelled',
  metadata: { playerId },
});

// 2. Webhook: POST /api/webhooks/stripe
//    → Активировать premium_status в DB_USERS

// ВАЖНО: Stripe для фИАТНЫХ платежей.
// Токен $SIG нельзя купить через Stripe (регуляторные риски!).
// Stripe → только premium подписка, season pass, косметика.
```

### Вариант C: P2P / Одноранговый обмен

```
Встроенный P2P-обменник (на DEX):
- Uniswap пул ликвидности: $SIG / ETH
- Пользователи обменивают ETH → $SIG прямо в интерфейсе
- 0% комиссии платформы (только gas + LP fee)
- Не требует KYC
- Полностью децентрализованно
```

---

## 🔒 ДОПОЛНИТЕЛЬНЫЕ МЕРЫ БЕЗОПАСНОСТИ

### 1. Multisig для Treasury
```
Treasury адрес: Gnosis Safe на Ethereum mainnet
Схема: 4 из 7 подписей
Подписанты:
  1. CEO (аппаратный кошелёк)
  2. CTO (аппаратный кошелёк)
  3. Operations lead (аппаратный кошелёк)
  4. Внешний аудитор (аппаратный кошелёк)
  5. Timelock контракт (48 часов)
  6. Резервный ключ (сейф)
  7. Резервный ключ (сейф, другая локация)
```

### 2. Аудит смарт-контрактов
```
Перед деплоем токена $SIG:
  1. Аудит от Trail of Bits / OpenZeppelin
  2. Аудит от CertiK (для доверия сообщества)
  3. Bug bounty программа (Immunefi): до $100,000 за критический баг
  4. Формальная верификация для критических функций
```

### 3. Безопасность ключей админа
```
- Админские ключи НИКОГДА не на сервере
- Доступ к продакшену: только через VPN + SSH ключ
- K8s secrets: ротация каждые 90 дней
- Все действия логируются в неизменяемый журнал
```

### 4. Анти-фишинг
```
- signalarena.io — единственный домен
- signal-arena.com, signalarena.app → редирект на основной
- DNSSEC включен
- EV-сертификат (Extended Validation)
- Предупреждение в интерфейсе: "Никогда не вводите seed-фразу на сайте!"
```

---

## 🌐 КАКИЕ БЛОКЧЕЙНЫ ПОДКЛЮЧАТЬ

| Блокчейн | Приоритет | Для чего | Срок |
|----------|----------|---------|------|
| **Ethereum** | 🔴 P0 | Основная сеть. Токен $SIG, treasury, governance | Месяц 0 |
| **Polygon** | 🔴 P0 | Дешёвые транзакции для игроков. 90% игровых операций | Месяц 0 |
| **Arbitrum** | 🟠 P1 | L2 для DeFi-интеграций. Быстро, дёшево | Месяц 3 |
| **Optimism** | 🟠 P1 | L2 альтернатива. RetroPGF eligibility | Месяц 3 |
| **Base** | 🟡 P2 | Coinbase аудитория. On-chain summer | Месяц 6 |
| **Solana** | 🟡 P2 | Другая аудитория. Высокая пропускная способность | Месяц 9 |
| **BNB Chain** | 🟢 P3 | Азиатский рынок | Месяц 12 |

---

## 📋 РЕГИСТРАЦИИ И ЛИЦЕНЗИИ

### Что нужно зарегистрировать:

| Что | Где | Зачем | Срок |
|-----|-----|-------|------|
| Юридическое лицо | BVI / Cayman / Switzerland | Защита активов, налоговое планирование | Месяц 1 |
| Trademark "Signal Arena" | USPTO / EUIPO | Защита бренда | Месяц 2 |
| Terms of Service | Сайт (обязательно!) | Юридическая защита | Месяц 0 |
| Privacy Policy | Сайт (обязательно!) | GDPR compliance | Месяц 0 |
| Token legal opinion | Юридическая фирма | Доказательство что $SIG — utility, не security | Месяц 1 |
| VASP лицензия (опционально) | Локальный регулятор | Если планируется хранение средств пользователей | Месяц 6 |

### Где регистрировать компанию:
```
Рекомендация: BVI (British Virgin Islands) или Cayman Islands

Почему:
- Нейтральная юрисдикция для crypto
- Нет налога на прибыль (0% corporate tax)
- Признана международным сообществом
- Простая регистрация (2-4 недели)
- Многие crypto-проекты там (Binance, BitMEX, и др.)

Альтернатива: Zug, Switzerland ("Crypto Valley")
- Более высокая репутация
- Выше налоги (~12%)
- Сложнее регистрация
- Доступ к швейцарским банкам
```

---

## 🔄 MIGRATION: DEV → PROD (кошельки)

```
DEV (сейчас):
├── Guest mode: localStorage guest_id
├── Mock wallet (нет реальной подписи)
└── Все данные в SQLite файле

PROD (перед запуском):
├── Guest mode: как в dev
├── MetaMask: полная интеграция ethers.js
├── WalletConnect v2: QR-код логин
├── JWT в httpOnly cookies
├── PostgreSQL для пользователей
├── Redis для nonce (anti-replay)
└── Все секреты в K8s Secrets
```

---

## ✅ PRODUCTION WALLET CHECKLIST

- [ ] ethers.js v6 установлен и протестирован
- [ ] HTTPS включен (обязательно для MetaMask!)
- [ ] JWT в httpOnly cookie (не в localStorage)
- [ ] Nonce проверка на backend (anti-replay)
- [ ] Rate limiting на /api/auth/wallet (5 попыток/мин)
- [ ] CORS: только signalarena.io
- [ ] CSP: default-src 'self'
- [ ] Подпись wallet connect протестирована с MetaMask, Coinbase Wallet, Rainbow
- [ ] Транзакции в игре НЕ требуют газа (всё off-chain, signature-based)
- [ ] Treasury адрес: multisig 4/7 (Gnosis Safe)
- [ ] Аудит смарт-контракта токена $SIG пройден
- [ ] Bug bounty программа запущена
- [ ] Terms of Service и Privacy Policy на сайте
- [ ] DNSSEC включен
- [ ] Все фиатные платежи через Stripe (НЕ крипто-через-Stripe)
