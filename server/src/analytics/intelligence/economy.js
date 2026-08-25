// ============================================================
// AI ECONOMY + FAIRNESS INTELLIGENCE
// Monetization without pay-to-win. Fairness across segments.
// Sink/Faucet balance. Shop health. Token pressure.
// ============================================================

export class EconomyIntelligence {
  constructor() { this.insights = []; this.alerts = []; }

  analyze(state = {}) {
    this.insights = []; this.alerts = [];
    this._analyzeSinkFaucet(state);
    this._analyzePremiumConversion(state);
    this._analyzeShopHealth(state);
    this._analyzeFreeVsPremium(state);
    this._analyzeEarnedVsPaid(state);
    this._analyzeTokenVelocity(state);
    this._analyzeMarketplaceHealth(state);
    return this.buildReport();
  }

  _analyzeSinkFaucet(state) {
    const burnRatio = state.burnRatio || 0;
    if (burnRatio < 0.20) {
      this.alerts.push({
        module: "economy", severity: "CRITICAL", metric: "burn_emission_ratio",
        value: `${Math.round(burnRatio * 100)}%`, target: "> 30%",
        insight: "Эмиссия в 5x превышает сжигание. Токен под инфляционным давлением. Нужны новые sink-механики.",
        suggestedActions: [
          { action: "ADD_PREMIUM_SINK", impact: 40, effort: "medium",
            desc: "Ввести 'Card Mastery Boost' за $SIG: ускоренная прокачка карты навыка. 100 $SIG/уровень. 80% сжигается." },
          { action: "LIMITED_EDITION_SKINS", impact: 30, effort: "low",
            desc: "Срочный дроп 3 limited-edition скинов. 24h окно. Все токены сжигаются." },
        ],
      });
    } else if (burnRatio > 0.70) {
      this.insights.push({
        module: "economy", sentiment: "positive",
        insight: `Burn/Emit = ${Math.round(burnRatio*100)}%. Сильное дефляционное давление. Токен здоров.`,
      });
    }
  }

  _analyzePremiumConversion(state) {
    const premiumRate = state.premiumConversion || 0;
    if (premiumRate < 0.03) {
      this.alerts.push({
        module: "economy", severity: "HIGH", metric: "premium_conversion",
        value: `${Math.round(premiumRate*100)}%`, target: "> 5%",
        insight: "Конверсия в premium ниже целевой. AI Coach ценность не очевидна игрокам.",
        suggestedActions: [
          { action: "AI_COACH_DEMO", impact: 35, effort: "low",
            desc: "Показывать AI Coach разбор после каждого 3-го боя с кнопкой 'Разблокировать полный доступ'." },
          { action: "PREMIUM_TRIAL", impact: 25, effort: "medium",
            desc: "7-дневный trial AI Coach Pro для игроков достигших Rank 3." },
        ],
      });
    }
  }

  _analyzeShopHealth(state) {
    const shopUtilization = state.shopUtilization || 0;
    const avgSpendPerPayingUser = state.avgSpendPerPayingUser || 0;
    const topSellingCategory = state.topSellingCategory || "none";

    if (shopUtilization < 0.10) {
      this.insights.push({
        module: "economy", sentiment: "warning",
        insight: `Только ${Math.round(shopUtilization*100)}% игроков заходят в магазин. Товары не видны или не привлекательны.`,
        suggestedActions: [
          { action: "SHOP_DISCOVERY", impact: 20, effort: "low",
            desc: "Показывать 1 релевантный товар после каждого боя в Result-экране." },
        ],
      });
    }

    if (topSellingCategory === "cosmetics") {
      this.insights.push({
        module: "economy", sentiment: "positive",
        insight: "Косметика — топ-категория. Это хорошо: не влияет на геймплей, чистый sink.",
      });
    }
  }

