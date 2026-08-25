// ============================================================
// SIGNAL ARENA — MAIN SERVER (Fastify)
// Stateless API with JWT auth, rate limiting, anti-recon
// ============================================================
import Fastify from "fastify";
import { CONFIG } from "./config/index.js";
import { initUsersDB, initContentDB } from "./db/index.js";
import { authMiddleware } from "./middleware/auth.js";
import { antiReconMiddleware } from "./middleware/anti-recon.js";
import { securityPlugin, RATE_LIMIT_AUTH } from "./middleware/security.js";
import { gameRoutes } from "./routes/game.js";
import { playerRoutes } from "./routes/player.js";
import { leaderboardRoutes } from "./routes/leaderboard.js";
import { adminRoutes } from "./routes/admin.js";
import { wsRoutes } from "./routes/ws.js";
import { agentRoutes } from "./routes/agent-api.js";
import { simulationRoutes } from "./routes/simulation-api.js";
import { battleRoutes } from "./routes/battle-api.js";
import { contentRoutes, candlesRoutes } from "./routes/content.js";
import { overseerLiveRoutes } from "./routes/overseer.js";
import { referralRoutes } from "./routes/referral.js";
import { b2bRoutes } from "./routes/b2b.js";
import { broker, initBroker } from "./lib/broker.js";

// Track recon attempts
const reconHits = new Map();

const app = Fastify({
  logger: { level: CONFIG.SERVER.LOG_LEVEL },
  trustProxy: true,
});

// ── PLUGINS ──
// CORS
try {
  const cors = (await import("@fastify/cors")).default;
  await app.register(cors, { origin: true, credentials: true });
} catch { app.log.warn("@fastify/cors not installed — CORS disabled"); }

// JWT
try {
  const jwt = (await import("@fastify/jwt")).default;
  await app.register(jwt, { secret: CONFIG.JWT.SECRET });
  app.decorate("authenticate", async (req, reply) => {
    try { await req.jwtVerify(); } catch { reply.code(401).send({ error: "Invalid token" }); }
  });
} catch { app.log.warn("@fastify/jwt not installed — using mock auth"); }

// ── ANTI-RECONNAISSANCE (runs FIRST) ──
app.addHook("onRequest", antiReconMiddleware);

// ── RATE LIMITING ──
// Global cap (all routes) + tight cap on the auth surface
// (brute force / referral-code / B2B-key enumeration — block 5.3).
app.addHook("onRequest", async (req, reply) => {
  // Exemptions:
  // 1) Load-test header — dev ONLY, simulates 50 different external users
  //    (per-IP limits would cap one local IP at 100/min and turn the 50
  //    parallel battles into a limit test, not a capacity test). In
  //    NODE_ENV=production the header is treated as an ordinary request
  //    and the limits apply as usual.
  // 2) Loopback / private LAN — the user's own machine, never throttled.
  const a = req.ip || "";
  const isLoadtest = req.headers["x-sa-loadtest"] === "1" && CONFIG.SERVER.NODE_ENV !== "production";
  const isPrivate = a === "127.0.0.1" || a === "::1" || a === "::ffff:127.0.0.1" || a.startsWith("192.168.") || a.startsWith("10.") || /^172\.(1[6-9]|2\d|3[01])\./.test(a);
  if (isLoadtest || isPrivate) return;

  const isAuthSurface = req.url.startsWith("/api/auth") || req.url.startsWith("/api/b2b");
  const windowMs = isAuthSurface ? RATE_LIMIT_AUTH.timeWindow : CONFIG.SECURITY.RATE_LIMIT_WINDOW_MS;
  const max = isAuthSurface ? RATE_LIMIT_AUTH.max : CONFIG.SECURITY.RATE_LIMIT_MAX;

  const ip = req.ip || "unknown";
  const key = `rl:${ip}:${isAuthSurface ? "auth" : "global"}`;
  const now = Date.now();

  const entry = reconHits.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  reconHits.set(key, entry);

  if (entry.count > max) {
    reply.code(429).send({
      error: "Too Many Requests",
      layer1: "⚠ Rate Limit Exceeded",
      layer2: "Patience is a trading skill. Try again shortly.",
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    });
  }
});

// ── SECURITY / AUDIT (block 5.3): audit.log JSON lines ──
try {
  await app.register(securityPlugin);
  console.log("  🧾 Audit log: data/audit.log");
} catch (e) { app.log.warn("security plugin:", e.message); }

// ── ROUTES ──
await authMiddleware(app);
await app.register(gameRoutes, { prefix: "/api/game" });
await app.register(contentRoutes, { prefix: "/api/content" });
await app.register(candlesRoutes, { prefix: "/api/game" });
await app.register(playerRoutes, { prefix: "/api/player" });
await app.register(leaderboardRoutes, { prefix: "/api/leaderboard" });
await app.register(adminRoutes, { prefix: "/api/admin" });
await app.register(overseerLiveRoutes, { prefix: "/api/overseer" });
await app.register(referralRoutes, { prefix: "/api/referral" });
await app.register(b2bRoutes, { prefix: "/api/b2b" });
await battleRoutes(app);
await agentRoutes(app);
await simulationRoutes(app);

// ── /api/ai/* ALIASES (frontend legacy paths) ──
{
  const { orchestrator } = await import("./agents/agent-system.js");
  app.post("/api/ai/scan", async (req) => orchestrator.scanAll(req.body || {}));
  app.get("/api/ai/health", async () => ({ status: "ok", agents: "online" }));
}

// Health check
app.get("/api/health", async () => ({
  status: "ok",
  version: "2.0.0",
  timestamp: new Date().toISOString(),
  motto: "Play the market. Don't become the liquidity.",
}));

// WebSocket — must attach AFTER app.ready(), when app.server exists
// (Fastify creates the underlying http.Server during ready()).
await app.ready();
const io = await wsRoutes(app);

// ── START ──
try {
  initUsersDB();
  initContentDB();
  await initBroker();

  await app.listen({ port: CONFIG.SERVER.PORT, host: CONFIG.SERVER.HOST });
  console.log(`\n⚡ Signal Arena Server v2.0.0`);
  console.log(`   Game API:     http://localhost:${CONFIG.SERVER.PORT}/api`);
  console.log(`   Health:       http://localhost:${CONFIG.SERVER.PORT}/api/health`);
  console.log(`   Admin:        http://localhost:${CONFIG.SERVER.PORT}/api/admin`);
  console.log(`   AI Co-Pilot:     http://localhost:${CONFIG.SERVER.PORT}/api/overseer/dashboard`);
  console.log(`   WebSocket:    ws://localhost:${CONFIG.SERVER.PORT}`);
  console.log(`   Broker:       ${CONFIG.BROKER.TYPE}`);
  console.log(`   DB Users:     ${CONFIG.DB_USERS.TYPE}`);
  console.log(`   DB Content:   ${CONFIG.DB_CONTENT.TYPE}\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
