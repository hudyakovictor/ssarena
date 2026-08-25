// ============================================================
// DB LAYER — Users DB + Content DB (Read-Only on prod)
// ============================================================
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { CONFIG } from "../config/index.js";
import { USERS_SCHEMA, CONTENT_SCHEMA } from "./schema.js";

let usersDB = null;
let contentDB = null;

export function initUsersDB() {
  const dbPath = CONFIG.DB_USERS.SQLITE_PATH;
  mkdirSync(dirname(dbPath), { recursive: true });
  usersDB = new Database(dbPath);
  usersDB.pragma("journal_mode = WAL");
  usersDB.pragma("foreign_keys = ON");

  // Run all migrations
  for (const [name, sql] of Object.entries(USERS_SCHEMA)) {
    usersDB.exec(sql);
    console.log(`  ✓ users.${name}`);
  }

  // Additive migrations (existing DBs pre-dating a schema change).
  // Each is guarded by a table_info check — safe to re-run forever.
  // NOTE: SQLite cannot ADD COLUMN ... UNIQUE — the unique constraint
  // lands on a separate index (which also allows multiple NULLs).
  const cols = usersDB.prepare("PRAGMA table_info(players)").all().map((c) => c.name);
  if (!cols.includes("referral_code")) {
    usersDB.exec("ALTER TABLE players ADD COLUMN referral_code TEXT");
    usersDB.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_players_referral_code ON players(referral_code)");
    console.log("  ✓ users.players.referral_code (migrated)");
  }
  return usersDB;
}

export function initContentDB() {
  const dbPath = CONFIG.DB_CONTENT.SQLITE_PATH;
  mkdirSync(dirname(dbPath), { recursive: true });
  contentDB = new Database(dbPath);
  contentDB.pragma("journal_mode = WAL");
  contentDB.pragma("foreign_keys = ON");

  for (const [name, sql] of Object.entries(CONTENT_SCHEMA)) {
    contentDB.exec(sql);
    console.log(`  ✓ content.${name}`);
  }
  return contentDB;
}

// ── USERS DB QUERIES ──
export function getUsersDB() {
  if (!usersDB) initUsersDB();
  return usersDB;
}

export function getUser(playerId) {
  return getUsersDB().prepare("SELECT * FROM players WHERE id = ?").get(playerId);
}

export function createUser(data) {
  return getUsersDB().prepare(`
    INSERT INTO players (id, guest_id, display_name, rank_index, xp, attention, max_attention, discipline_shield, rating, win_rate)
    VALUES (?, ?, ?, 0, 0, 7, 8, 50, 1000, 0.0)
  `).run(data.id, data.guest_id || `guest_${Date.now()}`, data.display_name || "AnonTrader");
}

export function updateUserXP(playerId, delta) {
  return getUsersDB().prepare("UPDATE players SET xp = xp + ?, updated_at = datetime('now') WHERE id = ?").run(delta, playerId);
}

export function recordBattle(battleData) {
  const db = getUsersDB();
  return db.prepare(`
    INSERT INTO battle_logs (id, player_id, scenario_id, entity_id, entity_level, mode, rounds, result, score, time_spent, ap_used, options_chosen, sources_opened, errors_made, skill_deltas, twist_triggered, ghost_opponent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    battleData.id, battleData.player_id, battleData.scenario_id, battleData.entity_id,
    battleData.entity_level, battleData.mode, battleData.rounds, battleData.result,
    battleData.score, battleData.time_spent, battleData.ap_used,
    JSON.stringify(battleData.options_chosen || []),
    JSON.stringify(battleData.sources_opened || []),
    JSON.stringify(battleData.errors_made || []),
    JSON.stringify(battleData.skill_deltas || {}),
    battleData.twist_triggered || 0,
    battleData.ghost_opponent || null
  );
}

// ── CONTENT DB QUERIES (Read-Only on Production) ──
export function getContentDB() {
  if (!contentDB) initContentDB();
  return contentDB;
}

export function getScenario(id) {
  const scenario = getContentDB().prepare("SELECT * FROM scenarios WHERE id = ? AND approved = 1").get(id);
  if (!scenario) return null;
  const options = getContentDB().prepare("SELECT * FROM scenario_options WHERE scenario_id = ? ORDER BY opt_index").all(id);
  return { ...scenario, options, data_sources: JSON.parse(scenario.data_sources || "{}"), difficulty_axes: JSON.parse(scenario.difficulty_axes || "{}") };
}

export function getScenariosByEntity(entityId, limit = 10) {
  return getContentDB().prepare("SELECT * FROM scenarios WHERE entity_id = ? AND approved = 1 ORDER BY level ASC LIMIT ?").all(entityId, limit);
}

export function getRandomScenario(playerRank) {
  return getContentDB().prepare(
    "SELECT * FROM scenarios WHERE approved = 1 AND rank_req <= ? ORDER BY RANDOM() LIMIT 1"
  ).get(playerRank);
}

// Insert content (ADMIN ONLY — not available on production)
export function insertScenario(data) {
  const db = getContentDB();
  db.prepare(`
    INSERT INTO scenarios (id, entity_id, level, rank_req, asset, briefing, title, difficulty_axes, time_limit, rounds, data_sources, generation_type, approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.id, data.entity_id, data.level, data.rank_req, data.asset, data.briefing, data.title,
    JSON.stringify(data.difficulty_axes || {}), data.time_limit, data.rounds,
    JSON.stringify(data.data_sources || {}), data.generation_type || "manual", data.approved || 0);

  for (const opt of (data.options || [])) {
    db.prepare(`
      INSERT INTO scenario_options (id, scenario_id, opt_index, label, correct, layer1, layer2, layer3, errors_triggered, skill_deltas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(opt.id || `${data.id}_opt_${opt.opt_index}`, data.id, opt.opt_index, opt.label,
      opt.correct ? 1 : 0, opt.layer1, opt.layer2, opt.layer3,
      JSON.stringify(opt.errors_triggered || []), JSON.stringify(opt.skill_deltas || {}));
  }
  return data;
}
