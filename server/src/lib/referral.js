// ============================================================
// REFERRAL ENGINE (block 4.1)
// One referee → one referrer (referral_links PK referee_id).
// Rewards are $SIG paper ledger (sig_balance / sig_ledger) —
// NO token economics here, that is a separate legal branch.
//
// The referral CODE is persisted on the players row
// (players.referral_code, block 4.1 migration) — random,
// collision-checked, stable for the player's lifetime.
// Anti-self-refer / one-link-per-referee hold in SQL.
// ============================================================
import { RANKS } from "../content/ranks.js";
import { getUser, getUsersDB } from "../db/index.js";

// Reward table — source of truth (frontend renders these, does not hardcode).
export const REWARDS = {
  signupBonus: 10,      // referrer, when referee registers
  refereeSignupBonus: 5, // referee, one-time welcome
  rank5Bonus: 50,       // referrer, when referee reaches rank 5
  premiumBonus: 100,    // referrer, when referee buys premium (stub trigger)
};

// Rank (0-based index) that triggers the milestone reward.
export const MILESTONE_RANK = 5;
export const MILESTONE_XP = RANKS[MILESTONE_RANK] ? RANKS[MILESTONE_RANK].minXp : 2000;

// Code charset: no 0/O, 1/I/L (visually ambiguous in links).
const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 chars
const CODE_PREFIX = "SIGMA";
const CODE_LEN = 6;

