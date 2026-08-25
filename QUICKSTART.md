# ⚡ SIGNAL ARENA — QUICK START

## 1. Run Locally (5 minutes)

```bash
# Clone
git clone https://github.com/hudyakovictor/srnaap.git
cd srnaap

# Install frontend
npm install

# Install backend
cd server && npm install && cd ..

# Start backend (terminal 1)
cd server && npm run dev

# Start frontend (terminal 2)
npm run dev
```

Open http://localhost:5173

---

## 2. Deploy to VPS (10 minutes)

```bash
# On your Ubuntu/Debian VPS:
curl -sSL https://raw.githubusercontent.com/hudyakovictor/srnaap/main/deploy.sh | bash
```

Or manually:
```bash
# Upload files
scp -r . root@your-vps:/opt/signal-arena/

# SSH into VPS
ssh root@your-vps
cd /opt/signal-arena
chmod +x deploy.sh
./deploy.sh
```

---

## 3. Deploy Smart Contract (Testnet)

```bash
cd contracts

# Install dependencies
npm install

# Create .env file
echo "PRIVATE_KEY=your_private_key_here" > .env
echo "ARBISCAN_API_KEY=your_arbiscan_key" >> .env

# Compile contracts
npm run compile

# Deploy to Arbitrum Sepolia testnet
npm run deploy:testnet

# Verify on Arbiscan
npx hardhat verify --network arbitrumSepolia DEPLOYED_ADDRESS
```

---

## 4. Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_ADMIN_ENABLED=false
```

### Backend (server/.env)
```
PORT=3001
HOST=0.0.0.0
JWT_SECRET=your-secret-key
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### Contracts (.env)
```
PRIVATE_KEY=your_wallet_private_key
ARBISCAN_API_KEY=your_arbiscan_api_key
```

---

## 5. Project Structure

```
srnaap/
├── src/                    # Frontend (React + TypeScript)
│   ├── App.tsx            # Main app
│   ├── screens/           # 12 game screens
│   ├── components/        # UI components
│   ├── lib/               # Game logic + state
│   └── i18n/              # Translations (RU/EN)
├── server/                # Backend (Fastify + Node.js)
│   ├── src/
│   │   ├── index.js       # Server entry
│   │   ├── engine/        # Battle engine
│   │   ├── routes/        # API routes
│   │   └── db/            # Database
│   └── package.json
├── contracts/             # Smart Contracts (Solidity)
│   ├── SignalArenaToken.sol
│   ├── hardhat.config.js
│   └── deploy.js
├── docs/                  # Documentation
│   ├── WHITEPAPER.md
│   ├── investor/          # Pitch deck, grants
│   ├── legal/             # ToS, Privacy
│   └── marketing/         # Community templates
├── public/                # Static assets
│   └── landing.html       # Landing page
├── deploy.sh              # One-click deploy
└── QUICKSTART.md          # This file
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Server health check |
| POST | /api/battle/create | Create new battle |
| POST | /api/battle/:id/start | Start battle |
| POST | /api/battle/:id/fight | Go to fight phase |
| POST | /api/battle/:id/source | Open data source |
| POST | /api/battle/:id/decide | Submit decision |
| GET | /api/battle/:id/tick | Timer sync |
| GET | /api/player/:id/stats | Player statistics |

---

## 7. Key Commands

```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build

# Backend
cd server
npm run dev          # Development (auto-reload)
npm start            # Production

# Contracts
cd contracts
npm run compile      # Compile Solidity
npm run test         # Run tests
npm run deploy:testnet  # Deploy to testnet
```

---

*Ready to build? Start with `npm run dev`!*
