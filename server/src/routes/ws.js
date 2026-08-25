// ============================================================
// WEBSOCKET LAYER — Real-time Duels, Tournament Live Updates
// Socket.io based. Scalable with Redis pub/sub in production.
//
// NOTE: this file must be loaded after `await app.ready()` in
// index.js — it attaches to app.server, which only exists then.
// ============================================================
import { broker } from "../lib/broker.js";

// In-memory lobby state (Redis pub/sub in production)
const lobbies = new Map();
const activeConnections = new Map();
const duelQueue = [];

export async function wsRoutes(app) {
  try {
    const { Server } = await import("socket.io");
    const httpServer = app.server;
    const io = new Server(httpServer, {
      cors: { origin: "*", methods: ["GET", "POST"] },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    const broadcast = (event, data) => io.emit(event, data);

    // ── MATCHMAKING (fixed 2026-08-16: was calling the non-existent
    // io.to(...).socketsJoin() on every duel and leaving players in a
    // room they never joined) ──
    const tryMatch = () => {
      while (duelQueue.length >= 2) {
        const p1 = duelQueue.shift();
        const p2 = duelQueue.shift();
        const s1 = activeConnections.get(p1.socketId)?.socket;
        const s2 = activeConnections.get(p2.socketId)?.socket;
        if (!s1 || !s2) continue; // one already disconnected
        const roomId = `duel_${p1.socketId}_${p2.socketId}_${Date.now()}`;
        s1.join(roomId);
        s2.join(roomId);
        io.to(roomId).emit("duel:matched", {
          roomId,
          opponent1: p1.playerId,
          opponent2: p2.playerId,
          mode: p1.mode,
        });
      }
      broadcast("duel:queue_update", { waiting: duelQueue.length });
    };

    io.on("connection", (socket) => {
      const playerId = socket.handshake.query.playerId || `anon_${socket.id.slice(0, 6)}`;
      const conn = { playerId, socket, connectedAt: Date.now(), currentBattle: null, status: "online", lastActivity: Date.now() };
      activeConnections.set(socket.id, conn);
      console.log(`🔌 WS: ${playerId} connected (total: ${activeConnections.size})`);

      // ── MATCHMAKING ──
      socket.on("duel:queue", (data) => {
        // Guard: already queued? (client double-tap)
        const existing = duelQueue.findIndex((p) => p.socketId === socket.id);
        if (existing !== -1) duelQueue.splice(existing, 1);
        const { rank, mode = "ghost", stake = 0 } = data || {};
        duelQueue.push({ socketId: socket.id, playerId, rank, mode, stake, queuedAt: Date.now() });
        socket.emit("duel:queued", { position: duelQueue.length, estimatedWait: duelQueue.length * 15 });
        tryMatch();
      });

      socket.on("duel:cancel", () => {
        const idx = duelQueue.findIndex((p) => p.socketId === socket.id);
        if (idx !== -1) { duelQueue.splice(idx, 1); socket.emit("duel:cancelled", {}); broadcast("duel:queue_update", { waiting: duelQueue.length }); }
      });

      // ── BATTLE ROOM ──
      socket.on("battle:join", (data) => {
        const { battleId, role } = data || {};
        if (!battleId) return;
        socket.join(`battle:${battleId}`);
        conn.currentBattle = battleId;
        socket.emit("battle:joined", { battleId, role });
        socket.to(`battle:${battleId}`).emit("battle:opponent_joined", { playerId });
      });

      socket.on("battle:action", (data) => {
        const { battleId, action, payload } = data || {};
        if (!battleId) return;
        socket.to(`battle:${battleId}`).emit("battle:opponent_action", { playerId, action, payload, timestamp: Date.now() });
      });

      socket.on("battle:leave", (data) => {
        const { battleId } = data || {};
        if (battleId) {
          socket.leave(`battle:${battleId}`);
          socket.to(`battle:${battleId}`).emit("battle:opponent_left", { playerId });
        }
        conn.currentBattle = null;
      });

      // ── TOURNAMENT LIVE ──
      socket.on("tournament:subscribe", (data) => {
        const { tournamentId } = data || {};
        if (!tournamentId) return;
        socket.join(`tournament:${tournamentId}`);
        const standings = getTournamentStandings(tournamentId);
        socket.emit("tournament:standings", standings);
      });

      // ── SPECTATOR MODE ──
      socket.on("spectate:join", (data) => {
        const { battleId } = data || {};
        if (!battleId) return;
        socket.join(`spectate:${battleId}`);
        socket.emit("spectate:joined", { battleId, viewers: io.sockets.adapter.rooms.get(`spectate:${battleId}`)?.size || 1 });
      });

      // ── GLOBAL CHAT ──
      socket.on("chat:message", (data) => {
        const { message, channel = "global" } = data || {};
        if (typeof message !== "string" || !message.trim() || message.length > 500) return;
        const msg = { playerId, message: message.slice(0, 500), channel, timestamp: Date.now() };
        if (channel === "global") io.emit("chat:message", msg);
        else io.to(channel).emit("chat:message", msg);
      });

      // ── PRESENCE ──
      socket.on("presence:update", (data) => {
        conn.status = data?.status || "online";
        conn.lastActivity = Date.now();
      });

      // ── DISCONNECT ──
      socket.on("disconnect", () => {
        const idx = duelQueue.findIndex((p) => p.socketId === socket.id);
        if (idx !== -1) {
          duelQueue.splice(idx, 1);
          broadcast("duel:queue_update", { waiting: duelQueue.length });
          tryMatch(); // orphan re-matches with next in line
        }
        if (conn.currentBattle) {
          const room = `battle:${conn.currentBattle}`;
          socket.to(room).emit("battle:opponent_disconnected", { playerId });
          socket.leave(room);
        }
        activeConnections.delete(socket.id);
        broadcast("presence:count", { online: activeConnections.size });
        console.log(`🔌 WS: ${playerId} disconnected (total: ${activeConnections.size})`);
      });

      broadcast("presence:count", { online: activeConnections.size });
    });

    // Periodic presence broadcast
    const presenceTimer = setInterval(() => {
      broadcast("presence:refresh", {
        online: activeConnections.size,
        dueling: [...activeConnections.values()].filter((c) => c.currentBattle).length,
        queued: duelQueue.length,
        timestamp: Date.now(),
      });
    }, 30000);
    presenceTimer.unref?.();

    // Broker battle results → live announcement
    broker.subscribe("sa.battle.events", (event) => {
      if (event.type === "result") io.emit("battle:result_announcement", event);
    });

    console.log(`  🔌 WebSocket server ready (0 connected)`);
    return io;
  } catch (e) {
    console.warn("  ⚠ socket.io not installed — WebSocket disabled");
    return null;
  }
}

// ── HELPERS ──
function getTournamentStandings(tournamentId) {
  return { tournamentId, standings: [], totalParticipants: 0, prizePool: "0 $SIG", timeRemaining: "23:59:59" };
}

export { activeConnections, duelQueue };
