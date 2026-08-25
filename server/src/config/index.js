// ============================================================
// SIGNAL ARENA — PRODUCTION CONFIGURATION
// Decoupled architecture: Admin ↔ Message Broker ↔ Game Server
// ============================================================
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try loading .env, fall back to defaults
let env = {};
try {
  const dotenv = await import("dotenv");
  env = dotenv.config()?.parsed || {};
} catch { /* dotenv not installed, use defaults */ }

export const CONFIG = {
  // ── Server ──
  SERVER: {
    PORT: parseInt(env.SERVER_PORT || "3001"),
    HOST: env.SERVER_HOST || "0.0.0.0",
    NODE_ENV: env.NODE_ENV || "development",
    LOG_LEVEL: env.LOG_LEVEL || "info",
  },

  // ── JWT ──
  JWT: {
    SECRET: env.JWT_SECRET || "signal-arena-jwt-secret-change-in-production",
    EXPIRES_IN: "24h",
    REFRESH_EXPIRES_IN: "7d",
  },

  // ── DB_USERS (Transactional — PostgreSQL-ready) ──
  DB_USERS: {
    // Development: SQLite | Production: PostgreSQL
    TYPE: env.DB_USERS_TYPE || "sqlite",
    SQLITE_PATH: env.DB_USERS_SQLITE || resolve(__dirname, "../data/users.db"),
    PG_HOST: env.DB_USERS_PG_HOST || "localhost",
    PG_PORT: parseInt(env.DB_USERS_PG_PORT || "5432"),
    PG_DATABASE: env.DB_USERS_PG_DB || "signal_arena_users",
    PG_USER: env.DB_USERS_PG_USER || "sa_user",
    PG_PASSWORD: env.DB_USERS_PG_PASSWORD || "",
  },

  // ── DB_CONTENT (Read-Only Replica — Content) ──
  DB_CONTENT: {
    TYPE: env.DB_CONTENT_TYPE || "sqlite",
    SQLITE_PATH: env.DB_CONTENT_SQLITE || resolve(__dirname, "../data/content.db"),
    // Production: this is a READ-ONLY replica. No write credentials exist on prod.
    PG_HOST: env.DB_CONTENT_PG_HOST || "localhost",
    PG_DATABASE: env.DB_CONTENT_PG_DB || "signal_arena_content",
    // IMPORTANT: On production, this user has SELECT-only privileges
    PG_READONLY_USER: env.DB_CONTENT_PG_RO_USER || "sa_content_reader",
    PG_READONLY_PASS: env.DB_CONTENT_PG_RO_PASS || "",
  },

  // ── Redis (Game Session Buffer) ──
  REDIS: {
    ENABLED: env.REDIS_ENABLED !== "false",
    HOST: env.REDIS_HOST || "localhost",
    PORT: parseInt(env.REDIS_PORT || "6379"),
    PASSWORD: env.REDIS_PASSWORD || "",
    SESSION_TTL: 1800, // 30 min — battle session timeout
  },

  // ── Message Broker (Analytics Streaming) ──
  BROKER: {
    TYPE: env.BROKER_TYPE || "memory", // "memory" | "rabbitmq" | "kafka"
    RABBITMQ_URL: env.RABBITMQ_URL || "amqp://localhost",
    KAFKA_BROKERS: (env.KAFKA_BROKERS || "localhost:9092").split(","),
    TOPICS: {
      BATTLE_EVENTS: "sa.battle.events",
      PLAYER_ACTIONS: "sa.player.actions",
      ERROR_LOGS: "sa.errors",
      ANALYTICS: "sa.analytics",
    },
  },

  // ── Content Sync (Stealth Push/Pull) ──
  CONTENT_SYNC: {
    // Push from admin to staging area
    STAGING_BUCKET: env.CONTENT_STAGING || "s3://signal-arena-content-staging",
    // Pull agent on production checks this endpoint
    PULL_ENDPOINT: env.CONTENT_PULL_ENDPOINT || "",
    PULL_INTERVAL_MINUTES: parseInt(env.CONTENT_PULL_INTERVAL || "60"),
    // Encryption for content packages
    ENCRYPTION_KEY: env.CONTENT_ENCRYPTION_KEY || "",
  },

  // ── CDN / Localization ──
  CDN: {
    BASE_URL: env.CDN_BASE_URL || "https://cdn.signalarena.io",
    LOCALES_PATH: "/locales",
    CACHE_MAX_AGE: 86400, // 24 hours
  },

  // ── OpenRouter AI ──
  OPENROUTER: {
    API_KEY: env.OPENROUTER_API_KEY || "",
    ENDPOINT: "https://openrouter.ai/api/v1/chat/completions",
    DEFAULT_MODEL: "anthropic/claude-3.5-sonnet",
    FALLBACK_MODEL: "google/gemini-2.0-flash-001",
    MAX_TOKENS: 4096,
    TEMPERATURE: 0.8,
  },

  // ── Anti-DDoS / Rate Limiting ──
  SECURITY: {
    RATE_LIMIT_MAX: parseInt(env.RATE_LIMIT_MAX || "100"),
    RATE_LIMIT_WINDOW_MS: parseInt(env.RATE_LIMIT_WINDOW || "60000"),
    // Reconnaissance detection
    RECON_PATTERNS: ["/admin", "/.git", "/.env", "/config", "/wp-admin", "/phpmyadmin", "/.aws", "/backup"],
    RECON_LATENCY_PENALTY_MS: 5000,
    RECON_BAN_DURATION_MS: 3600000, // 1 hour
  },
};

// ── Block 5.3: secret hardening ──
// The dev default JWT secret must never reach a production build
// silently — tokens signed with it are forgeable by anyone reading the repo.
if (!env.JWT_SECRET) {
  if (CONFIG.SERVER.NODE_ENV === "production") {
    console.error("  ❌ NODE_ENV=production but JWT_SECRET is not set — refusing to start with the dev default (export JWT_SECRET first).");
    process.exit(1);
  }
  console.warn("  ⚠ JWT_SECRET not set — using dev default (block 5.3: set it in .env before deploying)");
}
