// ============================================================
// AI LIVEOPS + MARKET OBSERVER INTELLIGENCE
// Event recommendations, tournament planning, token price vs
// game activity correlation, on-chain awareness.
// ============================================================

export class LiveOpsIntelligence {
  constructor() { this.insights = []; this.alerts = []; this.recommendations = []; }

  analyze(state = {}) {
    this.insights = []; this.alerts = []; this.recommendations = [];
    this._analyzeEventTiming(state);
    this._analyzeTournamentCalendar(state);
    this._analyzeSeasonalOpportunities(state);
    this._analyzeContentCadence(state);
    this._analyzeMarketCorrelation(state);
    this._analyzeTokenPriceImpact(state);
    this._analyzeOnChainActivity(state);
    this._generateLiveOpsPlan(state);
    return this.buildReport();
  }

  _analyzeEventTiming(state) {
    const daysSinceLastEvent = state.daysSinceLastEvent || 7;
    const eventRetentionUplift = state.eventRetentionUplift || 0;

    if (daysSinceLastEvent > 10) {
      this.alerts.push({
        module: "liveops", severity: "MEDIUM", metric: "event_cadence",
        value: `${daysSinceLastEvent} days`, target: "< 10 days",
        insight: "Без событий > 10 дней. Игроки теряют интерес. Нужен мини-ивент.",
        suggestedActions: [
          { action: "WEEKEND_WARRIOR_EVENT", impact: 25, effort: "low",
            desc: "Запустить Weekend Warrior: +50% XP за бои в выходные. Автоматически." },
        ],
      });
    }

    if (eventRetentionUplift > 0.15) {
      this.insights.push({
        module: "liveops", sentiment: "positive",
        insight: `События дают +${Math.round(eventRetentionUplift*100)}% к удержанию. Инвестировать в больше ивентов.`,
      });
    }
  }

  _analyzeTournamentCalendar(state) {
    const activeTournaments = state.activeTournaments || 0;
    const tournamentFillRate = state.tournamentFillRate || 0;
    const upcomingTournaments = state.upcomingTournaments || 0;

    if (activeTournaments === 0 && upcomingTournaments === 0) {
      this.alerts.push({
        module: "liveops", severity: "HIGH", metric: "tournament_gap",
        value: "0 турниров", target: "≥ 1 active",
        insight: "Ни одного турнира. Это ключевой retention-драйвер. Срочно запустить.",
        suggestedActions: [
          { action: "AUTO_TOURNAMENT", impact: 35, effort: "medium",
            desc: "Авто-турнир каждые выходные: 200 $SIG призовой фонд. Бесплатный вход." },
        ],
      });
    }

    if (tournamentFillRate < 0.50) {
      this.insights.push({
        module: "liveops", sentiment: "warning",
        insight: `Турниры заполняются на ${Math.round(tournamentFillRate*100)}%. Снизить max players или объединить лиги.`,
      });
    }
  }

  _analyzeSeasonalOpportunities(state) {
    const currentMonth = new Date().getMonth();
    const seasonalEvents = {
      0: { name: "New Year Resolution", theme: "Discipline", discount: "30% на Season Pass" },
      2: { name: "Spring Cleaning", theme: "Error Journal", discount: "Бесплатный сброс 3 ошибок" },
      5: { name: "Summer FOMO Survival", theme: "FOMO Resistance", discount: "Double XP в FOMO Arena" },
      9: { name: "Q4 Grind", theme: "All Skills", discount: "50% на все косметические скины" },
      11: { name: "Christmas Whale Hunt", theme: "On-chain", discount: "Limited Edition Holiday Skins" },
    };
    const event = seasonalEvents[currentMonth];
    if (event) {
      this.recommendations.push({
        type: "seasonal_event", name: event.name, theme: event.theme, discount: event.discount,
        timing: "next 2 weeks", expectedImpact: 20,
      });
    }
  }

  _analyzeContentCadence(state) {
    const scenariosGenerated7d = state.scenariosGenerated7d || 0;
    const scenariosNeededPerWeek = state.scenariosNeededPerWeek || 15;

    if (scenariosGenerated7d < scenariosNeededPerWeek * 0.5) {
      this.alerts.push({
        module: "liveops", severity: "MEDIUM", metric: "content_cadence",
        value: `${scenariosGenerated7d}/нед`, target: `≥ ${scenariosNeededPerWeek}/нед`,
        insight: "Темп генерации контента недостаточен. AI Pipeline нужно ускорить.",
        suggestedActions: [
          { action: "AUTO_GENERATE_BATCH", impact: 20, effort: "low",
            desc: `AI-генерация ${scenariosNeededPerWeek - scenariosGenerated7d} сценариев из рыночных событий этой недели.` },
        ],
      });
    }
  }

