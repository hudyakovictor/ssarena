import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Shield, Bot, DollarSign, Clock, Play, X, RefreshCw, Sparkles, Coins, Target, Brain, Activity, BarChart3, Users, ShoppingCart, Zap } from "lucide-react";
import { C } from "../lib/data";
import { api } from "../lib/api";

type ModuleHealth = "healthy" | "warning" | "critical";

interface AIAlert {
  module: string; severity: string; metric: string;
  value: string; target: string; insight: string;
  suggestedActions?: { action: string; impact: number; effort: string; desc: string }[];
}

interface TopAction {
  action: string; impact: number; effort: string; desc: string;
  context: string; severity: string; module: string;
}

interface ScanReport {
  timestamp: string; overallHealth: ModuleHealth;
  stats: { totalAlerts: number; criticalAlerts: number; highAlerts: number; insights: number; recommendations: number };
  top3Actions: TopAction[];
  executiveSummary: string;
  modules: Record<string, { health: string; alerts: AIAlert[]; insights: any[]; summary: string; top20Action?: TopAction }>;
}

const MOCK_STATE = {
  activePlayers: 12847, d1Retention: 0.38, d7Retention: 0.22, d30Retention: 0.11,
  lossStreakChurnRate: 0.34, lossStreakThreshold: 3,
  tournamentViewRate: 0.24, tournamentEntryRate: 0.04, tournamentCompletionRate: 0.65,
  returnAfterLoss24h: 0.28, returnAfterWin24h: 0.52,
  avgBattlesPerSession: 1.4, sessionsWith1Battle: 0.62, sessionsWith3PlusBattles: 0.13,
  segmentChurn: { "Rank 0-1": 0.58, "Rank 2-4": 0.32, "Rank 5-8": 0.22, "Rank 9+": 0.15 },
  burnRatio: 0.18, premiumConversion: 0.028, shopUtilization: 0.08,
  avgSpendPerPayingUser: 12.50, topSellingCategory: "cosmetics",
  freeWinrate: 0.51, premiumWinrate: 0.54,
  earnOnlyUsers: 0.72, earnOnlyProgressSpeed: 1.0, paidProgressSpeed: 1.6,
  tokenVelocity: 0.07, unusedRewards: 0.45,
  daysSinceLastEvent: 12, eventRetentionUplift: 0.18,
  activeTournaments: 0, tournamentFillRate: 0.42, upcomingTournaments: 0,
  scenariosGenerated7d: 4, scenariosNeededPerWeek: 15,
  tokenPrice: 0.42, tokenPriceATH: 1.20, tokenPriceChange24h: -0.03, gameActivityChange24h: 0.02,
  priceActivityCorrelation: 0.62,
  newWallets24h: 142, activeWallets: 12847, exchangeInflow: 12500, exchangeOutflow: 4800,
  weeklyRevenue: 26600,
};

