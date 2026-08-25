// ============================================================
// SIGNAL ARENA — BATTLE API ROUTES
// Real game loop endpoints
// ============================================================
import { battleEngine } from '../engine/battle-engine.ts';

export async function battleRoutes(app) {
  
  // ── CREATE BATTLE ──
  app.post('/api/battle/create', async (req, reply) => {
    try {
      const { playerId = 'anonymous', mode = 'training', rankIndex = 0 } = req.body || {};
      const battle = battleEngine.createBattle(playerId, mode, rankIndex);
      
      return {
        battleId: battle.battleId,
        phase: battle.phase,
        scenario: {
          entityId: battle.scenario.entityId,
          entityName: battle.scenario.entityName,
          entityNameRu: battle.scenario.entityNameRu,
          archetype: battle.scenario.archetype,
          discipline: battle.scenario.discipline,
          threatLevel: battle.scenario.threatLevel,
          corruption: battle.scenario.corruption,
          glyph: battle.scenario.glyph,
          level: battle.scenario.level,
          asset: battle.scenario.asset,
          briefing: battle.scenario.briefing,
          timeLimit: battle.scenario.timeLimit,
          apBudget: battle.scenario.apBudget,
          marketCondition: battle.scenario.marketCondition,
          difficultyAxes: battle.scenario.difficultyAxes,
        },
        options: battle.scenario.options.map(o => ({
          id: o.id,
          label: o.label,
          // Don't send correct flag to client!
        })),
        dataSources: Object.entries(battle.scenario.dataSources).map(([id, src]) => ({
          id,
          name: src.name,
          cost: src.cost,
          revealed: false,
          // Don't send fact until opened!
        })),
      };
    } catch (err) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // ── START BATTLE (idle → prebattle) ──
  app.post('/api/battle/:battleId/start', async (req, reply) => {
    try {
      const { battleId } = req.params;
      const state = battleEngine.startBattle(battleId);
      return { battleId: state.battleId, phase: state.phase };
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  // ── GO TO BATTLE (prebattle → battle) ──
  app.post('/api/battle/:battleId/fight', async (req, reply) => {
    try {
      const { battleId } = req.params;
      const state = battleEngine.goToBattle(battleId);
      return { 
        battleId: state.battleId, 
        phase: state.phase,
        timeLeft: state.timeLeft,
        apRemaining: state.apRemaining,
      };
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  // ── OPEN DATA SOURCE ──
  app.post('/api/battle/:battleId/source', async (req, reply) => {
    try {
      const { battleId } = req.params;
      const { sourceId } = req.body || {};
      
      if (!sourceId) {
        reply.code(400);
        return { error: 'sourceId required' };
      }

      const { state, fact } = battleEngine.openSource(battleId, sourceId);
      
      return {
        battleId: state.battleId,
        apRemaining: state.apRemaining,
        openedSources: state.openedSources,
        fact, // null if not enough AP
        sourceId,
      };
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  // ── SUBMIT DECISION ──
  app.post('/api/battle/:battleId/decide', async (req, reply) => {
    try {
      const { battleId } = req.params;
      const { optionId } = req.body || {};
      
      if (!optionId) {
        reply.code(400);
        return { error: 'optionId required' };
      }

      const result = battleEngine.submitDecision(battleId, optionId);
      return result;
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  // ── TICK (timer sync) ──
  app.get('/api/battle/:battleId/tick', async (req, reply) => {
    try {
      const { battleId } = req.params;
      const tick = battleEngine.tick(battleId);
      return tick;
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  // ── GET BATTLE STATE ──
  app.get('/api/battle/:battleId', async (req, reply) => {
    try {
      const { battleId } = req.params;
      const state = battleEngine.getBattle(battleId);
      if (!state) {
        reply.code(404);
        return { error: 'Battle not found' };
      }
      return {
        battleId: state.battleId,
        phase: state.phase,
        timeLeft: state.timeLeft,
        apRemaining: state.apRemaining,
        openedSources: state.openedSources,
        resolved: state.resolved,
        result: state.result,
      };
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  // ── GET PLAYER STATS ──
  app.get('/api/player/:playerId/stats', async (req, reply) => {
    try {
      const { playerId } = req.params;
      const stats = battleEngine.getPlayerStats(playerId);
      return stats;
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });

  // ── HEALTH CHECK ──
  app.get('/api/battle/health', async () => {
    return {
      status: 'ok',
      engine: 'BattleEngine v2.0',
      activeBattles: 'N/A',
      timestamp: new Date().toISOString(),
    };
  });
}
