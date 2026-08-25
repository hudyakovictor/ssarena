// ============================================================
// PLAYER ROUTES — Profile, Skills, Error Journal, Stats
// ============================================================
import { getUser, getUsersDB } from "../db/index.js";
import { rankProgress } from "../content/ranks.js";

export async function playerRoutes(app) {
  // GET player profile
  app.get("/:playerId", async (req, reply) => {
    const player = getUser(req.params.playerId);
    if (!player) return reply.code(404).send({ error: "Player not found" });

    const db = getUsersDB();
    const skills = db.prepare("SELECT * FROM player_skills WHERE player_id = ?").all(player.id);
    const cards = db.prepare("SELECT * FROM player_cards WHERE player_id = ?").all(player.id);
    const errors = db.prepare("SELECT * FROM player_errors WHERE player_id = ? ORDER BY count DESC").all(player.id);
    const entities = db.prepare("SELECT * FROM player_entities WHERE player_id = ?").all(player.id);
    const badges = db.prepare("SELECT * FROM player_badges WHERE player_id = ?").all(player.id);
    const recentBattle = db.prepare(
      "SELECT * FROM battle_logs WHERE player_id = ? ORDER BY created_at DESC LIMIT 1"
    ).get(player.id);

    return { ...player, rankProgress: rankProgress(player.xp), skills, cards, errors, entities, badges, recentBattle };
  });

  // GET error journal
  app.get("/:playerId/errors", async (req) => {
    return getUsersDB().prepare(
      "SELECT * FROM player_errors WHERE player_id = ? ORDER BY count DESC"
    ).all(req.params.playerId);
  });

  // GET battle history
  app.get("/:playerId/battles", async (req) => {
    const limit = parseInt(req.query.limit || "20");
    return getUsersDB().prepare(
      "SELECT * FROM battle_logs WHERE player_id = ? ORDER BY created_at DESC LIMIT ?"
    ).all(req.params.playerId, limit);
  });

  // GET entity encounters
  app.get("/:playerId/entities", async (req) => {
    return getUsersDB().prepare(
      "SELECT * FROM player_entities WHERE player_id = ? ORDER BY encounters DESC"
    ).all(req.params.playerId);
  });

  // GET skill progress
  app.get("/:playerId/skills", async (req) => {
    return getUsersDB().prepare(
      "SELECT * FROM player_skills WHERE player_id = ? ORDER BY value DESC"
    ).all(req.params.playerId);
  });

  // UPDATE display name
  app.patch("/:playerId/name", async (req, reply) => {
    const { displayName } = req.body || {};
    if (!displayName || displayName.length < 2) return reply.code(400).send({ error: "Name too short" });
    if (displayName.length > 24) return reply.code(400).send({ error: "Name too long (max 24)" });

    getUsersDB().prepare("UPDATE players SET display_name = ?, updated_at = datetime('now') WHERE id = ?")
      .run(displayName, req.params.playerId);
    return { displayName };
  });

  // GET share card data
  app.get("/:playerId/share-card", async (req, reply) => {
    const player = getUser(req.params.playerId);
    if (!player) return reply.code(404).send({ error: "Player not found" });

    const recentWins = getUsersDB().prepare(
      "SELECT entity_id FROM battle_logs WHERE player_id = ? AND result = 'win' ORDER BY created_at DESC LIMIT 3"
    ).all(player.id);

    return {
      playerName: player.display_name,
      rank: player.rank_index,
      rating: player.rating,
      winRate: Math.round(player.win_rate * 100),
      recentEntities: recentWins.map((w) => w.entity_id),
      sharePhrases: [
        "Я победил FOMO Wraith. Discipline > Impulse.",
        `${player.display_name} не купил вершину. Уже прогресс.`,
        `Мой Anti-FOMO Score: ${player.discipline_shield}/100. Signal Arena.`,
        "Иди потапай своего хомячка. А я пока почитаю контракт.",
      ],
    };
  });
}
