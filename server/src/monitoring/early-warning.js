// ============================================================
// EARLY WARNING SYSTEM
// Trend detection, anomaly flags, load monitoring, fraud detection
// 50+ metrics monitored continuously
// ============================================================

// ═══════════════════════════════════════════════
// THRESHOLD DEFINITIONS (50+ metrics)
// ═══════════════════════════════════════════════

export const THRESHOLDS = {
  // ── SERVER LOAD ──
  serverLoad: { max: 80, warning: 60, critical: 90, unit: "%", action: "scale_up", description: "Средняя загрузка CPU всех подов" },
  memoryUsage: { max: 85, warning: 70, critical: 90, unit: "%", action: "scale_up", description: "Использование RAM" },
  cpuUsage: { max: 75, warning: 60, critical: 85, unit: "%", action: "scale_up", description: "CPU utilization" },
  dbQueryTime: { max: 200, warning: 100, critical: 500, unit: "ms", action: "index_review", description: "Среднее время запроса к БД" },
  redisHitRate: { min: 0.85, warning: 0.90, critical: 0.80, unit: "ratio", action: "cache_review", description: "Redis hit/miss ratio" },
  apiLatencyP50: { max: 100, warning: 80, critical: 200, unit: "ms", action: "optimize", description: "P50 latency API" },
  apiLatencyP99: { max: 500, warning: 300, critical: 1000, unit: "ms", action: "optimize", description: "P99 latency API" },
  wsConnections: { max: 10000, warning: 8000, critical: 12000, unit: "count", action: "scale_up", description: "Активных WebSocket соединений" },
  k8sReplicas: { min: 3, warning: 3, critical: 1, unit: "count", action: "scale_up", description: "Количество реплик API" },

  // ── SECURITY ──
  reconAttempts: { max: 50, warning: 30, critical: 100, unit: "per_hour", action: "investigate", description: "Попытки сканирования портов/директорий" },
  suspiciousIPs: { max: 20, warning: 10, critical: 50, unit: "count", action: "ban_wave", description: "Подозрительные IP-адреса" },
  multiAccountFlags: { max: 50, warning: 25, critical: 100, unit: "count", action: "anti_sybil", description: "Флаги мульти-аккаунтов" },
  referralAbuse: { max: 30, warning: 15, critical: 60, unit: "count", action: "investigate", description: "Злоупотребление реферальной системой" },
  rewardFarmAttempts: { max: 100, warning: 50, critical: 200, unit: "per_day", action: "halt_rewards", description: "Попытки фарминга наград" },
  unauthorizedAccessAttempts: { max: 20, warning: 10, critical: 50, unit: "per_hour", action: "lockdown", description: "Попытки неавторизованного доступа к админке" },
  failedLogins: { max: 100, warning: 50, critical: 300, unit: "per_hour", action: "rate_limit", description: "Неудачные попытки логина" },
  apiRequestsMinute: { max: 5000, warning: 3000, critical: 10000, unit: "per_minute", action: "rate_limit", description: "Запросов к API в минуту" },
  rateLimitHits: { max: 200, warning: 100, critical: 500, unit: "per_hour", action: "tighten", description: "Срабатываний rate limiter" },
  scrapingDetected: { max: 20, warning: 10, critical: 50, unit: "per_hour", action: "block", description: "Детектированных попыток скрапинга" },
  scenarioDataLeaked: { max: 0, warning: 1, critical: 5, unit: "count", action: "emergency", description: "Утекших сценариев" },

  // ── ECONOMY ──
  burnRatio: { min: 0.15, warning: 0.20, critical: 0.10, unit: "ratio", action: "add_sink", description: "Burn/Emission ratio" },
  tokenPriceChange: { max: 20, warning: 15, critical: 30, unit: "%/24h", action: "investigate", description: "Изменение цены токена за 24ч" },
  exchangeInflowRatio: { max: 3.0, warning: 2.0, critical: 5.0, unit: "ratio", action: "monitor", description: "Inflow/Outflow ratio на биржи" },
  top10HolderPercent: { max: 50, warning: 40, critical: 60, unit: "%", action: "distribute", description: "Концентрация топ-10 холдеров" },
  tokenVelocity: { max: 0.30, warning: 0.25, critical: 0.40, unit: "ratio", action: "add_sink", description: "Скорость обращения токена" },
  whaleActionsDetected: { max: 10, warning: 5, critical: 20, unit: "per_day", action: "investigate", description: "Крупных движений китов" },

  // ── PLAYER HEALTH ──
  d1RetentionDrop: { max: 10, warning: 7, critical: 15, unit: "%", action: "fix_onboarding", description: "Падение D1 retention (% от baseline)" },
  d7RetentionDrop: { max: 15, warning: 10, critical: 20, unit: "%", action: "fix_content", description: "Падение D7 retention" },
  lossStreakChurnRate: { max: 0.35, warning: 0.28, critical: 0.40, unit: "ratio", action: "add_support", description: "Churn после 3+ поражений" },
  playerGrowthRate: { min: -10, warning: -5, critical: -20, unit: "%/week", action: "investigate", description: "Темп роста игроков" },
  premiumConversion: { min: 0.02, warning: 0.03, critical: 0.01, unit: "ratio", action: "promo", description: "Конверсия в premium" },

  // ── BRIDGE / DEFI ──
  bridgeTVL: { min: 100000, warning: 500000, critical: 50000, unit: "USD", action: "pause_bridge", description: "TVL в мосте" },
  anomalyScore: { max: 30, warning: 20, critical: 50, unit: "score", action: "emergency_pause", description: "Общий счёт аномалий" },
  flashLoanActivity: { max: 500000, warning: 100000, critical: 1000000, unit: "USD", action: "pause_governance", description: "Активность flash loans" },
  governanceStaked: { min: 10000000, warning: 15000000, critical: 5000000, unit: "tokens", action: "alert", description: "Токенов в стейкинге governance" },
  multisigSignersActive: { min: 4, warning: 5, critical: 3, unit: "count", action: "emergency", description: "Активных подписантов multisig" },

  // ── FRAUD ──
  fraudAlerts: { max: 5, warning: 3, critical: 15, unit: "per_day", action: "investigate", description: "Фрод-алертов в день" },
  phishingReports: { max: 10, warning: 5, critical: 50, unit: "per_day", action: "community_alert", description: "Репортов о фишинге" },
  compromisedAccounts: { max: 0, warning: 1, critical: 10, unit: "count", action: "emergency_freeze", description: "Скомпрометированных аккаунтов" },
  fakeReviews: { max: 20, warning: 10, critical: 50, unit: "count", action: "report_abuse", description: "Фейковых отзывов" },
  negativeMentions: { max: 50, warning: 30, critical: 100, unit: "per_day", action: "pr_response", description: "Негативных упоминаний в соцсетях" },

  // ── INFRASTRUCTURE ──
  serverUptime: { min: 0.995, warning: 0.998, critical: 0.990, unit: "ratio", action: "emergency", description: "Uptime сервера" },
  dataIntegrity: { min: 0.999, warning: 0.995, critical: 0.990, unit: "ratio", action: "restore_backup", description: "Целостность данных" },
  backupAge: { max: 48, warning: 36, critical: 72, unit: "hours", action: "backup_now", description: "Возраст последнего бэкапа" },
  diskUsage: { max: 80, warning: 70, critical: 90, unit: "%", action: "expand_disk", description: "Использование диска" },
  sslDaysLeft: { min: 14, warning: 21, critical: 7, unit: "days", action: "renew_ssl", description: "Дней до истечения SSL" },

  // ── EXTERNAL ──
  competitorActivity: { max: "high", warning: "medium", critical: "high", unit: "level", action: "monitor", description: "Активность конкурентов" },
  regulatoryAlerts: { max: 1, warning: 1, critical: 2, unit: "count", action: "legal_response", description: "Регуляторных алертов" },
  exchangeListings: { min: 2, warning: 3, critical: 1, unit: "count", action: "legal_defense", description: "Активных биржевых листингов" },
  socialMentions: { max: 5000, warning: 10000, critical: 20000, unit: "per_day", action: "viral_response", description: "Упоминаний в соцсетях за день" },
  communitySentiment: { min: "neutral", warning: "negative", critical: "hostile", unit: "level", action: "community_engagement", description: "Тон сообщества" },
};

