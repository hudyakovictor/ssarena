// ============================================================
// AI RETENTION INTELLIGENCE
// Detects D1/D7/D30 churn drivers, loss streak behavior,
// tournament entry funnel, post-defeat return patterns.
// Outputs: 20% actions that give 80% retention uplift.
// ============================================================
export class RetentionIntelligence {
  constructor() {
    this.insights = [];
    this.alerts = [];
  }

  /**
   * Full retention analysis cycle.
   * @param {Object} state — aggregated from metrics tables
   */
  analyze(state = {}) {
    this.insights = [];
    this.alerts = [];

    // 1. Cohort analysis
    this._analyzeCohorts(state);

    // 2. Loss streak impact
    this._analyzeLossStreaks(state);

    // 3. Tournament funnel leaks
    this._analyzeTournamentFunnel(state);

    // 4. Post-defeat return patterns
    this._analyzePostDefeat(state);

    // 5. Session depth analysis
    this._analyzeSessionDepth(state);

    // 6. Segment-specific churn drivers
    this._analyzeSegmentChurn(state);

    return this.buildReport();
  }

  _analyzeCohorts(state) {
    const d1 = state.d1Retention || 0;
    const d7 = state.d7Retention || 0;
    const d30 = state.d30Retention || 0;

    // D1 < 40% is critical — onboarding is broken
    if (d1 < 0.40) {
      this.alerts.push({
        module: "retention", severity: "CRITICAL", metric: "d1_retention",
        value: `${Math.round(d1 * 100)}%`, target: "> 40%",
        insight: "Онбординг теряет больше 60% игроков в первый день. Приоритет #1: улучшить Level 0 туториал.",
        suggestedActions: [
          { action: "SHORTEN_ONBOARDING", impact: 35, effort: "low",
            desc: "Сократить онбординг до 3 шагов вместо 5. Первый бой — через 60 секунд после входа." },
          { action: "FIRST_BATTLE_GUARANTEED_WIN", impact: 25, effort: "low",
            desc: "Первый бой всегда против самого простого Meme Mirage Lv.1 с подсказками." },
          { action: "INSTANT_REWARD", impact: 20, effort: "low",
            desc: "Выдать первую карту навыка сразу после онбординга, а не после 3-го боя." },
        ],
      });
    }

    // D1→D7 cliff > 50% means mid-game content gap
    if (d1 > 0.40 && d7 < d1 * 0.50) {
      this.alerts.push({
        module: "retention", severity: "HIGH", metric: "d1_to_d7_dropoff",
        value: `${Math.round((1 - d7 / d1) * 100)}% drop`, target: "< 50% drop",
        insight: "Игроки проходят первый день, но не возвращаются. Контент на 2-7 день недостаточно вовлекает.",
        suggestedActions: [
          { action: "DAILY_STREAK_BONUS", impact: 30, effort: "low",
            desc: "Усилить daily streak rewards: x2 XP за 3-й день подряд, x3 за 7-й." },
          { action: "UNLOCK_TEASER", impact: 25, effort: "medium",
            desc: "Показать заблокированную сущность: 'Встретишь на Rank 5. Осталось 3 боя.'" },
        ],
      });
    }

    // Healthy
    if (d1 > 0.50 && d7 > 0.30 && d30 > 0.15) {
      this.insights.push({
        module: "retention", sentiment: "positive",
        insight: `Retention healthy: D1=${Math.round(d1*100)}%, D7=${Math.round(d7*100)}%, D30=${Math.round(d30*100)}%. Фокус на масштабировании, не на исправлении.`,
      });
    }
  }

  _analyzeLossStreaks(state) {
    const lossStreakChurnRate = state.lossStreakChurnRate || 0;
    const lossStreakThreshold = state.lossStreakThreshold || 3;

    // Players who lose 3+ in a row are N times more likely to churn
    if (lossStreakChurnRate > 0.30) {
      this.alerts.push({
        module: "retention", severity: "HIGH", metric: "loss_streak_churn",
        value: `${Math.round(lossStreakChurnRate * 100)}% churn after ${lossStreakThreshold} losses`,
        target: "< 30%",
        insight: `После ${lossStreakThreshold} поражений подряд ${Math.round(lossStreakChurnRate * 100)}% игроков уходят. Нужна система поддержки после поражений.`,
        suggestedActions: [
          { action: "CONSOLATION_BONUS", impact: 28, effort: "low",
            desc: "После 2 поражений: бонус +2 AP на следующий бой. После 3: бесплатная тренировка." },
          { action: "COACH_TIP", impact: 22, effort: "medium",
            desc: "AI Coach показывает персональный совет после каждого поражения: 'Твоя ошибка: FOMO Entry. Попробуй Anti-FOMO Shield.'" },
        ],
      });
    }
  }

