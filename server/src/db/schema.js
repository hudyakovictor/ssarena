// ============================================================
// SIGNAL ARENA — DATABASE SCHEMAS
// DB_USERS: Transactional player data (PostgreSQL-ready DDL)
// DB_CONTENT: Read-Only content replica
// ============================================================

// ── DB_USERS SCHEMA (Production: PostgreSQL, Dev: SQLite) ──
export const USERS_SCHEMA = {
  // Players
  players: `
    CREATE TABLE IF NOT EXISTS players (
      id            TEXT PRIMARY KEY,
      wallet_addr   TEXT UNIQUE,
      guest_id      TEXT UNIQUE,
      display_name  TEXT NOT NULL DEFAULT 'AnonTrader',
      rank_index    INTEGER NOT NULL DEFAULT 0,
      xp            INTEGER NOT NULL DEFAULT 0,
      attention     INTEGER NOT NULL DEFAULT 7,
      max_attention INTEGER NOT NULL DEFAULT 8,
      discipline_shield INTEGER NOT NULL DEFAULT 50,
      rating        INTEGER NOT NULL DEFAULT 1000,
      win_rate      REAL NOT NULL DEFAULT 0.0,
      streak        INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      total_battles INTEGER NOT NULL DEFAULT 0,
      total_wins    INTEGER NOT NULL DEFAULT 0,
      referral_code TEXT UNIQUE,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  // Skill values (radar chart axes)
  player_skills: `
    CREATE TABLE IF NOT EXISTS player_skills (
      player_id  TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      skill_id   TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      value      INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (player_id, skill_id)
    );
  `,

  // Owned skill cards
  player_cards: `
    CREATE TABLE IF NOT EXISTS player_cards (
      player_id  TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      card_id    TEXT NOT NULL,
      mastery    INTEGER NOT NULL DEFAULT 0,
      acquired_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (player_id, card_id)
    );
  `,

  // Error journal
  player_errors: `
    CREATE TABLE IF NOT EXISTS player_errors (
      player_id  TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      error_id   TEXT NOT NULL,
      error_title TEXT NOT NULL,
      count      INTEGER NOT NULL DEFAULT 1,
      status     TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','improving','controlled')),
      domain     TEXT NOT NULL,
      last_seen  TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (player_id, error_id)
    );
  `,

  // Entity encounter history
  player_entities: `
    CREATE TABLE IF NOT EXISTS player_entities (
      player_id    TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      entity_id    TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'undiscovered' CHECK(status IN ('undiscovered','encountered','defeated','mastered')),
      encounters   INTEGER NOT NULL DEFAULT 0,
      wins         INTEGER NOT NULL DEFAULT 0,
      last_encounter TEXT,
      PRIMARY KEY (player_id, entity_id)
    );
  `,

  // Badges
  player_badges: `
    CREATE TABLE IF NOT EXISTS player_badges (
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      badge_id  TEXT NOT NULL,
      earned_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (player_id, badge_id)
    );
  `,

  // Battle logs (fed to broker)
  battle_logs: `
    CREATE TABLE IF NOT EXISTS battle_logs (
      id          TEXT PRIMARY KEY,
      player_id   TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      entity_level INTEGER NOT NULL,
      mode        TEXT NOT NULL,
      rounds      INTEGER NOT NULL,
      result      TEXT NOT NULL CHECK(result IN ('win','loss','partial','timeout')),
      score       INTEGER NOT NULL DEFAULT 0,
      time_spent  INTEGER NOT NULL,
      ap_used     INTEGER NOT NULL,
      options_chosen TEXT NOT NULL DEFAULT '[]',
      sources_opened TEXT NOT NULL DEFAULT '[]',
      errors_made TEXT NOT NULL DEFAULT '[]',
      skill_deltas TEXT NOT NULL DEFAULT '{}',
      twist_triggered INTEGER NOT NULL DEFAULT 0,
      ghost_opponent TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_battle_logs_player ON battle_logs(player_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_battle_logs_entity ON battle_logs(entity_id);
  `,
  // Referral program (block 4.1). One referee links one referrer (PK referee_id).
  referral_links: `
    CREATE TABLE IF NOT EXISTS referral_links (
      referee_id   TEXT PRIMARY KEY,
      referrer_id  TEXT NOT NULL,
      code         TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','rewarded')),
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_referral_links_referrer ON referral_links(referrer_id);
  `,

  // $SIG paper balance (block 4.1). Token itself is a separate legal branch —
  // this is an in-game ledger only (no on-chain, no real keys).
  sig_balance: `
    CREATE TABLE IF NOT EXISTS sig_balance (
      player_id  TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      balance    INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  sig_ledger: `
    CREATE TABLE IF NOT EXISTS sig_ledger (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id  TEXT NOT NULL,
      amount     INTEGER NOT NULL,
      reason     TEXT NOT NULL,
      battle_id  TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sig_ledger_player ON sig_ledger(player_id, created_at);
  `,
};

// ── DB_CONTENT SCHEMA (Read-Only on Production) ──
export const CONTENT_SCHEMA = {
  scenarios: `
    CREATE TABLE IF NOT EXISTS scenarios (
      id            TEXT PRIMARY KEY,
      entity_id     TEXT NOT NULL,
      level         INTEGER NOT NULL,
      rank_req      INTEGER NOT NULL DEFAULT 0,
      asset         TEXT NOT NULL,
      briefing      TEXT NOT NULL,
      title         TEXT NOT NULL,
      difficulty_axes TEXT NOT NULL DEFAULT '{}',
      time_limit    INTEGER NOT NULL DEFAULT 45,
      rounds        INTEGER NOT NULL DEFAULT 2,
      data_sources  TEXT NOT NULL DEFAULT '{}',
      created_by    TEXT NOT NULL DEFAULT 'admin',
      generation_type TEXT NOT NULL DEFAULT 'manual' CHECK(generation_type IN ('manual','ai-synthetic','ai-historical')),
      approved      INTEGER NOT NULL DEFAULT 0,
      published_at  TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  scenario_options: `
    CREATE TABLE IF NOT EXISTS scenario_options (
      id          TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
      opt_index   TEXT NOT NULL,
      label       TEXT NOT NULL,
      correct     INTEGER NOT NULL DEFAULT 0,
      layer1      TEXT NOT NULL,
      layer2      TEXT NOT NULL,
      layer3      TEXT NOT NULL,
      errors_triggered TEXT NOT NULL DEFAULT '[]',
      skill_deltas    TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_options_scenario ON scenario_options(scenario_id);
  `,

  market_entities: `
    CREATE TABLE IF NOT EXISTS market_entities (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      name_ru       TEXT NOT NULL,
      archetype     TEXT NOT NULL,
      discipline    TEXT NOT NULL,
      threat_level  TEXT NOT NULL,
      corruption    INTEGER NOT NULL DEFAULT 50,
      description   TEXT NOT NULL,
      manifest_desc TEXT,
      psychology    TEXT,
      real_market   TEXT,
      lore_snippet  TEXT,
      unlock_rank   INTEGER NOT NULL DEFAULT 0,
      axes_json     TEXT NOT NULL DEFAULT '{}',
      mistakes_json TEXT NOT NULL DEFAULT '[]',
      counters_json TEXT NOT NULL DEFAULT '[]',
      weak_skills_json TEXT NOT NULL DEFAULT '[]',
      key_data_json   TEXT NOT NULL DEFAULT '[]',
      published     INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,

  skill_cards: `
    CREATE TABLE IF NOT EXISTS skill_cards (
      id          TEXT PRIMARY KEY,
      name_en     TEXT NOT NULL,
      name_ru     TEXT NOT NULL,
      tier        INTEGER NOT NULL,
      rarity      TEXT NOT NULL,
      cost        INTEGER NOT NULL,
      discipline  TEXT NOT NULL,
      category    TEXT NOT NULL,
      effect      TEXT NOT NULL,
      flavor      TEXT NOT NULL,
      glyph       TEXT NOT NULL DEFAULT '📊',
      published   INTEGER NOT NULL DEFAULT 0
    );
  `,

  /* ── Localization Table (compiled to CDN JSON files) ── */
  locales: `
    CREATE TABLE IF NOT EXISTS locales (
      locale_key  TEXT NOT NULL,
      lang        TEXT NOT NULL DEFAULT 'en',
      module      TEXT NOT NULL DEFAULT 'common',
      value       TEXT NOT NULL,
      PRIMARY KEY (locale_key, lang)
    );
  `,

  /* ── Content Sync Log ── */
  content_sync_log: `
    CREATE TABLE IF NOT EXISTS content_sync_log (
      id          TEXT PRIMARY KEY,
      sync_type   TEXT NOT NULL,
      items_count INTEGER NOT NULL DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'success',
      error_msg   TEXT,
      synced_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
};