// ═══════════════════════════════════════════════
// TREND DETECTION ENGINE
// ═══════════════════════════════════════════════

class TrendDetector {
  constructor() {
    this.history = new Map();
    this.trends = new Map();
    this.alerts = [];
  }

  /** Feed a new data point */
  feed(metric, value, timestamp = Date.now()) {
    if (!this.history.has(metric)) this.history.set(metric, []);
    const series = this.history.get(metric);
    series.push({ value, timestamp });
    if (series.length > 100) series.shift();

    // Detect trend
    this._detectTrend(metric, series);
    // Check thresholds
    this._checkThreshold(metric, value);
  }

  _detectTrend(metric, series) {
    if (series.length < 10) return;
    const recent = series.slice(-10);
    const values = recent.map(p => p.value);

    // Simple linear regression slope
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((s, v) => s + v, 0) / n;
    const slope = values.reduce((s, v, i) => s + (i - xMean) * (v - yMean), 0) /
                  values.reduce((s, v, i) => s + (i - xMean) ** 2, 0);
    const changeRate = yMean > 0 ? (slope * n / yMean) * 100 : 0;

    const trend = {
      metric,
      slope: Math.round(slope * 1000) / 1000,
      changeRate: Math.round(changeRate * 10) / 10,
      direction: slope > 0.01 ? "rising" : slope < -0.01 ? "falling" : "stable",
      severity: Math.abs(changeRate) > 20 ? "HIGH" : Math.abs(changeRate) > 10 ? "MEDIUM" : "LOW",
    };

    this.trends.set(metric, trend);

    // Alert on unhealthy trends
    const threshold = THRESHOLDS[metric];
    if (!threshold) return;

    const currentValue = values[values.length - 1];
    const shouldBeBelow = threshold.max !== undefined;
    const shouldBeAbove = threshold.min !== undefined;

    if (trend.direction === "rising" && shouldBeBelow && currentValue > (threshold.warning || threshold.max)) {
      this.alerts.push({
        metric, severity: "WARNING", trend: "rising",
        current: currentValue, limit: threshold.warning || threshold.max,
        message: `${metric} растёт: ${currentValue} → превышает ${threshold.warning || threshold.max}${threshold.unit}. ${threshold.description}. Действие: ${threshold.action}.`,
        timestamp: Date.now(),
      });
    }

    if (trend.direction === "falling" && shouldBeAbove && currentValue < (threshold.warning || threshold.min)) {
      this.alerts.push({
        metric, severity: "WARNING", trend: "falling",
        current: currentValue, limit: threshold.warning || threshold.min,
        message: `${metric} падает: ${currentValue} → ниже ${threshold.warning || threshold.min}${threshold.unit}. ${threshold.description}. Действие: ${threshold.action}.`,
        timestamp: Date.now(),
      });
    }
  }

