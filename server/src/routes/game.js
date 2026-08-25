// ============================================================
// GAME ROUTES — PreBattle, Battle Start, Battle Action, Result
// All battle state in Redis buffer, DB write only on Result
// ============================================================
import { v4 as uuid } from "uuid";
import { getContentDB, getRandomScenario, getScenario, recordBattle, getUser, getUsersDB } from "../db/index.js";
import { applyBattleProgress } from "../lib/progress.js";
import { buildContentPack } from "../lib/content-pack.js";
import { broker } from "../lib/broker.js";
import { redis, getSession, setSession, deleteSession } from "../lib/redis.js";

// ── BATTLE SESSION BUFFER (in-memory fallback if Redis disabled) ──
const sessionBuffer = new Map();

function getBattleSession(sessionId) {
  if (redis?.isReady) return getSession(`battle:${sessionId}`);
  return sessionBuffer.get(sessionId);
}
function setBattleSession(sessionId, data, ttl = 1800) {
  if (redis?.isReady) return setSession(`battle:${sessionId}`, data, ttl);
  sessionBuffer.set(sessionId, { ...data, _expiresAt: Date.now() + ttl * 1000 });
}
function delBattleSession(sessionId) {
  if (redis?.isReady) return deleteSession(`battle:${sessionId}`);
  sessionBuffer.delete(sessionId);
}

// Only registered players (from /auth) take meta progress; demo/unknown ids
// still get a battle log but no XP/cards.
function isRegisteredPlayer(playerId) {
  try {
    return !!getUsersDB().prepare("SELECT 1 FROM players WHERE id = ?").get(playerId);
  } catch {
    return false;
  }
}