  _analyzeTournamentFunnel(state) {
    const tournamentViewRate = state.tournamentViewRate || 0;
    const tournamentEntryRate = state.tournamentEntryRate || 0;
    const tournamentCompletionRate = state.tournamentCompletionRate || 0;

    // Big drop from view → entry
    if (tournamentViewRate > 0.20 && tournamentEntryRate < 0.05) {
      this.insights.push({
        module: "retention", sentiment: "neutral",
        insight: `${Math.round(tournamentViewRate*100)}% видят турниры, но только ${Math.round(tournamentEntryRate*100)}% входят. Барьер: страх проигрыша или высокая цена входа.`,
        suggestedActions: [
          { action: "FREE_TOURNAMENT_TIER", impact: 35, effort: "medium",
            desc: "Добавить бесплатный еженедельный турнир с косметическими наградами." },
        ],
      });
    }
  }

  _analyzePostDefeat(state) {
    const returnAfterLoss24h = state.returnAfterLoss24h || 0;
    const returnAfterWin24h = state.returnAfterWin24h || 0;

    if (returnAfterLoss24h < returnAfterWin24h * 0.6) {
      this.alerts.push({
        module: "retention", severity: "MEDIUM", metric: "post_defeat_return",
        value: `${Math.round(returnAfterLoss24h*100)}% vs ${Math.round(returnAfterWin24h*100)}% after win`,
        target: "> 60% of win return rate",
        insight: "После поражений игроки возвращаются значительно реже, чем после побед. Усилить мотивацию после проигрыша.",
        suggestedActions: [
          { action: "ERROR_JOURNAL_NUDGE", impact: 20, effort: "low",
            desc: "После поражения показать: 'Ты узнал новую ошибку. 70% игроков исправляют её за 3 попытки.'" },
        ],
      });
    }
  }

  _analyzeSessionDepth(state) {
    const avgBattlesPerSession = state.avgBattlesPerSession || 1;
    const sessionsWith1Battle = state.sessionsWith1Battle || 0;
    const sessionsWith3PlusBattles = state.sessionsWith3PlusBattles || 0;

    if (sessionsWith1Battle > 0.60 && sessionsWith3PlusBattles < 0.15) {
      this.insights.push({
        module: "retention", sentiment: "warning",
        insight: `${Math.round(sessionsWith1Battle*100)}% сессий — 1 бой. Нет глубины. Игроки не вовлекаются в несколько боёв подряд.`,
        suggestedActions: [
          { action: "BATTLE_CHAIN_BONUS", impact: 25, effort: "low",
            desc: "3 боя подряд = +25% XP. 5 боёв = +50% XP + бесплатный AP." },
        ],
      });
    }
  }

  _analyzeSegmentChurn(state) {
    const segments = state.segmentChurn || {};
    const worstSegment = Object.entries(segments).sort(([,a], [,b]) => (b - a))[0];

    if (worstSegment && worstSegment[1] > 0.50) {
      this.alerts.push({
        module: "retention", severity: "HIGH", metric: "segment_churn",
        value: `${worstSegment[0]}: ${Math.round(worstSegment[1]*100)}% churn`,
        target: "< 50%",
        insight: `Сегмент "${worstSegment[0]}" показывает аномальный отток. Проверить контент и баланс для этой группы.`,
      });
    }
  }

  buildReport() {
    const criticalCount = this.alerts.filter((a) => a.severity === "CRITICAL").length;
    const highCount = this.alerts.filter((a) => a.severity === "HIGH").length;

    // Find the SINGLE highest-impact action (20/80 principle)
    let topAction = null;
    let topImpact = 0;
    for (const alert of this.alerts) {
      for (const action of alert.suggestedActions || []) {
        if (action.impact > topImpact) { topImpact = action.impact; topAction = { ...action, context: alert.metric, severity: alert.severity }; }
      }
    }

    return {
      module: "retention",
      health: criticalCount === 0 ? (highCount === 0 ? "healthy" : "warning") : "critical",
      alerts: this.alerts,
      insights: this.insights,
      top20Action: topAction,
      summary: criticalCount > 0
        ? `⚠ ${criticalCount} критических проблем с удержанием. Приоритет: ${topAction?.desc || "анализ онбординга"}.`
        : highCount > 0
          ? `⚡ ${highCount} проблем требуют внимания. Фокус: ${topAction?.desc || "углубление сессий"}.`
          : "✅ Retention в норме. Масштабируйся.",
    };
  }
}
