// ============================================================
// META PROGRESS — apply a battle result across the players DB
// (XP/rank/streak, skills, error journal, entity encounters,
//  card unlocks). One transaction, idempotent per battle.
// Block 2: 2.1 score->XP, 2.2 ranks, 2.3 error->lesson, 2.5 cards.
// ============================================================
import { rankForXp, rankProgress, XP_RULES } from "../content/ranks.js";
import { getContentDB } from "../db/index.js";
import { onRankUp, onFirstBattle } from "./referral.js";

// error_id -> academy lesson mapping (block 2.3).
// Falls back to a generic lesson when an id isn't in the map.
export const ERROR_LESSON = {
  fomo_entry:           { lesson: "psy_fomo",    titleRu: "FOMO-вход на пику" },
  overleverage:         { lesson: "risk_sizing", titleRu: "Полный депозит в одну сделку" },
  no_stop:              { lesson: "risk_stops",  titleRu: "Сделка без стопа" },
  ignoring_funding:     { lesson: "deriv_funding", titleRu: "Игнорирование funding" },
  stop_hunt:            { lesson: "risk_stops",  titleRu: "Стоп на видимом уровне" },
  leverage_overreach:   { lesson: "risk_sizing", titleRu: "Леверидж против тебя" },
  liquidation_cascade:  { lesson: "deriv_liq",   titleRu: "Каскад ликвидаций" },
  news_chasing:         { lesson: "fund_news",   titleRu: "Гонка за заголовком" },
  fake_breakout:        { lesson: "ta_breakout", titleRu: "Ложный пробой" },
  thin_liquidity:       { lesson: "deriv_liq",   titleRu: "Тонкая ликвидность" },
  overtrading:          { lesson: "psy_general", titleRu: "Перетрейд" },
  no_position_size:     { lesson: "risk_sizing", titleRu: "Размер позиции" },
  rug_entry:            { lesson: "sec_rug",     titleRu: "Риск ругпула" },
  honeypot:             { lesson: "sec_honeypot", titleRu: "Ханепот-токен" },
  generic:              { lesson: "psy_general", titleRu: "Урок из ошибки" },
};

const GENERIC_LESSON = ERROR_LESSON.generic;

// card drop table by discipline (block 2.5): win against an entity of
// this discipline may grant a published skill card (deterministic every
// 3rd win per entity, so progress is guaranteed but not inflated).
// IDs must exist in content.db skill_cards (see seed.js).
const CARD_BY_DISCIPLINE = {
  ta: "trend-check",
  derivatives: "stop-discipline",
  fundamental: "macro-pulse",
  psychology: "anti-fomo",
  security: "contract-shield",
};

/**
 * Apply a completed battle to all player tables (single transaction).
 * db       — better-sqlite3 users DB handle
 * battle   — { id, player_id, scenario_id, entity_id, entity_level, mode,
 *              rounds, result, score, errors_made (array),
 *              skill_deltas (object) }
 * entityDiscipline — discipline of the fought entity (cards)
 * @returns summary used by /api/game/battle/decide response
 */