  _analyzeMarketCorrelation(state) {
    const tokenPriceChange = state.tokenPriceChange24h || 0;
    const gameActivityChange = state.gameActivityChange24h || 0;
    const correlation = state.priceActivityCorrelation || 0;

    if (Math.abs(correlation) > 0.5) {
      const direction = correlation > 0 ? "положительная" : "отрицательная";
      this.insights.push({
        module: "market", sentiment: "neutral",
        insight: `${direction} корреляция (${correlation.toFixed(2)}) между ценой токена и активностью в игре. Цена влияет на вовлечение.`,
        suggestedActions: correlation > 0
          ? [{ action: "BULL_MARKET_EVENT", impact: 15, effort: "low", desc: "При росте цены — усилить маркетинг. Новые игроки приходят на хайпе." }]
          : [{ action: "BEAR_MARKET_RETENTION", impact: 20, effort: "medium", desc: "При падении цены — усилить earn-механики, чтобы удержать игроков." }],
      });
    }
  }

  _analyzeTokenPriceImpact(state) {
    const tokenPrice = state.tokenPrice || 0;
    const tokenPriceATH = state.tokenPriceATH || 0;
    const drawdown = tokenPriceATH > 0 ? (tokenPriceATH - tokenPrice) / tokenPriceATH : 0;

    if (drawdown > 0.50) {
      this.alerts.push({
        module: "market", severity: "HIGH", metric: "token_drawdown",
        value: `${Math.round(drawdown*100)}% от ATH`, target: "< 50%",
        insight: "Токен упал более чем на 50% от максимума. Риск: игроки воспринимают это как провал проекта.",
        suggestedActions: [
          { action: "BUYBACK_AND_BURN", impact: 30, effort: "high",
            desc: "Использовать treasury для buyback. Сжечь выкупленные токены. Сигнал уверенности." },
          { action: "COMMUNITY_AMA", impact: 15, effort: "low",
            desc: "Провести AMA: объяснить roadmap, показать метрики retention, успокоить сообщество." },
        ],
      });
    }
  }

  _analyzeOnChainActivity(state) {
    const newWallets24h = state.newWallets24h || 0;
    const activeWallets = state.activeWallets || 0;
    const exchangeInflow = state.exchangeInflow || 0;
    const exchangeOutflow = state.exchangeOutflow || 0;

    if (exchangeInflow > exchangeOutflow * 2) {
      this.insights.push({
        module: "market", sentiment: "warning",
        insight: "Приток на биржи в 2x превышает отток. Возможно, держатели готовятся продавать.",
      });
    }

    if (newWallets24h > activeWallets * 0.05) {
      this.insights.push({
        module: "market", sentiment: "positive",
        insight: `${newWallets24h} новых кошельков за 24ч (${Math.round(newWallets24h/activeWallets*100)}% роста). Сильный organic growth.`,
      });
    }
  }

  _generateLiveOpsPlan(state) {
    const plan = [];
    const now = new Date();

    // Next 7 days plan
    plan.push({
      day: "Сегодня", action: "Проверить AI-алерты. Подтвердить/отклонить рекомендации.",
      priority: "CRITICAL",
    });

    if ((state.activeTournaments || 0) === 0) {
      plan.push({ day: "Завтра", action: "Запустить Auto-турнир на выходные.", priority: "HIGH" });
    }

    if ((state.daysSinceLastEvent || 7) > 5) {
      plan.push({ day: "День 3", action: "Запустить Weekend Warrior: double XP.", priority: "MEDIUM" });
    }

    plan.push({ day: "День 5", action: "AI-генерация 15 сценариев из новостей.", priority: "MEDIUM" });
    plan.push({ day: "День 7", action: "Недельный отчёт: сравнить retention с прошлой неделей.", priority: "LOW" });

    this.recommendations.push({ type: "liveops_plan", plan });
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
      module: "liveops",
      health: criticalCount === 0 ? "healthy" : "warning",
      alerts: this.alerts,
      insights: this.insights,
      recommendations: this.recommendations,
      top20Action: topAction,
      summary: criticalCount > 0
        ? `⚠ ${criticalCount} проблем в liveops/market. Приоритет: ${topAction?.desc || "запуск турнира"}.`
        : `✅ LiveOps активны. ${this.recommendations.filter(r => r.type === "seasonal_event").length} сезонных возможностей.`,
    };
  }
}
