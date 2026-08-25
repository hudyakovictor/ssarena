// ============================================================
// REFERRAL ROUTES (block 4.1) — mounted at /api/referral
// Guest-login binding (?ref=CODE) lives in auth.js right after
// player creation — see the /api/auth/guest handler.
// ============================================================
import { getUsersDB } from "../db/index.js";
import { activateReferral, referralStatus } from "../lib/referral.js";

const EMPTY = {
  code: null,
  links: [],
  totalReferrals: 0,
  completedReferrals: 0,
  pendingReferrals: 0,
  sig: { balance: 0, earned: 0, ledger: [] },
};

export async function referralRoutes(app) {
  // GET /api/referral/status?playerId=...
  app.get("/status", async (req) => {
    const playerId = String(req.query.playerId || "").trim();
    if (!playerId) return { ...EMPTY };
    const st = referralStatus(playerId, getUsersDB());
    if (!st) return { ...EMPTY, offline: true };
    return st;
  });

  // POST /api/referral/activate  { playerId, code }
  app.post("/activate", async (req, reply) => {
    const { playerId, code } = req.body || {};
    if (!playerId || !code) return reply.code(400).send({ error: "playerId and code required" });
    const res = activateReferral(String(playerId), String(code), getUsersDB());
    if (!res.linked) return reply.code(409).send(res);
    return res;
  });
}