export function OverseerDashboard() {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [source, setSource] = useState<"live" | "demo" | null>(null);
  const [log, setLog] = useState<{ action: string; status: string; ts: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "retention" | "economy" | "fairness" | "liveops" | "market">("overview");

  const runScan = useCallback(() => {
    setScanning(true);
    let liveReport: ScanReport | null = null;
    api.getOverseerDashboard()
      .then((data: any) => {
        if (data && data.state && data.sections) liveReport = buildLiveReport(data);
      })
      .catch(() => { liveReport = null; })
      .finally(() => {
        // Live DB report when the backend is reachable, otherwise the
        // deterministic demo report (offline preview of the panel).
        const r = liveReport ?? buildMockReport();
        setReport(r);
        setSource(liveReport ? "live" : "demo");
        setScanning(false);
        setLog((p) => [{ action: `Full scan: ${r.overallHealth} | ${r.stats.criticalAlerts} critical, ${r.stats.highAlerts} high · ${liveReport ? "live-db" : "demo-mock"}`, status: "done", ts: new Date().toISOString() }, ...p].slice(0, 30));
      });
  }, []);

  const executeAction = useCallback((action: TopAction) => {
    setLog((p) => [{ action: `EXECUTED: ${action.desc.slice(0, 60)}`, status: "executed", ts: new Date().toISOString() }, ...p].slice(0, 30));
  }, []);

  // Auto-scan on mount
  useEffect(() => { runScan(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const healthIcon = (h: ModuleHealth) => h === "healthy" ? "🟢" : h === "warning" ? "🟡" : "🔴";
  const TABS: { id: typeof activeTab; label: string; icon: React.ElementType; color: string }[] = [
    { id: "overview", label: "20/80 Обзор", icon: Target, color: C.signal },
    { id: "retention", label: "Retention", icon: Users, color: C.short },
    { id: "economy", label: "Экономика", icon: DollarSign, color: C.gold },
    { id: "fairness", label: "Fairness", icon: Shield, color: C.long },
    { id: "liveops", label: "LiveOps", icon: Zap, color: C.pink },
    { id: "market", label: "Market", icon: TrendingUp, color: C.blue },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-black uppercase flex items-center gap-2">
            <Brain size={24} className="text-[var(--signal)]" /> AI Co-Pilot
          </h1>
          <p className="mt-1 text-sm text-[var(--inkSoft)]">Decision-support system. 20% действий → 80% результата. Измеримый AI ROI.</p>
        </div>
        <div className="flex gap-2 items-center">
          {source && (
            <span className="pill font-mono"
              style={{ background: source === "live" ? `${C.long}1a` : `${C.gold}1a`,
                color: source === "live" ? C.long : C.gold,
                border: `1px solid ${source === "live" ? C.long : C.gold}44` }}>
              {source === "live" ? "● LIVE-DB" : "◐ DEMO"}
            </span>
          )}
          <button onClick={runScan} className="btn-primary text-sm" disabled={scanning}>
            <RefreshCw size={14} className={scanning ? "animate-spin" : ""} /> {scanning ? "Анализирую..." : "Полный скан"}
          </button>
          {report && (
            <span className={`pill ${report.overallHealth === "healthy" ? "" : ""}`}
              style={{ background: report.overallHealth === "healthy" ? `${C.long}1a` : report.overallHealth === "warning" ? `${C.gold}1a` : `${C.short}1a`,
                color: report.overallHealth === "healthy" ? C.long : report.overallHealth === "warning" ? C.gold : C.short,
                border: `1px solid ${report.overallHealth === "healthy" ? C.long : report.overallHealth === "warning" ? C.gold : C.short}44` }}>
              {healthIcon(report.overallHealth)} {report.overallHealth.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Module health bar */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {report ? TABS.filter(t => t.id !== "overview").map((t) => {
          const mod = report.modules[t.id] || report.modules["retention"]; // fallback
          const h = mod?.health || "healthy";
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`panel p-3 flex items-center gap-2 transition-all ${activeTab === t.id ? "border-[var(--signal)]/50" : ""}`}>
              <span className="text-lg">{healthIcon(h as ModuleHealth)}</span>
              <t.icon size={14} style={{ color: t.color }} />
              <span className="font-mono text-[11px] font-bold text-[var(--inkSoft)]">{t.label}</span>
            </button>
          );
        }) : TABS.filter(t => t.id !== "overview").map((t) => (
          <div key={t.id} className="panel p-3 flex items-center gap-2 opacity-50">
            <span className="text-lg">⏳</span><t.icon size={14} style={{ color: t.color }} />
            <span className="font-mono text-[11px] text-[var(--inkDim)]">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-heading text-xs font-semibold ${activeTab === t.id ? "bg-[var(--signal)]/10 text-[var(--signal)]" : "text-[var(--inkDim)]"}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!report ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="panel p-12 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto h-12 w-12 rounded-full border-2 border-[var(--signal)] border-t-transparent mb-4" />
            <p className="font-heading text-lg font-bold">AI Co-Pilot анализирует систему...</p>
            <p className="text-sm text-[var(--inkSoft)] mt-1">Retention · Economy · Fairness · LiveOps · Market</p>
          </motion.div>
        ) : activeTab === "overview" ? (
          <OverviewTab key="overview" report={report} executeAction={executeAction} log={log} />
        ) : (
          <ModuleDetailTab key={activeTab} report={report} moduleId={activeTab} executeAction={executeAction} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── OVERVIEW TAB ──
function OverviewTab({ report, executeAction, log }: { report: ScanReport; executeAction: (a: TopAction) => void; log: any[] }) {
  return (
    <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      {/* Executive Summary */}
      <div className="panel p-5 border-2" style={{ borderColor: report.overallHealth === "critical" ? `${C.short}44` : report.overallHealth === "warning" ? `${C.gold}44` : `${C.long}44` }}>
        <div className="flex items-center gap-2 mb-3">
          {report.overallHealth === "healthy" ? <CheckCircle2 size={18} className="text-[var(--long)]" /> :
           report.overallHealth === "warning" ? <AlertTriangle size={18} className="text-[var(--gold)]" /> :
           <AlertTriangle size={18} className="text-[var(--short)]" />}
          <h2 className="font-display text-lg font-bold">Executive Summary</h2>
        </div>
        <pre className="font-mono text-sm text-[var(--inkSoft)] leading-relaxed whitespace-pre-wrap">{report.executiveSummary}</pre>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Critical Alerts", report.stats.criticalAlerts, report.stats.criticalAlerts > 0 ? C.short : C.long],
          ["High Alerts", report.stats.highAlerts, report.stats.highAlerts > 2 ? C.gold : C.long],
          ["Insights", report.stats.insights, C.signal],
          ["Recommendations", report.stats.recommendations, C.grape],
        ].map(([l, v, c]) => (
          <div key={l as string} className="panel p-4 text-center">
            <p className="font-display text-3xl font-bold" style={{ color: c as string }}>{v}</p>
            <p className="font-mono text-[10px] text-[var(--inkDim)] mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* TOP 3 — 20/80 actions */}
      <div>
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target size={14} className="text-[var(--gold)]" /> TOP 3 — 20% действий → 80% результата
        </h2>
        <div className="space-y-3">
          {report.top3Actions.map((action, i) => (
            <div key={i} className="panel p-4 flex items-start gap-4"
              style={{ borderColor: action.severity === "CRITICAL" ? `${C.short}44` : action.severity === "HIGH" ? `${C.gold}44` : `${C.signal}44` }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold"
                style={{ background: `${C.gold}1a`, color: C.gold, border: `1px solid ${C.gold}44` }}>#{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="pill" style={{ background: `${C.signal}1a`, color: C.signal, border: `1px solid ${C.signal}44` }}>{action.module}</span>
                  <span className={`pill ${action.severity === "CRITICAL" ? "" : ""}`}
                    style={{ background: action.severity === "CRITICAL" ? `${C.short}1a` : `${C.gold}1a`, color: action.severity === "CRITICAL" ? C.short : C.gold, border: `1px solid ${action.severity === "CRITICAL" ? C.short : C.gold}44` }}>{action.severity}</span>
                  <span className="font-mono text-[10px] text-[var(--inkSoft)]">{action.context}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--ink)] font-semibold">{action.desc}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="font-mono text-[10px] text-[var(--gold)]">⚡ Impact: {action.impact}/100</span>
                  <span className="font-mono text-[10px] text-[var(--inkDim)]">Effort: {action.effort}</span>
                </div>
              </div>
              <button onClick={() => executeAction(action)} className="btn-gold px-4 py-2 text-xs shrink-0"><Play size={12} /> Execute</button>
            </div>
          ))}
        </div>
      </div>

      {/* Action log */}
      <div className="panel p-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Bot size={14} className="text-[var(--grape)]" /> AI Action Log</h2>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {log.length === 0 ? <p className="text-[var(--inkDim)] text-xs text-center py-2">Лог появится после запуска AI Co-Pilot.</p> :
            log.map((l, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-black/20 px-3 py-1.5">
                <span className={`w-2 h-2 rounded-full ${l.status === "done" || l.status === "executed" ? "bg-[var(--long)]" : "bg-[var(--gold)] animate-pulse"}`} />
                <span className="font-mono text-[10px] text-[var(--inkSoft)] flex-1">{l.action}</span>
                <span className="font-mono text-[9px] text-[var(--inkDim)]">{new Date(l.ts).toLocaleTimeString()}</span>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── MODULE DETAIL TAB ──
function ModuleDetailTab({ report, moduleId, executeAction }: { report: ScanReport; moduleId: string; executeAction: (a: TopAction) => void }) {
  const mod = report.modules[moduleId] || report.modules["retention"];
  const titles: Record<string, string> = {
    retention: "🎯 Retention Intelligence", economy: "💰 Economy & Sinks", fairness: "⚖ Fairness Auditor", liveops: "📅 LiveOps Planner", market: "📈 Market Observer",
  };

  return (
    <motion.div key={moduleId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="panel p-5">
        <h2 className="font-display text-lg font-bold mb-4">{titles[moduleId] || moduleId}</h2>
        <p className="text-sm text-[var(--inkSoft)] mb-4">{mod?.summary || "No data"}</p>

        {/* Alerts */}
        {mod?.alerts?.length > 0 && (
          <div className="space-y-3">
            {mod.alerts.map((alert: AIAlert, i: number) => (
              <div key={i} className="rounded-xl border border-[var(--edge)] bg-black/20 p-4"
                style={{ borderColor: alert.severity === "CRITICAL" ? `${C.short}44` : alert.severity === "HIGH" ? `${C.gold}44` : `${C.signal}44` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`pill ${alert.severity === "CRITICAL" ? "" : ""}`}
                    style={{ background: alert.severity === "CRITICAL" ? `${C.short}1a` : `${C.gold}1a`, color: alert.severity === "CRITICAL" ? C.short : C.gold, border: `1px solid ${alert.severity === "CRITICAL" ? C.short : C.gold}44` }}>
                    {alert.severity}</span>
                  <span className="font-mono text-[10px] text-[var(--inkSoft)]">{alert.metric}: {alert.value} (target: {alert.target})</span>
                </div>
                <p className="text-sm text-[var(--ink)]">{alert.insight}</p>
                {alert.suggestedActions && (
                  <div className="mt-3 space-y-2">
                    {alert.suggestedActions.map((a, j) => (
                      <div key={j} className="flex items-center gap-3 rounded-lg bg-black/30 px-3 py-2">
                        <span className="font-mono text-[10px] text-[var(--gold)] shrink-0">+{a.impact}%</span>
                        <span className="text-xs text-[var(--inkSoft)] flex-1">{a.desc}</span>
                        <span className="font-mono text-[9px] text-[var(--inkDim)]">{a.effort}</span>
                        <button onClick={() => executeAction({ ...a, context: alert.metric, severity: alert.severity, module: alert.module })}
                          className="btn-ghost px-2 py-1 text-[9px]"><Play size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Insights */}
        {mod?.insights?.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-[var(--signal)]">Insights</h3>
            {mod.insights.map((ins: any, i: number) => (
              <div key={i} className="rounded-lg bg-[var(--signal)]/5 border border-[var(--signal)]/10 p-3 flex items-start gap-2">
                <span className="text-sm">{ins.sentiment === "positive" ? "✅" : ins.sentiment === "warning" ? "⚠️" : "ℹ️"}</span>
                <p className="text-xs text-[var(--inkSoft)]">{ins.insight}</p>
              </div>
            ))}
          </div>
        )}

        {(!mod?.alerts?.length && !mod?.insights?.length) && (
          <div className="text-center py-8"><CheckCircle2 size={32} className="mx-auto text-[var(--long)] mb-2" /><p className="text-[var(--inkSoft)]">Нет алертов для этого модуля.</p></div>
        )}
      </div>
    </motion.div>
  );
}

// ── MOCK REPORT BUILDER ──
function buildMockReport(): ScanReport {
  return {
    timestamp: new Date().toISOString(), overallHealth: "warning",
    stats: { totalAlerts: 8, criticalAlerts: 2, highAlerts: 4, insights: 12, recommendations: 15 },
    executiveSummary: "⚡ WARNING: 2 критических проблемы. Приоритет: burn ratio и онбординг.\n\n🎯 TOP 3:\n  1. [economy] Limited-edition скины для повышения burn ratio (impact: 40/100)\n  2. [retention] Сократить онбординг до 3 шагов (impact: 35/100)\n  3. [fairness] Проверить premium-преимущество в PvP (impact: 50/100)\n\n📊 R:warning | E:critical | L:warning",
    top3Actions: [
      { action: "AUDIT_PREMIUM_ADVANTAGE", impact: 50, effort: "high", desc: "Проверить: даёт ли AI Coach несправедливое преимущество в PvP. Если да — ограничить.", context: "winrate_gap", severity: "CRITICAL", module: "fairness" },
      { action: "ADD_PREMIUM_SINK", impact: 40, effort: "medium", desc: "Ввести 'Card Mastery Boost' за $SIG: ускоренная прокачка карты. 80% сжигается.", context: "burn_emission_ratio", severity: "CRITICAL", module: "economy" },
      { action: "SHORTEN_ONBOARDING", impact: 35, effort: "low", desc: "Сократить онбординг до 3 шагов. Первый бой — через 60 секунд после входа.", context: "d1_retention", severity: "CRITICAL", module: "retention" },
    ],
    modules: {
      retention: {
        health: "warning",
        alerts: [
          { module: "retention", severity: "CRITICAL", metric: "d1_retention", value: "38%", target: "> 40%", insight: "Онбординг теряет >60% игроков в D1. Приоритет: сократить туториал.", suggestedActions: [{ action: "SHORTEN_ONBOARDING", impact: 35, effort: "low", desc: "Сократить онбординг до 3 шагов." }, { action: "FIRST_BATTLE_GUARANTEED_WIN", impact: 25, effort: "low", desc: "Первый бой против Meme Mirage Lv.1 с подсказками." }] },
          { module: "retention", severity: "HIGH", metric: "loss_streak_churn", value: "34%", target: "< 30%", insight: "После 3 поражений подряд 34% уходят.", suggestedActions: [{ action: "CONSOLATION_BONUS", impact: 28, effort: "low", desc: "После 2 поражений: бонус +2 AP." }] },
        ],
        insights: [{ module: "retention", sentiment: "warning", insight: "62% сессий — 1 бой. Нет глубины." }],
        summary: "⚠ Онбординг и пост-поражения — главные точки оттока.",
      },
      economy: {
        health: "critical",
        alerts: [
          { module: "economy", severity: "CRITICAL", metric: "burn_emission_ratio", value: "18%", target: "> 30%", insight: "Эмиссия 5x > сжигания. Нужны новые sink-механики.", suggestedActions: [{ action: "ADD_PREMIUM_SINK", impact: 40, effort: "medium", desc: "Card Mastery Boost за $SIG." }, { action: "LIMITED_EDITION_SKINS", impact: 30, effort: "low", desc: "3 limited-edition скина, 24h окно." }] },
          { module: "economy", severity: "HIGH", metric: "premium_conversion", value: "2.8%", target: "> 5%", insight: "Конверсия в premium ниже цели.", suggestedActions: [{ action: "AI_COACH_DEMO", impact: 35, effort: "low", desc: "AI Coach демо после 3-го боя." }] },
        ],
        insights: [{ module: "economy", sentiment: "positive", insight: "Косметика — топ-категория. Чистый sink." }],
        summary: "⚠ Burn ratio 18% — критично. Premium conversion 2.8%.",
      },
      liveops: {
        health: "warning",
        alerts: [
          { module: "liveops", severity: "HIGH", metric: "tournament_gap", value: "0 турниров", target: "≥ 1", insight: "Ни одного турнира. Срочно запустить.", suggestedActions: [{ action: "AUTO_TOURNAMENT", impact: 35, effort: "medium", desc: "Авто-турнир каждые выходные: 200 $SIG приз." }] },
          { module: "liveops", severity: "MEDIUM", metric: "event_cadence", value: "12 days", target: "< 10", insight: ">10 дней без событий.", suggestedActions: [{ action: "WEEKEND_WARRIOR_EVENT", impact: 25, effort: "low", desc: "Weekend Warrior: +50% XP." }] },
        ],
        insights: [{ module: "market", sentiment: "positive", insight: "Корреляция цена-активность 0.62 — цена влияет на вовлечение." }],
        summary: "⚠ Нет активных турниров. 12 дней без ивентов.",
      },
    },
  };
}

// ── LIVE REPORT BUILDER (block 3.3) ──
// Maps the backend's real DB-backed dashboard into the same ScanReport
// shape the UI renders, so live and demo reports are interchangeable.
function buildLiveReport(data: any): ScanReport {
  const st = data.state || {};
  const secs = data.sections || {};

  const econ = secs.economy || {};
  const econIssues: AIAlert[] = (econ.issues || []).map((i: any) => ({
    module: "economy",
    severity: i.severity || "MEDIUM",
    metric: i.metric || "economy",
    value: String(i.value ?? "—"),
    target: i.target || "—",
    insight: i.recommendation || i.value || "—",
    suggestedActions: i.aiAction ? [{ action: i.aiAction, impact: 30, effort: "medium", desc: i.recommendation || i.aiAction }] : undefined,
  }));

  const content = secs.content || {};
  const contentAlerts: AIAlert[] = [];
  if (content.daysSinceLastScenario > 7 || content.contentAging?.includes("NEEDS")) {
    contentAlerts.push({ module: "liveops", severity: "HIGH", metric: "content_aging", value: String(content.daysSinceLastScenario ?? "?") + "d", target: "< 7d", insight: content.recommendation || "Сценарии устарели — сгенерировать новую партию в Admin." });
  }

  const security = secs.security || {};
  const secAlerts: AIAlert[] = [];
  if ((security.bannedIPs || 0) > 0) {
    secAlerts.push({ module: "fairness", severity: "MEDIUM", metric: "banned_ips", value: String(security.bannedIPs), target: "0", insight: security.status || `${security.bannedIPs} IP в бане.` });
  }

  const community = secs.community || {};
  const commAlerts: AIAlert[] = [];
  if ((battles24Value(st) || 0) === 0) {
    commAlerts.push({ module: "retention", severity: "HIGH", metric: "battles_24h", value: "0", target: "> 0", insight: "Битв за 24ч нет — проверить онбординг и первый бой." });
  }

  // Overall health from the most severe open module
  const allAlerts = [...econIssues, ...contentAlerts, ...secAlerts, ...commAlerts];
  const hasCrit = allAlerts.some((a) => a.severity === "CRITICAL");
  const hasHigh = allAlerts.some((a) => a.severity === "HIGH");
  const overallHealth: ModuleHealth = hasCrit ? "critical" : hasHigh ? "warning" : "healthy";

  // Top-3 from highest-impact actions
  const ranked = [...allAlerts].sort((a, b) => a.severity.localeCompare(b.severity)).slice(0, 3);
  const top3: TopAction[] = ranked.map((a) => ({
    action: a.suggestedActions?.[0]?.action || "REVIEW",
    impact: a.severity === "CRITICAL" ? 70 : a.severity === "HIGH" ? 50 : 30,
    effort: "medium",
    desc: a.insight,
    context: a.metric,
    severity: a.severity,
    module: a.module as any,
  }));

  const summary =
    `🎯 ИГРОКИ: ${st.players ?? 0} (новых 24ч: ${st.newPlayers24h ?? 0})\n` +
    `⚔️ БОЕВ 24ч: ${battles24Value(st) ?? 0} · Средний рейтинг: ${st.avgRating ?? "—"} · Топ-ранг: ${st.topRank ?? 0}\n` +
    `📦 КОНТЕНТ: живых сценариев ${st.scenarios?.live ?? 0}/${st.scenarios?.total ?? 0} · дней с последнего: ${st.daysSinceLastScenario ?? 99}\n` +
    `🛡 БЕЗОПАСНОСТЬ: банов ${st.bans ?? 0}`;

  return {
    timestamp: data.generatedAt || new Date().toISOString(),
    overallHealth,
    stats: {
      totalAlerts: allAlerts.length,
      criticalAlerts: allAlerts.filter((a) => a.severity === "CRITICAL").length,
      highAlerts: allAlerts.filter((a) => a.severity === "HIGH").length,
      insights: 0,
      recommendations: top3.length,
    },
    executiveSummary: summary,
    top3Actions: top3,
    modules: {
      retention: { health: commAlerts.some((a) => a.severity !== "CRITICAL") ? "warning" : "healthy", alerts: commAlerts, insights: [], summary: `Игроков: ${st.players ?? 0} · Новых 24ч: ${st.newPlayers24h ?? 0}` },
      economy: { health: econ.healthy === false && econIssues.some((i) => i.severity === "CRITICAL") ? "critical" : econIssues.length ? "warning" : "healthy", alerts: econIssues, insights: [], summary: `Burn ratio: ${Math.round((econ.burnRatio || 0) * 100)}%` },
      fairness: { health: secAlerts.length ? "warning" : "healthy", alerts: secAlerts, insights: [], summary: security.status || "Безопасность в норме." },
      liveops: { health: contentAlerts.length ? "warning" : "healthy", alerts: contentAlerts, insights: [], summary: content.recommendation || "Контент-пайплайн." },
      market: { health: "healthy", alerts: [], insights: [{ module: "market", sentiment: "neutral", insight: "Данные рынка включаются с токен-фазой." }], summary: "Market Observer — с запуском $SIG." },
    },
  };
}

function battles24Value(st: any): number {
  return st.battles24h ?? 0;
}
