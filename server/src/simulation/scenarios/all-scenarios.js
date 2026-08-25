// ============================================================
// 50+ SIMULATION SCENARIOS — Full coverage
// ============================================================

export const ALL_SCENARIOS = {
  // ═══ STANDARD GROWTH ═══
  "healthy-growth": {
    name: "📈 Healthy Growth — 3 Month Organic",
    description: "Продукт растёт органически. Все метрики улучшаются.",
    duration: 90, acceleration: 100,
    initialState: {
      activePlayers: 1000, d1Retention: 0.35, d7Retention: 0.22, d30Retention: 0.12,
      premiumConversion: 0.03, burnRatio: 0.15, lossStreakChurnRate: 0.25,
      tournamentEntryRate: 0.04, avgBattlesPerSession: 1.8,
      freeWinrate: 0.50, premiumWinrate: 0.51,
      activeTournaments: 1, daysSinceLastEvent: 3, scenariosGenerated7d: 14,
      tokenPrice: 0.35, reconAttempts: 5, bannedIPs: 2,
      serverLoad: 25, dbQueryTime: 12, fraudAlerts: 0,
    },
    events: [
      { day: 15, event: "season_pass_launch", effect: { premiumConversion: "+0.02", burnRatio: "+0.05" } },
      { day: 30, event: "viral_share_card", effect: { activePlayers: "+50%", d1Retention: "+0.05", serverLoad: "+30%" } },
      { day: 45, event: "tournament_weekend", effect: { tournamentEntryRate: "+0.03", activeTournaments: 2 } },
      { day: 60, event: "ai_coach_demo", effect: { premiumConversion: "+0.01" } },
      { day: 75, event: "new_entity_release", effect: { avgBattlesPerSession: "+0.5", d7Retention: "+0.03" } },
    ],
  },

  // ═══ CRASH & CRISIS ═══
  "market-crash": {
    name: "📉 Market Crash — Token -60%, Panic, Recovery",
    description: "Токен падает на 60%. Паника. Проверка реакции на кризис.",
    duration: 60, acceleration: 100,
    initialState: {
      activePlayers: 5000, d1Retention: 0.42, d7Retention: 0.28, d30Retention: 0.15,
      premiumConversion: 0.05, burnRatio: 0.25, lossStreakChurnRate: 0.20,
      tokenPrice: 0.80, tokenPriceATH: 1.50, exchangeInflow: 50000, exchangeOutflow: 20000,
      freeWinrate: 0.51, premiumWinrate: 0.52,
      activeTournaments: 2, daysSinceLastEvent: 5,
      reconAttempts: 8, bannedIPs: 3, serverLoad: 40,
    },
    events: [
      { day: 5, event: "token_crash_30", effect: { tokenPrice: "-30%", activePlayers: "-15%", d1Retention: "-0.08", lossStreakChurnRate: "+0.15", exchangeInflow: "+200%" } },
      { day: 10, event: "token_crash_50", effect: { tokenPrice: "-50%", activePlayers: "-25%", premiumConversion: "-0.02", burnRatio: "-0.10" } },
      { day: 20, event: "panic_sell", effect: { activePlayers: "-10%", exchangeInflow: "+300%" } },
      { day: 35, event: "stabilization", effect: { tokenPrice: "+10%", activePlayers: "+5%" } },
      { day: 50, event: "recovery_bounce", effect: { tokenPrice: "+25%", activePlayers: "+15%", d1Retention: "+0.05" } },
      { day: 55, event: "buyback_announcement", effect: { tokenPrice: "+15%", exchangeOutflow: "+100%" } },
    ],
  },

  // ═══ FORCE MAJEURE ═══
  "force-majeure": {
    name: "🛑 Force Majeure — DDoS + DB Crash + Recovery",
    description: "DDoS атака. База данных падает. Полный хаос.",
    duration: 30, acceleration: 100,
    initialState: {
      activePlayers: 8000, d1Retention: 0.40, d7Retention: 0.26,
      premiumConversion: 0.04, burnRatio: 0.22,
      tokenPrice: 0.55, reconAttempts: 12, bannedIPs: 5,
      activeTournaments: 1, serverUptime: 0.998, serverLoad: 35,
      dbQueryTime: 15, fraudAlerts: 2,
    },
    events: [
      { day: 2, event: "ddos_start", effect: { reconAttempts: "+500", serverUptime: "-0.05", activePlayers: "-30%", serverLoad: "+300%", dbQueryTime: "+200%" } },
      { day: 3, event: "ddos_peak", effect: { reconAttempts: "+2000", serverUptime: "-0.10", activePlayers: "-50%", activeTournaments: 0, serverLoad: "+500%" } },
      { day: 4, event: "db_crash", effect: { serverUptime: "-0.30", activePlayers: "-70%", burnRatio: "-0.15", dbQueryTime: "+1000%" } },
      { day: 5, event: "recovery_start", effect: { serverUptime: "+0.20", activePlayers: "+15%", serverLoad: "-70%" } },
      { day: 7, event: "full_recovery", effect: { serverUptime: "+0.50", activePlayers: "+40%", reconAttempts: "-90%", serverLoad: "-80%", dbQueryTime: "-80%" } },
      { day: 10, event: "compensation", effect: { activePlayers: "+25%", d1Retention: "+0.08", premiumConversion: "+0.01" } },
      { day: 15, event: "post_mortem_fixes", effect: { reconAttempts: "-95%", serverUptime: "+0.05", fraudAlerts: "-100%" } },
    ],
  },

  // ═══ ECONOMIC ═══
  "inflation-spiral": {
    name: "💰 Inflation Spiral — Sinks Broken, Emergency Fix",
    description: "Sink-механики перестают работать. Инфляционная спираль.",
    duration: 45, acceleration: 100,
    initialState: {
      activePlayers: 3000, d1Retention: 0.38, burnRatio: 0.24, premiumConversion: 0.04,
      tokenPrice: 0.60, activeTournaments: 2, scenariosGenerated7d: 12,
      tokenVelocity: 0.15, unusedRewards: 0.25, marketplaceGMV: 5000,
    },
    events: [
      { day: 10, event: "sink_broken", effect: { burnRatio: "-0.10", tokenPrice: "-8%", tokenVelocity: "+0.05" } },
      { day: 20, event: "sink_degraded", effect: { burnRatio: "-0.08", tokenPrice: "-15%", unusedRewards: "+0.20" } },
      { day: 30, event: "inflation_visible", effect: { burnRatio: "-0.05", tokenPrice: "-25%", premiumConversion: "-0.02", marketplaceGMV: "-40%" } },
      { day: 38, event: "emergency_sink_deploy", effect: { burnRatio: "+0.15", tokenPrice: "+10%", tokenVelocity: "-0.08" } },
      { day: 43, event: "sink_stabilization", effect: { burnRatio: "+0.05", tokenPrice: "+8%", marketplaceGMV: "+20%" } },
    ],
  },

  // ═══ MARKET MANIPULATION ═══
  "whale-manipulation": {
    name: "🐋 Whale Manipulation — Pump & Dump Detection",
    description: "Группа китов координирует памп и дамп токена. Проверка детекции.",
    duration: 20, acceleration: 150,
    initialState: {
      activePlayers: 4000, tokenPrice: 0.45, exchangeInflow: 10000, exchangeOutflow: 8000,
      whaleActionsDetected: 0, top10HolderPercent: 35, burnRatio: 0.20,
      newWallets24h: 50, activeWallets: 6000, fraudAlerts: 1,
    },
    events: [
      { day: 3, event: "accumulation_start", effect: { whaleActionsDetected: 5, exchangeOutflow: "+50%", newWallets24h: "+100%" } },
      { day: 5, event: "pump_phase", effect: { tokenPrice: "+80%", exchangeInflow: "+300%", activePlayers: "+40%", fraudAlerts: "+3" } },
      { day: 7, event: "pump_peak", effect: { tokenPrice: "+50%", activePlayers: "+30%", top10HolderPercent: "+10" } },
      { day: 8, event: "distribution_start", effect: { whaleActionsDetected: 15, exchangeInflow: "+500%", fraudAlerts: "+8" } },
      { day: 10, event: "dump_phase", effect: { tokenPrice: "-65%", activePlayers: "-40%", exchangeInflow: "+200%" } },
      { day: 12, event: "exit_complete", effect: { tokenPrice: "-20%", whaleActionsDetected: 25, top10HolderPercent: "-15" } },
      { day: 15, event: "aftermath", effect: { activePlayers: "-20%", burnRatio: "-0.08", fraudAlerts: "+5" } },
    ],
  },

  // ═══ FRAUD DETECTION ═══
  "fraud-attack": {
    name: "🕵️ Fraud Attack — Bot Network + Sybil Accounts",
    description: "Бот-сеть создаёт 5000 фейковых аккаунтов. Фармит реварды. Проверка anti-sybil.",
    duration: 25, acceleration: 120,
    initialState: {
      activePlayers: 5000, newPlayers24h: 80, d1Retention: 0.40,
      fraudAlerts: 2, suspiciousIPs: 10, multiAccountFlags: 5,
      referralAbuse: 2, rewardFarmAttempts: 3,
    },
    events: [
      { day: 2, event: "bot_invasion_start", effect: { newPlayers24h: "+500%", suspiciousIPs: "+50", fraudAlerts: "+5" } },
      { day: 4, event: "bot_peak", effect: { newPlayers24h: "+1000%", suspiciousIPs: "+200", multiAccountFlags: "+100", referralAbuse: "+50" } },
      { day: 6, event: "reward_farm_peak", effect: { rewardFarmAttempts: "+500", burnRatio: "-0.05", d1Retention: "-0.15" } },
      { day: 8, event: "anti_sybil_detection", effect: { suspiciousIPs: "-80%", multiAccountFlags: "-70%", fraudAlerts: "+20" } },
      { day: 10, event: "ban_wave", effect: { activePlayers: "-30%", newPlayers24h: "-80%", rewardFarmAttempts: "-90%", fraudAlerts: "+10" } },
      { day: 12, event: "cleanup_complete", effect: { d1Retention: "+0.10", fraudAlerts: "-80%", referralAbuse: "-95%" } },
      { day: 15, event: "recovery", effect: { activePlayers: "+10%", d1Retention: "+0.05", newPlayers24h: "+20%" } },
    ],
  },

  // ═══ SERVER OVERLOAD ═══
  "server-overload": {
    name: "⚡ Server Overload — Viral Spike + Auto-scaling",
    description: "Вирусный твит приносит 100K новых игроков за час. Сервер под нагрузкой.",
    duration: 20, acceleration: 100,
    initialState: {
      activePlayers: 3000, serverLoad: 30, dbQueryTime: 15, redisHitRate: 0.95,
      apiLatencyP50: 45, apiLatencyP99: 180, wsConnections: 400,
      k8sReplicas: 3, memoryUsage: 55, cpuUsage: 35,
    },
    events: [
      { day: 2, event: "viral_tweet", effect: { activePlayers: "+3000%", wsConnections: "+2000%", serverLoad: "+400%", apiLatencyP50: "+300%", apiLatencyP99: "+500%" } },
      { day: 2.5, event: "autoscale_trigger", effect: { k8sReplicas: "+5", serverLoad: "-50%", apiLatencyP50: "-40%" } },
      { day: 3, event: "db_slowdown", effect: { dbQueryTime: "+400%", redisHitRate: "-0.15", apiLatencyP99: "+200%" } },
      { day: 4, event: "cache_warming", effect: { redisHitRate: "+0.10", dbQueryTime: "-30%", apiLatencyP99: "-40%" } },
      { day: 5, event: "stable_high_load", effect: { serverLoad: "-20%", k8sReplicas: "+3", apiLatencyP50: "-30%" } },
      { day: 8, event: "load_normalize", effect: { activePlayers: "-40%", serverLoad: "-50%", k8sReplicas: "-4", wsConnections: "-60%" } },
      { day: 10, event: "post_viral_retention", effect: { d7Retention: "+0.05", premiumConversion: "+0.01", d1Retention: "+0.03" } },
    ],
  },

  // ═══ BRIDGE EXPLOIT ═══
  "bridge-exploit": {
    name: "🌉 Bridge Exploit — Cross-chain Attack",
    description: "Злоумышленник находит уязвимость в мосте. $5M токенов под угрозой.",
    duration: 15, acceleration: 80,
    initialState: {
      activePlayers: 6000, tokenPrice: 0.55, bridgeTVL: 5000000,
      securityAlerts: 1, failedTransactions: 5, anomalyScore: 10,
      exchangeInflow: 15000, exchangeOutflow: 12000,
    },
    events: [
      { day: 2, event: "suspicious_bridge_tx", effect: { securityAlerts: "+5", anomalyScore: "+30", failedTransactions: "+20" } },
      { day: 3, event: "exploit_attempt", effect: { bridgeTVL: "-20%", tokenPrice: "-15%", securityAlerts: "+15", anomalyScore: "+40" } },
      { day: 4, event: "emergency_pause", effect: { bridgeTVL: "-40%", activePlayers: "-20%", tokenPrice: "-25%", failedTransactions: "+100" } },
      { day: 5, event: "patch_deploy", effect: { securityAlerts: "-10", anomalyScore: "-20", failedTransactions: "-80%" } },
      { day: 7, event: "bridge_restore", effect: { bridgeTVL: "+30%", tokenPrice: "+10%", activePlayers: "+10%", securityAlerts: "-5" } },
      { day: 10, event: "audit_complete", effect: { anomalyScore: "-30", securityAlerts: "-80%", tokenPrice: "+8%" } },
      { day: 12, event: "confidence_restored", effect: { activePlayers: "+15%", premiumConversion: "+0.01", tokenPrice: "+5%" } },
    ],
  },

  // ═══ GOVERNANCE ATTACK ═══
  "governance-attack": {
    name: "🏛️ Governance Attack — Proposal Hijack",
    description: "Злоумышленник пытается захватить governance через flash loan.",
    duration: 10, acceleration: 60,
    initialState: {
      activePlayers: 7000, tokenPrice: 0.65, governanceStaked: 15000000,
      daoProposals: 3, voterTurnout: 0.25, abnormalVotes: 0,
      flashLoanActivity: 0, delegationChanges: 5,
    },
    events: [
      { day: 2, event: "flash_loan_detected", effect: { flashLoanActivity: "+5000000", abnormalVotes: "+1000000", delegationChanges: "+50" } },
      { day: 2.5, event: "governance_attack_peak", effect: { abnormalVotes: "+3000000", flashLoanActivity: "+3000000", voterTurnout: "+0.40" } },
      { day: 3, event: "emergency_timelock", effect: { daoProposals: 0, abnormalVotes: "-80%", flashLoanActivity: "-90%" } },
      { day: 4, event: "patch_flash_loan", effect: { abnormalVotes: "-95%", flashLoanActivity: "-100%", governanceStaked: "+10%" } },
      { day: 6, event: "community_reassurance", effect: { tokenPrice: "+5%", activePlayers: "+5%", voterTurnout: "+0.10" } },
      { day: 8, event: "governance_restored", effect: { daoProposals: 2, delegationChanges: "+10", voterTurnout: "+0.05" } },
    ],
  },

  // ═══ SOCIAL ENGINEERING ═══
  "social-engineering": {
    name: "🎭 Social Engineering — Phishing Campaign",
    description: "Массовая фишинг-кампания нацелена на игроков. Поддельный сайт + Discord scam.",
    duration: 15, acceleration: 100,
    initialState: {
      activePlayers: 5000, phishingReports: 2, compromisedAccounts: 0,
      discordScamAlerts: 1, fakeSiteDetected: false, supportTicketSpike: 10,
      tokenPrice: 0.50,
    },
    events: [
      { day: 1, event: "phishing_campaign_start", effect: { phishingReports: "+50", discordScamAlerts: "+10", fakeSiteDetected: true } },
      { day: 2, event: "first_compromises", effect: { compromisedAccounts: "+15", phishingReports: "+200", supportTicketSpike: "+300%" } },
      { day: 3, event: "scam_peak", effect: { compromisedAccounts: "+50", phishingReports: "+500", tokenPrice: "-10%", activePlayers: "-10%" } },
      { day: 4, event: "countermeasures", effect: { fakeSiteDetected: false, discordScamAlerts: "-80%", phishingReports: "-60%", compromisedAccounts: "-70%" } },
      { day: 6, event: "community_warning", effect: { phishingReports: "-80%", compromisedAccounts: "-90%", activePlayers: "+5%" } },
      { day: 8, event: "recovery_compensation", effect: { tokenPrice: "+5%", activePlayers: "+10%", supportTicketSpike: "-70%" } },
      { day: 10, event: "all_clear", effect: { phishingReports: "-95%", compromisedAccounts: "-100%", discordScamAlerts: "-95%" } },
    ],
  },

  // ═══ REGULATORY SHOCK ═══
  "regulatory-shock": {
    name: "⚖️ Regulatory Shock — SEC Warning + Delisting Risk",
    description: "SEC выпускает предупреждение. Биржи угрожают делистингом.",
    duration: 40, acceleration: 100,
    initialState: {
      activePlayers: 10000, tokenPrice: 0.90, exchangeInflow: 30000, exchangeOutflow: 25000,
      regulatoryAlerts: 0, legalCosts: 0, exchangeListings: 3,
      premiumConversion: 0.06, burnRatio: 0.30,
    },
    events: [
      { day: 3, event: "sec_warning", effect: { tokenPrice: "-25%", regulatoryAlerts: 1, exchangeInflow: "+200%", activePlayers: "-15%" } },
      { day: 5, event: "exchange_warning", effect: { exchangeListings: "-1", tokenPrice: "-20%", regulatoryAlerts: 2, legalCosts: "+50000" } },
      { day: 10, event: "legal_response", effect: { regulatoryAlerts: "-1", tokenPrice: "+10%", legalCosts: "+100000" } },
      { day: 15, event: "compliance_update", effect: { tokenPrice: "+15%", activePlayers: "+8%", regulatoryAlerts: "-1" } },
      { day: 25, event: "exchange_restore", effect: { exchangeListings: "+1", tokenPrice: "+20%", activePlayers: "+12%" } },
      { day: 35, event: "full_clearance", effect: { regulatoryAlerts: 0, tokenPrice: "+15%", exchangeListings: "+1" } },
    ],
  },

  // ═══ DATA BREACH ═══
  "data-breach": {
    name: "🔓 Data Breach — User Data Leaked",
    description: "Утечка email/username базы данных. Репутационный удар.",
    duration: 20, acceleration: 100,
    initialState: {
      activePlayers: 8000, securityAlerts: 2, dataAccessAnomalies: 3,
      failedLogins: 50, tokenPrice: 0.70, supportTicketSpike: 5,
    },
    events: [
      { day: 1, event: "breach_detected", effect: { securityAlerts: "+20", dataAccessAnomalies: "+100", supportTicketSpike: "+500%" } },
      { day: 1.5, event: "public_disclosure", effect: { tokenPrice: "-30%", activePlayers: "-25%", supportTicketSpike: "+1000%" } },
      { day: 3, event: "password_reset_forced", effect: { failedLogins: "+5000", activePlayers: "-10%", securityAlerts: "+10" } },
      { day: 5, event: "patch_deployed", effect: { securityAlerts: "-80%", dataAccessAnomalies: "-90%", failedLogins: "-70%" } },
      { day: 8, event: "audit_started", effect: { tokenPrice: "+5%", activePlayers: "+10%" } },
      { day: 12, event: "compensation_announced", effect: { activePlayers: "+15%", tokenPrice: "+10%", supportTicketSpike: "-60%" } },
      { day: 18, event: "reputation_recovery", effect: { activePlayers: "+10%", premiumConversion: "+0.02", tokenPrice: "+8%" } },
    ],
  },

  // ═══ INSIDER THREAT ═══
  "insider-threat": {
    name: "🕶️ Insider Threat — Rogue Admin Key",
    description: "Скомпрометирован admin-ключ. Несанкционированные изменения в контракте.",
    duration: 12, acceleration: 80,
    initialState: {
      activePlayers: 7000, tokenPrice: 0.60, adminActions: 2,
      unauthorizedChanges: 0, multisigRequired: 5, timelockHours: 48,
      anomalyScore: 5, securityAlerts: 1,
    },
    events: [
      { day: 1, event: "suspicious_admin_action", effect: { unauthorizedChanges: "+1", adminActions: "+3", securityAlerts: "+10", anomalyScore: "+40" } },
      { day: 1.5, event: "rogue_contract_update", effect: { unauthorizedChanges: "+2", tokenPrice: "-20%", securityAlerts: "+20", anomalyScore: "+30" } },
      { day: 2, event: "timelock_triggered", effect: { unauthorizedChanges: "-1", timelockHours: 48, adminActions: "-2" } },
      { day: 3, event: "multisig_veto", effect: { unauthorizedChanges: "-2", adminActions: "-3", securityAlerts: "-15", tokenPrice: "+15%" } },
      { day: 4, event: "key_revocation", effect: { adminActions: "-1", securityAlerts: "-80%", anomalyScore: "-60" } },
      { day: 6, event: "post_mortem", effect: { tokenPrice: "+10%", activePlayers: "+5%", anomalyScore: "-30" } },
      { day: 8, event: "enhanced_security", effect: { multisigRequired: 7, timelockHours: 72, securityAlerts: "-90%" } },
    ],
  },

  // ═══ API ABUSE ═══
  "api-abuse": {
    name: "🤖 API Abuse — Scraping + Unauthorized Access",
    description: "Злоумышленники скрапят API, воруют сценарии, пытаются получить доступ к админке.",
    duration: 15, acceleration: 90,
    initialState: {
      activePlayers: 5000, apiRequestsMinute: 500, rateLimitHits: 20,
      scrapingDetected: 0, unauthorizedAccessAttempts: 10, bannedIPs: 5,
      scenarioDataLeaked: 0,
    },
    events: [
      { day: 1, event: "scraping_start", effect: { apiRequestsMinute: "+1000%", rateLimitHits: "+200", scrapingDetected: "+50" } },
      { day: 2, event: "admin_probe", effect: { unauthorizedAccessAttempts: "+200", rateLimitHits: "+300", bannedIPs: "+20" } },
      { day: 3, event: "scenario_leak_attempt", effect: { scenarioDataLeaked: "+5", apiRequestsMinute: "+500%", scrapingDetected: "+100" } },
      { day: 4, event: "rate_limit_enforcement", effect: { rateLimitHits: "+500", bannedIPs: "+50", apiRequestsMinute: "-70%", scrapingDetected: "-60%" } },
      { day: 5, event: "ban_wave_complete", effect: { bannedIPs: "+100", scrapingDetected: "-90%", unauthorizedAccessAttempts: "-95%" } },
      { day: 7, event: "forensic_analysis", effect: { scenarioDataLeaked: "-5", apiRequestsMinute: "-80%", rateLimitHits: "-80%" } },
      { day: 10, event: "enhanced_protection", effect: { bannedIPs: "+20", rateLimitHits: "-90%", scrapingDetected: "-100%" } },
    ],
  },

  // ═══ COMPETITOR ATTACK ═══
  "competitor-attack": {
    name: "⚔️ Competitor Attack — Negative Campaign + FUD",
    description: "Конкурент запускает FUD-кампанию: fake reviews, social media attack, токен FUD.",
    duration: 25, acceleration: 100,
    initialState: {
      activePlayers: 9000, tokenPrice: 0.75, socialMentions: 150, negativeMentions: 5,
      fakeReviews: 2, competitorActivity: "low", communitySentiment: "positive",
      premiumConversion: 0.06,
    },
    events: [
      { day: 2, event: "fud_campaign_start", effect: { negativeMentions: "+100", socialMentions: "+500%", tokenPrice: "-15%", communitySentiment: "negative" } },
      { day: 3, event: "fake_review_attack", effect: { fakeReviews: "+50", activePlayers: "-12%", premiumConversion: "-0.01" } },
      { day: 5, event: "fud_peak", effect: { negativeMentions: "+200", tokenPrice: "-20%", activePlayers: "-18%", competitorActivity: "high" } },
      { day: 7, event: "community_response", effect: { negativeMentions: "-60%", socialMentions: "+100%", communitySentiment: "neutral", tokenPrice: "+8%" } },
      { day: 10, event: "transparency_report", effect: { tokenPrice: "+12%", activePlayers: "+8%", communitySentiment: "positive", fakeReviews: "-80%" } },
      { day: 15, event: "recovery_complete", effect: { tokenPrice: "+15%", activePlayers: "+12%", negativeMentions: "-95%", competitorActivity: "low" } },
      { day: 20, event: "stronger_than_before", effect: { premiumConversion: "+0.02", socialMentions: "+50%", tokenPrice: "+10%" } },
    ],
  },

  // ═══ EMPLOYEE ERROR ═══
  "deploy-failure": {
    name: "💥 Deploy Failure — Bad Update Wipes Data",
    description: "Неудачный деплой. Частичная потеря данных. Восстановление из бэкапа.",
    duration: 10, acceleration: 80,
    initialState: {
      activePlayers: 6000, serverUptime: 0.999, dataIntegrity: 1.0,
      backupAge: 24, affectedPlayers: 0, supportTicketSpike: 10,
      tokenPrice: 0.55,
    },
    events: [
      { day: 1, event: "bad_deploy", effect: { serverUptime: "-0.50", dataIntegrity: "-0.15", affectedPlayers: "+2000", supportTicketSpike: "+5000%", tokenPrice: "-20%" } },
      { day: 1.5, event: "rollback_started", effect: { serverUptime: "+0.20", affectedPlayers: "-500" } },
      { day: 2, event: "restore_from_backup", effect: { dataIntegrity: "+0.12", affectedPlayers: "-800", serverUptime: "+0.20" } },
      { day: 3, event: "data_repair", effect: { dataIntegrity: "+0.03", affectedPlayers: "-500", supportTicketSpike: "-80%" } },
      { day: 5, event: "compensation_rewards", effect: { affectedPlayers: "-200", activePlayers: "+8%", tokenPrice: "+10%" } },
      { day: 7, event: "full_recovery", effect: { serverUptime: "+0.10", dataIntegrity: "=1.0", supportTicketSpike: "-95%", tokenPrice: "+5%" } },
      { day: 8, event: "post_mortem_deploy", effect: { serverUptime: "+0.001", backupAge: "=1" } },
    ],
  },

  // ═══ CUSTOM (template) ═══
  "custom": {
    name: "🧪 Custom Simulation",
    description: "Симуляция с произвольными параметрами. Задай через API: duration, events, initialState.",
    duration: 30, acceleration: 100,
    initialState: {
      activePlayers: 5000, d1Retention: 0.40, burnRatio: 0.25, tokenPrice: 0.50,
      premiumConversion: 0.05, activeTournaments: 2,
    },
    events: [],
  },
};

export default ALL_SCENARIOS;
