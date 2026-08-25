// ============================================================
// AUTH MIDDLEWARE — JWT + Guest Mode
// Players can play as guests without wallet connection
// ============================================================
import { v4 as uuid } from "uuid";
import { createHash } from "crypto";
import { CONFIG } from "../config/index.js";
import { getUser, createUser, getUsersDB } from "../db/index.js";
import { activateReferral } from "../lib/referral.js";

// Distinct default display names so a fresh leaderboard does not read
// "AnonTrader / AnonTrader / AnonTrader …" — each guest gets a
// trader-style alias (still anonymous, just varied).
const GUEST_FIRST = ["Lynx", "Fox", "Orca", "Hawk", "Viper", "Wolf", "Otter", "Raven", "Bear", "Mantis", "Comet", "Drift"];
function guestDisplayName() {
  return GUEST_FIRST[Math.floor(Math.random() * GUEST_FIRST.length)] + " Trader";
}

// Generate a JWT (uses @fastify/jwt if available, else mock)
export async function generateToken(app, payload) {
  try {
    return app.jwt.sign(payload);
  } catch {
    // Mock JWT for dev when @fastify/jwt not installed
    return Buffer.from(JSON.stringify({ ...payload, _mock: true })).toString("base64");
  }
}

export async function verifyToken(app, token) {
  try {
    return app.jwt.verify(token);
  } catch {
    try {
      return JSON.parse(Buffer.from(token, "base64").toString());
    } catch {
      return null;
    }
  }
}

// ── ROUTES ──
export async function authMiddleware(app) {
  // Guest login (no wallet needed). Optional ?ref=CODE / body.refCode
  // activates the referral link immediately at registration (block 4.1).
  app.post("/api/auth/guest", async (req, reply) => {
    const guestId = `guest_${uuid().slice(0, 8)}`;
    const playerId = uuid();
    const displayName = guestDisplayName();

    createUser({ id: playerId, guest_id: guestId, display_name: displayName });

    // Block 4.1: bind the referral code (never throws — auth must not fail on referral).
    const refCode = (req.query?.ref || (req.body || {}).refCode || "").toString().trim().toUpperCase();
    let referral = null;
    if (refCode) {
      try {
        const r = activateReferral(playerId, refCode);
        referral = { code: refCode, linked: r.linked, error: r.error || null };
      } catch (e) {
        referral = { code: refCode, linked: false, error: e.message };
      }
    }

    const token = await generateToken(app, { playerId, guestId, type: "guest", iat: Math.floor(Date.now() / 1000) });
    return { token, playerId, guestId, displayName, referral };
  });

  // ── WALLET LOGIN — DISABLED ──
  // The signature verification is NOT implemented. While it is not, this
  // endpoint cannot be public: anyone could log in as ANY wallet address
  // they name. Removed from the router; the route re-attaches below
  // (DEV ONLY) with a warning so the token-phase work can continue.
  if (CONFIG.SERVER.NODE_ENV !== "production") {
  app.post("/api/auth/wallet", async (req, reply) => {
    const { walletAddress, signature, message } = req.body || {};
    if (!walletAddress || !signature) {
      return reply.code(400).send({ error: "Wallet address and signature required" });
    }
    // TODO: Verify signature with ethers.js / web3.js
    // const recovered = ethers.verifyMessage(message, signature);
    // if (recovered.toLowerCase() !== walletAddress.toLowerCase()) return reply.code(401);

    let player = getUsersDB().prepare("SELECT * FROM players WHERE wallet_addr = ?").get(walletAddress);
    if (!player) {
      const playerId = uuid();
      createUser({ id: playerId, guest_id: `guest_${uuid().slice(0, 8)}`, display_name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` });
      getUsersDB().prepare("UPDATE players SET wallet_addr = ? WHERE id = ?").run(walletAddress, playerId);
      player = getUser(playerId);
    }

    const token = await generateToken(app, {
      playerId: player.id, walletAddress, type: "wallet", iat: Math.floor(Date.now() / 1000),
    });
    return { token, playerId: player.id, walletAddress };
  });
  } // end wallet-login (dev only)

  // ── WALLET DEMO (block 4.2) — paper wallet, NO real keys ──
  // ROADMAP: WalletConnect в этой фазе = только «бумажный» режим.
  // The demo address is derived deterministically from the playerId
  // (sha256) and stored in players.wallet_addr. No signature is
  // requested, no provider is touched, nothing leaves the machine.
  app.post("/api/auth/wallet-demo", async (req, reply) => {
    const { playerId, name } = req.body || {};
    if (!playerId) return reply.code(400).send({ error: "playerId required" });
    const player = getUser(String(playerId));
    if (!player) return reply.code(404).send({ error: "player not found" });
    const h = createHash("sha256").update(`${playerId}:sa-demo`).digest("hex");
    const address = "0x" + h.slice(0, 40);
    const displayName = name || player.display_name;
    getUsersDB().prepare(
      "UPDATE players SET wallet_addr = ?, display_name = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(address, displayName, player.id);
    const token = await generateToken(app, {
      playerId: player.id, walletAddress: address, demo: true, type: "wallet-demo", iat: Math.floor(Date.now() / 1000),
    });
    return { token, playerId: player.id, address, demo: true, wallet: "paper" };
  });

  // Disconnect the paper wallet (keeps the player + progress).
  app.post("/api/auth/wallet-demo/disconnect", async (req) => {
    const { playerId } = req.body || {};
    if (playerId) {
      getUsersDB().prepare("UPDATE players SET wallet_addr = NULL, updated_at = datetime('now') WHERE id = ?").run(String(playerId));
    }
    return { ok: true };
  });

  // Token refresh
  app.post("/api/auth/refresh", async (req, reply) => {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const payload = await verifyToken(app, token);
    if (!payload) return reply.code(401).send({ error: "Invalid token" });

    const newToken = await generateToken(app, { ...payload, iat: Math.floor(Date.now() / 1000) });
    return { token: newToken };
  });
}
