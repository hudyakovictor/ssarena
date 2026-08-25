// ============================================================
// REDIS BUFFER — Game Session Management ($16.4)
// Battle state in Redis with 30-min TTL
// Fallback to in-memory Map if Redis disabled
// ============================================================
import { CONFIG } from "../config/index.js";

const memoryFallback = new Map();

// Try to create Redis client
let redisClient = null;
let redisReady = false;

try {
  if (CONFIG.REDIS.ENABLED) {
    const Redis = (await import("ioredis")).default;
    redisClient = new Redis({
      host: CONFIG.REDIS.HOST,
      port: CONFIG.REDIS.PORT,
      password: CONFIG.REDIS.PASSWORD || undefined,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
    redisClient.on("connect", () => { redisReady = true; console.log("  🟢 Redis connected"); });
    redisClient.on("error", () => { redisReady = false; });
    await redisClient.connect().catch(() => { redisReady = false; console.log("  🟡 Redis unavailable — using in-memory buffer"); });
  }
} catch { console.log("  🟡 ioredis not installed — using in-memory buffer"); }

export const redis = { isReady: redisReady, client: redisClient };

export async function getSession(key) {
  if (redisReady && redisClient) {
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  const entry = memoryFallback.get(key);
  if (entry && entry._expiresAt && Date.now() > entry._expiresAt) { memoryFallback.delete(key); return null; }
  return entry || null;
}

export async function setSession(key, data, ttlSeconds = 1800) {
  const ttl = ttlSeconds || CONFIG.REDIS.SESSION_TTL;
  if (redisReady && redisClient) {
    await redisClient.setex(key, ttl, JSON.stringify(data));
  } else {
    memoryFallback.set(key, { ...data, _expiresAt: Date.now() + ttl * 1000 });
  }
}

export async function deleteSession(key) {
  if (redisReady && redisClient) {
    await redisClient.del(key);
  } else {
    memoryFallback.delete(key);
  }
}

export async function getActiveSessions() {
  if (redisReady && redisClient) {
    const keys = await redisClient.keys("battle:*");
    return keys.length;
  }
  // Clean expired from memory fallback
  const now = Date.now();
  for (const [k, v] of memoryFallback.entries()) {
    if (v._expiresAt && now > v._expiresAt) memoryFallback.delete(k);
  }
  return memoryFallback.size;
}