  _checkThreshold(metric, value) {
    const t = THRESHOLDS[metric];
    if (!t) return;

    const checkMax = t.max !== undefined && value >= t.critical;
    const checkMin = t.min !== undefined && value <= t.critical;

    if (checkMax || checkMin) {
      this.alerts.push({
        metric, severity: "CRITICAL",
        current: value, limit: checkMax ? t.max : t.min,
        message: `🚨 ${metric}: ${value}${t.unit} — КРИТИЧЕСКИЙ уровень! ${t.description}. НЕМЕДЛЕННО: ${t.action}.`,
        timestamp: Date.now(),
      });
    }
  }

  getAlerts(limit = 50) {
    return this.alerts.slice(-limit).reverse();
  }

  getTrends() {
    return Object.fromEntries(this.trends);
  }

  getStatus() {
    const criticalNow = this.alerts.filter(a => a.severity === "CRITICAL" && Date.now() - a.timestamp < 3600000);
    const warnings = this.alerts.filter(a => a.severity === "WARNING" && Date.now() - a.timestamp < 3600000);
    return {
      criticalCount: criticalNow.length,
      warningCount: warnings.length,
      topCritical: criticalNow.slice(0, 5),
      topWarnings: warnings.slice(0, 5),
      trendsSummary: Object.entries(this.getTrends()).map(([m, t]) => `${m}: ${t.direction} ${t.changeRate}%/period`),
    };
  }
}

export const trendDetector = new TrendDetector();
export { THRESHOLDS };