export async function gameRoutes(app) {
  // ── GET PUBLIC CONTENT PACK (block 3.2) ──
  // Clients pull the signed snapshot (entities, cards, approved scenarios)
  // and verify the HMAC signature before applying it. The signature proves
  // integrity (tamper detection), not secrecy — grading is server-side.
  app.get("/pack", async () => {
    const { pack, signature, version, items } = buildContentPack();
    return { pack, signature, version, items };
  });

  // ── GET DAILY SCENARIO ──
  app.get("/daily", async (req) => {
    const playerId = req.query.playerId || "demo";
    const player = getUser(playerId) || { rank_index: 0 };
    const scenario = getRandomScenario(player.rank_index);
    return scenario || { id: "daily-default", title: "The Funding Trap", briefing: "Daily scenario loading...", asset: "ETH/USDT" };
  });

  // ── PREBATTLE: Start new battle session ──
  app.post("/prebattle", async (req, reply) => {
    const { playerId, scenarioId, mode = "daily" } = req.body || {};
    if (!playerId) return reply.code(400).send({ error: "playerId required" });

    const scenario = getScenario(scenarioId) || getRandomScenario(0);
    if (!scenario) return reply.code(404).send({ error: "No scenario found" });

    const player = getUser(playerId) || { rank_index: 0, attention: 7, max_attention: 8, discipline_shield: 50 };

    const session = {
      sessionId: uuid(),
      playerId,
      scenarioId: scenario.id,
      entityId: scenario.entity_id,
      mode,
      round: 0,
      maxRounds: scenario.rounds || 2,
      timeLimit: scenario.time_limit || 45,
      attentionLeft: player.attention || player.max_attention,
      openedSources: ["chart"],
      selectedCards: [],
      ghostActions: [],
      startedAt: Date.now(),
      twistAvailable: scenario.rounds >= 2,
    };

    setBattleSession(session.sessionId, session);

    // Emit event to broker
    broker.emit("sa.battle.events", {
      type: "prebattle", playerId, scenarioId: scenario.id, entityId: scenario.entity_id,
      mode, level: scenario.level, timestamp: new Date().toISOString(),
    });

    return { sessionId: session.sessionId, scenario, player: { attention: player.attention, maxAttention: player.max_attention, disciplineShield: player.discipline_shield } };
  });

  // ── BATTLE ACTION: Toggle data source ──
  app.post("/battle/toggle-source", async (req, reply) => {
    const { sessionId, sourceId } = req.body || {};
    const session = getBattleSession(sessionId);
    if (!session) return reply.code(404).send({ error: "Session expired or not found" });

    // Toggle source
    const sources = new Set(session.openedSources || ["chart"]);
    const srcCost = 1; // TODO: get from scenario data_sources

    if (sources.has(sourceId)) {
      sources.delete(sourceId);
      session.attentionLeft = Math.min(session.attentionLeft + srcCost, 8);
    } else if (session.attentionLeft >= srcCost) {
      sources.add(sourceId);
      session.attentionLeft -= srcCost;
    }
    session.openedSources = [...sources];
    setBattleSession(sessionId, session);

    broker.emit("sa.player.actions", { type: "toggle_source", playerId: session.playerId, sourceId, opened: sources.has(sourceId) });

    return { attentionLeft: session.attentionLeft, openedSources: [...sources] };
  });

  // ── BATTLE: Submit decision ──
  app.post("/battle/decide", async (req, reply) => {
    const { sessionId, optionId } = req.body || {};
    const session = getBattleSession(sessionId);
    if (!session) return reply.code(404).send({ error: "Session expired" });

    // Get scenario option
    const option = getContentDB().prepare("SELECT * FROM scenario_options WHERE id = ? OR (scenario_id = ? AND opt_index = ?)")
      .get(optionId, session.scenarioId, optionId);
    if (!option) return reply.code(404).send({ error: "Option not found" });

    const timeSpent = Math.round((Date.now() - session.startedAt) / 1000);
    const isCorrect = option.correct === 1;
    const score = isCorrect ? 50 + Math.round((session.timeLimit - timeSpent) / session.timeLimit * 50) : Math.round(Math.random() * 30);
    const result = isCorrect ? "win" : "loss";
    const skillDeltas = JSON.parse(option.skill_deltas || "{}");
    const errorsMade = isCorrect ? [] : JSON.parse(option.errors_triggered || "[]");

    // Record in DB
    const battleId = uuid();
    const entityRow = getContentDB().prepare("SELECT discipline FROM market_entities WHERE id = ?").get(session.entityId);
    recordBattle({
      id: battleId, player_id: session.playerId, scenario_id: session.scenarioId,
      entity_id: session.entityId, entity_level: session.entityLevel || 1,
      mode: session.mode, rounds: session.round + 1, result,
      score, time_spent: timeSpent, ap_used: 3,
      options_chosen: [optionId], sources_opened: session.openedSources,
      errors_made: errorsMade, skill_deltas: skillDeltas,
      twist_triggered: session.twistTriggered ? 1 : 0,
    });

    // Meta progress (block 2): XP/rank/streak, skills, error journal,
    // entity encounters, card drops — single transaction.
    let meta = null;
    if (isRegisteredPlayer(session.playerId)) {
      meta = applyBattleProgress(getUsersDB(), {
        id: battleId, player_id: session.playerId, scenario_id: session.scenarioId,
        entity_id: session.entityId, result, score,
        errors_made: errorsMade, skill_deltas: skillDeltas,
      }, entityRow ? entityRow.discipline : null);
    }

    // Emit to broker
    broker.emit("sa.battle.events", {
      type: "result", playerId: session.playerId, battleId,
      result, score, timeSpent,
    });

    // Clean up session
    delBattleSession(sessionId);

    return {
      battleId,
      correct: isCorrect,
      layer1: option.layer1,
      layer2: option.layer2,
      layer3: option.layer3,
      score,
      timeSpent,
      skillDeltas,
      meta,
    };
  });

  // ── TWIST EVENT ──
  app.post("/battle/twist", async (req, reply) => {
    const { sessionId } = req.body || {};
    const session = getBattleSession(sessionId);
    if (!session || session.twistTriggered || !session.twistAvailable)
      return reply.code(400).send({ error: "Twist not available" });

    const twists = [
      { id: "tw1", text: "⚠ TWIST: Пробой оказался ложным. Объём упал.", icon: "👻" },
      { id: "tw2", text: "⚠ TWIST: Breaking News! Крупная биржа — делистинг.", icon: "📰" },
      { id: "tw3", text: "⚠ TWIST: Волатильность удвоилась.", icon: "🌊" },
      { id: "tw4", text: "⚠ TWIST: Whale вошёл. On-chain: крупный ордер.", icon: "🐋" },
      { id: "tw5", text: "⚠ TWIST: Fake news! Заголовок — фейк.", icon: "🤥" },
    ];
    const twist = twists[Math.floor(Math.random() * twists.length)];

    session.twistTriggered = true;
    session.twistId = twist.id;
    session.timeLimit += 10;
    setBattleSession(sessionId, session);

    broker.emit("sa.battle.events", { type: "twist", playerId: session.playerId, twistId: twist.id });

    return { twistId: twist.id, text: twist.text, icon: twist.icon, extraTime: 10 };
  });

  // ── GHOST DUEL — Get opponent ghost ──
  app.get("/ghost/:playerId", async (req) => {
    // Fetch a saved ghost from USERS DB (battle_logs live there)
    let ghostLogs = [];
    try {
      ghostLogs = getUsersDB().prepare(
        "SELECT * FROM battle_logs WHERE player_id != ? AND result = 'win' ORDER BY score DESC LIMIT 1"
      ).all(req.params.playerId);
    } catch {
      ghostLogs = [];
    }
    if (!ghostLogs.length) return { playerName: "0xSentinel", rank: 12, score: 847, actions: [] };
    const ghost = ghostLogs[0];
    return {
      playerName: `Ghost_${ghost.player_id.slice(0, 6)}`,
      rank: ghost.entity_level,
      score: ghost.score,
      actions: JSON.parse(ghost.options_chosen || "[]").map((opt, i) => ({
        round: i + 1,
        optionId: opt,
        sourcesOpened: JSON.parse(ghost.sources_opened || "[]"),
      })),
    };
  });
}
