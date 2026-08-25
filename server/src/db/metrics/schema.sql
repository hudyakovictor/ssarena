-- ============================================================
-- SIGNAL ARENA — DERIVED METRICS TABLES
-- AI Intelligence Layer needs pre-aggregated views
-- for 20/80 analysis. Raw events → Aggregates → Insights.
-- ============================================================

-- ── RETENTION COHORTS ──
CREATE TABLE IF NOT EXISTS metrics_retention_cohorts (
    cohort_date     TEXT NOT NULL,          -- date of first session
    d1_retention    REAL NOT NULL DEFAULT 0,
    d3_retention    REAL NOT NULL DEFAULT 0,
    d7_retention    REAL NOT NULL DEFAULT 0,
    d14_retention   REAL NOT NULL DEFAULT 0,
    d30_retention   REAL NOT NULL DEFAULT 0,
    cohort_size     INTEGER NOT NULL DEFAULT 0,
    segment         TEXT NOT NULL DEFAULT 'all', -- all | free | premium | rank_0_2 | rank_3_5 | ...
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (cohort_date, segment)
);

-- ── CHURN RISK BUCKETS ──
CREATE TABLE IF NOT EXISTS metrics_churn_risk (
    player_id       TEXT PRIMARY KEY,
    churn_score     REAL NOT NULL DEFAULT 0,  -- 0-100, higher = more likely to churn
    days_inactive   INTEGER NOT NULL DEFAULT 0,
    loss_streak     INTEGER NOT NULL DEFAULT 0,
    discipline_decline INTEGER NOT NULL DEFAULT 0,
    last_battle_days_ago INTEGER NOT NULL DEFAULT 0,
    risk_factors    TEXT NOT NULL DEFAULT '[]', -- JSON array of risk factor codes
    segment         TEXT NOT NULL DEFAULT 'unknown',
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_churn_score ON metrics_churn_risk(churn_score DESC);
CREATE INDEX IF NOT EXISTS idx_churn_segment ON metrics_churn_risk(segment);

-- ── FREE VS PREMIUM FAIRNESS COMPARISON ──
CREATE TABLE IF NOT EXISTS metrics_fairness (
    snapshot_date   TEXT NOT NULL,
    segment         TEXT NOT NULL CHECK(segment IN ('free','premium')),
    active_players  INTEGER NOT NULL DEFAULT 0,
    avg_winrate     REAL NOT NULL DEFAULT 0,
    avg_rating      REAL NOT NULL DEFAULT 0,
    avg_progress_speed REAL NOT NULL DEFAULT 0, -- ranks per 30 days
    avg_session_length REAL NOT NULL DEFAULT 0,  -- minutes
    avg_battles_per_day REAL NOT NULL DEFAULT 0,
    leaderboard_top100_pct REAL NOT NULL DEFAULT 0,
    satisfaction_proxy REAL NOT NULL DEFAULT 0,  -- share cards / battles ratio
    pay_to_win_flag REAL NOT NULL DEFAULT 0,     -- AI-determined: > 0 means warning
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (snapshot_date, segment)
);

-- ── SINK-TO-FAUCET DAILY RATIO ──
CREATE TABLE IF NOT EXISTS metrics_sink_faucet (
    date            TEXT PRIMARY KEY,
    tokens_emitted  REAL NOT NULL DEFAULT 0,
    tokens_burned   REAL NOT NULL DEFAULT 0,
    tokens_to_treasury REAL NOT NULL DEFAULT 0,
    burn_emission_ratio REAL NOT NULL DEFAULT 0,
    active_sinks    TEXT NOT NULL DEFAULT '[]',  -- which sinks were used
    faucet_sources  TEXT NOT NULL DEFAULT '[]',  -- which faucets emitted
    premium_burn_pct REAL NOT NULL DEFAULT 0,   -- % of burns from premium users
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── SCENARIO PERFORMANCE ──
CREATE TABLE IF NOT EXISTS metrics_scenario_perf (
    scenario_id     TEXT NOT NULL,
    entity_id       TEXT NOT NULL,
    level           INTEGER NOT NULL,
    total_plays     INTEGER NOT NULL DEFAULT 0,
    win_rate        REAL NOT NULL DEFAULT 0,
    avg_time_spent  REAL NOT NULL DEFAULT 0,
    avg_ap_used     REAL NOT NULL DEFAULT 0,
    replay_rate     REAL NOT NULL DEFAULT 0,   -- % players who replay after loss
    retention_uplift REAL NOT NULL DEFAULT 0,   -- vs baseline, positive = good scenario
    difficulty_flag TEXT NOT NULL DEFAULT 'balanced', -- too_easy | balanced | too_hard
    generated_by    TEXT NOT NULL DEFAULT 'manual', -- manual | ai-synthetic | ai-historical
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (scenario_id, level)
);
CREATE INDEX IF NOT EXISTS idx_scenario_entity ON metrics_scenario_perf(entity_id);
CREATE INDEX IF NOT EXISTS idx_scenario_retention ON metrics_scenario_perf(retention_uplift DESC);

-- ── CONVERSION FUNNELS ──
CREATE TABLE IF NOT EXISTS metrics_conversion_funnels (
    date            TEXT NOT NULL,
    funnel_name     TEXT NOT NULL,              -- onboarding | premium | tournament | season_pass
    step_name       TEXT NOT NULL,
    step_order      INTEGER NOT NULL,
    entered         INTEGER NOT NULL DEFAULT 0,
    completed       INTEGER NOT NULL DEFAULT 0,
    conversion_rate REAL NOT NULL DEFAULT 0,
    dropoff_reason  TEXT,                       -- top reason for dropoff (AI-determined)
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (date, funnel_name, step_name)
);

-- ── TOURNAMENT PROFITABILITY ──
CREATE TABLE IF NOT EXISTS metrics_tournament_perf (
    tournament_id   TEXT PRIMARY KEY,
    entries         INTEGER NOT NULL DEFAULT 0,
    total_fees_burned REAL NOT NULL DEFAULT 0,
    total_fees_treasury REAL NOT NULL DEFAULT 0,
    prize_pool      REAL NOT NULL DEFAULT 0,
    roi_for_platform REAL NOT NULL DEFAULT 0,
    player_satisfaction REAL NOT NULL DEFAULT 0,
    returning_players_pct REAL NOT NULL DEFAULT 0,
    recommended_action TEXT,                    -- extend | close | repeat
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── TOKEN PRESSURE DASHBOARD ──
CREATE TABLE IF NOT EXISTS metrics_token_pressure (
    date            TEXT PRIMARY KEY,
    token_price_usd REAL,
    token_volume_24h REAL,
    price_change_24h REAL,
    active_wallets  INTEGER NOT NULL DEFAULT 0,
    new_wallets_24h INTEGER NOT NULL DEFAULT 0,
    exchange_inflow REAL,
    exchange_outflow REAL,
    game_activity_correlation REAL,  -- correlation between battles & price
    buy_pressure    REAL NOT NULL DEFAULT 0,   -- -1 to +1
    sell_pressure   REAL NOT NULL DEFAULT 0,   -- -1 to +1
    market_sentiment TEXT NOT NULL DEFAULT 'neutral',
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── AI RECOMMENDATION OUTCOMES ──
CREATE TABLE IF NOT EXISTS metrics_ai_recommendations (
    id              TEXT PRIMARY KEY,
    recommendation  TEXT NOT NULL,
    module          TEXT NOT NULL,              -- retention | economy | fairness | liveops | market
    severity        TEXT NOT NULL DEFAULT 'medium',
    expected_impact REAL NOT NULL DEFAULT 0,    -- 0-100, AI-estimated
    actual_impact   REAL,                       -- measured after implementation
    status          TEXT NOT NULL DEFAULT 'proposed', -- proposed | approved | implemented | measured
    proposed_at     TEXT NOT NULL DEFAULT (datetime('now')),
    implemented_at  TEXT,
    measured_at     TEXT,
    metrics_before  TEXT,                       -- JSON snapshot before
    metrics_after   TEXT,                       -- JSON snapshot after
    admin_notes     TEXT
);