export function applyBattleProgress(db, battle, entityDiscipline) {
  return db.transaction(() => {
    const pid = battle.player_id;
    const player = db.prepare("SELECT * FROM players WHERE id = ?").get(pid);
    if (!player) throw new Error("player not found: " + pid);

    const result = battle.result; // win | loss | partial
    let streak = player.streak;
    if (result === "win") {
      streak += 1;
    } else {
      streak = 0;
    }

    // ── XP (2.1) ──
    const streakBonus = Math.min(streak, 5) * XP_RULES.streakBonus;
    let xpGain;
    if (result === "win") {
      xpGain = Math.round(battle.score * XP_RULES.winBase * (1 + streakBonus));
    } else if (result === "partial") {
      xpGain = XP_RULES.partialBonus;
    } else {
      xpGain = XP_RULES.lossConsolation;
    }

    const newXp = player.xp + xpGain;
    const newRank = rankForXp(newXp);
    const rankUp = newRank > player.rank_index;
    const rp = rankProgress(newXp);

    const totalW = player.total_wins + (result === "win" ? 1 : 0);
    const totalB = player.total_battles + 1;
    const winRate = totalB > 0 ? totalW / totalB : 0;
    const longest = Math.max(player.longest_streak, streak);

    db.prepare(`UPDATE players SET xp = ?, rank_index = ?, streak = ?, longest_streak = ?,
      total_battles = ?, total_wins = ?, win_rate = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(newXp, newRank, streak, longest, totalB, totalW, winRate, pid);

    // ── Skills (2.4/2.5 radar) ──
    const deltas = battle.skill_deltas || {};
    const appliedSkills = [];
    for (const [skillId, delta] of Object.entries(deltas)) {
      const d = Math.round(Number(delta) || 0);
      if (!d) continue;
      // pre-clamp: INSERT path (new row) would otherwise store the raw delta
      // (e.g. -2), only the UPDATE branch clamps.
      const baseRow = db.prepare("SELECT value FROM player_skills WHERE player_id = ? AND skill_id = ?").get(pid, skillId);
      const nextVal = Math.max(0, Math.min(100, (baseRow ? baseRow.value : 0) + d));
      if (baseRow) {
        db.prepare("UPDATE player_skills SET value = ? WHERE player_id = ? AND skill_id = ?").run(nextVal, pid, skillId);
      } else {
        db.prepare("INSERT INTO player_skills (player_id, skill_id, skill_name, value) VALUES (?, ?, ?, ?)").run(pid, skillId, skillId, nextVal);
      }
      appliedSkills.push({ id: skillId, delta: d, value: nextVal });
    }

    // ── Error journal + lesson link (2.3) ──
    const errors = Array.isArray(battle.errors_made) ? battle.errors_made : [];
    const errorLessons = [];
    for (const errId of errors) {
      const known = ERROR_LESSON[errId] || GENERIC_LESSON;
      db.prepare(`INSERT INTO player_errors (player_id, error_id, error_title, count, status, domain, last_seen)
        VALUES (?, ?, ?, 1, 'active', 'battle', datetime('now'))
        ON CONFLICT(player_id, error_id) DO UPDATE SET
          count = count + 1, status = 'active', last_seen = datetime('now')`)
        .run(pid, errId, known.titleRu);
      errorLessons.push({ error: errId, lesson: known.lesson, titleRu: known.titleRu });
    }

    // ── Entity encounters (Bestiary server-side truth) ──
    // First encounter: status starts at 'encountered', a first-fight win
    // should already be 'defeated'. Subsequent fights keep the max status.
    const prior = db.prepare("SELECT status, wins FROM player_entities WHERE player_id = ? AND entity_id = ?").get(pid, battle.entity_id);
    let wCount = prior ? prior.wins : 0;
    if (result === "win") wCount += 1;
    let entityStatus = prior ? prior.status : "encountered";
    if (result === "win" && entityStatus !== "mastered") entityStatus = "defeated";
    db.prepare(`INSERT INTO player_entities (player_id, entity_id, status, encounters, wins, last_encounter)
      VALUES (?, ?, ?, 1, ?, datetime('now'))
      ON CONFLICT(player_id, entity_id) DO UPDATE SET
        status = excluded.status,
        encounters = encounters + 1,
        wins = wins + CASE WHEN ? = 'win' THEN 1 ELSE 0 END,
        last_encounter = datetime('now')`)
      .run(pid, battle.entity_id, entityStatus, wCount, result);

    // mastered = 3 wins vs this entity
    if (wCount >= 3) {
      db.prepare("UPDATE player_entities SET status = 'mastered' WHERE player_id = ? AND entity_id = ?").run(pid, battle.entity_id);
      entityStatus = "mastered";
    }

    // ── Card drop (2.5): every 3rd win vs this entity discloses one card ──
    let cardDropped = null;
    if (result === "win" && wCount > 0 && wCount % 3 === 0 && entityDiscipline) {
      const cardId = CARD_BY_DISCIPLINE[entityDiscipline];
      if (cardId) {
        // skill_cards lives in the CONTENT db (not the users db)
        const card = getContentDB().prepare("SELECT id FROM skill_cards WHERE id = ? AND published = 1").get(cardId)
          || null;
        if (card) {
          db.prepare(`INSERT INTO player_cards (player_id, card_id, mastery)
            VALUES (?, ?, 1)
            ON CONFLICT(player_id, card_id) DO UPDATE SET mastery = mastery + 1`)
            .run(pid, cardId);
          cardDropped = cardId;
        }
      }
    }

    // ── Rank-up badge ──
    if (rankUp) {
      db.prepare("INSERT OR IGNORE INTO player_badges (player_id, badge_id, earned_at) VALUES (?, ?, datetime('now'))")
        .run(pid, "rank_" + newRank);
    }

    // ── Block 4.1: referral hooks (internally guarded, never throw) ──
    // Total pre-update: player.total_battles === 0 → this is the first
    // real battle of a (possibly referred) player.
    if (player.total_battles === 0) onFirstBattle(db, pid);
    if (rankUp) onRankUp(db, pid, newRank);

    return {
      xpGain, xp: newXp,
      rankIndex: newRank, rankUp,
      rankNameRu: rp.name, rankNameEn: rp.nameEn,
      rankTier: rp.tier, rankPct: rp.pct, xpToNext: rp.xpToNext,
      streak, longestStreak: longest,
      totalBattles: totalB, totalWins: totalW,
      winRatePercent: Math.round(winRate * 100),
      appliedSkills,
      errorLessons,
      entityStatus,
      cardDropped,
    };
  })();
}