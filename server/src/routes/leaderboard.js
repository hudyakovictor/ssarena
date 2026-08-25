// ============================================================
// LEADERBOARD ROUTES — Global ranking, tournament results
// ============================================================
import { getUsersDB } from "../db/index.js";

export async function leaderboardRoutes(app) {
  // GET global leaderboard
  app.get("/global", async (req) => {
    const limit = Math.min(parseInt(req.query.limit || "50"), 100);
    const offset = parseInt(req.query.offset || "0");
    const players = getUsersDB().prepare(
      "SELECT id, display_name, rank_index, rating, win_rate, streak, total_battles, total_wins FROM players ORDER BY rating DESC LIMIT ? OFFSET ?"
    ).all(limit, offset);
    return players.map((p, i) => ({ rank: offset + i + 1, ...p, winRate: Math.round(p.win_rate * 100) }));
  });

  // GET tournament-specific leaderboard
  app.get("/tournament/:tournamentId", async (req) => {
    // TODO: Tournament-specific scoring
    return getUsersDB().prepare(
      "SELECT id, display_name, rating FROM players ORDER BY rating DESC LIMIT 20"
    ).all();
  });

  // GET player rank position
  app.get("/position/:playerId", async (req, reply) => {
    const player = getUsersDB().prepare("SELECT rating FROM players WHERE id = ?").get(req.params.playerId);
    if (!player) return reply.code(404).send({ error: "Player not found" });

    const betterCount = getUsersDB().prepare(
      "SELECT COUNT(*) as count FROM players WHERE rating > ?"
    ).get(player.rating);

    return {
      playerId: req.params.playerId,
      rank: betterCount.count + 1,
      rating: player.rating,
    };
  });

  // GET discipline-specific rankings
  app.get("/discipline/:discipline", async (req) => {
    const { discipline } = req.params;
    // Get players sorted by specific skill
    return getUsersDB().prepare(`
      SELECT p.id, p.display_name, p.rating, ps.value as skill_value
      FROM players p
      JOIN player_skills ps ON p.id = ps.player_id
      WHERE ps.skill_id LIKE ?
      ORDER BY ps.value DESC
      LIMIT 20
    `).all(`%${discipline}%`);
  });
}