function randomCode() {
  let s = CODE_PREFIX;
  for (let i = 0; i < CODE_LEN; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

/**
 * Get or create the player's persistent referral code.
 * @returns {string} e.g. "SIGMA7KQ2XP"
 */
export function ensureReferralCode(db, playerId) {
  const row = db.prepare("SELECT referral_code FROM players WHERE id = ?").get(playerId);
  if (row && row.referral_code) return row.referral_code;
  // Bounded retry loop (32 tries — never spins forever on a pathological collision).
  let code = randomCode();
  for (let i = 0; i < 32 && db.prepare("SELECT 1 FROM players WHERE referral_code = ?").get(code); i++) {
    code = randomCode();
  }
  db.prepare("UPDATE players SET referral_code = ? WHERE id = ?").run(code, playerId);
  return code;
}

/**
 * Create (or fetch) the $SIG balance row for a player.
 */
export function getSigBalance(db, playerId) {
  let row = db.prepare("SELECT * FROM sig_balance WHERE player_id = ?").get(playerId);
  if (!row) {
    db.prepare("INSERT OR IGNORE INTO sig_balance (player_id, balance) VALUES (?, 0)").run(playerId);
    row = db.prepare("SELECT * FROM sig_balance WHERE player_id = ?").get(playerId);
  }
  return row;
}

/**
 * Credit $SIG to a player ledger. Transactional; idempotent when a
 * battleId is passed (one grant per battle+reason).
 * @returns {{ credited: number, balance: number, duplicate: boolean }}
 */
export function creditSig(db, playerId, amount, reason, battleId = null) {
  return db.transaction(() => {
    if (battleId) {
      const dup = db.prepare(
        "SELECT 1 FROM sig_ledger WHERE player_id = ? AND reason = ? AND battle_id = ?"
      ).get(playerId, reason, battleId);
      if (dup) return { credited: 0, balance: getSigBalance(db, playerId).balance, duplicate: true };
    }
    const bal = getSigBalance(db, playerId);
    db.prepare("UPDATE sig_balance SET balance = balance + ?, updated_at = datetime('now') WHERE player_id = ?").run(amount, playerId);
    db.prepare("INSERT INTO sig_ledger (player_id, amount, reason, battle_id) VALUES (?, ?, ?, ?)").run(playerId, amount, reason, battleId);
    return { credited: amount, balance: bal.balance + amount, duplicate: false };
  })();
}

/**
 * Activate a referral link: referee (this player) ↔ referrer (code owner).
 * Rules (SQL-enforced):
 *  - referee and referrer must exist, referee != referrer
 *  - referee may link only ONCE (PK referee_id)
 *  - code must be a valid, issued code (players.referral_code)
 * Rewards: referrer +signupBonus $SIG, referee +refereeSignupBonus $SIG.
 * @returns {{ linked: boolean, reward?: object, welcome?: object, error?: string }}
 */
export function activateReferral(playerId, code, db = getUsersDB()) {
  const referee = getUser(playerId);
  if (!referee) return { linked: false, error: "player not found" };
  const codeNorm = (code || "").trim().toUpperCase();
  if (!codeNorm) return { linked: false, error: "empty code" };

  const already = db.prepare("SELECT * FROM referral_links WHERE referee_id = ?").get(playerId);
  if (already) return { linked: false, error: "already linked", status: already.status };

  const owner = db.prepare("SELECT id FROM players WHERE referral_code = ?").get(codeNorm);
  if (!owner) return { linked: false, error: "invalid code" };
  if (owner.id === referee.id) return { linked: false, error: "self referral" };

  const res = db.transaction(() => {
    try {
      db.prepare("INSERT INTO referral_links (referee_id, referrer_id, code) VALUES (?, ?, ?)").run(referee.id, owner.id, codeNorm);
    } catch {
      return { linked: false, error: "already linked" };
    }
    const reward = creditSig(db, owner.id, REWARDS.signupBonus, "referral_signup");
    const welcome = creditSig(db, referee.id, REWARDS.refereeSignupBonus, "referee_welcome");
    // Referrer gets a stable code of their own (so the dashboard shows it).
    ensureReferralCode(db, owner.id);
    return { linked: true, referrerId: owner.id, reward, welcome, code: codeNorm };
  })();
  return res;
}

/**
 * Referrer dashboard row: code + stats + $SIG ledger.
 */
export function referralStatus(playerId, db = getUsersDB()) {
  const player = getUser(playerId);
  if (!player) return null;
  const code = ensureReferralCode(db, playerId);
  const links = db.prepare(
    `SELECT rl.code AS code, rl.status AS status, rl.created_at AS createdAt,
            p.display_name AS refereeName, p.rank_index AS refereeRank, p.xp AS refereeXp
       FROM referral_links rl JOIN players p ON p.id = rl.referee_id
      WHERE rl.referrer_id = ? ORDER BY rl.created_at DESC`
  ).all(playerId);
  const bal = getSigBalance(db, playerId);
  const ledger = db.prepare(
    "SELECT * FROM sig_ledger WHERE player_id = ? ORDER BY created_at DESC, id DESC LIMIT 10"
  ).all(playerId);
  const earnedTotal = db.prepare(
    "SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS s FROM sig_ledger WHERE player_id = ?"
  ).get(playerId).s;
  return {
    playerId,
    code,
    referralLink: `https://signalarena.io/?ref=${code}`,
    links,
    totalReferrals: links.length,
    completedReferrals: links.filter((l) => l.status !== "pending").length,
    pendingReferrals: links.filter((l) => l.status === "pending").length,
    sig: { balance: bal.balance, earned: earnedTotal, ledger },
    rewards: REWARDS,
    milestoneRank: MILESTONE_RANK,
    milestoneXp: MILESTONE_XP,
  };
}

/**
 * Hook: called after applyBattleProgress when the player ranked up.
 * If this was the referee of a pending link and the new rank >= 5,
 * complete the link and credit the referrer rank5Bonus.
 * NEVER throws — a referral failure must not fail the battle.
 */
export function onRankUp(db, playerId, newRank) {
  try {
    if (newRank < MILESTONE_RANK) return;
    const link = db.prepare(
      "SELECT * FROM referral_links WHERE referee_id = ? AND status = 'pending'"
    ).get(playerId);
    if (!link) return;
    db.prepare(
      "UPDATE referral_links SET status = 'completed', completed_at = datetime('now') WHERE referee_id = ? AND status = 'pending'"
    ).run(playerId);
    creditSig(db, link.referrer_id, REWARDS.rank5Bonus, "referral_rank5");
  } catch (e) {
    console.error("  ⚠ referral rank-up hook failed:", e.message);
  }
}

/**
 * Hook: called on the referee's FIRST battle — a first battle means the
 * referee is a real, active player → the pending link becomes completed.
 * NEVER throws.
 */
export function onFirstBattle(db, playerId) {
  try {
    const link = db.prepare(
      "SELECT * FROM referral_links WHERE referee_id = ? AND status = 'pending'"
    ).get(playerId);
    if (!link) return;
    db.prepare(
      "UPDATE referral_links SET status = 'completed', completed_at = datetime('now') WHERE referee_id = ? AND status = 'pending'"
    ).run(playerId);
  } catch (e) {
    console.error("  ⚠ referral first-battle hook failed:", e.message);
  }
}