  _analyzeFreeVsPremium(state) {
    const freeWinrate = state.freeWinrate || 0;
    const premiumWinrate = state.premiumWinrate || 0;
    const winrateGap = premiumWinrate - freeWinrate;

    if (winrateGap > 0.05) {
      this.alerts.push({
        module: "fairness", severity: "CRITICAL", metric: "winrate_gap",
        value: `Premium +${Math.round(winrateGap*100)}% winrate`, target: "< 5% gap",
        insight: "⚠ PREMIUM PLAYERS HAVE HIGHER WINRATE. Это нарушает non-pay-to-win принцип. Немедленное расследование.",
        suggestedActions: [
          { action: "AUDIT_PREMIUM_ADVANTAGE", impact: 50, effort: "high",
            desc: "Проверить: даёт ли AI Coach несправедливое преимущество? Если да — ограничить подсказки в PvP." },
        ],
      });
    } else if (winrateGap < 0.02) {
      this.insights.push({
        module: "fairness", sentiment: "positive",
        insight: `Winrate free vs premium: разница ${Math.round(Math.abs(winrateGap)*100)}%. Non-pay-to-win соблюдается.`,
      });
    }
  }

  _analyzeEarnedVsPaid(state) {
    const earnOnlyUsers = state.earnOnlyUsers || 0;
    const earnOnlyProgressSpeed = state.earnOnlyProgressSpeed || 0;
    const paidProgressSpeed = state.paidProgressSpeed || 0;
    const progressRatio = paidProgressSpeed / Math.max(0.01, earnOnlyProgressSpeed);

    if (progressRatio > 2.0) {
      this.alerts.push({
        module: "fairness", severity: "HIGH", metric: "progress_speed_gap",
        value: `${progressRatio.toFixed(1)}x faster for premium`, target: "< 2x",
        insight: "Premium-игроки прогрессируют значительно быстрее. Риск восприятия pay-to-win.",
        suggestedActions: [
          { action: "BOOST_EARN_PATH", impact: 30, effort: "medium",
            desc: "Увеличить XP для free-игроков на 15%. Добавить earnable XP-boost через daily streak." },
        ],
      });
    }
  }

  _analyzeTokenVelocity(state) {
    const tokenVelocity = state.tokenVelocity || 0;
    const unusedRewards = state.unusedRewards || 0;

    if (tokenVelocity < 0.1) {
      this.insights.push({
        module: "economy", sentiment: "neutral",
        insight: `Токен почти не двигается. ${Math.round(unusedRewards*100)}% наград не используются. Нужны стимулы к тратам.`,
        suggestedActions: [
          { action: "SINK_INCENTIVE", impact: 15, effort: "low",
            desc: "Скидка 20% на все скины при оплате $SIG. Срок: 48 часов." },
        ],
      });
    }
  }

  _analyzeMarketplaceHealth(state) {
    const marketplaceGMV = state.marketplaceGMV || 0;
    const marketplaceFeeCapture = state.marketplaceFeeCapture || 0;

    if (marketplaceGMV > 0 && marketplaceFeeCapture < 0.02) {
      this.insights.push({
        module: "economy", sentiment: "neutral",
        insight: "Marketplace активен, но fee capture низкий. Рассмотреть повышение fee до 2.5%.",
      });
    }
  }

  buildReport() {
    const criticalCount = this.alerts.filter((a) => a.severity === "CRITICAL").length;
    let topAction = null; let topImpact = 0;
    for (const alert of this.alerts) {
      for (const action of alert.suggestedActions || []) {
        if (action.impact > topImpact) { topImpact = action.impact; topAction = { ...action, context: alert.metric, severity: alert.severity }; }
      }
    }

    return {
      module: "economy",
      health: criticalCount === 0 ? "healthy" : "critical",
      alerts: this.alerts,
      insights: this.insights,
      top20Action: topAction,
      summary: criticalCount > 0
        ? `⚠ ${criticalCount} критических проблем экономики/fairness. Приоритет: ${topAction?.desc || "аудит premium-преимущества"}.`
        : "✅ Экономика сбалансирована. Non-pay-to-win соблюдается.",
    };
  }
}
