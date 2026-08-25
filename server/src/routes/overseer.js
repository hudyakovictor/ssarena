// ============================================================
// OVERSEER ROUTES (block 3.3) — real-data dashboard
// Feeds the AI Overseer with metrics computed from the live
// databases (players, battle logs, scenario content, bans) so
// the moderator dashboard shows the true state of the game
// instead of a client-supplied mock.
// ============================================================
import { getUsersDB, getContentDB } from "../db/index.js";
import { getBanList } from "../middleware/anti-recon.js";
import { overseer } from "../overseer/ai-overseer.js";

function realState() {
  const u = getUsersDB();
  const c = getContentDB();

  const players = u.prepare("SELECT COUNT(*) n, COALESCE(SUM(total_wins),0) wins, COALESCE(SUM(total_battles),0) battles FROM players").get();
  const new24h = u.prepare("SELECT COUNT(*) n FROM players WHERE created_at >= datetime('now','-1 day')").get().n;
  const battles24h = u.prepare("SELECT COUNT(*) n FROM battle_logs WHERE created_at >= datetime('now','-1 day')").get().n;
  const avgRating = u.prepare("SELECT COALESCE(AVG(rating),0) r FROM players").get().r;
  const streakLoss = u.prepare("SELECT COUNT(*) n FROM players WHERE streak < 0").get().n;
  const topRank = u.prepare("SELECT MAX(rank_index) r FROM players").get().r || 0;

  const scAll = c.prepare("SELECT COUNT(*) n FROM scenarios").get().n;
  const scApproved = c.prepare("SELECT COUNT(*) n FROM scenarios WHERE approved = 1").get().n;
  const scOld = c.prepare("SELECT COUNT(*) n FROM scenarios WHERE created_at < datetime('now','-7 day')").get().n;
  const lastScenario = c.prepare("SELECT created_at ts FROM scenarios ORDER BY created_at DESC LIMIT 1").get();
  let daysSinceScenario = 99;
  if (lastScenario?.ts) {
    daysSinceScenario = Math.max(0, Math.round((Date.now() - new Date(lastScenario.ts + "Z").getTime()) / 86400000));
  }

  const bans = getBanList() || [];
  const errorsTotal = u.prepare("SELECT COALESCE(SUM(count),0) n FROM player_errors").get().n;
  const topError = u.prepare("SELECT error_id id, COUNT(*) n FROM player_errors GROUP BY error_id ORDER BY n DESC LIMIT 1").get();

  return {
    // community
    activePlayers: players.n,
    newPlayers24h: new24h,
    battlesCompleted24h: battles24h,
    avgRating, streakLoss, topRank,
    // content
    daysSinceLastScenario: daysSinceScenario,
    scenariosLive: scApproved,
    scenariosTotal: scAll,
    scenariosNeedingUpdate: scOld,
    // security
    bannedIPs: bans.length,
    // economy demo values (no real token yet — placeholder for the token phase)
    dailyBurns: 0,
    dailyEmission: 0,
    premiumPlayers: 0,
    top10HolderPercent: 0,
    d7Retention: 0,
    tokenPrice: 0,
    d1Retention: 0,
    _debug: { topErrorId: topError?.id, errorsTotal, scAll, scApproved },
  };
}

export async function overseerLiveRoutes(app) {
  // GET overview dashboard (real data + latest scan summary)
  app.get("/dashboard", async (req, reply) => {
    try {
      const state = realState();
      const scan = await overseer.scan(state);
      return {
        source: "live-db",
        generatedAt: new Date().toISOString(),
        state: {
          players: state.activePlayers,
          newPlayers24h: state.newPlayers24h,
          battles24h: state.battlesCompleted24h,
          avgRating: Math.round(state.avgRating),
          topRank: state.topRank,
          scenarios: { live: state.scenariosLive, total: state.scenariosTotal, stale: state.scenariosNeedingUpdate },
          daysSinceLastScenario: state.daysSinceLastScenario,
          bans: state.bannedIPs,
          topError: state._debug.topErrorId,
        },
        sections: scan.sections,
        autonomousActions: scan.autonomousActions,
        actionLog: overseer.actionLog.slice(-25),
      };
    } catch (e) {
      return reply.code(500).send({ error: e.message });
    }
  });

  // POST on-demand full scan (same live feed)
  app.post("/scan", async () => {
    const state = realState();
    const report = await overseer.scan(state);
    return report;
  });
}
